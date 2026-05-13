#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIT_DIR="$ROOT_DIR/mood-training-kit"
VENV_DIR="$ROOT_DIR/venv"
RAW_DATA_DIR="${1:-}"
DATASET_NAME="${2:-auto}"
CHECKPOINT_DIR="$KIT_DIR/models/run-1"
EXPORT_DIR="$KIT_DIR/web_model"

detect_dataset() {
  local input_dir="$1"

  if [[ -f "$input_dir/training.csv" ]] && [[ -d "$input_dir/manually_annotated" ]]; then
    echo "affectnet"
    return 0
  fi

  if [[ -d "$input_dir/train" ]] && [[ -d "$input_dir/test" ]]; then
    if [[ -d "$input_dir/train/angry" || -d "$input_dir/train/happy" || -d "$input_dir/train/neutral" ]]; then
      echo "fer2013"
      return 0
    fi
  fi

  if [[ -d "$input_dir/happy" || -d "$input_dir/sad" || -d "$input_dir/angry" ]]; then
    echo "custom"
    return 0
  fi

  echo "affectnet"
}

if [[ -z "$RAW_DATA_DIR" ]]; then
  cat <<'EOF'
Usage:
  bash scripts/run_mood_training.sh /path/to/raw_dataset [affectnet|fer2013|custom|auto]

What it does:
  1. Installs the training dependencies into the local venv if needed
  2. Preprocesses the raw dataset into mood-training-kit/data/processed
  3. Trains the model into mood-training-kit/models/run-1
  4. Exports TFJS files into mood-training-kit/web_model/tfjs
  5. Deploys the TFJS model into static/models/mood-model
EOF
  exit 1
fi

if [[ "$DATASET_NAME" == "auto" ]]; then
  DATASET_NAME="$(detect_dataset "$RAW_DATA_DIR")"
fi

echo "Using dataset type: $DATASET_NAME"

if [[ ! -d "$KIT_DIR" ]]; then
  echo "Missing kit directory: $KIT_DIR" >&2
  exit 1
fi

if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

python -m pip install --upgrade pip
python -m pip install -r "$KIT_DIR/requirements.txt"

mkdir -p "$KIT_DIR/data/processed" "$CHECKPOINT_DIR" "$EXPORT_DIR"

python "$KIT_DIR/scripts/preprocess.py" \
  --input "$RAW_DATA_DIR" \
  --output "$KIT_DIR/data/processed" \
  --dataset "$DATASET_NAME" \
  --config "$KIT_DIR/config.yaml"

python "$KIT_DIR/scripts/train.py" \
  --config "$KIT_DIR/config.yaml" \
  --output "$CHECKPOINT_DIR"

python "$KIT_DIR/scripts/export_tfjs.py" \
  --checkpoint "$CHECKPOINT_DIR/best.pth" \
  --config "$KIT_DIR/config.yaml" \
  --output "$EXPORT_DIR" \
  --formats tfjs

python "$ROOT_DIR/scripts/deploy_model.py" \
  --src "$EXPORT_DIR/tfjs" \
  --dest "$ROOT_DIR/static/models/mood-model"

echo "Training pipeline complete."
echo "Verify the app endpoint with: curl http://127.0.0.1:5001/api/model-status"
