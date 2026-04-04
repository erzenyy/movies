import { MovieCard } from '@/components/movie-card';
import { Movie, TVShow } from '@/lib/types';

export function BrowseMediaGrid({
  title,
  subtitle,
  items,
  mediaType,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  items: (Movie | TVShow)[];
  mediaType: 'movie' | 'tv';
  emptyMessage: string;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 py-12 text-center text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((m) => (
            <MovieCard key={`${mediaType}-${m.id}`} movie={m} mediaType={mediaType} />
          ))}
        </div>
      )}
    </section>
  );
}
