"""
mongo_seed.py — Migrate existing MoodFlix data into MongoDB
============================================================
Imports movies.csv, ratings.csv, and movies_dataset.json into MongoDB
collections, assigning mood tags and creating a unified catalog.

Usage:
    python mongo_seed.py
    python mongo_seed.py --uri "mongodb+srv://..."
"""
import os
import re
import json
import argparse
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Load .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def slugify(value):
    value = str(value or '').strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-') or 'movie'


# Genre → mood mapping (reverse of mood→genre)
GENRE_TO_MOOD = {
    'comedy': ['happy', 'chill', 'stressed', 'bored'],
    'animation': ['happy', 'nostalgic', 'stressed'],
    'adventure': ['excited', 'happy', 'energetic', 'bored'],
    'family': ['happy', 'nostalgic', 'stressed'],
    'drama': ['sad', 'emotional', 'chill', 'relaxed', 'nostalgic'],
    'romance': ['romantic', 'sad', 'emotional', 'chill', 'relaxed'],
    'music': ['sad', 'emotional', 'energetic'],
    'action': ['excited', 'angry', 'energetic'],
    'thriller': ['excited', 'angry', 'scared', 'fearful'],
    'sci-fi': ['excited', 'bored'],
    'documentary': ['chill', 'relaxed', 'stressed'],
    'crime': ['angry', 'fearful'],
    'horror': ['scared', 'fearful'],
    'mystery': ['scared', 'fearful', 'bored'],
    'fantasy': ['nostalgic', 'relaxed'],
    'biography': ['sad', 'emotional'],
    'history': ['emotional', 'nostalgic'],
    'war': ['angry', 'emotional'],
    'western': ['chill'],
    'musical': ['romantic', 'emotional', 'energetic'],
}


