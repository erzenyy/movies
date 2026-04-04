import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildBrowseQuery } from '@/lib/browse-url';
import { cn } from '@/lib/utils';

const btnClass =
  'inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-md border border-zinc-700 px-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40';

export function BrowsePagination({
  basePath,
  page,
  totalPages,
  params,
}: {
  basePath: '/movies' | '/tv-shows';
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const next = { ...params, page: p > 1 ? String(p) : undefined };
    return `${basePath}${buildBrowseQuery(next)}`;
  };

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={btnClass}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className={cn(btnClass, 'cursor-not-allowed opacity-40')}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}
      <span className="px-3 text-sm text-zinc-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={btnClass}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(btnClass, 'cursor-not-allowed opacity-40')}>
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
