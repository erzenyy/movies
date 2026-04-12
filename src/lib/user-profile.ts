import { useSyncExternalStore } from 'react';
import { MediaType, Movie, TVShow } from './types';

export type StoredGenre = {
  id: number;
  name: string;
};

export type StoredKeyword = {
  id: number;
  name: string;
};

export type StoredPerson = {
  id: number;
  name: string;
  role: 'cast' | 'director';
};

export type PreferenceSignal = 'like' | 'dislike' | null;

export type StoredMediaEntry = {
  key: string;
  tmdbId: string;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genres: StoredGenre[];
  keywords: StoredKeyword[];
  people: StoredPerson[];
  originalLanguage: string | null;
  runtimeMinutes: number | null;
  favorite: boolean;
  savedForLater: boolean;
  hidden: boolean;
  preference: PreferenceSignal;
  sessions: number;
  totalWatchSeconds: number;
  progressSeconds: number | null;
  progressPercent: number | null;
  lastSeasonNumber: number | null;
  lastEpisodeNumber: number | null;
  startedAt: string;
  lastViewedAt: string;
  completedAt: string | null;
};

export type UserProfileSnapshot = {
  version: 2;
  updatedAt: string | null;
  items: StoredMediaEntry[];
};

export type UpsertPayload = {
  tmdbId: string;
  mediaType: MediaType;
  title: string;
  overview?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string;
  voteAverage?: number;
  voteCount?: number;
  genres?: StoredGenre[];
  keywords?: StoredKeyword[];
  people?: StoredPerson[];
  originalLanguage?: string | null;
  runtimeMinutes?: number | null;
};

type ProgressPayload = {
  watchedSeconds?: number;
  progressSeconds?: number | null;
  progressPercent?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
};

const STORAGE_KEY = 'movieflix-user-profile-v2';
const LEGACY_STORAGE_KEY = 'movieflix-user-profile-v1';
const STORAGE_EVENT = 'movieflix-user-profile-updated';
const SESSION_GAP_MS = 1000 * 60 * 20;
const ABANDONED_AFTER_DAYS = 21;

const EMPTY_PROFILE: UserProfileSnapshot = {
  version: 2,
  updatedAt: null,
  items: [],
};
let cachedSnapshot: UserProfileSnapshot = EMPTY_PROFILE;
let cachedRawSnapshot: string | null = null;

function isClient() {
  return typeof window !== 'undefined';
}

function sortItems(items: StoredMediaEntry[]) {
  items.sort((left, right) => {
    const rightTime = new Date(right.lastViewedAt).getTime();
    const leftTime = new Date(left.lastViewedAt).getTime();
    return rightTime - leftTime;
  });
  return items;
}

function sanitizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function coercePreference(value: unknown): PreferenceSignal {
  return value === 'like' || value === 'dislike' ? value : null;
}

function normalizeStoredEntry(entry: Partial<StoredMediaEntry>): StoredMediaEntry {
  return {
    key: String(entry.key ?? makeStoredMediaKey(String(entry.tmdbId ?? ''), (entry.mediaType as MediaType) ?? 'movie')),
    tmdbId: String(entry.tmdbId ?? ''),
    mediaType: (entry.mediaType as MediaType) ?? 'movie',
    title: String(entry.title ?? ''),
    overview: String(entry.overview ?? ''),
    posterPath: entry.posterPath ?? null,
    backdropPath: entry.backdropPath ?? null,
    releaseDate: String(entry.releaseDate ?? ''),
    voteAverage: sanitizeNumber(entry.voteAverage, 0),
    voteCount: sanitizeNumber(entry.voteCount, 0),
    genres: sanitizeArray<StoredGenre>(entry.genres),
    keywords: sanitizeArray<StoredKeyword>(entry.keywords),
    people: sanitizeArray<StoredPerson>(entry.people),
    originalLanguage: entry.originalLanguage ?? null,
    runtimeMinutes: entry.runtimeMinutes ?? null,
    favorite: Boolean(entry.favorite),
    savedForLater: Boolean(entry.savedForLater),
    hidden: Boolean(entry.hidden),
    preference: coercePreference(entry.preference),
    sessions: sanitizeNumber(entry.sessions, 0),
    totalWatchSeconds: sanitizeNumber(entry.totalWatchSeconds, 0),
    progressSeconds: entry.progressSeconds ?? null,
    progressPercent: entry.progressPercent ?? null,
    lastSeasonNumber: entry.lastSeasonNumber ?? null,
    lastEpisodeNumber: entry.lastEpisodeNumber ?? null,
    startedAt: String(entry.startedAt ?? new Date().toISOString()),
    lastViewedAt: String(entry.lastViewedAt ?? new Date().toISOString()),
    completedAt: entry.completedAt ?? null,
  };
}

