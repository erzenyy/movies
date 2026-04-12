import { Movie, TVShow, MovieDetails, TVShowDetails } from './types';
import { normalizeTitle } from './media';

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

const annotateTmdbResults = <T extends Movie | TVShow>(items: T[]): T[] =>
  items.map((item) => ({
    ...item,
    _source: 'tmdb',
    _tmdbId: item.id,
  }));

interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

const scoreTmdbSearchResult = (
  candidate: TmdbSearchResult,
  name: string,
  year?: number | null
): number => {
  const candidateTitle = candidate.title ?? candidate.name ?? '';
  const date = candidate.release_date ?? candidate.first_air_date ?? '';
  const parsedYear = Number(date.slice(0, 4));
  const candidateYear = Number.isFinite(parsedYear) ? parsedYear : null;

  const normalizedInput = normalizeTitle(name);
  const normalizedCandidate = normalizeTitle(candidateTitle);
  const yearDistance =
    year === null || year === undefined || candidateYear === null
      ? null
      : Math.abs(year - candidateYear);

  if (normalizedInput === normalizedCandidate) {
    if (yearDistance === 0) return 1;
    if (yearDistance !== null && yearDistance <= 1) return 0.94;
    if (yearDistance === null) return 0.9;
  }

  if (normalizedCandidate.includes(normalizedInput) || normalizedInput.includes(normalizedCandidate)) {
    if (yearDistance === 0) return 0.88;
    if (yearDistance === null || yearDistance <= 1) return 0.82;
  }

  return 0;
};

