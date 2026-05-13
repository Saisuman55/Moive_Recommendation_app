"""
MoodFlix - Flask Backend
Run: python app.py
"""
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import os

from engine import MoodRecommender
from llm_module import classify_mood

app = Flask(__name__)
CORS(app)

# ============================================================
# Load Data
# ============================================================
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

try:
    movies = pd.read_csv(os.path.join(DATA_DIR, 'movies.csv'))
    ratings = pd.read_csv(os.path.join(DATA_DIR, 'ratings.csv'))
except FileNotFoundError as e:
    print(f"ERROR: Data file not found: {e}")
    print("Please ensure data/movies.csv and data/ratings.csv exist.")
    raise

# Initialize & train engine
engine = MoodRecommender(movies, ratings)
engine.fit()
print("✅ Engine trained and ready")

# ============================================================
# Routes
# ============================================================

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.get_json() or {}
    user_text = data.get('text', '')
    selected_mood = data.get('mood')
    user_id = data.get('user_id')
    top_n = data.get('top_n', 10)

    # --- Mood Classification ---
    if user_text and user_text.strip():
        analysis = classify_mood(user_text)
        mood = analysis['mood_category']
    else:
        mood = selected_mood if selected_mood else 'chill'
        analysis = {
            'mood_category': mood,
            'confidence': 1.0,
            'explanation': f"Direct mood selection: {mood}",
            'preferred_genres': engine.mood_map.get(mood, []),
            'avoid_genres': []
        }

    # --- Recommendations ---
    recs = engine.get_recommendations(mood, user_id=user_id, top_n=top_n)

    # Build response with poster_url and trailer_url
    columns = ['id', 'title', 'genres', 'overview', 'match_score']
    if 'poster_url' in recs.columns:
        columns.append('poster_url')
    if 'trailer_url' in recs.columns:
        columns.append('trailer_url')

    return jsonify({
        'mood_analysis': analysis,
        'message': f"Because you're feeling {mood}, we picked these for you.",
        'recommendations': recs[columns].to_dict('records')
    })


@app.route('/api/moods', methods=['GET'])
def get_moods():
    """Return available mood categories."""
    return jsonify({
        'moods': list(engine.mood_map.keys()),
        'mapping': engine.mood_map
    })


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'movies_loaded': len(movies)})


# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
