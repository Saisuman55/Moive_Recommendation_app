#!/usr/bin/env python3
"""
Evaluate trained model with detailed metrics, confusion matrix, and per-class analysis.

Usage:
    python evaluate.py \
        --checkpoint models/run-1/best.pth \
        --config config.yaml \
        --data data/processed/test
"""

import sys
import yaml
import argparse
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report, confusion_matrix, 
    f1_score, precision_score, recall_score,
    top_k_accuracy_score
)
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from train import build_model, load_config, MoodDataset, get_transforms


def evaluate_model(model, dataloader, device, class_names):
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc='Evaluating'):
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = outputs.max(1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    # Metrics
    acc = 100.0 * (all_preds == all_labels).mean()
    macro_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    weighted_f1 = f1_score(all_labels, all_preds, average='weighted', zero_division=0)

    # Top-2 accuracy
    top2_preds = np.argpartition(-all_probs, kth=2, axis=1)[:, :2]
    top2_correct = np.any(top2_preds == all_labels[:, None], axis=1).mean()

    print(f"\n{'='*60}")
    print(f"Overall Accuracy:      {acc:.2f}%")
    print(f"Macro F1-Score:        {macro_f1:.4f}")
    print(f"Weighted F1-Score:     {weighted_f1:.4f}")
    print(f"Top-2 Accuracy:        {top2_correct*100:.2f}%")
    print(f"{'='*60}\n")

    # Per-class report
    print("Per-Class Performance:")
    print(classification_report(
        all_labels, all_preds,
        target_names=class_names,
        digits=3,
        zero_division=0
    ))

    return all_labels, all_preds, all_probs


def plot_confusion_matrix(y_true, y_pred, class_names, output_path):
    cm = confusion_matrix(y_true, y_pred)
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    # Raw counts
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=class_names, yticklabels=class_names,
                ax=axes[0], cbar=False)
    axes[0].set_title('Confusion Matrix (Counts)')
    axes[0].set_ylabel('True Label')
    axes[0].set_xlabel('Predicted Label')

    # Normalized
    sns.heatmap(cm_normalized, annot=True, fmt='.2f', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names,
                ax=axes[1], vmin=0, vmax=1)
    axes[1].set_title('Confusion Matrix (Normalized)')
    axes[1].set_ylabel('True Label')
    axes[1].set_xlabel('Predicted Label')

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"[Plot] Confusion matrix saved to {output_path}")
    plt.close()


def plot_per_class_metrics(y_true, y_pred, class_names, output_path):
    from sklearn.metrics import precision_recall_fscore_support

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, zero_division=0
    )

    x = np.arange(len(class_names))
    width = 0.25

    fig, ax = plt.subplots(figsize=(14, 6))
    ax.bar(x - width, precision, width, label='Precision', alpha=0.8)
    ax.bar(x, recall, width, label='Recall', alpha=0.8)
    ax.bar(x + width, f1, width, label='F1-Score', alpha=0.8)

    ax.set_xlabel('Mood Class')
    ax.set_ylabel('Score')
    ax.set_title('Per-Class Precision, Recall, and F1-Score')
    ax.set_xticks(x)
    ax.set_xticklabels(class_names, rotation=45, ha='right')
    ax.legend()
    ax.set_ylim(0, 1)
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"[Plot] Per-class metrics saved to {output_path}")
    plt.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', required=True)
    parser.add_argument('--config', default='config.yaml')
    parser.add_argument('--data', default='data/processed/test')
    parser.add_argument('--output', default='evaluation')
    parser.add_argument('--batch-size', type=int, default=64)
    args = parser.parse_args()

    config = load_config(args.config)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Load model
    model = build_model(config).to(device)
    checkpoint = torch.load(args.checkpoint, map_location=device)
    model.load_state_dict(checkpoint['model_state'])

    print(f"[Eval] Loaded checkpoint (epoch {checkpoint.get('epoch', '?')}, best F1: {checkpoint.get('best_f1', 0):.4f})")

    # Load test data
    test_dataset = MoodDataset(args.data, transform=get_transforms(config, is_train=False))
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, 
                            shuffle=False, num_workers=4, pin_memory=True)

    class_names = MoodDataset.MOOD_CLASSES

    # Evaluate
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    y_true, y_pred, y_prob = evaluate_model(model, test_loader, device, class_names)

    # Plots
    plot_confusion_matrix(y_true, y_pred, class_names, output_dir / 'confusion_matrix.png')
    plot_per_class_metrics(y_true, y_pred, class_names, output_dir / 'per_class_metrics.png')

    # Save predictions for analysis
    np.savez(output_dir / 'predictions.npz',
             labels=y_true, preds=y_pred, probs=y_prob)

    print(f"\n[Done] Evaluation results saved to {output_dir}")

if __name__ == '__main__':
    main()
