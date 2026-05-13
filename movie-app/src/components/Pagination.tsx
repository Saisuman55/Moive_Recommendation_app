'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg glass disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg glass hover:bg-white/20 transition-all"
          >
            1
          </button>
          {startPage > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {pages.slice(startPage - 1, endPage).map((page) => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg transition-all ${
            page === currentPage
              ? 'bg-primary text-white shadow-glow'
              : 'glass hover:bg-white/20'
          }`}
        >
          {page}
        </motion.button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg glass hover:bg-white/20 transition-all"
          >
            {totalPages}
          </button>
        </>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg glass disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}