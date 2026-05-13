# 📚 MoodFlix Training Guide

Complete guide to obtaining datasets, preprocessing, training, and evaluating the MoodFlix recommendation system.

---

## 1. Dataset Sources

### Option A: MovieLens 25M (Recommended)
The industry-standard movie rating dataset.

| Property | Value |
|----------|-------|
| Movies | ~62,000 |
| Ratings | ~25,000,000 |
| Users | ~162,000 |
| Size | ~250 MB compressed |

**Download:**
```bash
# Linux/macOS
wget https://files.grouplens.org/datasets/movielens/ml-25m.zip
unzip ml-25m.zip

# Or visit: https://grouplens.org/datasets/movielens/25m/
```

**Files you need:**
- `ml-25m/movies.csv` — movieId, title, genres
- `ml-25m/ratings.csv` — userId, movieId, rating, timestamp

---

### Option B: MovieLens Latest Small (Fast, for laptops)
```bash
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip
```
- ~9,000 movies, ~100,000 ratings
- Perfect for college projects

---

### Option C: TMDB 5000 Movies (For Overviews)
Provides movie descriptions, keywords, and metadata.

**Download:**
```bash
wget https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata/download -O tmdb.zip
# Or manually from: https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata
```

**File needed:**
- `tmdb_5000_movies.csv` — title, overview, genres, keywords, tagline

> **Note:** TMDB requires a Kaggle account. Alternatively, use the **synthetic data generator** built into this project.

---

### Option D: Synthetic Data (Zero download, instant)
Built into `data_preprocessing.py`. Great for:
- Quick prototyping
- Demos without internet
- Understanding the pipeline

---

## 2. Data Preprocessing

### Using Real Data (MovieLens + TMDB)

```bash
python data_preprocessing.py \
    --movielens ./ml-25m \
    --tmdb ./tmdb_5000_movies.csv \
    --output ./data \
    --min-ratings 50
```

**What this does:**
1. Loads MovieLens movies + ratings
2. Removes movies with <50 ratings (reduces cold-start noise)
3. Merges with TMDB to get movie overviews
4. Generates synthetic overviews for unmatched movies
5. Splits ratings into 80% train / 20% test (user-stratified)
6. Outputs:
   - `data/movies.csv` — catalog with overviews
   - `data/ratings.csv` — training ratings
   - `data/ratings_test.csv` — test ratings

### Using Synthetic Data Only

```bash
python data_preprocessing.py --synthetic --output ./data
```

Generates 200 movies, 50 users, 20 ratings each — ready in 1 second.

---

## 3. Training Pipeline

### Run Full Training

```bash
python train_models.py --data ./data --output ./models
```

**Output files in `models/`:**

| File | Description | Size |
|------|-------------|------|
| `vectorizer.pkl` | Trained TF-IDF vectorizer | ~2 MB |
| `tfidf_matrix.npy` | Document-term matrix | ~50 MB |
| `cosine_sim.npy` | Pairwise similarity matrix | ~100 MB |
| `svd_model.pkl` | TruncatedSVD model | ~1 MB |
| `user_factors.npy` | User latent vectors | ~500 KB |
| `movie_factors.npy` | Movie latent vectors | ~500 KB |
| `mood_coverage.json` | Genre coverage per mood | ~1 KB |
| `training_config.json` | Full training metadata | ~2 KB |

### What Gets Trained

#### 3.1 TF-IDF Content Model
```python
TfidfVectorizer(
    stop_words="english",
    max_features=500,
    ngram_range=(1, 2),   # unigrams + bigrams
    min_df=2,             # term must appear in ≥2 movies
    max_df=0.8            # ignore terms in >80% of movies
)
```
- **Input:** Movie overviews (text descriptions)
- **Output:** 500-dimensional sparse vectors per movie
- **Similarity:** Cosine similarity between all movie pairs

#### 3.2 Collaborative Filtering (SVD)
```python
TruncatedSVD(n_components=50)
```
- **Input:** User × Movie rating matrix (sparse)
- **Output:** 
  - 50-dim user latent vectors
  - 50-dim movie latent vectors
- **Interpretation:** Each component captures a "taste dimension" (e.g., action-vs-drama, old-vs-new)

