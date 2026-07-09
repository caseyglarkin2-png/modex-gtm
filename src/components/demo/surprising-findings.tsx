import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * Layer 6, "What surprised us." The turn. The forward-worthy moment of the
 * demo: three true, non-obvious network-shape findings drawn from the actual
 * audit, asserted as patterns that hold across the sample. This is the thing a
 * champion pastes into Slack with "see what they found about our yards."
 *
 * Renders `account.surprisingFindings` (an array of up to 3 quantified
 * sentences). Self-suppresses when the pack has fewer than 3 findings, so a
 * not-yet-authored pack degrades to nothing rather than a thin, unconvincing
 * section. Placed AFTER the atlas/build sections in the page flow.
 *
 * No dollar figures, no modeled outputs, these are observed-pattern reads.
 */
export function SurprisingFindings({ pack }: { pack: DemoPack }) {
  const findings = pack.account.surprisingFindings ?? [];
  if (findings.length < 3) return null;

  const { displayName } = pack.account;

  return (
    <section
      data-ms-section-id="surprising-findings"
      className="border-b border-[#00B4FF]/[0.16] bg-[#070809] px-5 py-9"
    >
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]">
          The turn
        </div>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.01em] text-white max-[480px]:text-xl">
          What surprised us reading {displayName}&rsquo;s network
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-white/60">
          Three patterns held across the sites we sampled. None of them show up on
          a facility list. All of them change how the yard runs.
        </p>

        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {findings.map((finding, i) => (
            <li
              key={finding}
              className="flex flex-col gap-3 rounded-xl border border-[#00B4FF]/[0.16] bg-[#00B4FF]/[0.04] px-4 py-4"
            >
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.20em] text-[#00B4FF]/85 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-[13.5px] leading-relaxed text-white/90">{finding}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
