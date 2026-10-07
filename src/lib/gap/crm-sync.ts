/**
 * BOUNDED, RECOVERABLE CRM SYNC, the store (GAP OS execution recovery, R54, 2026-10-06). Server only. The model and the
 * states are in ./deals/crm-model.ts; the HubSpot calls in ./crm-writer.ts (beside the automatic mirror, the same flag).
 *
 * Storage: the append-only ledger (`gapAuditEvent`, subject `crm_sync` / the proposal id, the account in every
 * payload) and the mirror's idempotency table (`gapHubSpotMirror`, key `gap:crm:<proposal id>`, the same row encoding
 * as hubspot-mirror.ts: error null = written). No new table.
 *
 * The approval click (`approveCrmChange`), in order:
 *   1. under an advisory lock on the proposal: a written proposal answers "written" with no call; an attempt started
 *      in the last minute with no result answers "in progress" (a double click or two tabs never write twice);
 *      otherwise the approval row (once) and an attempt row are recorded, and the lock is released
 *   0. batch item 9: the origin is still live (deals/crm-model.ts `originProblem`): an obligation done or skipped, or a
 *      deal the closure ledger says closed, answers `origin_closed` (a retry of an "off" approval included); an origin
 *      GAP does not hold answers `bad_origin`. Nothing is recorded and nothing is called.
 *   2. the gates: GAP_OS_ENABLED, GAP_CRM_APPROVED_WRITES_ENABLED (batch item 9: its own flag, off by default; never the
 *      automatic mirror's), HUBSPOT_SYNC_ENABLED, a HubSpot token;
 *      any one off records "off" with the reason: the proposal and the approval stand, nothing reaches HubSpot
 *   3. the mirror row says written: "written", no call
 *   4. read before write: a note or task already carrying the external id is RECOVERED (never created twice); a deal
 *      field whose current value or last change is newer than what the seller saw is a CONFLICT (never overwritten)
 *   5. the write, then the mirror row and the result; a throw records "failed" with the reason (the proposal keeps
 *      the full text; nothing local is rolled back, so a CRM outage loses no note and no completion receipt)
 * Retry is the same click on an approved proposal. Discard drops a proposal that is not written.
 */
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { gapFlag, isGapOsEnabled } from './flags';
import {
  CRM_APPROVED,
  CRM_ATTEMPT,
  CRM_DEAL_PROPERTIES,
  CRM_DISCARDED,
  CRM_KINDS,
  CRM_PROPOSED,
  CRM_RESULT,
  CRM_SUBJECT,
  externalIdFor,
  foldCrmSync,
  proposalIdFor,
  sameChange,
  stableHash,
  taskExternalIdFor,
  withMarker,
  type CrmChange,
  type CrmOrigin,
  type CrmProposal,
  type CrmRow,
  type CrmSyncItem,
} from './deals/crm-model';
import type { CrmWriter } from './crm-writer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** An attempt with no result younger than this is in flight: the click answers "in progress". */
export const ATTEMPT_IN_FLIGHT_MS = 60_000;
export const NOTE_BODY_MAX = 5_000;

export type CrmRefusal = 'account_not_found' | 'bad_change' | 'not_found' | 'discarded' | 'already_written' | 'in_progress' | 'not_approved' | 'origin_closed' | 'bad_origin';

export interface CrmDeps {
  writer?: CrmWriter;
  /** Default: the GAP flags, HUBSPOT_SYNC_ENABLED and a HubSpot token. */
  writesEnabled?: () => { ok: true } | { ok: false; reason: string };
  /** Default: assertExternalWriteAllowed('hubspot', ...). Must THROW to block. */
  assertWriteAllowed?: () => void;
}

export function crmWritesEnabled(): { ok: true } | { ok: false; reason: string } {
  if (!isGapOsEnabled()) return { ok: false, reason: 'GAP_OS_ENABLED is off' };
  if (!gapFlag('GAP_CRM_APPROVED_WRITES_ENABLED')) return { ok: false, reason: 'GAP_CRM_APPROVED_WRITES_ENABLED is off' };
  if (!HUBSPOT_SYNC_ENABLED) return { ok: false, reason: 'HUBSPOT_SYNC_ENABLED is off' };
  if (!process.env.HUBSPOT_ACCESS_TOKEN?.trim()) return { ok: false, reason: 'no HubSpot token' };
  return { ok: true };
}

const mirrorKey = (proposalId: string) => `gap:crm:${proposalId}`;
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 240);

async function rowsOf(prisma: PrismaLike, proposalId: string): Promise<CrmRow[]> {
  return prisma.gapAuditEvent.findMany({ where: { subject_type: CRM_SUBJECT, subject_id: proposalId }, select: { kind: true, actor: true, payload: true, created_at: true }, orderBy: { created_at: 'asc' } });
}

