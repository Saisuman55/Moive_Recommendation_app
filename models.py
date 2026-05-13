"""
MongoDB Models & Schemas for MoodFlix
======================================
Defines collection schemas, validators, and helper methods.

Collections:
  - users: User profiles, auth, preferences
  - movies: Movie catalog with mood tags and embeddings
  - watchlist: Per-user watchlist entries
  - ratings: User movie ratings and reviews
  - sessions: Active authentication sessions
  - model_metadata: Deployed ML model information
"""
from datetime import datetime, timedelta
from bson import ObjectId


def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    if not isinstance(password, str) or not password:
        raise ValueError("password is required")
    try:
        import bcrypt
    except ImportError as exc:
        raise RuntimeError("bcrypt is required for password hashing") from exc
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a bcrypt hash."""
    if not password or not password_hash:
        return False
    try:
        import bcrypt
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ImportError, ValueError):
        return False


class User:
    """User collection schema."""

    @staticmethod
    def new(email: str, password: str, name: str = "", **kwargs):
        """Create a new user document."""
        return {
            "_id": ObjectId(),
            "email": email.lower().strip(),
            "passwordHash": hash_password(password),
            "name": name or "",
            "avatar": kwargs.get("avatar", ""),
            "roles": kwargs.get("roles", ["user"]),
            "preferences": {
                "theme": kwargs.get("theme", "dark"),
                "language": kwargs.get("language", "en"),
                "cameraConsent": kwargs.get("cameraConsent", False),
                "toggles": kwargs.get("toggles", {}),
            },
            "lastLogin": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["email", "passwordHash"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "email": {"bsonType": "string"},
                "passwordHash": {"bsonType": "string"},
                "name": {"bsonType": "string"},
                "avatar": {"bsonType": "string"},
                "roles": {"bsonType": "array", "items": {"bsonType": "string"}},
                "preferences": {"bsonType": "object"},
                "lastLogin": {"bsonType": "date"},
                "createdAt": {"bsonType": "date"},
                "updatedAt": {"bsonType": "date"},
            }
        }


class Movie:
    """Movie collection schema."""

    @staticmethod
    def new(title: str, **kwargs):
        """Create a new movie document."""
        return {
            "_id": ObjectId(),
            "tmdbId": kwargs.get("tmdbId"),
            "imdbId": kwargs.get("imdbId"),
            "title": title,
            "slug": kwargs.get("slug", "").lower().replace(" ", "-"),
            "description": kwargs.get("description", ""),
            "genres": kwargs.get("genres", []),
            "releaseDate": kwargs.get("releaseDate"),
            "runtime": kwargs.get("runtime"),
            "language": kwargs.get("language", "en"),
            "posterUrl": kwargs.get("posterUrl"),
            "backdropUrl": kwargs.get("backdropUrl"),
            "avgRating": kwargs.get("avgRating", 0),
            "voteCount": kwargs.get("voteCount", 0),
            "overview": kwargs.get("overview", ""),
            "cast": kwargs.get("cast", []),
            "trailerUrl": kwargs.get("trailerUrl"),
            "embedding": kwargs.get("embedding", []),
            "moodTags": kwargs.get("moodTags", []),
            "primaryMood": kwargs.get("primaryMood", "happy"),
            "isActive": kwargs.get("isActive", True),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["title"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "tmdbId": {"bsonType": ["int", "null"]},
                "imdbId": {"bsonType": ["string", "null"]},
                "title": {"bsonType": "string"},
                "slug": {"bsonType": "string"},
                "description": {"bsonType": "string"},
                "genres": {"bsonType": "array", "items": {"bsonType": "string"}},
                "releaseDate": {"bsonType": ["date", "null"]},
                "runtime": {"bsonType": ["int", "null"]},
                "language": {"bsonType": "string"},
                "posterUrl": {"bsonType": ["string", "null"]},
                "backdropUrl": {"bsonType": ["string", "null"]},
                "avgRating": {"bsonType": ["double", "null"]},
                "voteCount": {"bsonType": "int"},
                "overview": {"bsonType": "string"},
                "cast": {"bsonType": "array"},
                "trailerUrl": {"bsonType": ["string", "null"]},
                "embedding": {"bsonType": ["array", "null"]},
                "moodTags": {"bsonType": "array", "items": {"bsonType": "string"}},
                "primaryMood": {"bsonType": "string"},
                "isActive": {"bsonType": "bool"},
                "createdAt": {"bsonType": "date"},
                "updatedAt": {"bsonType": "date"},
            }
        }


class Watchlist:
    """Watchlist collection schema (per-user)."""

    @staticmethod
    def new(user_id: ObjectId, **kwargs):
        """Create a new watchlist document."""
        return {
            "_id": ObjectId(),
            "userId": user_id,
            "name": kwargs.get("name", "default"),
            "items": kwargs.get("items", []),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

    @staticmethod
    def new_item(movie_id: ObjectId, status: str = "to_watch", **kwargs):
        """Create a watchlist item."""
        return {
            "movieId": movie_id,
            "status": status,  # to_watch, watching, watched
            "addedAt": datetime.utcnow(),
            "note": kwargs.get("note", ""),
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["userId"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "userId": {"bsonType": "objectId"},
                "name": {"bsonType": "string"},
                "items": {"bsonType": "array"},
                "createdAt": {"bsonType": "date"},
                "updatedAt": {"bsonType": "date"},
            }
        }


class Rating:
    """Rating collection schema."""

    @staticmethod
    def new(user_id: ObjectId, movie_id: ObjectId, score: float, **kwargs):
        """Create a new rating document."""
        return {
            "_id": ObjectId(),
            "userId": user_id,
            "movieId": movie_id,
            "score": max(0, min(5, score)),  # Clamp to 0-5
            "review": kwargs.get("review", ""),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["userId", "movieId", "score"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "userId": {"bsonType": "objectId"},
                "movieId": {"bsonType": "objectId"},
                "score": {"bsonType": "double", "minimum": 0, "maximum": 5},
                "review": {"bsonType": "string"},
                "createdAt": {"bsonType": "date"},
                "updatedAt": {"bsonType": "date"},
            }
        }


class Session:
    """Session/AuthToken collection schema."""

    @staticmethod
    def new(user_id: ObjectId, token_hash: str, **kwargs):
        """Create a new session document."""
        expires_in_days = kwargs.get("expires_in_days", 7)
        return {
            "_id": ObjectId(),
            "userId": user_id,
            "tokenHash": token_hash,
            "issuedAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(days=expires_in_days),
            "revoked": False,
            "meta": {
                "userAgent": kwargs.get("userAgent", ""),
            }
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["userId", "tokenHash"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "userId": {"bsonType": "objectId"},
                "tokenHash": {"bsonType": "string"},
                "issuedAt": {"bsonType": "date"},
                "expiresAt": {"bsonType": "date"},
                "revoked": {"bsonType": "bool"},
                "meta": {"bsonType": "object"},
            }
        }


class MoodScan:
    """Mood scan result collection schema."""

    @staticmethod
    def new(user_id: ObjectId, detected_mood: str, **kwargs):
        """Create a new mood scan document."""
        return {
            "_id": ObjectId(),
            "userId": user_id,
            "detectedMood": detected_mood,
            "confidence": kwargs.get("confidence", 0.5),
            "rawEmotions": kwargs.get("rawEmotions", {}),
            "frameHash": kwargs.get("frameHash", ""),
            "timestamp": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(days=30),
            "meta": {
                "browser": kwargs.get("browser", ""),
            }
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["userId", "detectedMood"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "userId": {"bsonType": "objectId"},
                "detectedMood": {"bsonType": "string"},
                "confidence": {"bsonType": "double"},
                "rawEmotions": {"bsonType": "object"},
                "frameHash": {"bsonType": "string"},
                "timestamp": {"bsonType": "date"},
                "expiresAt": {"bsonType": "date"},
                "meta": {"bsonType": "object"},
            }
        }


class ModelMetadata:
    """Model deployment metadata collection schema."""

    @staticmethod
    def new(name: str, version: str, path: str, **kwargs):
        """Create a new model metadata document."""
        return {
            "_id": ObjectId(),
            "name": name,
            "version": version,
            "path": path,
            "deployedAt": datetime.utcnow(),
            "status": kwargs.get("status", "deployed"),  # deployed, testing, deprecated
            "metrics": kwargs.get("metrics", {}),
            "notes": kwargs.get("notes", ""),
            "active": kwargs.get("active", True),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

    @staticmethod
    def schema():
        return {
            "bsonType": "object",
            "required": ["name", "version", "path"],
            "properties": {
                "_id": {"bsonType": "objectId"},
                "name": {"bsonType": "string"},
                "version": {"bsonType": "string"},
                "path": {"bsonType": "string"},
                "deployedAt": {"bsonType": "date"},
                "status": {"bsonType": "string"},
                "metrics": {"bsonType": "object"},
                "notes": {"bsonType": "string"},
                "active": {"bsonType": "bool"},
                "createdAt": {"bsonType": "date"},
                "updatedAt": {"bsonType": "date"},
            }
        }
