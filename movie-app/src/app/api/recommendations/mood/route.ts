import { NextRequest, NextResponse } from 'next/server';
import { sampleMovies } from '@/lib/movies';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mood = searchParams.get('mood') || '';

  if (!mood) {
    return NextResponse.json(
      { error: 'Mood parameter is required' },
      { status: 400 }
    );
  }

  const recommendations = sampleMovies
    .filter((m) => m.mood?.includes(mood))
    .slice(0, 10);

  return NextResponse.json({
    recommendations,
    mood,
    count: recommendations.length,
  });
}