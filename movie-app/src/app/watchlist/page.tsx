'use client';

import { motion } from 'framer-motion';
import { useMovieStore } from '@/store/movieStore';
import MovieCard from '@/components/MovieCard';
import { List, X } from 'lucide-react';

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useMovieStore();
  const watchlistMovies = useMovieStore((state) =>
    state.movies.filter((m) => watchlist.includes(m.id))
  );

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold font-display text-white mb-2">My Watchlist</h1>
            <p className="text-gray-400">
              {watchlistMovies.length} {watchlistMovies.length === 1 ? 'movie' : 'movies'} saved
            </p>
          </div>
        </motion.div>

        {watchlistMovies.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {watchlistMovies.map((movie, index) => (
              <div key={movie.id} className="relative group">
                <MovieCard movie={movie} index={index} />
                <motion.button
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  onClick={() => removeFromWatchlist(movie.id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <List className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-white">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-6">Add movies you want to watch later</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all"
            >
              Browse Movies
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}