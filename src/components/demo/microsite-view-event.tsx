'use client';

import { useEffect } from 'react';

/**
 * J.T1, emit `industry_template_viewed` once per microsite pageview,
 * with { anchor_slug, anchor_archetype, source }. Source is read from
 * ?source= (falling back to ?from=gallery -> "gallery", else "direct").
 * Suppressed under ?demo=1 per the analytics events spec. Fires on the
 * same window 'yf:event' bus the gallery uses.
 */
export function MicrositeViewEvent({
  anchorSlug,
  archetype,
}: {
  anchorSlug: string;
  archetype?: string | null;
}) {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const demo = ['1', 'true', 'yes'].includes((params.get('demo') ?? '').toLowerCase());
      if (demo) return;
      const source =
        params.get('source') ?? (params.get('from') === 'gallery' ? 'gallery' : 'direct');
      window.dispatchEvent(
        new CustomEvent('yf:event', {
          detail: {
            name: 'industry_template_viewed',
            props: { anchor_slug: anchorSlug, anchor_archetype: archetype ?? null, source },
          },
        }),
      );
      // L.T4, high-signal target-account view when a rep's share link
      // carries ?to=<hubspot-company-token>. The server tracker forwards
      // the token; stamping the company timeline awaits the token->company
      // mapping scheme (out-of-band).
      const targetToken = params.get('to');
      if (targetToken) {
        window.dispatchEvent(
          new CustomEvent('yf:event', {
            detail: {
              name: 'microsite_target_account_viewed',
              props: { anchor_slug: anchorSlug, target_company_token: targetToken },
            },
          }),
        );
      }
    } catch {
      // analytics bridge unavailable, ignore.
    }
  }, [anchorSlug, archetype]);
  return null;
}
