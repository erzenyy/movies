'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovieCard } from './movie-card';
import { Movie, TVShow } from '@/lib/types';

interface MovieSectionClientProps {
  title: string;
  movies: (Movie | TVShow)[];
  mediaType?: 'movie' | 'tv';
}

export function MovieSectionClient({ title, movies, mediaType }: MovieSectionClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="min-w-0 pr-2 text-lg font-bold leading-snug text-white sm:text-2xl">{title}</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-zinc-800 hidden sm:flex"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-zinc-800 hidden sm:flex"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain scrollbar-hide pt-5 pb-10 -mx-3 px-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory scroll-pl-3 sm:scroll-pl-6 [-webkit-overflow-scrolling:touch]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div
              key={`${movie.media_type ?? mediaType ?? ('title' in movie ? 'movie' : 'tv')}-${movie.id}`}
              className="flex-shrink-0 w-[9.25rem] sm:w-48 lg:w-52 snap-start"
            >
              <MovieCard movie={movie} mediaType={mediaType} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
