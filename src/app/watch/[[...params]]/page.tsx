'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, Calendar, Clock, Share2, Heart, Film, Loader2, Bookmark, ThumbsUp, EyeOff, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StreamingEmbedPlayer } from '@/components/streaming-embed-player';
import { MovieSectionClient } from '@/components/movie-section-client';
import { Header } from '@/components/header';
import { Movie, TVShow, MovieDetails, TVShowDetails } from '@/lib/types';
import {
  getMovieDetails,
  getTVShowDetails,
  getImageUrl,
  getSimilarMovies,
  getMovieCollectionParts,
} from '@/lib/tmdb';
import { getTVMazeShowDetails } from '@/lib/tvmaze';
import { formatVoteCount } from '@/lib/utils';
import {
  markMediaCompleted,
  makeStoredMediaKey,
  setMediaPreference,
  toggleFavoriteMedia,
  toggleHiddenMedia,
  toggleSavedForLater,
  trackWatchProgress,
  trackWatchStart,
  useUserProfile,
} from '@/lib/user-profile';

const TVMAZE_ID_OFFSET = 900000;

function extractKeywords(details: MovieDetails | TVShowDetails | null) {
  if (!details) return [];
  if ('aggregate_credits' in details) {
    const tvDetails = details as TVShowDetails;
    return (tvDetails.keywords?.results ?? []).map((keyword: { id: number; name: string }) => ({
      id: keyword.id,
      name: keyword.name,
    }));
  }
  const movieDetails = details as MovieDetails;
  return (movieDetails.keywords?.keywords ?? []).map((keyword: { id: number; name: string }) => ({
    id: keyword.id,
    name: keyword.name,
  }));
}

function extractPeople(details: MovieDetails | TVShowDetails | null) {
  if (!details) return [];
  if ('aggregate_credits' in details) {
    const tvDetails = details as TVShowDetails;
    return [
      ...(tvDetails.aggregate_credits?.cast ?? []).slice(0, 4).map((person: { id: number; name: string }) => ({
        id: person.id,
        name: person.name,
        role: 'cast' as const,
      })),
      ...(tvDetails.aggregate_credits?.crew ?? [])
        .filter((person: { job?: string }) => person.job === 'Director')
        .slice(0, 2)
        .map((person: { id: number; name: string }) => ({
          id: person.id,
          name: person.name,
          role: 'director' as const,
        })),
    ];
  }
  const movieDetails = details as MovieDetails;
  return [
    ...(movieDetails.credits?.cast ?? []).slice(0, 4).map((person: { id: number; name: string }) => ({
      id: person.id,
      name: person.name,
      role: 'cast' as const,
    })),
    ...(movieDetails.credits?.crew ?? [])
      .filter((person: { job?: string }) => person.job === 'Director')
      .slice(0, 2)
      .map((person: { id: number; name: string }) => ({
        id: person.id,
        name: person.name,
        role: 'director' as const,
      })),
  ];
}

