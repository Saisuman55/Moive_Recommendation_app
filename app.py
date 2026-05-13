"""
MoodFlix - Flask Backend
Run: python app.py
"""
import json
import os
import re
import logging
from pathlib import Path
from datetime import datetime, timedelta

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from flask import Flask, request, jsonify, render_template, abort
from flask_cors import CORS
import pandas as pd

from engine import MoodRecommender
from llm_module import classify_mood
from db_mongo import get_db, is_connected, ensure_indexes, MOOD_GENRE_MAP
from bson import ObjectId
from api_mongo import (
    create_mood_scan, get_user_mood_scans,
    add_to_watchlist, get_user_watchlist, remove_from_watchlist,
    create_or_update_rating, get_movie_ratings, get_user_rating,
    update_user_preferences, get_user_preferences
)

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True


def _configured_origins():
    origins = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:5001,http://127.0.0.1:5001,http://localhost:3000,http://127.0.0.1:3000,https://moive-recommendation-app.onrender.com'
    )
    return [origin.strip() for origin in origins.split(',') if origin.strip()]


CORS(app, resources={r"/api/*": {"origins": "*"}})

# ============================================================
# MongoDB Connection (optional — falls back to CSV)
# ============================================================
mongo_available = is_connected()
if mongo_available:
    ensure_indexes()
    print("✅ MongoDB connected and indexed")
else:
    print("ℹ️  Running in CSV-only mode (set MONGODB_URI to enable MongoDB)")

# ============================================================
# Load Data
# ============================================================
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
CATALOG_PATH = os.path.join(os.path.dirname(__file__), 'movies_dataset.json')
MOVIES_CSV_PATH = os.path.join(DATA_DIR, 'movies.csv')
RATINGS_CSV_PATH = os.path.join(DATA_DIR, 'ratings.csv')
DATA_SIGNATURE = None

movies = None
ratings = None
catalog = []
engine = None


