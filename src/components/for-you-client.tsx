'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { MovieSectionClient } from '@/components/movie-section-client';
import { Skeleton } from '@/components/ui/skeleton';
import { buildForYouSections, deriveTasteProfile, RecommendationSection } from '@/lib/recommendations';
import { entryToMediaItem, getContinueWatchingItems, summarizeUserProfile, useUserProfile } from '@/lib/user-profile';

function RecommendationFeed({ profileKey }: { profileKey: string }) {
  const profile = useUserProfile();
  const [sections, setSections] = useState<RecommendationSection[] | null>(null);

  useEffect(() => {
    let active = true;
    buildForYouSections(profile).then((next) => {
      if (active) setSections(next);
    });
    return () => {
      active = false;
    };
  }, [profile]);

  if (sections === null) {
    return (
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-zinc-400 sm:px-6 lg:px-8">
        <div className="border border-dashed border-zinc-800 px-6 py-12 text-center">
          <p className="text-white">No recommendation data yet.</p>
          <p className="mt-2 text-sm text-zinc-500">Start a few titles and this page will adapt.</p>
          <Link
            href="/movies"
            className="mt-5 inline-flex h-10 items-center justify-center border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            Browse movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div key={profileKey} className="space-y-1">
      {sections.map((section) => (
        <MovieSectionClient key={section.id} title={section.title} movies={section.items} />
      ))}
    </div>
  );
}

export function ForYouClient() {
  const profile = useUserProfile();
  const summary = summarizeUserProfile(profile);
  const taste = deriveTasteProfile(profile);
  const continueWatching = getContinueWatchingItems(profile).slice(0, 12).map(entryToMediaItem);
  const profileKey = profile.updatedAt ?? `empty-${profile.items.length}`;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="app-shell pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="border-b border-zinc-800/80 pb-5 pt-1">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">For You</h1>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
                  Picks adapt from what you watch—starts, finishes, revisits, and favorites.
                </p>
              </div>
              <p
                className="shrink-0 text-[11px] tabular-nums text-zinc-500 sm:text-xs"
                aria-label={`${summary.titlesTracked} titles tracked, ${summary.totalHours.toFixed(1)} hours, ${summary.favorites} favorites, ${summary.completed} finished`}
              >
                <span className="text-zinc-400">{summary.titlesTracked}</span> tracked
                <span className="mx-1.5 text-zinc-700" aria-hidden>
                  ·
                </span>
                <span className="text-zinc-400">{summary.totalHours.toFixed(1)}</span>h
                <span className="mx-1.5 text-zinc-700" aria-hidden>
                  ·
                </span>
                <span className="text-zinc-400">{summary.favorites}</span> fav
                <span className="mx-1.5 text-zinc-700" aria-hidden>
                  ·
                </span>
                <span className="text-zinc-400">{summary.completed}</span> done
              </p>
            </div>

            {taste.topGenres.length > 0 && (
              <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-600 sm:text-xs">
                {taste.topGenres
                  .slice(0, 5)
                  .map((g) => g.name)
                  .join(' · ')}
              </p>
            )}
          </header>
        </div>

        {continueWatching.length > 0 && (
          <MovieSectionClient title="Resume Watching" movies={continueWatching} />
        )}

        <RecommendationFeed key={profileKey} profileKey={profileKey} />
      </main>
    </div>
  );
}
