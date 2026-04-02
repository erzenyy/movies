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
      <div className="relative h-[70vh] min-h-[500px] w-full">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!featured) {
    // Static hero when no data at all
    return (
      <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-900" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-16 lg:pb-24">
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center">
                <Film className="w-7 h-7 text-red-500" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Welcome to MovieFlix
            </h1>
            <p className="text-zinc-300 text-lg max-w-xl">
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
    <div className="relative h-[70vh] min-h-[580px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {hasBg ? (
          <Image
            src={featured._heroBg}
            alt={featured._heroTitle}
            fill
            className="object-cover"
            priority
            loading="eager"
            sizes="100vw"
            unoptimized={featured._source === 'tvmaze'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-900" />
        )}
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/30" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pt-24 pb-12 lg:pb-20">
        <div className="max-w-2xl space-y-4">
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

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight line-clamp-2">
            {featured._heroTitle}
          </h1>

          <p className="text-zinc-300 text-lg line-clamp-3 max-w-xl">
            {featured.overview}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{featured._heroDate ? new Date(featured._heroDate).getFullYear() : 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href={featured._heroHref}>
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white gap-2 px-8"
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
