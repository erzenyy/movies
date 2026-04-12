export const GOOGLE_CAST_NAMESPACE = 'urn:x-cast:com.movieflix.remote';
export const GOOGLE_CAST_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_CAST_APP_ID ?? '';

export type GoogleCastPayload = {
  embedUrl: string;
  title: string;
  subtitle?: string;
  posterUrl?: string | null;
  mediaType: 'movie' | 'tv';
  tmdbId: string;
  providerLabel: string;
};

type CastContextLike = {
  setOptions: (options: { receiverApplicationId: string; autoJoinPolicy: string }) => void;
  addEventListener?: (eventType: string, listener: (event: unknown) => void) => void;
  removeEventListener?: (eventType: string, listener: (event: unknown) => void) => void;
  getCurrentSession?: () => {
    sendMessage: (namespace: string, message: unknown) => Promise<unknown>;
  } | null;
};

type CastFrameworkLike = {
  CastContext: {
    getInstance: () => CastContextLike;
  };
  CastContextEventType: {
    SESSION_STATE_CHANGED: string;
  };
};

type ChromeCastLike = {
  cast: {
    AutoJoinPolicy: {
      ORIGIN_SCOPED: string;
    };
  };
};

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: {
      framework?: CastFrameworkLike;
    };
    chrome?: ChromeCastLike;
  }
}

let initialized = false;

export function isGoogleCastConfigured() {
  return GOOGLE_CAST_APP_ID.length > 0;
}

export function initializeGoogleCast() {
  if (initialized || !isGoogleCastConfigured() || typeof window === 'undefined') return;

  window.__onGCastApiAvailable = (isAvailable: boolean) => {
    if (!isAvailable || !window.cast?.framework || !window.chrome?.cast) return;

    window.cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: GOOGLE_CAST_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    initialized = true;
  };
}

export function getGoogleCastContext() {
  if (typeof window === 'undefined') return null;
  return window.cast?.framework?.CastContext.getInstance() ?? null;
}

export async function sendGoogleCastPayload(payload: GoogleCastPayload) {
  const context = getGoogleCastContext();
  const session = context?.getCurrentSession?.();
  if (!session) return false;

  try {
    await session.sendMessage(GOOGLE_CAST_NAMESPACE, payload);
    return true;
  } catch {
    return false;
  }
}
