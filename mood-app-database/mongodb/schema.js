// ═══════════════════════════════════════════════════════════════
// AI Mood Scanner OTT Platform — MongoDB Schema Design
// ═══════════════════════════════════════════════════════════════
// Flexible document structure for rapid iteration and horizontal scaling

// ─── MOODS COLLECTION ───
db.createCollection("moods", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["mood_name", "emoji"],
      properties: {
        mood_name: { bsonType: "string", enum: [
          "happy","sad","angry","excited","romantic",
          "stressed","relaxed","emotional","fearful","bored","energetic"
        ]},
        emoji: { bsonType: "string" },
        description: { bsonType: "string" },
        color_hex: { bsonType: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        genre_weights: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              genre_slug: { bsonType: "string" },
              weight: { bsonType: "double", minimum: 0, maximum: 1 },
              is_primary: { bsonType: "bool" }
            }
          }
        },
        is_active: { bsonType: "bool" },
        created_at: { bsonType: "date" }
      }
    }
  }
});

// Seed moods
db.moods.insertMany([
  { mood_name: "happy", emoji: "😊", color_hex: "#ffd700", description: "Joyful, upbeat, positive energy",
    genre_weights: [
      { genre_slug: "comedy", weight: 0.95, is_primary: true },
      { genre_slug: "feel-good", weight: 0.90, is_primary: true },
      { genre_slug: "adventure", weight: 0.75, is_primary: false },
      { genre_slug: "animation", weight: 0.70, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "sad", emoji: "😢", color_hex: "#4a90d9", description: "Melancholic, reflective, low energy",
    genre_weights: [
      { genre_slug: "drama", weight: 0.90, is_primary: true },
      { genre_slug: "biography", weight: 0.85, is_primary: true },
      { genre_slug: "feel-good", weight: 0.80, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "angry", emoji: "😠", color_hex: "#ff2a2a", description: "Frustrated, tense, high intensity",
    genre_weights: [
      { genre_slug: "action", weight: 0.95, is_primary: true },
      { genre_slug: "thriller", weight: 0.85, is_primary: true },
      { genre_slug: "crime", weight: 0.75, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "excited", emoji: "🤩", color_hex: "#ff9500", description: "Eager, enthusiastic, high arousal",
    genre_weights: [
      { genre_slug: "action", weight: 0.90, is_primary: true },
      { genre_slug: "adventure", weight: 0.85, is_primary: true },
      { genre_slug: "sci-fi", weight: 0.80, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "romantic", emoji: "🥰", color_hex: "#ff006e", description: "Affectionate, dreamy, intimate",
    genre_weights: [
      { genre_slug: "romance", weight: 0.95, is_primary: true },
      { genre_slug: "drama", weight: 0.70, is_primary: false },
      { genre_slug: "musical", weight: 0.65, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "stressed", emoji: "😰", color_hex: "#9b59b6", description: "Anxious, overwhelmed, tense",
    genre_weights: [
      { genre_slug: "feel-good", weight: 0.95, is_primary: true },
      { genre_slug: "comedy", weight: 0.85, is_primary: true },
      { genre_slug: "family", weight: 0.75, is_primary: false },
      { genre_slug: "animation", weight: 0.70, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "relaxed", emoji: "😌", color_hex: "#2ecc71", description: "Calm, peaceful, low arousal",
    genre_weights: [
      { genre_slug: "documentary", weight: 0.85, is_primary: true },
      { genre_slug: "drama", weight: 0.80, is_primary: true },
      { genre_slug: "fantasy", weight: 0.75, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "emotional", emoji: "🥺", color_hex: "#3498db", description: "Vulnerable, moved, deeply feeling",
    genre_weights: [
      { genre_slug: "drama", weight: 0.95, is_primary: true },
      { genre_slug: "biography", weight: 0.85, is_primary: true },
      { genre_slug: "romance", weight: 0.75, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "fearful", emoji: "😨", color_hex: "#5d6d7e", description: "Apprehensive, cautious, suspense-seeking",
    genre_weights: [
      { genre_slug: "horror", weight: 0.95, is_primary: true },
      { genre_slug: "thriller", weight: 0.85, is_primary: true },
      { genre_slug: "mystery", weight: 0.75, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "bored", emoji: "😴", color_hex: "#95a5a6", description: "Disengaged, restless, seeking stimulation",
    genre_weights: [
      { genre_slug: "mystery", weight: 0.85, is_primary: true },
      { genre_slug: "sci-fi", weight: 0.80, is_primary: true },
      { genre_slug: "adventure", weight: 0.75, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  },
  { mood_name: "energetic", emoji: "⚡", color_hex: "#e74c3c", description: "Vigorous, dynamic, action-oriented",
    genre_weights: [
      { genre_slug: "action", weight: 0.95, is_primary: true },
      { genre_slug: "adventure", weight: 0.90, is_primary: true },
      { genre_slug: "musical", weight: 0.75, is_primary: false }
    ],
    is_active: true, created_at: new Date()
  }
]);

// ─── GENRES COLLECTION ───
db.createCollection("genres");
db.genres.insertMany([
  { genre_slug: "comedy", genre_name: "Comedy", description: "Humorous and entertaining", is_active: true },
  { genre_slug: "drama", genre_name: "Drama", description: "Emotionally resonant storytelling", is_active: true },
  { genre_slug: "action", genre_name: "Action", description: "High-energy physical sequences", is_active: true },
  { genre_slug: "thriller", genre_name: "Thriller", description: "Suspenseful and tense narratives", is_active: true },
  { genre_slug: "horror", genre_name: "Horror", description: "Fear-inducing content", is_active: true },
  { genre_slug: "romance", genre_name: "Romance", description: "Love-centered narratives", is_active: true },
  { genre_slug: "sci-fi", genre_name: "Sci-Fi", description: "Futuristic and speculative", is_active: true },
  { genre_slug: "documentary", genre_name: "Documentary", description: "Non-fiction educational", is_active: true },
  { genre_slug: "animation", genre_name: "Animation", description: "Animated features", is_active: true },
  { genre_slug: "adventure", genre_name: "Adventure", description: "Journey and exploration", is_active: true },
  { genre_slug: "crime", genre_name: "Crime", description: "Criminal underworld", is_active: true },
  { genre_slug: "fantasy", genre_name: "Fantasy", description: "Magical and mythical", is_active: true },
  { genre_slug: "mystery", genre_name: "Mystery", description: "Puzzle-solving plots", is_active: true },
  { genre_slug: "biography", genre_name: "Biography", description: "Real-life stories", is_active: true },
  { genre_slug: "feel-good", genre_name: "Feel-Good", description: "Uplifting and heartwarming", is_active: true },
  { genre_slug: "musical", genre_name: "Musical", description: "Music-driven narratives", is_active: true }
]);

// ─── USERS COLLECTION ───
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "created_at"],
      properties: {
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" },
        email_hash: { bsonType: "string" },  // SHA-256 for privacy
        display_name: { bsonType: "string" },
        avatar_url: { bsonType: "string" },
        role: { enum: ["free", "premium", "admin"] },
        subscription: { enum: ["none", "basic", "standard", "premium"] },

        // Privacy & Consent
        camera_consent: { bsonType: "bool" },
        consent_date: { bsonType: "date" },
        data_retention_days: { bsonType: "int", minimum: 1, maximum: 365 },
        allow_data_training: { bsonType: "bool" },

        // Preferences
        preferences: {
          bsonType: "object",
          properties: {
            preferred_languages: { bsonType: "array", items: { bsonType: "string" } },
            content_ratings: { bsonType: "array", items: { bsonType: "string" } },
            liked_genres: { bsonType: "array", items: { bsonType: "string" } },
            disliked_genres: { bsonType: "array", items: { bsonType: "string" } },
            liked_actors: { bsonType: "array", items: { bsonType: "string" } },
            liked_directors: { bsonType: "array", items: { bsonType: "string" } },
            emotion_baseline: { bsonType: "object" }  // User's neutral face metrics
          }
        },

        // Security
        last_login_at: { bsonType: "date" },
        failed_logins: { bsonType: "int" },
        locked_until: { bsonType: "date" },

        // Timestamps
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        deleted_at: { bsonType: "date" }  // Soft delete
      }
    }
  }
});

// Indexes
db.users.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { deleted_at: { $exists: false } } });
db.users.createIndex({ "preferences.liked_genres": 1 });
db.users.createIndex({ subscription: 1 });

// ─── CONTENT COLLECTION (Movies & Series) ───
db.createCollection("content", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "slug", "content_type"],
      properties: {
        title: { bsonType: "string" },
        slug: { bsonType: "string" },
        original_title: { bsonType: "string" },
        synopsis: { bsonType: "string" },
        tagline: { bsonType: "string" },

        content_type: { enum: ["movie", "series", "documentary", "short"] },
        release_year: { bsonType: "int", minimum: 1888, maximum: 2100 },
        runtime_minutes: { bsonType: "int", minimum: 1 },
        rating: { enum: ["G","PG","PG-13","R","NC-17","TV-Y","TV-G","TV-PG","TV-14","TV-MA","NR"] },

        // Mood tagging
        primary_mood: { bsonType: "string" },
        mood_tags: { bsonType: "array", items: { bsonType: "string" } },
        mood_confidence: { bsonType: "double", minimum: 0, maximum: 1 },

        // Media
        poster_url: { bsonType: "string" },
        backdrop_url: { bsonType: "string" },
        trailer_url: { bsonType: "string" },
        video_url: { bsonType: "string" },

        // Cast & Crew
        cast: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              name: { bsonType: "string" },
              role: { bsonType: "string" },
              character: { bsonType: "string" }
            }
          }
        },
        directors: { bsonType: "array", items: { bsonType: "string" } },

        // Genres
        genres: { bsonType: "array", items: { bsonType: "string" } },
        primary_genre: { bsonType: "string" },

        // Engagement
        avg_rating: { bsonType: "double", minimum: 0, maximum: 10 },
        rating_count: { bsonType: "int" },
        view_count: { bsonType: "int" },

        // Availability
        is_active: { bsonType: "bool" },
        available_from: { bsonType: "date" },
        available_until: { bsonType: "date" },
        region_restrictions: { bsonType: "array", items: { bsonType: "string" } },

        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// Indexes for fast recommendation queries
db.content.createIndex({ slug: 1 }, { unique: true });
db.content.createIndex({ primary_mood: 1, is_active: 1, avg_rating: -1 });
db.content.createIndex({ mood_tags: 1, is_active: 1 });
db.content.createIndex({ genres: 1, is_active: 1, avg_rating: -1 });
db.content.createIndex({ release_year: -1, is_active: 1 });
db.content.createIndex({ avg_rating: -1, is_active: 1 });
db.content.createIndex({ is_active: 1, available_from: 1, available_until: 1 });

// ─── MOOD SCANS COLLECTION (Privacy-Critical) ───
db.createCollection("mood_scans", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "detected_mood", "confidence", "scanned_at"],
      properties: {
        user_id: { bsonType: "objectId" },
        detected_mood: { bsonType: "string" },
        confidence: { bsonType: "double", minimum: 0, maximum: 100 },

        // Secondary predictions
        secondary_moods: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              mood: { bsonType: "string" },
              confidence: { bsonType: "double" }
            }
          }
        },

        // Technical metadata (NO face images stored!)
        device_type: { enum: ["web", "ios", "android", "tv", "unknown"] },
        lighting_score: { bsonType: "double", minimum: 0, maximum: 1 },
        face_count: { bsonType: "int" },
        processing_time_ms: { bsonType: "int" },
        model_version: { bsonType: "string" },

        // User feedback
        user_corrected_mood: { bsonType: "string" },
        was_accurate: { bsonType: "bool" },

        // Status
        status: { enum: ["pending", "completed", "failed", "skipped"] },
        error_message: { bsonType: "string" },

        // TTL
        scanned_at: { bsonType: "date" },
        expires_at: { bsonType: "date" }  // MongoDB TTL index will auto-delete
      }
    }
  }
});

// TTL index: auto-delete mood scans after 30 days
db.mood_scans.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
db.mood_scans.createIndex({ user_id: 1, scanned_at: -1 });
db.mood_scans.createIndex({ detected_mood: 1, status: 1 });
db.mood_scans.createIndex({ was_accurate: 1 });

// ─── WATCH HISTORY ───
db.createCollection("watch_history");
db.watch_history.createIndex({ user_id: 1, watched_at: -1 });
db.watch_history.createIndex({ content_id: 1 });
db.watch_history.createIndex({ user_id: 1, content_id: 1 }, { unique: true });

// ─── RECOMMENDATIONS ───
db.createCollection("recommendations");
db.recommendations.createIndex({ user_id: 1, created_at: -1 });
db.recommendations.createIndex({ user_id: 1, was_shown: 1, expires_at: 1 });
db.recommendations.createIndex({ expires_at: 1 }, { expireAfterSeconds: 604800 }); // 7 days

// ─── MOOD TIMELINE ───
db.createCollection("mood_timeline");
db.mood_timeline.createIndex({ user_id: 1, date: -1 });
db.mood_timeline.createIndex({ user_id: 1, date: 1 }, { unique: true });
