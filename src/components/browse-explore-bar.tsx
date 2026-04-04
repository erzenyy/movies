import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SORT_MOVIE = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Highest rated' },
  { value: 'release_date.desc', label: 'Newest releases' },
  { value: 'revenue.desc', label: 'Box office' },
] as const;

const SORT_TV = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Highest rated' },
  { value: 'first_air_date.desc', label: 'Newest seasons' },
] as const;

function yearOptions(from = new Date().getFullYear(), back = 70) {
  const years: { value: string; label: string }[] = [{ value: '', label: 'Any year' }];
  for (let y = from; y >= from - back; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export function BrowseExploreBar({
  basePath,
  variant,
  genres,
  current,
}: {
  basePath: '/movies' | '/tv-shows';
  variant: 'movie' | 'tv';
  genres: { id: number; name: string }[];
  current: { q?: string; g?: string; sort?: string; year?: string };
}) {
  const sortOptions = variant === 'movie' ? SORT_MOVIE : SORT_TV;
  const years = yearOptions();
  const defaultSort = variant === 'movie' ? 'popularity.desc' : 'popularity.desc';

  return (
    <form
      action={basePath}
      method="get"
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor="browse-q" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="browse-q"
              name="q"
              type="search"
              placeholder={variant === 'movie' ? 'Search movies worldwide…' : 'Search TV shows worldwide…'}
              defaultValue={current.q ?? ''}
              className="border-zinc-700 bg-zinc-950/80 pl-10 text-white placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:w-[min(100%,42rem)] lg:shrink-0">
          <div>
            <label htmlFor="browse-g" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Genre
            </label>
            <select
              id="browse-g"
              name="g"
              defaultValue={current.g ?? ''}
              className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-950/80 px-3 text-sm text-white shadow-sm focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="browse-sort" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Sort
            </label>
            <select
              id="browse-sort"
              name="sort"
              defaultValue={current.sort ?? defaultSort}
              className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-950/80 px-3 text-sm text-white shadow-sm focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="browse-year" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Year
            </label>
            <select
              id="browse-year"
              name="year"
              defaultValue={current.year ?? ''}
              className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-950/80 px-3 text-sm text-white shadow-sm focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              {years.map((y) => (
                <option key={y.value || 'any'} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full shrink-0 bg-red-600 hover:bg-red-700 lg:w-auto">
          Apply
        </Button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Results include titles from TMDB’s global catalog. Use filters to narrow by genre, year, or sort order.
      </p>
    </form>
  );
}
