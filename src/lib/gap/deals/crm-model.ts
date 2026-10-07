/**
 * BOUNDED, RECOVERABLE CRM SYNC, the model (GAP OS execution recovery, R54, 2026-10-06). Pure and client-safe.
 *
 * HubSpot stays the deal authority. GAP's already-authorized automatic activity logging (the mirror module: the
 * hypothesis and disposition notes, behind GAP_HUBSPOT_MIRROR_ENABLED) is unchanged. Anything ELSE GAP would put in
 * HubSpot (a deal note, a deal task, a deal field) is a PROPOSAL the seller sees exactly, then approves with one
 * explicit click: an append-only `crm.sync_proposed` -> `crm.sync_approved` pair, recorded whether or not the write may
 * run. The write runs only when GAP_HUBSPOT_MIRROR_ENABLED is on (it is OFF in production); every outcome is a
 * `crm.sync_result` row, so the state is always visible:
 *
 *   proposed     the exact change, recorded; not approved
 *   approved     approved; the write is starting (or stopped mid-way: retry is safe)
 *   off          approved, NOT written: HubSpot writes are off here (the reason said); nothing reached HubSpot
 *   written      HubSpot holds it (its record id); a retry does nothing
 *   failed       HubSpot refused or did not answer; the proposal (the full text) is kept; retry is safe
 *   conflict     HubSpot holds a NEWER value than the one the seller saw (a human edited it): never overwritten
 *   discarded    the seller dropped it before it was written
 *
 * Idempotent by construction: the proposal id is derived from its origin, kind and exact content, every body carries
 * a stable external id (`gapcrm<id>`) that the writer searches for before creating anything (so a write whose answer
 * was lost is recovered, never duplicated), and the mirror ledger's idempotency row marks it written.
 */

export const CRM_PROPOSED = 'crm.sync_proposed' as const;
export const CRM_APPROVED = 'crm.sync_approved' as const;
export const CRM_ATTEMPT = 'crm.sync_attempt' as const;
export const CRM_RESULT = 'crm.sync_result' as const;
export const CRM_DISCARDED = 'crm.sync_discarded' as const;
export const CRM_KINDS = [CRM_PROPOSED, CRM_APPROVED, CRM_ATTEMPT, CRM_RESULT, CRM_DISCARDED] as const;
export const CRM_SUBJECT = 'crm_sync' as const;

/** The only deal fields GAP may propose to change. */
export const CRM_DEAL_PROPERTIES = ['hs_next_step'] as const;
export type CrmDealProperty = (typeof CRM_DEAL_PROPERTIES)[number];

export type CrmChange =
  | { kind: 'note'; objectType: 'deal'; objectId: string; body: string }
  | { kind: 'task'; objectType: 'deal'; objectId: string; subject: string; body: string; dueAt: string | null }
  | { kind: 'deal_property'; objectType: 'deal'; objectId: string; property: CrmDealProperty; from: string | null; to: string };

/** What in GAP produced the change (origin tracking). */
export interface CrmOrigin {
  kind: 'recap' | 'commitment' | 'plan' | 'capture';
  id: string;
  label: string;
}

export interface CrmProposal {
  proposalId: string;
  accountName: string;
  dealId: string;
  dealName: string | null;
  change: CrmChange;
  /** The stable external id carried in the payload (searched for before any create). */
  externalId: string;
  origin: CrmOrigin;
  proposedAt: string;
  proposedBy: string;
}

export type CrmState = 'proposed' | 'approved' | 'off' | 'written' | 'failed' | 'conflict' | 'discarded';

export interface CrmSyncItem extends CrmProposal {
  state: CrmState;
  approvedBy: string | null;
  approvedAt: string | null;
  /** The HubSpot record id once written. */
  objectRef: string | null;
  /** The last error, the reason writes are off, or the newer HubSpot value (conflict). */
  detail: string | null;
  attempts: number;
  lastAttemptAt: string | null;
}

