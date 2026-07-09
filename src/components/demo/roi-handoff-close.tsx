'use client';

import Link from 'next/link';
import type { DemoPack } from '@/lib/demo/pack-schema';
import { trackEvent } from '@/lib/analytics';

/**
 * Layer 4, the /demo -> /roi handoff close. "Sample proves. Model sizes."
 *
 * /demo is the EVIDENCE surface: it shows the prospect's real asphalt and the
 * patterns we read from it. It states NO network dollar figure. The dollar
 * value lives exclusively at /roi (the only approved model). This end-of-page
 * close turns proof into price by handing off to the editable model, seeded
 * with this account's pack, and reminds the visitor this whole audit is the
 * deep-dive behind their /for memo.
 *
 * The booking close (the live "start a conversation" CTA) stays in DemoSurface
 * just below this; this component is the proof->price bridge specifically.
 */

interface Props {
  pack: DemoPack;
  /** Optional booking href passed through from the surface (header CTA). */
  bookHref?: string;
}

export function RoiHandoffClose({ pack, bookHref }: Props) {
  const { slug, displayName } = pack.account;
  // /roi lives natively on yardflow.ai; pack + utm let the model seed itself
  // and the visit attribute back to the demo. No dollar figure is rendered
  // here, the number is produced on /roi, not asserted on /demo.
  const roiHref = `https://yardflow.ai/roi/?pack=${encodeURIComponent(slug)}&utm_source=demo`;

  return (
    <section
      data-ms-section-id="roi-handoff"
      className="border-b border-[#00B4FF]/[0.16] bg-[#070809] px-5 py-9"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]">
            Proof → price
          </div>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.01em] text-white max-[480px]:text-xl">
            Turn what you saw into a number for finance
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">
            This audit is the evidence. The model is the math. Open the calculator
            seeded with {displayName}&rsquo;s audited yards, set your real volumes
            and margins, and it sizes the opportunity to the dollar.
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-white/45">
            This deep-dive is the evidence behind the{' '}
            <Link
              href={`/for/${slug}`}
              data-ms-cta-id="roi-handoff-back-to-memo"
              className="text-white/75 underline underline-offset-2 transition-colors hover:text-[#00B4FF]"
            >
              /for/{slug}
            </Link>{' '}
            memo.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {bookHref && (
            <a
              href={bookHref}
              target="_blank"
              rel="noopener noreferrer"
              data-ms-cta-id="roi-handoff-book"
              className="text-xs text-white/45 transition-colors hover:text-[#00B4FF]"
            >
              Or start a conversation
            </a>
          )}
          <a
            href={roiHref}
            target="_blank"
            rel="noopener noreferrer"
            data-ms-cta-id="demo-roi-handoff"
            onClick={() =>
              trackEvent('cta_click', { cta: 'demo-roi-handoff', slug, surface: 'demo' })
            }
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.14] px-5 py-2.5 text-sm font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.24] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
          >
            Open the calculator →
          </a>
        </div>
      </div>
    </section>
  );
}