export const getTrendingMovies = async (timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/trending/movie/${timeWindow}`);
  return annotateTmdbResults(data.results || []);
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/popular');
  return annotateTmdbResults(data.results || []);
};

export const getTopRatedMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/top_rated');
  return annotateTmdbResults(data.results || []);
};

export const getNowPlaying = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/now_playing');
  return annotateTmdbResults(data.results || []);
};

export const getUpcomingMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB('/movie/upcoming');
  return annotateTmdbResults(data.results || []);
};

export const getPopularTVShows = async (): Promise<TVShow[]> => {
  const data = await fetchFromTMDB('/tv/popular');
  return annotateTmdbResults(data.results || []);
};

export const getTrendingTVShows = async (timeWindow: 'day' | 'week' = 'week'): Promise<TVShow[]> => {
  const data = await fetchFromTMDB(`/trending/tv/${timeWindow}`);
  return annotateTmdbResults(data.results || []);
};

export const getMovieDetails = async (id: number): Promise<MovieDetails> => {
  return fetchFromTMDB(`/movie/${id}`, '&append_to_response=credits,keywords');
};

export const getTVShowDetails = async (id: number): Promise<TVShowDetails> => {
  return fetchFromTMDB(`/tv/${id}`, '&append_to_response=aggregate_credits,keywords');
};

export type PagedList<T> = {
  results: T[];
  page: number;
  totalPages: number;
  totalResults: number;
};

function mergePagedRaw<T extends { id: number }>(
  datas: { results: T[] }[],
  annotate: (items: T[]) => T[]
): T[] {
  const seen = new Set<number>();
  const raw: T[] = [];
  for (const data of datas) {
    for (const item of data.results || []) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        raw.push(item);
      }
    }
  }
  return annotate(raw as T[]);
}

/** Multiple TMDB pages merged into one list (deduped by id). */
export async function fetchMoviesFromEndpoint(
  endpoint: string,
  pages: number[] = [1, 2, 3]
): Promise<Movie[]> {
  if (!isApiKeyConfigured()) return [];
  const datas = await Promise.all(pages.map((p) => fetchFromTMDB(endpoint, `&page=${p}`)));
  return mergePagedRaw(datas, annotateTmdbResults);
}

export async function fetchTVFromEndpoint(
  endpoint: string,
  pages: number[] = [1, 2, 3]
): Promise<TVShow[]> {
  if (!isApiKeyConfigured()) return [];
  const datas = await Promise.all(pages.map((p) => fetchFromTMDB(endpoint, `&page=${p}`)));
  return mergePagedRaw(datas, annotateTmdbResults);
}

export const searchMoviesPaged = async (query: string, page = 1): Promise<PagedList<Movie>> => {
  if (!isApiKeyConfigured()) {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }
  const data = await fetchFromTMDB(`/search/movie`, `&query=${encodeURIComponent(query)}&page=${page}`);
  return {
    results: annotateTmdbResults(data.results || []),
    page: data.page ?? page,
    totalPages: Math.max(1, data.total_pages ?? 1),
    totalResults: data.total_results ?? 0,
  };
};

export const searchTVShowsPaged = async (query: string, page = 1): Promise<PagedList<TVShow>> => {
  if (!isApiKeyConfigured()) {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }
  const data = await fetchFromTMDB(`/search/tv`, `&query=${encodeURIComponent(query)}&page=${page}`);
  return {
    results: annotateTmdbResults(data.results || []),
    page: data.page ?? page,
    totalPages: Math.max(1, data.total_pages ?? 1),
    totalResults: data.total_results ?? 0,
  };
};

/** First page only — convenience for callers that only need a flat list. */
export const searchMovies = async (query: string): Promise<Movie[]> => {
  const r = await searchMoviesPaged(query, 1);
  return r.results;
};

export const discoverMovies = async (opts: {
  page?: number;
  sortBy?: string;
  genreId?: number;
  year?: number;
  originalLanguage?: string;
  originCountry?: string;
  minRating?: number;
  minVotes?: number;
  runtimeGte?: number;
  runtimeLte?: number;
  keywordId?: number;
  personId?: number;
}): Promise<PagedList<Movie>> => {
  if (!isApiKeyConfigured()) {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }
  const page = opts.page ?? 1;
  const sort = opts.sortBy ?? 'popularity.desc';
  let extra = `&page=${page}&sort_by=${encodeURIComponent(sort)}`;
  if (opts.genreId) extra += `&with_genres=${opts.genreId}`;
  if (opts.year) extra += `&primary_release_year=${opts.year}`;
  if (opts.originalLanguage) extra += `&with_original_language=${encodeURIComponent(opts.originalLanguage)}`;
  if (opts.originCountry) extra += `&with_origin_country=${encodeURIComponent(opts.originCountry)}`;
  if (opts.minRating !== undefined) extra += `&vote_average.gte=${opts.minRating}`;
  if (opts.minVotes !== undefined) extra += `&vote_count.gte=${opts.minVotes}`;
  else extra += '&vote_count.gte=40';
  if (opts.runtimeGte !== undefined) extra += `&with_runtime.gte=${opts.runtimeGte}`;
  if (opts.runtimeLte !== undefined) extra += `&with_runtime.lte=${opts.runtimeLte}`;
  if (opts.keywordId !== undefined) extra += `&with_keywords=${opts.keywordId}`;
  if (opts.personId !== undefined) extra += `&with_people=${opts.personId}`;
  const data = await fetchFromTMDB('/discover/movie', extra);
  return {
    results: annotateTmdbResults(data.results || []),
    page: data.page ?? page,
    totalPages: Math.max(1, data.total_pages ?? 1),
    totalResults: data.total_results ?? 0,
  };
};

export const discoverTVShows = async (opts: {
  page?: number;
  sortBy?: string;
  genreId?: number;
  year?: number;
  originalLanguage?: string;
  originCountry?: string;
  minRating?: number;
  minVotes?: number;
  runtimeGte?: number;
  runtimeLte?: number;
  keywordId?: number;
  personId?: number;
}): Promise<PagedList<TVShow>> => {
  if (!isApiKeyConfigured()) {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }
  const page = opts.page ?? 1;
  const sort = opts.sortBy ?? 'popularity.desc';
  let extra = `&page=${page}&sort_by=${encodeURIComponent(sort)}`;
  if (opts.genreId) extra += `&with_genres=${opts.genreId}`;
  if (opts.year) extra += `&first_air_date_year=${opts.year}`;
  if (opts.originalLanguage) extra += `&with_original_language=${encodeURIComponent(opts.originalLanguage)}`;
  if (opts.originCountry) extra += `&with_origin_country=${encodeURIComponent(opts.originCountry)}`;
  if (opts.minRating !== undefined) extra += `&vote_average.gte=${opts.minRating}`;
  if (opts.minVotes !== undefined) extra += `&vote_count.gte=${opts.minVotes}`;
  else extra += '&vote_count.gte=25';
  if (opts.runtimeGte !== undefined) extra += `&with_runtime.gte=${opts.runtimeGte}`;
  if (opts.runtimeLte !== undefined) extra += `&with_runtime.lte=${opts.runtimeLte}`;
  if (opts.keywordId !== undefined) extra += `&with_keywords=${opts.keywordId}`;
  if (opts.personId !== undefined) extra += `&with_people=${opts.personId}`;
  const data = await fetchFromTMDB('/discover/tv', extra);
  return {
    results: annotateTmdbResults(data.results || []),
    page: data.page ?? page,
    totalPages: Math.max(1, data.total_pages ?? 1),
    totalResults: data.total_results ?? 0,
  };
};

export const searchMulti = async (query: string): Promise<(Movie | TVShow)[]> => {
  const data = await fetchFromTMDB(`/search/multi`, `&query=${encodeURIComponent(query)}`);
  return annotateTmdbResults(
    (data.results || []).filter(
      (item: Movie | TVShow) => item.media_type === 'movie' || item.media_type === 'tv'
    )
  );
};

export const getSimilarMovies = async (id: number): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/movie/${id}/similar`);
  return annotateTmdbResults(data.results || []);
};

