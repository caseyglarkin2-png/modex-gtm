/**
 * Phase 2 C2-C4: account motion. One cold email motion per account; the
 * primary is Casey's choice or a suggestion with visible factors; NEXT shows
 * the condition that unlocks it; a reply pauses the whole account.
 */
import { describe, expect, it, vi } from 'vitest';
import { computeAccountMotion, rankCandidates, titleSeniority, type MotionCard } from '@/lib/gap/motion/account-motion';
import { accountMotionRefusal, loadAccountFirstTouches } from '@/lib/gap/motion/load';
import { DIRECT_SENT, DRAFTED, DRAFT_DISCARDED, DRAFT_SENT } from '@/lib/gap/execution/draft-ledger';
import { addBusinessDays } from '@/lib/gap/sequence/business-days';

const NOW = new Date('2026-09-30T15:00:00.000Z'); // a Wednesday
const card = (id: string, pid: number, title: string, personaKey: string, over: Partial<MotionCard['persona']> = {}): MotionCard => ({
  id,
  action: 'one_off_email',
  account: { name: 'PepsiCo' },
  persona: { id: pid, displayName: `${id.toUpperCase()} Person`, title, email: `${id}@pepsico.com`, personaKey, phone: null, ...over },
  hypothesis: { id: `h-${id}`, status: 'active', persona: 'supply_chain' },
  createdAt: NOW,
});
const vp = card('vp', 1, 'VP Supply Chain', 'supply_chain', { phone: '+15550000000' });
const dir = card('dir', 2, 'Director of DC Operations', 'distribution');
const mgr = card('mgr', 3, 'Supply Chain Manager', 'supply_chain');
const base = { accountName: 'PepsiCo', choice: null, firstTouches: [], replyHold: null, now: NOW };

describe('titleSeniority / rankCandidates: visible factors, no score', () => {
  // V2 (Casey's person prior, 2026-10-02): the same order as the account brief's WHO. Operating lane, US / North
  // America remit and network scope come before the thesis role and seniority, so a network director of DC operations
  // outranks a supply chain manager who merely matches the thesis role.
  it('ranks by the person prior (lane, region, scope), then the thesis role, seniority and reachability, and says why', () => {
    expect(titleSeniority('SVP, Chief Supply Chain Officer')).toBe(5);
    expect(titleSeniority('VP Supply Chain')).toBe(4);
    const r = rankCandidates([mgr, dir, vp], new Set(['supply_chain']));
    expect(r.map((x) => x.card.id)).toEqual(['vp', 'dir', 'mgr']);
    expect(r[0].factors).toEqual(['Adjacent operator (VP Supply Chain)', "US location unknown (no remit stated; the company's country is not the person's)", 'VP', 'matches the thesis role (supply chain)', 'email and phone']);
    const t = rankCandidates([vp, card('tr', 4, 'NA Transportation Operations Director', 'distribution')], new Set(['supply_chain']));
    expect(t[0].card.id).toBe('tr');
  });
});

