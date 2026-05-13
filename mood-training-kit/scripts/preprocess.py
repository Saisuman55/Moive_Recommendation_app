#!/usr/bin/env python3
"""
Preprocess raw emotion datasets:
1. Detect faces using MTCNN
2. Crop & align using eye coordinates
3. Resize to target input size
4. Organize into train/val/test folders by mood class

Usage:
    python preprocess.py \
        --input data/raw/affectnet \
        --output data/processed \
        --dataset affectnet \
        --config ../config.yaml
"""

import os
import yaml
import argparse
import shutil
from pathlib import Path
from typing import List, Tuple, Optional
import json

import cv2
import numpy as np
from PIL import Image
from tqdm import tqdm
from sklearn.model_selection import train_test_split

# Try to use facenet-pytorch MTCNN (better accuracy)
try:
    from facenet_pytorch import MTCNN
    HAS_MTCNN = True
except ImportError:
    HAS_MTCNN = False
    print("[Warning] facenet-pytorch not installed. Using OpenCV Haar cascade (less accurate).")


class FacePreprocessor:
    def __init__(self, target_size: int = 224, detector: str = 'mtcnn'):
        self.target_size = target_size

        if detector == 'mtcnn' and HAS_MTCNN:
            self.detector = MTCNN(keep_all=False, device='cuda' if torch.cuda.is_available() else 'cpu')
            self.detector_type = 'mtcnn'
        else:
            # Fallback to OpenCV Haar cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.detector = cv2.CascadeClassifier(cascade_path)
            self.detector_type = 'haar'

    def detect_face(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Returns (x, y, w, h) of largest face, or None."""
        if self.detector_type == 'mtcnn':
            import torch
            img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            boxes, _ = self.detector.detect(img_rgb)
            if boxes is not None and len(boxes) > 0:
                # boxes format: [[x1, y1, x2, y2]]
                box = boxes[0]
                x1, y1, x2, y2 = map(int, box)
                return (x1, y1, x2 - x1, y2 - y1)
            return None
        else:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.detector.detectMultiScale(gray, 1.3, 5)
            if len(faces) == 0:
                return None
            # Return largest face
            largest = max(faces, key=lambda f: f[2] * f[3])
            return tuple(largest)

    def align_face(self, image: np.ndarray, face_box: Tuple[int, int, int, int]) -> np.ndarray:
        """Crop face with margin and resize."""
        x, y, w, h = face_box

        # Add 20% margin
        margin = int(0.2 * max(w, h))
        x1 = max(0, x - margin)
        y1 = max(0, y - margin)
        x2 = min(image.shape[1], x + w + margin)
        y2 = min(image.shape[0], y + h + margin)

        face = image[y1:y2, x1:x2]

        # Resize maintaining aspect ratio, then pad to square
        face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(face_rgb)

        # Resize so smaller dimension = target_size
        w, h = pil_img.size
        scale = self.target_size / min(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        pil_img = pil_img.resize((new_w, new_h), Image.BILINEAR)

        # Center crop to square
        left = (new_w - self.target_size) // 2
        top = (new_h - self.target_size) // 2
        pil_img = pil_img.crop((left, top, left + self.target_size, top + self.target_size))

        return np.array(pil_img)

    def process_image(self, img_path: str) -> Optional[np.ndarray]:
        """Full pipeline: load → detect → align → return RGB array."""
        image = cv2.imread(img_path)
        if image is None:
            return None

        face_box = self.detect_face(image)
        if face_box is None:
            return None

        return self.align_face(image, face_box)


def load_affectnet_mapping(csv_path: str) -> dict:
    """Load AffectNet CSV annotations. Format varies by version."""
    import pandas as pd
    df = pd.read_csv(csv_path)
    # AffectNet typically has: subDirectory_filePath, expression, valence, arousal
    mapping = {}
    for _, row in df.iterrows():
        img_name = row['subDirectory_filePath']
        expr = int(row['expression'])
        mapping[img_name] = expr
    return mapping


def process_dataset(
    input_dir: str,
    output_dir: str,
    dataset_name: str,
    config: dict,
    preprocessor: FacePreprocessor,
    val_split: float = 0.15,
    test_split: float = 0.05
):
    """Process a raw dataset and organize into train/val/test."""

    input_path = Path(input_dir)
    output_path = Path(output_dir)

    # Mood class names
    mood_classes = [
        'happy', 'sad', 'angry', 'excited', 'romantic',
        'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic'
    ]

    # Create output directories
    for split in ['train', 'val', 'test']:
        for mood in mood_classes:
            (output_path / split / mood).mkdir(parents=True, exist_ok=True)

    # Load mapping config
    mood_map_config = config.get('mood_mapping', {}).get(dataset_name, {})

    # Gather all images with their source labels
    samples = []  # List of (img_path, source_label)

    if dataset_name == 'fer2013':
        # FER2013 structure: train/angry/, train/happy/, etc.
        fer_labels = {
            'angry': 0, 'disgust': 1, 'fear': 2, 
            'happy': 3, 'sad': 4, 'surprise': 5, 'neutral': 6
        }
        for split in ['train', 'test']:  # FER2013 uses 'test' as val usually
            for emotion_name, label_id in fer_labels.items():
                folder = input_path / split / emotion_name
                if not folder.exists():
                    continue
                for img_file in folder.glob('*'):
                    samples.append((str(img_file), label_id))

    elif dataset_name == 'affectnet':
        # AffectNet: manually_annotated/ + training.csv / validation.csv
        mapping = load_affectnet_mapping(str(input_path / 'training.csv'))
        img_root = input_path / 'manually_annotated' / 'manually_annotated'
        for img_rel, expr in mapping.items():
            img_path = img_root / img_rel
            if img_path.exists():
                samples.append((str(img_path), expr))

    elif dataset_name == 'custom':
        # Your own data: already organized by mood folder
        for mood in mood_classes:
            folder = input_path / mood
            if not folder.exists():
                continue
            for img_file in folder.glob('*'):
                samples.append((str(img_file), mood))  # mood is already target

    else:
        raise ValueError(f"Unknown dataset: {dataset_name}")

    print(f"[Preprocess] Found {len(samples)} raw images in {dataset_name}")

    # Map source labels to target moods
    processed = []  # List of (processed_img_array, target_mood)

    for img_path, source_label in tqdm(samples, desc=f"Processing {dataset_name}"):
        # Map source label to target mood
        if dataset_name == 'custom':
            target_mood = source_label  # Already target
        else:
            target_mood = mood_map_config.get(str(source_label), None)

        if target_mood is None:
            continue  # Skip unmapped classes

        # Detect and align face
        face_img = preprocessor.process_image(img_path)
        if face_img is None:
            continue  # No face detected

        processed.append((face_img, target_mood))

    print(f"[Preprocess] Successfully processed {len(processed)} faces")

    # Split into train/val/test
    moods = [m for _, m in processed]
    train_val, test_data = train_test_split(
        processed, test_size=test_split, stratify=moods, random_state=42
    )

    train_moods = [m for _, m in train_val]
    val_ratio = val_split / (1 - test_split)
    train_data, val_data = train_test_split(
        train_val, test_size=val_ratio, stratify=train_moods, random_state=42
    )

    # Save images
    def save_split(data, split_name):
        for idx, (img_array, mood) in enumerate(data):
            out_path = output_path / split_name / mood / f"{dataset_name}_{idx:06d}.jpg"
            Image.fromarray(img_array).save(out_path, quality=95)

    save_split(train_data, 'train')
    save_split(val_data, 'val')
    save_split(test_data, 'test')

    # Save statistics
    stats = {}
    for split in ['train', 'val', 'test']:
        stats[split] = {}
        for mood in mood_classes:
            count = len(list((output_path / split / mood).glob('*')))
            stats[split][mood] = count

    with open(output_path / f'stats_{dataset_name}.json', 'w') as f:
        json.dump(stats, f, indent=2)

    print(f"[Preprocess] Saved to {output_dir}")
    print(f"  Train: {len(train_data)} | Val: {len(val_data)} | Test: {len(test_data)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Raw dataset directory')
    parser.add_argument('--output', default='data/processed', help='Output directory')
    parser.add_argument('--dataset', required=True, 
                       choices=['fer2013', 'affectnet', 'ferplus', 'custom'])
    parser.add_argument('--config', default='config.yaml')
    parser.add_argument('--size', type=int, default=224, help='Output image size')
    parser.add_argument('--detector', default='mtcnn', choices=['mtcnn', 'haar'])
    args = parser.parse_args()

    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)

    preprocessor = FacePreprocessor(target_size=args.size, detector=args.detector)

    process_dataset(
        input_dir=args.input,
        output_dir=args.output,
        dataset_name=args.dataset,
        config=config,
        preprocessor=preprocessor
    )

if __name__ == '__main__':
    main()
