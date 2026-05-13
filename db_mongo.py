"""
db_mongo.py — MongoDB Connection Manager for MoodFlix Flask Backend
===================================================================
Provides optional MongoDB connectivity. Falls back gracefully to CSV
if MongoDB is unavailable or MONGODB_URI is not set.

Usage:
    from db_mongo import get_db, is_connected
    db = get_db()
    if db is not None:
        movies = list(db.movies.find({...}))
"""
import os
import logging

logger = logging.getLogger(__name__)

_client = None
_db = None
_connected = False


def get_client():
    """Get or create the MongoClient singleton."""
    global _client
    if _client is not None:
        return _client

    uri = os.getenv('MONGODB_URI')
    if not uri:
        logger.info("MONGODB_URI not set — running in CSV-only mode")
        return None

    try:
        from pymongo import MongoClient
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000,
                              maxPoolSize=10, retryWrites=True)
        # Ping to verify connection
        _client.admin.command('ping')
        logger.info("✅ MongoDB connected: %s", _client.address)
        return _client
    except ImportError:
        logger.warning("pymongo not installed — pip install pymongo")
        return None
    except Exception as e:
        logger.warning("⚠️ MongoDB connection failed: %s — falling back to CSV", e)
        _client = None
        return None


def get_db(db_name=None):
    """Get the MongoDB database instance."""
    global _db, _connected
    if _db is not None:
        return _db

    client = get_client()
    if client is None:
        _connected = False
        return None

    name = db_name or os.getenv('MONGODB_DB', 'mood_app')
    _db = client[name]
    _connected = True
    return _db


def is_connected():
    """Check if MongoDB is available."""
    global _connected
    if _connected:
        return True
    # Try to connect if not attempted yet
    return get_db() is not None


def close():
    """Close the MongoDB connection."""
    global _client, _db, _connected
    if _client:
        _client.close()
        _client = None
        _db = None
        _connected = False


# ============================================================
# Collection Helpers
# ============================================================

def get_movies_collection():
    db = get_db()
    return db['movies'] if db is not None else None


def get_ratings_collection():
    db = get_db()
    return db['ratings'] if db is not None else None


def get_mood_scans_collection():
    db = get_db()
    return db['mood_scans'] if db is not None else None


def get_users_collection():
    db = get_db()
    return db['users'] if db is not None else None


def get_watchlist_collection():
    db = get_db()
    return db['watchlist'] if db is not None else None


# ============================================================
# Mood Mapping — Unified 11+3 moods (backward compatible)
# ============================================================

MOOD_GENRE_MAP = {
    # Original 8 moods from engine.py
    'happy':    ['Comedy', 'Animation', 'Adventure', 'Family'],
    'sad':      ['Drama', 'Romance', 'Music'],
    'excited':  ['Action', 'Thriller', 'Adventure', 'Sci-Fi'],
    'chill':    ['Documentary', 'Drama', 'Romance', 'Comedy'],
    'romantic': ['Romance', 'Drama', 'Comedy'],
    'angry':    ['Action', 'Crime', 'Thriller'],
    'scared':   ['Horror', 'Thriller', 'Mystery'],
    'nostalgic': ['Animation', 'Family', 'Fantasy', 'Drama'],
    # New moods from database kit
    'stressed':  ['Comedy', 'Animation', 'Family', 'Documentary'],
    'relaxed':   ['Documentary', 'Drama', 'Fantasy', 'Romance'],
    'emotional': ['Drama', 'Biography', 'Romance', 'Music'],
    'fearful':   ['Horror', 'Thriller', 'Mystery'],
    'bored':     ['Mystery', 'Sci-Fi', 'Adventure', 'Comedy'],
    'energetic': ['Action', 'Adventure', 'Music', 'Sci-Fi'],
}

# Map legacy mood names to new ones (for backward compat)
MOOD_ALIASES = {
    'chill': 'relaxed',
    'scared': 'fearful',
}

MOOD_GENRE_WEIGHTS = {
    'happy':     {'Comedy': 0.95, 'Animation': 0.70, 'Adventure': 0.75, 'Family': 0.65},
    'sad':       {'Drama': 0.90, 'Romance': 0.75, 'Music': 0.65, 'Biography': 0.85},
    'angry':     {'Action': 0.95, 'Thriller': 0.85, 'Crime': 0.75},
    'excited':   {'Action': 0.90, 'Adventure': 0.85, 'Sci-Fi': 0.80, 'Thriller': 0.70},
    'romantic':  {'Romance': 0.95, 'Drama': 0.70, 'Comedy': 0.60},
    'stressed':  {'Comedy': 0.85, 'Animation': 0.70, 'Family': 0.75, 'Documentary': 0.60},
    'relaxed':   {'Documentary': 0.85, 'Drama': 0.80, 'Fantasy': 0.75, 'Romance': 0.65},
    'emotional': {'Drama': 0.95, 'Biography': 0.85, 'Romance': 0.75},
    'fearful':   {'Horror': 0.95, 'Thriller': 0.85, 'Mystery': 0.75},
    'bored':     {'Mystery': 0.85, 'Sci-Fi': 0.80, 'Adventure': 0.75, 'Comedy': 0.70},
    'energetic': {'Action': 0.95, 'Adventure': 0.90, 'Music': 0.75},
    'chill':     {'Documentary': 0.85, 'Drama': 0.80, 'Romance': 0.70, 'Comedy': 0.65},
    'scared':    {'Horror': 0.95, 'Thriller': 0.85, 'Mystery': 0.75},
    'nostalgic': {'Animation': 0.80, 'Family': 0.75, 'Fantasy': 0.70, 'Drama': 0.65},
}


def ensure_indexes():
    """Create MongoDB indexes for optimal query performance."""
    db = get_db()
    if db is None:
        return

    movies = db['movies']
    existing = movies.index_information()
    if 'text_search' not in existing:
        try:
            movies.create_index(
                [('title', 'text'), ('overview', 'text'), ('description', 'text')],
                weights={'title': 10, 'overview': 2, 'description': 1},
                default_language='english', name='text_search'
            )
        except Exception as e:
            logger.warning("Text index creation failed: %s", e)
    movies.create_index([('primaryMood', 1), ('isActive', 1), ('avgRating', -1)])
    movies.create_index([('moodTags', 1), ('isActive', 1)])
    movies.create_index([('genres', 1), ('isActive', 1), ('avgRating', -1)])
    movies.create_index([('slug', 1)], unique=True, sparse=True)

    db['mood_scans'].create_index([('expiresAt', 1)], expireAfterSeconds=0)
    db['mood_scans'].create_index([('userId', 1), ('scannedAt', -1)])
    db['ratings'].create_index([('userId', 1), ('movieId', 1)], unique=True, sparse=True)
    db['watchlist'].create_index([('userId', 1), ('movieId', 1)], unique=True, sparse=True)

    logger.info("✅ MongoDB indexes created")
