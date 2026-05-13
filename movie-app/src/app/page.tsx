'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePagination } from '@/store/movieStore';
import MovieCard from '@/components/MovieCard';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { SkeletonCard } from '@/components/Skeleton';
import { Film, TrendingUp, Sparkles } from 'lucide-react';

export default function Home() {
  const { movies, currentPage, totalPages, totalItems, hasNext, hasPrev, nextPage, prevPage, goToPage } = usePagination();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background-secondary to-background" />
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/1a1a2e/e50914?text=Cinema')] bg-cover bg-center opacity-20" />
        
        <div className="relative z-10 h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent-gold" />
              <span className="text-sm text-gray-300">AI-Powered Recommendations</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-4">
              <span className="gradient-text">Discover Your</span>
              <br />
              <span className="text-white">Next Favorite Movie</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Browse thousands of movies, get personalized recommendations, and immerse yourself in cinematic excellence.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" />
                <span>{totalItems}+ Movies</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Trending Daily</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <FilterBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {currentPage === 1 ? 'All Movies' : `Page ${currentPage}`}
          </h2>
          <span className="text-gray-400">
            Showing {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalItems)} of {totalItems}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
              <AnimatePresence>
                {movies.map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Film className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No movies found</h3>
            <p className="text-gray-400">Try adjusting your filters or search query</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}