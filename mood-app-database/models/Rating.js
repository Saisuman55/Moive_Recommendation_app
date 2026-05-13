/**
 * Rating Model — MoodFlix
 * User reviews with auto-updating movie averages
 */
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  score: { type: Number, required: true, min: 0.5, max: 10 },
  reviewText: { type: String, maxlength: 2000 },
  containsSpoiler: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
  ratedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
ratingSchema.index({ movieId: 1, ratedAt: -1 });

// Auto-update movie's average rating after save
ratingSchema.post('save', async function() {
  const Movie = mongoose.model('Movie');
  const stats = await mongoose.model('Rating').aggregate([
    { $match: { movieId: this.movieId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(this.movieId, {
      avgRating: Math.round(stats[0].avg * 10) / 10,
      ratingCount: stats[0].count
    });
  }
});

// Also update on delete
ratingSchema.post('deleteOne', { document: true }, async function() {
  const Movie = mongoose.model('Movie');
  const stats = await mongoose.model('Rating').aggregate([
    { $match: { movieId: this.movieId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
  ]);
  const update = stats.length > 0
    ? { avgRating: Math.round(stats[0].avg * 10) / 10, ratingCount: stats[0].count }
    : { avgRating: 0, ratingCount: 0 };
  await Movie.findByIdAndUpdate(this.movieId, update);
});

module.exports = mongoose.model('Rating', ratingSchema);
