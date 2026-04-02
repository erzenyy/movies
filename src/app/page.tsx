import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { MovieSectionClient } from '@/components/movie-section-client';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies, getNowPlaying, getUpcomingMovies, getPopularTVShows, getTrendingTVShows, isApiKeyConfigured } from '@/lib/tmdb';
import { getPopularTVMazeShows, getStreamingTVMazeShows, getTopRatedTVMazeShows, deduplicateTVMaze } from '@/lib/tvmaze';

export default async function Home() {
  const tmdbAvailable = isApiKeyConfigured();

  // Always fetch TVMaze (free, no key)
  const [tvmazeAiring, tvmazeStreaming, tvmazeTopRated] = await Promise.all([
    getPopularTVMazeShows(),
    getStreamingTVMazeShows(),
    getTopRatedTVMazeShows(),
  ]);

  // Fetch TMDB only if key is available
  let trending: Awaited<ReturnType<typeof getTrendingMovies>> = [];
  let popular: typeof trending = [];
  let topRated: typeof trending = [];
  let nowPlaying: typeof trending = [];
  let upcoming: typeof trending = [];
  let popularTV: Awaited<ReturnType<typeof getPopularTVShows>> = [];
  let trendingTV: typeof popularTV = [];

  if (tmdbAvailable) {
    [trending, popular, topRated, nowPlaying, upcoming, popularTV, trendingTV] =
      await Promise.all([
        getTrendingMovies(),
        getPopularMovies(),
        getTopRatedMovies(),
        getNowPlaying(),
        getUpcomingMovies(),
        getPopularTVShows(),
        getTrendingTVShows(),
      ]);
  }

  // Check if TMDB actually returned data (key might be invalid)
  const hasTmdb = trending.length > 0 || popular.length > 0;

  // Deduplicate TVMaze shows against all TMDB results
  const allTmdb = [...trending, ...popular, ...topRated, ...nowPlaying, ...upcoming, ...popularTV, ...trendingTV];
  const dedupedAiring = deduplicateTVMaze(tvmazeAiring, allTmdb);
  const dedupedStreaming = deduplicateTVMaze(tvmazeStreaming, allTmdb);
  const dedupedTopRated = deduplicateTVMaze(tvmazeTopRated, allTmdb);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      
      <main>
        <Suspense fallback={<div className="h-[70vh] bg-zinc-950" />}>
          <Hero />
        </Suspense>

        <div className="space-y-4 -mt-20 relative z-10">
          {/* TMDB sections - shown when TMDB works */}
          {hasTmdb && (
            <>
              <MovieSectionClient title="Trending Now" movies={trending} mediaType="movie" />
              <MovieSectionClient title="Popular Movies" movies={popular} mediaType="movie" />
              <MovieSectionClient title="Top Rated" movies={topRated} mediaType="movie" />
              <MovieSectionClient title="Now Playing" movies={nowPlaying} mediaType="movie" />
              <MovieSectionClient title="Popular TV Shows" movies={popularTV} mediaType="tv" />
              <MovieSectionClient title="Trending TV" movies={trendingTV} mediaType="tv" />
              <MovieSectionClient title="Coming Soon" movies={upcoming} mediaType="movie" />
            </>
          )}

          {/* TVMaze sections - always shown, labeled as primary source when TMDB is down */}
          {dedupedAiring.length > 0 && (
            <MovieSectionClient
              title={hasTmdb ? 'Airing Today (TVMaze)' : 'Airing Today'}
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
          {dedupedTopRated.length > 0 && (
            <MovieSectionClient
              title={hasTmdb ? 'Top Rated Shows (TVMaze)' : 'Top Rated Shows'}
              movies={dedupedTopRated}
              mediaType="tv"
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                Movie<span className="text-red-500">Flix</span>
              </span>
            </div>
            <p className="text-zinc-500 text-sm">
              Powered by TMDB, TVMaze & Vidking Player. Built with Next.js.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
