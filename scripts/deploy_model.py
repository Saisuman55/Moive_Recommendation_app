#!/usr/bin/env python3
"""Simple deploy helper: copy a TFJS export folder (containing model.json)
into the app's static/models/mood-model directory so the frontend can load it.

Usage:
  python3 scripts/deploy_model.py --src PATH/TO/TFJS_EXPORT --dest static/models/mood-model
"""
import argparse
import os
import shutil
import sys


def fail(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def copy_tfjs_export(src, dest):
    if not os.path.exists(src):
        fail(f"Source path does not exist: {src}", 2)

    # If user pointed to a model.json file, use its directory
    if os.path.isfile(src) and os.path.basename(src) == "model.json":
        src_dir = os.path.dirname(src)
    else:
        src_dir = src

    model_json = os.path.join(src_dir, "model.json")
    if not os.path.isfile(model_json):
        fail(f"No model.json found in source directory: {src_dir}", 3)

    # Ensure destination exists and is clean
    os.makedirs(dest, exist_ok=True)
    for name in os.listdir(dest):
        path = os.path.join(dest, name)
        try:
            if os.path.isfile(path) or os.path.islink(path):
                os.unlink(path)
            else:
                shutil.rmtree(path)
        except Exception as e:
            fail(f"Failed to remove existing file at {path}: {e}")

    # Copy all files from src_dir to dest
    for name in os.listdir(src_dir):
        src_path = os.path.join(src_dir, name)
        dest_path = os.path.join(dest, name)
        try:
            if os.path.isdir(src_path):
                shutil.copytree(src_path, dest_path)
            else:
                shutil.copy2(src_path, dest_path)
        except Exception as e:
            fail(f"Failed to copy {src_path} -> {dest_path}: {e}")

    print(f"Deployed TFJS model from {src_dir} to {dest}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", help="Path to TFJS export folder or model.json file",
                   default="mood-training-kit/export/tfjs")
    p.add_argument("--dest", help="Destination folder inside the app static tree",
                   default="static/models/mood-model")
    args = p.parse_args()

    copy_tfjs_export(args.src, args.dest)


if __name__ == "__main__":
    main()
