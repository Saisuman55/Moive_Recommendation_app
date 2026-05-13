'use client';

import { motion } from 'framer-motion';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <div className="skeleton w-full aspect-[2/3]" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonBackdrop() {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden rounded-2xl">
      <div className="skeleton w-full h-full" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCast() {
  return (
    <div className="flex gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-32">
          <div className="skeleton w-32 h-32 rounded-full mb-2" />
          <div className="skeleton h-4 w-24" />
        </div>
      ))}
    </div>
  );
}