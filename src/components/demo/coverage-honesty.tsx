import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * D2.5 — Honesty banner. We never silently under-claim coverage. If we
 * audited 30 of 70 known HD facilities, the banner says so.
 *
 * Renders when either:
 *   - we hit the 30-site auditor cap (`capHit`), OR
 *   - the audit dropped stubs that couldn't be resolved from public
 *     sources (`droppedStubCount > 0`).
 *
 * Suppressed when the audit is exhaustive — full coverage is the implicit
 * default, and shouting about it would feel performative.
 */

export function CoverageHonesty({ pack }: { pack: DemoPack }) {
  const note = pack.account.coverageNote;
  if (!note) return null;
  if (!note.capHit && note.droppedStubCount === 0) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50/60 px-5 py-2.5 text-xs text-amber-900">
      <div className="mx-auto max-w-5xl">
        <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700">Coverage note ·</span>
        {note.note}
      </div>
    </div>
  );
}
