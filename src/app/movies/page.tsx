import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import { getPopularMovies, getTopRatedMovies, getNowPlaying, getUpcomingMovies, isApiKeyConfigured } from '@/lib/tmdb';
import { getPopularTVMazeShows, getTopRatedTVMazeShows } from '@/lib/tvmaze';

export default async function MoviesPage() {
  const tmdbAvailable = isApiKeyConfigured();

  let nowPlaying: Awaited<ReturnType<typeof getNowPlaying>> = [];
  let popular: typeof nowPlaying = [];
  let topRated: typeof nowPlaying = [];
  let upcoming: typeof nowPlaying = [];

  if (tmdbAvailable) {
    [nowPlaying, popular, topRated, upcoming] = await Promise.all([
      getNowPlaying(),
      getPopularMovies(),
      getTopRatedMovies(),
      getUpcomingMovies(),
    ]);
  }

  const hasTmdb = nowPlaying.length > 0 || popular.length > 0;

  // If no TMDB, show TVMaze TV content as fallback
  let tvmazeFallback: Awaited<ReturnType<typeof getPopularTVMazeShows>> = [];
  let tvmazeTopRated: typeof tvmazeFallback = [];
  if (!hasTmdb) {
    [tvmazeFallback, tvmazeTopRated] = await Promise.all([
      getPopularTVMazeShows(),
      getTopRatedTVMazeShows(),
    ]);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Movies</h1>
          <p className="text-zinc-400 text-lg">
            {hasTmdb
              ? 'Discover the latest and greatest movies from around the world'
              : 'TMDB API key not configured. Showing TV shows from TVMaze instead.'}
          </p>
        </div>

        <div className="space-y-4">
          {hasTmdb ? (
            <>
              <MovieSectionClient title="Now Playing" movies={nowPlaying} mediaType="movie" />
              <MovieSectionClient title="Popular Movies" movies={popular} mediaType="movie" />
              <MovieSectionClient title="Top Rated" movies={topRated} mediaType="movie" />
              <MovieSectionClient title="Coming Soon" movies={upcoming} mediaType="movie" />
            </>
          ) : (
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
