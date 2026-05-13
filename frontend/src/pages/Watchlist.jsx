import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, Clock } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import useStore from '../store/useStore';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const { watchlist, removeFromWatchlist } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleRemoveFromWatchlist = (movieId, e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWatchlist(movieId);
  };

  if (isLoading) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
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

  if (watchlist.length === 0) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Heart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Your Watchlist is Empty</h2>
          <p className="text-gray-400 mb-8">
            Start adding movies to your watchlist to keep track of what you want to watch.
          </p>
          <Link
            to="/"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>Discover Movies</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          My Watchlist
        </h1>
        <p className="text-gray-400 flex items-center space-x-2">
          <Heart className="w-4 h-4 text-pink-500" />
          <span>{watchlist.length} movies saved</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {watchlist.map((movie, index) => (
          <div key={movie._id} className="relative group">
            <Link to={`/movie/${movie.slug}`}>
              <MovieCard movie={movie} index={index} />
            </Link>
            <button
              onClick={(e) => handleRemoveFromWatchlist(movie._id, e)}
              className="absolute top-2 right-2 p-2 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
              title="Remove from watchlist"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;