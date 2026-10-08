/**
 * COPY REVISIONS (X10, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * The independent review's B2: a revised message had no route into the draft or send service, which render the
 * version's step template and bind THAT hash. A revision is now an append-only pair of ledger rows on the routing
 * card (subject `routing_decision` / the decision id):
 *   execution.copy_revision_proposed   the marked and queued copy, its content hash (of the queued copy, exactly
 *                                      as action-pack.ts hashes), the compile row and verdict that judged the
 *                                      marked copy, the basis (the critique and the facts it rests on), who proposed
 *   execution.copy_revision_approved   the seller's approval (by email or in the app); the NEWEST approval for a
 *                                      card and step wins and is what `loadActionPack` renders from then on
 * A proposal is never used until approved. An approval needs a cleared compile (pass, or review_required with an
 * approval on file). A revision never bypasses the evidence gate: the pack still reports a citation the thesis does
 * not carry as unresolved, and prepareSellerEmail refuses it like any other copy.
 */
import { randomBytes } from 'node:crypto';
import { stripSourceMarkers } from '@/lib/source-backed/attribution';
import { contentHashOf } from './action-pack';
import { isApproved } from '../compiler/approval';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const COPY_REVISION_PROPOSED = 'execution.copy_revision_proposed' as const;
export const COPY_REVISION_APPROVED = 'execution.copy_revision_approved' as const;
export const REVISION_SUBJECT_TYPE = 'routing_decision' as const;

export interface StepCopy {
  subject: string;
  body: string;
}

export interface ProposeRevisionInput {
  decisionId: string;
  hypothesisId: string;
  versionId: string;
  stepIndex: number;
  /** The copy WITH its `[[SRC:id]]` markers (what the compiler judged). */
  marked: StepCopy;
  compileId: string | null;
  compileVerdict: 'pass' | 'review_required' | 'reject';
  basis: { critique: string; facts: string[] };
  proposedBy: string;
  taskId: string | null;
}

export interface CopyRevision {
  revisionId: string;
  decisionId: string;
  hypothesisId: string;
  versionId: string;
  stepIndex: number;
  marked: StepCopy;
  queued: StepCopy;
  contentHash: string;
  compileId: string | null;
  compileVerdict: string;
  basis: { critique: string; facts: string[] };
  proposedBy: string;
  taskId: string | null;
  proposedAt: string;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  approvedVia: string | null;
}

const strip = (s: string) => stripSourceMarkers(s).replace(/\[S:[A-Za-z0-9_-]+\]/g, '').replace(/\s+([.,;:!?])/g, '$1').replace(/[ \t]{2,}/g, ' ');

/** The queued copy of a marked copy: markers stripped the way the renderer strips them. */
export function queuedOf(marked: StepCopy): StepCopy {
  return { subject: strip(marked.subject).trim(), body: strip(marked.body).trim() };
}

export async function proposeCopyRevision(prisma: PrismaLike, input: ProposeRevisionInput, now: Date): Promise<{ revisionId: string; contentHash: string; queued: StepCopy }> {
  const revisionId = `rev_${randomBytes(8).toString('hex')}`;
  const queued = queuedOf(input.marked);
  const contentHash = contentHashOf(queued);
  await prisma.gapAuditEvent.create({
    data: {
      kind: COPY_REVISION_PROPOSED,
      actor: input.proposedBy,
      subject_type: REVISION_SUBJECT_TYPE,
      subject_id: input.decisionId,
      payload: { revisionId, hypothesisId: input.hypothesisId, versionId: input.versionId, stepIndex: input.stepIndex, marked: input.marked, queued, contentHash, compileId: input.compileId, compileVerdict: input.compileVerdict, basis: input.basis, taskId: input.taskId, proposedAt: now.toISOString() },
    },
  });
  return { revisionId, contentHash, queued };
}

type Row = { kind: string; actor: string; payload: Record<string, unknown> | null; created_at: Date | string };

