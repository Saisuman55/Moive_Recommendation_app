# Complete MongoDB Setup for AI Mood Scanner OTT App

## Overview
This guide sets up MongoDB Atlas (free cloud tier) with Mongoose ODM for your mood scanner app. We'll go step by step — no skipping.

---

## Step 1: Create MongoDB Atlas Account (5 minutes)

### 1.1 Sign Up
1. Go to **https://cloud.mongodb.com**
2. Click **"Try Free"**
3. Sign up with:
   - Google account (fastest), OR
   - Email + password (verify email)
4. Choose **"Build a Database"** when prompted

### 1.2 Create Free Cluster (M0)
1. Select **"Shared"** → **"Create"**
2. Choose cloud provider: **AWS** (recommended for global coverage)
3. Choose region: **closest to your users**
   - US users: `us-east-1` (N. Virginia)
   - Europe: `eu-west-1` (Ireland)
   - Asia: `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore)
4. Cluster Tier: **M0 Sandbox (Shared RAM, 512 MB Storage)** — FREE forever
5. Cluster Name: `mood-app-cluster`
6. Click **"Create Deployment"**

> Wait 1-3 minutes for provisioning. You'll see a green checkmark when ready.

---

## Step 2: Create Database User (2 minutes)

### 2.1 Add Database User
1. In left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `moodapp_user`
5. Password: Click **"Autogenerate Secure Password"** — **COPY AND SAVE THIS**
   - Example: `xK9#mP2$vL5@nQ8`
   - Store in password manager — you cannot see it again
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 2.2 Configure Network Access
1. In left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For **development**: Click **"Allow Access from Anywhere"** → adds `0.0.0.0/0`
   - ⚠️ **For production**: Use specific IP addresses only
4. Click **"Confirm"**

---

## Step 3: Get Connection String (2 minutes)

### 3.1 Copy Connection String
1. Go to **"Database"** → click **"Connect"** on your cluster
2. Choose **"Drivers"**
3. Select **"Node.js"** → Version **5.5 or later**
4. Copy the connection string:
   ```
   mongodb+srv://moodapp_user:<password>@mood-app-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password (URL-encode special chars: `@` → `%40`, `#` → `%23`)

### 3.2 Test Connection with mongosh
```bash
# Install MongoDB Shell (if not installed)
npm install -g mongosh

# Connect (replace with your actual string)
mongosh "mongodb+srv://moodapp_user:YOUR_PASSWORD@mood-app-cluster.xxxxx.mongodb.net/mood_app"

# In mongosh, run:
show dbs
use mood_app
db.createCollection("test")
db.test.insertOne({ message: "Connection successful!" })
db.test.find()
```

---

## Step 4: Project Setup (10 minutes)

### 4.1 Create Project Structure
```bash
mkdir mood-app-backend
cd mood-app-backend
npm init -y
```

### 4.2 Install Dependencies
```bash
npm install mongoose dotenv express cors helmet morgan bcryptjs jsonwebtoken
npm install -D nodemon
```

### 4.3 Create Environment File
```bash
touch .env
```

Add to `.env`:
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://moodapp_user:YOUR_PASSWORD@mood-app-cluster.xxxxx.mongodb.net/mood_app?retryWrites=true&w=majority

