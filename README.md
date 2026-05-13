# MoodFlix

MoodFlix is an AI-powered movie recommendation platform that suggests films based on how a user feels. Instead of only browsing by title or genre, users can enter a mood, use quick mood choices, explore a cinematic catalog, save movies to a watchlist, rate films, and receive personalized recommendations from a hybrid recommendation engine.

The project is built as a full-stack ML demo with a Flask web app, trained recommendation artifacts, optional MongoDB persistence, and a movie catalog pipeline.

## Features

- Mood-based movie recommendations from text input or selected mood
- Hybrid recommendation engine using content similarity, collaborative signals, and mood-to-genre mapping
- TF-IDF and cosine similarity over movie overviews
- Optional user-rating signal for personalization
- AI mood scanner UI with camera/mood detection scripts
- Search, genre browsing, movie detail pages, trailers, trending, regional, profile, settings, and watchlist pages
- MongoDB-backed APIs for users, mood scans, ratings, reviews, preferences, and watchlists
- CSV fallback mode when MongoDB is not configured
- TMDb-powered catalog enrichment and poster download pipeline
- Offline-friendly mood classifier, with optional OpenAI integration path

## Tech Stack

- Python, Flask, Flask-CORS
- Pandas, NumPy, scikit-learn
- MongoDB with PyMongo, optional
- HTML, CSS, JavaScript templates
- Node/Express and React/Next.js companion app folders
- TMDb data pipeline scripts

## How It Works

```text
User mood input or mood scan
        |
        v
Mood classifier -> mood category, confidence, preferred genres
        |
        v
Recommendation engine
  - genre candidate filtering
  - TF-IDF content similarity
  - collaborative rating signal
  - exact genre match bonus
        |
        v
Ranked movie recommendations
        |
        v
Flask API + cinematic web UI
```

The main recommendation score follows this idea:

```text
Score = content similarity + collaborative signal + mood/genre relevance
```

In the core engine, candidates are selected from mood-compatible genres, ranked by similarity to the mood cluster, and optionally boosted using a user's liked movies.

## Project Structure

```text
.
|-- app.py                         # Main Flask app, pages, and API routes
|-- engine.py                      # Hybrid mood recommendation engine
|-- llm_module.py                  # Offline mood classifier and optional LLM path
|-- db_mongo.py                    # MongoDB connection and mood mappings
|-- api_mongo.py                   # MongoDB helper functions
|-- models.py                      # MongoDB document helper models
|-- data/
|   |-- movies.csv                 # Movie catalog used by the engine
|   `-- ratings.csv                # Ratings used for collaborative signals
|-- models/                        # Trained ML artifacts
|-- static/                        # CSS, JS, poster images, mood scanner assets
|-- templates/                     # Flask HTML templates
|-- scripts/                       # Training, deployment, and catalog sync scripts
|-- mood-app-database/             # Separate Node/Mongo database service prototype
|-- movie-app/                     # Next.js movie app prototype
|-- frontend/                      # React frontend prototype
`-- backend/                       # Express backend prototype
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd antigravity
```

### 2. Create a Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

On Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

The app runs without MongoDB by using local CSV files. To enable MongoDB-backed user data, create a `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mood_app
MONGODB_DB=mood_app
```

For the TMDb catalog pipeline:

```env
TMDB_API_KEY=your_tmdb_api_key
```

For optional OpenAI mood classification, install `openai`, set `OPENAI_API_KEY`, and enable the LLM path in `llm_module.py`.

### 5. Run the App

```bash
python app.py
```

Open:

```text
http://localhost:5001
```

## App Working

The app was tested locally on `http://localhost:5001`. The health endpoint returned a successful response with 1000 movies loaded and MongoDB enabled:

```json
{
  "catalog_size": 1000,
  "mongodb": true,
  "movies_loaded": 1000,
  "status": "ok"
}
```

### Home Page

![MoodFlix home page](docs/screenshots/home.png)

### AI Mood Scanner

![MoodFlix AI mood scanner](docs/screenshots/mood-ai.png)

### Mood Recommendations

![MoodFlix recommendations page](docs/screenshots/recommendations.png)

## Main Pages

- `/` - Landing page
- `/dashboard` - Movie discovery dashboard
- `/mood-ai` - AI mood scanner experience
- `/recommendations?mood=happy` - Mood-based recommendations
- `/search` - Search and filter movies
- `/genre/<genre>` - Genre pages
- `/movie/<movie-slug>` - Movie detail page
- `/watchlist` - Watchlist view
- `/profile` - User profile and activity
- `/community` - Seeded user/review discovery

## API Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/health` | GET | Health check and catalog status |
| `/api/recommend` | POST | Generate mood-based recommendations |
| `/api/moods` | GET | List supported moods and genre mappings |
| `/api/model-status` | GET | Mood model asset status |
| `/api/mood/scan` | POST | Store a mood scan |
| `/api/mood/history` | GET | Fetch mood scan history |
| `/api/watchlist` | GET | Fetch watchlist entries |
| `/api/watchlist/toggle` | POST | Add or remove a movie from watchlist |
| `/api/users` | GET | List seeded users |
| `/api/user/<user_id>/profile` | GET | Fetch user profile stats |
| `/api/user/<user_id>/reviews` | GET | Fetch a user's reviews |
| `/api/reviews/top` | GET | Fetch top-rated reviews |
| `/api/reviews/recent` | GET | Fetch recent reviews |
| `/api/stats/users` | GET | Fetch user/review/mood statistics |

Example recommendation request:

```bash
curl -X POST http://localhost:5001/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel relaxed and want something cozy", "user_id": 1, "top_n": 6}'
```

Example direct mood request:

```bash
curl -X POST http://localhost:5001/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"mood": "excited", "top_n": 6}'
```

## Training and Data

Train or regenerate model artifacts:

```bash
python train_models.py --data ./data --output ./models
```

Run the training walkthrough:

```bash
python demo_training.py
```

Fetch fresh movie metadata and posters from TMDb:

```bash
bash scripts/run_movie_pipeline.sh
```

Or customize the pipeline:

```bash
bash scripts/run_movie_pipeline.sh 1000 2020 movies_dataset.json data/movies.csv static/posters 0.08
```

## MongoDB Mode

MongoDB is optional. If `MONGODB_URI` is not set or the connection fails, MoodFlix runs in CSV-only mode.

When MongoDB is enabled, the app can persist:

- Users and preferences
- Mood scans and mood feedback
- Watchlist items
- Ratings and text reviews
- User profile statistics

See `MONGODB_INTEGRATION.md` and `USER_REVIEWS_API.md` for detailed database and API notes.

## Why This Project Matters

MoodFlix demonstrates more than a standard CRUD app. It combines:

- Full-stack web development
- Recommendation-system design
- NLP-style mood understanding
- ML model training and artifact loading
- Database-backed personalization
- Real movie catalog enrichment
- A user-centered discovery experience

It is suitable as a college project, portfolio project, or mentor demo because it shows both product thinking and technical depth.

## Repository Notes

Local secrets and generated files are intentionally ignored:

- `.env`
- virtual environments
- zip archives
- OS files like `.DS_Store`
- Python cache files

Keep real credentials out of Git. Use `.env.example` files as templates when sharing setup instructions.

## License

This project is intended for academic and personal portfolio use.