function fold(rows: Row[]): CopyRevision[] {
  const byId = new Map<string, CopyRevision>();
  for (const r of [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const id = String(p.revisionId ?? '');
    if (!id) continue;
    if (r.kind === COPY_REVISION_PROPOSED) {
      byId.set(id, {
        revisionId: id,
        decisionId: '',
        hypothesisId: String(p.hypothesisId ?? ''),
        versionId: String(p.versionId ?? ''),
        stepIndex: Number(p.stepIndex ?? 0),
        marked: p.marked as StepCopy,
        queued: p.queued as StepCopy,
        contentHash: String(p.contentHash ?? ''),
        compileId: (p.compileId as string | null) ?? null,
        compileVerdict: String(p.compileVerdict ?? ''),
        basis: (p.basis as { critique: string; facts: string[] }) ?? { critique: '', facts: [] },
        proposedBy: r.actor,
        taskId: (p.taskId as string | null) ?? null,
        proposedAt: String(p.proposedAt ?? new Date(r.created_at).toISOString()),
        approved: false,
        approvedBy: null,
        approvedAt: null,
        approvedVia: null,
      });
    } else if (r.kind === COPY_REVISION_APPROVED) {
      const rev = byId.get(id);
      if (rev) {
        rev.approved = true;
        rev.approvedBy = r.actor;
        rev.approvedAt = String(p.approvedAt ?? new Date(r.created_at).toISOString());
        rev.approvedVia = String(p.via ?? '');
      }
    }
  }
  return [...byId.values()];
}

async function rowsOf(prisma: PrismaLike, decisionId: string): Promise<Row[]> {
  return prisma.gapAuditEvent.findMany({ where: { subject_type: REVISION_SUBJECT_TYPE, subject_id: decisionId, kind: { in: [COPY_REVISION_PROPOSED, COPY_REVISION_APPROVED] } }, orderBy: [{ created_at: 'asc' }] });
}

/** Every revision proposed for a card and step, newest first. */
export async function loadProposedCopyRevisions(prisma: PrismaLike, args: { decisionId: string; stepIndex: number }): Promise<CopyRevision[]> {
  return fold(await rowsOf(prisma, args.decisionId))
    .filter((r) => r.stepIndex === args.stepIndex)
    .map((r) => ({ ...r, decisionId: args.decisionId }))
    .sort((a, b) => b.proposedAt.localeCompare(a.proposedAt));
}

/** The approved revision in force for a card and step (the newest approval), or null. */
export async function loadApprovedCopyRevision(prisma: PrismaLike, args: { decisionId: string; stepIndex: number }): Promise<CopyRevision | null> {
  const approved = (await loadProposedCopyRevisions(prisma, args)).filter((r) => r.approved);
  if (!approved.length) return null;
  return approved.sort((a, b) => String(b.approvedAt).localeCompare(String(a.approvedAt)))[0];
}

export type ApproveResult = { ok: true; revisionId: string; contentHash: string } | { ok: false; reason: 'revision_not_found' | 'already_approved' | 'compile_not_cleared' };

/** Approve a proposed revision: it becomes what the card renders, drafts and sends from now on. */
export async function approveCopyRevision(prisma: PrismaLike, input: { decisionId: string; revisionId: string; actor: string; via: 'email' | 'app' }, now: Date): Promise<ApproveResult> {
  const rev = fold(await rowsOf(prisma, input.decisionId)).find((r) => r.revisionId === input.revisionId);
  if (!rev) return { ok: false, reason: 'revision_not_found' };
  if (rev.approved) return { ok: false, reason: 'already_approved' };
  let cleared = rev.compileVerdict === 'pass';
  if (!cleared && rev.compileVerdict === 'review_required' && rev.compileId) cleared = (await isApproved(prisma, rev.compileId).catch(() => ({ approved: false }))).approved;
  if (!cleared) return { ok: false, reason: 'compile_not_cleared' };
  await prisma.gapAuditEvent.create({
    data: { kind: COPY_REVISION_APPROVED, actor: input.actor, subject_type: REVISION_SUBJECT_TYPE, subject_id: input.decisionId, payload: { revisionId: rev.revisionId, stepIndex: rev.stepIndex, contentHash: rev.contentHash, via: input.via, approvedAt: now.toISOString() } },
  });
  return { ok: true, revisionId: rev.revisionId, contentHash: rev.contentHash };
}
