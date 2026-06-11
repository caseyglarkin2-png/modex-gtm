// PostHog analytics wrapper for the modex-gtm microsite surfaces (/demo/<account>,
// /demo/compare, /for/<account>). These are served by this app (proxied under
// yardflow.ai) and, unlike the Flow-State- shell, had NO PostHog — so demo and
// per-account /for engagement was invisible in the funnel. This mirrors the
// Flow-State- analytics wrapper so events land in the SAME YardFlow PostHog
// project with the SAME event names (for_page_view / cta_click / booking_link_click)
// plus a `surface` property, giving one cross-surface funnel.
//
// Lazy-loads posthog-js and no-ops until NEXT_PUBLIC_POSTHOG_KEY is set.

'use client';

let initialized = false;

function enabled(): boolean {
  return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function init(): void {
  if (initialized || !enabled()) return;
  initialized = true;
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
      },
    });
  });
}

/** Register PostHog super-properties that ride on every later event this session. */
export function registerSuperProps(properties: Record<string, unknown>): void {
  if (!enabled()) return;
  init();
  void import('posthog-js').then(({ default: posthog }) => posthog.register(properties));
}

/** Capture a PostHog event (no-op until the key is set). */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!enabled()) return;
  init();
  void import('posthog-js').then(({ default: posthog }) => posthog.capture(event, properties));
}
