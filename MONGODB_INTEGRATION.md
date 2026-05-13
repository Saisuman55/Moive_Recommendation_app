# MongoDB Integration Pipeline for MoodFlix

## Overview
Complete MongoDB-backed persistence layer for user data, mood scans, watchlist, ratings, and preferences.

## Architecture

### 1. **models.py** — Collection Schemas
Defines MongoDB collection schemas with helper methods:
- `User`: Authentication, preferences, profile
- `Movie`: Catalog with mood mappings and embeddings  
- `Watchlist`: Per-user watchlist entries (user→movies)
- `Rating`: Movie ratings and reviews
- `Session`: Authentication tokens
- `MoodScan`: Mood detection results with confidence
- `ModelMetadata`: Deployed ML model tracking

**Usage:**
```python
from models import User, Movie, MoodScan
user_doc = User.new(email="user@example.com", password="secret", name="John")
mood_doc = MoodScan.new(user_oid, "happy", confidence=0.92)
```

### 2. **db_mongo.py** — Connection Manager
Connection pooling and collection helpers:
- `get_client()` — MongoDB client singleton
- `get_db()` — Database instance
- `is_connected()` — Connection status
- Collection helpers: `get_movies_collection()`, `get_ratings_collection()`, etc.

**Mood Mapping:** 14 unified moods (8 original + 6 from training kit)

### 3. **api_mongo.py** — Flask Helpers
Stateless helper functions for CRUD operations:
- Mood scan creation/retrieval
- Watchlist add/remove/fetch
- Rating create/update/fetch
- User preferences get/set

**Usage:**
```python
from api_mongo import create_mood_scan, add_to_watchlist, create_or_update_rating

result = create_mood_scan(user_id, "happy", 0.92, raw_emotions)
add_to_watchlist(user_id, movie_id, "to_watch")
create_or_update_rating(user_id, movie_id, 4.5, "Great film!")
```

### 4. **app.py** — Flask Routes
9 new MongoDB-backed API endpoints:

#### Mood Scans
- `POST /api/user/<user_id>/mood-scans` — Record mood scan
- `GET  /api/user/<user_id>/mood-scans` — Fetch mood history

#### Watchlist
- `POST /api/user/<user_id>/watchlist` — Add movie
- `GET  /api/user/<user_id>/watchlist` — Fetch watchlist
- `DELETE /api/user/<user_id>/watchlist/<movie_id>` — Remove movie

#### Ratings
- `POST /api/user/<user_id>/rating/<movie_id>` — Create/update rating
- `GET  /api/user/<user_id>/rating/<movie_id>` — Get user's rating
- `GET  /api/movie/<movie_id>/ratings` — Get all ratings for movie

#### Preferences
- `POST /api/user/<user_id>/preferences` — Update preferences
- `GET  /api/user/<user_id>/preferences` — Get preferences

## Setup

### Prerequisites
```bash
pip3 install pymongo
```

### Environment Variables
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mood_app?...
MONGODB_DB=mood_app
```

### Validation
```bash
# Test all endpoints
python3 << 'EOF'
import subprocess, json
from bson import ObjectId

user_id = str(ObjectId())
movie_id = str(ObjectId())

# Create mood scan
resp = subprocess.run(
    f'curl -s -X POST http://127.0.0.1:5001/api/user/{user_id}/mood-scans '
    f'-H "Content-Type: application/json" '
    f'-d \'{{"detected_mood": "happy", "confidence": 0.92}}\'',
    shell=True, capture_output=True, text=True
)
print(json.dumps(json.loads(resp.stdout), indent=2))
EOF
```

## Testing Results

✅ **All 6 endpoint categories tested successfully:**

| Endpoint | Method | Status |
|----------|--------|--------|
| Mood scans (create) | POST | ✅ Working |
| Mood scans (fetch) | GET | ✅ Working |
| Watchlist (add) | POST | ✅ Working |
| Watchlist (fetch) | GET | ✅ Working |
| Rating (create) | POST | ✅ Working |
| Preferences (update) | POST | ✅ Working |

## Usage Examples

### Record Mood Scan
```bash
curl -X POST http://localhost:5001/api/user/6a04a969b56a9fbf95957267/mood-scans \
  -H "Content-Type: application/json" \
  -d '{
    "detected_mood": "happy",
    "confidence": 0.92,
    "raw_emotions": {"happy": 0.92, "sad": 0.01}
  }'
```

Response:
```json
{
  "success": true,
  "scanId": "6a04a97129bda0e684c4d58c",
  "mood": "happy",
  "confidence": 0.92
}
```

### Add to Watchlist
```bash
curl -X POST http://localhost:5001/api/user/6a04a969b56a9fbf95957267/watchlist \
  -H "Content-Type: application/json" \
  -d '{
    "movie_id": "6a04a969b56a9fbf95957268",
    "status": "to_watch"
  }'
```

### Create Rating
```bash
curl -X POST http://localhost:5001/api/user/6a04a969b56a9fbf95957267/rating/6a04a969b56a9fbf95957268 \
  -H "Content-Type: application/json" \
  -d '{
    "score": 4.5,
    "review": "Excellent movie!"
  }'
```

### Update Preferences
```bash
curl -X POST http://localhost:5001/api/user/6a04a969b56a9fbf95957267/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "en",
    "cameraConsent": true
  }'
```

## Data Model

### Mood Scans
```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,
  "detectedMood": "happy",
  "confidence": 0.92,
  "rawEmotions": { "happy": 0.92, "sad": 0.01 },
  "timestamp": Date,
  "expiresAt": Date,  // TTL index
  "meta": { "browser": "...", "ipAddress": "..." }
}
```

### Watchlist
```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,
  "items": [
    {
      "movieId": ObjectId,
      "status": "to_watch",  // or "watching", "watched"
      "addedAt": Date,
      "note": "..."
    }
  ],
  "updatedAt": Date
}
```

### Ratings
```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,
  "movieId": ObjectId,
  "score": 4.5,  // 0-5
  "review": "...",
  "createdAt": Date,
  "updatedAt": Date
}
```

### Indexes
Automatically created:
- `mood_scans`: Compound (userId, timestamp), TTL on expiresAt
- `watchlist`: Compound (userId, items.movieId)
- `ratings`: Unique (userId, movieId)
- `users`: Index on email

## Graceful Degradation
If MongoDB is unavailable:
- App runs in CSV-only mode
- API endpoints return 503 with "Database not available"
- Frontend falls back to local state management

## Future Enhancements
- [ ] Real-time sync with WebSockets
- [ ] Aggregation pipelines for analytics
- [ ] Batch operations for bulk updates
- [ ] Change streams for reactive updates
- [ ] Sharding for scale
