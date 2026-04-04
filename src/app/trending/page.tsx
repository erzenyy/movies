import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import {
  getTrendingMovies,
  getTrendingTVShows,
  fetchMoviesFromEndpoint,
  fetchTVFromEndpoint,
  isApiKeyConfigured,
} from '@/lib/tmdb';
import { getPopularTVMazeShows, getStreamingTVMazeShows, deduplicateTVMaze } from '@/lib/tvmaze';

export default async function TrendingPage() {
  const tmdbAvailable = isApiKeyConfigured();

  const [tvmazeAiring, tvmazeStreaming] = await Promise.all([
    getPopularTVMazeShows(),
    getStreamingTVMazeShows(),
  ]);

  let moviesWeek: Awaited<ReturnType<typeof getTrendingMovies>> = [];
  let moviesDay: typeof moviesWeek = [];
  let tvWeek: Awaited<ReturnType<typeof getTrendingTVShows>> = [];
  let tvDay: typeof tvWeek = [];
  let popularMovies: typeof moviesWeek = [];
  let popularTV: typeof tvWeek = [];

  if (tmdbAvailable) {
    [
      moviesWeek,
      moviesDay,
      tvWeek,
      tvDay,
      popularMovies,
      popularTV,
    ] = await Promise.all([
      getTrendingMovies('week'),
      getTrendingMovies('day'),
      getTrendingTVShows('week'),
      getTrendingTVShows('day'),
      fetchMoviesFromEndpoint('/movie/popular', [1, 2]),
      fetchTVFromEndpoint('/tv/popular', [1, 2]),
    ]);
  }

  const hasTmdb = moviesWeek.length > 0 || tvWeek.length > 0 || popularMovies.length > 0;

  const allTmdb = [...moviesWeek, ...moviesDay, ...tvWeek, ...tvDay, ...popularMovies, ...popularTV];
  const dedupedAiring = deduplicateTVMaze(tvmazeAiring, allTmdb);
  const dedupedStreaming = deduplicateTVMaze(tvmazeStreaming, allTmdb);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-24">
        <div className="mx-auto mb-8 max-w-7xl px-4 sm:mb-12 sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl font-bold text-white sm:mb-4 sm:text-4xl">Trending</h1>
          <p className="max-w-2xl text-base text-zinc-400 sm:text-lg">
            Today and this week on TMDB, plus popular picks—see what people are watching worldwide.
          </p>
        </div>

        <div className="space-y-4">
          {hasTmdb && (
            <>
              <MovieSectionClient title="Movies · Trending Today" movies={moviesDay} mediaType="movie" />
              <MovieSectionClient title="Movies · Trending This Week" movies={moviesWeek} mediaType="movie" />
              <MovieSectionClient title="TV · Trending Today" movies={tvDay} mediaType="tv" />
              <MovieSectionClient title="TV · Trending This Week" movies={tvWeek} mediaType="tv" />
              <MovieSectionClient title="Popular Movies Right Now" movies={popularMovies} mediaType="movie" />
              <MovieSectionClient title="Popular TV Right Now" movies={popularTV} mediaType="tv" />
            </>
          )}

          {dedupedAiring.length > 0 && (
            <MovieSectionClient
              title={hasTmdb ? 'Airing Now (TVMaze)' : 'Airing Now'}
              movies={dedupedAiring}
              mediaType="tv"
            />
          )}
          {dedupedStreaming.length > 0 && (
            <MovieSectionClient
              title={hasTmdb ? 'Streaming Now (TVMaze)' : 'Streaming Now'}
              movies={dedupedStreaming}
              mediaType="tv"
            />
          )}
        </div>
      </main>
    </div>
  );
}
