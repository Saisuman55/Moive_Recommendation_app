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

  return NextResponse.json(movie);
}