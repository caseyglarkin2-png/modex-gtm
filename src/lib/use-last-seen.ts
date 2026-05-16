'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reads a "last visit" timestamp (epoch ms) from localStorage and
 * immediately advances it to now. Returns the *previous* value so a feed
 * can flag what changed since the operator last looked.
 *
 * Returns `null` until the effect runs (SSR + first paint) and when no
 * prior visit is recorded — callers should treat `null` as "don't flag".
 */
export function useLastSeen(key: string): number | null {
  const [previous, setPrevious] = useState<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
      setPrevious(Number.isFinite(parsed) ? parsed : null);
      window.localStorage.setItem(key, String(Date.now()));
    } catch {
      setPrevious(null);
    }
  }, [key]);

  return previous;
}
