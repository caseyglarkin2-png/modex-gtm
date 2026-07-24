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

const INTERNAL_FLAG_KEY = 'yf_internal';

function enabled(): boolean {
  return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

/**
 * Rig / agent traffic detector, mirrored from Flow-State- lib/analytics.ts.
 * The /demo (and proxied /for) surfaces had NO internal guard, so rig/agent
 * visits stamped this app's PostHog like real prospects and polluted the
 * cross-surface funnel. Flag them `is_internal:true` (test-account-filtered)
 * exactly as the shell does. The YardFlowAgent UA marker survives a
 * chrome-profile wipe, so it is the reliable signal; ?internal=1 latches it.
 */
function isInternalTraffic(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.navigator?.userAgent?.includes('YardFlowAgent')) return true;
    if (window.navigator?.webdriver) return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('internal') === '1') {
      window.localStorage.setItem(INTERNAL_FLAG_KEY, '1');
      return true;
    }
    return window.localStorage.getItem(INTERNAL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function init(): void {
  if (initialized || !enabled()) return;
  initialized = true;
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
        // Exclude rig/agent traffic from the funnel the same way the shell does.
        if (isInternalTraffic()) {
          ph.register({ is_internal: true });
          ph.stopSessionRecording();
        }
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
  // Stamp is_internal at CAPTURE time, not only via the init loaded() callback.
  // init() and this capture() run in separate async import() chains, so the
  // first for_page_view can resolve before loaded() registers the super
  // property. Stamping here guarantees even the first rig event is filtered.
  const props = isInternalTraffic() ? { ...properties, is_internal: true } : properties;
  void import('posthog-js').then(({ default: posthog }) => posthog.capture(event, props));
}