#### 3.3 Mood-Genre Mapping
Curated domain knowledge (no training needed):
```python
mood_map = {
    "happy":    ["Comedy", "Animation", "Adventure", "Family"],
    "sad":      ["Drama", "Romance", "Music"],
    "excited":  ["Action", "Thriller", "Adventure", "Sci-Fi"],
    ...
}
```
Validation checks that each mood has ≥5% movie coverage.

---

## 4. Understanding the Hybrid Score

For each candidate movie, the final score is:

```
Score = 0.60 × ContentSim + 0.25 × CF_Signal + 0.15 × GenreMatch
```

| Component | How it works |
|-----------|-------------|
| **ContentSim** | Cosine similarity to the "mood centroid" (average vector of all movies in the target mood's genre cluster) |
| **CF_Signal** | Average cosine similarity to movies the user rated ≥4 |
| **GenreMatch** | Exact genre overlap count × 0.05 |

---

## 5. Evaluation Metrics

The training script computes **Hit Ratio @ K**:

> *"Of all the movies a user actually rated in the test set, what percentage appear in the top-K recommendations?"*

```
HR@10 = (# test movies in top-10) / (# total test movies)
```

**Typical results:**
- Random baseline: ~1-2%
- Content-only: ~8-12%
- Hybrid (this system): ~15-25%

**Why not RMSE?** 
We generate ranked lists, not rating predictions. Hit Ratio better reflects recommendation quality.

---

## 6. Retraining on New Data

### Adding New Ratings

1. Append new ratings to `data/ratings.csv`
2. Re-run:
   ```bash
   python train_models.py --data ./data --output ./models
   ```
3. Restart Flask app — it loads fresh models on startup

### Adding New Movies

1. Append to `data/movies.csv` with id, title, genres, overview
2. Re-run preprocessing + training
3. The TF-IDF vectorizer will be re-fit on the new corpus

---

## 7. Using Real LLM for Mood Classification

The default `llm_module.py` uses a **zero-cost keyword classifier**.

To upgrade to **OpenAI GPT-3.5/4**:

### Step 1: Install
```bash
pip install openai
```

### Step 2: Set API Key
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

### Step 3: Enable in Code
In `llm_module.py`, uncomment the LLM block and in `app.py` pass `use_llm=True`:

```python
analysis = classify_mood(user_text, use_llm=True)
```

### Cost Estimate
- ~500 tokens per request
- GPT-3.5-turbo: ~$0.0015 per recommendation
- For a college demo with 100 requests: ~$0.15

---

## 8. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `MemoryError` during TF-IDF | Dataset too large | Use `ml-latest-small` or increase RAM |
| `cosine_sim.npy` is huge (GBs) | 62k movies → 62k×62k matrix | Use sparse matrices or sample top-1000 candidates before similarity |
| Low Hit Ratio | Too few ratings per user | Increase `--min-ratings` threshold or use larger dataset |
| Missing overviews | No TMDB match | Check that titles match after cleaning; use `--synthetic` fallback |
| Slow recommendations | Computing full cosine sim every time | Pre-compute and cache; use approximate nearest neighbors (Annoy/FAISS) |

---

## 9. Advanced: Training Your Own Mood Classifier

Instead of keyword matching or paid LLM, train a **text classification model**:

### Dataset: GoEmotions (Google)
```bash
pip install datasets
python -c "from datasets import load_dataset; load_dataset('go_emotions').save_to_disk('goemotions')"
```

### Fine-tune DistilBERT
```python
from transformers import DistilBertForSequenceClassification, Trainer

model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased", 
    num_labels=8  # your 8 moods
)
# Train on GoEmotions mapped to your mood categories
# ...
```

This gives you a **free, local, deep-learning mood classifier** that runs in ~100ms on CPU.

---

## 10. Quick Reference Cheat Sheet

```bash
# 1. Get data
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip

# 2. Preprocess
python data_preprocessing.py \
    --movielens ./ml-latest-small \
    --output ./data \
    --min-ratings 5

# 3. Train
python train_models.py --data ./data --output ./models

# 4. Run app
python app.py

# 5. Open browser → http://localhost:5000
```

**Total time:** ~5 minutes from download to running app.
