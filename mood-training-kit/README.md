# AI Mood Detection — Model Training Guide

A production-grade pipeline for training facial emotion recognition models that power the Mood Scanner camera feature.

---

## Table of Contents
1. [Overview](#overview)
2. [Datasets](#datasets)
3. [Environment Setup](#environment-setup)
4. [Data Preparation](#data-preparation)
5. [Model Architecture](#model-architecture)
6. [Training](#training)
7. [Evaluation](#evaluation)
8. [Export for Web Deployment](#export-for-web-deployment)
9. [Fine-Tuning on Your Own Data](#fine-tuning-on-your-own-data)
10. [Performance Optimization](#performance-optimization)
11. [Bias & Ethics](#bias--ethics)

---

## Overview

The camera mood scanner needs a **lightweight, real-time facial emotion classifier** that runs in the browser or on-device. This guide trains a CNN (MobileNetV2/EfficientNet) to classify faces into 11 mood categories from webcam frames.

**Pipeline:**
```
Raw Images → Face Detection (MTCNN/RetinaFace) → Crop & Align → 
CNN Feature Extractor → 11-way Classifier → Softmax Probabilities → 
Smoothing → Mood Result
```

---

## Datasets

You need **labeled facial expression images**. Combine these public datasets:

| Dataset | Classes | Images | License | Download |
|---------|---------|--------|---------|----------|
| **FER2013** | 7 emotions | 35,887 | Academic | [Kaggle](https://www.kaggle.com/datasets/msambare/fer2013) |
| **FER+** | 8 emotions + neutral | 28,709 | MIT | [GitHub](https://github.com/Microsoft/FERPlus) |
| **AffectNet** | 11 categories | ~1M | Research | [Official](http://mohammadmahoor.com/affectnet/) |
| **RAF-DB** | 7 basic + 12 compound | ~30K | Research | [Official](http://www.whdeng.cn/RAF/model1.html) |
| **ExpW** | 7 emotions | 91,793 | Research | [GitHub](https://github.com/IrvingMeng/Expression_in-the-Wild) |

### Recommended Strategy
1. **Primary:** AffectNet (largest, most diverse, has your 11 categories)
2. **Secondary:** FER+ for additional training signal
3. **Fine-tuning:** Your own app's collected data (with consent)

### Class Mapping (Standard → Your 11 Moods)

Standard datasets use 7-8 classes. Map them to your taxonomy:

| Source Class | Your Mood | Weight |
|-------------|-----------|--------|
| Happy | Happy | 1.0 |
| Sad | Sad | 1.0 |
| Anger | Angry | 1.0 |
| Fear | Fearful | 1.0 |
| Surprise | Excited | 0.7, Energetic | 0.3 |
| Disgust | Stressed | 0.6, Angry | 0.4 |
| Neutral | Relaxed | 0.5, Bored | 0.3, Emotional | 0.2 |
| Contempt | Stressed | 0.5, Angry | 0.5 |

**For Romantic:** AffectNet has a "Love" / "Affection" category. If unavailable, create a synthetic class by fine-tuning on romantic movie frames or use CLIP embeddings to score images.

---

## Environment Setup

```bash
# Create environment
conda create -n mood-train python=3.10
conda activate mood-train

# Core dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install tensorflowjs onnx onnxruntime tf2onnx
pip install opencv-python-headless albumentations timm scikit-learn pandas tqdm
pip install matplotlib seaborn tensorboard wandb

# Face detection (for preprocessing)
pip install facenet-pytorch retinaface-pytorch

# Optional: Weights & Biases for experiment tracking
wandb login
```

---

## Data Preparation

### Step 1: Download & Organize

```bash
# Example structure after downloading
data/
├── raw/
│   ├── affectnet/          # Extract AffectNet here
│   ├── fer2013/            # Extract FER2013 here
│   └── ferplus/            # Extract FER+ here
└── processed/
    ├── train/
    │   ├── happy/
    │   ├── sad/
    │   ├── angry/
    │   ├── excited/
    │   ├── romantic/
    │   ├── stressed/
    │   ├── relaxed/
    │   ├── emotional/
    │   ├── fearful/
    │   ├── bored/
    │   └── energetic/
    ├── val/
    └── test/
```

### Step 2: Face Detection & Alignment

Run `scripts/preprocess.py` to:
1. Detect faces using MTCNN or RetinaFace
2. Crop to face bounding box + 20% margin
3. Align using eye coordinates (rotate so eyes are horizontal)
4. Resize to 224×224 or 96×96 (depending on speed/accuracy tradeoff)
5. Save to `data/processed/`

**Why alignment matters:** Neural networks learn spatial relationships. If faces are tilted, the model must learn rotation invariance, which wastes capacity.

### Step 3: Handle Class Imbalance

Mood datasets are heavily imbalanced (lots of "Happy", few "Romantic").

**Solutions:**
- **Weighted Loss:** `CrossEntropyLoss(weight=class_weights)`
- **Oversampling:** Duplicate minority class samples in training batches
- **Augmentation:** Aggment underrepresented classes more heavily

---

## Model Architecture

### Option A: MobileNetV2 (Recommended for Web)

- **Backbone:** MobileNetV2 (pretrained on ImageNet)
- **Input:** 224×224 RGB or 96×96 grayscale
- **Custom Head:**
  - Global Average Pooling
  - Dropout(0.5)
  - Dense(256) + ReLU + Dropout(0.3)
  - Dense(11) — your mood classes
- **Parameters:** ~3.5M total, ~300K trainable in head
- **Latency:** ~15ms/frame on GPU, ~80ms on CPU

### Option B: EfficientNet-B0

- Better accuracy, slightly slower
- Use if targeting native apps rather than browser

### Option C: Custom Lightweight CNN (Extreme Speed)

For 30fps on low-end mobile:
- 4-5 conv blocks (32→64→128→256 filters)
- BatchNorm + ReLU + MaxPool
- Global Average Pool → Dense(128) → Dense(11)
- ~500K parameters, ~5ms inference

---

## Training

### Configuration (`config.yaml`)

```yaml
model:
  backbone: "mobilenetv2"
  pretrained: true
  input_size: 224
  num_classes: 11
  dropout: 0.5

training:
  batch_size: 64
  epochs: 50
  lr: 0.001
  weight_decay: 0.0001
  scheduler: "cosine"
  warmup_epochs: 3
  early_stopping_patience: 10
  label_smoothing: 0.1

data:
  train_dir: "data/processed/train"
  val_dir: "data/processed/val"
  num_workers: 8
  augment: true

augmentation:
  horizontal_flip: 0.5
  rotation: 15
  brightness: 0.2
  contrast: 0.2
  cutout:
    holes: 1
    size: 40
```

### Run Training

```bash
python scripts/train.py --config config.yaml --output models/run-1
```

**What happens:**
1. Loads pretrained MobileNetV2
2. Freezes backbone for 3 epochs (warmup)
3. Unfreezes and trains full network with cosine LR decay
4. Saves best checkpoint by validation F1-score (not accuracy — accuracy is misleading on imbalanced data)
5. Logs to TensorBoard/WandB

### Training Tips

1. **Start with frozen backbone:** Let the custom head converge first
2. **Use label smoothing (0.1):** Prevents overconfidence on noisy labels
3. **Monitor per-class F1:** Some moods (Romantic, Emotional) are harder — give them more attention
4. **Mixup/CutMix:** Blend two face images + labels. Works surprisingly well for emotions
5. **Test-Time Augmentation (TTA):** Average predictions across 5 flipped/rotated versions during inference for +2-3% accuracy

---

## Evaluation

### Metrics That Matter

| Metric | Why | Target |
|--------|-----|--------|
| **Macro F1** | Equal weight per class (critical for rare moods) | > 0.65 |
| **Accuracy** | Overall correctness | > 0.75 |
| **Top-2 Accuracy** | Correct if top 2 predictions contain true mood | > 0.90 |
| **Inference Time** | Must be < 100ms for real-time feel | < 50ms |
| **Model Size** | Must download quickly to browser | < 10MB |

### Confusion Matrix Analysis

Look for these common failure modes:
- **Happy vs. Excited:** Often confused. Add temporal context (excited has more motion)
- **Sad vs. Emotional:** Subtle difference. Emotional may need eyebrow/forehead features
- **Relaxed vs. Bored:** Context-dependent. Use eye openness (bored = droopy eyes)
- **Romantic:** Hardest class. May need dedicated fine-tuning dataset

---

## Export for Web Deployment

### Path 1: TensorFlow.js (Recommended for React/Next.js)

```bash
# 1. PyTorch → ONNX
python scripts/export_onnx.py --checkpoint models/run-1/best.pth --output model.onnx

# 2. ONNX → TensorFlow SavedModel
onnx-tf convert -i model.onnx -o saved_model/

# 3. TensorFlow → TF.js
tensorflowjs_converter   --input_format=tf_saved_model   --output_format=tfjs_graph_model   --signature_name=serving_default   saved_model/   web_model/
```

**Load in browser:**
```javascript
const model = await tf.loadGraphModel('/web_model/model.json');
const prediction = model.predict(preprocessedFaceTensor);
```

### Path 2: ONNX Runtime Web (Fastest inference)

```bash
# Export directly to ONNX, then use onnxruntime-web in browser
python scripts/export_onnx.py --simplify --dynamic-axes
```

```javascript
import * as ort from 'onnxruntime-web';
const session = await ort.InferenceSession.create('/model.onnx', {
  executionProviders: ['wasm'], // or 'webgpu' for newer browsers
});
const results = await session.run({ input: tensor });
```

### Path 3: TensorFlow Lite (React Native / Flutter / Native)

```bash
# PyTorch → ONNX → TFLite
python scripts/export_tflite.py --quantization int8
```

---

## Fine-Tuning on Your Own Data

Public datasets are generic. Your app needs **domain-specific tuning**:

### Collect App-Specific Data

```
1. Add "Help improve AI" opt-in during scanning
2. After mood detection, ask user: "Was this correct?"
3. If user corrects the mood, save:
   - The webcam frame (cropped face)
   - User's corrected label
   - Timestamp, lighting conditions, device type
4. Store locally, batch-upload when on WiFi
```

### Privacy-First Collection

- Never store raw video. Only the single analyzed frame.
- Hash/encrypt face crops server-side.
- Allow users to delete their training data in Settings.
- Anonymize: strip metadata, aggregate by demographics only.

### Continuous Training Pipeline

```bash
# Weekly retraining script
python scripts/retrain.py \
  --base_model models/production.pth \
  --new_data data/user_feedback/ \
  --epochs 5 \
  --lr 0.0001 \
  --output models/production-v$(date +%s).pth
```

Use **low learning rate + few epochs** to avoid catastrophic forgetting.

---

## Performance Optimization

### For Browser (TF.js)

| Technique | Impact | How |
|-----------|--------|-----|
| **Quantization** | 4x smaller, 2-3x faster | Post-training INT8 or float16 |
| **Pruning** | 30-50% sparsity | Remove low-magnitude weights |
| **Input size** | Major speedup | 96×96 instead of 224×224 |
| **WebGL backend** | 10x faster than CPU | `tf.setBackend('webgl')` |
| **WebGPU** | 20x faster | `tf.setBackend('webgpu')` (Chrome 113+) |
| **Batch inference** | Better throughput | Process every 3rd frame, not every frame |

### For Mobile (TFLite)

```python
# INT8 quantization for 4x speedup
converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_gen
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8
tflite_model = converter.convert()
```

---

## Bias & Ethics

**Critical:** Emotion recognition from faces is scientifically contested. Facial expressions are **not universal** — they vary by culture, context, and individual baseline.

### Mitigations

1. **Diverse training data:** Ensure datasets include varied skin tones, ages, genders, cultures
2. **Never make high-stakes decisions:** Use mood as a *recommendation hint*, not a definitive label
3. **User override:** Always let users manually select/correct their mood
4. **Baseline calibration:** On first use, ask user to make a "neutral face" to establish their personal baseline
5. **Temporal smoothing:** Single-frame emotion is noisy. Average over 2-3 seconds
6. **Transparency:** Show confidence scores. If confidence < 60%, say "We're not sure — pick your mood?"

### Recommended Reading

- Barrett, Lisa Feldman. "How Emotions Are Made" — challenges basic emotion theory
- [AI Now Report on Affect Recognition](https://ainowinstitute.org/publication/landscape-affect-recognition)

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Model always predicts "Happy" | Class imbalance | Use weighted loss + oversample minorities |
| Poor accuracy on dark skin | Biased dataset | Add more diverse data (AffectNet is better than FER2013) |
| Slow inference in browser | Model too big | Use 96×96 input + MobileNetV2 + INT8 quant |
| Jittery predictions | No temporal smoothing | Apply EMA (α=0.15) across frames |
| "Romantic" never detected | No training data | Fine-tune on romantic scene frames or remove class |
| Glasses break detection | Face detectors fail | Use RetinaFace instead of Haar cascades |

---

## Next Steps

For a one-command local run from the project root, use:

```bash
bash scripts/run_mood_training.sh /path/to/raw_dataset affectnet
```

You can also omit the dataset name and let the script auto-detect it:

```bash
bash scripts/run_mood_training.sh /path/to/raw_dataset
```

That script installs the kit dependencies into the local `venv`, preprocesses the raw dataset, trains the model, exports TFJS files, and deploys them into `static/models/mood-model`.

1. **Download AffectNet** (request academic access)
2. **Run `scripts/preprocess.py`** to clean & align faces
3. **Run `scripts/train.py`** for 50 epochs
4. **Evaluate** with `scripts/evaluate.py`
5. **Export** with `scripts/export_tfjs.py`
6. **Drop the `.json` + `.bin` files** into your app's `public/models/` folder
7. **Load in the scanner component** and replace the simulation backend with real inference

---

*Generated for AI Mood Scanner Feature — Production Training Kit*
