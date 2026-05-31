'use client';

import { useCallback, useState } from 'react';

/**
 * L.T3 — "Share this audit" outbound link. Copies a canonical,
 * attribution-tagged URL for this microsite to the clipboard (or opens
 * the native share sheet where available) and shows a brief toast. The
 * rep's one-click outbound asset; UTMs land in HubSpot session
 * attribution.
 */
export function ShareMicrosite({ slug, brand, className }: { slug: string; brand: string; className?: string }) {
  const [toast, setToast] = useState<null | 'copied' | 'shared'>(null);

  const onShare = useCallback(async () => {
    const url = `https://yardflow.ai/demo/${encodeURIComponent(
      slug,
    )}?source=outbound&utm_source=rep&utm_medium=email&utm_campaign=microsite-share`;
    const title = `YardFlow audited network · ${brand}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, title });
        setToast('shared');
        setTimeout(() => setToast(null), 2200);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setToast('copied');
        setTimeout(() => setToast(null), 2200);
      } catch {
        // ignore
      }
    }
  }, [slug, brand]);

  return (
    <button
      type="button"
      onClick={onShare}
      data-ms-cta-id="microsite-share"
      aria-label={`Share the ${brand} audit`}
      className={
        className ??
        'inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-white/85 transition-all hover:border-[#00B4FF]/55 hover:text-white'
      }
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 6 12 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {toast === 'copied' ? 'Link copied' : toast === 'shared' ? 'Shared' : 'Share this audit'}
    </button>
  );
}
