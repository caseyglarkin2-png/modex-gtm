/**
 * CONTRADICTED FACTS (Phase 2 final review P1, practitioner lens).
 *
 * Two verified facts about the same named site that move it in opposite
 * directions ("opening its Dallas DC" vs "closing the Dallas DC") cannot both
 * be quoted to a buyer. The evidence inbox already hides such a fact from
 * "ready"; this makes the same rule hold for a fact ALREADY linked to a
 * thesis: the six-line brief does not call it KNOW, and the send gate refuses
 * to quote it, until Casey ignores the side he does not believe.
 *
 * Every verified, unexpired, not-ignored fact at the account is compared (no
 * ingest window: an old linked fact still conflicts with a new one). Read only.
 */
import { EVIDENCE_IGNORED } from './inbox';
import { classifyFact, detectConflicts } from './facts';
import { isCurrentFact } from './currentness';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export async function contradictedFactIds(prisma: PrismaLike, accountName: string, now: Date): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  // A client without the signal table (test fakes) has no facts to compare; a failed READ throws (fail closed).
  if (!prisma?.prospectingSignal?.findMany) return out;
  const facts: Array<{ id: string; evidence_text: string | null; freshness_expires_at: Date | null; observed_at?: Date | null; type?: string | null; metadata?: unknown }> = await prisma.prospectingSignal.findMany({
    where: { account_name: accountName, source_kind: 'evidence_record', metadata: { path: ['verified'], equals: 'excerpt_found_at_source' } },
    select: { id: true, evidence_text: true, freshness_expires_at: true, observed_at: true, type: true, metadata: true },
    take: 500,
  });
  // Item 2a: the one freshness authority decides which facts are current enough to contradict each other.
  const live = facts.filter((f) => isCurrentFact(f, now));
  if (live.length < 2) return out;
  const ignored: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({
    where: { kind: EVIDENCE_IGNORED, subject_type: 'prospecting_signal', subject_id: { in: live.map((f) => f.id) } },
    select: { subject_id: true },
  });
  const skip = new Set(ignored.map((r) => r.subject_id));
  const considered = live.filter((f) => !skip.has(f.id));
  for (const c of detectConflicts(considered.map((f) => ({ id: f.id, excerpt: String(f.evidence_text ?? ''), change: classifyFact(String(f.evidence_text ?? '')).change })))) {
    for (const id of c.ids) out.set(id, c.site);
  }
  return out;
}
