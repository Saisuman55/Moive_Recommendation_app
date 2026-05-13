"""
MongoDB Seed Script - Generate 100+ Realistic Users with Reviews
================================================================
Creates realistic user profiles, ratings, mood scans, watchlist, and preferences.
"""
import random
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
uri = os.getenv('MONGODB_URI')
db_name = os.getenv('MONGODB_DB', 'mood_app')
client = MongoClient(uri, serverSelectionTimeoutMS=5000)
db = client[db_name]

# Sample data
FIRST_NAMES = [
    'Raj', 'Priya', 'Arjun', 'Neha', 'Rohan', 'Ananya', 'Vikram', 'Deepika',
    'Aditya', 'Sharma', 'Ravi', 'Pooja', 'Nikhil', 'Isha', 'Akshay', 'Sonya',
    'Rohit', 'Kavya', 'Sanjay', 'Meera', 'Varun', 'Nisha', 'Karan', 'Divya',
    'Arun', 'Sneha', 'Ajay', 'Priyanka', 'Harsh', 'Anjali', 'Sid', 'Radhika'
]

LAST_NAMES = [
    'Kumar', 'Singh', 'Patel', 'Sharma', 'Gupta', 'Verma', 'Reddy', 'Iyer',
    'Nair', 'Desai', 'Rao', 'Chopra', 'Joshi', 'Saxena', 'Pillai', 'Menon',
    'Bhat', 'Kulkarni', 'Mahajan', 'Trivedi', 'Mehta', 'Kapoor', 'Malhotra', 'Sinha'
]

MOVIE_TITLES = [
    'Nani Ma', 'Dunki', 'Animal', 'Pathaan', 'Jawan', 'Oppenheimer', 'Killers of the Flower Moon',
    'Barbie', 'Past Lives', 'Anatomy of a Fall', 'Poor Things', 'The Zone of Interest',
    'The Brutalist', 'Saltburn', 'Priscilla', 'The Killer', 'Dune: Part Two', 'Dune',
    '12 Angry Men', 'Casablanca', 'Citizen Kane', 'The Godfather', 'Pulp Fiction', 'Forrest Gump',
    'The Matrix', 'Inception', 'Interstellar', 'The Dark Knight', 'Fight Club', 'Se7en'
]

MOODS = ['happy', 'sad', 'excited', 'chill', 'romantic', 'angry', 'scared', 'nostalgic',
         'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic']

REVIEWS = [
    "Amazing movie! Absolutely loved it from start to finish.",
    "Great cinematography and brilliant performances.",
    "This movie touched my heart. A masterpiece!",
    "Engaging plot with excellent acting.",
    "One of the best films I've watched this year.",
    "Outstanding direction and screenplay.",
    "Captivating story with emotional depth.",
    "A must-watch for all cinema lovers.",
    "Brilliant acting by the lead characters.",
    "Perfectly crafted with stunning visuals.",
    "Really enjoyed the narrative flow.",
    "One of the best in its genre.",
    "Incredible performances all around.",
    "A film that stays with you long after watching.",
    "Masterful storytelling and execution.",
    "Phenomenal movie! Highly recommended.",
    "Great entertainment value.",
    "Beautifully directed and acted.",
    "Absolutely mesmerizing!",
    "A cinematic gem.",
    "Loved the character development.",
    "Exceptional filmmaking.",
    "Worth every minute of your time.",
    "A delightful experience.",
    "Gripping and engaging throughout.",
    "Simply brilliant!",
    "One of those rare perfect films.",
    "Outstanding narrative structure.",
    "Beautifully told story.",
    "A truly memorable experience."
]

def generate_users(count=150):
    """Generate realistic user documents."""
    users = []
    for i in range(count):
        user_id = ObjectId()
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        
        user = {
            "_id": user_id,
            "email": f"{first_name.lower()}.{last_name.lower()}{i}@moodflix.com",
            "passwordHash": "hashed_password_here",
            "name": f"{first_name} {last_name}",
            "avatar": f"https://ui-avatars.com/api/?name={first_name}+{last_name}",
            "roles": ["user"],
            "preferences": {
                "theme": random.choice(["dark", "light"]),
                "language": random.choice(["en", "hi", "te", "ta", "ml"]),
                "cameraConsent": random.choice([True, False]),
                "toggles": {
                    "autoplay": random.choice([True, False]),
                    "smart_recommendations": random.choice([True, False]),
                    "notifications": random.choice([True, False]),
                }
            },
            "lastLogin": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            "createdAt": datetime.utcnow() - timedelta(days=random.randint(30, 180)),
            "updatedAt": datetime.utcnow(),
        }
        users.append(user)
    return users

def generate_ratings(users, count_per_user=8):
    """Generate realistic ratings/reviews."""
    ratings = []
    movie_ids = [ObjectId() for _ in range(30)]  # Simulate 30 movies
    
    for user in users:
        # Each user rates 5-12 movies
        num_ratings = random.randint(5, 12)
        selected_movies = random.sample(movie_ids, min(num_ratings, len(movie_ids)))
        
        for movie_id in selected_movies:
            rating = {
                "_id": ObjectId(),
                "userId": user["_id"],
                "movieId": movie_id,
                "score": round(random.uniform(2.5, 5.0), 1),  # 2.5 to 5 stars
                "review": random.choice(REVIEWS),
                "createdAt": user["createdAt"] + timedelta(days=random.randint(0, 150)),
                "updatedAt": datetime.utcnow(),
            }
            ratings.append(rating)
    
    return ratings

