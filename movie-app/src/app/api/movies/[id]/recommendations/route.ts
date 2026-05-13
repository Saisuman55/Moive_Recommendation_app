import { NextRequest, NextResponse } from 'next/server';
import { sampleMovies } from '@/lib/movies';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = parseInt(id);
  const movie = sampleMovies.find((m) => m.id === movieId);

  if (!movie) {
    return NextResponse.json(
      { error: 'Movie not found' },
      { status: 404 }
    );
  }

  const recommendations = sampleMovies
    .filter((m) => m.id !== movieId)
    .filter((m) => {
      const genreMatch = m.genres.some((g) => movie.genres.includes(g));
      const moodMatch = movie.mood?.some((mood) => m.mood?.includes(mood));
      return genreMatch || moodMatch;
    })
    .slice(0, 10);

  return NextResponse.json({
    recommendations,
    count: recommendations.length,
  });
}