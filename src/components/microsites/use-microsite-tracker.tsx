'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  dedupeTrackingSnapshot,
  micrositeTrackingSnapshotSchema,
  type MicrositeTrackingSnapshot,
} from '@/lib/microsites/tracking';

interface UseMicrositeTrackerOptions {
  accountName: string;
  accountSlug: string;
  path: string;
  personName?: string;
  personSlug?: string;
  variantSlug?: string;
  flushIntervalMs?: number;
}

const SECTION_SELECTOR = '[data-ms-section-id]';
const CTA_SELECTOR = '[data-ms-cta-id]';
const VARIANT_SELECTOR = '[data-ms-variant-link]';
const TRACK_URL = '/api/microsites/track';

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionStorageKey(path: string) {
  return `microsite-tracker:${path}`;
}

function getOrCreateSessionId(path: string) {
  const storageKey = getSessionStorageKey(path);

  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;

    const next = createSessionId();
    window.sessionStorage.setItem(storageKey, next);
    return next;
  } catch {
    return createSessionId();
  }
}

export function useMicrositeTracker({
  accountName,
  accountSlug,
  path,
  personName,
  personSlug,
  variantSlug,
  flushIntervalMs = 30_000,
}: UseMicrositeTrackerOptions) {
  const sessionIdRef = useRef<string>('');
  const sectionsViewed = useRef(new Set<string>());
  const ctaIds = useRef(new Set<string>());
  const variantHistory = useRef(new Set<string>());
  const scrollDepthPct = useRef(0);
  const audioProgressPct = useRef(0);
  const videoProgressPct = useRef(0);
  const startTime = useRef(Date.now());
  const lastPayloadHash = useRef('');

  const buildSnapshot = useCallback((): MicrositeTrackingSnapshot => {
    return micrositeTrackingSnapshotSchema.parse({
      sessionId: sessionIdRef.current,
      accountName,
      accountSlug,
      personName,
      personSlug,
      path,
      sectionsViewed: Array.from(sectionsViewed.current),
      ctaIds: Array.from(ctaIds.current),
      variantHistory: Array.from(variantHistory.current),
      scrollDepthPct: scrollDepthPct.current,
      durationSeconds: Math.round((Date.now() - startTime.current) / 1000),
      audioProgressPct: audioProgressPct.current,
      videoProgressPct: videoProgressPct.current,
      variantSlug,
      lastCtaId: Array.from(ctaIds.current).at(-1),
    });
  }, [accountName, accountSlug, path, personName, personSlug, variantSlug]);

  const flush = useCallback(
    (mode: 'fetch' | 'beacon' = 'fetch', force = false) => {
      if (!sessionIdRef.current) return;

      const snapshot = buildSnapshot();
      const hash = dedupeTrackingSnapshot(snapshot);
      if (!force && hash === lastPayloadHash.current) return;
      lastPayloadHash.current = hash;

      if (mode === 'beacon' && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
        navigator.sendBeacon(TRACK_URL, blob);
        return;
      }

      fetch(TRACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
        keepalive: true,
      }).catch(() => {});
    },
    [buildSnapshot],
  );

  useEffect(() => {
    if (!path) return;

    startTime.current = Date.now();
    sessionIdRef.current = getOrCreateSessionId(path);
    if (variantSlug) variantHistory.current.add(variantSlug);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = (entry.target as HTMLElement).dataset.msSectionId;
          if (sectionId) sectionsViewed.current.add(sectionId);
        }
      },
      { threshold: 0.35 },
    );

    document.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach((element) => {
      sectionObserver.observe(element);
    });

    // Audio/video depth — listen for timeupdate and keep the furthest
    // point reached (monotonic max), so every flush reports the deepest
    // the visitor got, not where the playhead currently sits.
    const trackMediaProgress = (
      element: HTMLMediaElement,
      progressRef: { current: number },
    ) => {
      const onTimeUpdate = () => {
        const duration = element.duration;
        if (!duration || !Number.isFinite(duration)) return;
        const pct = Math.round((element.currentTime / duration) * 100);
        if (pct > progressRef.current) progressRef.current = Math.min(pct, 100);
      };
      element.addEventListener('timeupdate', onTimeUpdate);
      return () => element.removeEventListener('timeupdate', onTimeUpdate);
    };

    const audioElement = document.querySelector('audio');
    const videoElement = document.querySelector('video');
    const detachAudioProgress = audioElement
      ? trackMediaProgress(audioElement, audioProgressPct)
      : undefined;
    const detachVideoProgress = videoElement
      ? trackMediaProgress(videoElement, videoProgressPct)
      : undefined;

    let scrollTick: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = setTimeout(() => {
        scrollTick = null;
        const doc = document.documentElement;
        const pct = Math.round((doc.scrollTop / Math.max(doc.scrollHeight - doc.clientHeight, 1)) * 100);
        if (pct > scrollDepthPct.current) scrollDepthPct.current = pct;
      }, 250);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const ctaTarget = target?.closest<HTMLElement>(CTA_SELECTOR);
      if (ctaTarget?.dataset.msCtaId) {
        ctaIds.current.add(ctaTarget.dataset.msCtaId);
        flush('fetch', true);
        return;
      }

      const variantTarget = target?.closest<HTMLElement>(VARIANT_SELECTOR);
      if (variantTarget?.dataset.msVariantSlug) {
        variantHistory.current.add(variantTarget.dataset.msVariantSlug);
        flush('fetch', true);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush('beacon');
    };

    const onPageHide = () => {
      flush('beacon', true);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    const interval = window.setInterval(() => flush('fetch'), flushIntervalMs);

    return () => {
      sectionObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.clearInterval(interval);
      if (scrollTick) clearTimeout(scrollTick);
      detachAudioProgress?.();
      detachVideoProgress?.();
      flush('beacon', true);
    };
  }, [flush, flushIntervalMs, path, variantSlug]);
}