async function record(prisma: PrismaLike, kind: string, actor: string, proposal: Pick<CrmProposal, 'proposalId' | 'accountName'>, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: CRM_SUBJECT, subject_id: proposal.proposalId, payload: JSON.parse(JSON.stringify({ proposalId: proposal.proposalId, accountName: proposal.accountName, ...payload })) } });
}

async function locked<T>(prisma: PrismaLike, id: string, fn: (tx: PrismaLike) => Promise<T>): Promise<T> {
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return fn(prisma);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_crm:${id}`}))`;
    return fn(tx);
  });
}

/** Shape and bounds of a change (the route already parsed it; this is the service's own refusal). */
export function changeProblem(c: CrmChange): string | null {
  if (c.objectType !== 'deal' || !/^\d{1,24}$/.test(c.objectId)) return 'the change must target a HubSpot deal by its id';
  if (c.kind === 'note') return c.body.trim() && c.body.length <= NOTE_BODY_MAX ? null : 'the note is empty or too long';
  if (c.kind === 'task') return c.subject.trim() && c.subject.length <= 200 && c.body.length <= NOTE_BODY_MAX && (c.dueAt === null || !Number.isNaN(new Date(c.dueAt).getTime())) ? null : 'the task needs a subject (and a valid due time)';
  if (c.kind === 'task_complete') return c.subject.trim() && c.subject.length <= 200 ? null : 'a completion names its task';
  if (c.kind === 'deal_property') return (CRM_DEAL_PROPERTIES as readonly string[]).includes(c.property) && c.to.trim() && c.to.length <= 250 ? null : 'only the deal next step may be proposed, with a value';
  return 'unknown change';
}

/**
 * Batch item 9: is what the change came from still live? Read from GAP's own ledger only (never HubSpot): the deal's
 * recorded closure (deals/closure.ts), the obligation's status, the recap's own text. A completion needs its obligation
 * DONE; anything else needs it open. Null when it is.
 */
export async function originProblem(prisma: PrismaLike, it: Pick<CrmProposal, 'accountName' | 'dealId' | 'origin' | 'change'>): Promise<{ reason: 'origin_closed' | 'bad_origin'; detail: string } | null> {
  const { loadDealStates } = await import('./deals/closure');
  const deal = (await loadDealStates(prisma, it.accountName).catch(() => new Map<string, { state: string; at: string }>())).get(it.dealId);
  if (deal && deal.state !== 'open') return { reason: 'origin_closed', detail: `the deal closed (${deal.state}) on ${deal.at.slice(0, 10)}: nothing is written to it` };
  if (it.origin.kind === 'commitment' || it.origin.kind === 'plan') {
    const { loadCommitment } = await import('./work/commitments');
    const c = await loadCommitment(prisma, it.origin.id).catch(() => null);
    if (!c || c.accountName !== it.accountName || (c.dealId && /^\d+$/.test(c.dealId) && c.dealId !== it.dealId)) return { reason: 'bad_origin', detail: 'the obligation it came from is not on this deal' };
    if (it.change.kind === 'task_complete') return c.status === 'done' ? null : { reason: 'bad_origin', detail: `the obligation "${c.title}" is not done in GAP` };
    if (c.status === 'done' || c.status === 'skipped') return { reason: 'origin_closed', detail: `the obligation "${c.title}" is ${c.status} in GAP: nothing is written for it` };
    return null;
  }
  if (it.origin.kind === 'recap') return it.change.kind === 'note' && it.origin.id === `${it.dealId}:${stableHash(it.change.body)}` ? null : { reason: 'bad_origin', detail: 'the recap does not match its own text' };
  return { reason: 'bad_origin', detail: 'GAP holds no such origin' };
}

