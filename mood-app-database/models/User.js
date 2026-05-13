/**
 * User Model — MoodFlix
 * Privacy-first: camera consent, data retention TTL, soft delete
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email']
  },
  emailHash: { type: String },
  passwordHash: { type: String },
  displayName: { type: String, maxlength: 50, trim: true },
  avatarUrl: { type: String },
  role: { type: String, enum: ['free', 'premium', 'admin'], default: 'free' },
  subscription: { type: String, enum: ['none', 'basic', 'standard', 'premium'], default: 'none' },

  // Privacy & Consent
  privacy: {
    cameraConsent: { type: Boolean, default: false },
    consentDate: { type: Date },
    dataRetentionDays: { type: Number, default: 30, min: 1, max: 365 },
    allowDataTraining: { type: Boolean, default: false }
  },

  // Preferences
  preferences: {
    preferredLanguages: { type: [String], default: ['en'] },
    contentRatings: { type: [String], default: ['G', 'PG', 'PG-13', 'R'] },
    likedGenres: { type: [String], default: [] },
    dislikedGenres: { type: [String], default: [] },
    likedActors: { type: [String], default: [] },
    likedDirectors: { type: [String], default: [] },
    autoplayEnabled: { type: Boolean, default: true },
    subtitlesDefault: { type: Boolean, default: false },
    emotionBaseline: { type: mongoose.Schema.Types.Mixed, default: {} }
  },

  // Security
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date },

  // Soft delete
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
userSchema.index({ subscription: 1 });
userSchema.index({ 'preferences.likedGenres': 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && this.passwordHash && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  // Generate email hash for privacy
  if (this.isModified('email')) {
    const crypto = require('crypto');
    this.emailHash = crypto.createHash('sha256').update(this.email).digest('hex');
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Grant camera consent
userSchema.methods.grantCameraConsent = function () {
  this.privacy.cameraConsent = true;
  this.privacy.consentDate = new Date();
  return this.save();
};

// Revoke camera consent
userSchema.methods.revokeCameraConsent = function () {
  this.privacy.cameraConsent = false;
  return this.save();
};

// Soft delete
userSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// Exclude soft-deleted users by default
userSchema.pre(/^find/, function () {
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('User', userSchema);
