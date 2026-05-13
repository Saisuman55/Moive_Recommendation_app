import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { sampleMovies } from '@/lib/movies';
import HeroSection from '@/components/HeroSection';
import CastSection from '@/components/CastSection';
import RecommendedSection from '@/components/RecommendedSection';
import { SkeletonBackdrop, SkeletonText, SkeletonCast } from '@/components/Skeleton';
import { notFound } from 'next/navigation';

const TrailerModal = dynamic(() => import('@/components/TrailerModal'), {
  ssr: false,
  loading: () => null,
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return sampleMovies.map((movie) => ({
    id: movie.id.toString(),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const movie = sampleMovies.find((m) => m.id === parseInt(id));
  
  if (!movie) {
    return {
      title: 'Movie Not Found | CineVault',
    };
  }

  return {
    title: `${movie.title} | CineVault`,
    description: movie.overview,
  };
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const movieId = parseInt(id);
  const movie = sampleMovies.find((m) => m.id === movieId);

  if (!movie) {
    notFound();
  }

  const similarMovies = sampleMovies
    .filter((m) => m.id !== movieId && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<MovieSkeleton />}>
        <HeroSection movie={movie} />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<CastSection cast={[]} />}>
          <CastSection cast={movie.cast} />
        </Suspense>

        <Suspense fallback={<RecommendedSection movies={[]} title="Recommended" />}>
          <RecommendedSection 
            movies={similarMovies} 
            title="Because You Watched This" 
          />
        </Suspense>

        <Suspense fallback={<RecommendedSection movies={[]} title="More Like This" />}>
          <RecommendedSection 
            movies={similarMovies.slice(0, 5)} 
            title="More Like This" 
          />
        </Suspense>
      </div>
    </div>
  );
}

function MovieSkeleton() {
  return (
    <div>
      <SkeletonBackdrop />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <SkeletonText lines={5} />
        <SkeletonCast />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton aspect-[2/3] rounded-xl" />
  );
}