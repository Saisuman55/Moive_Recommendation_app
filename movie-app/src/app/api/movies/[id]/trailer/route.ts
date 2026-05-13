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

  const trailerVideo = {
    id: extractYoutubeId(movie.trailerUrl) || '',
    key: extractYoutubeId(movie.trailerUrl) || '',
    name: `${movie.title} - Official Trailer`,
    site: 'YouTube',
    type: 'Trailer',
    size: 1080,
  };

  return NextResponse.json({
    results: [trailerVideo],
    id: movieId,
  });
}

function extractYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}