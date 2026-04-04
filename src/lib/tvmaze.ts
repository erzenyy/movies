import { Movie, TVShow } from './types';
import { filterUniqueMedia } from './media';

const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

interface TVMazeShow {
  id: number;
  name: string;
  summary: string | null;
  image: { medium: string; original: string } | null;
  rating: { average: number | null };
  premiered: string | null;
  genres: string[];
  status: string;
  language: string;
  weight: number;
  externals: { thetvdb: number | null; imdb: string | null; tvrage: number | null };
}

interface TVMazeSearchResult {
  score: number;
  show: TVMazeShow;
}

const stripHtml = (html: string | null): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

// Convert TVMaze show to our TVShow type for unified rendering
const tvmazeToTVShow = (show: TVMazeShow): TVShow => ({
  id: show.id + 900000, // offset to avoid TMDB ID collisions
  name: show.name,
  overview: stripHtml(show.summary),
  poster_path: show.image?.medium || null,
  backdrop_path: show.image?.original || null,
  first_air_date: show.premiered || '',
  vote_average: show.rating?.average || 0,
  vote_count: 0,
  genre_ids: [],
  media_type: 'tv',
  _source: 'tvmaze',
  _tmdbId: null,
  _imdbId: show.externals?.imdb || null,
  _tvmazeId: show.id,
  _tvmazeImage: show.image?.medium || null,
});

// Search TVMaze
export const searchTVMaze = async (query: string): Promise<TVShow[]> => {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data: TVMazeSearchResult[] = await res.json();
    return data.map((r) => tvmazeToTVShow(r.show));
  } catch {
    return [];
  }
};

// Today's airing shows (great for "trending" / "popular")
export const getPopularTVMazeShows = async (): Promise<TVShow[]> => {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/schedule`);
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set<number>();
    const shows: TVShow[] = [];
    for (const entry of data) {
      if (entry._embedded?.show && !seen.has(entry._embedded.show.id)) {
        seen.add(entry._embedded.show.id);
        shows.push(tvmazeToTVShow(entry._embedded.show));
      }
    }
    return shows.slice(0, 20);
  } catch {
    return [];
  }
};

// Web schedule (streaming platforms like Netflix, etc.)
export const getStreamingTVMazeShows = async (): Promise<TVShow[]> => {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/schedule/web`);
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set<number>();
    const shows: TVShow[] = [];
    for (const entry of data) {
      if (entry._embedded?.show && !seen.has(entry._embedded.show.id)) {
        seen.add(entry._embedded.show.id);
        const show = tvmazeToTVShow(entry._embedded.show);
        if (show._tvmazeImage) shows.push(show); // only include shows with images
      }
    }
    return shows.slice(0, 20);
  } catch {
    return [];
  }
};

// Get top-rated shows by fetching a page of shows and sorting by rating
export const getTopRatedTVMazeShows = async (): Promise<TVShow[]> => {
  try {
    // Fetch a batch of shows (page 1 has popular established shows)
    const res = await fetch(`${TVMAZE_BASE_URL}/shows?page=0`);
    if (!res.ok) return [];
    const data: TVMazeShow[] = await res.json();
    const sorted = data
      .filter((s) => s.image?.medium && s.rating?.average && s.rating.average > 7)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 20);
    return sorted.map(tvmazeToTVShow);
  } catch {
    return [];
  }
};

// Get show details from TVMaze
export const getTVMazeShowDetails = async (tvmazeId: number): Promise<TVShow | null> => {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows/${tvmazeId}`);
    if (!res.ok) return null;
    const show: TVMazeShow = await res.json();
    return tvmazeToTVShow(show);
  } catch {
    return null;
  }
};

// Resolve a TVMaze-sourced item's IMDB ID to a TMDB ID via free Cinemeta API
export const resolveImdbToTmdbId = async (
  imdbId: string,
  type: 'movie' | 'tv'
): Promise<number | null> => {
  try {
    const cineType = type === 'tv' ? 'series' : 'movie';
    const res = await fetch(
      `https://v3-cinemeta.strem.io/meta/${cineType}/${imdbId}.json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Cinemeta stores moviedb_id for some entries
    if (data?.meta?.moviedb_id) {
      return Number(data.meta.moviedb_id);
    }
    return null;
  } catch {
    return null;
  }
};

// Check if a TVShow came from TVMaze
export const isTVMazeItem = (item: Movie | TVShow): boolean => {
  return item._source === 'tvmaze';
};

// Deduplicate TVMaze shows against TMDB results by name
export const deduplicateTVMaze = (
  tvmazeShows: TVShow[],
  tmdbItems: (Movie | TVShow)[]
): TVShow[] => {
  return filterUniqueMedia(tvmazeShows, tmdbItems, 'tv');
};