describe('computeAccountMotion', () => {
  it('READY: exactly one primary; every other email card is held as NEXT with its unlock condition', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [mgr, dir, vp] });
    expect(m.state).toBe('ready');
    expect(m.primary).toMatchObject({ personaId: 1, chosen: false });
    expect(m.heldCardIds.sort()).toEqual(['dir', 'mgr']);
    expect(m.next).toMatchObject({ personaId: 2 });
    expect(m.next!.unlock).toContain('5 business days with no response');
    expect(m.headline).toBe('Suggested primary: VP Person.');
    // Review C P1: nobody held is invisible. The third person is listed and choosable.
    expect(m.alsoWaiting.map((p) => p.personaId)).toEqual([3]);
  });

  it('an outstanding first-touch draft holds the account until it is sent or deleted, however old', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [dir, mgr], firstTouches: [{ personaId: 1, recipient: 'vp@pepsico.com', sentAt: '2026-08-01T12:00:00.000Z', released: false, outstanding: true }] });
    expect(m.state).toBe('in_motion');
    expect(m.headline).toContain('first-touch draft to vp@pepsico.com is outstanding');
    expect(m.next!.unlock).toContain('is sent (then 5 business days) or deleted');
    expect(m.heldCardIds.sort()).toEqual(['dir', 'mgr']);
  });

  it("Casey's choice wins over the suggestion", () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [mgr, dir, vp], choice: { primaryPersonaId: 2, nextPersonaId: 1, by: 'casey', at: NOW.toISOString() } });
    expect(m.primary).toMatchObject({ personaId: 2, chosen: true });
    expect(m.next).toMatchObject({ personaId: 1 });
    expect(m.heldCardIds.sort()).toEqual(['mgr', 'vp']);
  });

  it('IN MOTION: a first touch 2 business days ago holds everyone else until 5 business days pass', () => {
    const sentAt = new Date('2026-09-28T14:00:00.000Z').toISOString(); // Monday
    const m = computeAccountMotion({ ...base, readyEmailCards: [dir, mgr], firstTouches: [{ personaId: 1, recipient: 'vp@pepsico.com', sentAt, released: false }] });
    expect(m.state).toBe('in_motion');
    expect(m.heldCardIds.sort()).toEqual(['dir', 'mgr']);
    expect(m.next!.unlockAt).toBe(addBusinessDays(new Date(sentAt), 5).toISOString());
    expect(m.next!.unlock).toMatch(/with no response \(5 business days\)/);
  });

  it('after 5 business days with no response the next person unlocks as the primary', () => {
    const sentAt = new Date('2026-09-21T14:00:00.000Z').toISOString();
    const m = computeAccountMotion({ ...base, readyEmailCards: [dir, mgr], firstTouches: [{ personaId: 1, recipient: 'vp@pepsico.com', sentAt, released: false }] });
    expect(m.state).toBe('ready');
    expect(m.primary!.factors.join(' ')).toContain('unlocked: no response since 2026-09-21');
    expect(m.heldCardIds).toHaveLength(1);
  });

  it("a failed address releases the motion at once (Next if primary is invalid)", () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [dir, mgr], firstTouches: [{ personaId: 1, recipient: 'vp@pepsico.com', sentAt: NOW.toISOString(), released: true }] });
    expect(m.state).toBe('ready');
    expect(m.headline).toContain('An earlier address failed');
  });

  it('PAUSED: a reply from anyone at the account holds every cold email there until it is triaged', () => {
    const m = computeAccountMotion({ ...base, readyEmailCards: [vp, dir], replyHold: { from: 'assistant@pepsico.com', receivedAt: '2026-09-29T12:00:00.000Z' } });
    expect(m.state).toBe('paused_reply');
    expect(m.primary).toBeNull();
    expect(m.heldCardIds.sort()).toEqual(['dir', 'vp']);
    expect(m.headline).toContain('Triage it in Replies');
    expect(m.next!.unlock).toContain("reply is triaged");
  });
});

// ---------------------------------------------------------------------------
// Send-gate enforcement (C3) over the append-only ledger
// ---------------------------------------------------------------------------

function ledgerDb(rows: Array<{ kind: string; subject_id: string; payload: Record<string, unknown>; created_at?: Date }>, personas: Array<{ id: number; do_not_contact?: boolean; email_status?: string | null }> = []) {
  return {
    routingDecision: { findMany: vi.fn(async () => [{ id: 'dec-vp', account_name: 'PepsiCo' }, { id: 'dec-dir', account_name: 'PepsiCo' }]) },
    gapAuditEvent: { findMany: vi.fn(async () => rows.map((r) => ({ created_at: NOW, ...r }))) },
    persona: { findMany: vi.fn(async () => personas.map((p) => ({ do_not_contact: false, email_status: null, ...p }))) },
    unsubscribedEmail: { findMany: vi.fn(async () => []) },
  };
}
const sent = (daysAgo: number, pid = 1) => ({ kind: DIRECT_SENT, subject_id: 'dec-vp', payload: { accountName: 'PepsiCo', personaId: pid, recipient: 'vp@pepsico.com', stepIndex: 0, sentAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString() } });