# App Config
PORT=5000
NODE_ENV=development

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_super_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# AI Model Config
MODEL_VERSION=v1.0.0
MODEL_PATH=/models/mood-model
```

### 4.4 Add .gitignore
```bash
echo "node_modules/
.env
*.log
.DS_Store
.vscode/
dist/
coverage/" > .gitignore
```

---

## Step 5: Create Database Connection (5 minutes)

### 5.1 Create `config/database.js`
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Step 6: Create Mongoose Models (20 minutes)

### 6.1 Create `models/User.js`
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  oauth: [{
    provider: { type: String, enum: ['google', 'apple', 'github'] },
    id: String,
    data: mongoose.Schema.Types.Mixed
  }],
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: { type: String, default: null },
  roles: {
    type: [String],
    enum: ['user', 'premium', 'admin'],
    default: ['user']
  },
  subscription: {
    tier: { type: String, enum: ['free', 'basic', 'standard', 'premium'], default: 'free' },
    expiresAt: Date,
    stripeCustomerId: String
  },
  privacy: {
    cameraConsent: { type: Boolean, default: false },
    consentDate: Date,
    dataRetentionDays: { type: Number, default: 30, min: 1, max: 365 },
    allowDataTraining: { type: Boolean, default: false },
    allowAnalytics: { type: Boolean, default: true }
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'dark' },
    language: { type: String, default: 'en' },
    contentRatings: {
      type: [String],
      default: ['G', 'PG', 'PG-13', 'R'],
      enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA']
    },
    autoplay: { type: Boolean, default: true },
    subtitles: { type: Boolean, default: false },
    subtitleLanguage: { type: String, default: 'en' },
    likedGenres: [{ type: String }],
    dislikedGenres: [{ type: String }],
    likedActors: [{ type: String }],
    likedDirectors: [{ type: String }],
    emotionBaseline: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  lastLogin: {
    at: Date,
    ip: String,
    device: String
  },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: Date,
  isActive: { type: Boolean, default: true },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } });
userSchema.index({ 'oauth.provider': 1, 'oauth.id': 1 });
userSchema.index({ roles: 1 });
userSchema.index({ 'subscription.tier': 1 });

userSchema.virtual('isPremium').get(function() {
  return this.subscription.tier !== 'free' && 
         (!this.subscription.expiresAt || this.subscription.expiresAt > new Date());
});

userSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash') && this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  if (this.isModified('privacy.cameraConsent') && this.privacy.cameraConsent) {
    this.privacy.consentDate = new Date();
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), deletedAt: { $exists: false } });
};

module.exports = mongoose.model('User', userSchema);
```

### 6.2 Create `models/Movie.js`
```javascript
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  originalTitle: String,
  description: { type: String, maxlength: [2000, 'Description cannot exceed 2000 characters'] },
  tagline: { type: String, maxlength: [300, 'Tagline cannot exceed 300 characters'] },
  contentType: {
    type: String,
    enum: ['movie', 'series', 'documentary', 'short'],
    default: 'movie'
  },
  releaseDate: Date,
  releaseYear: { type: Number, min: 1888, max: 2100 },
  runtime: { type: Number, min: 1, max: 600 },
  language: { type: String, default: 'en' },
  rating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'NR'],
    default: 'NR'
  },
  tmdbId: Number,
  imdbId: String,
  posterUrl: String,
  backdropUrl: String,
  trailerUrl: String,
  videoUrl: String,
  primaryMood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'excited', 'romantic', 
           'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic'],
    index: true
  },
  moodTags: {
    type: [String],
    enum: ['happy', 'sad', 'angry', 'excited', 'romantic', 
           'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic'],
    index: true
  },
  moodConfidence: { type: Number, min: 0, max: 1, default: 0 },
  genres: {
    type: [String],
    enum: ['comedy', 'drama', 'action', 'thriller', 'horror', 'romance', 
           'sci-fi', 'documentary', 'animation', 'adventure', 'crime', 
           'fantasy', 'mystery', 'biography', 'feel-good', 'musical', 
           'war', 'western', 'family', 'noir'],
    index: true
  },
  primaryGenre: {
    type: String,
    enum: ['comedy', 'drama', 'action', 'thriller', 'horror', 'romance', 
           'sci-fi', 'documentary', 'animation', 'adventure', 'crime', 
           'fantasy', 'mystery', 'biography', 'feel-good', 'musical', 
           'war', 'western', 'family', 'noir']
  },
  cast: [{
    name: { type: String, required: true },
    character: String,
    role: { type: String, enum: ['actor', 'director', 'writer', 'producer'], default: 'actor' },
    profileUrl: String,
    order: { type: Number, default: 0 }
  }],
  directors: [{ type: String }],
  writers: [{ type: String }],
  videoQuality: {
    type: [String],
    enum: ['SD', 'HD', 'FHD', '4K', '8K'],
    default: ['HD', '4K']
  },
  audioLanguages: [{ type: String }],
  subtitleLanguages: [{ type: String }],
  avgRating: { type: Number, min: 0, max: 10, default: 0 },
  ratingCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  embedding: {
    type: [Number],
    default: [],
    validate: {
      validator: function(v) {
        return v.length === 0 || v.length === 128 || v.length === 256 || v.length === 512;
      },
      message: 'Embedding must be empty or length 128/256/512'
    }
  },
  tfidfVector: { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true, index: true },
  availableFrom: Date,
  availableUntil: Date,
  regionRestrictions: [{ type: String }],
  tags: [{ type: String }],
  keywords: [{ type: String }],
  syncedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text search index
movieSchema.index({ 
  title: 'text', 
  description: 'text', 
  tagline: 'text',
  'cast.name': 'text',
  directors: 'text'
}, {
  weights: {
    title: 10,
    'cast.name': 5,
    directors: 3,
    tagline: 2,
    description: 1
  },
  name: 'movie_text_search'
});

// Compound indexes for recommendations
movieSchema.index({ primaryMood: 1, isActive: 1, avgRating: -1 });
movieSchema.index({ moodTags: 1, isActive: 1, avgRating: -1 });
movieSchema.index({ genres: 1, isActive: 1, avgRating: -1 });
movieSchema.index({ releaseYear: -1, isActive: 1 });
movieSchema.index({ avgRating: -1, isActive: 1 });

movieSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.releaseDate && !this.releaseYear) {
    this.releaseYear = this.releaseDate.getFullYear();
  }
  next();
});

movieSchema.methods.getMoodMatchScore = function(targetMood) {
  let score = 0;
  if (this.primaryMood === targetMood) score += 1.0;
  if (this.moodTags.includes(targetMood)) score += 0.5;
  score += (this.avgRating / 10) * 0.3;
  return Math.min(score, 1.5);
};

module.exports = mongoose.model('Movie', movieSchema);
```

