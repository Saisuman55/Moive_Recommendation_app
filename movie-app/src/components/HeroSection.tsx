'use client';

import { motion } from 'framer-motion';
import { Play, Heart, List, Share2, Clock, Calendar, Globe, Award } from 'lucide-react';
import { useState } from 'react';
import TrailerModal from '@/components/TrailerModal';
import { useMovieStore } from '@/store/movieStore';

interface HeroSectionProps {
  movie: any;
}

export default function HeroSection({ movie }: HeroSectionProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, toggleLike, isLiked } = useMovieStore();
  const inWatchlist = isInWatchlist(movie.id);
  const liked = isLiked(movie.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 via-60% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex items-end pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {movie.tagline && (
                    <p className="text-gray-300 text-lg italic mb-2">{movie.tagline}</p>
                  )}
                  
                  <h1 className="text-5xl md:text-6xl font-bold font-display text-white mb-4">
                    {movie.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/20">
                      <Award className="w-4 h-4 text-accent-gold" />
                      <span className="font-semibold text-accent-gold">{movie.rating.toFixed(1)}</span>
                      <span className="text-gray-400 text-sm">/10</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>{movie.releaseYear}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(movie.runtime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <Globe className="w-4 h-4" />
                      <span>{movie.language}</span>
                    </div>

                    <span className="px-3 py-1 rounded-full border border-gray-600 text-gray-300 text-sm">
                      {movie.ageRating}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre: string) => (
                      <span
                        key={genre}
                        className="px-4 py-2 rounded-full glass text-sm font-medium hover:bg-primary/20 transition-colors cursor-default"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mb-8">
                    {movie.overview}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowTrailer(true)}
                      className="flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-white font-semibold shadow-glow hover:shadow-glow/70 transition-all"
                    >
                      <Play className="w-5 h-5" fill="white" />
                      Watch Trailer
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => inWatchlist ? removeFromWatchlist(movie.id) : addToWatchlist(movie.id)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all ${
                        inWatchlist
                          ? 'bg-primary/20 text-primary border border-primary'
                          : 'glass hover:bg-white/20'
                      }`}
                    >
                      <List className="w-5 h-5" />
                      {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleLike(movie.id)}
                      className={`p-4 rounded-xl transition-all ${
                        liked
                          ? 'bg-primary text-white'
                          : 'glass hover:bg-white/20'
                      }`}
                    >
                      <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-4 rounded-xl glass hover:bg-white/20 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:block"
              >
                <div className="glass rounded-2xl p-6 cinematic-glow">
                  <h3 className="text-lg font-semibold mb-4">Movie Info</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Director</span>
                      <span className="text-white font-medium">{movie.director}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Production</span>
                      <span className="text-white font-medium text-right">{movie.productionCompany}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Budget</span>
                      <span className="text-white font-medium">{formatCurrency(movie.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-white font-medium">{formatCurrency(movie.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Release Date</span>
                      <span className="text-white font-medium">
                        {new Date(movie.releaseDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country</span>
                      <span className="text-white font-medium">{movie.country}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <TrailerModal isOpen={showTrailer} onClose={() => setShowTrailer(false)} trailerUrl={movie.trailerUrl} />
    </>
  );
}