def assign_moods(genres_list):
    """Assign primary mood and mood tags based on genre list."""
    mood_scores = {}
    for g in genres_list:
        g_lower = g.strip().lower()
        for mood in GENRE_TO_MOOD.get(g_lower, []):
            mood_scores[mood] = mood_scores.get(mood, 0) + 1

    if not mood_scores:
        return 'chill', ['chill'], 0.5

    sorted_moods = sorted(mood_scores.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_moods[0][0]
    tags = [m for m, _ in sorted_moods[:3]]
    confidence = min(0.5 + sorted_moods[0][1] * 0.15, 0.98)
    return primary, tags, round(confidence, 2)


def load_csv_movies(data_dir):
    """Load movies from CSV."""
    import pandas as pd
    path = os.path.join(data_dir, 'movies.csv')
    if not os.path.exists(path):
        logger.warning("movies.csv not found at %s", path)
        return []

    df = pd.read_csv(path)
    movies = []
    for _, row in df.iterrows():
        genres_raw = str(row.get('genres', ''))
        genres = [g.strip() for g in genres_raw.split(',') if g.strip()]
        primary_mood, mood_tags, mood_conf = assign_moods(genres)

        movie = {
            'csvId': int(row.get('id', 0)),
            'title': str(row.get('title', 'Untitled')),
            'slug': slugify(row.get('title')),
            'overview': str(row.get('overview', '')),
            'description': str(row.get('overview', '')),
            'genres': genres,
            'primaryGenre': genres[0] if genres else '',
            'primaryMood': primary_mood,
            'moodTags': mood_tags,
            'moodConfidence': mood_conf,
            'posterUrl': str(row.get('poster_url', '')) if 'poster_url' in row else '',
            'trailerUrl': str(row.get('trailer_url', '')) if 'trailer_url' in row else '',
            'contentType': 'movie',
            'isActive': True,
            'avgRating': 0,
            'ratingCount': 0,
            'viewCount': 0,
            'createdAt': datetime.utcnow(),
        }
        movies.append(movie)
    return movies


def load_json_catalog(path):
    """Load rich catalog from movies_dataset.json."""
    if not os.path.exists(path):
        logger.warning("movies_dataset.json not found at %s", path)
        return []

    with open(path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    movies = []
    for item in catalog:
        genres = item.get('genres') or []
        if isinstance(genres, str):
            genres = [g.strip() for g in genres.split(',') if g.strip()]

        primary_mood, mood_tags, mood_conf = assign_moods(genres)

        cast = item.get('cast') or []
        if isinstance(cast, list):
            cast = [{'name': c.get('name', ''), 'character': c.get('character', ''),
                      'role': 'actor', 'order': i}
                    for i, c in enumerate(cast) if isinstance(c, dict)]

        movie = {
            'catalogId': item.get('id'),
            'title': item.get('title') or 'Untitled',
            'slug': slugify(item.get('title')),
            'overview': item.get('overview') or '',
            'description': item.get('overview') or '',
            'tagline': item.get('tagline', ''),
            'genres': genres,
            'primaryGenre': genres[0] if genres else '',
            'primaryMood': primary_mood,
            'moodTags': mood_tags,
            'moodConfidence': mood_conf,
            'cast': cast,
            'directors': item.get('directors', []),
            'posterUrl': item.get('poster') or item.get('poster_url') or '',
            'backdropUrl': item.get('backdrop') or '',
            'trailerUrl': item.get('trailer_url') or '',
            'releaseYear': item.get('year'),
            'runtime': item.get('runtime'),
            'rating': item.get('content_rating', ''),
            'avgRating': float(item.get('rating') or 0),
            'contentLanguage': item.get('language') or 'en',
            'contentType': 'movie',
            'isActive': True,
            'ratingCount': 0,
            'viewCount': 0,
            'createdAt': datetime.utcnow(),
        }
        movies.append(movie)
    return movies


def load_csv_ratings(data_dir):
    """Load ratings from CSV."""
    import pandas as pd
    path = os.path.join(data_dir, 'ratings.csv')
    if not os.path.exists(path):
        return []

    df = pd.read_csv(path)
    ratings = []
    for _, row in df.iterrows():
        ratings.append({
            'csvUserId': int(row.get('user_id', 0)),
            'csvMovieId': int(row.get('movie_id', 0)),
            'score': float(row.get('rating', 3)),
            'ratedAt': datetime.utcnow(),
        })
    return ratings


def seed_moods(db):
    """Seed the moods reference collection."""
    moods = [
        {'name': 'happy',     'emoji': '😊', 'color': '#ffd700', 'desc': 'Joyful, upbeat'},
        {'name': 'sad',       'emoji': '😢', 'color': '#4a90d9', 'desc': 'Melancholic, reflective'},
        {'name': 'angry',     'emoji': '😠', 'color': '#ff2a2a', 'desc': 'Frustrated, tense'},
        {'name': 'excited',   'emoji': '⚡', 'color': '#ff9500', 'desc': 'Eager, enthusiastic'},
        {'name': 'romantic',  'emoji': '❤️', 'color': '#ff006e', 'desc': 'Affectionate, dreamy'},
        {'name': 'stressed',  'emoji': '😰', 'color': '#9b59b6', 'desc': 'Anxious, overwhelmed'},
        {'name': 'relaxed',   'emoji': '😌', 'color': '#2ecc71', 'desc': 'Calm, peaceful'},
        {'name': 'emotional', 'emoji': '🥺', 'color': '#3498db', 'desc': 'Vulnerable, deeply feeling'},
        {'name': 'fearful',   'emoji': '😨', 'color': '#5d6d7e', 'desc': 'Apprehensive, cautious'},
        {'name': 'bored',     'emoji': '😴', 'color': '#95a5a6', 'desc': 'Restless, seeking stimulation'},
        {'name': 'energetic', 'emoji': '🏃', 'color': '#e74c3c', 'desc': 'Vigorous, dynamic'},
        {'name': 'chill',     'emoji': '🍃', 'color': '#2ecc71', 'desc': 'Relaxed and easy-going'},
        {'name': 'scared',    'emoji': '👻', 'color': '#5d6d7e', 'desc': 'Frightened, spooked'},
        {'name': 'nostalgic', 'emoji': '🕰️', 'color': '#d4a574', 'desc': 'Reminiscent, wistful'},
    ]
    db['moods'].delete_many({})
    db['moods'].insert_many(moods)
    logger.info("✅ Seeded %d moods", len(moods))


def main():
    parser = argparse.ArgumentParser(description="Seed MongoDB with MoodFlix data")
    parser.add_argument('--uri', help='MongoDB URI (or set MONGODB_URI env var)')
    parser.add_argument('--db', default='mood_app', help='Database name')
    parser.add_argument('--data', default='data', help='Data directory with CSV files')
    parser.add_argument('--catalog', default='movies_dataset.json', help='JSON catalog path')
    parser.add_argument('--drop', action='store_true', help='Drop existing collections first')
    args = parser.parse_args()

    uri = args.uri or os.getenv('MONGODB_URI')
    if not uri:
        logger.error("❌ Set MONGODB_URI env var or pass --uri")
        return

    from pymongo import MongoClient
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
    except Exception as e:
        logger.error("❌ Could not connect to MongoDB: %s", e)
        return
    db = client[args.db]
    logger.info("✅ Connected to MongoDB: %s/%s", client.address, args.db)

    if args.drop:
        for col in ['movies', 'ratings', 'moods', 'mood_scans', 'watchlist', 'users']:
            db[col].drop()
        logger.info("🗑️  Dropped existing collections")

    # 1. Seed moods
    seed_moods(db)

    # 2. Load movies from JSON catalog (rich data) + CSV (engine data)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_movies = load_json_catalog(os.path.join(base_dir, args.catalog))
    csv_movies = load_csv_movies(os.path.join(base_dir, args.data))

    # Merge: prefer JSON catalog data, supplement with CSV
    seen_slugs = set()
    all_movies = []

    for m in json_movies:
        if m['slug'] not in seen_slugs:
            seen_slugs.add(m['slug'])
            all_movies.append(m)

    for m in csv_movies:
        if m['slug'] not in seen_slugs:
            seen_slugs.add(m['slug'])
            all_movies.append(m)

    if all_movies:
        db['movies'].delete_many({})
        result = db['movies'].insert_many(all_movies)
        logger.info("✅ Seeded %d movies", len(result.inserted_ids))

        # Build csvId → ObjectId map for ratings
        id_map = {}
        for movie in db['movies'].find({}, {'csvId': 1, 'slug': 1}):
            if movie.get('csvId'):
                id_map[movie['csvId']] = movie['_id']
    else:
        logger.warning("⚠️ No movies to seed")
        id_map = {}

    # 3. Load ratings
    csv_ratings = load_csv_ratings(os.path.join(base_dir, args.data))
    if csv_ratings and id_map:
        valid_ratings = []
        for r in csv_ratings:
            movie_oid = id_map.get(r['csvMovieId'])
            if movie_oid:
                valid_ratings.append({
                    'movieId': movie_oid,
                    'csvUserId': r['csvUserId'],
                    'score': r['score'],
                    'ratedAt': r['ratedAt'],
                })

        if valid_ratings:
            db['ratings'].delete_many({})
            db['ratings'].insert_many(valid_ratings)
            logger.info("✅ Seeded %d ratings", len(valid_ratings))

    # 4. Create indexes
    from db_mongo import ensure_indexes
    os.environ['MONGODB_URI'] = uri
    os.environ['MONGODB_DB'] = args.db
    ensure_indexes()

    # 5. Create a demo user
    db['users'].delete_many({})
    demo_email = os.getenv('DEMO_USER_EMAIL', 'demo@moodflix.app')
    db['users'].insert_one({
        'email': demo_email,
        'displayName': 'Demo User',
        'role': 'premium',
        'subscription': 'premium',
        'privacy': {'cameraConsent': True, 'consentDate': datetime.utcnow(),
                    'dataRetentionDays': 30, 'allowDataTraining': False},
        'preferences': {'preferredLanguages': ['en', 'hi'],
                        'likedGenres': ['Action', 'Drama', 'Comedy'],
                        'dislikedGenres': ['Horror']},
        'createdAt': datetime.utcnow(),
    })
    logger.info("✅ Created demo user: %s", demo_email)

    # Stats
    logger.info("\n" + "=" * 50)
    logger.info("🎉 MongoDB seeding complete!")
    logger.info("   Movies:  %d", db['movies'].count_documents({}))
    logger.info("   Ratings: %d", db['ratings'].count_documents({}))
    logger.info("   Moods:   %d", db['moods'].count_documents({}))
    logger.info("   Users:   %d", db['users'].count_documents({}))
    logger.info("=" * 50)

    client.close()


if __name__ == '__main__':
    main()
