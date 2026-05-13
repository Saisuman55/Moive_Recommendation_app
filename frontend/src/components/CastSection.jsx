import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const CastSection = ({ cast }) => {
  if (!cast || cast.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-white">Cast</h2>

      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
        {cast.map((actor, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-48 space-y-3 group"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-800">
              {actor.actorImage ? (
                <img
                  src={actor.actorImage}
                  alt={actor.actorName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                {actor.actorName}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {actor.characterName}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CastSection;