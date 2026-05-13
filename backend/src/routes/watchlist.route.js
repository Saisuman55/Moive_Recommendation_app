import { Router } from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  markAsWatched,
} from "../controllers/watchlist.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all watchlist routes
router.use(protect);

// GET /api/watchlist - Get user's watchlist
router.get("/", getWatchlist);

// POST /api/watchlist/:movieId - Add movie to watchlist
router.post("/:movieId", addToWatchlist);

// DELETE /api/watchlist/:movieId - Remove movie from watchlist
router.delete("/:movieId", removeFromWatchlist);

// PUT /api/watchlist/:movieId/watched - Mark movie as watched
router.put("/:movieId/watched", markAsWatched);

export default router;