function migrateLegacyProfile(raw: string | null): UserProfileSnapshot {
  if (!raw) return EMPTY_PROFILE;
  try {
    const parsed = JSON.parse(raw) as { updatedAt?: string | null; items?: Partial<StoredMediaEntry>[] };
    return {
      version: 2,
      updatedAt: parsed.updatedAt ?? null,
      items: sortItems(sanitizeArray<Partial<StoredMediaEntry>>(parsed.items).map((item) =>
        normalizeStoredEntry({
          ...item,
          keywords: [],
          people: [],
          savedForLater: false,
          hidden: false,
          preference: null,
          runtimeMinutes: null,
          lastSeasonNumber: null,
          lastEpisodeNumber: null,
        })
      )),
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function makeStoredMediaKey(tmdbId: string, mediaType: MediaType) {
  return `${mediaType}:${tmdbId}`;
}

export function getEmptyUserProfile(): UserProfileSnapshot {
  return EMPTY_PROFILE;
}

export function readUserProfile(): UserProfileSnapshot {
  if (!isClient()) return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawSnapshot) {
      return cachedSnapshot;
    }
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfileSnapshot;
      if (parsed?.version === 2 && Array.isArray(parsed.items)) {
        const snapshot: UserProfileSnapshot = {
          version: 2,
          updatedAt: parsed.updatedAt ?? null,
          items: sortItems(parsed.items.map((item) => normalizeStoredEntry(item))),
        };
        cachedRawSnapshot = raw;
        cachedSnapshot = snapshot;
        return snapshot;
      }
    }

    const migrated = migrateLegacyProfile(window.localStorage.getItem(LEGACY_STORAGE_KEY));
    if (migrated.items.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      cachedRawSnapshot = JSON.stringify(migrated);
      cachedSnapshot = migrated;
      return migrated;
    }
    cachedRawSnapshot = null;
    cachedSnapshot = EMPTY_PROFILE;
    return migrated;
  } catch {
    cachedRawSnapshot = null;
    cachedSnapshot = EMPTY_PROFILE;
    return EMPTY_PROFILE;
  }
}

