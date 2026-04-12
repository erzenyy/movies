'use client';

import { createElement } from 'react';
import { Cast } from 'lucide-react';
import { isGoogleCastConfigured } from '@/lib/google-cast';

export function GoogleCastLauncher({ className = '' }: { className?: string }) {
  if (!isGoogleCastConfigured()) return null;

  return (
    <div
      className={`inline-flex h-11 min-w-11 items-center justify-center border border-zinc-700 text-white hover:bg-zinc-800 ${className}`}
      title="Cast"
      aria-label="Cast"
    >
      {createElement(
        'google-cast-launcher',
        {
          className: 'flex h-full w-full items-center justify-center',
          style: {
            '--connected-color': '#ef4444',
            '--disconnected-color': '#ffffff',
          } as React.CSSProperties,
        },
        <>
        <Cast className="h-4 w-4 opacity-0" aria-hidden />
        </>
      )}
    </div>
  );
}
