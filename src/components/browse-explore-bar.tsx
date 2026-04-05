'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BrowseVariant,
  BrowseCurrent,
  getLanguageOptions,
  getOriginOptions,
  getQuickFilterLinks,
  getRatingOptions,
  getRuntimeOptions,
  getSortOptions,
  getVoteOptions,
  normalizeBrowseCurrent,
} from '@/lib/browse-filters';
import { buildBrowseQuery } from '@/lib/browse-url';

export function BrowseExploreBar({
  basePath,
  variant,
  genres,
  current,
}: {
  basePath: '/movies' | '/tv-shows';
  variant: BrowseVariant;
  genres: { id: number; name: string }[];
  current: BrowseCurrent;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const normalizedCurrent = useMemo(
    () => normalizeBrowseCurrent(current, variant),
    [current, variant]
  );

  const [formState, setFormState] = useState(normalizedCurrent);

  useEffect(() => {
    setFormState(normalizedCurrent);
  }, [normalizedCurrent]);

  const sortOptions = getSortOptions(variant);
  const years = useMemo(() => {
    const from = new Date().getFullYear();
    const options: { value: string; label: string }[] = [{ value: '', label: 'Any Year' }];
    for (let year = from; year >= from - 80; year -= 1) {
      options.push({ value: String(year), label: String(year) });
    }
    return options;
  }, []);
  const runtimeOptions = getRuntimeOptions(variant);
  const languageOptions = getLanguageOptions();
  const originOptions = getOriginOptions();
  const ratingOptions = getRatingOptions();
  const voteOptions = getVoteOptions();
  const quickFilters = getQuickFilterLinks(basePath, variant);
  const searchMode = formState.q.trim().length > 0;
  const selectClass =
    'flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-white focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-45';

  const submitForm = (nextState = formState) => {
    const query = searchMode ? buildBrowseQuery({ q: nextState.q }) : buildBrowseQuery(nextState);
    startTransition(() => {
      router.push(`${basePath}${query}`);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitForm();
  };

  const setField = (field: keyof typeof formState, value: string) => {
    setFormState((state) => ({
      ...state,
      [field]: value,
    }));
  };

  return (
    <section className="mt-8 border border-zinc-800 bg-zinc-950/70">
      <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-5 sm:py-5" autoComplete="off">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
          <div className="min-w-0 xl:col-span-2">
            <label htmlFor={`${variant}-browse-q`} className="mb-1.5 block text-sm text-zinc-400">
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <Input
                id={`${variant}-browse-q`}
                name="q"
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder={variant === 'movie' ? 'Search the catalog…' : 'Search series…'}
                value={formState.q}
                onChange={(event) => setField('q', event.target.value)}
                className="border-zinc-800 bg-zinc-950 pl-10 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-sort`} className="mb-1.5 block text-sm text-zinc-400">
              Sort
            </label>
            <select
              id={`${variant}-browse-sort`}
              name="sort"
              value={formState.sort}
              onChange={(event) => setField('sort', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-g`} className="mb-1.5 block text-sm text-zinc-400">
              Genre
            </label>
            <select
              id={`${variant}-browse-g`}
              name="g"
              value={formState.g}
              onChange={(event) => setField('g', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={String(genre.id)}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-year`} className="mb-1.5 block text-sm text-zinc-400">
              Year
            </label>
            <select
              id={`${variant}-browse-year`}
              name="year"
              value={formState.year}
              onChange={(event) => setField('year', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {years.map((year) => (
                <option key={year.value || 'any-year'} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 xl:self-end">
            <Link
              href={basePath}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              Reset
            </Link>
            <Button type="submit" className="h-10 flex-1 bg-red-600 text-white hover:bg-red-700">
              {isPending ? 'Applying…' : 'Apply'}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label htmlFor={`${variant}-browse-lang`} className="mb-1.5 block text-sm text-zinc-400">
              Language
            </label>
            <select
              id={`${variant}-browse-lang`}
              name="lang"
              value={formState.lang}
              onChange={(event) => setField('lang', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {languageOptions.map((option) => (
                <option key={option.value || 'all-languages'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-origin`} className="mb-1.5 block text-sm text-zinc-400">
              Origin
            </label>
            <select
              id={`${variant}-browse-origin`}
              name="origin"
              value={formState.origin}
              onChange={(event) => setField('origin', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {originOptions.map((option) => (
                <option key={option.value || 'all-origins'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-rating`} className="mb-1.5 block text-sm text-zinc-400">
              Minimum Score
            </label>
            <select
              id={`${variant}-browse-rating`}
              name="rating"
              value={formState.rating}
              onChange={(event) => setField('rating', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {ratingOptions.map((option) => (
                <option key={option.value || 'any-score'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-votes`} className="mb-1.5 block text-sm text-zinc-400">
              Audience Depth
            </label>
            <select
              id={`${variant}-browse-votes`}
              name="votes"
              value={formState.votes}
              onChange={(event) => setField('votes', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {voteOptions.map((option) => (
                <option key={option.value || 'any-votes'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${variant}-browse-runtime`} className="mb-1.5 block text-sm text-zinc-400">
              {variant === 'movie' ? 'Runtime' : 'Episode Length'}
            </label>
            <select
              id={`${variant}-browse-runtime`}
              name="runtime"
              value={formState.runtime}
              onChange={(event) => setField('runtime', event.target.value)}
              disabled={searchMode}
              className={selectClass}
            >
              {runtimeOptions.map((option) => (
                <option key={option.value || 'any-runtime'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-800 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {quickFilters.map((filter) => (
              <Link
                key={filter.label}
                href={filter.href}
                className="inline-flex h-8 items-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              >
                {filter.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            {formState.q
              ? 'Search mode is active. Clear Search to use the full discovery stack and curated suggestion presets.'
              : 'Use the suggestion links for a faster starting point, then refine with the controls above.'}
          </p>
        </div>
      </form>
    </section>
  );
}
