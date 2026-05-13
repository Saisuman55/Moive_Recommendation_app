const express = require('express');
const router = express.Router();
const { Movie, Rating } = require('../models');

// GET /api/movies/search?q=query
router.get('/search', async (req, res) => {
  try {
    const { q, genre, mood, year, rating, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (q) {
      query.$text = { $search: q };
    }
    if (genre) {
      query.genres = genre;
    }
    if (mood) {
      query.$or = [
        { primaryMood: mood },
        { moodTags: mood }
      ];
    }
    if (year) {
      query.releaseYear = parseInt(year);
    }
    if (rating) {
      query.rating = rating;
    }

    const movies = await Movie.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { avgRating: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-embedding -tfidfVector');

    const total = await Movie.countDocuments(query);

    res.json({
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/:slug
router.get('/:slug', async (req, res) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug, isActive: true })
      .select('-embedding -tfidfVector');

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
