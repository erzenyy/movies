import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import { getTrendingMovies, getTrendingTVShows, isApiKeyConfigured } from '@/lib/tmdb';
import { getPopularTVMazeShows, getStreamingTVMazeShows, deduplicateTVMaze } from '@/lib/tvmaze';

export default async function TrendingPage() {
  const tmdbAvailable = isApiKeyConfigured();

  const [tvmazeAiring, tvmazeStreaming] = await Promise.all([
    getPopularTVMazeShows(),
    getStreamingTVMazeShows(),
  ]);

  let movies: Awaited<ReturnType<typeof getTrendingMovies>> = [];
  let tvShows: Awaited<ReturnType<typeof getTrendingTVShows>> = [];

  if (tmdbAvailable) {
    [movies, tvShows] = await Promise.all([
      getTrendingMovies(),
      getTrendingTVShows(),
    ]);
  }

  const hasTmdb = movies.length > 0 || tvShows.length > 0;

  const allTmdb = [...movies, ...tvShows];
  const dedupedAiring = deduplicateTVMaze(tvmazeAiring, allTmdb);
  const dedupedStreaming = deduplicateTVMaze(tvmazeStreaming, allTmdb);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Trending</h1>
          <p className="text-zinc-400 text-lg">
            See what everyone is watching right now
          </p>
        </div>

        <div className="space-y-4">
          {hasTmdb && (
            <>
              <MovieSectionClient title="Trending Movies" movies={movies} mediaType="movie" />
              <MovieSectionClient title="Trending TV Shows" movies={tvShows} mediaType="tv" />
            </>
          )}

          {dedupedAiring.length > 0 && (
            <MovieSectionClient title={hasTmdb ? 'Airing Now (TVMaze)' : 'Airing Now'} movies={dedupedAiring} mediaType="tv" />
          )}
          {dedupedStreaming.length > 0 && (
            <MovieSectionClient title={hasTmdb ? 'Streaming Now (TVMaze)' : 'Streaming Now'} movies={dedupedStreaming} mediaType="tv" />
          )}
        </div>
      </main>
    </div>
  );
}