### 6.3 Create `models/MoodScan.js`
```javascript
const mongoose = require('mongoose');

const moodScanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  detectedMood: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'angry', 'excited', 'romantic', 
           'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic']
  },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  predictions: [{
    mood: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'excited', 'romantic', 
             'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic']
    },
    confidence: Number
  }],
  deviceType: {
    type: String,
    enum: ['web', 'ios', 'android', 'tv', 'unknown'],
    default: 'unknown'
  },
  lightingScore: { type: Number, min: 0, max: 1 },
  faceCount: { type: Number, default: 1, min: 1, max: 10 },
  processingTimeMs: Number,
  modelVersion: { type: String, default: 'v1.0.0' },
  userCorrectedMood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'excited', 'romantic', 
           'stressed', 'relaxed', 'emotional', 'fearful', 'bored', 'energetic']
  },
  wasAccurate: Boolean,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'skipped'],
    default: 'completed'
  },
  errorMessage: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    index: true
  },
  scannedAt: { type: Date, default: Date.now, index: true }
});

// TTL index: auto-delete expired scans
moodScanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
moodScanSchema.index({ userId: 1, scannedAt: -1 });
moodScanSchema.index({ detectedMood: 1, status: 1 });
moodScanSchema.index({ wasAccurate: 1 });

moodScanSchema.methods.provideFeedback = async function(isAccurate, correctedMood) {
  this.wasAccurate = isAccurate;
  if (!isAccurate && correctedMood) {
    this.userCorrectedMood = correctedMood;
  }
  return await this.save();
};

moodScanSchema.statics.getUserMoodHistory = function(userId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    userId,
    scannedAt: { $gte: since },
    status: 'completed'
  }).sort({ scannedAt: -1 }).limit(100);
};

moodScanSchema.statics.getMoodStats = function(userId, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), scannedAt: { $gte: since } } },
    { $group: {
      _id: '$detectedMood',
      count: { $sum: 1 },
      avgConfidence: { $avg: '$confidence' }
    }},
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('MoodScan', moodScanSchema);
```

### 6.4 Create `models/Watchlist.js`
```javascript
const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, default: 'My Watchlist', trim: true, maxlength: 100 },
  isDefault: { type: Boolean, default: false },
  items: [{
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    addedAt: { type: Date, default: Date.now },
    note: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['to_watch', 'watching', 'watched', 'abandoned'],
      default: 'to_watch'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    }
  }],
  isPublic: { type: Boolean, default: false },
  shareLink: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

watchlistSchema.index({ userId: 1, isDefault: 1 });
watchlistSchema.index({ userId: 1, 'items.movieId': 1 });
watchlistSchema.index({ shareLink: 1 }, { sparse: true });

watchlistSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

watchlistSchema.methods.addMovie = function(movieId, note, status = 'to_watch') {
  const exists = this.items.some(item => item.movieId.toString() === movieId.toString());
  if (exists) throw new Error('Movie already in watchlist');
  this.items.push({ movieId, note, status });
  return this.save();
};

watchlistSchema.methods.removeMovie = function(movieId) {
  this.items = this.items.filter(item => item.movieId.toString() !== movieId.toString());
  return this.save();
};

module.exports = mongoose.model('Watchlist', watchlistSchema);
```

