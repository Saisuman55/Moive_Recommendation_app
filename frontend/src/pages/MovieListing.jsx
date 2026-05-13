import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import useStore from '../store/useStore';
import { movieAPI } from '../lib/api';

const MovieListing = () => {
  const {
    movies,
    setMovies,
    filters,
    setFilters,
    pagination,
    setPagination,
    setLoading,
    setError,
    isLoading,
    error,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...filters });

  useEffect(() => {
    fetchMovies();
  }, [pagination.currentPage, filters]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters,
      };

      const response = await movieAPI.getAllMovies(params);
      setMovies(response.data.data.movies);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch movies');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      genre: '',
      mood: '',
      year: '',
      rating: '',
      language: '',
      sortBy: 'rating',
      sortOrder: 'desc',
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ currentPage: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
    'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller',
    'War', 'Western',
  ];

  const moods = [
    'Happy', 'Sad', 'Exciting', 'Relaxing', 'Scary',
    'Romantic', 'Inspiring', 'Funny', 'Dramatic', 'Thrilling',
  ];

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading && movies.length === 0) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[2/3] bg-gray-800 rounded-2xl animate-pulse" />
              <div className="h-4 bg-gray-800 rounded animate-pulse" />
              <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchMovies}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Discover Movies
        </h1>
        <p className="text-gray-400">
          {pagination.totalMovies} movies found
        </p>
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {Object.values(filters).some((v) => v && v !== 'rating' && v !== 'desc') && (
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
          )}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-6 bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={localFilters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search movies..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    value={localFilters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Genres</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mood
                  </label>
                  <select
                    value={localFilters.mood}
                    onChange={(e) => handleFilterChange('mood', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Moods</option>
                    {moods.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Year
                  </label>
                  <select
                    value={localFilters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rating
                  </label>
                  <select
                    value={localFilters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Ratings</option>
                    <option value="9-10">9-10</option>
                    <option value="8-9">8-9</option>
                    <option value="7-8">7-8</option>
                    <option value="6-7">6-7</option>
                    <option value="5-6">5-6</option>
                    <option value="0-5">Below 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="rating">Rating</option>
                    <option value="releaseDate">Release Date</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={applyFilters}
                  className="btn-primary"
                >
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="btn-secondary"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No movies found</p>
          <button
            onClick={resetFilters}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
            {movies.map((movie, index) => (
              <MovieCard key={movie._id} movie={movie} index={index} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mb-8">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      pageNum === pagination.currentPage
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MovieListing;