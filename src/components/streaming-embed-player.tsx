'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayerProps } from '@/lib/types';
import { VidkingPlayer } from '@/components/vidking-player';
import {
  type EmbedProviderId,
  EMBED_PROVIDERS,
  EMBED_PROVIDER_APPROVAL_STORAGE_KEY,
  EMBED_PROVIDER_STORAGE_KEY,
  buildEmbedUrl,
  getEmbedProvider,
  isEmbedProviderId,
} from '@/lib/embed-providers';

type StreamingEmbedPlayerProps = VideoPlayerProps;
type PlayerProgress = {
  currentTime: number;
  duration: number;
  progress: number;
};
type SourceInfo = {
  providerId: EmbedProviderId;
  providerLabel: string;
  embedUrl: string;
};

function UnsandboxedProviderNotice({
  providerLabel,
  onContinue,
  onBackToSafe,
}: {
  providerLabel: string;
  onContinue: () => void;
  onBackToSafe: () => void;
}) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 border border-zinc-800 bg-zinc-950 px-6 text-center sm:rounded-lg">
      <ShieldAlert className="h-10 w-10 text-amber-500" aria-hidden />
      <div className="max-w-xl space-y-2">
        <p className="text-sm font-medium text-white">{providerLabel} needs a direct in-page load.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBackToSafe}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        >
          Switch Back to Vidking
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
}

function CommunityProviderFrame({
  title,
  src,
}: {
  title: string;
  src: string;
}) {
  return (
    <div className="relative w-full aspect-video overflow-hidden border border-zinc-800 bg-zinc-950 sm:rounded-lg">
      <iframe
        title={title}
        src={src}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        className="absolute inset-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export function StreamingEmbedPlayer({
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
  onSourceResolved,
}: StreamingEmbedPlayerProps & {
  onProgress?: (data: PlayerProgress) => void;
  onSourceResolved?: (data: SourceInfo) => void;
}) {
  const [provider, setProvider] = useState<EmbedProviderId>(() => {
    if (typeof window === 'undefined') return 'vidking';
    try {
      const rawProvider = sessionStorage.getItem(EMBED_PROVIDER_STORAGE_KEY);
      if (rawProvider && isEmbedProviderId(rawProvider)) {
        return rawProvider;
      }
    } catch {
      // ignore session storage failures
    }
    return 'vidking';
  });

  const [approvedProviders, setApprovedProviders] = useState<EmbedProviderId[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const rawApprovals = sessionStorage.getItem(EMBED_PROVIDER_APPROVAL_STORAGE_KEY);
      if (!rawApprovals) return [];

      const parsed = JSON.parse(rawApprovals);
      if (Array.isArray(parsed)) {
        return parsed.filter(isEmbedProviderId);
      }
    } catch {
      // ignore session storage failures
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(EMBED_PROVIDER_STORAGE_KEY, provider);
      sessionStorage.setItem(
        EMBED_PROVIDER_APPROVAL_STORAGE_KEY,
        JSON.stringify(approvedProviders)
      );
    } catch {
      // ignore session storage failures
    }
  }, [provider, approvedProviders]);

  const seasonNum = season ?? 1;
  const episodeNum = episode ?? 1;
  const providerMeta = getEmbedProvider(provider);
  const providerSrc = useMemo(
    () =>
      buildEmbedUrl(provider, {
        tmdbId,
        mediaType,
        season: seasonNum,
        episode: episodeNum,
      }),
    [provider, tmdbId, mediaType, seasonNum, episodeNum]
  );
  const requiresConsent = providerMeta.requiresConsent && !approvedProviders.includes(provider);

  const lastResolvedSourceKey = useRef<string | null>(null);

  useEffect(() => {
    if (!onSourceResolved) {
      lastResolvedSourceKey.current = null;
      return;
    }
    const key = `${provider}|${providerMeta.label}|${providerSrc}`;
    if (lastResolvedSourceKey.current === key) return;
    lastResolvedSourceKey.current = key;
    onSourceResolved({
      providerId: provider,
      providerLabel: providerMeta.label,
      embedUrl: providerSrc,
    });
  }, [onSourceResolved, provider, providerMeta.label, providerSrc]);

  const approveProvider = () => {
    setApprovedProviders((current) =>
      current.includes(provider) ? current : [...current, provider]
    );
  };

  const returnToSafeProvider = () => {
    setProvider('vidking');
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-3 px-3 sm:px-0">
        <div className="flex items-start justify-end gap-3">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs',
              providerMeta.risk === 'lower'
                ? 'border-emerald-900 bg-emerald-950/40 text-emerald-300'
                : 'border-amber-900 bg-amber-950/40 text-amber-300'
            )}
          >
            {providerMeta.risk === 'lower' ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            )}
            {providerMeta.risk === 'lower' ? 'Standard' : 'Community'}
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Video source"
        >
          {EMBED_PROVIDERS.map((entry) => {
            const active = provider === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setProvider(entry.id)}
                className={cn(
                  'shrink-0 border px-3 py-2 text-left text-xs transition-colors sm:text-sm',
                  active
                    ? 'border-red-600 bg-zinc-900 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                )}
              >
                <span className="font-medium">{entry.label}</span>
                <span className="mt-0.5 block text-[10px] text-zinc-500 sm:text-xs">{entry.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {provider === 'vidking' ? (
        <VidkingPlayer
          tmdbId={tmdbId}
          mediaType={mediaType}
          season={mediaType === 'tv' ? seasonNum : season}
          episode={mediaType === 'tv' ? episodeNum : episode}
          color={color}
          autoPlay={autoPlay}
          nextEpisode={nextEpisode}
          episodeSelector={episodeSelector}
          progress={progress}
          onProgress={onProgress}
        />
      ) : requiresConsent ? (
        <UnsandboxedProviderNotice
          providerLabel={providerMeta.label}
          onContinue={approveProvider}
          onBackToSafe={returnToSafeProvider}
        />
      ) : (
        <CommunityProviderFrame
          title={`Streaming player (${providerMeta.label}) for ${mediaType} ${tmdbId}`}
          src={providerSrc}
        />
      )}
    </div>
  );
}