### 6.5 Create `models/Rating.js`
```javascript
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0.5,
    max: 10,
    validate: {
      validator: function(v) { return v % 0.5 === 0; },
      message: 'Score must be in 0.5 increments'
    }
  },
  review: { type: String, maxlength: 2000 },
  containsSpoiler: { type: Boolean, default: false },
  liked: { type: Boolean, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
ratingSchema.index({ movieId: 1, score: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });

ratingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update movie avgRating after save
ratingSchema.post('save', async function(doc) {
  const Movie = mongoose.model('Movie');
  const stats = await mongoose.model('Rating').aggregate([
    { $match: { movieId: doc.movieId } },
    { $group: {
      _id: '$movieId',
      avgRating: { $avg: '$score' },
      ratingCount: { $sum: 1 }
    }}
  ]);
  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(doc.movieId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      ratingCount: stats[0].ratingCount
    });
  }
});

module.exports = mongoose.model('Rating', ratingSchema);
```

### 6.6 Create `models/Session.js`
```javascript
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: { type: String, required: true, index: true },
  tokenId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['access', 'refresh'], default: 'access' },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false },
  revokedAt: Date,
  device: {
    type: String,
    enum: ['web', 'ios', 'android', 'tv', 'unknown'],
    default: 'unknown'
  },
  deviceFingerprint: String,
  ipAddress: String,
  userAgent: String,
  lastUsedAt: { type: Date, default: Date.now },
  scansCount: { type: Number, default: 0 }
});

// TTL index: auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, revoked: 1, expiresAt: -1 });
sessionSchema.index({ tokenId: 1 });

sessionSchema.methods.revoke = async function() {
  this.revoked = true;
  this.revokedAt = new Date();
  return await this.save();
};

sessionSchema.statics.findValid = function(tokenId) {
  return this.findOne({
    tokenId,
    revoked: false,
    expiresAt: { $gt: new Date() }
  });
};

module.exports = mongoose.model('Session', sessionSchema);
```

### 6.7 Create `models/ModelMetadata.js`
```javascript
const mongoose = require('mongoose');

const modelMetadataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['mood-classifier', 'face-detector', 'recommendation-engine']
  },
  version: { type: String, required: true },
  path: { type: String, required: true },
  deployedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['deployed', 'testing', 'deprecated', 'rollback'],
    default: 'deployed'
  },
  isActive: { type: Boolean, default: true, index: true },
  metrics: {
    accuracy: Number,
    macroF1: Number,
    top2Accuracy: Number,
    inferenceTimeMs: Number,
    modelSizeMb: Number
  },
  training: {
    datasetSize: Number,
    epochs: Number,
    batchSize: Number,
    learningRate: Number,
    backbone: String,
    inputSize: Number
  },
  releaseNotes: String,
  changelog: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

modelMetadataSchema.index({ name: 1, version: 1 }, { unique: true });
modelMetadataSchema.index({ name: 1, isActive: 1 });

modelMetadataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

modelMetadataSchema.statics.getActiveModel = function(name) {
  return this.findOne({ name, isActive: true, status: 'deployed' })
    .sort({ deployedAt: -1 });
};

module.exports = mongoose.model('ModelMetadata', modelMetadataSchema);
```

### 6.8 Create `models/index.js`
```javascript
const User = require('./User');
const Movie = require('./Movie');
const MoodScan = require('./MoodScan');
const Watchlist = require('./Watchlist');
const Rating = require('./Rating');
const Session = require('./Session');
const ModelMetadata = require('./ModelMetadata');

module.exports = { User, Movie, MoodScan, Watchlist, Rating, Session, ModelMetadata };
```

---

## Step 7: Seed & API (Continue in your project)

See the full guide in the ZIP for complete seed scripts, API routes, and production deployment steps.

---

## Quick Reference

```bash
# Connect to Atlas
mongosh "mongodb+srv://moodapp_user:PASSWORD@cluster0.xxxxx.mongodb.net/mood_app"

# Common queries
show dbs
use mood_app
db.movies.find({ primaryMood: "happy" }).pretty()
db.moodscans.find({ userId: ObjectId("...") }).sort({ scannedAt: -1 })

# Count documents
db.movies.countDocuments()
db.moodscans.countDocuments()

# Delete old scans manually
db.moodscans.deleteMany({ expiresAt: { $lt: new Date() } })
```