function emitUserProfileUpdate() {
  if (!isClient()) return;
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

function saveUserProfile(profile: UserProfileSnapshot) {
  if (!isClient()) return;
  const serialized = JSON.stringify(profile);
  cachedRawSnapshot = serialized;
  cachedSnapshot = profile;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  emitUserProfileUpdate();
}

function updateProfile(mutator: (draft: UserProfileSnapshot) => void) {
  const current = readUserProfile();
  const draft: UserProfileSnapshot = {
    ...current,
    items: current.items.map((item) =>
      normalizeStoredEntry({
        ...item,
        genres: [...item.genres],
        keywords: [...item.keywords],
        people: [...item.people],
      })
    ),
  };
  mutator(draft);
  draft.updatedAt = new Date().toISOString();
  sortItems(draft.items);
  saveUserProfile(draft);
}

function upsertEntry(items: StoredMediaEntry[], payload: UpsertPayload): StoredMediaEntry {
  const key = makeStoredMediaKey(payload.tmdbId, payload.mediaType);
  const now = new Date().toISOString();
  const existing = items.find((item) => item.key === key);

  if (existing) {
    existing.title = payload.title || existing.title;
    existing.overview = payload.overview ?? existing.overview;
    existing.posterPath = payload.posterPath ?? existing.posterPath;
    existing.backdropPath = payload.backdropPath ?? existing.backdropPath;
    existing.releaseDate = payload.releaseDate ?? existing.releaseDate;
    existing.voteAverage = payload.voteAverage ?? existing.voteAverage;
    existing.voteCount = payload.voteCount ?? existing.voteCount;
    existing.genres = payload.genres?.length ? payload.genres : existing.genres;
    existing.keywords = payload.keywords?.length ? payload.keywords : existing.keywords;
    existing.people = payload.people?.length ? payload.people : existing.people;
    existing.originalLanguage = payload.originalLanguage ?? existing.originalLanguage;
    existing.runtimeMinutes = payload.runtimeMinutes ?? existing.runtimeMinutes;
    const lastSeen = new Date(existing.lastViewedAt).getTime();
    if (Date.now() - lastSeen > SESSION_GAP_MS) {
      existing.sessions += 1;
    }
    existing.lastViewedAt = now;
    return existing;
  }

  const created: StoredMediaEntry = {
    key,
    tmdbId: payload.tmdbId,
    mediaType: payload.mediaType,
    title: payload.title,
    overview: payload.overview ?? '',
    posterPath: payload.posterPath ?? null,
    backdropPath: payload.backdropPath ?? null,
    releaseDate: payload.releaseDate ?? '',
    voteAverage: payload.voteAverage ?? 0,
    voteCount: payload.voteCount ?? 0,
    genres: payload.genres ?? [],
    keywords: payload.keywords ?? [],
    people: payload.people ?? [],
    originalLanguage: payload.originalLanguage ?? null,
    runtimeMinutes: payload.runtimeMinutes ?? null,
    favorite: false,
    savedForLater: false,
    hidden: false,
    preference: null,
    sessions: 1,
    totalWatchSeconds: 0,
    progressSeconds: null,
    progressPercent: null,
    lastSeasonNumber: null,
    lastEpisodeNumber: null,
    startedAt: now,
    lastViewedAt: now,
    completedAt: null,
  };
  items.push(created);
  return created;
}

export function trackWatchStart(payload: UpsertPayload) {
  updateProfile((draft) => {
    upsertEntry(draft.items, payload);
  });
}

export function trackWatchProgress(payload: UpsertPayload, progress: ProgressPayload) {
  updateProfile((draft) => {
    const entry = upsertEntry(draft.items, payload);
    if (progress.watchedSeconds && progress.watchedSeconds > 0) {
      entry.totalWatchSeconds += progress.watchedSeconds;
    }
    if (progress.progressSeconds !== undefined) {
      entry.progressSeconds = progress.progressSeconds ?? entry.progressSeconds;
    }
    if (progress.progressPercent !== undefined && progress.progressPercent !== null) {
      entry.progressPercent = Math.max(entry.progressPercent ?? 0, progress.progressPercent);
      if (entry.progressPercent >= 92 && !entry.completedAt) {
        entry.completedAt = new Date().toISOString();
      }
    }
    if (progress.seasonNumber !== undefined) {
      entry.lastSeasonNumber = progress.seasonNumber ?? entry.lastSeasonNumber;
    }
    if (progress.episodeNumber !== undefined) {
      entry.lastEpisodeNumber = progress.episodeNumber ?? entry.lastEpisodeNumber;
    }
    if (entry.completedAt && entry.progressPercent !== null && entry.progressPercent < 92) {
      entry.completedAt = null;
    }
    entry.lastViewedAt = new Date().toISOString();
  });
}

export function toggleFavoriteMedia(payload: UpsertPayload) {
  let nextFavorite = false;
  updateProfile((draft) => {
    const entry = upsertEntry(draft.items, payload);
    entry.favorite = !entry.favorite;
    nextFavorite = entry.favorite;
    if (entry.favorite) entry.hidden = false;
  });
  return nextFavorite;
}

export function toggleSavedForLater(payload: UpsertPayload) {
  let nextValue = false;
  updateProfile((draft) => {
    const entry = upsertEntry(draft.items, payload);
    entry.savedForLater = !entry.savedForLater;
    nextValue = entry.savedForLater;
  });
  return nextValue;
}

export function setMediaPreference(payload: UpsertPayload, preference: PreferenceSignal) {
  let nextPreference: PreferenceSignal = preference;
  updateProfile((draft) => {
    const entry = upsertEntry(draft.items, payload);
    entry.preference = entry.preference === preference ? null : preference;
    if (entry.preference === 'dislike') {
      entry.hidden = true;
      entry.favorite = false;
    } else if (entry.preference === 'like') {
      entry.hidden = false;
    }
    nextPreference = entry.preference;
  });
  return nextPreference;
}

export function toggleHiddenMedia(payload: UpsertPayload) {
  let nextValue = false;
  updateProfile((draft) => {
    const entry = upsertEntry(draft.items, payload);
    entry.hidden = !entry.hidden;
    if (entry.hidden) {
      entry.favorite = false;
      entry.savedForLater = false;
      entry.preference = 'dislike';
    }
    nextValue = entry.hidden;
  });
  return nextValue;
}

export function markMediaCompleted(payload: UpsertPayload) {
  updateProfile((draft) => {
    const entry = upsertEntry(draft.items, payload);
    entry.completedAt = new Date().toISOString();
    entry.progressPercent = 100;
    if (entry.progressSeconds === null && entry.runtimeMinutes) {
      entry.progressSeconds = entry.runtimeMinutes * 60;
    }
  });
}

export function getUserMediaEntry(tmdbId: string, mediaType: MediaType) {
  return readUserProfile().items.find((item) => item.key === makeStoredMediaKey(tmdbId, mediaType)) ?? null;
}

export function subscribeUserProfile(listener: () => void) {
  if (!isClient()) return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) {
      listener();
    }
  };
  const handleCustom = () => listener();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(STORAGE_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(STORAGE_EVENT, handleCustom);
  };
}

