export type MediaType = 'movie' | 'tv';
export type MediaSource = 'tmdb' | 'tvmaze';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: MediaType;
  original_language?: string;
  _source?: MediaSource;
  _tmdbId?: number | null;
  _imdbId?: string | null;
  _tvmazeId?: number | null;
  _tvmazeImage?: string | null;
  _matchConfidence?: number | null;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: MediaType;
  original_language?: string;
  origin_country?: string[];
  _source?: MediaSource;
  _tmdbId?: number | null;
  _imdbId?: string | null;
  _tvmazeId?: number | null;
  _tvmazeImage?: string | null;
  _matchConfidence?: number | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface CreditPerson {
  id: number;
  name: string;
  character?: string;
  job?: string;
  department?: string;
}

/** TMDB `belongs_to_collection` on movie details (e.g. Harry Potter series). */
export interface BelongsToCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  homepage: string | null;
  imdb_id: string | null;
  belongs_to_collection?: BelongsToCollection | null;
  credits?: {
    cast?: CreditPerson[];
    crew?: CreditPerson[];
  };
  keywords?: {
    keywords?: Keyword[];
  };
}

export interface TVShowDetails extends TVShow {
  genres: Genre[];
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  status: string;
  tagline: string;
  homepage: string | null;
  aggregate_credits?: {
    cast?: CreditPerson[];
    crew?: CreditPerson[];
  };
  keywords?: {
    results?: Keyword[];
  };
}

export interface VideoPlayerProps {
  tmdbId: string;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  color?: string;
  autoPlay?: boolean;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  progress?: number;
}
