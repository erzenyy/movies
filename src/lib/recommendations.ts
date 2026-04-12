import { Movie, TVShow, MediaType } from './types';
import { discoverMovies, discoverTVShows, getTrendingMovies, getTrendingTVShows } from './tmdb';
import {
  StoredGenre,
  StoredKeyword,
  StoredMediaEntry,
  StoredPerson,
  UserProfileSnapshot,
  getDroppedItems,
  getFavoriteItems,
  getRecentlyWatchedItems,
  getRewatchCandidates,
  getSavedForLaterItems,
} from './user-profile';

export type RecommendationSection = {
  id: string;
  title: string;
  subtitle: string;
  items: (Movie | TVShow)[];
};

type ScoredGenre = StoredGenre & { score: number };
type ScoredKeyword = StoredKeyword & { score: number };
type ScoredPerson = StoredPerson & { score: number };

function scoreEntry(entry: StoredMediaEntry) {
  const recencyDays = (Date.now() - new Date(entry.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 42 - recencyDays) * 0.7;
  const progressBoost = (entry.progressPercent ?? 0) * 0.35;
  const runtimeAffinity = entry.runtimeMinutes ? Math.min(entry.runtimeMinutes, 180) / 12 : 0;
  return (
    entry.totalWatchSeconds / 60 +
    entry.sessions * 14 +
    progressBoost +
    runtimeAffinity +
    (entry.favorite ? 65 : 0) +
    (entry.preference === 'like' ? 40 : 0) +
    (entry.preference === 'dislike' ? -55 : 0) +
    (entry.completedAt ? 30 : 0) +
    recencyBoost
  );
}

function addWeightedMap<T extends { id: number; name: string }>(
  map: Map<number, T & { score: number }>,
  values: T[],
  weight: number
) {
  for (const value of values) {
    const current = map.get(value.id);
    if (current) {
      current.score += weight;
    } else {
      map.set(value.id, { ...value, score: weight });
    }
  }
}

function bucketRuntime(minutes: number | null) {
  if (!minutes) return null;
  if (minutes < 30) return 'short';
  if (minutes < 70) return 'tight';
  if (minutes < 120) return 'feature';
  return 'epic';
}

export function deriveTasteProfile(profile: UserProfileSnapshot) {
  const genreMap = new Map<number, ScoredGenre>();
  const keywordMap = new Map<number, ScoredKeyword>();
  const personMap = new Map<number, ScoredPerson>();
  const mediaTypeMap = new Map<MediaType, number>();
  const languageMap = new Map<string, number>();
  const runtimeMap = new Map<string, number>();

  for (const entry of profile.items) {
    if (entry.hidden) continue;
    const weight = scoreEntry(entry);
    mediaTypeMap.set(entry.mediaType, (mediaTypeMap.get(entry.mediaType) ?? 0) + weight);
    if (entry.originalLanguage) {
      languageMap.set(entry.originalLanguage, (languageMap.get(entry.originalLanguage) ?? 0) + weight);
    }

    const runtimeBucket = bucketRuntime(entry.runtimeMinutes);
    if (runtimeBucket) runtimeMap.set(runtimeBucket, (runtimeMap.get(runtimeBucket) ?? 0) + weight);

    addWeightedMap(genreMap, entry.genres, weight);
    addWeightedMap(keywordMap, entry.keywords, weight * 0.8);
    addWeightedMap(personMap, entry.people, weight * (entry.favorite ? 1.1 : 0.7));
  }

  const visibleItems = profile.items.filter((item) => !item.hidden);
  const topGenres = [...genreMap.values()].sort((a, b) => b.score - a.score).slice(0, 5);
  const topKeywords = [...keywordMap.values()].sort((a, b) => b.score - a.score).slice(0, 4);
  const topPeople = [...personMap.values()].sort((a, b) => b.score - a.score).slice(0, 4);
  const favoriteAnchors = getFavoriteItems(profile).slice(0, 3);
  const recentAnchors = getRecentlyWatchedItems(profile, 5);
  const topLanguage = [...languageMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const preferredMediaType =
    [...mediaTypeMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const preferredRuntime = [...runtimeMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    topGenres,
    topKeywords,
    topPeople,
    topLanguage,
    preferredMediaType,
    preferredRuntime,
    favoriteAnchors,
    recentAnchors,
    visibleItems,
  };
}

function dedupeItems(items: (Movie | TVShow)[], hiddenIds: Set<string>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const mediaType = item.media_type ?? ('title' in item ? 'movie' : 'tv');
    const key = `${mediaType}:${item.id}`;
    if (seen.has(key) || hiddenIds.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreCandidate(item: Movie | TVShow, taste: ReturnType<typeof deriveTasteProfile>) {
  const itemGenreIds = item.genre_ids ?? [];
  const genreScore = taste.topGenres.reduce((sum, genre, index) => {
    if (!itemGenreIds.includes(genre.id)) return sum;
    return sum + (taste.topGenres.length - index) * 28 + genre.score / 12;
  }, 0);

  const type = item.media_type ?? ('title' in item ? 'movie' : 'tv');
  const typeScore = taste.preferredMediaType === type ? 22 : 0;
  const languageScore = taste.topLanguage && item.original_language === taste.topLanguage ? 18 : 0;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const releaseYear = Number(releaseDate?.slice(0, 4));
  const recentScore = Number.isFinite(releaseYear) ? Math.max(0, releaseYear - 1980) / 3 : 0;
  const crowdScore = Math.min(item.vote_count ?? 0, 6000) / 300;

  return genreScore + typeScore + languageScore + recentScore + crowdScore + (item.vote_average ?? 0) * 6;
}

function runtimeRangeForPreference(bucket: string | null) {
  switch (bucket) {
    case 'short':
      return { runtimeGte: 10, runtimeLte: 35 };
    case 'tight':
      return { runtimeGte: 35, runtimeLte: 75 };
    case 'feature':
      return { runtimeGte: 80, runtimeLte: 125 };
    case 'epic':
      return { runtimeGte: 125, runtimeLte: 220 };
    default:
      return {};
  }
}

export async function buildForYouSections(profile: UserProfileSnapshot) {
  if (profile.items.length === 0) {
    const [trendingMovies, trendingTV] = await Promise.all([getTrendingMovies(), getTrendingTVShows()]);
    return [
      {
        id: 'starter-movies',
        title: 'Start Here',
        subtitle: 'Once you watch a few titles, this page will shape itself around your habits.',
        items: trendingMovies.slice(0, 12),
      },
      {
        id: 'starter-tv',
        title: 'Popular Right Now',
        subtitle: 'A quick TV mix while the local profile is still empty.',
        items: trendingTV.slice(0, 12),
      },
    ] satisfies RecommendationSection[];
  }

  const taste = deriveTasteProfile(profile);
  const primaryGenre = taste.topGenres[0];
  const secondaryGenre = taste.topGenres[1];
  const primaryKeyword = taste.topKeywords[0];
  const primaryPerson = taste.topPeople[0];
  const anchor = [...taste.favoriteAnchors, ...taste.recentAnchors][0];
  const hiddenIds = new Set(profile.items.filter((item) => item.hidden).map((item) => item.key));
  const savedForLater = getSavedForLaterItems(profile).map((entry) => entryToRecommendationItem(entry));
  const dropped = getDroppedItems(profile).map((entry) => entryToRecommendationItem(entry));
  const rewatch = getRewatchCandidates(profile).map((entry) => entryToRecommendationItem(entry));
  const runtimeRange = runtimeRangeForPreference(taste.preferredRuntime);

  const [comfortMovies, comfortTV, runtimeMovies, runtimeTV, keywordMovies, personMovies] = await Promise.all([
    discoverMovies({
      genreId: primaryGenre?.id,
      sortBy: 'vote_average.desc',
      minRating: 6.8,
      minVotes: 350,
      originalLanguage: taste.topLanguage ?? undefined,
    }),
    discoverTVShows({
      genreId: primaryGenre?.id,
      sortBy: 'vote_average.desc',
      minRating: 7,
      minVotes: 200,
      originalLanguage: taste.topLanguage ?? undefined,
    }),
    discoverMovies({
      genreId: secondaryGenre?.id ?? primaryGenre?.id,
      sortBy: 'popularity.desc',
      minVotes: 120,
      originalLanguage: taste.topLanguage ?? undefined,
      ...runtimeRange,
    }),
    discoverTVShows({
      genreId: secondaryGenre?.id ?? primaryGenre?.id,
      sortBy: 'popularity.desc',
      minVotes: 100,
      originalLanguage: taste.topLanguage ?? undefined,
      ...runtimeRange,
    }),
    primaryKeyword
      ? discoverMovies({
          keywordId: primaryKeyword.id,
          sortBy: 'vote_average.desc',
          minVotes: 120,
          originalLanguage: taste.topLanguage ?? undefined,
        })
      : Promise.resolve({ results: [], page: 1, totalPages: 0, totalResults: 0 }),
    primaryPerson
      ? discoverMovies({
          personId: primaryPerson.id,
          sortBy: 'popularity.desc',
          minVotes: 180,
          originalLanguage: taste.topLanguage ?? undefined,
        })
      : Promise.resolve({ results: [], page: 1, totalPages: 0, totalResults: 0 }),
  ]);

  const moviePool = dedupeItems(
    [...comfortMovies.results, ...runtimeMovies.results, ...keywordMovies.results, ...personMovies.results],
    hiddenIds
  ).sort((left, right) => scoreCandidate(right, taste) - scoreCandidate(left, taste));
  const tvPool = dedupeItems([...comfortTV.results, ...runtimeTV.results], hiddenIds).sort(
    (left, right) => scoreCandidate(right, taste) - scoreCandidate(left, taste)
  );

  const sections: RecommendationSection[] = [];

  if (anchor) {
    const anchorResults =
      anchor.mediaType === 'movie'
        ? await discoverMovies({
            genreId: primaryGenre?.id,
            keywordId: primaryKeyword?.id,
            sortBy: 'popularity.desc',
            minVotes: 120,
          })
        : await discoverTVShows({
            genreId: primaryGenre?.id,
            keywordId: primaryKeyword?.id,
            sortBy: 'popularity.desc',
            minVotes: 80,
          });

    sections.push({
      id: 'anchor',
      title: `Because You Stayed With ${anchor.title}`,
      subtitle: 'Weighted from your strongest completion and revisit signals.',
      items: dedupeItems(anchorResults.results, hiddenIds).slice(0, 12),
    });
  }

  sections.push(
    {
      id: 'fit-movies',
      title: primaryGenre ? `${primaryGenre.name} Picks` : 'Movie Picks',
      subtitle: 'High-fit films ranked from your watch depth, favorites, and language lean.',
      items: moviePool.slice(0, 12),
    },
    {
      id: 'fit-tv',
      title: primaryGenre ? `${primaryGenre.name} Series` : 'Series Picks',
      subtitle: 'Shows tuned to what you actually finish and revisit.',
      items: tvPool.slice(0, 12),
    }
  );

  if (runtimeMovies.results.length > 0 || runtimeTV.results.length > 0) {
    const runtimeLabel =
      taste.preferredRuntime === 'short'
        ? 'Quick Tonight'
        : taste.preferredRuntime === 'tight'
          ? 'Easy Evenings'
          : taste.preferredRuntime === 'feature'
            ? 'Feature-Length Picks'
            : 'Long-Form Nights';

    sections.push({
      id: 'runtime',
      title: runtimeLabel,
      subtitle: 'Shaped by the runtimes you tend to stick with.',
      items: dedupeItems([...runtimeMovies.results, ...runtimeTV.results], hiddenIds).slice(0, 12),
    });
  }

  if (primaryKeyword && keywordMovies.results.length > 0) {
    sections.push({
      id: 'keyword',
      title: `More ${primaryKeyword.name}`,
      subtitle: 'Keyword-led suggestions from themes that keep repeating in your history.',
      items: dedupeItems(keywordMovies.results, hiddenIds).slice(0, 12),
    });
  }

  if (primaryPerson && personMovies.results.length > 0) {
    sections.push({
      id: 'people',
      title: `Featuring ${primaryPerson.name}`,
      subtitle: 'Cast and director overlap from titles you rated highly with your actions.',
      items: dedupeItems(personMovies.results, hiddenIds).slice(0, 12),
    });
  }

  if (savedForLater.length > 0) {
    sections.push({
      id: 'saved',
      title: 'Saved For Later',
      subtitle: 'Titles you marked to revisit when the mood is right.',
      items: savedForLater.slice(0, 12),
    });
  }

  if (dropped.length > 0) {
    sections.push({
      id: 'dropped',
      title: 'Pick Back Up',
      subtitle: 'Things you started but never really finished.',
      items: dropped.slice(0, 12),
    });
  }

  if (rewatch.length > 0) {
    sections.push({
      id: 'rewatch',
      title: 'Worth A Rewatch',
      subtitle: 'Favorites and completed titles that have gone quiet for a while.',
      items: rewatch.slice(0, 12),
    });
  }

  return sections.filter((section) => section.items.length > 0);
}

function entryToRecommendationItem(entry: StoredMediaEntry): Movie | TVShow {
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
  };
}
