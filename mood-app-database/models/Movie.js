/**
 * Movie Model — MoodFlix
 * Content with mood tags, AI embeddings, and text search
 */
const mongoose = require('mongoose');

const castMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  character: { type: String, default: '' },
  role: { type: String, enum: ['actor', 'director', 'producer', 'writer'], default: 'actor' },
  order: { type: Number, default: 0 },
  image: { type: String }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  overview: { type: String, default: '' },  // Alias for backward compat with Flask
  tagline: { type: String },

  contentType: {
    type: String,
    enum: ['movie', 'series', 'documentary', 'short'],
    default: 'movie'
  },
  releaseYear: { type: Number, min: 1888, max: 2100 },
  runtime: { type: Number, min: 1 },
  rating: { type: String },  // MPAA rating (G, PG, PG-13, R, etc.)

  // Mood tagging — core of recommendation engine
  primaryMood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'excited', 'romantic', 'stressed',
           'relaxed', 'emotional', 'fearful', 'bored', 'energetic',
           'chill', 'scared', 'nostalgic'],  // includes legacy moods
    index: true
  },
  moodTags: {
    type: [String],
    index: true,
    validate: {
      validator: (tags) => tags.every(t =>
        ['happy', 'sad', 'angry', 'excited', 'romantic', 'stressed',
         'relaxed', 'emotional', 'fearful', 'bored', 'energetic',
         'chill', 'scared', 'nostalgic'].includes(t)
      ),
      message: 'Invalid mood tag'
    }
  },
  moodConfidence: { type: Number, min: 0, max: 1, default: 0 },

  // Genres
  genres: { type: [String], default: [] },
  primaryGenre: { type: String },

  // Cast & Crew
  cast: { type: [castMemberSchema], default: [] },
  directors: { type: [String], default: [] },

  // Media URLs
  posterUrl: { type: String },
  backdropUrl: { type: String },
  trailerUrl: { type: String },
  videoUrl: { type: String },

  // Engagement metrics
  avgRating: { type: Number, default: 0, min: 0, max: 10 },
  ratingCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },

  // AI vectors (for future similarity search)
  embedding: { type: [Number], select: false },    // 128/256/512 dim vector
  tfidfVector: { type: [Number], select: false },   // TF-IDF sparse vector

  // Language & region
  language: { type: String, default: 'en' },
  audioLanguages: { type: [String], default: ['en'] },
  subtitleLanguages: { type: [String], default: ['en'] },

  // Availability
  isActive: { type: Boolean, default: true, index: true },
  availableFrom: { type: Date },
  availableUntil: { type: Date },
  regionRestrictions: { type: [String], default: [] }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text search index
movieSchema.index(
  { title: 'text', description: 'text', overview: 'text', 'cast.name': 'text' },
  { weights: { title: 10, 'cast.name': 5, description: 2, overview: 2 } }
);

// Compound indexes for fast recommendation queries
movieSchema.index({ primaryMood: 1, isActive: 1, avgRating: -1 });
movieSchema.index({ moodTags: 1, isActive: 1 });
movieSchema.index({ genres: 1, isActive: 1, avgRating: -1 });
movieSchema.index({ releaseYear: -1, isActive: 1 });
movieSchema.index({ avgRating: -1, isActive: 1 });

// Virtual: genre text (comma-separated)
movieSchema.virtual('genreText').get(function () {
  return (this.genres || []).slice(0, 3).join(', ');
});

// Virtual: match score (for backward compat)
movieSchema.virtual('matchScore').get(function () {
  return Math.round((this.avgRating || 0) * 10);
});

/**
 * Calculate mood match score for a given mood
 * @param {string} mood - Target mood category
 * @returns {number} 0-100 score
 */
movieSchema.methods.getMoodMatchScore = function (mood) {
  if (this.primaryMood === mood) {
    return Math.round(this.moodConfidence * 100);
  }
  if (this.moodTags && this.moodTags.includes(mood)) {
    return Math.round(this.moodConfidence * 70);
  }
  return 0;
};

/**
 * Find movies by mood with scoring
 * @param {string} mood - Mood category
 * @param {number} limit - Max results
 * @returns {Promise<Array>}
 */
movieSchema.statics.findByMood = async function (mood, limit = 20) {
  const movies = await this.find({
    $or: [{ primaryMood: mood }, { moodTags: mood }],
    isActive: true
  })
    .sort({ avgRating: -1, moodConfidence: -1 })
    .limit(limit)
    .select('-embedding -tfidfVector');

  return movies.map(movie => ({
    ...movie.toObject(),
    moodMatchScore: movie.getMoodMatchScore(mood)
  })).sort((a, b) => b.moodMatchScore - a.moodMatchScore);
};

/**
 * Search movies with filters
 */
movieSchema.statics.searchMovies = async function (filters = {}) {
  const { q, genre, mood, year, rating, language, page = 1, limit = 20 } = filters;
  const query = { isActive: true };

  if (q) query.$text = { $search: q };
  if (genre) query.genres = { $regex: new RegExp(`^${genre}$`, 'i') };
  if (mood) query.$or = [{ primaryMood: mood }, { moodTags: mood }];
  if (year) query.releaseYear = parseInt(year);
  if (rating) query.avgRating = { $gte: parseFloat(rating) };
  if (language) query.language = { $regex: new RegExp(language, 'i') };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [movies, total] = await Promise.all([
    this.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { avgRating: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-embedding -tfidfVector'),
    this.countDocuments(query)
  ]);

  return {
    movies,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

module.exports = mongoose.model('Movie', movieSchema);
