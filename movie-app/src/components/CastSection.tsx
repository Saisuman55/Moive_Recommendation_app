'use client';

import { motion } from 'framer-motion';
import { Play, Heart, List, Star } from 'lucide-react';
import { useMovieStore } from '@/store/movieStore';

interface CastCardProps {
  actor: {
    id: number;
    name: string;
    character: string;
    profileImage: string;
  };
  index: number;
}

export function CastCard({ actor, index }: CastCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="flex-shrink-0 w-40 group cursor-pointer"
    >
      <div className="relative w-40 h-40 rounded-full overflow-hidden mb-3">
        <img
          src={actor.profileImage}
          alt={actor.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h4 className="font-semibold text-white text-center truncate">{actor.name}</h4>
      <p className="text-sm text-gray-400 text-center truncate">{actor.character}</p>
    </motion.div>
  );
}

interface CastSectionProps {
  cast: any[];
}

export default function CastSection({ cast }: CastSectionProps) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <h2 className="text-3xl font-bold font-display">Top Cast</h2>
          <button className="text-primary hover:text-primary-light transition-colors font-medium">
            View All
          </button>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
          {cast.map((actor, index) => (
            <div key={actor.id} className="snap-start">
              <CastCard actor={actor} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}