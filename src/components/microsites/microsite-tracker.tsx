'use client';

import { useMicrositeTracker } from './use-microsite-tracker';

interface MicrositeTrackerProps {
  accountName: string;
  accountSlug: string;
  path: string;
  personName?: string;
  personSlug?: string;
  variantSlug?: string;
  flushIntervalMs?: number;
}

/**
 * Wraps `useMicrositeTracker` so server pages can drop the tracker
 * into the tree without dealing with the hook directly.
 *
 * Sprint 2.5 — gallery event vocabulary
 * ─────────────────────────────────────
 * Events emitted by the gallery + linked template views all flow
 * through this same tracker. No new endpoint or event type is
 * needed — the tracker already accepts free-form ids on ctaIds and
 * free-form slugs on variantHistory. Reserved gallery names:
 *
 *   path '/demo' + variantSlug 'gallery-pageview'
 *     → "gallery_pageview" — fires once per session on /demo load.
 *       accountSlug is the pseudo 'gallery' so downstream consumers
 *       can split gallery rows from per-account engagements.
 *
 *   data-ms-cta-id "gallery-run-roi-<industry>" or
 *                  "gallery-view-template-<industry>"
 *     → "gallery_industry_click" — click on either tile CTA.
 *       The tile also stamps `data-ms-cta-industry` and
 *       `data-ms-cta-pack` on the same element for the
 *       industry_id / pack_slug + cta_type breakdown (the tracker
 *       currently only flushes the id; the extra attributes are
 *       there for a follow-up that captures per-CTA metadata).
 *
 *   path '/demo/<slug>' + variantSlug 'gallery-pack-view'
 *     → "gallery_pack_view" — fires on /demo/<slug>?from=gallery.
 *       Set by the [account]/page.tsx render when ?from=gallery is
 *       present in the URL. Distinguishes a gallery-driven view from
 *       a personalized cold-email view of the same pack.
 *
 *   data-ms-cta-id "gallery-pack-book-audit"
 *     → "gallery_book_audit" — the Book-Audit CTA fired from a
 *       gallery-template view. Lets HubSpot / Slack split conversion
 *       attribution by "warm personalized link" vs "cold gallery click".
 *
 *   data-ms-cta-id "gallery-back-to-gallery"
 *     → "gallery_back_to_gallery" — the back-link on the template
 *       strip. Useful for telling how many template visitors keep
 *       browsing vs bounce.
 *
 *   data-ms-cta-id "gallery-hero-run-roi"
 *     → "gallery_hero_run_roi" — the hero-level "Run a Sample ROI"
 *       CTA at the top of /demo (industry-agnostic).
 *
 * All of these surface in the existing `MicrositeEngagement` row
 * (sectionsViewed[], ctaIds[], variantHistory[]) — no schema bump
 * required. Dashboards / Engagement Inbox can group by id string.
 */
export function MicrositeTracker(props: MicrositeTrackerProps) {
  useMicrositeTracker(props);
  return null;
}