/** Record the exact proposed change ONCE (its id is its origin, kind and content). */
export async function proposeCrmChange(
  prisma: PrismaLike,
  input: { accountName: string; dealId: string; dealName: string | null; change: CrmChange; origin: CrmOrigin; actor: string; now: Date },
): Promise<{ ok: true; created: boolean; item: CrmSyncItem } | { ok: false; reason: CrmRefusal; detail?: string }> {
  const problem = changeProblem(input.change);
  if (problem || input.change.objectId !== input.dealId) return { ok: false, reason: 'bad_change', detail: problem ?? 'the change targets another deal' };
  const account = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const proposalId = proposalIdFor(input.origin, input.change);
  return locked(prisma, proposalId, async (tx) => {
    const have = foldCrmSync(await rowsOf(tx, proposalId))[0];
    // Batch item 9: the same obligation amended is the same task: a revision carries the newer text (and asks for a
    // new approval); a written task is then updated in place, never created twice. A discarded one stays discarded.
    if (have && have.state !== 'discarded' && !sameChange(have.change, input.change)) {
      const revised: CrmProposal = { proposalId, accountName: have.accountName, dealId: have.dealId, dealName: input.dealName ?? have.dealName, change: input.change, externalId: have.externalId, origin: have.origin, proposedAt: have.proposedAt, proposedBy: have.proposedBy };
      await record(tx, CRM_PROPOSED, input.actor, revised, { proposal: revised, revision: true });
      return { ok: true as const, created: false, item: foldCrmSync(await rowsOf(tx, proposalId))[0] };
    }
    if (have) return { ok: true as const, created: false, item: have };
    const proposal: CrmProposal = { proposalId, accountName: account.name, dealId: input.dealId, dealName: input.dealName, change: input.change, externalId: externalIdFor(proposalId), origin: input.origin, proposedAt: input.now.toISOString(), proposedBy: input.actor };
    await record(tx, CRM_PROPOSED, input.actor, proposal, { proposal });
    return { ok: true as const, created: true, item: foldCrmSync(await rowsOf(tx, proposalId))[0] };
  });
}

/**
 * The explicit approval (and every retry): the approval row once, then the write when the gates allow it. Never
 * throws; every outcome is a recorded state.
 */
export async function approveCrmChange(prisma: PrismaLike, input: { proposalId: string; actor: string; now: Date; retry?: boolean }, deps: CrmDeps = {}): Promise<{ ok: true; item: CrmSyncItem } | { ok: false; reason: CrmRefusal; item?: CrmSyncItem; detail?: string }> {
  // 0. Batch item 9: an approval or a retry is bounded to live work: an origin that closed answers origin_closed and
  // nothing is recorded or called (an "off" approval retried after the flag turns on writes nothing for done work).
  const pre = foldCrmSync(await rowsOf(prisma, input.proposalId))[0];
  if (pre && pre.state !== 'written' && pre.state !== 'discarded') {
    const bad = await originProblem(prisma, pre);
    if (bad) return { ok: false, reason: bad.reason, item: pre, detail: bad.detail };
  }
  // 1. Claim the attempt under the lock (never the external call inside the transaction).
  const claim = await locked(prisma, input.proposalId, async (tx) => {
    const it = foldCrmSync(await rowsOf(tx, input.proposalId))[0];
    if (!it) return { ok: false as const, reason: 'not_found' as const };
    if (it.state === 'discarded') return { ok: false as const, reason: 'discarded' as const, item: it };
    if (it.state === 'written') return { ok: true as const, done: true, item: it };
    if (input.retry && !it.approvedAt) return { ok: false as const, reason: 'not_approved' as const, item: it };
    if (it.state === 'approved' && it.lastAttemptAt && input.now.getTime() - new Date(it.lastAttemptAt).getTime() < ATTEMPT_IN_FLIGHT_MS) return { ok: false as const, reason: 'in_progress' as const, item: it };
    if (!it.approvedAt) await record(tx, CRM_APPROVED, input.actor, it, {});
    await record(tx, CRM_ATTEMPT, input.actor, it, { at: input.now.toISOString() });
    return { ok: true as const, done: false, item: foldCrmSync(await rowsOf(tx, input.proposalId))[0] };
  });
  if (!claim.ok) return claim;
  const it = claim.item;
  if (claim.done) return { ok: true, item: it };
  const finish = async (outcome: 'written' | 'recovered' | 'off' | 'conflict' | 'failed', extra: { objectRef?: string | null; detail?: string | null } = {}) => {
    await record(prisma, CRM_RESULT, input.actor, it, { outcome, objectRef: extra.objectRef ?? null, detail: extra.detail ?? null });
    return { ok: true as const, item: foldCrmSync(await rowsOf(prisma, it.proposalId))[0] };
  };
  // 2. The gates: off records the approval as standing, not written.
  const gate = (deps.writesEnabled ?? crmWritesEnabled)();
  if (!gate.ok) return finish('off', { detail: gate.reason });
  // 3. Already written (the mirror ledger's idempotency row).
  const key = mirrorKey(it.proposalId);
  const prior: { error: string | null; note_id: string | null } | null = await prisma.gapHubSpotMirror.findUnique({ where: { key } }).catch(() => null);
  // (A revised proposal not yet written is an update still to make: the earlier write's row never stops it. Updating the
  // task again after a crash is harmless: it carries the same text.)
  if (prior && prior.error === null && !it.revisedAt) return finish('written', { objectRef: prior.note_id, detail: 'already written' });
  const saveMirror = async (objectRef: string | null, error: string | null) => {
    const fields = { object_type: 'deal', object_id: it.dealId, note_id: objectRef, written_at: input.now, error };
    await prisma.gapHubSpotMirror.upsert({ where: { key }, create: { key, ...fields }, update: fields }).catch(() => undefined);
  };
  try {
    (deps.assertWriteAllowed ?? (() => assertExternalWriteAllowed('hubspot', 'gap.crmSync')))();
    const writer = deps.writer ?? (await import('./crm-writer')).hubspotCrmWriter;
    const c = it.change;
    if (c.kind === 'task_complete') {
      // Batch item 9: the obligation is done in GAP: its task (found by the task's own GAP reference) is completed.
      const task = await writer.findByMarker('tasks', taskExternalIdFor(it.origin, it.dealId));
      if (!task) return finish('failed', { detail: 'no GAP task for this obligation is in HubSpot to complete' });
      await writer.completeTask(task);
      await saveMirror(task, null);
      return finish('written', { objectRef: task, detail: 'the task is completed in HubSpot' });
    }
    if (c.kind === 'note' || c.kind === 'task') {
      // 4. Read before write: the external id finds a write whose answer was lost.
      const found = await writer.findByMarker(c.kind === 'note' ? 'notes' : 'tasks', it.externalId);
      if (found && c.kind === 'task' && it.revisedAt) {
        // Batch item 9: the obligation was amended: its one task is updated in place.
        await writer.updateTask(found, { subject: c.subject, body: withMarker(c.body, it.externalId), dueAt: c.dueAt });
        await saveMirror(found, null);
        return finish('written', { objectRef: found, detail: 'the task is updated in HubSpot' });
      }
      if (found) {
        await saveMirror(found, null);
        return finish('recovered', { objectRef: found, detail: 'found in HubSpot by its GAP reference' });
      }
      const ownerId = c.kind === 'task' ? await writer.ownerIdFor(input.actor).catch(() => null) : null;
      const ref = c.kind === 'note' ? await writer.createNote(c.objectId, withMarker(c.body, it.externalId)) : await writer.createTask(c.objectId, { subject: c.subject, body: withMarker(c.body, it.externalId), dueAt: c.dueAt, ownerId });
      await saveMirror(ref, null);
      return finish('written', { objectRef: ref });
    }
    // A deal field: never overwrite a newer human value.
    const now = await writer.readDealProperty(c.objectId, c.property);
    if (now.value === c.to) {
      await saveMirror(c.objectId, null);
      return finish('written', { objectRef: c.objectId, detail: 'HubSpot already holds this value' });
    }
    const newerThanSeen = (now.value ?? '') !== (c.from ?? '') || (!!now.modifiedAt && now.modifiedAt > it.proposedAt && now.source !== 'INTEGRATION');
    if (newerThanSeen) return finish('conflict', { detail: `"${now.value ?? ''}"${now.modifiedAt ? `, changed ${now.modifiedAt.slice(0, 10)}` : ''}${now.source ? ` by ${now.source}` : ''}` });
    await writer.updateDealProperty(c.objectId, c.property, c.to);
    await saveMirror(c.objectId, null);
    return finish('written', { objectRef: c.objectId });
  } catch (e) {
    await saveMirror(null, errText(e));
    return finish('failed', { detail: errText(e) });
  }
}

