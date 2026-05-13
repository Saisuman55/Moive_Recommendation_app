#!/usr/bin/env python3
"""Sync the live TMDb JSON catalog into the CSV used by the recommender engine.

The app's discovery pages read `movies_dataset.json`, while the recommendation
engine reads `data/movies.csv`. This helper keeps those two sources aligned.
"""
import argparse
import json
from pathlib import Path

import pandas as pd


def normalize_genres(genres):
    if isinstance(genres, list):
        return ", ".join(str(item).strip() for item in genres if str(item).strip())
    if isinstance(genres, str):
        return genres.replace("|", ", ")
    return ""


def main(input_json, output_csv):
    input_path = Path(input_json)
    output_path = Path(output_csv)

    if not input_path.exists():
        raise SystemExit(f"Input JSON not found: {input_path}")

    with open(input_path, "r", encoding="utf-8") as handle:
        movies = json.load(handle)

    rows = []
    for movie in movies:
        rows.append({
            "id": movie.get("id"),
            "title": movie.get("title") or "Untitled",
            "genres": normalize_genres(movie.get("genres")),
            "overview": movie.get("overview") or "",
            "poster": movie.get("poster") or movie.get("poster_url") or "",
            "backdrop": movie.get("backdrop") or "",
            "rating": movie.get("rating") or 0,
            "year": movie.get("year") or "",
            "runtime": movie.get("runtime") or "",
            "language": movie.get("language") or "",
            "trailer_url": movie.get("trailer_url") or "",
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(output_path, index=False)
    print(f"Wrote {len(rows)} rows to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync live movie JSON into recommender CSV")
    parser.add_argument("--input", default="movies_dataset.json")
    parser.add_argument("--output", default="data/movies.csv")
    args = parser.parse_args()
    main(args.input, args.output)