def generate_mood_scans(users, count_per_user=5):
    """Generate realistic mood scan history."""
    scans = []
    
    for user in users:
        # Each user has 3-8 mood scans
        num_scans = random.randint(3, 8)
        
        for _ in range(num_scans):
            mood = random.choice(MOODS)
            scan = {
                "_id": ObjectId(),
                "userId": user["_id"],
                "detectedMood": mood,
                "confidence": round(random.uniform(0.75, 0.99), 2),
                "rawEmotions": {
                    mood: round(random.uniform(0.7, 1.0), 2),
                    random.choice([m for m in MOODS if m != mood]): round(random.uniform(0.0, 0.3), 2),
                },
                "timestamp": user["createdAt"] + timedelta(days=random.randint(0, 150), hours=random.randint(0, 23)),
                "expiresAt": datetime.utcnow() + timedelta(days=30),
                "meta": {
                    "browser": random.choice(["Chrome", "Safari", "Firefox", "Edge"]),
                    "ipAddress": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                }
            }
            scans.append(scan)
    
    return scans

def generate_watchlist(users, movie_ids):
    """Generate realistic watchlist entries."""
    watchlists = []
    
    for user in users:
        num_items = random.randint(5, 15)
        selected_movies = random.sample(movie_ids, min(num_items, len(movie_ids)))
        
        items = []
        for movie_id in selected_movies:
            item = {
                "movieId": movie_id,
                "status": random.choice(["to_watch", "watching", "watched"]),
                "addedAt": user["createdAt"] + timedelta(days=random.randint(0, 150)),
                "note": random.choice(["Recommended by friend", "Popular on MoodFlix", "Trending now", "", "Must watch!"]),
            }
            items.append(item)
        
        watchlist = {
            "_id": ObjectId(),
            "userId": user["_id"],
            "name": "default",
            "items": items,
            "createdAt": user["createdAt"],
            "updatedAt": datetime.utcnow(),
        }
        watchlists.append(watchlist)
    
    return watchlists

def seed_database():
    """Seed the entire database."""
    print("🌱 Starting MongoDB seeding process...\n")
    
    # Clear existing data (optional - comment out to preserve data)
    # print("🗑️  Clearing existing collections...")
    # db.users.delete_many({})
    # db.ratings.delete_many({})
    # db.mood_scans.delete_many({})
    # db.watchlist.delete_many({})
    
    # Generate and insert users
    print("👥 Generating 150 realistic users...")
    users = generate_users(150)
    result = db.users.insert_many(users)
    print(f"   ✅ Inserted {len(result.inserted_ids)} users")
    
    # Generate and insert ratings
    print("⭐ Generating ratings and reviews...")
    ratings = generate_ratings(users)
    result = db.ratings.insert_many(ratings)
    print(f"   ✅ Inserted {len(result.inserted_ids)} ratings/reviews ({len(ratings)/len(users):.1f} per user)")
    
    # Generate and insert mood scans
    print("😊 Generating mood scan history...")
    scans = generate_mood_scans(users)
    result = db.mood_scans.insert_many(scans)
    print(f"   ✅ Inserted {len(result.inserted_ids)} mood scans ({len(scans)/len(users):.1f} per user)")
    
    # Generate movie IDs for watchlist
    movie_ids = [ObjectId() for _ in range(30)]
    
    # Generate and insert watchlist
    print("📋 Generating watchlist entries...")
    watchlists = generate_watchlist(users, movie_ids)
    result = db.watchlist.insert_many(watchlists)
    print(f"   ✅ Inserted {len(result.inserted_ids)} watchlist entries ({sum(len(w['items']) for w in watchlists)/len(users):.1f} movies per user)")
    
    # Print summary statistics
    print("\n" + "="*70)
    print("📊 DATABASE SEEDING SUMMARY")
    print("="*70)
    print(f"✅ Total Users: {len(users)}")
    print(f"✅ Total Ratings: {len(ratings)}")
    print(f"✅ Total Mood Scans: {len(scans)}")
    print(f"✅ Total Watchlist Items: {sum(len(w['items']) for w in watchlists)}")
    print(f"\n📈 Average Stats per User:")
    print(f"   • Ratings: {len(ratings)/len(users):.1f}")
    print(f"   • Mood Scans: {len(scans)/len(users):.1f}")
    print(f"   • Watchlist Movies: {sum(len(w['items']) for w in watchlists)/len(users):.1f}")
    
    # Sample user data
    sample_user = users[0]
    sample_ratings = [r for r in ratings if r["userId"] == sample_user["_id"]][:2]
    
    print(f"\n👤 Sample User:")
    print(f"   Name: {sample_user['name']}")
    print(f"   Email: {sample_user['email']}")
    print(f"   Theme: {sample_user['preferences']['theme']}")
    print(f"   Language: {sample_user['preferences']['language']}")
    print(f"   Ratings: {len([r for r in ratings if r['userId'] == sample_user['_id']])}")
    
    if sample_ratings:
        print(f"\n⭐ Sample Ratings:")
        for rating in sample_ratings:
            print(f"   Score: {rating['score']}/5 | Review: {rating['review'][:50]}...")
    
    print("\n✨ Database seeding complete!")
    print("="*70)

if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
    finally:
        client.close()
