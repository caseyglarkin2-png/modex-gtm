/**
 * BOUNDED, RECOVERABLE CRM SYNC, the model (GAP OS execution recovery, R54, 2026-10-06). Pure and client-safe.
 *
 * HubSpot stays the deal authority. GAP's already-authorized automatic activity logging (the mirror module: the
 * hypothesis and disposition notes, behind GAP_HUBSPOT_MIRROR_ENABLED) is unchanged. Anything ELSE GAP would put in
 * HubSpot (a deal note, a deal task, a deal field) is a PROPOSAL the seller sees exactly, then approves with one
 * explicit click: an append-only `crm.sync_proposed` -> `crm.sync_approved` pair, recorded whether or not the write may
 * run. The write runs only when GAP_CRM_APPROVED_WRITES_ENABLED is on (batch item 9: its own flag, separate from the
 * automatic mirror's; OFF by default); every outcome is a `crm.sync_result` row, so the state is always visible:
 *
 *   proposed     the exact change, recorded; not approved
 *   approved     approved; the write is starting (or stopped mid-way: retry is safe)
 *   off          approved, NOT written: HubSpot writes are off here (the reason said); nothing reached HubSpot
 *   written      HubSpot holds it (its record id); a retry does nothing
 *   failed       HubSpot refused or did not answer; the proposal (the full text) is kept; retry is safe
 *   conflict     HubSpot holds a NEWER value than the one the seller saw (a human edited it): never overwritten
 *   discarded    the seller dropped it before it was written
 *
 * Batch item 9: an approval or a retry is refused (`origin_closed`, nothing called) when the obligation it came from is
 * done or skipped or the deal closed; a done obligation proposes completing its task; amending an obligation revises its
 * ONE task (the id is the obligation and the kind, the text is the change); a deal field's id carries the value the
 * seller saw, so after a conflict the step can be proposed again from HubSpot's newer value.
 *
 * Idempotent by construction: the proposal id is derived from its origin, kind and content, every body carries
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
  /** Batch item 9: the obligation is done in GAP: mark its HubSpot task (found by its GAP reference) completed. */
  | { kind: 'task_complete'; objectType: 'deal'; objectId: string; subject: string }
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

/** Batch item 9: the refusals an approval or a retry can answer, in seller words. */
export const CRM_REFUSAL_TEXT: Record<string, string> = {
  origin_closed: 'what it came from is closed (the obligation is done or skipped, or the deal closed): nothing was written',
  bad_origin: 'GAP holds no such origin on this deal: nothing was recorded',
  deal_unverified: 'HubSpot could not confirm this is an open deal of the account just now: nothing was recorded. Try again',
  not_approved: 'it was never approved',
  discarded: 'it was discarded',
  already_written: 'it is already in HubSpot',
  in_progress: 'a write is already in progress',
};

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
  /** Batch item 9: the obligation was amended after the proposal: its one task carries the newer text (approve again). */
  revisedAt?: string | null;
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

/** What the content of a change is, without the marker. */
export const contentOf = (c: CrmChange) => (c.kind === 'note' ? c.body : c.kind === 'task' ? `${c.subject}\n${c.body}\n${c.dueAt ?? ''}` : c.kind === 'task_complete' ? `complete:${c.subject}` : `${c.property}:${c.from ?? ''}->${c.to}`);

/** Is this the same exact change (the content the seller would approve)? */
export const sameChange = (a: CrmChange, b: CrmChange) => a.kind === b.kind && a.objectId === b.objectId && contentOf(a) === contentOf(b);

/**
 * The proposal id. Batch item 9 (addendum b): an obligation's task (and its completion) is keyed on the obligation and
 * the kind, never its text, so amending the obligation revises its ONE task; a deal field is keyed on the value the
 * seller saw and the new one (after a conflict, HubSpot's newer value opens a new proposal); a note stays keyed on its
 * exact text. The same approval can never make a second.
 */
