#!/usr/bin/env python3
"""
AI Mood Detection — Training Pipeline
Trains a MobileNetV2/EfficientNet classifier on facial emotion datasets.

Usage:
    python train.py --config ../config.yaml --output models/run-1
"""

import os
import sys
import yaml
import argparse
import time
import json
from pathlib import Path
from typing import Dict, Tuple

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torch.cuda.amp import autocast, GradScaler
import torchvision.transforms as T
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from sklearn.metrics import classification_report, f1_score, confusion_matrix
import numpy as np
from tqdm import tqdm
from PIL import Image

# ─── Configuration ───

def load_config(path: str) -> Dict:
    with open(path, 'r') as f:
        return yaml.safe_load(f)

# ─── Dataset ───

class MoodDataset(torch.utils.data.Dataset):
    """Loads preprocessed face images with mood labels."""

    MOOD_CLASSES = [
        'happy', 'sad', 'angry', 'excited', 'romantic',
        'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic'
    ]

    def __init__(self, root_dir: str, transform=None):
        self.root = Path(root_dir)
        self.transform = transform
        self.samples = []
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.MOOD_CLASSES)}

        for cls_name in self.MOOD_CLASSES:
            cls_dir = self.root / cls_name
            if not cls_dir.exists():
                continue
            for img_path in cls_dir.glob('*'):
                if img_path.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                    self.samples.append((str(img_path), self.class_to_idx[cls_name]))

        print(f"[Dataset] Loaded {len(self.samples)} images from {root_dir}")
        self._print_class_distribution()

    def _print_class_distribution(self):
        counts = [0] * len(self.MOOD_CLASSES)
        for _, label in self.samples:
            counts[label] += 1
        print("[Dataset] Class distribution:")
        for cls, count in zip(self.MOOD_CLASSES, counts):
            print(f"  {cls:12s}: {count:5d} ({count/len(self.samples)*100:.1f}%)")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = Image.open(path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image, label

# ─── Augmentations ───

def get_transforms(config: Dict, is_train: bool = True):
    size = config['model']['input_size']

    if is_train:
        aug = config['augmentation']
        return T.Compose([
            T.Resize((size, size)),
            T.RandomHorizontalFlip(p=aug.get('horizontal_flip', 0.5)),
            T.RandomRotation(degrees=aug.get('rotation', 15)),
            T.ColorJitter(
                brightness=aug.get('brightness', 0.2),
                contrast=aug.get('contrast', 0.2),
                saturation=aug.get('saturation', 0.2),
                hue=aug.get('hue', 0.05)
            ),
            T.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            # Random Erasing (after tensor conversion)
            T.RandomErasing(p=aug.get('random_erase', {}).get('probability', 0.3), 
                           scale=(0.02, 0.2))
        ])
    else:
        return T.Compose([
            T.Resize((size, size)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

# ─── Model ───

def build_model(config: Dict) -> nn.Module:
    backbone_name = config['model']['backbone']
    num_classes = config['model']['num_classes']
    dropout = config['model']['dropout']

    if backbone_name == 'mobilenetv2':
        weights = MobileNet_V2_Weights.IMAGENET1K_V1 if config['model']['pretrained'] else None
        model = mobilenet_v2(weights=weights)
        # Replace classifier
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.6),
            nn.Linear(256, num_classes)
        )

    elif backbone_name == 'efficientnet_b0':
        weights = EfficientNet_B0_Weights.IMAGENET1K_V1 if config['model']['pretrained'] else None
        model = efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(in_features, num_classes)
        )

    else:
        raise ValueError(f"Unknown backbone: {backbone_name}")

    return model

# ─── Training Utilities ───

class EarlyStopping:
    def __init__(self, patience: int = 10, min_delta: float = 0.0):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_score = None
        self.early_stop = False

    def __call__(self, score: float) -> bool:
        if self.best_score is None:
            self.best_score = score
        elif score < self.best_score + self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_score = score
            self.counter = 0
        return self.early_stop

class WarmupCosineScheduler:
    def __init__(self, optimizer, warmup_epochs, total_epochs, base_lr, min_lr=1e-6):
        self.optimizer = optimizer
        self.warmup = warmup_epochs
        self.total = total_epochs
        self.base_lr = base_lr
        self.min_lr = min_lr
        self.current_epoch = 0

    def step(self):
        self.current_epoch += 1
        if self.current_epoch <= self.warmup:
            # Linear warmup
            lr = self.base_lr * (self.current_epoch / self.warmup)
        else:
            # Cosine decay
            progress = (self.current_epoch - self.warmup) / (self.total - self.warmup)
            lr = self.min_lr + (self.base_lr - self.min_lr) * 0.5 * (1 + np.cos(np.pi * progress))

        for param_group in self.optimizer.param_groups:
            param_group['lr'] = lr
        return lr

# ─── Training Loop ───

def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    scaler: GradScaler,
    device: torch.device,
    use_amp: bool
) -> Tuple[float, float]:
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(loader, desc='Training', leave=False)
    for images, labels in pbar:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()

        with autocast(enabled=use_amp):
            outputs = model(images)
            loss = criterion(outputs, labels)

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        scaler.step(optimizer)
        scaler.update()

        total_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)

        pbar.set_postfix({'loss': f'{loss.item():.4f}', 'acc': f'{100.*correct/total:.2f}%'})

    return total_loss / total, 100. * correct / total

