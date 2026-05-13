/**
 * Watchlist Model — MoodFlix
 * Per-user watchlists with status tracking
 */
const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  status: { type: String, enum: ['want_to_watch', 'watching', 'completed', 'dropped'], default: 'want_to_watch' },
  priority: { type: Number, default: 0, min: 0, max: 10 },
  notes: { type: String, maxlength: 500 },
  addedFrom: { type: String, enum: ['manual', 'recommendation', 'mood_scan', 'trending'], default: 'manual' },
  associatedMood: { type: String },
  progressSeconds: { type: Number, default: 0 },
  totalSeconds: { type: Number },
  completedAt: { type: Date },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });

watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });
watchlistSchema.index({ userId: 1, status: 1, addedAt: -1 });

watchlistSchema.virtual('completionPct').get(function() {
  if (!this.totalSeconds || this.totalSeconds === 0) return 0;
  return Math.round((this.progressSeconds / this.totalSeconds) * 100);
});

watchlistSchema.statics.getUserWatchlist = function(userId, status, page = 1, limit = 20) {
  const query = { userId };
  if (status) query.status = status;
  return this.find(query).sort({ addedAt: -1 }).skip((page-1)*limit).limit(limit).populate('movieId', 'title slug posterUrl genres avgRating primaryMood');
};

watchlistSchema.statics.toggleMovie = async function(userId, movieId, addedFrom = 'manual') {
  const existing = await this.findOne({ userId, movieId });
  if (existing) { await existing.deleteOne(); return { action: 'removed' }; }
  const entry = await this.create({ userId, movieId, addedFrom });
  return { action: 'added', entry };
};

module.exports = mongoose.model('Watchlist', watchlistSchema);
