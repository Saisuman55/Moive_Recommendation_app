import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { movieAPI } from '../lib/api';

const RecommendedMovies = ({ movieId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = React.useRef(null);

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await movieAPI.getRecommendations(movieId, { limit: 10 });
      setRecommendations(response.data.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 400;
      const newPosition = direction === 'left'
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount;

      containerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });

      setScrollPosition(newPosition);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Recommended Movies</h2>
        <div className="flex space-x-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 space-y-3">
              <div className="aspect-[2/3] bg-gray-800 rounded-2xl animate-pulse" />
              <div className="h-4 bg-gray-800 rounded animate-pulse" />
              <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">
          Because you watched this
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
            disabled={scrollPosition <= 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {recommendations.map((movie, index) => (
          <div key={movie._id} className="flex-shrink-0 w-48">
            <MovieCard movie={movie} index={index} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecommendedMovies;