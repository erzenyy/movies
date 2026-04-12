'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
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
          <section className="border-b border-zinc-800 pb-6 sm:pb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-center gap-2 text-zinc-500">
                  <Sparkles className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Adaptive recommendation feed</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">For You</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  This page learns from what you actually start, finish, revisit, and favorite. The more you watch,
                  the sharper these shelves become.
                </p>
              </div>

              <div className="grid grid-cols-2 border border-zinc-800 text-sm sm:grid-cols-4">
                <div className="border-b border-r border-zinc-800 px-4 py-3 sm:border-b-0">
                  <div className="text-zinc-500">Tracked</div>
                  <div className="mt-1 text-lg font-medium text-white">{summary.titlesTracked}</div>
                </div>
                <div className="border-b border-zinc-800 px-4 py-3 sm:border-b-0 sm:border-r">
                  <div className="text-zinc-500">Hours</div>
                  <div className="mt-1 text-lg font-medium text-white">{summary.totalHours.toFixed(1)}</div>
                </div>
                <div className="border-r border-zinc-800 px-4 py-3">
                  <div className="text-zinc-500">Favorites</div>
                  <div className="mt-1 text-lg font-medium text-white">{summary.favorites}</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-zinc-500">Taste</div>
                  <div className="mt-1 text-sm font-medium text-white">
                    {taste.topGenres[0]?.name ?? 'Still learning'}
                  </div>
                </div>
              </div>
            </div>

            {taste.topGenres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {taste.topGenres.slice(0, 5).map((genre) => (
                  <span
                    key={genre.id}
                    className="inline-flex items-center border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {continueWatching.length > 0 && (
          <MovieSectionClient title="Resume Watching" movies={continueWatching} />
        )}

        <RecommendationFeed key={profileKey} profileKey={profileKey} />
      </main>
    </div>
  );
}
