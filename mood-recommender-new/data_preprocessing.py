"""
data_preprocessing.py
==================
Prepare MovieLens + TMDB data for the MoodFlix engine.

Usage:
    python data_preprocessing.py --movielens path/to/ml-25m --tmdb path/to/tmdb_5000_movies.csv --output data/

Or use the synthetic data generator for quick testing.
"""
import pandas as pd
import numpy as np
import argparse
import os
import re


def clean_title(title):
    """Normalize movie titles for merging across datasets."""
    if pd.isna(title):
        return ""
    # Remove year in parentheses, extra whitespace
    title = re.sub(r"\s*\(\d{4}\)", "", title)
    return title.strip().lower()


def load_movielens(movies_path, ratings_path, min_ratings=20):
    """
    Load and clean MovieLens dataset.

    Args:
        movies_path: path to movies.csv (movieId, title, genres)
        ratings_path: path to ratings.csv (userId, movieId, rating, timestamp)
        min_ratings: keep movies with at least N ratings

    Returns:
        movies_df, ratings_df
    """
    print("📥 Loading MovieLens...")
    movies = pd.read_csv(movies_path)
    ratings = pd.read_csv(ratings_path)

    # Clean column names
    movies.rename(columns={"movieId": "id", "title": "title"}, inplace=True)
    ratings.rename(columns={"movieId": "movie_id", "userId": "user_id"}, inplace=True)

    # Filter movies with too few ratings (cold-start reduction)
    rating_counts = ratings.groupby("movie_id").size()
    keep_movies = rating_counts[rating_counts >= min_ratings].index
    movies = movies[movies["id"].isin(keep_movies)].copy()
    ratings = ratings[ratings["movie_id"].isin(keep_movies)].copy()

    # Normalize genres (pipe-separated → comma-separated)
    movies["genres"] = movies["genres"].str.replace("|", ",", regex=False)
    movies["genres"] = movies["genres"].replace("(no genres listed)", "Unknown")

    # Create clean_title for merging
    movies["clean_title"] = movies["title"].apply(clean_title)

    print(f"   Movies: {len(movies)} | Ratings: {len(ratings)} | Users: {ratings['user_id'].nunique()}")
    return movies, ratings


def load_tmdb(tmdb_path):
    """
    Load TMDB 5000 Movies dataset for overviews and keywords.

    Args:
        tmdb_path: path to tmdb_5000_movies.csv

    Returns:
        tmdb_df with columns: clean_title, overview, keywords, tagline
    """
    print("📥 Loading TMDB...")
    tmdb = pd.read_csv(tmdb_path)

    # Select relevant columns
    tmdb = tmdb[["title", "overview", "tagline", "keywords", "genres"]].copy()
    tmdb["clean_title"] = tmdb["title"].apply(clean_title)

    # Fill missing overviews with tagline or placeholder
    tmdb["overview"] = tmdb["overview"].fillna(tmdb["tagline"]).fillna("No description available.")
    tmdb["overview"] = tmdb["overview"].astype(str)

    # Simple deduplication: keep first occurrence of each clean_title
    tmdb = tmdb.drop_duplicates(subset=["clean_title"], keep="first")

    print(f"   TMDB records: {len(tmdb)}")
    return tmdb


def merge_datasets(ml_movies, tmdb):
    """
    Merge MovieLens with TMDB on clean_title.
    Falls back to MovieLens-only if TMDB not available.
    """
    print("🔗 Merging datasets...")
    merged = ml_movies.merge(tmdb[["clean_title", "overview"]], on="clean_title", how="left")

    # For movies without TMDB match, generate a synthetic overview from genres
    missing_mask = merged["overview"].isna()
    merged.loc[missing_mask, "overview"] = merged.loc[missing_mask, "genres"].apply(
        lambda g: f"A {g.replace(',', '/')} film."
    )

    # Drop helper column
    merged = merged.drop(columns=["clean_title"])

    # Ensure required columns
    merged = merged[["id", "title", "genres", "overview"]].copy()

    print(f"   Final catalog: {len(merged)} movies")
    return merged


def split_train_test(ratings_df, test_ratio=0.2, seed=42):
    """
    Split ratings into train/test for evaluation.
    Uses user-stratified split: each user keeps 80% in train.
    """
    np.random.seed(seed)
    ratings_df["split"] = "train"

    for user_id in ratings_df["user_id"].unique():
        user_mask = ratings_df["user_id"] == user_id
        user_idx = ratings_df[user_mask].index
        n_test = max(1, int(len(user_idx) * test_ratio))
        test_idx = np.random.choice(user_idx, size=n_test, replace=False)
        ratings_df.loc[test_idx, "split"] = "test"

    train = ratings_df[ratings_df["split"] == "train"].drop(columns=["split"])
    test = ratings_df[ratings_df["split"] == "test"].drop(columns=["split"])

    print(f"   Train: {len(train)} | Test: {len(test)}")
    return train, test


