#!/usr/bin/env python3
"""
Export trained PyTorch model to TensorFlow.js format for browser deployment.

Pipeline: PyTorch → ONNX → TensorFlow SavedModel → TF.js Graph Model

Usage:
    python export_tfjs.py \
        --checkpoint models/run-1/best.pth \
        --config config.yaml \
        --output web_model/
"""

import os
import sys
import yaml
import argparse
import json
from pathlib import Path

import torch
import torch.nn as nn
import numpy as np

# ─── Load model architecture (same as train.py) ───

sys.path.insert(0, str(Path(__file__).parent))
from train import build_model, load_config

def export_onnx(model, config, output_path):
    """Export PyTorch model to ONNX."""
    model.eval()
    size = config['model']['input_size']
    dummy_input = torch.randn(1, 3, size, size)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print(f"[Export] ONNX model saved to {output_path}")

def export_tfjs(onnx_path, output_dir):
    """Convert ONNX to TF.js using onnx-tf + tensorflowjs_converter."""
    import onnx
    from onnx_tf.backend import prepare

    # Load ONNX
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)

    # Convert to TensorFlow SavedModel
    tf_rep = prepare(onnx_model)
    saved_model_dir = str(Path(output_dir) / 'saved_model')
    tf_rep.export_graph(saved_model_dir)
    print(f"[Export] TensorFlow SavedModel saved to {saved_model_dir}")

    # Convert to TF.js
    import subprocess
    tfjs_dir = str(Path(output_dir) / 'tfjs')

    cmd = [
        'tensorflowjs_converter',
        '--input_format=tf_saved_model',
        '--output_format=tfjs_graph_model',
        '--signature_name=serving_default',
        saved_model_dir,
        tfjs_dir
    ]

    print(f"[Export] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[Error] TF.js conversion failed:
{result.stderr}")
        sys.exit(1)

    print(f"[Export] TF.js model saved to {tfjs_dir}")

    # List output files
    tfjs_path = Path(tfjs_dir)
    files = list(tfjs_path.glob('*'))
    print(f"[Export] Output files: {[f.name for f in files]}")

def export_tflite(onnx_path, output_dir, quantize=False):
    """Convert ONNX to TensorFlow Lite for mobile."""
    import onnx
    from onnx_tf.backend import prepare
    import tensorflow as tf

    onnx_model = onnx.load(onnx_path)
    tf_rep = prepare(onnx_model)
    saved_model_dir = str(Path(output_dir) / 'saved_model_temp')
    tf_rep.export_graph(saved_model_dir)

    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)

    if quantize:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        # Representative dataset for INT8
        def rep_dataset():
            for _ in range(100):
                data = np.random.rand(1, 224, 224, 3).astype(np.float32)
                yield [data]
        converter.representative_dataset = rep_dataset
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.uint8
        converter.inference_output_type = tf.uint8

    tflite_model = converter.convert()

    tflite_path = Path(output_dir) / ('model_int8.tflite' if quantize else 'model_fp32.tflite')
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)

    size_mb = len(tflite_model) / (1024 * 1024)
    print(f"[Export] TFLite model saved to {tflite_path} ({size_mb:.2f} MB)")

    # Cleanup temp
    import shutil
    shutil.rmtree(saved_model_dir, ignore_errors=True)

def create_web_metadata(config, output_dir):
    """Create a metadata JSON for the frontend to load."""
    metadata = {
        'model_name': 'mood_classifier',
        'version': '1.0.0',
        'input_size': config['model']['input_size'],
        'num_classes': config['model']['num_classes'],
        'classes': [
            'happy', 'sad', 'angry', 'excited', 'romantic',
            'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic'
        ],
        'preprocessing': {
            'mean': [0.485, 0.456, 0.406],
            'std': [0.229, 0.224, 0.225],
            'normalize': True
        },
        'backend': 'tfjs',
        'model_format': 'graph_model'
    }

    with open(Path(output_dir) / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"[Export] Metadata saved to {output_dir}/metadata.json")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', required=True, help='Path to best.pth')
    parser.add_argument('--config', default='config.yaml')
    parser.add_argument('--output', default='web_model', help='Output directory')
    parser.add_argument('--formats', default='tfjs,tflite', 
                       help='Comma-separated: tfjs,onnx,tflite')
    parser.add_argument('--quantize', action='store_true', help='INT8 quantization for TFLite')
    args = parser.parse_args()

    config = load_config(args.config)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load model
    device = torch.device('cpu')  # Export on CPU for compatibility
    model = build_model(config).to(device)

    checkpoint = torch.load(args.checkpoint, map_location=device)
    model.load_state_dict(checkpoint['model_state'])
    model.eval()

    print(f"[Export] Loaded model from epoch {checkpoint.get('epoch', '?')}")
    print(f"[Export] Best validation F1: {checkpoint.get('best_f1', 0):.4f}")

    formats = args.formats.split(',')

    # Always export ONNX first (intermediate format)
    onnx_path = str(output_dir / 'model.onnx')
    export_onnx(model, config, onnx_path)

    if 'tfjs' in formats:
        export_tfjs(onnx_path, output_dir)

    if 'tflite' in formats:
        export_tflite(onnx_path, output_dir, quantize=args.quantize)

    if 'onnx' not in formats:
        # Clean up intermediate ONNX if not requested
        os.remove(onnx_path)

    # Create metadata for frontend
    create_web_metadata(config, output_dir)

    print(f"\n[Done] All exports saved to {output_dir}")
    print("\nTo use in your app:")
    print(f"  1. Copy {output_dir}/ to your app's public/ or static/ folder")
    print(f"  2. Load with: await tf.loadGraphModel('/web_model/tfjs/model.json')")
    print(f"  3. See README.md for frontend integration code")

    # Optional: deploy directly into the app static folder if deploy helper exists
    try:
        from pathlib import Path
        import subprocess

        repo_root = Path(__file__).resolve().parents[2]
        deploy_script = repo_root / 'scripts' / 'deploy_model.py'
        tfjs_src = str(Path(output_dir) / 'tfjs')
        dest = str(repo_root / 'static' / 'models' / 'mood-model')

        if deploy_script.exists():
            print(f"[Export] Found deploy helper at {deploy_script}, attempting deploy...")
            cmd = ['python3', str(deploy_script), '--src', tfjs_src, '--dest', dest]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"[Export] Deploy succeeded: {result.stdout}")
            else:
                print(f"[Export] Deploy script failed:\n{result.stderr}")
        else:
            print(f"[Export] Deploy helper not found at {deploy_script}, skipping automatic deploy")
    except Exception as e:
        print(f"[Export] Automatic deploy check failed: {e}")

if __name__ == '__main__':
    main()
