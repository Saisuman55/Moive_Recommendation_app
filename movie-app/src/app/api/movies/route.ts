import { NextRequest, NextResponse } from 'next/server';
import { sampleMovies } from '@/lib/movies';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';
  const genres = searchParams.getAll('genres');
  const minRating = parseFloat(searchParams.get('minRating') || '0');
  const yearFrom = parseInt(searchParams.get('yearFrom') || '0');
  const yearTo = parseInt(searchParams.get('yearTo') || '9999');
  const language = searchParams.get('language') || '';
  const mood = searchParams.get('mood') || '';

  let filtered = [...sampleMovies];

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (movie) =>
        movie.title.toLowerCase().includes(searchLower) ||
        movie.overview.toLowerCase().includes(searchLower)
    );
  }

  if (genres.length > 0) {
    filtered = filtered.filter((movie) =>
      genres.some((genre) => movie.genres.includes(genre))
    );
  }

  if (minRating > 0) {
    filtered = filtered.filter((movie) => movie.rating >= minRating);
  }

  if (yearFrom > 0) {
    filtered = filtered.filter((movie) => movie.releaseYear >= yearFrom);
  }

  if (yearTo < 9999) {
    filtered = filtered.filter((movie) => movie.releaseYear <= yearTo);
  }

  if (language) {
    filtered = filtered.filter((movie) => movie.language === language);
  }

  if (mood) {
    filtered = filtered.filter((movie) =>
      movie.mood?.some((m) => m === mood)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return NextResponse.json({
    data: filtered.slice(startIndex, endIndex),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  });
}