import { Movie, TVShow, MovieDetails, TVShowDetails } from './types';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Check if API key is configured
export const isApiKeyConfigured = () => {
  return TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here' && TMDB_API_KEY.length > 0;
};

export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE_URL}/original${path}`;
};

const fetchFromTMDB = async (endpoint: string, extraParams: string = '') => {
  if (!isApiKeyConfigured()) {
    console.warn('TMDB API key not configured. Please add NEXT_PUBLIC_TMDB_API_KEY to your .env file');
    return { results: [] };
  }
  
  const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US${extraParams}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 401) {
      console.error('TMDB API key is invalid or expired');
      return { results: [] };
    }
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  return response.json();
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/trending/movie/week');
  return data.results || [];
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/popular');
  return data.results || [];
};

export const getTopRatedMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/top_rated');
  return data.results || [];
};

export const getNowPlaying = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/now_playing');
  return data.results || [];
};

export const getUpcomingMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/upcoming');
  return data.results || [];
};

export const getPopularTVShows = async (): Promise<TVShow[]> => {
  const data = await fetchFromTMDB('/tv/popular');
  return data.results || [];
};

export const getTrendingTVShows = async (): Promise<TVShow[]> => {
  const data = await fetchFromTMDB('/trending/tv/week');
  return data.results || [];
};

export const getMovieDetails = async (id: number): Promise<MovieDetails> => {
  return fetchFromTMDB(`/movie/${id}`);
};

export const getTVShowDetails = async (id: number): Promise<TVShowDetails> => {
  return fetchFromTMDB(`/tv/${id}`);
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/search/movie`, `&query=${encodeURIComponent(query)}`);
  return data.results || [];
};

export const searchMulti = async (query: string): Promise<(Movie | TVShow)[]> => {
  const data = await fetchFromTMDB(`/search/multi`, `&query=${encodeURIComponent(query)}`);
  return data.results || [];
};

export const getSimilarMovies = async (id: number): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/movie/${id}/similar`);
  return data.results || [];
};

export const getGenres = async (): Promise<{ id: number; name: string }[]> => {
  const data = await fetchFromTMDB('/genre/movie/list');
  return data.genres || [];
};

// Find TMDB ID by IMDB ID (requires API key)
export const findByImdbId = async (imdbId: string, type: 'movie' | 'tv'): Promise<number | null> => {
  if (!isApiKeyConfigured()) return null;
  try {
    const data = await fetchFromTMDB(`/find/${imdbId}`, '&external_source=imdb_id');
    if (type === 'movie' && data.movie_results?.length > 0) {
      return data.movie_results[0].id;
    }
    if (type === 'tv' && data.tv_results?.length > 0) {
      return data.tv_results[0].id;
    }
    return null;
  } catch {
    return null;
  }
};

// Search TMDB by name to find TMDB ID (requires API key)
export const findTmdbIdByName = async (name: string, type: 'movie' | 'tv'): Promise<number | null> => {
  if (!isApiKeyConfigured()) return null;
  try {
    const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
    const data = await fetchFromTMDB(endpoint, `&query=${encodeURIComponent(name)}`);
    if (data.results?.length > 0) {
      return data.results[0].id;
    }
    return null;
  } catch {
    return null;
  }
};
