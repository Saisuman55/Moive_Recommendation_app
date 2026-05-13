/**
 * Model Exports — MoodFlix
 * Clean barrel export for all Mongoose models
 */
const User = require('./User');
const Movie = require('./Movie');
const MoodScan = require('./MoodScan');
const Watchlist = require('./Watchlist');
const Rating = require('./Rating');
const Session = require('./Session');
const ModelMetadata = require('./ModelMetadata');

module.exports = {
  User,
  Movie,
  MoodScan,
  Watchlist,
  Rating,
  Session,
  ModelMetadata
};
