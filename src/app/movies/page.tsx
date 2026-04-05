import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import { BrowseExploreBar } from '@/components/browse-explore-bar';
import { BrowseMediaGrid } from '@/components/browse-media-grid';
import { BrowsePagination } from '@/components/browse-pagination';
import { DEFAULT_SORT, getRuntimeRange, isValidSort } from '@/lib/browse-filters';
import {
  isApiKeyConfigured,
  getGenres,
  discoverMovies,
  searchMoviesPaged,
  fetchMoviesFromEndpoint,
} from '@/lib/tmdb';
import { getPopularTVMazeShows, getTopRatedTVMazeShows } from '@/lib/tvmaze';

function firstString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (firstString(sp.q) ?? '').trim();
  const page = Math.max(1, parseInt(firstString(sp.page) ?? '1', 10) || 1);
  const sort = isValidSort('movie', firstString(sp.sort))
    ? (firstString(sp.sort) as string)
    : DEFAULT_SORT.movie;
  const gRaw = firstString(sp.g);
  const yearRaw = firstString(sp.year);
  const langRaw = firstString(sp.lang);
  const originRaw = firstString(sp.origin);
  const ratingRaw = firstString(sp.rating);
  const votesRaw = firstString(sp.votes);
  const runtimeRaw = firstString(sp.runtime);
  const genreId = gRaw && /^\d+$/.test(gRaw) ? parseInt(gRaw, 10) : undefined;
  const year = yearRaw && /^\d{4}$/.test(yearRaw) ? parseInt(yearRaw, 10) : undefined;
  const lang = langRaw && /^[a-z]{2}$/.test(langRaw) ? langRaw : undefined;
  const origin = originRaw && /^[A-Z]{2}$/.test(originRaw) ? originRaw : undefined;
  const rating = ratingRaw && /^\d+(\.\d+)?$/.test(ratingRaw) ? parseFloat(ratingRaw) : undefined;
  const votes = votesRaw && /^\d+$/.test(votesRaw) ? parseInt(votesRaw, 10) : undefined;
  const runtime = getRuntimeRange('movie', runtimeRaw);

  const tmdbAvailable = isApiKeyConfigured();
  const genres = tmdbAvailable ? await getGenres() : [];

  let browse: {
    results: Awaited<ReturnType<typeof discoverMovies>>['results'];
    page: number;
    totalPages: number;
    totalResults: number;
    mode: 'search' | 'discover';
  } | null = null;

  if (tmdbAvailable) {
    if (q.length > 0) {
      const r = await searchMoviesPaged(q, page);
      browse = { ...r, mode: 'search' };
    } else {
      const r = await discoverMovies({
        page,
        sortBy: sort,
        genreId: genreId !== undefined && Number.isFinite(genreId) ? genreId : undefined,
        year: year !== undefined && Number.isFinite(year) ? year : undefined,
        originalLanguage: lang,
        originCountry: origin,
        minRating: rating,
        minVotes: votes,
        runtimeGte: runtime?.gte,
        runtimeLte: runtime?.lte,
      });
      browse = { ...r, mode: 'discover' };
    }
  }

  const [nowPlaying, popular, topRated, upcoming] = tmdbAvailable
    ? await Promise.all([
        fetchMoviesFromEndpoint('/movie/now_playing', [1, 2, 3]),
        fetchMoviesFromEndpoint('/movie/popular', [1, 2, 3]),
        fetchMoviesFromEndpoint('/movie/top_rated', [1, 2, 3]),
        fetchMoviesFromEndpoint('/movie/upcoming', [1, 2, 3]),
      ])
    : [[], [], [], []];

  const hasTmdbRows = nowPlaying.length > 0 || popular.length > 0;

  let tvmazeFallback: Awaited<ReturnType<typeof getPopularTVMazeShows>> = [];
  let tvmazeTopRated: typeof tvmazeFallback = [];
  if (!hasTmdbRows) {
    [tvmazeFallback, tvmazeTopRated] = await Promise.all([
      getPopularTVMazeShows(),
      getTopRatedTVMazeShows(),
    ]);
  }

  const paginationParams: Record<string, string | undefined> = {};
  if (q) paginationParams.q = q;
  if (browse?.mode === 'discover') {
    if (genreId !== undefined) paginationParams.g = String(genreId);
    if (year !== undefined) paginationParams.year = String(year);
    if (lang) paginationParams.lang = lang;
    if (origin) paginationParams.origin = origin;
    if (rating !== undefined) paginationParams.rating = String(rating);
    if (votes !== undefined) paginationParams.votes = String(votes);
    if (runtimeRaw) paginationParams.runtime = runtimeRaw;
    paginationParams.sort = sort;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl font-bold text-white sm:mb-4 sm:text-4xl">Movies</h1>
          <p className="mb-8 max-w-2xl text-base text-zinc-400 sm:mb-10 sm:text-lg">
            {tmdbAvailable
              ? 'Search directly or build a tighter discovery set with catalog, score, language, and runtime filters.'
              : 'TMDB API key not configured. Add NEXT_PUBLIC_TMDB_API_KEY to unlock browse and filters. Showing TV from TVMaze below.'}
          </p>

          {tmdbAvailable && browse && (
            <>
              <BrowseExploreBar
                key={JSON.stringify({
                  q: q || '',
                  g: genreId ?? '',
                  sort,
                  year: year ?? '',
                  lang: lang ?? '',
                  origin: origin ?? '',
                  rating: rating ?? '',
                  votes: votes ?? '',
                  runtime: runtimeRaw ?? '',
                })}
                basePath="/movies"
                variant="movie"
                genres={genres}
                current={{
                  q: q || undefined,
                  g: genreId !== undefined ? String(genreId) : undefined,
                  sort,
                  year: year !== undefined ? String(year) : undefined,
                  lang,
                  origin,
                  rating: rating !== undefined ? String(rating) : undefined,
                  votes: votes !== undefined ? String(votes) : undefined,
                  runtime: runtimeRaw,
                }}
              />
              <BrowseMediaGrid
                title={q ? `Results for “${q}”` : 'Discover movies'}
                subtitle={
                  browse.totalResults > 0
                    ? `${browse.totalResults.toLocaleString()} titles · Page ${browse.page} of ${browse.totalPages}`
                    : undefined
                }
                items={browse.results}
                mediaType="movie"
                emptyMessage={
                  q
                    ? 'No movies matched your search. Try different keywords or clear the search box.'
                    : 'No movies match these filters. Try another genre or year.'
                }
              />
              <BrowsePagination
                basePath="/movies"
                page={browse.page}
                totalPages={browse.totalPages}
                params={paginationParams}
              />
            </>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {hasTmdbRows && (
            <>
              <MovieSectionClient title="Now Playing" movies={nowPlaying} mediaType="movie" />
              <MovieSectionClient title="Popular Worldwide" movies={popular} mediaType="movie" />
              <MovieSectionClient title="Top Rated" movies={topRated} mediaType="movie" />
              <MovieSectionClient title="Coming Soon" movies={upcoming} mediaType="movie" />
            </>
          )}

          {!hasTmdbRows && (
            <>
              {tvmazeFallback.length > 0 && (
                <MovieSectionClient title="Airing Today" movies={tvmazeFallback} mediaType="tv" />
              )}
              {tvmazeTopRated.length > 0 && (
                <MovieSectionClient title="Top Rated Shows" movies={tvmazeTopRated} mediaType="tv" />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
