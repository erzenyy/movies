'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Movie, TVShow } from '@/lib/types';
import { getCanonicalTmdbId } from '@/lib/media';
import { getImageUrl } from '@/lib/tmdb';
import { cn, formatVoteCount } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie | TVShow;
  mediaType?: 'movie' | 'tv';
}

export function MovieCard({ movie, mediaType }: MovieCardProps) {
  const title = 'title' in movie ? movie.title : movie.name;
  const date = 'release_date' in movie ? movie.release_date : movie.first_air_date;
  const resolvedMediaType = mediaType ?? movie.media_type ?? ('title' in movie ? 'movie' : 'tv');
  const watchId = getCanonicalTmdbId(movie) ?? movie.id;
  const href =
    resolvedMediaType === 'tv' ? `/watch/tv/${watchId}/1/1` : `/watch/movie/${watchId}`;
  const rating = movie.vote_average ?? 0;
  const votes = movie.vote_count ?? 0;

  return (
    <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-xl">
      <article
        className={cn(
          'group relative cursor-pointer rounded-xl',
          'transition-[transform,box-shadow] duration-300 ease-out',
          'sm:hover:-translate-y-1.5 sm:hover:scale-[1.02]',
          'sm:hover:shadow-[0_28px_56px_-16px_rgba(0,0,0,0.75),0_0_0_1px_rgba(239,68,68,0.12),0_0_40px_-8px_rgba(220,38,38,0.2)]',
          'active:scale-[0.99] sm:active:translate-y-0 sm:active:scale-100'
        )}
      >
        <div
          className={cn(
            'aspect-[2/3] relative overflow-hidden rounded-xl',
            'ring-1 ring-white/[0.07] transition-[ring-color,box-shadow] duration-300',
            'shadow-lg shadow-black/50',
            'sm:group-hover:ring-red-500/35 sm:group-hover:shadow-red-950/30'
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-xl opacity-0 transition-opacity duration-300 sm:group-hover:opacity-100"
            aria-hidden
          >
            <div className="absolute inset-y-0 w-[45%] -left-1/3 skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent translate-x-0 transition-transform duration-700 ease-out sm:group-hover:translate-x-[280%]" />
          </div>

          {movie.poster_path || ('_tvmazeImage' in movie && movie._tvmazeImage) ? (
            <Image
              src={
                '_tvmazeImage' in movie && movie._tvmazeImage
                  ? movie._tvmazeImage
                  : getImageUrl(movie.poster_path, 'w500')
              }
              alt={title}
              fill
              className="object-cover transition-transform duration-500 ease-out sm:group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-700/50 flex items-center justify-center transition-transform duration-300 sm:group-hover:scale-110">
                <Film className="w-7 h-7 text-zinc-500" />
              </div>
              <span className="text-zinc-500 text-xs font-medium text-center px-3 line-clamp-2">{title}</span>
            </div>
          )}

          <div
            className="absolute inset-0 z-[3] bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent opacity-0 transition-opacity duration-300 hidden sm:block sm:group-hover:opacity-95"
            aria-hidden
          />

          <div className="absolute inset-0 z-[4] hidden sm:flex items-center justify-center opacity-0 scale-90 transition-[opacity,transform] duration-300 ease-out sm:group-hover:opacity-100 sm:group-hover:scale-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-xl shadow-red-900/50 ring-2 ring-white/20 transition-transform duration-300 sm:group-hover:scale-110">
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            </div>
          </div>

          {rating > 0 && (
            <div className="absolute top-2 right-2 z-[5] transition-transform duration-300 sm:group-hover:scale-105 sm:group-hover:-translate-y-0.5">
              <Badge
                variant="secondary"
                className="border-0 bg-zinc-950/85 text-yellow-400 backdrop-blur-md text-[11px] px-1.5 py-0.5 shadow-md shadow-black/40 ring-1 ring-white/10"
              >
                <Star className="w-3 h-3 mr-0.5 fill-yellow-400" />
                {rating.toFixed(1)}
                {votes > 0 ? ` (${formatVoteCount(votes, true)})` : ''}
              </Badge>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-[5] bg-gradient-to-t from-zinc-950 via-zinc-950/88 to-transparent p-2.5 pt-10 sm:p-3 sm:pt-9 transition-[padding] duration-300 sm:group-hover:pt-11">
            <h3 className="line-clamp-2 text-left text-xs font-semibold leading-tight text-white sm:text-sm transition-[color,text-shadow] duration-300 sm:group-hover:text-white sm:group-hover:drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {title}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400 transition-colors duration-300 sm:group-hover:text-zinc-300">
              <Calendar className="h-3 w-3 shrink-0 opacity-80" />
              <span>{date ? new Date(date).getFullYear() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