export default function WatchPage() {
  const rawParams = useParams();
  const segments = (rawParams.params as string[]) || [];
  // URL: /watch/movie/123 or /watch/tv/123/1/1
  const mediaType = (segments[0] as 'movie' | 'tv') || 'movie';
  const id = segments[1] || '';
  const season = segments[2] || undefined;
  const episode = segments[3] || undefined;

  const numericId = Number(id);
  const isTVMazeSource = numericId > TVMAZE_ID_OFFSET;
  const tvmazeRealId = isTVMazeSource ? numericId - TVMAZE_ID_OFFSET : null;

  const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
  const [tvmazeDetails, setTvmazeDetails] = useState<TVShow | null>(null);
  const [resolvedTmdbId, setResolvedTmdbId] = useState<string | null>(null);
  const [resolvedStrategy, setResolvedStrategy] = useState<string | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [collectionMovies, setCollectionMovies] = useState<Movie[]>([]);
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingId, setIsResolvingId] = useState(false);
  const profile = useUserProfile();

  useEffect(() => {
    const fetchData = async () => {
      const loadCollectionForMovie = async (movieDetails: MovieDetails) => {
        if (!movieDetails.belongs_to_collection?.id) {
          setCollectionMovies([]);
          setCollectionTitle(null);
          return;
        }
        const col = await getMovieCollectionParts(movieDetails.belongs_to_collection.id);
        if (!col) {
          setCollectionMovies([]);
          setCollectionTitle(null);
          return;
        }
        const others = col.parts.filter((m) => m.id !== movieDetails.id);
        setCollectionTitle(col.name);
        setCollectionMovies(others);
      };

      try {
        setSimilarMovies([]);
        setCollectionMovies([]);
        setCollectionTitle(null);

        if (isTVMazeSource && tvmazeRealId !== null) {
          // TVMaze source: get TVMaze details and resolve TMDB ID
          const tvmaze = await getTVMazeShowDetails(tvmazeRealId);
          setTvmazeDetails(tvmaze);

          // Resolve TMDB ID for embed players
          setIsResolvingId(true);
          try {
            const imdbId = tvmaze?._imdbId;
            const name = tvmaze?.name;
            const params = new URLSearchParams({ type: mediaType });
            if (imdbId) params.set('imdb', imdbId);
            if (name) params.set('name', name);
            if (tvmaze?.first_air_date) {
              params.set('year', tvmaze.first_air_date.slice(0, 4));
            }

            const res = await fetch(`/api/resolve-id?${params.toString()}`);
            if (res.ok) {
              const data = await res.json();
              if (data.tmdbId) {
                setResolvedTmdbId(String(data.tmdbId));
                setResolvedStrategy(data.strategy ?? null);

                // Now try to fetch TMDB details with the resolved ID
                try {
                  if (mediaType === 'movie') {
                    const tmdbDetails = await getMovieDetails(data.tmdbId);
                    if (tmdbDetails && tmdbDetails.id) {
                      setDetails(tmdbDetails);
                      await loadCollectionForMovie(tmdbDetails);
                    }
                    const similar = await getSimilarMovies(data.tmdbId);
                    setSimilarMovies(similar);
                  } else {
                    const tmdbDetails = await getTVShowDetails(data.tmdbId);
                    if (tmdbDetails && tmdbDetails.id) setDetails(tmdbDetails);
                  }
                } catch {
                  // TMDB details fetch failed, we'll use TVMaze details
                }
              }
            }
          } catch {
            // Resolution failed, player might not work but we still show info
          } finally {
            setIsResolvingId(false);
          }
        } else {
          // Direct TMDB source
          setResolvedTmdbId(id);
          setResolvedStrategy('direct');
          if (mediaType === 'movie') {
            const detailsData = await getMovieDetails(numericId);
            setDetails(detailsData);
            await loadCollectionForMovie(detailsData);
            const similar = await getSimilarMovies(numericId);
            setSimilarMovies(similar);
          } else {
            const detailsData = await getTVShowDetails(numericId);
            setDetails(detailsData);
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, mediaType, isTVMazeSource, tvmazeRealId, numericId]);

  // Use TMDB details if available, otherwise build from TVMaze details
  const hasDetails = details !== null;
  const hasTvmazeDetails = tvmazeDetails !== null;

  // Extract display info from whichever source we have
  const title = hasDetails
    ? ('title' in details! ? details!.title : details!.name)
    : tvmazeDetails?.name ?? '';
  const overview = hasDetails ? details!.overview : tvmazeDetails?.overview ?? '';
  const rating = hasDetails ? (details!.vote_average ?? 0) : (tvmazeDetails?.vote_average ?? 0);
  const releaseDate = hasDetails
    ? ('release_date' in details! ? details!.release_date : details!.first_air_date)
    : tvmazeDetails?.first_air_date ?? '';
  const runtime = hasDetails && 'runtime' in details!
    ? details!.runtime
    : (hasDetails && 'episode_run_time' in details! ? (details!.episode_run_time?.[0] || 0) : 0);
  const genres = hasDetails ? (details!.genres || []) : [];
  const tagline = hasDetails ? details!.tagline : undefined;
  const imdbId = hasDetails && 'imdb_id' in details! ? details!.imdb_id : tvmazeDetails?._imdbId ?? null;

  // Poster: TMDB path or TVMaze direct URL
  const posterSrc = hasDetails && details!.poster_path
    ? getImageUrl(details!.poster_path, 'w500')
    : tvmazeDetails?._tvmazeImage || '';

  const playerTmdbId = resolvedTmdbId || id;
  const trackedPayload = useMemo(() => {
    if (!resolvedTmdbId) return null;
    const extractedKeywords = hasDetails ? extractKeywords(details) : [];
    const extractedPeople = hasDetails ? extractPeople(details) : [];
    return {
      tmdbId: resolvedTmdbId,
      mediaType,
      title,
      overview,
      posterPath: hasDetails ? details!.poster_path : tvmazeDetails?._tvmazeImage ?? null,
      backdropPath: hasDetails ? details!.backdrop_path : null,
      releaseDate,
      voteAverage: rating,
      voteCount: hasDetails ? details!.vote_count : tvmazeDetails?.vote_count ?? 0,
      genres: hasDetails ? details!.genres.map((genre) => ({ id: genre.id, name: genre.name })) : [],
      keywords: extractedKeywords,
      people: extractedPeople,
      originalLanguage: hasDetails ? details!.original_language ?? null : null,
      runtimeMinutes: runtime || null,
    };
  }, [
    resolvedTmdbId,
    mediaType,
    title,
    overview,
    hasDetails,
    details,
    tvmazeDetails,
    releaseDate,
    rating,
    runtime,
  ]);
  const currentEntry = trackedPayload
    ? profile.items.find((item) => item.key === makeStoredMediaKey(trackedPayload.tmdbId, trackedPayload.mediaType))
    : null;
  const isFavorite = currentEntry?.favorite ?? false;
  const isSavedForLater = currentEntry?.savedForLater ?? false;
  const preference = currentEntry?.preference ?? null;
  const isHidden = currentEntry?.hidden ?? false;

  useEffect(() => {
    if (!trackedPayload) return;
    trackWatchStart(trackedPayload);
  }, [trackedPayload]);

  useEffect(() => {
    if (!trackedPayload) return;

    let lastTick = Date.now();
    const commitElapsed = () => {
      const now = Date.now();
      const elapsed = Math.min(30, Math.max(0, Math.round((now - lastTick) / 1000)));
      lastTick = now;
      if (elapsed > 0) {
        trackWatchProgress(trackedPayload, { watchedSeconds: elapsed });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        commitElapsed();
      } else {
        lastTick = Date.now();
      }
    }, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastTick = Date.now();
        return;
      }
      commitElapsed();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      commitElapsed();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [trackedPayload]);

  const handlePlayerProgress = (data: { currentTime: number; duration: number; progress: number }) => {
    if (!trackedPayload) return;
    trackWatchProgress(trackedPayload, {
      progressSeconds: data.currentTime,
      progressPercent: data.progress,
      seasonNumber: season ? Number(season) : null,
      episodeNumber: episode ? Number(episode) : null,
    });
  };

  const handleFavorite = () => {
    if (!trackedPayload) return;
    toggleFavoriteMedia(trackedPayload);
  };

  const handleSaveForLater = () => {
    if (!trackedPayload) return;
    toggleSavedForLater(trackedPayload);
  };

  const handleLike = () => {
    if (!trackedPayload) return;
    setMediaPreference(trackedPayload, 'like');
  };

  const handleHide = () => {
    if (!trackedPayload) return;
    toggleHiddenMedia(trackedPayload);
  };

  const handleMarkCompleted = () => {
    if (!trackedPayload) return;
    markMediaCompleted(trackedPayload);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title, text: overview || title, url };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // fall through to clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore clipboard failures
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <main className="app-shell">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="aspect-video w-full rounded-none sm:rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!hasDetails && !hasTvmazeDetails) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Header />
        <p className="text-white">Content not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      
      <main className="app-shell pb-[env(safe-area-inset-bottom,0px)]">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2 -ml-2 sm:ml-0 text-sm sm:text-base">
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Back to Browse
            </Button>
          </Link>
        </div>

        {/* Video Player */}
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          {isResolvingId ? (
            <div className="aspect-video w-full rounded-none sm:rounded-lg bg-zinc-900 flex items-center justify-center">
              <div className="text-center px-4">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">Resolving player...</p>
              </div>
            </div>
          ) : resolvedTmdbId ? (
            <StreamingEmbedPlayer
              tmdbId={playerTmdbId}
              mediaType={mediaType}
              season={season ? Number(season) : undefined}
              episode={episode ? Number(episode) : undefined}
              color="e50914"
              autoPlay={true}
              nextEpisode={mediaType === 'tv'}
              episodeSelector={mediaType === 'tv'}
              onProgress={handlePlayerProgress}
            />
          ) : (
            <div className="aspect-video w-full rounded-none sm:rounded-lg bg-zinc-900 flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Player unavailable</p>
                <p className="text-zinc-400 text-sm">
                  Could not resolve a TMDB ID for this title. Try adding a TMDB API key for full playback support.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Movie Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Poster & Actions */}
            <div className="lg:col-span-1 max-w-[220px] sm:max-w-[260px] mx-auto w-full lg:max-w-none lg:mx-0">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                {posterSrc ? (
                  <Image
                    src={posterSrc}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized={!hasDetails || !details!.poster_path}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Film className="w-16 h-16 text-zinc-600" />
                  </div>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-5 gap-2">
                <Button
                  variant="outline"
                  onClick={handleFavorite}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  title={isFavorite ? 'Favorited' : 'Favorite'}
                  className={`min-h-11 border-zinc-700 text-white hover:bg-zinc-800 ${isFavorite ? 'bg-zinc-800 text-red-400' : ''}`}
                >
                  <Heart className={`w-4 h-4 shrink-0 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveForLater}
                  aria-label={isSavedForLater ? 'Remove from saved for later' : 'Save for later'}
                  title={isSavedForLater ? 'Saved for later' : 'Save for later'}
                  className={`min-h-11 border-zinc-700 text-white hover:bg-zinc-800 ${isSavedForLater ? 'bg-zinc-800 text-white' : ''}`}
                >
                  <Bookmark className={`w-4 h-4 shrink-0 ${isSavedForLater ? 'fill-white text-white' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLike}
                  aria-label={preference === 'like' ? 'Unlike this title' : 'Like this title'}
                  title={preference === 'like' ? 'Liked' : 'Like'}
                  className={`min-h-11 border-zinc-700 text-white hover:bg-zinc-800 ${preference === 'like' ? 'bg-zinc-800 text-emerald-400' : ''}`}
                >
                  <ThumbsUp className={`w-4 h-4 shrink-0 ${preference === 'like' ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleHide}
                  aria-label={isHidden ? 'Show this title again' : 'Hide this title'}
                  title={isHidden ? 'Hidden from recommendations' : 'Not interested'}
                  className={`min-h-11 border-zinc-700 text-white hover:bg-zinc-800 ${isHidden ? 'bg-zinc-800 text-zinc-300' : ''}`}
                >
                  <EyeOff className="w-4 h-4 shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMarkCompleted}
                  aria-label="Mark as watched"
                  title="Mark as watched"
                  className={`min-h-11 border-zinc-700 text-white hover:bg-zinc-800 ${currentEntry?.completedAt ? 'bg-zinc-800 text-yellow-300' : ''}`}
                >
                  <CircleCheck className={`w-4 h-4 shrink-0 ${currentEntry?.completedAt ? 'fill-yellow-300 text-yellow-300' : ''}`} />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{isHidden ? 'Hidden from recommendations' : 'Stored locally on this device'}</span>
                <Button
                  variant="ghost"
                  onClick={handleShare}
                  className="h-auto px-0 py-0 text-[11px] text-zinc-500 hover:bg-transparent hover:text-white"
                >
                  <Share2 className="mr-1 h-3.5 w-3.5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-zinc-400">
                  {rating > 0 && (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-semibold">
                          TMDB {rating.toFixed(1)}
                          {hasDetails && details!.vote_count > 0 ? ` (${formatVoteCount(details!.vote_count)} votes)` : ''}
                        </span>
                      </div>
                      <span className="text-zinc-600">•</span>
                    </>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}</span>
                  </div>
                  {runtime > 0 && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                      </div>
                    </>
                  )}
                  {isTVMazeSource && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        via TVMaze
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {tagline && (
                <p className="text-xl text-zinc-400 italic">{tagline}</p>
              )}

              {overview && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                  <p className="text-zinc-400 leading-relaxed">{overview}</p>
                </div>
              )}

              <Separator className="bg-zinc-800" />

              {/* Additional Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {hasDetails && 'status' in details! && (
                  <div>
                    <p className="text-sm text-zinc-500">Status</p>
                    <p className="text-white">{details!.status}</p>
                  </div>
                )}
                {hasDetails && 'number_of_seasons' in details! && (
                  <div>
                    <p className="text-sm text-zinc-500">Seasons</p>
                    <p className="text-white">{details!.number_of_seasons}</p>
                  </div>
                )}
                {hasDetails && 'number_of_episodes' in details! && (
                  <div>
                    <p className="text-sm text-zinc-500">Episodes</p>
                    <p className="text-white">{details!.number_of_episodes}</p>
                  </div>
                )}
                {resolvedTmdbId && (
                  <div>
                    <p className="text-sm text-zinc-500">TMDB ID</p>
                    <p className="text-white">{resolvedTmdbId}</p>
                  </div>
                )}
                {imdbId && (
                  <div>
                    <p className="text-sm text-zinc-500">IMDb ID</p>
                    <p className="text-white">{imdbId}</p>
                  </div>
                )}
                {resolvedStrategy && (
                  <div>
                    <p className="text-sm text-zinc-500">Match Source</p>
                    <p className="text-white">{resolvedStrategy}</p>
                  </div>
                )}
                {currentEntry && (
                  <div>
                    <p className="text-sm text-zinc-500">Saved Progress</p>
                    <p className="text-white">
                      {currentEntry.progressPercent ? `${Math.round(currentEntry.progressPercent)}%` : `${Math.round(currentEntry.totalWatchSeconds / 60)}m tracked`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collection (franchise) + similar */}
        {(collectionMovies.length > 0 || similarMovies.length > 0) && (
          <div className="pb-12">
            {collectionMovies.length > 0 && collectionTitle && mediaType === 'movie' && (
              <MovieSectionClient
                title={collectionTitle}
                movies={collectionMovies}
                mediaType="movie"
              />
            )}
            {similarMovies.length > 0 && (
              <MovieSectionClient
                title="More Like This"
                movies={similarMovies}
                mediaType={mediaType}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
