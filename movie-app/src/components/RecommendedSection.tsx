'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Movie } from '@/types/movie';

interface RecommendedSectionProps {
  movies: Movie[];
  title: string;
}

export default function RecommendedSection({ movies, title }: RecommendedSectionProps) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold font-display mb-2">{title}</h2>
          <p className="text-gray-400">Based on your viewing preferences</p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex-shrink-0 w-56 snap-start"
            >
              <Link href={`/movie/${movie.id}`}>
                <div className="group relative overflow-hidden rounded-xl aspect-[2/3] mb-3">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
                    <Star className="w-3 h-3 text-accent-gold" fill="#f5c518" />
                    <span className="text-sm font-semibold">{movie.rating.toFixed(1)}</span>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-glow"
                    >
                      <Star className="w-7 h-7 text-white" fill="white" />
                    </motion.div>
                  </motion.div>
                </div>

                <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{movie.releaseYear}</span>
                  <span>\u00b7</span>
                  <span className="truncate">{movie.genres.slice(0, 2).join(', ')}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}