def _file_signature(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return None


def _current_signature():
    return (
        _file_signature(MOVIES_CSV_PATH),
        _file_signature(RATINGS_CSV_PATH),
        _file_signature(CATALOG_PATH),
    )


def load_runtime_data():
    global movies, ratings, catalog, engine, DATA_SIGNATURE

    try:
        movies = pd.read_csv(MOVIES_CSV_PATH)
        ratings = pd.read_csv(RATINGS_CSV_PATH)
    except FileNotFoundError as e:
        print(f"ERROR: Data file not found: {e}")
        print("Please ensure data/movies.csv and data/ratings.csv exist.")
        raise

    catalog = load_catalog()
    engine = MoodRecommender(movies, ratings)
    engine.fit()
    DATA_SIGNATURE = _current_signature()

    # Extend engine mood_map with new moods from database kit
    for mood, genres in MOOD_GENRE_MAP.items():
        if mood not in engine.mood_map:
            engine.mood_map[mood] = genres

    print(f"✅ Engine trained and ready ({len(engine.mood_map)} moods)")


def reload_runtime_data_if_needed():
    global DATA_SIGNATURE

    signature = _current_signature()
    if signature != DATA_SIGNATURE:
        print("🔄 Detected updated movie files, reloading runtime data...")
        load_runtime_data()


def slugify(value):
    value = str(value or '').strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-') or 'movie'


def load_catalog():
    try:
        with open(CATALOG_PATH, 'r', encoding='utf-8') as handle:
            catalog = json.load(handle)
    except FileNotFoundError:
        return []

    normalized = []
    for item in catalog:
        genres = item.get('genres') or []
        if isinstance(genres, str):
            genres = [genre.strip() for genre in genres.split(',') if genre.strip()]

        normalized.append({
            'id': item.get('id'),
            'slug': slugify(item.get('title')),
            'title': item.get('title') or 'Untitled',
            'poster': item.get('poster') or item.get('poster_url') or '/static/posters/placeholder.jpg',
            'backdrop': item.get('backdrop') or item.get('poster') or item.get('poster_url') or '/static/posters/placeholder.jpg',
            'rating': item.get('rating') or 0,
            'genres': genres,
            'year': item.get('year') or '',
            'runtime': item.get('runtime') or '',
            'overview': item.get('overview') or '',
            'cast': item.get('cast') or [],
            'trailer_url': item.get('trailer_url') or '',
            'language': item.get('language') or '',
        })

    return normalized


load_runtime_data()


@app.before_request
def refresh_movie_data_if_needed():
    reload_runtime_data_if_needed()


def movie_card(movie):
    genres = movie.get('genres') or []
    if isinstance(genres, str):
        genres = [genre.strip() for genre in genres.split(',') if genre.strip()]

    return {
        'id': movie.get('id'),
        'slug': movie.get('slug') or slugify(movie.get('title')),
        'title': movie.get('title') or 'Untitled',
        'poster': movie.get('poster') or movie.get('poster_url') or '/static/posters/placeholder.jpg',
        'backdrop': movie.get('backdrop') or movie.get('poster') or movie.get('poster_url') or '/static/posters/placeholder.jpg',
        'rating': movie.get('rating') or 0,
        'year': movie.get('year') or '',
        'runtime': movie.get('runtime') or '',
        'overview': movie.get('overview') or '',
        'genres': genres,
        'genre_text': ', '.join(genres[:3]),
        'trailer_url': movie.get('trailer_url') or '',
        'language': movie.get('language') or '',
        'match_score': int(round(float(movie.get('rating') or 0) * 10)) if movie.get('rating') is not None else 0,
    }


def ranked_catalog(items=None, sort_key='rating', reverse=True):
    source = items if items is not None else catalog
    def sort_value(item):
        try:
            return float(item.get(sort_key) or 0)
        except (TypeError, ValueError):
            return 0

    return sorted(source, key=sort_value, reverse=reverse)


def paginate(items, page=1, per_page=10):
    page = max(int(page or 1), 1)
    start = (page - 1) * per_page
    end = start + per_page
    total_pages = max((len(items) + per_page - 1) // per_page, 1)
    return items[start:end], total_pages


def build_movie_page(title, description, items, page=1, per_page=10, hero=None, kind='grid', active_nav='home', extras=None):
    movies_page, total_pages = paginate(items, page=page, per_page=per_page)
    return {
        'title': title,
        'description': description,
        'kind': kind,
        'active_nav': active_nav,
        'hero': hero or {},
        'movies': [movie_card(movie) for movie in movies_page],
        'total_pages': total_pages,
        'current_page': int(page or 1),
        'extras': extras or {},
    }


def find_movie_by_slug(slug):
    for movie in catalog:
        if movie.get('slug') == slug:
            return movie
        if slugify(movie.get('title')) == slug:
            return movie
    return None


def filter_catalog(query=None, genre=None, language=None, year=None, rating=None, actor=None):
    results = catalog

    if query:
        q = query.lower()
        results = [movie for movie in results if q in (movie.get('title') or '').lower() or q in (movie.get('overview') or '').lower()]

    if genre:
        g = genre.lower()
        results = [movie for movie in results if any(g == str(item).lower() for item in (movie.get('genres') or []))]

    if language:
        lang = language.lower()
        results = [movie for movie in results if lang in str(movie.get('language') or '').lower()]

    if year:
        results = [movie for movie in results if str(movie.get('year') or '') == str(year)]

    if rating:
        try:
            threshold = float(rating)
            results = [movie for movie in results if float(movie.get('rating') or 0) >= threshold]
        except ValueError:
            pass

    if actor:
        actor_q = actor.lower()
        filtered = []
        for movie in results:
            cast = movie.get('cast') or []
            if any(actor_q in str(member.get('name', '')).lower() for member in cast):
                filtered.append(movie)
        results = filtered

    return results


def landing_page_data():
    featured = ranked_catalog()[:6]
    return {
        'title': 'MoodFlix - AI-Powered Movie Recommendations',
        'description': 'Premium cinematic streaming experience with AI recommendations, mood detection, and regional cinema discovery.',
        'kind': 'landing',
        'active_nav': 'home',
        'hero': {
            'eyebrow': 'Next-Gen OTT Experience',
            'title': 'Find your next favorite movie with cinematic AI intelligence.',
            'subtitle': 'MoodFlix blends movie discovery, emotion-aware recommendations, and premium streaming UX into one futuristic platform.',
            'primary_cta': {'label': 'Get Started', 'href': '/dashboard'},
            'secondary_cta': {'label': 'Explore Movies', 'href': '/dashboard#trending-now'},
            'tertiary_cta': {'label': 'AI Mood Detection', 'href': '/mood-ai'},
            'featured_movies': [movie_card(movie) for movie in featured],
        },
        'sections': [
            {
                'type': 'stats',
                'title': 'Platform Intelligence',
                'items': [
                    {'label': 'AI moods', 'value': '8'},
                    {'label': 'Movies indexed', 'value': f'{len(catalog):,}'},
                    {'label': 'Local posters', 'value': '987+'},
                    {'label': 'Regional languages', 'value': '6+'},
                ],
            },
            {
                'type': 'feature-grid',
                'title': 'Why MoodFlix feels premium',
                'items': [
                    {'icon': '🎬', 'title': 'Cinematic discovery', 'description': 'Carousel-style browsing, rich movie cards, and movie detail routes.'},
                    {'icon': '🧠', 'title': 'Hybrid AI recommendations', 'description': 'Mood classification plus collaborative and content-based ranking.'},
                    {'icon': '📷', 'title': 'Mood detection', 'description': 'Privacy-safe facial emotion scanning using the user device camera.'},
                    {'icon': '🌍', 'title': 'Regional cinema', 'description': 'Built for Bollywood, Tollywood, Kollywood, Mollywood, and more.'},
                ],
            },
            {
                'type': 'movie-row',
                'id': 'landing-trailers',
                'title': 'Trending trailers',
                'subtitle': 'A teaser-driven introduction to the platform.',
                'movies': [movie_card(movie) for movie in featured[:5]],
            },
        ],
        'show_mobile_nav': True,
    }


def dashboard_page_data(page=1):
    top_rated = ranked_catalog(sort_key='rating')
    recently_released = [m for m in ranked_catalog(sort_key='year') if float(m.get('rating') or 0) > 0]
    popular = ranked_catalog()[:100]
    ai_recommended = [movie for movie in top_rated if movie.get('rating', 0) >= 7.5][:50]
    regional = [movie for movie in catalog if any(language in str(movie.get('language') or '').lower() for language in ['hi', 'te', 'ta', 'ml', 'kn', 'or'])]
    mood_based = top_rated[:60]
    upcoming = ranked_catalog(sort_key='year', reverse=True)[:50]
    watchlist_preview = top_rated[20:30]
    continue_watching = top_rated[10:20]

    return {
        'title': 'Dashboard - MoodFlix',
        'description': 'Main OTT browsing experience with immersive collections and AI-powered discovery.',
        'kind': 'dashboard',
        'active_nav': 'dashboard',
        'show_mobile_nav': True,
        'hero': {
            'eyebrow': 'Homepage / Dashboard',
            'title': 'Stream, discover, and get mood-aware recommendations.',
            'subtitle': 'Browse collections, continue watching, and jump into AI-assisted discovery without leaving the cinematic experience.',
            'primary_cta': {'label': 'Search Movies', 'href': '/search'},
            'secondary_cta': {'label': 'Mood AI', 'href': '/mood-ai'},
            'tertiary_cta': {'label': 'Watchlist', 'href': '/watchlist'},
            'featured_movies': [movie_card(movie) for movie in top_rated[:5]],
        },
        'sections': [
            {'type': 'search-bar', 'title': 'Search and filter instantly'},
            {'type': 'movie-row', 'id': 'trending-now', 'title': 'Trending Now', 'subtitle': 'Highest momentum picks today.', 'movies': [movie_card(movie) for movie in top_rated[:10]]},
            {'type': 'movie-row', 'id': 'top-rated', 'title': 'Top Rated Movies', 'subtitle': 'Critics and crowd favorites.', 'movies': [movie_card(movie) for movie in top_rated[:10]]},
            {'type': 'movie-row', 'id': 'recently-released', 'title': 'Recently Released', 'subtitle': 'Fresh titles from the latest seasons.', 'movies': [movie_card(movie) for movie in recently_released[:10]]},
            {'type': 'movie-row', 'id': 'popular-indian', 'title': 'Popular Indian Movies', 'subtitle': 'Indian cinema across regions and languages.', 'movies': [movie_card(movie) for movie in popular[:10]]},
            {'type': 'movie-row', 'id': 'ai-recommended', 'title': 'AI Recommended Movies', 'subtitle': 'Hybrid relevance-ranked suggestions.', 'movies': [movie_card(movie) for movie in ai_recommended[:10]]},
            {'type': 'movie-row', 'id': 'continue-watching', 'title': 'Continue Watching', 'subtitle': 'Pick up from where you left off.', 'movies': [movie_card(movie) for movie in continue_watching[:10]]},
            {'type': 'movie-row', 'id': 'regional-cinema', 'title': 'Regional Cinema Collections', 'subtitle': 'Bollywood, Tollywood, Kollywood, and more.', 'movies': [movie_card(movie) for movie in regional[:10]]},
            {'type': 'movie-row', 'id': 'mood-based', 'title': 'Mood-Based Recommendations', 'subtitle': 'Built for how you feel right now.', 'movies': [movie_card(movie) for movie in mood_based[:10]]},
            {'type': 'movie-row', 'id': 'upcoming', 'title': 'Upcoming Movies', 'subtitle': 'What to watch next.', 'movies': [movie_card(movie) for movie in upcoming[:10]]},
            {'type': 'movie-row', 'id': 'watchlist-preview', 'title': 'Watchlist Preview', 'subtitle': 'Your saved titles at a glance.', 'movies': [movie_card(movie) for movie in watchlist_preview[:10]]},
        ],
    }


def genre_page_data(genre, page=1):
    filtered = filter_catalog(genre=genre)
    return build_movie_page(
        title=f'{genre.title()} Movies - MoodFlix',
        description=f'Explore {genre.title()} movies with mood compatibility and AI-ranked discovery.',
        items=ranked_catalog(filtered),
        page=page,
        hero={
            'eyebrow': f'Genre / {genre.title()}',
            'title': f'{genre.title()} cinema with mood-aware recommendations.',
            'subtitle': 'Sort, discover, and compare movies in a premium genre collection.',
            'primary_cta': {'label': 'Back to Dashboard', 'href': '/dashboard'},
        },
        kind='genre',
        active_nav='search',
        extras={'genre': genre},
    )


def search_page_data(params):
    query = params.get('q', '').strip()
    genre = params.get('genre', '').strip()
    language = params.get('language', '').strip()
    year = params.get('year', '').strip()
    rating = params.get('rating', '').strip()
    actor = params.get('actor', '').strip()
    page = int(params.get('page', 1) or 1)

    filtered = filter_catalog(query=query, genre=genre, language=language, year=year, rating=rating, actor=actor)
    hero_title = 'Search Results' if not query else f'Results for "{query}"'
    return build_movie_page(
        title='Search - MoodFlix',
        description='Advanced discovery with real-time filters, trending suggestions, and pagination.',
        items=ranked_catalog(filtered),
        page=page,
        hero={
            'eyebrow': 'Search / Discovery',
            'title': hero_title,
            'subtitle': 'Use instant filters across genre, mood, language, year, rating, actor, and director.',
            'primary_cta': {'label': 'Trending', 'href': '/trending'},
            'secondary_cta': {'label': 'Mood AI', 'href': '/mood-ai'},
        },
        kind='search',
        active_nav='search',
        extras={'query': query, 'genre': genre, 'language': language, 'year': year, 'rating': rating, 'actor': actor},
    )


def recommendations_page_data(mood='happy', page=1):
    recs = engine.get_recommendations(mood, top_n=100)
    items = []
    for _, row in recs.iterrows():
        movie = {
            'id': row.get('id'),
            'title': row.get('title'),
            'genres': row.get('genres'),
            'overview': row.get('overview'),
            'poster': row.get('poster_url'),
            'trailer_url': row.get('trailer_url'),
            'rating': row.get('match_score') or 0,
            'year': row.get('year') or '',
        }
        items.append(movie)

    return build_movie_page(
        title='AI Recommendations - MoodFlix',
        description='Personalized recommendations generated from mood, preference, and hybrid ranking.',
        items=items,
        page=page,
        hero={
            'eyebrow': 'AI Recommendation Engine',
            'title': f'Personalized picks for a {mood} mood.',
            'subtitle': 'Hybrid scoring blends content similarity, collaborative signals, and mood mapping.',
            'primary_cta': {'label': 'Open Mood AI', 'href': '/mood-ai'},
            'secondary_cta': {'label': 'Search more', 'href': '/search'},
        },
        kind='recommendations',
        active_nav='mood-ai',
        extras={'mood': mood},
    )


def trailer_page_data(movie):
    return {
        'title': f"Trailer - {movie.get('title')}",
        'description': 'Cinematic trailer experience with suggested similar trailers and theater mode.',
        'kind': 'trailer',
        'active_nav': 'home',
        'movie': movie_card(movie),
        'cast': movie.get('cast') or [],
        'similar_movies': [movie_card(item) for item in ranked_catalog()[:6]],
    }


def detail_page_data(movie):
    similar_candidates = []
    base_genres = set((movie.get('genres') or []))
    for candidate in ranked_catalog():
        if candidate.get('id') == movie.get('id'):
            continue
        candidate_genres = set(candidate.get('genres') or [])
        if base_genres.intersection(candidate_genres):
            similar_candidates.append(candidate)
    if not similar_candidates:
        similar_candidates = ranked_catalog()[:10]

    cast = movie.get('cast') or []
    cast_cards = []
    for member in cast[:8]:
        if isinstance(member, dict):
            cast_cards.append({
                'name': member.get('name') or 'Cast Member',
                'character': member.get('character') or 'Role not listed',
                'image': member.get('image') or '',
            })

    return {
        'title': f"{movie.get('title')} - MoodFlix",
        'description': movie.get('overview') or 'Full movie details, trailer, cast, reviews, and similar titles.',
        'kind': 'detail',
        'active_nav': 'home',
        'movie': movie_card(movie),
        'cast': cast_cards,
        'similar_movies': [movie_card(item) for item in similar_candidates[:10]],
        'platforms': ['Netflix', 'Prime Video', 'Disney+', 'Apple TV', 'YouTube Rentals'],
    }

# ============================================================
# Routes
# ============================================================

@app.route('/')
def home():
    return render_template('cinematic_page.html', page=landing_page_data())


@app.route('/dashboard')
def dashboard():
    page = int(request.args.get('page', 1) or 1)
    return render_template('cinematic_page.html', page=dashboard_page_data(page))


@app.route('/mood-ai')
def mood_ai():
    return render_template('ai_mood_scanner.html')


@app.route('/recommendations')
def recommendations():
    mood = request.args.get('mood', 'happy')
    page = int(request.args.get('page', 1) or 1)
    return render_template('cinematic_page.html', page=recommendations_page_data(mood, page))


@app.route('/search')
def search():
    return render_template('cinematic_page.html', page=search_page_data(request.args))


@app.route('/genre/<genre_slug>')
def genre_page(genre_slug):
    page = int(request.args.get('page', 1) or 1)
    return render_template('cinematic_page.html', page=genre_page_data(genre_slug, page))


@app.route('/movie/<movie_slug>')
def movie_page(movie_slug):
    movie = find_movie_by_slug(movie_slug)
    if not movie:
        abort(404)
    return render_template('movie_detail.html', page=detail_page_data(movie))


@app.route('/trailer/<movie_slug>')
def trailer_page(movie_slug):
    movie = find_movie_by_slug(movie_slug)
    if not movie:
        abort(404)
    return render_template('movie_detail.html', page=trailer_page_data(movie))


@app.route('/watchlist')
def watchlist_page():
    return render_template('cinematic_page.html', page=build_movie_page(
        title='Watchlist - MoodFlix',
        description='Saved movies, continue watching, and recently viewed titles.',
        items=ranked_catalog()[:30],
        page=int(request.args.get('page', 1) or 1),
        hero={
            'eyebrow': 'User Watchlist',
            'title': 'Your saved and recently viewed movies.',
            'subtitle': 'Manage favorite movies, trailer picks, and personal viewing history.',
            'primary_cta': {'label': 'Dashboard', 'href': '/dashboard'},
        },
        kind='watchlist',
        active_nav='watchlist',
    ))


@app.route('/profile')
def profile_page():
    return render_template('cinematic_page.html', page={
        'title': 'Profile - MoodFlix',
        'description': 'User profile, watch history, moods, and preferences.',
        'kind': 'profile',
        'active_nav': 'profile',
        'hero': {
            'eyebrow': 'User Profile',
            'title': 'Your viewing identity, mood history, and taste profile.',
            'subtitle': 'Edit account settings, see favorite genres, and review recommendations.',
            'primary_cta': {'label': 'Settings', 'href': '/settings'},
        },
        'sections': [
            {'type': 'stats', 'title': 'Activity Overview', 'items': [
                {'label': 'Watch sessions', 'value': '42'},
                {'label': 'Saved movies', 'value': '18'},
                {'label': 'Mood scans', 'value': '9'},
                {'label': 'Favorite genres', 'value': '5'},
            ]},
            {'type': 'feature-grid', 'title': 'Profile data', 'items': [
                {'icon': '🧾', 'title': 'Watch history', 'description': 'Recently watched and frequent viewing times.'},
                {'icon': '😌', 'title': 'Mood history', 'description': 'Past AI mood detections and recommendation patterns.'},
                {'icon': '⭐', 'title': 'Favorite genres', 'description': 'Your personal taste graph and language preferences.'},
                {'icon': '🛠️', 'title': 'Account settings', 'description': 'Avatar upload, password updates, and privacy controls.'},
            ]},
        ],
        'show_mobile_nav': True,
    })


@app.route('/login')
def login_page():
    return render_template('auth_page.html', page={
        'title': 'Login - MoodFlix',
        'description': 'Modern OTT login screen with glassmorphism form styling.',
        'kind': 'auth',
        'mode': 'login',
    })


@app.route('/signup')
def signup_page():
    return render_template('auth_page.html', page={
        'title': 'Signup - MoodFlix',
        'description': 'Create an account and set your favorite genres and language preferences.',
        'kind': 'auth',
        'mode': 'signup',
    })


@app.route('/forgot-password')
def forgot_password_page():
    return render_template('auth_page.html', page={
        'title': 'Forgot Password - MoodFlix',
        'description': 'Reset your account access with a clean verification flow.',
        'kind': 'auth',
        'mode': 'forgot',
    })
    
    
@app.route('/community')
def community_page():
    return render_template('cinematic_page.html', page={
        'title': 'Community - MoodFlix',
        'description': 'Browse seeded users, inspect live profiles, and explore their reviews.',
        'kind': 'community',
        'active_nav': 'community',
        'hero': {
            'eyebrow': 'Community',
            'title': 'Browse the MoodFlix user community.',
            'subtitle': 'Inspect real seeded users, their preferences, ratings, mood scans, and review history.',
            'primary_cta': {'label': 'Refresh feed', 'href': '#communityBrowserSection'},
            'secondary_cta': {'label': 'Settings', 'href': '/settings'},
        },
        'sections': [
            {'type': 'stats', 'title': 'Community overview', 'items': [
                {'label': 'Seeded users', 'value': '151'},
                {'label': 'Reviews', 'value': '1,289'},
                {'label': 'Mood scans', 'value': '776'},
                {'label': 'Watchlist items', 'value': '1,521'},
            ]},
            {
                'type': 'community-browser',
                'id': 'communityBrowserSection',
                'left_title': 'Browse users',
                'left_subtitle': 'Select a user to inspect their profile summary and recent reviews.',
            },
        ],
        'show_mobile_nav': True,
    })


@app.route('/notifications')
def notifications_page():
    return render_template('cinematic_page.html', page={
        'title': 'Notifications - MoodFlix',
        'description': 'Trending alerts, new releases, and watchlist reminders.',
        'kind': 'notifications',
        'active_nav': 'home',
        'hero': {
            'eyebrow': 'Notifications',
            'title': 'Stay updated on trending films and AI alerts.',
            'subtitle': 'Read and unread categories keep your movie alerts organized.',
        },
        'sections': [
            {'type': 'notification-list', 'title': 'Recent alerts', 'items': [
                {'title': 'New release added', 'text': 'A new regional blockbuster has entered the upcoming shelf.', 'tag': 'New'},
                {'title': 'AI recommendation ready', 'text': 'Your latest mood scan has a fresh personalized playlist.', 'tag': 'AI'},
                {'title': 'Watchlist reminder', 'text': 'You have 4 saved movies awaiting trailer playback.', 'tag': 'Saved'},
            ]},
        ],
        'show_mobile_nav': True,
    })


@app.route('/regional')
def regional_page():
    return render_template('cinematic_page.html', page={
        'title': 'Regional Cinema - MoodFlix',
        'description': 'Explore Indian regional cinema collections by language and industry.',
        'kind': 'regional',
        'active_nav': 'home',
        'hero': {
            'eyebrow': 'Regional Cinema',
            'title': 'Bollywood, Tollywood, Kollywood, Mollywood, and more.',
            'subtitle': 'Language filters and regional banners help you jump between cinema cultures quickly.',
        },
        'sections': [
            {'type': 'feature-grid', 'title': 'Industries', 'items': [
                {'icon': '🟠', 'title': 'Bollywood', 'description': 'Hindi cinema and pan-India hits.'},
                {'icon': '🔵', 'title': 'Tollywood', 'description': 'Telugu action, drama, and mass cinema.'},
                {'icon': '🟢', 'title': 'Kollywood', 'description': 'Tamil storytelling and star-driven blockbusters.'},
                {'icon': '🟣', 'title': 'Mollywood', 'description': 'Malayalam realism and critically acclaimed films.'},
            ]},
            {'type': 'movie-row', 'title': 'Trending regional titles', 'movies': [movie_card(movie) for movie in ranked_catalog()[:10]]},
        ],
        'show_mobile_nav': True,
    })


@app.route('/trending')
def trending_page():
    page = int(request.args.get('page', 1) or 1)
    return render_template('cinematic_page.html', page=build_movie_page(
        title='Trending Movies - MoodFlix',
        description='Daily, weekly, and viral movie trends ranked in a premium layout.',
        items=ranked_catalog()[:100],
        page=page,
        hero={
            'eyebrow': 'Trending',
            'title': 'Daily and weekly trending titles.',
            'subtitle': 'Animated ranking indicators and popularity highlights.',
        },
        kind='trending',
        active_nav='home',
    ))


@app.route('/upcoming')
def upcoming_page():
    page = int(request.args.get('page', 1) or 1)
    return render_template('cinematic_page.html', page=build_movie_page(
        title='Upcoming Movies - MoodFlix',
        description='Countdowns, teasers, and trailer previews for upcoming releases.',
        items=ranked_catalog(sort_key='year', reverse=True)[:100],
        page=page,
        hero={
            'eyebrow': 'Upcoming',
            'title': 'Releases, teasers, and reminders.',
            'subtitle': 'Track what is coming next with polished preview cards.',
        },
        kind='upcoming',
        active_nav='home',
    ))


@app.route('/settings')
def settings_page():
    return render_template('cinematic_page.html', page={
        'title': 'Settings - MoodFlix',
        'description': 'Theme, language, notification, privacy, camera, and AI personalization controls.',
        'kind': 'settings',
        'active_nav': 'profile',
        'hero': {
            'eyebrow': 'Settings',
            'title': 'Personalize the streaming experience.',
            'subtitle': 'Control camera permissions, AI personalization, language, and notifications.',
        },
        'sections': [
            {'type': 'settings-list', 'title': 'Preferences', 'items': [
                {'label': 'Dark mode', 'value': 'On', 'kind': 'toggle', 'checked': True, 'setting_key': 'dark_mode'},
                {'label': 'Autoplay previews', 'value': 'On', 'kind': 'toggle', 'checked': True, 'setting_key': 'autoplay_previews'},
                {'label': 'AI mood detection', 'value': 'On', 'kind': 'toggle', 'checked': True, 'setting_key': 'ai_mood_detection'},
                {'label': 'Smart recommendations', 'value': 'On', 'kind': 'toggle', 'checked': True, 'setting_key': 'smart_recommendations'},
                {'label': 'Watchlist reminders', 'value': 'On', 'kind': 'toggle', 'checked': True, 'setting_key': 'watchlist_reminders'},
                {'label': 'Trending notifications', 'value': 'Off', 'kind': 'toggle', 'checked': False, 'setting_key': 'trending_notifications'},
                {'label': 'Camera permissions', 'value': 'Ask every time', 'kind': 'toggle', 'checked': False, 'setting_key': 'camera_permissions'},
                {'label': 'Subtitle assistance', 'value': 'Off', 'kind': 'toggle', 'checked': False, 'setting_key': 'subtitle_assistance'},
                {'label': 'Data saver mode', 'value': 'Off', 'kind': 'toggle', 'checked': False, 'setting_key': 'data_saver_mode'},
                {'label': 'Voice search', 'value': 'Off', 'kind': 'toggle', 'checked': False, 'setting_key': 'voice_search'},
                {'label': 'Language', 'value': 'English', 'kind': 'value'},
                {'label': 'Playback quality', 'value': 'Auto', 'kind': 'value'},
            ]},
        ],
        'show_mobile_nav': True,
    })


@app.route('/subscription')
def subscription_page():
    return render_template('cinematic_page.html', page={
        'title': 'Subscription - MoodFlix',
        'description': 'Pricing cards and premium feature comparison for OTT membership plans.',
        'kind': 'subscription',
        'active_nav': 'home',
        'hero': {
            'eyebrow': 'Premium Plans',
            'title': 'Choose a plan that matches your viewing style.',
            'subtitle': 'Monthly or yearly options with premium playback and AI features.',
        },
        'sections': [
            {'type': 'pricing-cards', 'title': 'Subscription plans', 'items': [
                {'name': 'Basic', 'price': '$4.99', 'benefits': ['HD streaming', 'AI mood detection', '1 profile']},
                {'name': 'Plus', 'price': '$9.99', 'benefits': ['4K streaming', 'Downloads', '2 profiles']},
                {'name': 'Ultra', 'price': '$14.99', 'benefits': ['Family sharing', 'Watch party', 'Priority AI'], 'featured': True},
            ]},
        ],
        'show_mobile_nav': True,
    })


@app.route('/admin')
def admin_page():
    admin_token = os.getenv('ADMIN_TOKEN')
    provided_token = request.headers.get('X-Admin-Token') or request.args.get('admin_token')
    if not admin_token or provided_token != admin_token:
        abort(404)

    return render_template('cinematic_page.html', page={
        'title': 'Admin Dashboard - MoodFlix',
        'description': 'Movie management, analytics, recommendation controls, and model monitoring.',
        'kind': 'admin',
        'active_nav': 'home',
        'hero': {
            'eyebrow': 'Admin Dashboard',
            'title': 'Manage content, analytics, and recommendation controls.',
            'subtitle': 'A production-ready control room for movies, posters, trailers, and AI models.',
        },
        'sections': [
            {'type': 'stats', 'title': 'System metrics', 'items': [
                {'label': 'Movies', 'value': f'{len(catalog):,}'},
                {'label': 'Users', 'value': '12.4K'},
                {'label': 'Watch time', 'value': '48K hrs'},
                {'label': 'Mood scans', 'value': '8.2K'},
            ]},
            {'type': 'feature-grid', 'title': 'Admin controls', 'items': [
                {'icon': '➕', 'title': 'Add / edit / delete', 'description': 'Maintain catalog entries and metadata.'},
                {'icon': '🖼️', 'title': 'Poster upload', 'description': 'Manage local and remote artwork assets.'},
                {'icon': '📊', 'title': 'Analytics', 'description': 'Track watch trends, moods, and engagement.'},
                {'icon': '🤖', 'title': 'Model monitoring', 'description': 'Observe AI recommendation quality and drift.'},
            ]},
        ],
        'show_mobile_nav': True,
    })


@app.route('/404')
def not_found_page():
    abort(404)


@app.errorhandler(404)
def page_not_found(error):
    return render_template('error_page.html', page={
        'title': 'Movie Not Found - MoodFlix',
        'description': 'A cinematic 404 page with a return home action.',
    }), 404


@app.route('/api/movies', methods=['GET'])
def api_movies():
    query = request.args.get('search', '').strip()
    genre = request.args.get('genre', '').strip()
    language = request.args.get('language', '').strip()
    year = request.args.get('year', '').strip()
    rating = request.args.get('rating', '').strip()
    sort_by = request.args.get('sortBy', 'rating')
    sort_order = request.args.get('sortOrder', 'desc')
    page = int(request.args.get('page', 1) or 1)
    limit = int(request.args.get('limit', 20) or 20)

    # rating range filter e.g. "7-8"
    rating_min = None
    if rating and '-' in rating:
        parts = rating.split('-')
        try:
            rating_min = float(parts[0])
        except ValueError:
            pass

    results = filter_catalog(query=query, genre=genre, language=language, year=year, actor=request.args.get('actor', '').strip())
    if rating_min is not None:
        results = [m for m in results if float(m.get('rating') or 0) >= rating_min]

    reverse = sort_order != 'asc'
    results = ranked_catalog(results, sort_key=sort_by if sort_by in ('rating', 'year', 'title') else 'rating', reverse=reverse)

    total = len(results)
    start = (page - 1) * limit
    page_items = results[start:start + limit]

    return jsonify({
        'success': True,
        'data': {
            'movies': [movie_card(m) for m in page_items],
            'pagination': {
                'currentPage': page,
                'totalPages': max((total + limit - 1) // limit, 1),
                'totalMovies': total,
                'limit': limit,
                'hasPrevPage': page > 1,
                'hasNextPage': page * limit < total,
            }
        }
    })


@app.route('/api/movies/trending', methods=['GET'])
def api_trending():
    limit = int(request.args.get('limit', 10))
    items = ranked_catalog()[:limit]
    return jsonify({'success': True, 'data': [movie_card(m) for m in items]})


@app.route('/api/movies/<slug>', methods=['GET'])
def api_movie_detail(slug):
    movie = find_movie_by_slug(slug)
    if not movie:
        return jsonify({'success': False, 'message': 'Movie not found'}), 404
    card = movie_card(movie)
    card['cast'] = movie.get('cast') or []
    card['overview'] = movie.get('overview') or ''
    card['backdropUrl'] = movie.get('backdrop') or movie.get('poster') or ''
    card['posterUrl'] = movie.get('poster') or ''
    return jsonify({'success': True, 'data': card})


@app.route('/api/movies/<slug>/trailer', methods=['GET'])
def api_movie_trailer(slug):
    movie = find_movie_by_slug(slug)
    if not movie:
        return jsonify({'success': False, 'message': 'Movie not found'}), 404
    trailer = movie.get('trailer_url') or ''
    embed = trailer.replace('watch?v=', 'embed/') if 'youtube.com/watch' in trailer else trailer
    return jsonify({'success': True, 'data': {'embedUrl': embed, 'title': movie.get('title')}})


@app.route('/api/movies/<slug>/recommendations', methods=['GET'])
def api_movie_recommendations(slug):
    movie = find_movie_by_slug(slug)
    if not movie:
        return jsonify({'success': False, 'message': 'Movie not found'}), 404
    genres = movie.get('genres') or []
    similar = [m for m in ranked_catalog() if m.get('id') != movie.get('id') and set(m.get('genres') or []) & set(genres)]
    return jsonify({'success': True, 'data': [movie_card(m) for m in similar[:10]]})


@app.route('/api/movies/mood/<mood>', methods=['GET'])
def api_mood_movies(mood):
    recs = engine.get_recommendations(mood, top_n=20)
    items = []
    for _, row in recs.iterrows():
        items.append({
            'id': row.get('id'),
            'slug': slugify(row.get('title')),
            'title': row.get('title'),
            'poster': row.get('poster_url'),
            'posterUrl': row.get('poster_url'),
            'rating': row.get('match_score') or 0,
            'genres': [g.strip() for g in str(row.get('genres') or '').split(',') if g.strip()],
            'overview': row.get('overview'),
        })
    return jsonify({'success': True, 'data': items})


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

    # Validate top_n
    try:
        top_n = max(1, min(int(top_n), 50))
    except (TypeError, ValueError):
        top_n = 10

    # --- Recommendations ---
    recs = engine.get_recommendations(mood, user_id=user_id, top_n=top_n)

    # Build response with poster_url and trailer_url
    columns = ['id', 'title', 'genres', 'overview', 'match_score']
    if 'poster_url' in recs.columns:
        columns.append('poster_url')
    if 'trailer_url' in recs.columns:
        columns.append('trailer_url')

    # Convert NaN to None for valid JSON serialization
    recs_dict = recs[columns].to_dict('records')
    for rec in recs_dict:
        for key, val in rec.items():
            try:
                if pd.isna(val):
                    rec[key] = None
            except (TypeError, ValueError):
                pass

    return jsonify({
        'mood_analysis': analysis,
        'message': f"Because you're feeling {mood}, we picked these for you.",
        'recommendations': recs_dict
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
    return jsonify({
        'status': 'ok',
        'movies_loaded': len(movies),
        'mongodb': is_connected(),
        'catalog_size': len(catalog)
    })


@app.route('/api/model-status', methods=['GET'])
def model_status():
    model_path = Path(__file__).resolve().parent / 'static' / 'models' / 'mood-model' / 'model.json'
    return jsonify({
        'available': model_path.exists(),
        'url': '/static/models/mood-model/model.json',
    })


# ============================================================
# MongoDB-Backed API Endpoints
# ============================================================

@app.route('/api/mood/scan', methods=['POST'])
def record_mood_scan():
    """Record a mood scan result to MongoDB."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503

    data = request.get_json() or {}
    scan = {
        'detectedMood': data.get('detectedMood', 'chill'),
        'confidence': float(data.get('confidence', 0.5)),
        'predictions': data.get('predictions', []),
        'deviceType': data.get('deviceType', 'web'),
        'inputType': data.get('inputType', 'camera'),
        'inputText': data.get('inputText'),
        'lightingScore': data.get('lightingScore'),
        'faceCount': data.get('faceCount', 1),
        'processingTimeMs': data.get('processingTimeMs'),
        'modelVersion': data.get('modelVersion', 'v1.0.0'),
        'status': 'completed',
        'scannedAt': datetime.utcnow(),
        'expiresAt': datetime(2099, 1, 1),  # Will be set properly with TTL
    }

    # Add userId if provided
    user_id = data.get('userId')
    if user_id:
        try:
            scan['userId'] = ObjectId(user_id)
        except Exception:
            return jsonify({'error': 'Invalid userId'}), 400

    result = db['mood_scans'].insert_one(scan)
    return jsonify({
        'success': True,
        'scanId': str(result.inserted_id),
        'detectedMood': scan['detectedMood'],
        'confidence': scan['confidence']
    }), 201


@app.route('/api/mood/feedback', methods=['POST'])
def mood_feedback():
    """Record user feedback on mood detection."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503

    data = request.get_json() or {}
    scan_id = data.get('scanId')
    if not scan_id:
        return jsonify({'error': 'scanId required'}), 400

    from bson import ObjectId
    try:
        db['mood_scans'].update_one(
            {'_id': ObjectId(scan_id)},
            {'$set': {
                'wasAccurate': data.get('wasAccurate', False),
                'userCorrectedMood': data.get('correctedMood'),
                'feedbackAt': datetime.utcnow()
            }}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    return jsonify({'success': True, 'message': 'Feedback recorded'})


@app.route('/api/mood/history', methods=['GET'])
def mood_history():
    """Get mood scan history."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503

    days = int(request.args.get('days', 30))
    since = datetime.utcnow() - timedelta(days=days)

    scans = list(db['mood_scans'].find(
        {'status': 'completed', 'scannedAt': {'$gte': since}},
        {'_id': 0, 'detectedMood': 1, 'confidence': 1, 'scannedAt': 1,
         'inputType': 1, 'wasAccurate': 1}
    ).sort('scannedAt', -1).limit(100))

    # Convert datetime for JSON
    for s in scans:
        if 'scannedAt' in s:
            s['scannedAt'] = s['scannedAt'].isoformat()

    return jsonify({'count': len(scans), 'history': scans})


@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Get user's watchlist from MongoDB."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503

    entries = list(db['watchlist'].find(
        {}, {'_id': 0}
    ).sort('addedAt', -1).limit(50))

    for e in entries:
        if 'addedAt' in e:
            e['addedAt'] = e['addedAt'].isoformat() if hasattr(e['addedAt'], 'isoformat') else str(e['addedAt'])
        if 'movieId' in e:
            e['movieId'] = str(e['movieId'])

    return jsonify({'count': len(entries), 'watchlist': entries})


@app.route('/api/watchlist/toggle', methods=['POST'])
def toggle_watchlist():
    """Add/remove a movie from watchlist."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503

    data = request.get_json() or {}
    movie_slug = data.get('slug')
    if not movie_slug:
        return jsonify({'error': 'slug required'}), 400

    existing = db['watchlist'].find_one({'slug': movie_slug})
    if existing:
        db['watchlist'].delete_one({'slug': movie_slug})
        return jsonify({'action': 'removed', 'slug': movie_slug})
    else:
        db['watchlist'].insert_one({
            'slug': movie_slug,
            'title': data.get('title', ''),
            'status': 'want_to_watch',
            'addedFrom': data.get('addedFrom', 'manual'),
            'addedAt': datetime.utcnow()
        })
        return jsonify({'action': 'added', 'slug': movie_slug}), 201


@app.route('/api/mood/stats', methods=['GET'])
def mood_stats():
    """Get aggregated mood statistics."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503

    days = int(request.args.get('days', 7))
    since = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {'$match': {'status': 'completed', 'scannedAt': {'$gte': since}}},
        {'$group': {'_id': '$detectedMood', 'count': {'$sum': 1},
                    'avgConf': {'$avg': '$confidence'}}},
        {'$sort': {'count': -1}}
    ]
    stats = list(db['mood_scans'].aggregate(pipeline))
    total = sum(s['count'] for s in stats)

    return jsonify({
        'period': f'{days} days',
        'totalScans': total,
        'dominantMood': stats[0]['_id'] if stats else None,
        'distribution': [{
            'mood': s['_id'], 'count': s['count'],
            'pct': round(s['count'] / total * 100) if total else 0,
            'avgConfidence': round(s['avgConf'], 2)
        } for s in stats]
    })


# ============================================================
# Enhanced MongoDB API Routes (via api_mongo helpers)
# ============================================================

@app.route('/api/user/<user_id>/mood-scans', methods=['POST'])
def record_user_mood_scan(user_id):
    """Record mood scan for a user."""
    data = request.get_json() or {}
    result = create_mood_scan(
        user_id,
        data.get('detected_mood', 'chill'),
        data.get('confidence', 0.5),
        data.get('raw_emotions', {}),
        browser=request.headers.get('User-Agent'),
    )
    
    status_code = result.get('status', 201)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 201


@app.route('/api/user/<user_id>/mood-scans', methods=['GET'])
def get_user_moods(user_id):
    """Fetch user's mood scan history."""
    limit = int(request.args.get('limit', 10))
    result = get_user_mood_scans(user_id, limit=limit)
    
    status_code = result.get('status', 200)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 200


@app.route('/api/user/<user_id>/watchlist', methods=['GET'])
def fetch_user_watchlist(user_id):
    """Fetch user's watchlist from MongoDB."""
    result = get_user_watchlist(user_id)
    
    status_code = result.get('status', 200)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 200


@app.route('/api/user/<user_id>/watchlist', methods=['POST'])
def add_movie_to_watchlist(user_id):
    """Add movie to user's watchlist."""
    data = request.get_json() or {}
    movie_id = data.get('movie_id')
    status = data.get('status', 'to_watch')
    
    if not movie_id:
        return jsonify({'error': 'movie_id required'}), 400
    
    result = add_to_watchlist(user_id, movie_id, status)
    
    status_code = result.get('status', 201)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 201


@app.route('/api/user/<user_id>/watchlist/<movie_id>', methods=['DELETE'])
def remove_movie_from_watchlist(user_id, movie_id):
    """Remove movie from user's watchlist."""
    result = remove_from_watchlist(user_id, movie_id)
    
    status_code = result.get('status', 200)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 200


@app.route('/api/user/<user_id>/rating/<movie_id>', methods=['POST'])
def record_movie_rating(user_id, movie_id):
    """Create or update a movie rating."""
    data = request.get_json() or {}
    score = data.get('score')
    review = data.get('review', '')
    
    if score is None:
        return jsonify({'error': 'score required'}), 400
    
    result = create_or_update_rating(user_id, movie_id, score, review)
    
    status_code = result.get('status', 201)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 201


@app.route('/api/user/<user_id>/rating/<movie_id>', methods=['GET'])
def get_user_movie_rating(user_id, movie_id):
    """Get user's rating for a specific movie."""
    result = get_user_rating(user_id, movie_id)
    
    status_code = result.get('status', 200)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 200


@app.route('/api/movie/<movie_id>/ratings', methods=['GET'])
def fetch_movie_ratings(movie_id):
    """Get all ratings for a movie."""
    result = get_movie_ratings(movie_id)
    
    status_code = result.get('status', 200)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 200


@app.route('/api/user/<user_id>/preferences', methods=['GET'])
def fetch_user_preferences(user_id):
    """Get user's preferences."""
    result = get_user_preferences(user_id)
    
    status_code = result.get('status', 200)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 200


@app.route('/api/user/<user_id>/preferences', methods=['POST'])
def update_user_prefs(user_id):
    """Update user's preferences."""
    data = request.get_json() or {}
    result = update_user_preferences(user_id, data)
    
    status_code = result.get('status', 201)
    if result.get('error'):
        return jsonify(result), status_code
    return jsonify(result), 201


# ============================================================
# User & Review Discovery API
# ============================================================

@app.route('/api/users', methods=['GET'])
def list_users():
    """Get paginated list of all users with basic info."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503
    
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    skip = (page - 1) * per_page
    
    total = db.users.count_documents({})
    users = list(db.users.find(
        {"name": {"$exists": True}},
        {"name": 1, "email": 1, "avatar": 1, "preferences": 1, "createdAt": 1}
    ).skip(skip).limit(per_page))
    
    # Add review count to each user
    for user in users:
        user['_id'] = str(user['_id'])
        user['reviewCount'] = db.ratings.count_documents({"userId": ObjectId(user['_id'])})
        user['moodScans'] = db.mood_scans.count_documents({"userId": ObjectId(user['_id'])})
        user['watchlistItems'] = db.watchlist.count_documents({"userId": ObjectId(user['_id'])})
    
    return jsonify({
        'success': True,
        'users': users,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })


@app.route('/api/user/<user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    """Get detailed user profile with stats."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503
    
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id_oid = ObjectId(user_id)
        review_count = db.ratings.count_documents({"userId": user_id_oid})
        mood_count = db.mood_scans.count_documents({"userId": user_id_oid})
        watchlist_count = db.watchlist.count_documents({"userId": user_id_oid})
        
        # Calculate average rating given
        avg_rating_pipeline = [
            {"$match": {"userId": user_id_oid}},
            {"$group": {"_id": None, "avgScore": {"$avg": "$score"}}}
        ]
        avg_rating_result = list(db.ratings.aggregate(avg_rating_pipeline))
        avg_rating = avg_rating_result[0]['avgScore'] if avg_rating_result else 0
        
        return jsonify({
            'success': True,
            'profile': {
                '_id': str(user['_id']),
                'name': user.get('name', 'Unknown'),
                'email': user.get('email'),
                'avatar': user.get('avatar', ''),
                'preferences': user.get('preferences', {}),
                'createdAt': user.get('createdAt').isoformat() if user.get('createdAt') else None,
                'lastLogin': user.get('lastLogin').isoformat() if user.get('lastLogin') else None,
                'stats': {
                    'totalReviews': review_count,
                    'averageRating': round(avg_rating, 2),
                    'moodScans': mood_count,
                    'watchlistItems': watchlist_count,
                }
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/user/<user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    """Get user's reviews and ratings."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503
    
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        user_id_oid = ObjectId(user_id)
        total = db.ratings.count_documents({"userId": user_id_oid})
        
        reviews = list(db.ratings.find(
            {"userId": user_id_oid},
            {"_id": 1, "score": 1, "review": 1, "createdAt": 1}
        ).sort("createdAt", -1).skip(skip).limit(per_page))
        
        for review in reviews:
            review['_id'] = str(review['_id'])
            review['createdAt'] = review.get('createdAt').isoformat() if review.get('createdAt') else None
        
        return jsonify({
            'success': True,
            'reviews': reviews,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/reviews/top', methods=['GET'])
def get_top_reviews():
    """Get top-rated reviews across all users."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503
    
    limit = int(request.args.get('limit', 20))
    
    top_reviews = list(db.ratings.find(
        {"score": {"$gte": 4.0}},
        {"_id": 1, "userId": 1, "score": 1, "review": 1, "createdAt": 1}
    ).sort("score", -1).limit(limit))
    
    # Get user names
    for review in top_reviews:
        review['_id'] = str(review['_id'])
        user = db.users.find_one({"_id": review['userId']}, {"name": 1})
        review['userName'] = user.get('name', 'Unknown') if user else 'Unknown'
        review['userId'] = str(review['userId'])
        review['createdAt'] = review.get('createdAt').isoformat() if review.get('createdAt') else None
    
    return jsonify({
        'success': True,
        'reviews': top_reviews,
        'count': len(top_reviews)
    })


@app.route('/api/reviews/recent', methods=['GET'])
def get_recent_reviews():
    """Get most recently added reviews."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503
    
    limit = int(request.args.get('limit', 30))
    
    recent = list(db.ratings.find(
        {"_id": {"$exists": True}},
        {"_id": 1, "userId": 1, "score": 1, "review": 1, "createdAt": 1}
    ).sort("createdAt", -1).limit(limit))
    
    # Get user names
    for review in recent:
        review['_id'] = str(review['_id'])
        user = db.users.find_one({"_id": review['userId']}, {"name": 1})
        review['userName'] = user.get('name', 'Unknown') if user else 'Unknown'
        review['userId'] = str(review['userId'])
        review['createdAt'] = review.get('createdAt').isoformat() if review.get('createdAt') else None
    
    return jsonify({
        'success': True,
        'reviews': recent,
        'count': len(recent)
    })


@app.route('/api/stats/users', methods=['GET'])
def get_user_stats():
    """Get aggregated user statistics."""
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database not available'}), 503
    
    total_users = db.users.count_documents({})
    total_ratings = db.ratings.count_documents({})
    total_mood_scans = db.mood_scans.count_documents({})
    total_watchlist = db.watchlist.count_documents({})
    
    # Average ratings
    avg_pipeline = [
        {"$group": {"_id": None, "avgScore": {"$avg": "$score"}}}
    ]
    avg_result = list(db.ratings.aggregate(avg_pipeline))
    avg_score = avg_result[0]['avgScore'] if avg_result else 0
    
    # Most active users
    active_pipeline = [
        {"$group": {"_id": "$userId", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    active_users = list(db.ratings.aggregate(active_pipeline))
    
    return jsonify({
        'success': True,
        'stats': {
            'totalUsers': total_users,
            'totalReviews': total_ratings,
            'totalMoodScans': total_mood_scans,
            'totalWatchlistItems': total_watchlist,
            'averageRating': round(avg_score, 2),
            'mostActiveReviewers': len(active_users)
        }
    })


# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5001, use_reloader=False)
