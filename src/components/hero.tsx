'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Calendar, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie, TVShow } from '@/lib/types';
import { getTrendingMovies, getBackdropUrl } from '@/lib/tmdb';
import { getPopularTVMazeShows } from '@/lib/tvmaze';

type FeaturedItem = (Movie | TVShow) & { _heroTitle: string; _heroDate: string; _heroHref: string; _heroBg: string };

export function Hero() {
  const [featured, setFeatured] = useState<FeaturedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Try TMDB first
        const movies = await getTrendingMovies();
        if (movies.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, movies.length));
          const m = movies[randomIndex];
          setFeatured({
            ...m,
            _heroTitle: m.title,
            _heroDate: m.release_date,
            _heroHref: `/watch/movie/${m.id}`,
            _heroBg: getBackdropUrl(m.backdrop_path),
          });
          return;
        }

        // Fallback to TVMaze
        const tvShows = await getPopularTVMazeShows();
        if (tvShows.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, tvShows.length));
          const s = tvShows[randomIndex];
          setFeatured({
            ...s,
            _heroTitle: s.name,
            _heroDate: s.first_air_date,
            _heroHref: `/watch/tv/${s.id}/1/1`,
            _heroBg: s._tvmazeImage || '',
          });
        }
      } catch (error) {
        console.error('Error fetching featured:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-[22rem] w-full sm:min-h-[26rem] lg:h-[70vh] lg:min-h-[500px]">
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      </div>
    );
  }

  if (!featured) {
    // Static hero when no data at all
    return (
      <div className="relative min-h-[22rem] w-full overflow-hidden sm:min-h-[26rem] lg:h-[70vh] lg:min-h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-900" />
        <div className="relative mx-auto flex min-h-[22rem] max-w-7xl flex-col justify-end px-4 pb-12 pt-24 sm:min-h-[26rem] sm:px-6 sm:pb-16 lg:min-h-0 lg:h-full lg:pb-24 lg:px-8">
          <div className="max-w-2xl space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center">
                <Film className="w-7 h-7 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Welcome to MovieFlix
            </h1>
            <p className="text-zinc-300 text-base sm:text-lg max-w-xl">
              Stream thousands of movies and TV shows. Browse the collection below or search for your favorites.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rating = featured.vote_average ?? 0;
  const hasBg = featured._heroBg && featured._heroBg.length > 0;

  return (
    <div className="relative w-full overflow-hidden min-h-[28rem] sm:min-h-[32rem] lg:h-[70vh] lg:min-h-[560px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {hasBg ? (
          <Image
            src={featured._heroBg}
            alt={featured._heroTitle}
            fill
            className="object-cover object-[center_20%] sm:object-center"
            priority
            loading="eager"
            sizes="100vw"
            unoptimized={featured._source === 'tvmaze'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-900" />
        )}
        {/* Gradient Overlays — stronger bottom on small screens for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/40 sm:via-zinc-950/70 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/50 sm:via-transparent sm:to-zinc-950/30" />
      </div>

      {/* Content — min-height on small screens so text/button are not clipped; overlap handled in page.tsx */}
      <div className="relative z-10 mx-auto flex min-h-[28rem] w-full max-w-7xl flex-col justify-end px-4 pt-20 pb-12 sm:min-h-[32rem] sm:px-6 sm:pt-24 sm:pb-14 lg:min-h-0 lg:h-full lg:px-8 lg:pb-20">
        <div className="max-w-2xl w-full min-w-0 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-red-600 hover:bg-red-700 text-white border-0">
              {featured._source === 'tvmaze' ? 'Airing Now' : 'Trending Now'}
            </Badge>
            {rating > 0 && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight line-clamp-4 sm:line-clamp-3 lg:line-clamp-2">
            {featured._heroTitle}
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base sm:leading-normal lg:text-lg line-clamp-5 sm:line-clamp-4 lg:line-clamp-3">
            {featured.overview}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{featured._heroDate ? new Date(featured._heroDate).getFullYear() : 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2">
            <Link href={featured._heroHref} className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white gap-2 px-8"
              >
                <Play className="w-5 h-5 fill-white" />
                Watch Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
