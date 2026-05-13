import { Router } from "express";
import {
  getAllMovies,
  getMovieById,
  getMovieTrailer,
  getRecommendations,
  getTrendingMovies,
  getMoodRecommendations,
} from "../controllers/movie.controller.js";
import { validateMovieSearch, validateMovieId, validatePagination } from "../utils/validation.js";

const router = Router();

// GET /api/movies - Get all movies with pagination, search, and filters
router.get("/", validateMovieSearch, getAllMovies);

// GET /api/movies/trending - Get trending movies
router.get("/trending", getTrendingMovies);

// GET /api/movies/mood/:mood - Get movies by mood
router.get("/mood/:mood", getMoodRecommendations);

// GET /api/movies/:id - Get a single movie by slug or ID
router.get("/:id", validateMovieId, getMovieById);

// GET /api/movies/:id/trailer - Get movie trailer
router.get("/:id/trailer", validateMovieId, getMovieTrailer);

// GET /api/movies/:id/recommendations - Get recommendations for a movie
router.get("/:id/recommendations", validateMovieId, getRecommendations);

export default router;