'use client';

import Link from 'next/link';
import { Bookmark, Clock3, EyeOff, Heart, History, PlayCircle, ThumbsUp } from 'lucide-react';
import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import {
  entryToMediaItem,
  getContinueWatchingItems,
  getDroppedItems,
  getFavoriteItems,
  getRecentlyWatchedItems,
  getSavedForLaterItems,
  summarizeUserProfile,
  useUserProfile,
} from '@/lib/user-profile';
import { formatVoteCount } from '@/lib/utils';

export function UserDashboardClient() {
  const profile = useUserProfile();
  const summary = summarizeUserProfile(profile);
  const resume = getContinueWatchingItems(profile).slice(0, 12).map(entryToMediaItem);
  const favorites = getFavoriteItems(profile).slice(0, 12).map(entryToMediaItem);
  const saved = getSavedForLaterItems(profile).slice(0, 12).map(entryToMediaItem);
  const dropped = getDroppedItems(profile).slice(0, 12).map(entryToMediaItem);
  const history = getRecentlyWatchedItems(profile, 24);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="app-shell pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="border-b border-zinc-800 pb-6 sm:pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your Library</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Everything you opened, resumed, finished, and favorited lives here automatically on this device.
            </p>

            <div className="mt-6 grid gap-0 border border-zinc-800 sm:grid-cols-4">
              <div className="border-b border-zinc-800 px-4 py-4 sm:border-b-0 sm:border-r">
                <div className="text-zinc-500">Tracked titles</div>
                <div className="mt-1 text-2xl font-medium text-white">{summary.titlesTracked}</div>
              </div>
              <div className="border-b border-zinc-800 px-4 py-4 sm:border-b-0 sm:border-r">
                <div className="text-zinc-500">Watch hours</div>
                <div className="mt-1 text-2xl font-medium text-white">{summary.totalHours.toFixed(1)}</div>
              </div>
              <div className="border-b border-zinc-800 px-4 py-4 sm:border-b-0 sm:border-r">
                <div className="text-zinc-500">Favorites</div>
                <div className="mt-1 text-2xl font-medium text-white">{summary.favorites}</div>
              </div>
              <div className="px-4 py-4">
                <div className="text-zinc-500">Saved</div>
                <div className="mt-1 text-2xl font-medium text-white">{summary.saved}</div>
              </div>
            </div>
          </section>
        </div>

        {resume.length > 0 && <MovieSectionClient title="Continue Watching" movies={resume} />}
        {favorites.length > 0 && <MovieSectionClient title="Favorites" movies={favorites} />}
        {saved.length > 0 && <MovieSectionClient title="Saved For Later" movies={saved} />}
        {dropped.length > 0 && <MovieSectionClient title="Pick Back Up" movies={dropped} />}

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border border-zinc-800">
            <div className="grid grid-cols-[1.4fr_auto_auto_auto] items-center gap-3 border-b border-zinc-800 px-4 py-3 text-xs text-zinc-500">
              <div>Title</div>
              <div className="hidden sm:block">Progress</div>
              <div className="hidden md:block">Rating</div>
              <div className="text-right">Last watched</div>
            </div>

            {history.length > 0 ? (
              history.map((entry) => {
                const href =
                  entry.mediaType === 'tv'
                    ? `/watch/tv/${entry.tmdbId}/1/1`
                    : `/watch/movie/${entry.tmdbId}`;
                return (
                  <Link
                    key={entry.key}
                    href={href}
                    className="grid grid-cols-[1.4fr_auto_auto_auto] items-center gap-3 border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-900/70 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-white">
                        {entry.hidden ? (
                          <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
                        ) : entry.favorite ? (
                          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        ) : entry.savedForLater ? (
                          <Bookmark className="h-3.5 w-3.5 text-zinc-300" />
                        ) : entry.preference === 'like' ? (
                          <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <History className="h-3.5 w-3.5 text-zinc-600" />
                        )}
                        <span className="truncate">{entry.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        <span>{entry.mediaType === 'movie' ? 'Movie' : 'Series'}</span>
                        {entry.releaseDate ? <span>{entry.releaseDate.slice(0, 4)}</span> : null}
                        {entry.genres[0] ? <span>{entry.genres[0].name}</span> : null}
                      </div>
                    </div>
                    <div className="hidden text-sm text-zinc-300 sm:block">
                      {entry.progressPercent ? `${Math.round(entry.progressPercent)}%` : 'Started'}
                    </div>
                    <div className="hidden text-sm text-zinc-300 md:block">
                      {entry.voteAverage > 0 ? `TMDB ${entry.voteAverage.toFixed(1)} (${formatVoteCount(entry.voteCount)})` : '—'}
                    </div>
                    <div className="justify-self-end text-right text-xs text-zinc-500">
                      {new Date(entry.lastViewedAt).toLocaleDateString()}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-6 py-16 text-center text-zinc-500">
                <PlayCircle className="mx-auto h-8 w-8 text-zinc-700" />
                <p className="mt-4 text-white">Nothing tracked yet.</p>
                <p className="mt-2 text-sm">Open a movie or series and your watch history starts filling in automatically.</p>
              </div>
            )}
          </div>

          {summary.topGenres.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="border border-zinc-800 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock3 className="h-4 w-4" />
                  Most watched genres
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.topGenres.map((genre) => (
                    <span key={genre} className="border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border border-zinc-800 px-4 py-4 sm:col-span-2">
                <div className="text-sm text-zinc-500">What this device remembers</div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                  Resume position, total watch time, favorites, saved titles, likes, hidden titles, completion state,
                  genres, people, and theme keywords are all stored locally in this browser.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
