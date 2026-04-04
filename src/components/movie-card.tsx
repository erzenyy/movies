'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Movie, TVShow } from '@/lib/types';
import { getCanonicalTmdbId } from '@/lib/media';
import { getImageUrl } from '@/lib/tmdb';

interface MovieCardProps {
  movie: Movie | TVShow;
  mediaType?: 'movie' | 'tv';
}

export function MovieCard({ movie, mediaType = 'movie' }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const title = 'title' in movie ? movie.title : movie.name;
  const date = 'release_date' in movie ? movie.release_date : movie.first_air_date;
  const watchId = getCanonicalTmdbId(movie) ?? movie.id;
  const href = mediaType === 'tv' 
    ? `/watch/tv/${watchId}/1/1` 
    : `/watch/movie/${watchId}`;
  const rating = movie.vote_average ?? 0;

  return (
    <Link href={href}>
      <div 
        className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 sm:hover:scale-105 sm:hover:shadow-2xl sm:hover:shadow-red-500/10 active:opacity-95 sm:active:scale-100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-lg">
          {(movie.poster_path || ('_tvmazeImage' in movie && movie._tvmazeImage)) ? (
            <Image
              src={
                '_tvmazeImage' in movie && movie._tvmazeImage
                  ? movie._tvmazeImage
                  : getImageUrl(movie.poster_path, 'w500')
              }
              alt={title}
              fill
              className="object-cover transition-transform duration-500 sm:group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-700/50 flex items-center justify-center">
                <Film className="w-7 h-7 text-zinc-500" />
              </div>
              <span className="text-zinc-500 text-xs font-medium text-center px-3 line-clamp-2">{title}</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent transition-opacity duration-300 hidden sm:block ${isHovered ? 'opacity-90' : 'opacity-0'}`} />
          
          {/* Play button — desktop hover only; mobile shows title strip */}
          <div className={`absolute inset-0 hidden sm:flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/30 backdrop-blur-sm">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
          
          {/* Rating badge */}
          {rating > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-zinc-950/80 text-yellow-400 border-0 backdrop-blur-sm text-[11px] px-1.5 py-0.5">
                <Star className="w-3 h-3 mr-0.5 fill-yellow-400" />
                {rating.toFixed(1)}
              </Badge>
            </div>
          )}
          
          {/* Bottom gradient always visible for title */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent p-2.5 pt-10 sm:p-3 sm:pt-8">
            <h3 className="line-clamp-2 text-left text-xs font-semibold leading-tight text-white sm:text-sm">{title}</h3>
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{date ? new Date(date).getFullYear() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