/** Drop a proposal that is not written (the rows stay; nothing is deleted). */
export async function discardCrmChange(prisma: PrismaLike, input: { proposalId: string; reason: string | null; actor: string; now: Date }): Promise<{ ok: true; item: CrmSyncItem } | { ok: false; reason: CrmRefusal }> {
  return locked(prisma, input.proposalId, async (tx) => {
    const it = foldCrmSync(await rowsOf(tx, input.proposalId))[0];
    if (!it) return { ok: false as const, reason: 'not_found' as const };
    if (it.state === 'written') return { ok: false as const, reason: 'already_written' as const };
    if (it.state !== 'discarded') await record(tx, CRM_DISCARDED, input.actor, it, { reason: input.reason?.slice(0, 240) ?? null });
    return { ok: true as const, item: foldCrmSync(await rowsOf(tx, input.proposalId))[0] };
  });
}

/** Every proposal at the account, with its state. Soft: an unreadable ledger reads as none. */
export async function loadCrmSync(prisma: PrismaLike, accountName: string): Promise<CrmSyncItem[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: CrmRow[] = await prisma.gapAuditEvent.findMany({ where: { kind: { in: [...CRM_KINDS] }, subject_type: CRM_SUBJECT, payload: { path: ['accountName'], equals: accountName } }, select: { kind: true, actor: true, payload: true, created_at: true }, orderBy: { created_at: 'asc' } }).catch(() => []);
  return foldCrmSync(rows).sort((a, b) => b.proposedAt.localeCompare(a.proposedAt));
}
