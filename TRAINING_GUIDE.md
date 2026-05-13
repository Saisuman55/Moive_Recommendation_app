# MoodFlix — Training Guide

## Overview

MoodFlix is a **hybrid AI movie recommendation system** that combines three ML components:
1. **TF-IDF Content-Based Filtering** — semantic similarity from plot descriptions
2. **SVD Collaborative Filtering** — latent taste patterns from user ratings
3. **Mood-Genre Mapping** — curated domain knowledge linking emotions to genres

The final recommendation score is a weighted ensemble:
```
Score = 0.60 × ContentSim + 0.25 × CF_Signal + 0.15 × GenreMatch
```

---

## Quick Start (5 minutes)

```bash
# 1. Generate synthetic data (or use real datasets — see below)
python data_preprocessing.py --synthetic --output ./data

# 2. Train all models
python train_models.py --data ./data --output ./models

# 3. Run the training demo (optional — shows what happens step by step)
python demo_training.py

# 4. Start the app
python app.py

# 5. Open http://localhost:5001
```

---

## Datasets

### Option A: MovieLens (Recommended)
Download from https://grouplens.org/datasets/movielens/

| Version | Movies | Ratings | Size |
|---------|--------|---------|------|
| ml-latest-small | ~9,000 | 100K | 1 MB |
| ml-25m | ~62,000 | 25M | 250 MB |

```bash
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip
python data_preprocessing.py --movielens ./ml-latest-small --output ./data
```

### Option B: TMDB (Movie Descriptions)
Download from https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata

```bash
python data_preprocessing.py \
    --movielens ./ml-latest-small \
    --tmdb ./tmdb_5000_movies.csv \
    --output ./data
```

### Option C: Synthetic (Built-in)
```bash
python data_preprocessing.py --synthetic --output ./data
```

---

## Training Pipeline

### Component 1: TF-IDF Content Model
- **Input:** Movie plot overviews
- **Process:** TfidfVectorizer → cosine similarity matrix
- **Output:** 500-dim sparse vectors per movie
- **Saved:** `models/vectorizer.pkl`, `models/cosine_sim.npy`

### Component 2: Collaborative Filtering (SVD)
- **Input:** User × Movie rating matrix
- **Process:** TruncatedSVD decomposition (50 components)
- **Output:** User and movie latent factor vectors
- **Saved:** `models/svd_model.pkl`, `models/user_factors.npy`

### Component 3: Mood-Genre Mapping
- **Input:** Curated mood → genre associations
- **Process:** Validates genre coverage per mood
- **Saved:** `models/mood_coverage.json`

---

## Evaluation

The pipeline evaluates using **Hit Ratio @ 10**:
> "If we recommend 10 movies for a user's mood, how often does an actual rated movie appear?"

| Method | Typical Hit Ratio |
|--------|------------------|
| Random | ~1% |
| Content-only | ~8-12% |
| **Hybrid (this system)** | **~15-25%** |

---

## File Structure

```
mood-recommender/
├── app.py                  # Flask backend
├── engine.py               # Hybrid recommendation engine
├── llm_module.py           # Mood classifier (mock + OpenAI)
├── data_preprocessing.py   # Data pipeline
├── train_models.py         # Full training pipeline
├── demo_training.py        # Step-by-step walkthrough
├── requirements.txt        # Dependencies
├── data/
│   ├── movies.csv          # Movie catalog
│   ├── ratings.csv         # Training ratings
│   └── ratings_test.csv    # Test ratings
├── models/                 # Trained artifacts (after training)
├── static/
│   ├── style.css           # Premium UI styles
│   └── app.js              # Frontend logic
└── templates/
    └── index.html          # Main page
```

---

## Retraining

Append new ratings to `data/ratings.csv` and re-run:
```bash
python train_models.py --data ./data --output ./models
```

The Flask app loads everything fresh on startup.
