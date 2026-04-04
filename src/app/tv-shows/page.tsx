import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import { BrowseExploreBar } from '@/components/browse-explore-bar';
import { BrowseMediaGrid } from '@/components/browse-media-grid';
import { BrowsePagination } from '@/components/browse-pagination';
import {
  isApiKeyConfigured,
  getTVGenres,
  discoverTVShows,
  searchTVShowsPaged,
  fetchTVFromEndpoint,
} from '@/lib/tmdb';
import { getPopularTVMazeShows, getStreamingTVMazeShows, getTopRatedTVMazeShows, deduplicateTVMaze } from '@/lib/tvmaze';

function firstString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function TVShowsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (firstString(sp.q) ?? '').trim();
  const page = Math.max(1, parseInt(firstString(sp.page) ?? '1', 10) || 1);
  const sort = firstString(sp.sort) ?? 'popularity.desc';
  const gRaw = firstString(sp.g);
  const yearRaw = firstString(sp.year);
  const genreId = gRaw && /^\d+$/.test(gRaw) ? parseInt(gRaw, 10) : undefined;
  const year = yearRaw && /^\d{4}$/.test(yearRaw) ? parseInt(yearRaw, 10) : undefined;

  const tmdbAvailable = isApiKeyConfigured();
  const genres = tmdbAvailable ? await getTVGenres() : [];

  let browse: {
    results: Awaited<ReturnType<typeof discoverTVShows>>['results'];
    page: number;
    totalPages: number;
    totalResults: number;
    mode: 'search' | 'discover';
  } | null = null;

  if (tmdbAvailable) {
    if (q.length > 0) {
      const r = await searchTVShowsPaged(q, page);
      browse = { ...r, mode: 'search' };
    } else {
      const r = await discoverTVShows({
        page,
        sortBy: sort,
        genreId: genreId !== undefined && Number.isFinite(genreId) ? genreId : undefined,
        year: year !== undefined && Number.isFinite(year) ? year : undefined,
      });
      browse = { ...r, mode: 'discover' };
    }
  }

  const [popular, trending, topRated, onTheAir] = tmdbAvailable
    ? await Promise.all([
        fetchTVFromEndpoint('/tv/popular', [1, 2, 3]),
        fetchTVFromEndpoint('/trending/tv/week', [1, 2, 3]),
        fetchTVFromEndpoint('/tv/top_rated', [1, 2, 3]),
        fetchTVFromEndpoint('/tv/on_the_air', [1, 2]),
      ])
    : [[], [], [], []];

  const [tvmazeAiring, tvmazeStreaming, tvmazeTopRated] = await Promise.all([
    getPopularTVMazeShows(),
    getStreamingTVMazeShows(),
    getTopRatedTVMazeShows(),
  ]);

  const hasTmdbRows = popular.length > 0 || trending.length > 0;
  const allTmdb = [...popular, ...trending, ...topRated, ...onTheAir];
  const dedupedAiring = deduplicateTVMaze(tvmazeAiring, allTmdb);
  const dedupedStreaming = deduplicateTVMaze(tvmazeStreaming, allTmdb);
  const dedupedTopRated = deduplicateTVMaze(tvmazeTopRated, allTmdb);

  const paginationParams: Record<string, string | undefined> = {};
  if (q) paginationParams.q = q;
  if (browse?.mode === 'discover') {
    if (genreId !== undefined) paginationParams.g = String(genreId);
    if (year !== undefined) paginationParams.year = String(year);
    paginationParams.sort = sort;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl font-bold text-white sm:mb-4 sm:text-4xl">TV Shows</h1>
          <p className="mb-8 max-w-2xl text-base text-zinc-400 sm:mb-10 sm:text-lg">
            {tmdbAvailable
              ? 'Search and filter series from around the world, then scroll for popular, trending, and TVMaze picks.'
              : 'TMDB API key not configured. Browse filters require a key; TVMaze sections below still work.'}
          </p>

          {tmdbAvailable && browse && (
            <>
              <BrowseExploreBar
                basePath="/tv-shows"
                variant="tv"
                genres={genres}
                current={{
                  q: q || undefined,
                  g: genreId !== undefined ? String(genreId) : undefined,
                  sort,
                  year: year !== undefined ? String(year) : undefined,
                }}
              />
              <BrowseMediaGrid
                title={q ? `Results for “${q}”` : 'Discover TV shows'}
                subtitle={
                  browse.totalResults > 0
                    ? `${browse.totalResults.toLocaleString()} series · Page ${browse.page} of ${browse.totalPages}`
                    : undefined
                }
                items={browse.results}
                mediaType="tv"
                emptyMessage={
                  q
                    ? 'No shows matched your search. Try different keywords.'
                    : 'No shows match these filters. Try another genre or year.'
                }
              />
              <BrowsePagination
                basePath="/tv-shows"
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
              <MovieSectionClient title="Popular Worldwide" movies={popular} mediaType="tv" />
              <MovieSectionClient title="Trending This Week" movies={trending} mediaType="tv" />
              <MovieSectionClient title="Top Rated" movies={topRated} mediaType="tv" />
              <MovieSectionClient title="On the Air" movies={onTheAir} mediaType="tv" />
            </>
          )}

          {dedupedAiring.length > 0 && (
            <MovieSectionClient
              title={hasTmdbRows ? 'Airing Today (TVMaze)' : 'Airing Today'}
              movies={dedupedAiring}
              mediaType="tv"
            />
          )}
          {dedupedStreaming.length > 0 && (
            <MovieSectionClient
              title={hasTmdbRows ? 'Streaming Now (TVMaze)' : 'Streaming Now'}
              movies={dedupedStreaming}
              mediaType="tv"
            />
          )}
          {dedupedTopRated.length > 0 && (
            <MovieSectionClient
              title={hasTmdbRows ? 'Top Rated (TVMaze)' : 'Top Rated Shows'}
              movies={dedupedTopRated}
              mediaType="tv"
            />
          )}
        </div>
      </main>
    </div>
  );
}
