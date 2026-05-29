import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * D2.5 — Honesty banner. We never silently under-claim coverage. If we
 * audited 22 of 26 known Mondelez NA facilities, the banner says so.
 *
 * Renders when any of:
 *   - we hit the 30-site auditor cap (`capHit`), OR
 *   - the audit dropped stubs that couldn't be resolved from public
 *     sources (`droppedStubCount > 0`), OR
 *   - audited count is below the estimated footprint by ≥1.
 *
 * The third gate is the common one — most accounts have small but
 * meaningful gaps (co-manufacturers operating inside other companies'
 * footprints, international plants out of scope, brand-new sites we
 * couldn't resolve to coords). A prospect deserves to know.
 *
 * Suppressed only when the audit is fully exhaustive (audited =
 * estimated, no stubs, no cap) — full coverage is the implicit default
 * and shouting about it would feel performative.
 */

export function CoverageHonesty({ pack }: { pack: DemoPack }) {
  const note = pack.account.coverageNote;
  if (!note) return null;
  const hasNaGap =
    note.estimatedFootprint !== null && note.auditedCount < note.estimatedFootprint;
  const hasGlobalGap =
    note.totalGlobalFootprint != null && note.auditedCount < note.totalGlobalFootprint;
  if (!note.capHit && note.droppedStubCount === 0 && !hasNaGap && !hasGlobalGap) return null;

  return (
    <div className="border-b border-[#FF2A00]/[0.20] bg-[#FF2A00]/[0.06] px-5 py-2.5 text-xs text-white/85">
      <div className="mx-auto max-w-5xl">
        <span className="mr-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.20em] text-[#FF2A00]">Coverage note ·</span>
        {note.note}
      </div>
    </div>
  );
}
