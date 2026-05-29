import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * B.T7 — SurprisingFindings
 *
 * Renders the three quantified findings authored in
 * `pack.account.surprisingFindings` as a row of cards above the
 * atlas / sim tabs. Returns null when the field is absent or has
 * fewer than 3 entries (legacy packs unchanged).
 *
 * Layout: 3 columns on desktop (md and up), single-col stack on
 * mobile. Each card has a neon-cyan left-border accent and a
 * mono-eyebrow "Audit found:". The finding text itself is the
 * dominant content — semibold 14.5px, white at 0.95.
 */

export function SurprisingFindings({ pack }: { pack: DemoPack }) {
  const items = pack.account.surprisingFindings;
  if (!items || items.length < 3) return null;
  return (
    <section
      data-ms-section-id="surprising-findings"
      className="mx-auto w-full max-w-5xl px-5 pb-6 pt-2 max-[480px]:px-[18px]"
    >
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]/85">
        What surprised us
      </div>
      <ol
        role="list"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        {items.slice(0, 3).map((finding, i) => (
          <li
            key={i}
            className="relative rounded-[12px] border border-white/10 bg-white/[0.025] p-4 max-[480px]:p-[14px]"
          >
            <div
              aria-hidden
              className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r bg-[#00B4FF]"
            />
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#00B4FF]/85">
              Audit found
            </div>
            <p className="m-0 text-[14.5px] font-semibold leading-[1.5] text-white/95 max-[480px]:text-[14px]">
              {finding}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
