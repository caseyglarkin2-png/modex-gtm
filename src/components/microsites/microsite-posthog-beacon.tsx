'use client';

import { useEffect } from 'react';
import { registerSuperProps, trackEvent } from '@/lib/analytics';

/**
 * Fires a PostHog page-view on the modex-served microsite surfaces
 * (/demo/<account>, modex /for/<account>) and registers the account + surface as
 * super-properties, so every downstream event this session (cta_click, etc.)
 * breaks down by account and surface in the SAME funnel the Flow-State- /for
 * pages feed. Uses the shared event name `for_page_view` (with a `surface`
 * property) so /demo and /for sit in one cross-surface funnel. No-op until
 * NEXT_PUBLIC_POSTHOG_KEY is set. Renders nothing.
 */
export default function MicrositePostHogBeacon({
  slug,
  surface,
}: {
  slug: string;
  surface: 'demo' | 'for' | 'compare';
}) {
  useEffect(() => {
    registerSuperProps({ for_slug: slug, surface });
    trackEvent('for_page_view', { slug, surface });
  }, [slug, surface]);

  return null;
}