describe('accountMotionRefusal (send gate, step 0)', () => {
  const ask = (db: unknown, personaId = 2, email = 'dir@pepsico.com') => accountMotionRefusal(db, { accountName: 'PepsiCo', personaId, email, now: NOW });

  it('another person got a first touch 2 days ago: refused with the unlock date', async () => {
    const r = await ask(ledgerDb([sent(2)], [{ id: 1 }]));
    expect(r).toMatchObject({ owner: 'vp@pepsico.com' });
    expect(r!.unlockAt.slice(0, 10)).toBe(addBusinessDays(new Date(sent(2).payload.sentAt as string), 5).toISOString().slice(0, 10));
  });

  it('the same person (their own follow-up context) is never blocked by their own motion', async () => {
    expect(await ask(ledgerDb([sent(2)], [{ id: 1 }]), 1, 'vp@pepsico.com')).toBeNull();
  });

  it('past the unlock window, or the owner bounced / is DNC: allowed', async () => {
    expect(await ask(ledgerDb([sent(9)], [{ id: 1 }]))).toBeNull();
    expect(await ask(ledgerDb([sent(1)], [{ id: 1, email_status: 'hard_bounce' }]))).toBeNull();
    expect(await ask(ledgerDb([sent(1)], [{ id: 1, do_not_contact: true }]))).toBeNull();
  });

  it('review C P1: a draft sent from Gmail is dated by its real send, not by when it was drafted', async () => {
    const drafted = { kind: DRAFTED, subject_id: 'dec-vp', payload: { accountName: 'PepsiCo', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0, gmailDraftId: 'd1', createdAt: new Date(NOW.getTime() - 20 * 86_400_000).toISOString() }, created_at: new Date(NOW.getTime() - 20 * 86_400_000) };
    const sentYesterday = { kind: DRAFT_SENT, subject_id: 'dec-vp', payload: { gmailDraftId: 'd1', sentAt: new Date(NOW.getTime() - 86_400_000).toISOString() } };
    const r = await ask(ledgerDb([drafted, sentYesterday], [{ id: 1 }]));
    expect(r).not.toBeNull();
    expect(r!.sentAt.slice(0, 10)).toBe(new Date(NOW.getTime() - 86_400_000).toISOString().slice(0, 10));
  });

  it('review C P1: an outstanding draft keeps holding past 5 business days and past 30 days', async () => {
    const old = { kind: DRAFTED, subject_id: 'dec-vp', payload: { accountName: 'PepsiCo', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0, gmailDraftId: 'd1', createdAt: new Date(NOW.getTime() - 45 * 86_400_000).toISOString() }, created_at: new Date(NOW.getTime() - 45 * 86_400_000) };
    const r = await ask(ledgerDb([old], [{ id: 1 }]));
    expect(r).toMatchObject({ unlockAt: 'after that draft is sent or deleted' });
  });

  it('an outstanding first-touch DRAFT is a motion in flight; a discarded one is not', async () => {
    const drafted = { kind: DRAFTED, subject_id: 'dec-vp', payload: { accountName: 'PepsiCo', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0, gmailDraftId: 'd1', createdAt: NOW.toISOString() } };
    expect(await ask(ledgerDb([drafted], [{ id: 1 }]))).not.toBeNull();
    expect(await ask(ledgerDb([drafted, { kind: DRAFT_DISCARDED, subject_id: 'dec-vp', payload: { gmailDraftId: 'd1' } }], [{ id: 1 }]))).toBeNull();
  });

  it('follow-up steps are not first touches', async () => {
    const touches = await loadAccountFirstTouches(ledgerDb([{ ...sent(1), payload: { ...sent(1).payload, stepIndex: 2 } }], [{ id: 1 }]), ['PepsiCo'], NOW);
    expect(touches.get('PepsiCo') ?? []).toEqual([]);
  });
});
