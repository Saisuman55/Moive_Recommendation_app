'use client';

import { motion } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMovieStore, allGenres, allMoods, allLanguages } from '@/store/movieStore';

export default function FilterBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { filters, setFilters, resetFilters } = useMovieStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchQuery });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleGenre = (genre: string) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre];
    setFilters({ ...filters, genres: newGenres });
  };

  const toggleMood = (mood: string) => {
    setFilters({ ...filters, mood: filters.mood === mood ? undefined : mood });
  };

  const clearFilters = () => {
    setSearchQuery('');
    resetFilters();
  };

  return (
    <div className="sticky top-16 z-40 glass-dark backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 rounded-xl glass bg-background-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isOpen ? 'bg-primary text-white' : 'glass hover:bg-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>

            {(filters.genres?.length || 0) > 0 || filters.mood || filters.minRating ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="px-6 py-3 rounded-xl glass hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                Clear All
              </motion.button>
            ) : null}
          </div>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl p-6 space-y-6 overflow-hidden"
            >
              <div>
                <h4 className="font-semibold mb-3 text-gray-300">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {allGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filters.genres?.includes(genre)
                          ? 'bg-primary text-white shadow-glow'
                          : 'glass hover:bg-white/20'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-300">Mood</h4>
                <div className="flex flex-wrap gap-2">
                  {allMoods.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                        filters.mood === mood
                          ? 'bg-accent-purple text-white shadow-glow'
                          : 'glass hover:bg-white/20'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-300">Language</h4>
                <div className="flex flex-wrap gap-2">
                  {allLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          language: filters.language === lang ? undefined : lang,
                        })
                      }
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filters.language === lang
                          ? 'bg-accent-blue text-white shadow-glow'
                          : 'glass hover:bg-white/20'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-300">Rating: {filters.minRating?.toFixed(1) || '0'}+</h4>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={filters.minRating || 0}
                  onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-300">Year Range</h4>
                <div className="flex gap-4 items-center">
                  <input
                    type="number"
                    placeholder="From"
                    value={filters.yearFrom || ''}
                    onChange={(e) => setFilters({ ...filters, yearFrom: parseInt(e.target.value) })}
                    className="flex-1 px-4 py-2 rounded-lg glass bg-background-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    placeholder="To"
                    value={filters.yearTo || ''}
                    onChange={(e) => setFilters({ ...filters, yearTo: parseInt(e.target.value) })}
                    className="flex-1 px-4 py-2 rounded-lg glass bg-background-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}