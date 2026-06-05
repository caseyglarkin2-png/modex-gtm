'use client';

import { useCallback, useEffect, useState } from 'react';

const TOUCH_STORAGE_KEY = 'discovery.touches';

type TouchMap = Record<string, string>; // placeId -> ISO timestamp of last touch

/**
 * Local "log a touch" store (v1) — records when Casey last worked a prospect,
 * persisted in localStorage. Sprint 5 promotes this to a real HubSpot activity.
 */
export function useTouchLog() {
  const [touches, setTouches] = useState<TouchMap>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TOUCH_STORAGE_KEY);
      if (raw) setTouches(JSON.parse(raw) as TouchMap);
    } catch {
      // ignore
    }
  }, []);

  const logTouch = useCallback((placeId: string) => {
    setTouches((prev) => {
      const next = { ...prev, [placeId]: new Date().toISOString() };
      try {
        window.localStorage.setItem(TOUCH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { touches, logTouch };
}