export const proposalIdFor = (origin: Pick<CrmOrigin, 'kind' | 'id'>, change: CrmChange) => {
  const object = `${change.objectType}:${change.objectId}`;
  if ((origin.kind === 'commitment' || origin.kind === 'plan') && (change.kind === 'task' || change.kind === 'task_complete')) return `crm${stableHash(`${origin.kind}:${origin.id}|${change.kind}|${object}`)}`;
  return `crm${stableHash(`${origin.kind}:${origin.id}|${change.kind}|${object}|${contentOf(change)}`)}`;
};
export const externalIdFor = (proposalId: string) => `gapcrm${proposalId.replace(/^crm/, '')}`;
/** Batch item 9: the GAP reference of an obligation's task on a deal (what a completion looks for in HubSpot). */
export const taskExternalIdFor = (origin: Pick<CrmOrigin, 'kind' | 'id'>, dealId: string) => externalIdFor(proposalIdFor(origin, { kind: 'task', objectType: 'deal', objectId: dealId, subject: '', body: '', dueAt: null }));
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
  if (c.kind === 'task') return `Create a HubSpot task on "${deal}": "${c.subject}"${c.dueAt ? `, due ${new Date(c.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}` : ', no due date in GAP (HubSpot needs one: it shows the next business day)'}, owned by the person who approves it.\n${withMarker(c.body, p.externalId)}`;
  if (c.kind === 'task_complete') return `Mark the HubSpot task "${c.subject}" on "${deal}" completed: it is done in GAP.`;
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
      const proposal = p.proposal as CrmProposal | undefined;
      if (!proposal || !proposal.change) continue;
      const have = items.get(id);
      // Batch item 9: a revision (the obligation was amended) carries the newer text into the same proposal and asks for
      // a new approval; a discarded proposal stays discarded.
      if (have) {
        if (p.revision === true && have.state !== 'discarded') {
          have.change = proposal.change;
          have.revisedAt = at;
          have.state = 'proposed';
          have.approvedAt = null;
          have.approvedBy = null;
          have.detail = null;
        }
        continue;
      }
      items.set(id, { ...proposal, state: 'proposed', approvedBy: null, approvedAt: null, objectRef: null, detail: null, attempts: 0, lastAttemptAt: null, revisedAt: null });
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
      return it.objectRef ? 'Updated in GAP since it was written: approve again to update the task in HubSpot.' : 'Proposed: not approved, nothing written.';
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
  /** Batch item 9: obligations done in GAP whose task is in HubSpot (each proposes completing that task). */
  completions?: ReadonlyArray<{ commitmentId: string; title: string }>;
}): Array<{ change: CrmChange; origin: CrmOrigin }> {
  const out: Array<{ change: CrmChange; origin: CrmOrigin }> = [];
  if (i.recap?.ready) out.push({ change: { kind: 'note', objectType: 'deal', objectId: i.deal.id, body: i.recap.text }, origin: { kind: 'recap', id: `${i.deal.id}:${stableHash(i.recap.text)}`, label: 'the agreed recap prepared in GAP' } });
  for (const c of i.commitments.filter((x) => (x.kind === 'deliverable' || x.kind === 'answer_request' || x.kind === 'deal_step') && x.status === 'open').slice(0, 3)) {
    out.push({ change: { kind: 'task', objectType: 'deal', objectId: i.deal.id, subject: c.title.slice(0, 200), body: `${c.title}${c.basis ? `\n${c.basis}` : ''}\nFrom GAP: an obligation recorded in GAP.`, dueAt: c.dueAt }, origin: { kind: 'commitment', id: c.commitmentId, label: `the GAP obligation "${c.title}"` } });
  }
  for (const c of i.completions ?? []) {
    out.push({ change: { kind: 'task_complete', objectType: 'deal', objectId: i.deal.id, subject: c.title.slice(0, 200) }, origin: { kind: 'commitment', id: c.commitmentId, label: `the GAP obligation "${c.title}", done in GAP` } });
  }
  if (i.nextMilestone) {
    const to = `${i.nextMilestone.title}${i.nextMilestone.dueDay ? ` (by ${i.nextMilestone.dueDay})` : ''}`.slice(0, 250);
    if (to !== (i.deal.nextStep ?? '')) out.push({ change: { kind: 'deal_property', objectType: 'deal', objectId: i.deal.id, property: 'hs_next_step', from: i.deal.nextStep, to }, origin: { kind: 'plan', id: i.nextMilestone.commitmentId, label: 'the next agreed milestone in the plan' } });
  }
  return out;
}
