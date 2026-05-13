import { NextRequest, NextResponse } from 'next/server';
import { sampleMovies, allGenres, allMoods, allLanguages } from '@/lib/movies';

export async function GET() {
  return NextResponse.json({
    genres: allGenres,
    moods: allMoods,
    languages: allLanguages,
    totalMovies: sampleMovies.length,
  });
}