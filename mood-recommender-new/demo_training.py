"""
demo_training.py
================
A walkthrough of the entire training pipeline using synthetic data.
Run this to see exactly what happens under the hood.

Usage:
    python demo_training.py
"""
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
import json

print("=" * 60)
print("🎓 MOODFLIX TRAINING DEMO")
print("=" * 60)

# --------------------------------------------------------------
# STEP 1: Load Data
# --------------------------------------------------------------
print("\n📥 STEP 1: Loading data...")
movies = pd.read_csv("data/movies.csv")
ratings = pd.read_csv("data/ratings.csv")

print(f"   Movies: {len(movies)}")
print(f"   Ratings: {len(ratings)}")
print(f"   Users: {ratings['user_id'].nunique()}")
print(f"\n   Sample movie:")
print(f"   → {movies.iloc[0]['title']} ({movies.iloc[0]['genres']})")
print(f"   → {movies.iloc[0]['overview'][:80]}...")

# --------------------------------------------------------------
# STEP 2: Train TF-IDF
# --------------------------------------------------------------
print("\n🔧 STEP 2: Training TF-IDF Content Model...")
movies["overview"] = movies["overview"].fillna("")

vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
tfidf_matrix = vectorizer.fit_transform(movies["overview"])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

print(f"   Vocabulary size: {len(vectorizer.vocabulary_)}")
print(f"   TF-IDF matrix shape: {tfidf_matrix.shape}")
print(f"   Cosine similarity matrix shape: {cosine_sim.shape}")

# Show top terms for a sample movie
feature_names = vectorizer.get_feature_names_out()
sample_vec = tfidf_matrix[0].toarray().flatten()
top_indices = sample_vec.argsort()[-10:][::-1]
print(f"\n   Top TF-IDF terms for '{movies.iloc[0]['title']}':")
for idx in top_indices:
    if sample_vec[idx] > 0:
        print(f"     • {feature_names[idx]}: {sample_vec[idx]:.4f}")

# --------------------------------------------------------------
# STEP 3: Train Collaborative Filtering (SVD)
# --------------------------------------------------------------
print("\n🔧 STEP 3: Training Collaborative Filtering (SVD)...")

rating_matrix = ratings.pivot_table(
    index="user_id", columns="movie_id", values="rating"
).fillna(0)

svd = TruncatedSVD(n_components=10, random_state=42)  # 10 for demo speed
user_factors = svd.fit_transform(rating_matrix)

print(f"   Rating matrix: {rating_matrix.shape}")
print(f"   User factors: {user_factors.shape}")
print(f"   Explained variance: {sum(svd.explained_variance_ratio_)*100:.1f}%")

# Show a user's taste profile
sample_user = rating_matrix.index[0]
user_vec = user_factors[0]
print(f"\n   User {sample_user} latent vector (first 5 dims):")
for i, v in enumerate(user_vec[:5]):
    print(f"     Component {i+1}: {v:.3f}")

# --------------------------------------------------------------
# STEP 4: Mood Mapping Validation
# --------------------------------------------------------------
print("\n🔧 STEP 4: Validating Mood-Genre Mapping...")

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

for mood, genres in mood_map.items():
    target = set(genres)
    mask = movies["genres"].apply(lambda g: len(set(g.split(",")) & target) > 0)
    count = mask.sum()
    pct = count / len(movies) * 100
    bar = "█" * int(pct / 2)
    print(f"   {mood:12s}: {count:3d} movies ({pct:5.1f}%) {bar}")

# --------------------------------------------------------------
# STEP 5: Simulate a Recommendation
# --------------------------------------------------------------
print("\n🎯 STEP 5: Simulating Recommendation...")

user_text = "I feel sad and want something emotional"
mood = "sad"
target_genres = set(mood_map[mood])

# Filter candidates
mask = movies["genres"].apply(lambda g: len(set(g.split(",")) & target_genres) > 0)
candidates = movies[mask].index.tolist()

print(f"   Mood: {mood}")
print(f"   Target genres: {target_genres}")
print(f"   Candidate movies: {len(candidates)}")

# Score top 5
scores = {}
for idx in candidates:
    sc = cosine_sim[idx, candidates].mean() * 0.6
    g = set(movies.loc[idx, "genres"].split(","))
    sc += 0.05 * len(g & target_genres)
    scores[idx] = sc

top5 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:5]

print(f"\n   Top 5 Recommendations:")
for rank, (idx, sc) in enumerate(top5, 1):
    title = movies.loc[idx, "title"]
    genres = movies.loc[idx, "genres"]
    print(f"   {rank}. {title} ({genres}) — Score: {sc:.3f}")

# --------------------------------------------------------------
# Done
# --------------------------------------------------------------
print("\n" + "=" * 60)
print("✅ DEMO COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("  1. Run 'python train_models.py' for full training")
print("  2. Run 'python app.py' to start the web app")
