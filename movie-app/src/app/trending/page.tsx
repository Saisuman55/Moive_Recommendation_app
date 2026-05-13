'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MovieCard from '@/components/MovieCard';
import { TrendingUp, Sparkles } from 'lucide-react';
import { SkeletonCard } from '@/components/Skeleton';

interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  genres: string[];
  releaseYear: number;
  runtime: number;
  releaseDate: string;
  language: string;
  country: string;
  director: string;
  writers: string[];
  productionCompany: string;
  budget: number;
  revenue: number;
  ageRating: string;
  tagline?: string;
  trailerUrl: string;
  cast: any[];
  mood?: string[];
}

export default function TrendingPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending')
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.trending);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background-secondary to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent-gold" />
              <span className="text-sm text-gray-300">Trending Now</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-4">
              <span className="gradient-text">Trending</span>
              <br />
              <span className="text-white">Movies</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover what everyone is watching right now
            </p>
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {movies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}