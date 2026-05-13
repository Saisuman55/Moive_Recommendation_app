"""
MongoDB API Helpers for MoodFlix
=================================
Flask route helpers that delegate to db_mongo collection managers.
Handles mood scans, watchlist, ratings, and user preferences persistence.
"""
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from db_mongo import (
    get_mood_scans_collection,
    get_watchlist_collection,
    get_ratings_collection,
    get_users_collection,
    get_movies_collection,
)
from models import MoodScan, Watchlist, Rating


def _to_object_id(value: str):
    """Safely convert string to ObjectId, returns None on failure."""
    if not value:
        return None
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


# ============================================================================
# Mood Scan Operations
# ============================================================================

def create_mood_scan(user_id: str, detected_mood: str, confidence: float, 
                     raw_emotions: dict, **kwargs):
    """Create and store a mood scan result."""
    try:
        collection = get_mood_scans_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        if user_oid is None:
            return {"error": "Invalid user_id", "status": 400}

        mood_doc = MoodScan.new(
            user_oid,
            detected_mood,
            confidence=confidence,
            rawEmotions=raw_emotions,
            browser=kwargs.get("browser"),
            ipAddress=kwargs.get("ipAddress"),
        )
        result = collection.insert_one(mood_doc)
        return {
            "success": True,
            "scanId": str(result.inserted_id),
            "mood": detected_mood,
            "confidence": confidence,
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


def get_user_mood_scans(user_id: str, limit: int = 10):
    """Fetch recent mood scans for a user."""
    try:
        collection = get_mood_scans_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        if user_oid is None:
            return {"error": "Invalid user_id", "status": 400}

        scans = list(collection.find(
            {"userId": user_oid},
            {"_id": 1, "detectedMood": 1, "confidence": 1, "timestamp": 1}
        ).sort("timestamp", -1).limit(limit))
        
        return {
            "success": True,
            "scans": [
                {
                    "id": str(s["_id"]),
                    "mood": s["detectedMood"],
                    "confidence": s.get("confidence", 0),
                    "timestamp": s["timestamp"].isoformat() if s.get("timestamp") else None,
                }
                for s in scans
            ]
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


# ============================================================================
# Watchlist Operations
# ============================================================================

def add_to_watchlist(user_id: str, movie_id: str, status: str = "to_watch"):
    """Add movie to user's watchlist."""
    try:
        collection = get_watchlist_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        movie_oid = _to_object_id(movie_id)
        if user_oid is None or movie_oid is None:
            return {"error": "Invalid user_id or movie_id", "status": 400}

        # Upsert user's watchlist
        result = collection.update_one(
            {"userId": user_oid},
            {
                "$set": {"userId": user_oid, "updatedAt": datetime.utcnow()},
                "$addToSet": {
                    "items": {
                        "movieId": movie_oid,
                        "status": status,
                        "addedAt": datetime.utcnow(),
                    }
                }
            },
            upsert=True
        )
        
        return {"success": True, "status": "added_to_watchlist"}
    except Exception as e:
        return {"error": str(e), "status": 500}


def get_user_watchlist(user_id: str):
    """Fetch user's watchlist."""
    try:
        collection = get_watchlist_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        if user_oid is None:
            return {"error": "Invalid user_id", "status": 400}

        watchlist = collection.find_one({"userId": user_oid})
        
        if not watchlist:
            return {"success": True, "items": []}
        
        return {
            "success": True,
            "items": [
                {
                    "movieId": str(item.get("movieId")),
                    "status": item.get("status", "to_watch"),
                    "addedAt": item.get("addedAt").isoformat() if item.get("addedAt") else None,
                }
                for item in watchlist.get("items", [])
            ]
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


def remove_from_watchlist(user_id: str, movie_id: str):
    """Remove movie from user's watchlist."""
    try:
        collection = get_watchlist_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        movie_oid = _to_object_id(movie_id)
        if user_oid is None or movie_oid is None:
            return {"error": "Invalid user_id or movie_id", "status": 400}

        result = collection.update_one(
            {"userId": user_oid},
            {"$pull": {"items": {"movieId": movie_oid}}}
        )
        
        return {"success": True, "removed": result.modified_count > 0}
    except Exception as e:
        return {"error": str(e), "status": 500}


# ============================================================================
# Rating Operations
# ============================================================================

def create_or_update_rating(user_id: str, movie_id: str, score: float, 
                            review: str = ""):
    """Create or update a movie rating."""
    try:
        collection = get_ratings_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        movie_oid = _to_object_id(movie_id)
        if user_oid is None or movie_oid is None:
            return {"error": "Invalid user_id or movie_id", "status": 400}

        result = collection.update_one(
            {"userId": user_oid, "movieId": movie_oid},
            {
                "$set": {
                    "score": max(0, min(5, float(score))),
                    "review": review,
                    "updatedAt": datetime.utcnow(),
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "upserted": result.upserted_id is not None,
            "modified": result.modified_count > 0,
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


def get_movie_ratings(movie_id: str):
    """Fetch all ratings for a movie."""
    try:
        collection = get_ratings_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        movie_oid = _to_object_id(movie_id)
        if movie_oid is None:
            return {"error": "Invalid movie_id", "status": 400}

        ratings = list(collection.find(
            {"movieId": movie_oid},
            {"userId": 1, "score": 1, "review": 1}
        ))
        
        if not ratings:
            return {"success": True, "avgRating": 0, "count": 0, "ratings": []}
        
        avg_rating = sum(r["score"] for r in ratings) / len(ratings)
        
        return {
            "success": True,
            "avgRating": round(avg_rating, 2),
            "count": len(ratings),
            "ratings": [
                {
                    "userId": str(r["userId"]),
                    "score": r["score"],
                    "review": r.get("review", ""),
                }
                for r in ratings
            ]
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


def get_user_rating(user_id: str, movie_id: str):
    """Fetch user's rating for a specific movie."""
    try:
        collection = get_ratings_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        movie_oid = _to_object_id(movie_id)
        if user_oid is None or movie_oid is None:
            return {"error": "Invalid user_id or movie_id", "status": 400}

        rating = collection.find_one({
            "userId": user_oid,
            "movieId": movie_oid,
        })
        
        if not rating:
            return {"success": True, "rating": None}
        
        return {
            "success": True,
            "rating": {
                "score": rating["score"],
                "review": rating.get("review", ""),
                "createdAt": rating.get("createdAt").isoformat() if rating.get("createdAt") else None,
            }
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


# ============================================================================
# User Preferences Operations
# ============================================================================

def update_user_preferences(user_id: str, preferences: dict):
    """Update user preferences (settings, toggles, etc.)."""
    try:
        collection = get_users_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        if user_oid is None:
            return {"error": "Invalid user_id", "status": 400}

        result = collection.update_one(
            {"_id": user_oid},
            {
                "$set": {
                    "preferences": preferences,
                    "updatedAt": datetime.utcnow(),
                }
            }
        )
        
        return {
            "success": True,
            "modified": result.modified_count > 0,
        }
    except Exception as e:
        return {"error": str(e), "status": 500}


def get_user_preferences(user_id: str):
    """Fetch user preferences."""
    try:
        collection = get_users_collection()
        if collection is None:
            return {"error": "MongoDB unavailable", "status": 503}

        user_oid = _to_object_id(user_id)
        if user_oid is None:
            return {"error": "Invalid user_id", "status": 400}

        user = collection.find_one(
            {"_id": user_oid},
            {"preferences": 1}
        )
        
        if not user:
            return {"success": True, "preferences": {}}
        
        return {
            "success": True,
            "preferences": user.get("preferences", {})
        }
    except Exception as e:
        return {"error": str(e), "status": 500}
