import { NextRequest, NextResponse } from 'next/server';
import { findByImdbId, findTmdbIdByName } from '@/lib/tmdb';
import { resolveImdbToTmdbId } from '@/lib/tvmaze';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imdbId = searchParams.get('imdb');
  const name = searchParams.get('name');
  const type = (searchParams.get('type') || 'tv') as 'movie' | 'tv';

  if (!imdbId && !name) {
    return NextResponse.json({ error: 'Missing imdb or name parameter' }, { status: 400 });
  }

  let tmdbId: number | null = null;

  // Strategy 1: Use TMDB find endpoint with IMDB ID (requires API key)
  if (imdbId) {
    tmdbId = await findByImdbId(imdbId, type);
  }

  // Strategy 2: Use free Cinemeta API (Stremio) to resolve IMDB → TMDB
  if (!tmdbId && imdbId) {
    tmdbId = await resolveImdbToTmdbId(imdbId, type);
  }

  // Strategy 3: Search TMDB by name (requires API key)
  if (!tmdbId && name) {
    tmdbId = await findTmdbIdByName(name, type);
  }

  if (tmdbId) {
    return NextResponse.json({ tmdbId });
  }

  return NextResponse.json({ tmdbId: null, error: 'Could not resolve TMDB ID' }, { status: 404 });
}
