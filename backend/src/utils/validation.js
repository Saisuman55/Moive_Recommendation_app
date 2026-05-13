import { body, param, query } from "express-validator";

export const validateMovieSearch = [
  query("query")
    .optional()
    .isString()
    .withMessage("Search query must be a string"),
  query("genre")
    .optional()
    .isString()
    .withMessage("Genre must be a string"),
  query("year")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage("Year must be a valid year"),
  query("rating")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Rating must be between 0 and 10"),
  query("language")
    .optional()
    .isString()
    .withMessage("Language must be a string"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

export const validateMovieId = [
  param("id")
    .notEmpty()
    .withMessage("Movie ID is required")
    .isString()
    .withMessage("Movie ID must be a string"),
];

export const validateCreateMovie = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),
  body("overview")
    .optional()
    .isString()
    .withMessage("Overview must be a string"),
  body("genres")
    .optional()
    .isArray()
    .withMessage("Genres must be an array"),
  body("releaseDate")
    .optional()
    .isISO8601()
    .withMessage("Release date must be a valid date"),
  body("runtime")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Runtime must be a positive integer"),
  body("rating")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Rating must be between 0 and 10"),
  body("language")
    .optional()
    .isString()
    .withMessage("Language must be a string"),
  body("posterUrl")
    .optional()
    .isURL()
    .withMessage("Poster URL must be a valid URL"),
  body("backdropUrl")
    .optional()
    .isURL()
    .withMessage("Backdrop URL must be a valid URL"),
  body("trailerUrl")
    .optional()
    .isURL()
    .withMessage("Trailer URL must be a valid URL"),
  body("director")
    .optional()
    .isString()
    .withMessage("Director must be a string"),
  body("cast")
    .optional()
    .isArray()
    .withMessage("Cast must be an array"),
  body("productionCompany")
    .optional()
    .isString()
    .withMessage("Production company must be a string"),
  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget must be a non-negative number"),
  body("revenue")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Revenue must be a non-negative number"),
  body("streamingPlatforms")
    .optional()
    .isArray()
    .withMessage("Streaming platforms must be an array"),
];

export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

export default {
  validateMovieSearch,
  validateMovieId,
  validateCreateMovie,
  validatePagination,
};