/** Other films in the same TMDB collection (franchise), e.g. Harry Potter sequels. */
export const getMovieCollectionParts = async (
  collectionId: number
): Promise<{ name: string; parts: Movie[] } | null> => {
  if (!isApiKeyConfigured()) return null;
  try {
    const data = await fetchFromTMDB(`/collection/${collectionId}`);
    const raw = data?.parts;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const parts = annotateTmdbResults(raw);
    parts.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
    return { name: typeof data.name === 'string' ? data.name : 'Collection', parts };
  } catch {
    return null;
  }
};

export const getGenres = async (): Promise<{ id: number; name: string }[]> => {
  const data = await fetchFromTMDB('/genre/movie/list');
  return data.genres || [];
};

export const getTVGenres = async (): Promise<{ id: number; name: string }[]> => {
  const data = await fetchFromTMDB('/genre/tv/list');
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
export const findTmdbIdByName = async (
  name: string,
  type: 'movie' | 'tv',
  options?: { year?: number | null }
): Promise<number | null> => {
  if (!isApiKeyConfigured()) return null;
  try {
    const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
    const year = options?.year ?? null;
    const yearParam =
      year === null
        ? ''
        : type === 'movie'
          ? `&year=${year}`
          : `&first_air_date_year=${year}`;

    const searches = yearParam
      ? await Promise.all([
          fetchFromTMDB(endpoint, `&query=${encodeURIComponent(name)}${yearParam}`),
          fetchFromTMDB(endpoint, `&query=${encodeURIComponent(name)}`),
        ])
      : [await fetchFromTMDB(endpoint, `&query=${encodeURIComponent(name)}`)];

    const candidates = searches.flatMap((result) => result.results || []);
    if (candidates.length === 0) return null;

    let bestCandidate: TmdbSearchResult | null = null;
    let bestScore = 0;

    for (const candidate of candidates as TmdbSearchResult[]) {
      const score = scoreTmdbSearchResult(candidate, name, year);
      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }

    if (bestCandidate && bestScore >= 0.82) {
      return bestCandidate.id;
    }

    return null;
  } catch {
    return null;
  }
};