@torch.no_grad()
def validate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Tuple[float, float, float, np.ndarray]:
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    for images, labels in tqdm(loader, desc='Validation', leave=False):
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)

        total_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)

        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    macro_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)

    return total_loss / total, 100. * correct / total, macro_f1, np.array(all_labels), np.array(all_preds)

# ─── Main ───

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True, help='Path to config.yaml')
    parser.add_argument('--output', required=True, help='Output directory for checkpoints')
    parser.add_argument('--resume', default=None, help='Resume from checkpoint')
    args = parser.parse_args()

    config = load_config(args.config)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save config to output
    with open(output_dir / 'config.yaml', 'w') as f:
        yaml.dump(config, f)

    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[System] Using device: {device}")
    if device.type == 'cuda':
        print(f"[System] GPU: {torch.cuda.get_device_name(0)}")

    # Datasets
    train_dataset = MoodDataset(config['data']['train_dir'], transform=get_transforms(config, True))
    val_dataset = MoodDataset(config['data']['val_dir'], transform=get_transforms(config, False))

    # Handle class imbalance with weighted sampler
    class_counts = [0] * len(MoodDataset.MOOD_CLASSES)
    for _, label in train_dataset.samples:
        class_counts[label] += 1

    weights = [1.0 / class_counts[label] for _, label in train_dataset.samples]
    sampler = WeightedRandomSampler(weights, len(weights), replacement=True)

    train_loader = DataLoader(
        train_dataset, 
        batch_size=config['training']['batch_size'],
        sampler=sampler,
        num_workers=config['data']['num_workers'],
        pin_memory=config['data'].get('pin_memory', True)
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=config['training']['batch_size'] * 2,
        shuffle=False,
        num_workers=config['data']['num_workers'],
        pin_memory=config['data'].get('pin_memory', True)
    )

    # Model
    model = build_model(config).to(device)
    print(f"[Model] Built {config['model']['backbone']} with {sum(p.numel() for p in model.parameters()):,} parameters")

    # Freeze backbone initially
    freeze_epochs = config['model'].get('freeze_backbone_epochs', 3)
    if freeze_epochs > 0:
        print(f"[Training] Freezing backbone for {freeze_epochs} epochs")
        for param in model.features.parameters() if hasattr(model, 'features') else model.backbone.parameters():
            param.requires_grad = False

    # Loss with class weights
    class_weights = torch.tensor(config['data']['class_weights'], dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(
        weight=class_weights,
        label_smoothing=config['training'].get('label_smoothing', 0.0)
    )

    # Optimizer — different LR for backbone vs head
    backbone_lr = config['training'].get('lr_backbone', config['training']['lr'] / 10)
    head_params = []
    backbone_params = []

    for name, param in model.named_parameters():
        if 'classifier' in name or 'fc' in name:
            head_params.append(param)
        else:
            backbone_params.append(param)

    optimizer = optim.AdamW([
        {'params': backbone_params, 'lr': backbone_lr, 'weight_decay': config['training']['weight_decay']},
        {'params': head_params, 'lr': config['training']['lr'], 'weight_decay': config['training']['weight_decay']}
    ])

    # Scheduler
    scheduler = WarmupCosineScheduler(
        optimizer,
        warmup_epochs=config['training']['warmup_epochs'],
        total_epochs=config['training']['epochs'],
        base_lr=config['training']['lr']
    )

    # AMP
    scaler = GradScaler(enabled=config['training'].get('mixed_precision', False) and device.type == 'cuda')

    # Early stopping
    early_stop = EarlyStopping(patience=config['training']['early_stopping_patience'])

    # Resume
    start_epoch = 0
    best_f1 = 0.0
    if args.resume:
        checkpoint = torch.load(args.resume, map_location=device)
        model.load_state_dict(checkpoint['model_state'])
        optimizer.load_state_dict(checkpoint['optimizer_state'])
        start_epoch = checkpoint['epoch'] + 1
        best_f1 = checkpoint.get('best_f1', 0.0)
        print(f"[Resume] Loaded checkpoint from epoch {start_epoch}")

    # Training loop
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': [], 'val_f1': []}

    for epoch in range(start_epoch, config['training']['epochs']):
        print(f"\n{'='*60}")
        print(f"Epoch {epoch+1}/{config['training']['epochs']} | LR: {scheduler.step():.6f}")

        # Unfreeze backbone after warmup
        if epoch == freeze_epochs and freeze_epochs > 0:
            print("[Training] Unfreezing backbone")
            for param in model.features.parameters() if hasattr(model, 'features') else model.backbone.parameters():
                param.requires_grad = True

        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, scaler, device, scaler.is_enabled())
        val_loss, val_acc, val_f1, y_true, y_pred = validate(model, val_loader, criterion, device)

        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        history['val_f1'].append(val_f1)

        print(f"Train Loss: {train_loss:.4f} | Acc: {train_acc:.2f}%")
        print(f"Val   Loss: {val_loss:.4f} | Acc: {val_acc:.2f}% | Macro F1: {val_f1:.4f}")

        # Save best model (by F1, not accuracy)
        if val_f1 > best_f1:
            best_f1 = val_f1
            torch.save({
                'epoch': epoch,
                'model_state': model.state_dict(),
                'optimizer_state': optimizer.state_dict(),
                'best_f1': best_f1,
                'config': config
            }, output_dir / 'best.pth')
            print(f"[Checkpoint] Saved best model (F1: {best_f1:.4f})")

        # Save latest
        torch.save({
            'epoch': epoch,
            'model_state': model.state_dict(),
            'optimizer_state': optimizer.state_dict(),
            'best_f1': best_f1,
            'config': config
        }, output_dir / 'latest.pth')

        # Early stopping
        if early_stop(val_f1):
            print(f"[EarlyStop] No improvement for {config['training']['early_stopping_patience']} epochs. Stopping.")
            break

    # Final evaluation on best model
    print("\n[Final] Loading best model for detailed evaluation...")
    best_ckpt = torch.load(output_dir / 'best.pth', map_location=device)
    model.load_state_dict(best_ckpt['model_state'])

    _, _, _, y_true, y_pred = validate(model, val_loader, criterion, device)

    print("\nClassification Report:")
    print(classification_report(
        y_true, y_pred, 
        target_names=MoodDataset.MOOD_CLASSES,
        digits=3
    ))

    # Save confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    np.save(output_dir / 'confusion_matrix.npy', cm)

    # Save history
    with open(output_dir / 'history.json', 'w') as f:
        json.dump(history, f, indent=2)

    print(f"\n[Done] Outputs saved to {output_dir}")
    print(f"Best validation macro F1: {best_f1:.4f}")

if __name__ == '__main__':
    main()
