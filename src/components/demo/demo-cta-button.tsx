'use client';

import { useEffect, useState } from 'react';
import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * D3.5 — Microsite CTA pointing to the standalone simulator.
 *
 * Drops into the existing memo-soft-action area. Fetches the account's
 * demo pack at runtime to discover the featured site name, then renders
 * a single soft link to `/demo/<slug>?site=<id>&play=1` so prospects can
 * watch a truck run their own real geometry.
 *
 * Renders nothing when the account has no pack yet (keeps the microsite
 * looking clean for accounts where the audit hasn't shipped).
 */

interface Props {
  /** micrositeSlug — same one used by /for/<slug>. */
  accountSlug: string;
}

interface MinimalPack {
  account: { displayName: string; featuredSiteId?: string };
  network: { sites: { id: string; name: string }[] };
}

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';

export function DemoCTAButton({ accountSlug }: Props) {
  const [info, setInfo] = useState<{ slug: string; siteId: string; siteName: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/demo-packs/${accountSlug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('no-pack');
        return r.json() as Promise<MinimalPack>;
      })
      .then((p) => {
        if (cancelled) return;
        const siteId = p.account.featuredSiteId ?? p.network.sites[0]?.id;
        if (!siteId) return;
        const site = p.network.sites.find((s) => s.id === siteId);
        if (!site) return;
        setInfo({ slug: accountSlug, siteId, siteName: site.name });
      })
      .catch(() => {
        // No pack — render nothing. This is the common case for accounts
        // that haven't been audited yet.
      });
    return () => {
      cancelled = true;
    };
  }, [accountSlug]);

  if (!info) return null;

  return (
    <p className={`mt-4 text-[#4a4641] not-italic ${FONT_SERIF}`} style={{ fontVariationSettings: "'opsz' 16, 'SOFT' 60", fontSize: 'clamp(0.95rem, 0.3vw + 0.85rem, 1.1rem)' }}>
      <a
        data-ms-cta-id="demo-replay"
        href={`/demo/${info.slug}?site=${info.siteId}&play=1`}
        className="inline-block border-b font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]"
        style={{
          color: 'var(--memo-accent)',
          borderBottomColor: 'currentColor',
          fontVariationSettings: "'opsz' 14, 'SOFT' 30",
          fontWeight: 480,
        }}
      >
        Or watch a truck run your real {info.siteName} &rarr;
      </a>
    </p>
  );
}
