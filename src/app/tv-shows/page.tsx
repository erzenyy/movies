import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import { getPopularTVShows, getTrendingTVShows, isApiKeyConfigured } from '@/lib/tmdb';
import { getPopularTVMazeShows, getStreamingTVMazeShows, getTopRatedTVMazeShows, deduplicateTVMaze } from '@/lib/tvmaze';

export default async function TVShowsPage() {
  const tmdbAvailable = isApiKeyConfigured();

  const [tvmazeAiring, tvmazeStreaming, tvmazeTopRated] = await Promise.all([
    getPopularTVMazeShows(),
    getStreamingTVMazeShows(),
    getTopRatedTVMazeShows(),
  ]);

  let popular: Awaited<ReturnType<typeof getPopularTVShows>> = [];
  let trending: typeof popular = [];

  if (tmdbAvailable) {
    [popular, trending] = await Promise.all([
      getPopularTVShows(),
      getTrendingTVShows(),
    ]);
  }

  const hasTmdb = popular.length > 0 || trending.length > 0;

  const allTmdb = [...popular, ...trending];
  const dedupedAiring = deduplicateTVMaze(tvmazeAiring, allTmdb);
  const dedupedStreaming = deduplicateTVMaze(tvmazeStreaming, allTmdb);
  const dedupedTopRated = deduplicateTVMaze(tvmazeTopRated, allTmdb);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">TV Shows</h1>
          <p className="text-zinc-400 text-lg">
            Stream your favorite TV series and discover new shows
          </p>
        </div>

        <div className="space-y-4">
          {hasTmdb && (
            <>
              <MovieSectionClient title="Popular TV Shows" movies={popular} mediaType="tv" />
              <MovieSectionClient title="Trending TV" movies={trending} mediaType="tv" />
            </>
          )}

          {dedupedAiring.length > 0 && (
            <MovieSectionClient title={hasTmdb ? 'Airing Today (TVMaze)' : 'Airing Today'} movies={dedupedAiring} mediaType="tv" />
          )}
          {dedupedStreaming.length > 0 && (
            <MovieSectionClient title={hasTmdb ? 'Streaming Now (TVMaze)' : 'Streaming Now'} movies={dedupedStreaming} mediaType="tv" />
          )}
          {dedupedTopRated.length > 0 && (
            <MovieSectionClient title={hasTmdb ? 'Top Rated (TVMaze)' : 'Top Rated Shows'} movies={dedupedTopRated} mediaType="tv" />
          )}
        </div>
      </main>
    </div>
  );
}
