
import argparse
import json
import os
import time

import requests
from dotenv import load_dotenv


BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_W500 = "https://image.tmdb.org/t/p/w500"
IMAGE_BASE_W185 = "https://image.tmdb.org/t/p/w185"
IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original"
TARGET_LANGUAGES = ["hi", "te", "ta", "ml", "kn", "or"]


def _tmdb_get(session, endpoint, api_key, **params):
    url = f"{BASE_URL}{endpoint}"
    query = {"api_key": api_key, **params}

    try:
        response = session.get(url, params=query, timeout=20)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        print(f"TMDb request failed for {endpoint}: {exc}")
        return None


def _first_youtube_trailer(videos_payload):
    for video in videos_payload.get("results", []):
        if video.get("type") == "Trailer" and video.get("site") == "YouTube":
            key = video.get("key")
            if key:
                return f"https://www.youtube.com/watch?v={key}"
    return None


def _build_movie_entry(detail):
    poster_path = detail.get("poster_path")
    backdrop_path = detail.get("backdrop_path")
    release_date = detail.get("release_date") or ""
    runtime = detail.get("runtime")

    return {
        "id": detail.get("id"),
        "title": detail.get("title"),
        "poster": f"{IMAGE_BASE_W500}{poster_path}" if poster_path else None,
        "backdrop": f"{IMAGE_BASE_ORIGINAL}{backdrop_path}" if backdrop_path else None,
        "rating": detail.get("vote_average"),
        "genres": [genre.get("name") for genre in detail.get("genres", []) if genre.get("name")],
        "year": release_date[:4] if release_date else "N/A",
        "runtime": f"{runtime} min" if runtime else "N/A",
        "overview": detail.get("overview"),
        "cast": [
            {
                "name": cast_member.get("name"),
                "character": cast_member.get("character"),
                "image": (
                    f"{IMAGE_BASE_W185}{cast_member.get('profile_path')}"
                    if cast_member.get("profile_path")
                    else None
                ),
            }
            for cast_member in detail.get("credits", {}).get("cast", [])[:8]
        ],
        "trailer_url": _first_youtube_trailer(detail.get("videos", {})),
        "language": detail.get("original_language"),
    }


def get_indian_movies(
    count=1000,
    start_year=2020,
    output_file="movies_dataset.json",
    sleep_seconds=0.25,
    max_pages=500,
):
    # Load variables from a local .env if present.
    load_dotenv()
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        raise ValueError("Set TMDB_API_KEY in your environment or .env before running this script.")

    session = requests.Session()
    movies_list = []
    seen_ids = set()

    print(f"Starting data fetch for {count} Indian movies...")

    page = 1
    while len(movies_list) < count and page <= max_pages:
        for language in TARGET_LANGUAGES:
            discover_payload = _tmdb_get(
                session,
                "/discover/movie",
                api_key,
                region="IN",
                include_adult="false",
                sort_by="popularity.desc",
                page=page,
                with_original_language=language,
                **{"primary_release_date.gte": f"{start_year}-01-01"},
            )

            if not discover_payload or "results" not in discover_payload:
                continue

            for movie in discover_payload["results"]:
                movie_id = movie.get("id")
                if not movie_id or movie_id in seen_ids:
                    continue

                detail_payload = _tmdb_get(
                    session,
                    f"/movie/{movie_id}",
                    api_key,
                    append_to_response="credits,videos",
                )
                if not detail_payload:
                    continue

                movies_list.append(_build_movie_entry(detail_payload))
                seen_ids.add(movie_id)

                if len(movies_list) >= count:
                    break

                time.sleep(sleep_seconds)

            if len(movies_list) >= count:
                break

        print(f"Progress: {len(movies_list)}/{count}...")
        page += 1

    with open(output_file, "w", encoding="utf-8") as file_obj:
        json.dump(movies_list, file_obj, indent=2, ensure_ascii=False)

    print(f"Successfully created {output_file} with {len(movies_list)} movies")


def main():
    parser = argparse.ArgumentParser(description="Fetch Indian movie metadata from TMDb")
    parser.add_argument("--count", type=int, default=1000, help="Number of movies to fetch")
    parser.add_argument("--start-year", type=int, default=2020, help="Earliest release year to include")
    parser.add_argument(
        "--output",
        type=str,
        default="movies_dataset.json",
        help="Output JSON file path",
    )
    args = parser.parse_args()

    get_indian_movies(count=args.count, start_year=args.start_year, output_file=args.output)


if __name__ == "__main__":
    main()
