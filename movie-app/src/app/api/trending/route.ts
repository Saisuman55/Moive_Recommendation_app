import { NextRequest, NextResponse } from 'next/server';
import { sampleMovies } from '@/lib/movies';

export async function GET() {
  const trending = [...sampleMovies]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  return NextResponse.json({
    trending,
    count: trending.length,
  });
}