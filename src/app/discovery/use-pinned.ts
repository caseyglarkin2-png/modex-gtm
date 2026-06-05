'use client';

import { useCallback, useEffect, useState } from 'react';

const PINNED_STORAGE_KEY = 'discovery.pinned';

/**
 * Casey's "my targets" list — placeIds he has pinned to the top of the worklist,
 * persisted in localStorage so the list survives reloads. Pinned rows float to
 * the top regardless of score.
 */
export function usePinned() {
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PINNED_STORAGE_KEY);
      if (raw) setPinned(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const toggle = useCallback((placeId: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      try {
        window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { pinned, toggle };
}