export function useUserProfile() {
  return useSyncExternalStore(subscribeUserProfile, readUserProfile, getEmptyUserProfile);
}

export function getContinueWatchingItems(profile: UserProfileSnapshot) {
  return profile.items.filter((item) => {
    if (item.hidden || item.completedAt) return false;
    const progress = item.progressPercent ?? 0;
    return progress >= 4 && progress < 95;
  });
}

export function getFavoriteItems(profile: UserProfileSnapshot) {
  return profile.items.filter((item) => item.favorite && !item.hidden);
}

export function getSavedForLaterItems(profile: UserProfileSnapshot) {
  return profile.items.filter((item) => item.savedForLater && !item.hidden);
}

export function getRecentlyWatchedItems(profile: UserProfileSnapshot, limit = 20) {
  return profile.items.filter((item) => !item.hidden).slice(0, limit);
}

export function getDroppedItems(profile: UserProfileSnapshot) {
  const cutoff = Date.now() - ABANDONED_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return profile.items.filter((item) => {
    if (item.hidden || item.completedAt) return false;
    const progress = item.progressPercent ?? 0;
    const lastSeen = new Date(item.lastViewedAt).getTime();
    return progress >= 8 && progress < 60 && lastSeen < cutoff;
  });
}

export function getRewatchCandidates(profile: UserProfileSnapshot) {
  const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
  return profile.items.filter((item) => {
    if (item.hidden) return false;
    if (!item.favorite && !item.completedAt) return false;
    return new Date(item.lastViewedAt).getTime() < cutoff;
  });
}

export function summarizeUserProfile(profile: UserProfileSnapshot) {
  const visibleItems = profile.items.filter((item) => !item.hidden);
  const totalWatchSeconds = visibleItems.reduce((sum, item) => sum + item.totalWatchSeconds, 0);
  const favorites = visibleItems.filter((item) => item.favorite).length;
  const completed = visibleItems.filter((item) => Boolean(item.completedAt)).length;
  const genreScores = new Map<string, number>();
  const languageScores = new Map<string, number>();

  for (const item of visibleItems) {
    const weight =
      item.totalWatchSeconds / 60 +
      item.sessions * 8 +
      (item.favorite ? 40 : 0) +
      (item.preference === 'like' ? 24 : 0) +
      (item.completedAt ? 24 : 0);

    if (item.originalLanguage) {
      languageScores.set(item.originalLanguage, (languageScores.get(item.originalLanguage) ?? 0) + weight);
    }

    for (const genre of item.genres) {
      genreScores.set(genre.name, (genreScores.get(genre.name) ?? 0) + weight);
    }
  }

  const topGenres = [...genreScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([name]) => name);

  const topLanguage = [...languageScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    titlesTracked: visibleItems.length,
    favorites,
    completed,
    totalHours: totalWatchSeconds / 3600,
    topGenres,
    topLanguage,
    saved: getSavedForLaterItems(profile).length,
  };
}

export function entryToMediaItem(entry: StoredMediaEntry): Movie | TVShow {
  if (entry.mediaType === 'movie') {
    return {
      id: Number(entry.tmdbId),
      title: entry.title,
      overview: entry.overview,
      poster_path: entry.posterPath,
      backdrop_path: entry.backdropPath,
      release_date: entry.releaseDate,
      vote_average: entry.voteAverage,
      vote_count: entry.voteCount,
      genre_ids: entry.genres.map((genre) => genre.id),
      media_type: 'movie',
      original_language: entry.originalLanguage ?? undefined,
      _tmdbId: Number(entry.tmdbId),
      _source: 'tmdb',
    };
  }

  return {
    id: Number(entry.tmdbId),
    name: entry.title,
    overview: entry.overview,
    poster_path: entry.posterPath,
    backdrop_path: entry.backdropPath,
    first_air_date: entry.releaseDate,
    vote_average: entry.voteAverage,
    vote_count: entry.voteCount,
    genre_ids: entry.genres.map((genre) => genre.id),
    media_type: 'tv',
    original_language: entry.originalLanguage ?? undefined,
    _tmdbId: Number(entry.tmdbId),
    _source: 'tmdb',
  };
}
