# 🎬 MoodFlix — Mood-Based Movie Recommendation System

A hybrid recommendation engine that combines **LLM mood understanding** with **ML content-based filtering** to suggest movies based on how you feel.

---

## ✨ Features

- **Mood Detection**: Free-text NLP classification + quick-select mood buttons
- **LLM Integration**: Interpret user emotions and expand them into recommendation intent
- **Hybrid Scoring**: Combines TF-IDF content similarity, collaborative filtering, and mood-genre mapping
- **Beautiful UI**: Dark-themed, responsive web interface with animated movie cards
- **Zero API Cost**: Works offline with keyword-based mood classifier (LLM optional)

---

## 🏗️ Architecture

```
User Input (Text or Button)
    ↓
LLM Module → Mood Category + Confidence + Genres
    ↓
Engine.py → Genre Filter → Content Scoring → CF Signal → Hybrid Rank
    ↓
Flask API → JSON Response
    ↓
Frontend → Animated Movie Cards
```

---

## 🚀 Quick Start

### 1. Clone / Download

```bash
cd mood-recommender
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the App

```bash
python app.py
```

### 5. Open Browser

Navigate to: **http://localhost:5000**

---

## 📁 Project Structure

```
mood-recommender/
├── app.py                 # Flask backend (API + routes)
├── engine.py              # Hybrid recommendation engine
├── llm_module.py          # Mood classifier (mock + real LLM)
├── requirements.txt       # Python dependencies
├── data/
│   ├── movies.csv         # 30 synthetic movies
│   └── ratings.csv        # 150 synthetic ratings
├── templates/
│   └── index.html         # Frontend UI
└── static/                # (optional: CSS/JS assets)
```

---

## 🔌 Using Real LLM (OpenAI)

1. Uncomment the LLM block in `llm_module.py`
2. Install OpenAI: `pip install openai`
3. Set your API key:
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```
4. Pass `use_llm=True` in the `classify_mood()` call inside `app.py`

---

## 🧪 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the web UI |
| `/api/recommend` | POST | Main recommendation endpoint |
| `/api/moods` | GET | Lists available moods + genre mapping |
| `/api/health` | GET | Health check |

### Example API Call

```bash
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel sad and want to cry", "user_id": 1, "top_n": 5}'
```

---

## 🎓 For College Projects

This project demonstrates:
- **NLP / LLM integration** for intent classification
- **Content-based filtering** using TF-IDF + Cosine Similarity
- **Collaborative filtering** signals from user rating history
- **Hybrid scoring** with weighted ensemble
- **Full-stack ML deployment** (Python backend + HTML/JS frontend)

**Innovation highlight**: The *mood-cluster centroid similarity* approach scores movies by their semantic proximity to the average vector of all movies in the target mood's genre cluster — a lightweight but effective semantic recommendation technique.

---

## 📜 License

MIT — Free for academic and personal use.

---

## 🎬 Live Movie Data Pipeline

To fetch fresh movie metadata from TMDb and download local posters in one step:

```bash
bash scripts/run_movie_pipeline.sh 1000 2020 movies_dataset.json data/movies.csv static/posters 0.08
```

If you want the defaults, you can also run:

```bash
bash scripts/run_movie_pipeline.sh
```

Before running, make sure `TMDB_API_KEY` is set in your shell or in a `.env` file at the project root.

The pipeline also syncs the fetched catalog into `data/movies.csv`, which is the file the recommendation engine reads.
