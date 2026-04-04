import { NextRequest, NextResponse } from 'next/server';
import { findByImdbId, findTmdbIdByName } from '@/lib/tmdb';
import { resolveImdbToTmdbId } from '@/lib/tvmaze';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providedTmdbId = searchParams.get('tmdb');
  const imdbId = searchParams.get('imdb');
  const name = searchParams.get('name');
  const yearParam = searchParams.get('year');
  const type = (searchParams.get('type') || 'tv') as 'movie' | 'tv';
  const year = yearParam ? Number(yearParam) : null;

  if (!providedTmdbId && !imdbId && !name) {
    return NextResponse.json(
      { error: 'Missing tmdb, imdb, or name parameter' },
      { status: 400 }
    );
  }

  if (providedTmdbId) {
    return NextResponse.json({
      tmdbId: Number(providedTmdbId),
      strategy: 'provided',
    });
  }

  let tmdbId: number | null = null;
  let strategy: string | null = null;

  // Strategy 1: Use TMDB find endpoint with IMDB ID (requires API key)
  if (imdbId) {
    tmdbId = await findByImdbId(imdbId, type);
    if (tmdbId) strategy = 'tmdb-imdb';
  }

  // Strategy 2: Use free Cinemeta API (Stremio) to resolve IMDB → TMDB
  if (!tmdbId && imdbId) {
    tmdbId = await resolveImdbToTmdbId(imdbId, type);
    if (tmdbId) strategy = 'cinemeta-imdb';
  }

  // Strategy 3: Search TMDB by title + year when available (requires API key)
  if (!tmdbId && name) {
    tmdbId = await findTmdbIdByName(name, type, { year });
    if (tmdbId) strategy = year ? 'tmdb-name-year' : 'tmdb-name';
  }

  if (tmdbId) {
    return NextResponse.json({ tmdbId, strategy, year });
  }

  return NextResponse.json(
    {
      tmdbId: null,
      year,
      error: 'Could not resolve TMDB ID',
    },
    { status: 404 }
  );
}