def generate_synthetic_data(output_dir, n_movies=200, n_users=50, ratings_per_user=20):
    """
    Generate synthetic dataset when real data is unavailable.
    Good for quick demos and college projects.
    """
    print("🎲 Generating synthetic data...")
    os.makedirs(output_dir, exist_ok=True)

    genres_pool = [
        "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
        "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
        "Romance", "Sci-Fi", "Thriller", "War", "Western"
    ]

    mood_templates = {
        "Drama": ["A powerful story about", "An emotional journey of", "The heartbreaking tale of"],
        "Comedy": ["Hilarious misadventures of", "A laugh-out-loud story about", "The funny life of"],
        "Action": ["High-octane thrills as", "Explosive action featuring", "An adrenaline rush with"],
        "Horror": ["Terrifying events surround", "A nightmare unfolds for", "Dark secrets haunt"],
        "Romance": ["Love blossoms between", "A passionate story of", "Two hearts collide when"],
        "Sci-Fi": ["In a distant future", "Technology changes everything for", "An otherworldly adventure of"],
        "Thriller": ["A deadly mystery engulfs", "Tension rises as", "Suspense grips"],
        "Animation": ["A magical animated world where", "Colorful characters including", "An enchanting tale of"]
    }

    movies = []
    for i in range(1, n_movies + 1):
        n_genres = np.random.randint(1, 4)
        genres = ", ".join(np.random.choice(genres_pool, n_genres, replace=False))
        primary = genres.split(", ")[0]
        template = np.random.choice(mood_templates.get(primary, ["A story about"]))
        overview = f"{template} character #{i} in a {primary.lower()} setting."
        movies.append({
            "id": i,
            "title": f"Movie {i}: The {primary} Chronicles",
            "genres": genres,
            "overview": overview
        })

    movies_df = pd.DataFrame(movies)
    movies_df.to_csv(os.path.join(output_dir, "movies.csv"), index=False)

    ratings = []
    for u in range(1, n_users + 1):
        rated = set()
        while len(rated) < ratings_per_user:
            m = np.random.randint(1, n_movies + 1)
            if m not in rated:
                rated.add(m)
                ratings.append({
                    "user_id": u,
                    "movie_id": m,
                    "rating": np.random.choice([1,2,3,4,5], p=[0.05,0.1,0.25,0.35,0.25])
                })

    ratings_df = pd.DataFrame(ratings)
    ratings_df.to_csv(os.path.join(output_dir, "ratings.csv"), index=False)

    print(f"   ✅ Synthetic: {n_movies} movies, {len(ratings)} ratings, {n_users} users")
    return movies_df, ratings_df


def main():
    parser = argparse.ArgumentParser(description="Preprocess movie data for MoodFlix")
    parser.add_argument("--movielens", help="Path to MovieLens folder (contains movies.csv, ratings.csv)")
    parser.add_argument("--tmdb", help="Path to tmdb_5000_movies.csv")
    parser.add_argument("--output", default="data", help="Output directory")
    parser.add_argument("--synthetic", action="store_true", help="Generate synthetic data instead")
    parser.add_argument("--min-ratings", type=int, default=20, help="Min ratings per movie")
    args = parser.parse_args()

    if args.synthetic:
        generate_synthetic_data(args.output)
        return

    if not args.movielens:
        print("❌ Error: Provide --movielens path or use --synthetic")
        return

    ml_movies, ml_ratings = load_movielens(
        os.path.join(args.movielens, "movies.csv"),
        os.path.join(args.movielens, "ratings.csv"),
        min_ratings=args.min_ratings
    )

    if args.tmdb:
        tmdb = load_tmdb(args.tmdb)
        final_movies = merge_datasets(ml_movies, tmdb)
    else:
        # No TMDB: use genre-based synthetic overviews
        final_movies = ml_movies.copy()
        final_movies["overview"] = final_movies["genres"].apply(
            lambda g: f"A {g.replace(',', '/')} film."
        )
        final_movies = final_movies[["id", "title", "genres", "overview"]]

    train_ratings, test_ratings = split_train_test(ml_ratings)

    os.makedirs(args.output, exist_ok=True)
    final_movies.to_csv(os.path.join(args.output, "movies.csv"), index=False)
    train_ratings.to_csv(os.path.join(args.output, "ratings.csv"), index=False)
    test_ratings.to_csv(os.path.join(args.output, "ratings_test.csv"), index=False)

    print(f"\n✅ Done! Files saved to {args.output}/")
    print("   movies.csv       → catalog")
    print("   ratings.csv      → train set")
    print("   ratings_test.csv → test set")


if __name__ == "__main__":
    main()
