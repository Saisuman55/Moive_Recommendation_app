#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COUNT="${1:-1000}"
START_YEAR="${2:-2020}"
OUTPUT_JSON="${3:-$ROOT_DIR/movies_dataset.json}"
CSV_FILE="${4:-$ROOT_DIR/data/movies.csv}"
POSTERS_DIR="${5:-$ROOT_DIR/static/posters}"
POSTER_DELAY="${6:-0.08}"

if [[ -z "${TMDB_API_KEY:-}" ]] && [[ ! -f "$ROOT_DIR/.env" ]]; then
  cat <<'EOF'
TMDB_API_KEY is not set and no .env file was found.
Set your TMDb key before running this pipeline:

  export TMDB_API_KEY="your_key_here"

Or put it in a .env file at the project root.
EOF
  exit 1
fi

echo "Fetching live movie data from TMDb..."
python3 "$ROOT_DIR/enrich_movies.py" \
  --count "$COUNT" \
  --start-year "$START_YEAR" \
  --output "$OUTPUT_JSON"

echo "Downloading posters and rewriting local paths..."
python3 "$ROOT_DIR/download_posters.py" \
  --input "$OUTPUT_JSON" \
  --csv "$CSV_FILE" \
  --output "$OUTPUT_JSON" \
  --posters-dir "$POSTERS_DIR" \
  --delay "$POSTER_DELAY"

echo "Syncing recommender CSV from the live JSON catalog..."
python3 "$ROOT_DIR/scripts/sync_movie_catalog.py" \
  --input "$OUTPUT_JSON" \
  --output "$CSV_FILE"

echo "Movie data pipeline complete."
echo "Output JSON: $OUTPUT_JSON"
echo "Posters directory: $POSTERS_DIR"
echo "Recommender CSV: $CSV_FILE"
