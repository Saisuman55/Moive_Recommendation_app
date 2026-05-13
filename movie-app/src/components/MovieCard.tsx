'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Play } from 'lucide-react';
import { Movie } from '@/types/movie';
import { useMovieStore } from '@/store/movieStore';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const { addToRecentlyViewed, isInWatchlist, toggleLike } = useMovieStore();

  const handleCardClick = () => {
    addToRecentlyViewed(movie.id);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(movie.id);
  };

  return (
    <Link href={`/movie/${movie.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ scale: 1.05, y: -8 }}
        onClick={handleCardClick}
        className="movie-card group cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-xl aspect-[2/3]">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow"
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </motion.div>
          </motion.div>

          <div className="rating-badge">
            <Star className="w-3 h-3 text-accent-gold" fill="#f5c518" />
            <span className="text-sm font-semibold">{movie.rating.toFixed(1)}</span>
          </div>

          <div className="absolute top-2 left-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLikeClick}
              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                useMovieStore.getState().isLiked(movie.id)
                  ? 'bg-primary text-white'
                  : 'bg-black/50 text-white hover:bg-primary/50'
              }`}
            >
              <Star className="w-4 h-4" fill={useMovieStore.getState().isLiked(movie.id) ? 'currentColor' : 'none'} />
            </motion.button>
          </div>
        </div>

        <div className="p-4 bg-background-secondary group-hover:bg-background-tertiary transition-colors">
          <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <span>{movie.releaseYear}</span>
            <span>\u00b7</span>
            <span className="truncate">{movie.genres.slice(0, 2).join(', ')}</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {movie.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}