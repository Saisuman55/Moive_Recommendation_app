/**
 * MoodScan Model — MoodFlix
 * Privacy-first: no face images stored, TTL auto-delete after 30 days
 */
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  mood: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

const moodScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  detectedMood: {
    type: String, required: true,
    enum: ['happy','sad','angry','excited','romantic','stressed','relaxed','emotional','fearful','bored','energetic','chill','scared','nostalgic']
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  predictions: { type: [predictionSchema], default: [] },
  deviceType: { type: String, enum: ['web','ios','android','tv','unknown'], default: 'web' },
  lightingScore: { type: Number, min: 0, max: 1 },
  faceCount: { type: Number, default: 1 },
  processingTimeMs: { type: Number },
  modelVersion: { type: String, default: 'v1.0.0' },
  inputType: { type: String, enum: ['camera','text','button','api'], default: 'camera' },
  inputText: { type: String },
  userCorrectedMood: { type: String },
  wasAccurate: { type: Boolean, default: null },
  feedbackAt: { type: Date },
  status: { type: String, enum: ['pending','completed','failed','skipped'], default: 'completed' },
  errorMessage: { type: String },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000), index: { expires: 0 } }
}, { timestamps: { createdAt: 'scannedAt', updatedAt: 'updatedAt' } });

moodScanSchema.index({ userId: 1, scannedAt: -1 });
moodScanSchema.index({ detectedMood: 1, status: 1 });

moodScanSchema.methods.provideFeedback = function(wasAccurate, correctedMood) {
  this.wasAccurate = wasAccurate;
  if (!wasAccurate && correctedMood) this.userCorrectedMood = correctedMood;
  this.feedbackAt = new Date();
  return this.save();
};

moodScanSchema.statics.getUserMoodHistory = function(userId, days = 30) {
  const since = new Date(Date.now() - days*24*60*60*1000);
  return this.find({ userId, status: 'completed', scannedAt: { $gte: since } })
    .sort({ scannedAt: -1 }).select('detectedMood confidence predictions deviceType scannedAt wasAccurate').lean();
};

moodScanSchema.statics.getMoodStats = async function(userId, days = 7) {
  const since = new Date(Date.now() - days*24*60*60*1000);
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed', scannedAt: { $gte: since } } },
    { $group: { _id: '$detectedMood', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
    { $sort: { count: -1 } }
  ]);
  const total = stats.reduce((s, x) => s + x.count, 0);
  return { totalScans: total, dominantMood: stats[0]?._id || null,
    moodDistribution: stats.map(s => ({ mood: s._id, count: s.count, pct: Math.round(s.count/total*100), avgConf: Math.round(s.avgConfidence*100)/100 }))
  };
};

module.exports = mongoose.model('MoodScan', moodScanSchema);
