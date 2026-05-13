"""
train_models.py
==============
Train all components of the MoodFlix recommendation system.

Components:
  1. TF-IDF Content Model (on movie overviews)
  2. Collaborative Filtering baseline (SVD)
  3. Mood-Genre mapping validation
  4. Evaluation on test set

Usage:
    python train_models.py --data data/ --output models/
"""
import pandas as pd
import numpy as np
import os
import json
import argparse
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import mean_squared_error, mean_absolute_error


def train_tfidf(movies_df, max_features=500, output_dir="models"):
    """
    Train TF-IDF vectorizer on movie overviews.
    Saves: vectorizer.pkl, tfidf_matrix.npy, cosine_sim.npy
    """
    print("\n🔧 [1/4] Training TF-IDF Content Model...")
    os.makedirs(output_dir, exist_ok=True)

    movies_df["overview"] = movies_df["overview"].fillna("")

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=max_features,
        ngram_range=(1, 2),      # unigrams + bigrams
        min_df=2,                # ignore terms in <2 docs
        max_df=0.8               # ignore terms in >80% docs
    )

    tfidf_matrix = vectorizer.fit_transform(movies_df["overview"])
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Save
    with open(os.path.join(output_dir, "vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)
    np.save(os.path.join(output_dir, "tfidf_matrix.npy"), tfidf_matrix.toarray())
    np.save(os.path.join(output_dir, "cosine_sim.npy"), cosine_sim)

    print(f"   Features: {tfidf_matrix.shape[1]}")
    print(f"   Matrix shape: {tfidf_matrix.shape}")
    print(f"   Saved to {output_dir}/")
    return vectorizer, tfidf_matrix, cosine_sim


def train_collaborative_filtering(ratings_df, n_components=50, output_dir="models"):
    """
    Train SVD-based collaborative filtering.
    Creates user/movie latent factor matrices.
    Saves: svd_model.pkl, user_factors.npy, movie_factors.npy
    """
    print("\n🔧 [2/4] Training Collaborative Filtering (SVD)...")

    # Build user-movie rating matrix
    rating_matrix = ratings_df.pivot_table(
        index="user_id", columns="movie_id", values="rating"
    ).fillna(0)

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(rating_matrix)

    # Movie factors = how each movie loads on each component
    movie_factors = svd.components_.T

    # Map movie_ids to matrix indices
    movie_id_to_idx = {mid: i for i, mid in enumerate(rating_matrix.columns)}

    with open(os.path.join(output_dir, "svd_model.pkl"), "wb") as f:
        pickle.dump(svd, f)
    np.save(os.path.join(output_dir, "user_factors.npy"), user_factors)
    np.save(os.path.join(output_dir, "movie_factors.npy"), movie_factors)
    with open(os.path.join(output_dir, "movie_id_map.json"), "w") as f:
        json.dump(movie_id_to_idx, f)

    explained = sum(svd.explained_variance_ratio_) * 100
    print(f"   Components: {n_components}")
    print(f"   Variance explained: {explained:.1f}%")
    print(f"   Users: {len(rating_matrix)} | Movies: {len(rating_matrix.columns)}")
    return svd, user_factors, movie_factors, movie_id_to_idx


def validate_mood_mapping(movies_df, mood_map, output_dir="models"):
    """
    Validate that each mood has sufficient movie coverage.
    Saves: mood_coverage.json
    """
    print("\n🔧 [3/4] Validating Mood-Genre Mapping...")

    coverage = {}
    for mood, genres in mood_map.items():
        target = set(genres)
        mask = movies_df["genres"].apply(
            lambda g: len({s.strip() for s in g.split(",") if s.strip()} & target) > 0
        )
        count = mask.sum()
        coverage[mood] = {
            "movies_count": int(count),
            "percentage": round(count / len(movies_df) * 100, 1),
            "genres": genres
        }
        print(f"   {mood:12s}: {count:4d} movies ({coverage[mood]['percentage']:5.1f}%)")

    with open(os.path.join(output_dir, "mood_coverage.json"), "w") as f:
        json.dump(coverage, f, indent=2)

    # Warn if any mood has <5% coverage
    low_coverage = [m for m, d in coverage.items() if d["percentage"] < 5]
    if low_coverage:
        print(f"   ⚠️  Low coverage moods: {low_coverage}")

    return coverage


def evaluate_hybrid(movies_df, ratings_train, ratings_test, cosine_sim, mood_map, top_n=10):
    print("\n🔧 [4/4] Evaluating Hybrid Model...")

    movie_indices = pd.Series(movies_df.index, index=movies_df["id"]).drop_duplicates()

    hits = 0
    total = 0

    test_users = ratings_test["user_id"].unique()[:100]

    for user_id in test_users:
        user_test = ratings_test[ratings_test["user_id"] == user_id]
        user_train = ratings_train[ratings_train["user_id"] == user_id]

        if len(user_train) < 3:
            continue

        liked_train = user_train[user_train["rating"] >= 4]["movie_id"].tolist()
        liked_idx = [movie_indices[mid] for mid in liked_train if mid in movie_indices.index]

        for _, row in user_test.iterrows():
            target_movie = row["movie_id"]
            if target_movie not in movie_indices.index:
                continue

            target_idx = movie_indices[target_movie]

            target_genres = {g.strip() for g in movies_df.loc[target_idx, "genres"].split(",") if g.strip()}
            best_mood = "chill"
            best_overlap = 0
            for mood, genres in mood_map.items():
                overlap = len(target_genres & set(genres))
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_mood = mood

            target_mood_genres = set(mood_map[best_mood])
            mask = movies_df["genres"].apply(
                lambda g: len({s.strip() for s in g.split(",") if s.strip()} & target_mood_genres) > 0
            )
            candidates = movies_df[mask].index.tolist()
            if not candidates:
                candidates = movies_df.index.tolist()

            scores = {}
            for idx in candidates:
                sc = 0
                if len(candidates) > 1:
                    sc += cosine_sim[idx, candidates].mean() * 0.6
                else:
                    sc += 0.6
                if liked_idx:
                    sc += cosine_sim[idx, liked_idx].mean() * 0.25
                g = {s.strip() for s in movies_df.loc[idx, "genres"].split(",") if s.strip()}
                sc += 0.05 * len(g & target_mood_genres)
                scores[idx] = sc

            top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
            top_ids = [movies_df.loc[i, "id"] for i, _ in top]

            if target_movie in top_ids:
                hits += 1
            total += 1

    hit_ratio = hits / total if total > 0 else 0
    print(f"   Test users sampled: {len(test_users)}")
    print(f"   Evaluated pairs: {total}")
    print(f"   Hit Ratio @ {top_n}: {hit_ratio:.3f} ({hits}/{total})")
    print(f"   Interpretation: {(hit_ratio*100):.1f}% of test movies were recommended in top-{top_n}")

    return {"hit_ratio_at_k": hit_ratio, "k": top_n, "evaluated": total}


def main():
    parser = argparse.ArgumentParser(description="Train MoodFlix models")
    parser.add_argument("--data", default="data", help="Data directory")
    parser.add_argument("--output", default="models", help="Models output directory")
    parser.add_argument("--svd-components", type=int, default=50, help="SVD latent dimensions")
    parser.add_argument("--tfidf-features", type=int, default=500, help="TF-IDF max features")
    args = parser.parse_args()

    # Load data
    movies = pd.read_csv(os.path.join(args.data, "movies.csv"))
    ratings = pd.read_csv(os.path.join(args.data, "ratings.csv"))

    test_path = os.path.join(args.data, "ratings_test.csv")
    if os.path.exists(test_path):
        ratings_test = pd.read_csv(test_path)
    else:
        print("⚠️  No test set found. Using 20% of train as test.")
        from sklearn.model_selection import train_test_split
        ratings, ratings_test = train_test_split(ratings, test_size=0.2, random_state=42)

    # Mood map (same as engine)
    mood_map = {
        "happy": ["Comedy", "Animation", "Adventure", "Family"],
        "sad": ["Drama", "Romance", "Music"],
        "excited": ["Action", "Thriller", "Adventure", "Sci-Fi"],
        "chill": ["Documentary", "Drama", "Romance", "Comedy"],
        "romantic": ["Romance", "Drama", "Comedy"],
        "angry": ["Action", "Crime", "Thriller"],
        "scared": ["Horror", "Thriller", "Mystery"],
        "nostalgic": ["Animation", "Family", "Fantasy", "Drama"]
    }

    # Train
    vectorizer, tfidf_matrix, cosine_sim = train_tfidf(
        movies, max_features=args.tfidf_features, output_dir=args.output
    )

    svd, user_factors, movie_factors, movie_id_map = train_collaborative_filtering(
        ratings, n_components=args.svd_components, output_dir=args.output
    )

    coverage = validate_mood_mapping(movies, mood_map, output_dir=args.output)

    metrics = evaluate_hybrid(
        movies, ratings, ratings_test, cosine_sim, mood_map, top_n=10
    )

    # Save config
    config = {
        "tfidf_features": args.tfidf_features,
        "svd_components": args.svd_components,
        "movies": len(movies),
        "ratings_train": len(ratings),
        "ratings_test": len(ratings_test),
        "mood_coverage": coverage,
        "evaluation": metrics
    }
    with open(os.path.join(args.output, "training_config.json"), "w") as f:
        json.dump(config, f, indent=2)

    print("\n✅ All models trained and saved!")
    print(f"   Output: {args.output}/")
    print("   Files: vectorizer.pkl, tfidf_matrix.npy, cosine_sim.npy,")
    print("          svd_model.pkl, user_factors.npy, movie_factors.npy,")
    print("          mood_coverage.json, training_config.json")


if __name__ == "__main__":
    main()
