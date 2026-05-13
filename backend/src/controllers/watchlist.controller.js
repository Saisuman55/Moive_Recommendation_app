import { Watchlist } from "../models/Watchlist.js";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = asyncHandler(async (req, res, next) => {
  const watchlist = await Watchlist.find({ user: req.user.userId });

  return sendSuccess(res, 200, watchlist);
});

// @desc    Add movie to watchlist
// @route   POST /api/watchlist/:movieId
// @access  Private
export const addToWatchlist = asyncHandler(async (req, res, next) => {
  const { movieId } = req.params;

  const exists = await Watchlist.findOne({
    user: req.user.userId,
    movie: movieId,
  });

  if (exists) {
    throw new ApiError(400, "Movie already in watchlist");
  }

  const watchlistItem = await Watchlist.create({
    user: req.user.userId,
    movie: movieId,
  });

  // Also update user document
  await User.findByIdAndUpdate(req.user.userId, {
    $addToSet: { watchlist: movieId },
  });

  return sendSuccess(res, 201, watchlistItem);
});

// @desc    Remove movie from watchlist
// @route   DELETE /api/watchlist/:movieId
// @access  Private
export const removeFromWatchlist = asyncHandler(async (req, res, next) => {
  const { movieId } = req.params;

  const watchlistItem = await Watchlist.findOneAndDelete({
    user: req.user.userId,
    movie: movieId,
  });

  if (!watchlistItem) {
    throw new ApiError(404, "Movie not found in watchlist");
  }

  // Also update user document
  await User.findByIdAndUpdate(req.user.userId, {
    $pull: { watchlist: movieId },
  });

  return sendSuccess(res, 200, { message: "Movie removed from watchlist" });
});

// @desc    Mark movie as watched
// @route   PUT /api/watchlist/:movieId/watched
// @access  Private
export const markAsWatched = asyncHandler(async (req, res, next) => {
  const { movieId } = req.params;

  const watchlistItem = await Watchlist.findOneAndUpdate(
    { user: req.user.userId, movie: movieId },
    { watched: true, watchedAt: new Date() },
    { new: true }
  );

  if (!watchlistItem) {
    throw new ApiError(404, "Movie not found in watchlist");
  }

  return sendSuccess(res, 200, watchlistItem);
});

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  markAsWatched,
};