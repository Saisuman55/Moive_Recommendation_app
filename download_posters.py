#!/usr/bin/env python3
"""Download posters from movies_dataset.json into static/posters and update dataset paths.

Usage:
    python3 download_posters.py --input movies_dataset.json --csv data/movies.csv --output movies_dataset.json
"""
import argparse
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd
import requests


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def filename_from_url(url, movie_id):
    parsed = urlparse(url)
    root = os.path.basename(parsed.path)
    if root:
        return f"{movie_id}_{root}"
    return f"{movie_id}.jpg"


def download_file(session, url, dest_path, timeout=20):
    try:
        r = session.get(url, stream=True, timeout=timeout)
        r.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False


def main(input_json, csv_file, output_json, posters_dir, delay=0.15):
    input_path = Path(input_json)
    csv_path = Path(csv_file)
    output_path = Path(output_json)
    posters_path = Path(posters_dir)

    if not input_path.exists():
        raise SystemExit(f"Input JSON not found: {input_path}")

    ensure_dir(posters_path)

    with open(input_path, "r", encoding="utf-8") as fh:
        movies = json.load(fh)

    session = requests.Session()
    mapping = {}
    total = len(movies)
    downloaded = 0
    skipped = 0

    print(f"Found {total} movies in {input_json}; downloading posters to {posters_path}")

    for idx, m in enumerate(movies, 1):
        poster_url = m.get("poster")
        mid = m.get("id")
        if not poster_url:
            skipped += 1
            continue

        filename = filename_from_url(poster_url, mid)
        dest = posters_path / filename

        if dest.exists():
            mapping[mid] = f"/static/{posters_path.name}/{filename}"
            skipped += 1
        else:
            ok = download_file(session, poster_url, dest)
            if ok:
                mapping[mid] = f"/static/{posters_path.name}/{filename}"
                downloaded += 1
            else:
                skipped += 1

        if idx % 50 == 0:
            print(f"Progress: {idx}/{total} (downloaded {downloaded})")

        time.sleep(delay)

    # Update JSON with local poster paths
    for m in movies:
        mid = m.get("id")
        if mid in mapping:
            m["poster"] = mapping[mid]

    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(movies, fh, indent=2, ensure_ascii=False)

    print(f"Downloaded: {downloaded}, Skipped: {skipped}")
    print(f"Updated JSON written to {output_path}")

    # Update CSV if exists
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        if "id" in df.columns:
            df["poster_url"] = df["id"].map(mapping).combine_first(df.get("poster_url"))
            df.to_csv(csv_path, index=False)
            print(f"Updated CSV written to {csv_path}")
        else:
            print(f"CSV {csv_path} does not contain 'id' column; skipping CSV update")
    else:
        print(f"CSV file {csv_path} not found; skipping CSV update")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="movies_dataset.json")
    parser.add_argument("--csv", default="data/movies.csv")
    parser.add_argument("--output", default="movies_dataset.json")
    parser.add_argument("--posters-dir", default="static/posters")
    parser.add_argument("--delay", type=float, default=0.15, help="Seconds to sleep between downloads")
    args = parser.parse_args()
    main(args.input, args.csv, args.output, args.posters_dir, delay=args.delay)
