'use client';

import { useEffect } from 'react';
import { initializeGoogleCast } from '@/lib/google-cast';

export function GoogleCastProvider() {
  useEffect(() => {
    initializeGoogleCast();
  }, []);

  return null;
}
