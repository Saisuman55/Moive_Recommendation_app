import { Movie } from "../models/Movie.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// @desc    Get all movies with pagination, search, and filters
// @route   GET /api/movies
// @access  Public
export const getAllMovies = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    genre,
    year,
    rating,
    language,
    mood,
    sortBy = "rating",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { overview: { $regex: search, $options: "i" } },
      { director: { $regex: search, $options: "i" } },
      { "cast.actorName": { $regex: search, $options: "i" } },
    ];
  }

  // Genre filter
  if (genre) {
    const genresArray = genre.split(",").map((g) => g.trim());
    query.genres = { $in: genresArray };
  }

  // Year filter
  if (year) {
    const years = year.split(",").map((y) => parseInt(y.trim()));
    if (years.length === 1) {
      const start = new Date(years[0], 0, 1);
      const end = new Date(years[0], 11, 31);
      query.releaseDate = { $gte: start, $lte: end };
    } else if (years.length === 2) {
      const start = new Date(Math.min(...years), 0, 1);
      const end = new Date(Math.max(...years), 11, 31);
      query.releaseDate = { $gte: start, $lte: end };
    }
  }

  // Rating filter
  if (rating) {
    const [minRating, maxRating] = rating
      .split("-")
      .map((r) => parseFloat(r.trim()));
    query.rating = { $gte: minRating, $lte: maxRating };
  }

  // Language filter
  if (language) {
    query.language = { $regex: new RegExp(language, "i") };
  }

  // Mood filter
  if (mood) {
    const moods = mood.split(",").map((m) => m.trim().toLowerCase());
    query.mood = { $in: moods };
  }

  // Sorting
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const [movies, totalMovies] = await Promise.all([
    Movie.find(query)
      .sort(sortOptions)
      .select(
        "title slug overview genres rating releaseDate runtime language posterUrl backdropUrl isTrending isFeatured"
      )
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Movie.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalMovies / limitNumber);

  return sendSuccess(res, 200, {
    movies,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalMovies,
      limit: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  });
});

// @desc    Get a single movie by slug or ID
// @route   GET /api/movies/:idOrSlug
// @access  Public
export const getMovieById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let movie;
  if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    movie = await Movie.findById(id)
      .populate("similarMovies", "title slug posterUrl rating")
      .lean();
  } else {
    movie = await Movie.findOne({ slug: id.toLowerCase() })
      .populate("similarMovies", "title slug posterUrl rating")
      .lean();
  }

  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  // Post-process cast images with a dummy placeholder
  if (movie.cast && Array.isArray(movie.cast)) {
    movie.cast = movie.cast.map((actor) => ({
      ...actor,
      actorImage: actor.actorImage || "https://via.placeholder.com/200x200",
    }));
  }

  // Increment view count (can be done asynchronously)
  Movie.findByIdAndUpdate(movie._id, { $inc: { views: 1 } }).catch((err) =>
    console.error("Error incrementing views:", err)
  );

  return sendSuccess(res, 200, movie);
});

// @desc    Get movie trailer
// @route   GET /api/movies/:id/trailer
// @access  Public
export const getMovieTrailer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const movie = await Movie.findOne({
    $or: [{ slug: id.toLowerCase() }, { _id: id }],
  }).select("trailerUrl title");

  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  if (!movie.trailerUrl) {
    throw new ApiError(404, "Trailer not available for this movie");
  }

  return sendSuccess(res, 200, {
    title: movie.title,
    trailerUrl: movie.trailerUrl,
    embedUrl: `https://www.youtube.com/embed/${movie.trailerUrl}`,
  });
});

// @desc    Get recommendations for a movie
// @route   GET /api/movies/:id/recommendations
// @access  Public
export const getRecommendations = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;

  const movie = await Movie.findOne({
    $or: [{ slug: id.toLowerCase() }, { _id: id }],
  }).lean();

  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }

  // Find movies with similar genres, mood, or keywords
  const recommendations = await Movie.find({
    _id: { $ne: movie._id },
    $or: [
      { genres: { $in: movie.genres } },
      { mood: { $in: movie.mood } },
      { keywords: { $in: movie.keywords } },
    ],
  })
    .select("title slug posterUrl rating")
    .limit(parseInt(limit))
    .lean();

  return sendSuccess(res, 200, recommendations);
});

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const movies = await Movie.find({ isTrending: true })
    .select("title slug posterUrl rating releaseDate")
    .limit(parseInt(limit))
    .lean();

  return sendSuccess(res, 200, movies);
});

// @desc    Get movie genres
// @route   GET /api/movies/genres
// @access  Public
export const getMovieGenres = asyncHandler(async (req, res, next) => {
  // Get unique genres
  const genres = await Movie.distinct("genres");

  return sendSuccess(res, 200, genres.sort());
});

// @desc    Get user mood-based recommendations
// @route   GET /api/movies/mood/:mood
// @access  Public
export const getMoodRecommendations = asyncHandler(async (req, res, next) => {
  const { mood } = req.params;
  const { limit = 10 } = req.query;

  if (!mood) {
    throw new ApiError(400, "Mood is required");
  }

  const movies = await Movie.find({
    mood: { $in: [mood.toLowerCase()] },
  })
    .select("title slug posterUrl rating releaseDate genres runtime")
    .limit(parseInt(limit))
    .lean();

  return sendSuccess(res, 200, movies);
});

export default {
  getAllMovies,
  getMovieById,
  getMovieTrailer,
  getRecommendations,
  getTrendingMovies,
  getMovieGenres,
  getMoodRecommendations,
};