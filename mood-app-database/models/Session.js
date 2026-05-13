/**
 * Session Model — MoodFlix
 * JWT sessions with device fingerprinting
 */
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, index: true },
  deviceFingerprint: { type: String },
  deviceType: { type: String, enum: ['web','ios','android','tv','unknown'], default: 'web' },
  ipAddress: { type: String },
  userAgent: { type: String },
  isActive: { type: Boolean, default: true },
  scansCount: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

sessionSchema.index({ userId: 1, isActive: 1 });

sessionSchema.methods.end = function() {
  this.isActive = false;
  this.endedAt = new Date();
  return this.save();
};

sessionSchema.methods.incrementScans = function() {
  this.scansCount += 1;
  return this.save();
};

sessionSchema.statics.endAllForUser = function(userId) {
  return this.updateMany({ userId, isActive: true }, { isActive: false, endedAt: new Date() });
};

module.exports = mongoose.model('Session', sessionSchema);