/** A small, stable, client-safe hash (FNV-1a, 52 bits) for derived ids. */
export function stableHash(s: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${(h2 & 0xfffff).toString(16).padStart(5, '0')}`;
}

/** What the content of a change is, without the marker (the id is derived from it). */
const contentOf = (c: CrmChange) => (c.kind === 'note' ? c.body : c.kind === 'task' ? `${c.subject}\n${c.body}\n${c.dueAt ?? ''}` : `${c.property}=${c.to}`);

/** The proposal id: one per origin, kind, object and exact content, so the same approval can never make a second. */
export const proposalIdFor = (origin: Pick<CrmOrigin, 'kind' | 'id'>, change: CrmChange) => `crm${stableHash(`${origin.kind}:${origin.id}|${change.kind}|${change.objectType}:${change.objectId}|${contentOf(change)}`)}`;
export const externalIdFor = (proposalId: string) => `gapcrm${proposalId.replace(/^crm/, '')}`;
export const MARKER_LINE = (externalId: string) => `GAP reference ${externalId}`;

/** The exact text HubSpot will hold for a note or a task body: the content and, last, the external id line. */
export function withMarker(body: string, externalId: string): string {
  return `${body.replace(/\s+$/, '')}\n\n${MARKER_LINE(externalId)}`;
}

/** The exact change as the seller reads it on the page. */
export function changeText(p: Pick<CrmProposal, 'change' | 'dealName' | 'dealId' | 'externalId'>): string {
  const deal = p.dealName ?? `deal ${p.dealId}`;
  const c = p.change;
  if (c.kind === 'note') return `Add a note to the HubSpot deal "${deal}":\n${withMarker(c.body, p.externalId)}`;
  if (c.kind === 'task') return `Create a HubSpot task on "${deal}": "${c.subject}"${c.dueAt ? `, due ${new Date(c.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}` : ', no due date'}.\n${withMarker(c.body, p.externalId)}`;
  return `Change "${deal}" next step in HubSpot from ${c.from ? `"${c.from}"` : 'empty'} to "${c.to}". Not written if HubSpot holds a newer value than "${c.from ?? ''}".`;
}

export interface CrmRow {
  kind: string;
  actor: string;
  payload: Record<string, unknown> | null;
  created_at: Date | string;
}

/** Fold the append-only rows into one item per proposal (any row order). */
export function foldCrmSync(rows: readonly CrmRow[]): CrmSyncItem[] {
  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const items = new Map<string, CrmSyncItem>();
  for (const r of sorted) {
    const p = r.payload ?? {};
    const id = typeof p.proposalId === 'string' ? p.proposalId : null;
    if (!id) continue;
    const at = new Date(r.created_at).toISOString();
    if (r.kind === CRM_PROPOSED) {
      if (items.has(id)) continue;
      const proposal = p.proposal as CrmProposal | undefined;
      if (!proposal || !proposal.change) continue;
      items.set(id, { ...proposal, state: 'proposed', approvedBy: null, approvedAt: null, objectRef: null, detail: null, attempts: 0, lastAttemptAt: null });
      continue;
    }
    const it = items.get(id);
    if (!it) continue;
    if (r.kind === CRM_APPROVED && !it.approvedAt) {
      it.approvedBy = r.actor;
      it.approvedAt = at;
      if (it.state === 'proposed') it.state = 'approved';
    } else if (r.kind === CRM_ATTEMPT) {
      it.attempts += 1;
      it.lastAttemptAt = at;
      if (it.state !== 'written' && it.state !== 'discarded') it.state = 'approved';
    } else if (r.kind === CRM_RESULT && it.state !== 'written' && it.state !== 'discarded') {
      const outcome = String(p.outcome ?? '');
      it.state = outcome === 'written' || outcome === 'recovered' ? 'written' : outcome === 'off' ? 'off' : outcome === 'conflict' ? 'conflict' : 'failed';
      it.objectRef = typeof p.objectRef === 'string' ? p.objectRef : it.objectRef;
      it.detail = typeof p.detail === 'string' ? p.detail : null;
    } else if (r.kind === CRM_DISCARDED && it.state !== 'written') {
      it.state = 'discarded';
      it.detail = typeof p.reason === 'string' ? p.reason : null;
    }
  }
  return [...items.values()];
}

/** One seller line per state. */
export function crmStateLine(it: Pick<CrmSyncItem, 'state' | 'detail' | 'objectRef' | 'approvedBy'>): string {
  switch (it.state) {
    case 'proposed':
      return 'Proposed: not approved, nothing written.';
    case 'approved':
      return 'Approved: the write was started and has no answer yet. Retry is safe (it never writes twice).';
    case 'off':
      return `Approved by ${it.approvedBy ?? 'you'}, not written: HubSpot writes are off here${it.detail ? ` (${it.detail})` : ''}. Nothing reached HubSpot.`;
    case 'written':
      return `Written to HubSpot${it.objectRef ? ` (record ${it.objectRef})` : ''}.`;
    case 'failed':
      return `Not written: ${it.detail ?? 'HubSpot did not answer'}. The text is kept here; retry is safe.`;
    case 'conflict':
      return `Not written: HubSpot holds a newer value${it.detail ? ` (${it.detail})` : ''}. Your CRM's newer value stands.`;
    case 'discarded':
      return `Discarded${it.detail ? `: ${it.detail}` : ''}. Nothing was written.`;
  }
}

