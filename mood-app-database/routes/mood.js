const express = require('express');
const router = express.Router();
const { MoodScan, Movie, User } = require('../models');

// POST /api/mood/scan — Record a mood scan result
router.post('/scan', async (req, res) => {
  try {
    const { userId, detectedMood, confidence, predictions, deviceType, lightingScore, faceCount, processingTimeMs } = req.body;

    const scan = await MoodScan.create({
      userId,
      detectedMood,
      confidence,
      predictions: predictions || [],
      deviceType: deviceType || 'web',
      lightingScore,
      faceCount: faceCount || 1,
      processingTimeMs,
      modelVersion: process.env.MODEL_VERSION || 'v1.0.0',
      status: 'completed'
    });

    res.status(201).json({
      success: true,
      scanId: scan._id,
      detectedMood: scan.detectedMood,
      confidence: scan.confidence
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mood/recommendations/:mood — Get movies for a mood
router.get('/recommendations/:mood', async (req, res) => {
  try {
    const { mood } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const validMoods = ['happy', 'sad', 'angry', 'excited', 'romantic', 
                        'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood' });
    }

    const movies = await Movie.find({
      $or: [
        { primaryMood: mood },
        { moodTags: mood }
      ],
      isActive: true
    })
    .sort({ avgRating: -1, moodConfidence: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .select('-embedding -tfidfVector');

    const scoredMovies = movies.map(movie => ({
      ...movie.toObject(),
      moodMatchScore: movie.getMoodMatchScore(mood)
    })).sort((a, b) => b.moodMatchScore - a.moodMatchScore);

    res.json({
      mood,
      count: scoredMovies.length,
      movies: scoredMovies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mood/feedback — User corrects a mood detection
router.post('/feedback', async (req, res) => {
  try {
    const { scanId, wasAccurate, correctedMood } = req.body;

    const scan = await MoodScan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    await scan.provideFeedback(wasAccurate, correctedMood);

    res.json({
      success: true,
      message: 'Feedback recorded. Thank you for helping improve our AI!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mood/history/:userId — User's mood scan history
router.get('/history/:userId', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const history = await MoodScan.getUserMoodHistory(req.params.userId, parseInt(days));

    res.json({
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mood/stats/:userId — User's mood statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await MoodScan.getMoodStats(req.params.userId, parseInt(days));

    res.json({
      period: `${days} days`,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
