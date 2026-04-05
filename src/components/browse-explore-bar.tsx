'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
  NormalizedBrowseCurrent,
  DEFAULT_SORT,
} from '@/lib/browse-filters';
import { buildBrowseQuery } from '@/lib/browse-url';

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:border-red-500/40 outline-none disabled:cursor-not-allowed disabled:opacity-40';

type FilterField = keyof Omit<NormalizedBrowseCurrent, 'q' | 'sort'>;

function countActiveFilters(state: NormalizedBrowseCurrent, variant: BrowseVariant): number {
  let count = 0;
  if (state.g) count++;
  if (state.year) count++;
  if (state.lang) count++;
  if (state.origin) count++;
  if (state.rating) count++;
  if (state.votes) count++;
  if (state.runtime) count++;
  if (state.sort && state.sort !== DEFAULT_SORT[variant]) count++;
  return count;
}

function getFilterLabel(
  field: FilterField,
  value: string,
  genres: { id: number; name: string }[],
  variant: BrowseVariant
): string | null {
  if (!value) return null;
  if (field === 'g') {
    const genre = genres.find((g) => String(g.id) === value);
    return genre ? genre.name : null;
  }
  if (field === 'year') return value;
  if (field === 'lang') {
    const map: Record<string, string> = {
      en: 'English', ko: 'Korean', ja: 'Japanese', es: 'Spanish',
      fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
      hi: 'Hindi', tr: 'Turkish', sv: 'Swedish',
    };
    return map[value] ?? value;
  }
  if (field === 'origin') {
    const map: Record<string, string> = {
      US: 'USA', GB: 'UK', KR: 'Korea', JP: 'Japan', IN: 'India',
      FR: 'France', ES: 'Spain', DE: 'Germany', IT: 'Italy', TR: 'Turkey', MX: 'Mexico',
    };
    return map[value] ?? value;
  }
  if (field === 'rating') return `${value}+ Score`;
  if (field === 'votes') {
    const n = parseInt(value, 10);
    return n >= 1000 ? `${n / 1000}k+ Votes` : `${n}+ Votes`;
  }
  if (field === 'runtime') {
    if (variant === 'movie') {
      const map: Record<string, string> = { swift: '<95m', feature: '95-119m', long: '120-149m', epic: '150m+' };
      return map[value] ?? value;
    } else {
      const map: Record<string, string> = { swift: '<25m', standard: '25-44m', hour: '45-64m', extended: '65m+' };
      return map[value] ?? value;
    }
  }
  return null;
}

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
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = (open: boolean) => {
    if (open) setSheetState(formState);
    setSheetOpen(open);
  };

  const normalizedCurrent = useMemo(
    () => normalizeBrowseCurrent(current, variant),
    [current, variant]
  );

  const [formState, setFormState] = useState(normalizedCurrent);
  const [sheetState, setSheetState] = useState(normalizedCurrent);

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

  const activeFilterCount = countActiveFilters(normalizedCurrent, variant);

  const activeChips = useMemo(() => {
    const chips: { field: FilterField; label: string }[] = [];
    const fields: FilterField[] = ['g', 'year', 'lang', 'origin', 'rating', 'votes', 'runtime'];
    for (const field of fields) {
      const val = normalizedCurrent[field];
      const label = getFilterLabel(field, val, genres, variant);
      if (label) chips.push({ field, label });
    }
    return chips;
  }, [normalizedCurrent, genres, variant]);

  const navigate = (state: typeof formState) => {
    const query = state.q.trim().length > 0
      ? buildBrowseQuery({ q: state.q })
      : buildBrowseQuery(state);
    startTransition(() => {
      router.push(`${basePath}${query}`);
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(formState);
  };

  const handleSortChange = (value: string) => {
    const next = { ...formState, sort: value };
    setFormState(next);
    navigate(next);
  };

  const setSheetField = (field: keyof typeof sheetState, value: string) => {
    setSheetState((s) => ({ ...s, [field]: value }));
  };

  const handleSheetApply = () => {
    const next = { ...sheetState };
    setFormState(next);
    setSheetOpen(false);
    navigate(next);
  };

  const removeChip = (field: FilterField) => {
    const next = { ...formState, [field]: '' };
    setFormState(next);
    navigate(next);
  };

  return (
    <section className="mt-6 mb-2">
      {/* Main bar: search + sort + filters button */}
      <form onSubmit={handleSearchSubmit} autoComplete="off">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
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
              placeholder={variant === 'movie' ? 'Search movies…' : 'Search series…'}
              value={formState.q}
              onChange={(e) => setFormState((s) => ({ ...s, q: e.target.value }))}
              className="h-10 border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-red-500/40 focus-visible:ring-red-500/20"
            />
          </div>

          {/* Sort — hidden in search mode */}
          {!searchMode && (
            <select
              aria-label="Sort"
              value={formState.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="hidden h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white transition-colors focus-visible:border-red-500/40 focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:outline-none sm:block"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {/* Filters sheet trigger */}
          {!searchMode && (
              <Sheet open={sheetOpen} onOpenChange={openSheet}>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="relative h-10 gap-2 border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                  />
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </SheetTrigger>

              <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 border-zinc-800 bg-zinc-950 p-0 sm:max-w-sm"
              >
                <SheetHeader className="border-b border-zinc-800 px-5 py-4">
                  <SheetTitle className="text-base font-semibold text-white">Filters</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                  {/* Sort (mobile-only inside sheet) */}
                  <div className="sm:hidden">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Sort By</label>
                    <select
                      value={sheetState.sort}
                      onChange={(e) => setSheetField('sort', e.target.value)}
                      className={selectClass}
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Genre</label>
                    <select
                      value={sheetState.g}
                      onChange={(e) => setSheetField('g', e.target.value)}
                      className={selectClass}
                    >
                      <option value="">All Genres</option>
                      {genres.map((g) => (
                        <option key={g.id} value={String(g.id)}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Year</label>
                    <select
                      value={sheetState.year}
                      onChange={(e) => setSheetField('year', e.target.value)}
                      className={selectClass}
                    >
                      {years.map((y) => (
                        <option key={y.value || 'any'} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Language */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Language</label>
                      <select
                        value={sheetState.lang}
                        onChange={(e) => setSheetField('lang', e.target.value)}
                        className={selectClass}
                      >
                        {languageOptions.map((o) => (
                          <option key={o.value || 'all-lang'} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Origin country */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Country</label>
                      <select
                        value={sheetState.origin}
                        onChange={(e) => setSheetField('origin', e.target.value)}
                        className={selectClass}
                      >
                        {originOptions.map((o) => (
                          <option key={o.value || 'all-origin'} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Rating */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Min Score</label>
                      <select
                        value={sheetState.rating}
                        onChange={(e) => setSheetField('rating', e.target.value)}
                        className={selectClass}
                      >
                        {ratingOptions.map((o) => (
                          <option key={o.value || 'any-score'} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Votes */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Min Votes</label>
                      <select
                        value={sheetState.votes}
                        onChange={(e) => setSheetField('votes', e.target.value)}
                        className={selectClass}
                      >
                        {voteOptions.map((o) => (
                          <option key={o.value || 'any-votes'} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Runtime */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      {variant === 'movie' ? 'Runtime' : 'Episode Length'}
                    </label>
                    <select
                      value={sheetState.runtime}
                      onChange={(e) => setSheetField('runtime', e.target.value)}
                      className={selectClass}
                    >
                      {runtimeOptions.map((o) => (
                        <option key={o.value || 'any-runtime'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick presets */}
                  <div>
                    <p className="mb-2.5 text-xs font-medium text-zinc-400">Quick Presets</p>
                    <div className="flex flex-wrap gap-2">
                      {quickFilters.map((filter) => (
                        <Link
                          key={filter.label}
                          href={filter.href}
                          onClick={() => setSheetOpen(false)}
                          className="inline-flex h-8 items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
                        >
                          {filter.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <SheetFooter className="border-t border-zinc-800 px-5 py-4 flex-row gap-2">
                  <Link
                    href={basePath}
                    onClick={() => setSheetOpen(false)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                  >
                    Reset All
                  </Link>
                  <Button
                    type="button"
                    onClick={handleSheetApply}
                    disabled={isPending}
                    className="h-10 flex-1 bg-red-600 text-white hover:bg-red-700"
                  >
                    {isPending ? 'Applying…' : 'Apply Filters'}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}

          {/* Submit search button (visible when typing) */}
          {searchMode && (
            <>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 bg-red-600 text-white hover:bg-red-700"
              >
                {isPending ? 'Searching…' : 'Search'}
              </Button>
              <Link
                href={basePath}
                className="inline-flex h-10 items-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                Clear
              </Link>
            </>
          )}
        </div>
      </form>

      {/* Active filter chips */}
      {activeChips.length > 0 && !searchMode && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Active:</span>
          {activeChips.map(({ field, label }) => (
            <button
              key={field}
              type="button"
              onClick={() => removeChip(field)}
              className="group inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 pl-2.5 pr-2 text-xs text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-red-950/40 hover:text-white"
            >
              {label}
              <X className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-red-400" />
            </button>
          ))}
          <Link
            href={basePath}
            className="inline-flex h-7 items-center rounded-full px-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Clear all
          </Link>
        </div>
      )}
    </section>
  );
}
