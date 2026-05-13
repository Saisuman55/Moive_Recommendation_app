#!/usr/bin/env bash
# Usage:
#   ./add_movies.sh                        # fetch 100 new movies from 2020+
#   ./add_movies.sh 200 2023               # fetch 200 movies from 2023+
#   ./add_movies.sh 500 2015               # fetch 500 movies from 2015+

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COUNT="${1:-100}"
START_YEAR="${2:-2020}"

# Load .env
if [[ -f "$ROOT_DIR/.env" ]]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

if [[ -z "${TMDB_API_KEY:-}" ]]; then
  echo "❌ TMDB_API_KEY not set in .env"
  exit 1
fi

echo "🎬 Fetching $COUNT movies from $START_YEAR+ via TMDb..."
python3 "$ROOT_DIR/enrich_movies.py" \
  --count "$COUNT" \
  --start-year "$START_YEAR" \
  --output "$ROOT_DIR/movies_dataset.json"

echo "📊 Syncing recommender CSV..."
python3 "$ROOT_DIR/scripts/sync_movie_catalog.py" \
  --input "$ROOT_DIR/movies_dataset.json" \
  --output "$ROOT_DIR/data/movies.csv"

TOTAL=$(python3 -c "import json; d=json.load(open('$ROOT_DIR/movies_dataset.json')); print(len(d))")
echo "✅ Catalog now has $TOTAL movies"

echo "🚀 Pushing to GitHub (Render will auto-deploy)..."
cd "$ROOT_DIR"
git add movies_dataset.json data/movies.csv
git commit -m "Add new movies: $TOTAL total (fetched $COUNT from $START_YEAR+)"
git push origin main

echo ""
echo "✅ Done! Render will redeploy in ~2 minutes."
echo "   Check: https://moive-recommendation-app.onrender.com/api/health"