/**
 * The changes GAP may propose for one deal (exact, nothing recorded until the seller approves one): the agreed recap
 * as a deal note, a task per open seller obligation on the deal (at most three), and the deal's next step from the
 * plan's next agreed milestone when it differs from what HubSpot holds.
 */
export function crmCandidates(i: {
  deal: { id: string; name: string | null; nextStep: string | null };
  recap: { text: string; ready: boolean } | null;
  commitments: ReadonlyArray<{ commitmentId: string; kind: string; title: string; basis: string | null; dueAt: string | null; status: string }>;
  nextMilestone: { commitmentId: string; title: string; dueDay: string | null } | null;
}): Array<{ change: CrmChange; origin: CrmOrigin }> {
  const out: Array<{ change: CrmChange; origin: CrmOrigin }> = [];
  if (i.recap?.ready) out.push({ change: { kind: 'note', objectType: 'deal', objectId: i.deal.id, body: i.recap.text }, origin: { kind: 'recap', id: `${i.deal.id}:${stableHash(i.recap.text)}`, label: 'the agreed recap prepared in GAP' } });
  for (const c of i.commitments.filter((x) => (x.kind === 'deliverable' || x.kind === 'answer_request' || x.kind === 'deal_step') && x.status === 'open').slice(0, 3)) {
    out.push({ change: { kind: 'task', objectType: 'deal', objectId: i.deal.id, subject: c.title.slice(0, 200), body: `${c.title}${c.basis ? `\n${c.basis}` : ''}\nFrom GAP: an obligation recorded in GAP.`, dueAt: c.dueAt }, origin: { kind: 'commitment', id: c.commitmentId, label: `the GAP obligation "${c.title}"` } });
  }
  if (i.nextMilestone) {
    const to = `${i.nextMilestone.title}${i.nextMilestone.dueDay ? ` (by ${i.nextMilestone.dueDay})` : ''}`.slice(0, 250);
    if (to !== (i.deal.nextStep ?? '')) out.push({ change: { kind: 'deal_property', objectType: 'deal', objectId: i.deal.id, property: 'hs_next_step', from: i.deal.nextStep, to }, origin: { kind: 'plan', id: i.nextMilestone.commitmentId, label: 'the next agreed milestone in the plan' } });
  }
  return out;
}
