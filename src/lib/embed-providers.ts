/**
 * Third-party embed sources (TMDB-based). Community providers can change behavior at any time,
 * so we keep the config centralized and expose the minimum surface we can control from the host app.
 */

export const EMBED_PROVIDER_IDS = ['vidking', 'vidsrc', 'multiembed', 'moviesapi'] as const;
export type EmbedProviderId = (typeof EMBED_PROVIDER_IDS)[number];

export type EmbedProviderRisk = 'lower' | 'elevated';

export type EmbedProvider = {
  id: EmbedProviderId;
  label: string;
  description: string;
  risk: EmbedProviderRisk;
  sandbox: string | null;
  requiresConsent: boolean;
  note: string;
};

export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    id: 'vidking',
    label: 'Vidking',
    description: 'Best in-app default',
    risk: 'lower',
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-presentation',
    requiresConsent: false,
    note: 'Sandboxed in-page player with a narrower permission set.',
  },
  {
    id: 'vidsrc',
    label: 'VidSrc',
    description: 'Community source',
    risk: 'elevated',
    sandbox: null,
    requiresConsent: true,
    note: 'Loads in-page without sandbox because this source breaks under iframe sandboxing.',
  },
  {
    id: 'multiembed',
    label: 'MultiEmbed',
    description: 'Community source',
    risk: 'elevated',
    sandbox: null,
    requiresConsent: true,
    note: 'Loads in-page without sandbox because this source breaks under iframe sandboxing.',
  },
  {
    id: 'moviesapi',
    label: 'MoviesAPI',
    description: 'Community source',
    risk: 'elevated',
    sandbox: null,
    requiresConsent: true,
    note: 'Loads in-page without sandbox because this source breaks under iframe sandboxing.',
  },
];

export const EMBED_PROVIDER_STORAGE_KEY = 'movieflix-embed-provider';
export const EMBED_PROVIDER_APPROVAL_STORAGE_KEY = 'movieflix-embed-provider-approval';

export function isEmbedProviderId(value: string): value is EmbedProviderId {
  return (EMBED_PROVIDER_IDS as readonly string[]).includes(value);
}

export function getEmbedProvider(provider: EmbedProviderId) {
  return EMBED_PROVIDERS.find((entry) => entry.id === provider) ?? EMBED_PROVIDERS[0];
}

type BuildParams = {
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  season: number;
  episode: number;
};

export function buildEmbedUrl(provider: EmbedProviderId, p: BuildParams): string {
  const id = String(p.tmdbId).replace(/\D/g, '') || String(p.tmdbId);

  if (provider === 'vidking') {
    const params = new URLSearchParams({
      color: 'e50914',
      autoPlay: 'true',
    });

    if (p.mediaType === 'movie') {
      return `https://www.vidking.net/embed/movie/${id}?${params.toString()}`;
    }

    params.set('nextEpisode', 'true');
    params.set('episodeSelector', 'true');
    return `https://www.vidking.net/embed/tv/${id}/${p.season}/${p.episode}?${params.toString()}`;
  }

  if (p.mediaType === 'movie') {
    switch (provider) {
      case 'vidsrc':
        return `https://vidsrc.to/embed/movie/${id}`;
      case 'multiembed':
        return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      case 'moviesapi':
        return `https://moviesapi.club/movie/${id}`;
      default:
        return `https://vidsrc.to/embed/movie/${id}`;
    }
  }

  switch (provider) {
    case 'vidsrc':
      return `https://vidsrc.to/embed/tv/${id}/${p.season}/${p.episode}`;
    case 'multiembed':
      return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${p.season}&e=${p.episode}`;
    case 'moviesapi':
      return `https://moviesapi.club/tv/${id}-${p.season}-${p.episode}`;
    default:
      return `https://vidsrc.to/embed/tv/${id}/${p.season}/${p.episode}`;
  }
}
