import { Movie, TVShow, MediaType } from './types';

export type MediaItem = Movie | TVShow;

const STOP_WORDS = new Set(['a', 'an', 'the']);
const MATCH_THRESHOLD = 0.8;

export const getMediaTitle = (item: MediaItem): string =>
  'title' in item ? item.title : item.name;

export const getMediaDate = (item: MediaItem): string =>
  'release_date' in item ? item.release_date : item.first_air_date;

export const getMediaYear = (item: MediaItem): number | null => {
  const date = getMediaDate(item);
  if (!date) return null;

  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
};

export const normalizeTitle = (title: string): string =>
  title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const getComparableTitle = (title: string): string =>
  normalizeTitle(title)
    .split(' ')
    .filter((token) => token && !STOP_WORDS.has(token))
    .join(' ');

const getTokenOverlap = (left: string, right: string): number => {
  const leftTokens = new Set(getComparableTitle(left).split(' ').filter(Boolean));
  const rightTokens = new Set(getComparableTitle(right).split(' ').filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) shared += 1;
  }

  return shared / Math.max(leftTokens.size, rightTokens.size);
};

const getYearDistance = (left: number | null, right: number | null): number | null => {
  if (left === null || right === null) return null;
  return Math.abs(left - right);
};

export const getCanonicalTmdbId = (item: MediaItem): number | null => {
  if (item._source === 'tmdb') return item.id;
  return item._tmdbId ?? null;
};

const getMediaKind = (item: MediaItem, fallback?: MediaType): MediaType =>
  item.media_type ?? fallback ?? ('title' in item ? 'movie' : 'tv');

export const scoreMediaMatch = (
  left: MediaItem,
  right: MediaItem,
  fallbackType?: MediaType
): number => {
  if (getMediaKind(left, fallbackType) !== getMediaKind(right, fallbackType)) {
    return 0;
  }

  const leftTmdbId = getCanonicalTmdbId(left);
  const rightTmdbId = getCanonicalTmdbId(right);
  if (leftTmdbId && rightTmdbId && leftTmdbId === rightTmdbId) return 1;

  if (left._imdbId && right._imdbId && left._imdbId === right._imdbId) return 0.98;

  const leftTitle = getMediaTitle(left);
  const rightTitle = getMediaTitle(right);
  const normalizedLeft = normalizeTitle(leftTitle);
  const normalizedRight = normalizeTitle(rightTitle);
  const comparableLeft = getComparableTitle(leftTitle);
  const comparableRight = getComparableTitle(rightTitle);
  const yearDistance = getYearDistance(getMediaYear(left), getMediaYear(right));

  if (normalizedLeft === normalizedRight) {
    if (yearDistance === 0) return 0.96;
    if (yearDistance !== null && yearDistance <= 1) return 0.9;
    if (yearDistance === null) return 0.86;
  }

  if (comparableLeft && comparableLeft === comparableRight) {
    if (yearDistance === 0) return 0.92;
    if (yearDistance !== null && yearDistance <= 1) return 0.87;
    if (yearDistance === null) return 0.82;
  }

  const tokenOverlap = getTokenOverlap(leftTitle, rightTitle);
  if (tokenOverlap >= 0.9) {
    if (yearDistance === 0) return 0.85;
    if (yearDistance === null || yearDistance <= 1) return 0.8;
  }

  if (
    yearDistance !== null &&
    yearDistance <= 1 &&
    (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft))
  ) {
    return 0.78;
  }

  return 0;
};

export const mergeMediaItems = <T extends MediaItem>(primary: T, secondary: MediaItem): T => {
  const canonicalTmdbId = getCanonicalTmdbId(primary) ?? getCanonicalTmdbId(secondary);

  return {
    ...secondary,
    ...primary,
    _source: primary._source ?? secondary._source,
    _tmdbId: canonicalTmdbId,
    _imdbId: primary._imdbId ?? secondary._imdbId ?? null,
    _tvmazeId: primary._tvmazeId ?? secondary._tvmazeId ?? null,
    _tvmazeImage: primary._tvmazeImage ?? secondary._tvmazeImage ?? null,
    _matchConfidence: Math.max(primary._matchConfidence ?? 0, secondary._matchConfidence ?? 0),
  } as T;
};

export const filterUniqueMedia = <T extends MediaItem>(
  incoming: T[],
  existing: MediaItem[],
  fallbackType?: MediaType,
  threshold: number = MATCH_THRESHOLD
): T[] =>
  incoming.filter((item) => {
    const bestScore = existing.reduce((score, candidate) => {
      return Math.max(score, scoreMediaMatch(item, candidate, fallbackType));
    }, 0);

    return bestScore < threshold;
  });

export const mergeProviderResults = <TPrimary extends MediaItem, TSecondary extends MediaItem>(
  primary: TPrimary[],
  secondary: TSecondary[],
  fallbackType?: MediaType,
  threshold: number = MATCH_THRESHOLD
): MediaItem[] => {
  const merged: MediaItem[] = primary.map((item) => ({
    ...item,
    _tmdbId: getCanonicalTmdbId(item),
  }));

  for (const item of secondary) {
    let bestIndex = -1;
    let bestScore = 0;

    for (let index = 0; index < merged.length; index += 1) {
      const score = scoreMediaMatch(item, merged[index], fallbackType);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    if (bestIndex >= 0 && bestScore >= threshold) {
      merged[bestIndex] = mergeMediaItems(merged[bestIndex], {
        ...item,
        _matchConfidence: bestScore,
      });
      continue;
    }

    merged.push({
      ...item,
      _tmdbId: getCanonicalTmdbId(item),
      _matchConfidence: item._matchConfidence ?? null,
    });
  }

  return merged;
};
