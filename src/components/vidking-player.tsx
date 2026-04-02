'use client';

import { useEffect, useRef, useCallback } from 'react';
import { VideoPlayerProps } from '@/lib/types';

interface VidkingPlayerProps extends VideoPlayerProps {
  onProgress?: (data: {
    currentTime: number;
    duration: number;
    progress: number;
  }) => void;
  onEvent?: (event: string, data: unknown) => void;
}

export function VidkingPlayer({
  tmdbId,
  mediaType,
  season,
  episode,
  color = 'e50914',
  autoPlay = true,
  nextEpisode = true,
  episodeSelector = true,
  progress = 0,
  onProgress,
  onEvent,
}: VidkingPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getEmbedUrl = () => {
    const params = new URLSearchParams();
    
    if (color) params.append('color', color);
    if (autoPlay) params.append('autoPlay', 'true');
    if (progress > 0) params.append('progress', progress.toString());
    
    if (mediaType === 'movie') {
      return `https://www.vidking.net/embed/movie/${tmdbId}?${params.toString()}`;
    } else {
      if (nextEpisode) params.append('nextEpisode', 'true');
      if (episodeSelector) params.append('episodeSelector', 'true');
      return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?${params.toString()}`;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.vidking.net') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'PLAYER_EVENT' && data.data) {
          const eventData = data.data;
          
          if (eventData.event === 'timeupdate' && onProgress) {
            onProgress({
              currentTime: eventData.currentTime,
              duration: eventData.duration,
              progress: eventData.progress,
            });
          }
          
          if (onEvent) {
            onEvent(eventData.event, eventData);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProgress, onEvent]);

  return (
    <div className="relative w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={getEmbedUrl()}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        className="absolute inset-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
