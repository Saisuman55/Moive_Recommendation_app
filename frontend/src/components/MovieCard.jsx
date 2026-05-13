import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Calendar, Play, Heart, Plus } from 'lucide-react';
import useStore from '../store/useStore';

const MovieCard = ({ movie, index }) => {
  const { toggleWatchlist, isInWatchlist } = useStore();
  const inWatchlist = isInWatchlist(movie._id);

  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
  };

  const hoverVariants = {
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group relative"
    >
      <Link to={`/movie/${movie.slug}`}>
        <motion.div
          variants={hoverVariants}
          className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-xl"
        >
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={movie.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster'}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold">{movie.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <button
                  onClick={handleWatchlistToggle}
                  className={`p-2 rounded-full transition-colors ${
                    inWatchlist
                      ? 'bg-pink-600 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {inWatchlist ? (
                    <Heart className="w-4 h-4 fill-current" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <Calendar className="w-3 h-3" />
                <span>
                  {movie.releaseDate
                    ? new Date(movie.releaseDate).getFullYear()
                    : 'N/A'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {movie.genres?.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-purple-600/80 text-white text-xs rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-purple-600 p-2 rounded-full shadow-lg">
              <Play className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/50 rounded-2xl transition-colors duration-300" />
        </motion.div>
      </Link>

      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span>{movie.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <span>
            {movie.releaseDate
              ? new Date(movie.releaseDate).getFullYear()
              : 'N/A'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;