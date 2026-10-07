'use client';

/**
 * R61: an in-place action shows its result at once. Measured on the account page (production build): after a record,
 * a Done or a plan, router.refresh() fetched the new page in about 200 ms, but the browser kept the old one until the
 * next React update anywhere on the page: the notification bell's 15-second poll (13.9 s for a recorded reply; with
 * the poll held, never). Work committed the same refresh in 119 ms. Neither the account page's streamed boundary nor
 * the links' pending status was the cause (both removed in experiments, still stuck); the cause inside the framework
 * is named debt. The mitigation: every GAP refresh announces itself, and the GAP layout's nudge makes a few no-op
 * updates over the next seconds, so the new page is shown as soon as it has arrived.
 */
import { useEffect, useState } from 'react';

export const GAP_REFRESHED = 'gap:refreshed';
/** When the nudge updates after a refresh (ms): early ones catch a fast read, later ones a slow one. */
export const REFRESH_NUDGES_MS = [120, 300, 600, 1000, 1600, 2500, 4000, 6500, 10000] as const;

/** router.refresh(), announced so the GAP layout shows the new page as soon as it arrives. */
export function refreshNow(router: { refresh: () => void }): void {
  router.refresh();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(GAP_REFRESHED));
}

/** Mounted once in the GAP layout: after each announced refresh, a few no-op updates (renders nothing). */
export function RefreshNudge() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timers: number[] = [];
    const onRefresh = () => {
      for (const ms of REFRESH_NUDGES_MS) timers.push(window.setTimeout(() => setTick((t) => t + 1), ms));
    };
    window.addEventListener(GAP_REFRESHED, onRefresh);
    return () => {
      window.removeEventListener(GAP_REFRESHED, onRefresh);
      for (const t of timers) window.clearTimeout(t);
    };
  }, []);
  return null;
}
