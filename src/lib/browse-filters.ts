import { buildBrowseQuery } from './browse-url';

export type BrowseVariant = 'movie' | 'tv';

export type BrowseCurrent = {
  q?: string;
  g?: string;
  sort?: string;
  year?: string;
  lang?: string;
  origin?: string;
  rating?: string;
  votes?: string;
  runtime?: string;
};

export type NormalizedBrowseCurrent = {
  q: string;
  g: string;
  sort: string;
  year: string;
  lang: string;
  origin: string;
  rating: string;
  votes: string;
  runtime: string;
};

type Option = {
  value: string;
  label: string;
};

type RuntimeRange = {
  gte?: number;
  lte?: number;
};

type QuickFilter = {
  label: string;
  values: Partial<Required<BrowseCurrent>>;
};

const MOVIE_SORT_OPTIONS: Option[] = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_count.desc', label: 'Most Discussed' },
  { value: 'primary_release_date.desc', label: 'Newest Releases' },
  { value: 'primary_release_date.asc', label: 'Oldest Releases' },
  { value: 'revenue.desc', label: 'Biggest Box Office' },
  { value: 'title.asc', label: 'Title A-Z' },
];

const TV_SORT_OPTIONS: Option[] = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_count.desc', label: 'Most Discussed' },
  { value: 'first_air_date.desc', label: 'Newest Seasons' },
  { value: 'first_air_date.asc', label: 'Oldest Series' },
  { value: 'name.asc', label: 'Title A-Z' },
];

const LANGUAGE_OPTIONS: Option[] = [
  { value: '', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turkish' },
  { value: 'sv', label: 'Swedish' },
];

const ORIGIN_OPTIONS: Option[] = [
  { value: '', label: 'All Origins' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'DE', label: 'Germany' },
  { value: 'IT', label: 'Italy' },
  { value: 'TR', label: 'Turkey' },
  { value: 'MX', label: 'Mexico' },
];

const RATING_OPTIONS: Option[] = [
  { value: '', label: 'Any Score' },
  { value: '6', label: '6.0+' },
  { value: '6.5', label: '6.5+' },
  { value: '7', label: '7.0+' },
  { value: '7.5', label: '7.5+' },
  { value: '8', label: '8.0+' },
];

const VOTE_OPTIONS: Option[] = [
  { value: '', label: 'Any Audience Size' },
  { value: '50', label: '50+ Votes' },
  { value: '150', label: '150+ Votes' },
  { value: '500', label: '500+ Votes' },
  { value: '1000', label: '1k+ Votes' },
  { value: '5000', label: '5k+ Votes' },
];

const MOVIE_RUNTIME_OPTIONS: Option[] = [
  { value: '', label: 'Any Runtime' },
  { value: 'swift', label: 'Under 95m' },
  { value: 'feature', label: '95-119m' },
  { value: 'long', label: '120-149m' },
  { value: 'epic', label: '150m+' },
];

const TV_RUNTIME_OPTIONS: Option[] = [
  { value: '', label: 'Any Episode Length' },
  { value: 'swift', label: 'Under 25m' },
  { value: 'standard', label: '25-44m' },
  { value: 'hour', label: '45-64m' },
  { value: 'extended', label: '65m+' },
];

const MOVIE_RUNTIME_RANGES: Record<string, RuntimeRange> = {
  swift: { lte: 94 },
  feature: { gte: 95, lte: 119 },
  long: { gte: 120, lte: 149 },
  epic: { gte: 150 },
};

const TV_RUNTIME_RANGES: Record<string, RuntimeRange> = {
  swift: { lte: 24 },
  standard: { gte: 25, lte: 44 },
  hour: { gte: 45, lte: 64 },
  extended: { gte: 65 },
};

const CURRENT_YEAR = new Date().getFullYear();

const MOVIE_QUICK_FILTERS: QuickFilter[] = [
  {
    label: 'Crowd Favorites',
    values: { sort: 'popularity.desc', rating: '6.5', votes: '1000' },
  },
  {
    label: 'Prestige Picks',
    values: { sort: 'vote_average.desc', rating: '7.5', votes: '5000' },
  },
  {
    label: 'Fresh Releases',
    values: { sort: 'primary_release_date.desc', year: String(CURRENT_YEAR), votes: '100' },
  },
  {
    label: 'Hidden Gems',
    values: { sort: 'vote_average.desc', rating: '7', votes: '150' },
  },
  {
    label: 'Epic Nights',
    values: { sort: 'vote_average.desc', runtime: 'epic', rating: '6.5', votes: '500' },
  },
];

const TV_QUICK_FILTERS: QuickFilter[] = [
  {
    label: 'Binge Starters',
    values: { sort: 'popularity.desc', rating: '7', votes: '300' },
  },
  {
    label: 'Prestige Series',
    values: { sort: 'vote_average.desc', rating: '8', votes: '1000' },
  },
  {
    label: 'Fresh Seasons',
    values: { sort: 'first_air_date.desc', year: String(CURRENT_YEAR), votes: '80' },
  },
  {
    label: 'Quick Episodes',
    values: { sort: 'vote_average.desc', runtime: 'swift', rating: '7', votes: '150' },
  },
  {
    label: 'Long-Form Drama',
    values: { sort: 'vote_average.desc', runtime: 'hour', rating: '7.5', votes: '500' },
  },
];

export const DEFAULT_SORT: Record<BrowseVariant, string> = {
  movie: 'popularity.desc',
  tv: 'popularity.desc',
};

export const getSortOptions = (variant: BrowseVariant): Option[] =>
  variant === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;

export const getRuntimeOptions = (variant: BrowseVariant): Option[] =>
  variant === 'movie' ? MOVIE_RUNTIME_OPTIONS : TV_RUNTIME_OPTIONS;

export const getRuntimeRange = (
  variant: BrowseVariant,
  runtime: string | undefined
): RuntimeRange | undefined => {
  if (!runtime) return undefined;
  const ranges = variant === 'movie' ? MOVIE_RUNTIME_RANGES : TV_RUNTIME_RANGES;
  return ranges[runtime];
};

export const getLanguageOptions = (): Option[] => LANGUAGE_OPTIONS;

export const getOriginOptions = (): Option[] => ORIGIN_OPTIONS;

export const getRatingOptions = (): Option[] => RATING_OPTIONS;

export const getVoteOptions = (): Option[] => VOTE_OPTIONS;

export const normalizeBrowseCurrent = (
  current: BrowseCurrent | undefined,
  variant: BrowseVariant
): NormalizedBrowseCurrent => ({
  q: current?.q ?? '',
  g: current?.g ?? '',
  sort: current?.sort ?? DEFAULT_SORT[variant],
  year: current?.year ?? '',
  lang: current?.lang ?? '',
  origin: current?.origin ?? '',
  rating: current?.rating ?? '',
  votes: current?.votes ?? '',
  runtime: current?.runtime ?? '',
});

export const isValidSort = (variant: BrowseVariant, value: string | undefined): boolean => {
  if (!value) return false;
  return getSortOptions(variant).some((option) => option.value === value);
};

export const getQuickFilterLinks = (
  basePath: '/movies' | '/tv-shows',
  variant: BrowseVariant
) =>
  (variant === 'movie' ? MOVIE_QUICK_FILTERS : TV_QUICK_FILTERS).map((filter) => ({
    label: filter.label,
    href: `${basePath}${buildBrowseQuery(filter.values)}`,
  }));
