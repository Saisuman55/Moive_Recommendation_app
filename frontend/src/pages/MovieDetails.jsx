import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Calendar, Clock, Globe, Film, Heart, Share2,
  Play, DollarSign, TrendingUp, Award
} from 'lucide-react';
import useStore from '../store/useStore';
import { movieAPI } from '../lib/api';
import TrailerModal from '../components/TrailerModal';
import CastSection from '../components/CastSection';
import RecommendedMovies from '../components/RecommendedMovies';

const MovieDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    currentMovie,
    setCurrentMovie,
    toggleWatchlist,
    isInWatchlist,
    addToRecentlyViewed,
    openTrailerModal,
    trailerModal,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullOverview, setShowFullOverview] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchMovieDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await movieAPI.getMovieById(slug);
      setCurrentMovie(response.data.data);
      addToRecentlyViewed(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch movie details');
      console.error('Error fetching movie details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchTrailer = async () => {
    try {
      const response = await movieAPI.getMovieTrailer(slug);
      openTrailerModal(
        response.data.data.embedUrl,
        response.data.data.title
      );
    } catch (err) {
      console.error('Error fetching trailer:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentMovie.title,
          text: currentMovie.overview,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-[60vh] bg-gray-800 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="h-8 bg-gray-800 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
            <div className="h-32 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Movie not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(currentMovie._id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <AnimatePresence>
        {trailerModal.isOpen && (
          <TrailerModal
            trailerUrl={trailerModal.trailerUrl}
            movieTitle={trailerModal.movieTitle}
            onClose={() => useStore.getState().closeTrailerModal()}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="absolute inset-0">
          <img
            src={currentMovie.backdropUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/50 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
                  {currentMovie.title}
                </h1>
                {currentMovie.tagline && (
                  <p className="text-xl text-purple-400 italic mb-4">
                    "{currentMovie.tagline}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-lg font-semibold">
                      {currentMovie.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-gray-400">/ 10</span>
                  </div>

                  {currentMovie.releaseDate && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(currentMovie.releaseDate).toLocaleDateString(
                          'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </span>
                    </div>
                  )}

                  {currentMovie.runtime && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>{currentMovie.runtime} min</span>
                    </div>
                  )}

                  {currentMovie.language && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Globe className="w-4 h-4" />
                      <span>{currentMovie.language}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {currentMovie.genres?.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-purple-600/80 text-white text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleWatchTrailer}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Watch Trailer</span>
                  </button>

                  <button
                    onClick={() => toggleWatchlist(currentMovie)}
                    className={`btn-secondary flex items-center space-x-2 ${
                      inWatchlist ? 'bg-pink-600/20 border-pink-600' : ''
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${inWatchlist ? 'fill-pink-600 text-pink-600' : ''}`}
                    />
                    <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-white">Overview</h2>
                <p className="text-gray-300 leading-relaxed">
                  {showFullOverview
                    ? currentMovie.overview
                    : `${currentMovie.overview?.slice(0, 300)}...`}
                  {currentMovie.overview?.length > 300 && (
                    <button
                      onClick={() => setShowFullOverview(!showFullOverview)}
                      className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showFullOverview ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {currentMovie.director && (
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <Film className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Director</p>
                    <p className="text-white font-semibold">{currentMovie.director}</p>
                  </div>
                )}

                {currentMovie.productionCompany && (
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <Award className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Production</p>
                    <p className="text-white font-semibold">{currentMovie.productionCompany}</p>
                  </div>
                )}

                {currentMovie.country && (
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <Globe className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Country</p>
                    <p className="text-white font-semibold">{currentMovie.country}</p>
                  </div>
                )}

                {currentMovie.budget && (
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <DollarSign className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Budget</p>
                    <p className="text-white font-semibold">
                      ${currentMovie.budget?.toLocaleString()}
                    </p>
                  </div>
                )}

                {currentMovie.revenue && (
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Revenue</p>
                    <p className="text-white font-semibold">
                      ${currentMovie.revenue?.toLocaleString()}
                    </p>
                  </div>
                )}

                {currentMovie.ageRating && (
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <Award className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Age Rating</p>
                    <p className="text-white font-semibold">{currentMovie.ageRating}</p>
                  </div>
                )}
              </motion.div>

              {currentMovie.writers && currentMovie.writers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-3">Writers</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentMovie.writers.map((writer) => (
                      <span
                        key={writer}
                        className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                      >
                        {writer}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentMovie.streamingPlatforms && currentMovie.streamingPlatforms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-xl font-bold text-white mb-3">Available On</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentMovie.streamingPlatforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-600/50 rounded-full text-sm"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky top-24"
              >
                <img
                  src={currentMovie.posterUrl}
                  alt={currentMovie.title}
                  className="w-full rounded-2xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {currentMovie.cast && currentMovie.cast.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CastSection cast={currentMovie.cast} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <RecommendedMovies movieId={currentMovie._id} />
      </div>
    </motion.div>
  );
};

export default MovieDetails;