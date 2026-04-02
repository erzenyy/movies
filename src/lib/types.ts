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
  media_type?: 'movie' | 'tv';
  _source?: 'tmdb' | 'tvmaze';
  _imdbId?: string | null;
  _tvmazeImage?: string | null;
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
  media_type?: 'movie' | 'tv';
  _source?: 'tmdb' | 'tvmaze';
  _imdbId?: string | null;
  _tvmazeImage?: string | null;
}

export interface Genre {
  id: number;
  name: string;
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
}

export interface TVShowDetails extends TVShow {
  genres: Genre[];
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  status: string;
  tagline: string;
  homepage: string | null;
}

export interface VideoPlayerProps {
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  color?: string;
  autoPlay?: boolean;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  progress?: number;
}
