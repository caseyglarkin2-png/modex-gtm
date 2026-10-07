/**
 * R52 (GAP OS execution recovery): a practical mutual action plan. Milestones are R40 commitments scoped to the deal
 * once the seller agrees to them in ONE review; GAP's proposals for the standard steps (discovery, site validation,
 * pilot, stakeholder alignment, procurement) stay proposed (never Work) until then; a declined step stays declined; an
 * unknown date or person creates no task and never reads as due; the buyer's agreement is visible as "not recorded"
 * until the seller names who agreed and when, and is never inferred from the seller's own agreement.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';
import { PLAN_STEPS, milestoneLine, planFor } from '@/lib/gap/deals/action-plan';
import { loadPlan, recordBuyerAgreement, reviewPlan } from '@/lib/gap/deals/action-plan-store';
import { ensureCommitment, loadCommitments, withPhases } from '@/lib/gap/work/commitments';
import { workDay } from '@/lib/gap/work/list';
import { todaySummary } from '@/lib/gap/work/today';
import { nyDayAt } from '@/lib/gap/work/dates';
import { DealPlan } from '@/components/gap/deal-plan';

const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return holder.client; } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-06T19:00:00Z');
const ACTOR = 'casey@freightroll.com';
const ACCOUNT = 'Kroger Scratch Co';
const DEAL = '70001';

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
});

const work = (commitments: Parameters<typeof workDay>[0]['commitments'], now = NOW) => workDay({ now, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [{ accountName: ACCOUNT, deals: [{ id: DEAL, name: 'YardFlow - Kroger', stage: 'Appointment scheduled' }] }] }, held: new Map(), commitments });

describe('the plan is proposed, never Work, until the seller agrees (R52)', () => {
  it('with nothing agreed: the five standard steps, all proposed, and no task anywhere', async () => {
    const plan = planFor(DEAL, [], []);
    expect(plan.map((m) => [m.step, m.state, m.commitmentId])).toEqual(PLAN_STEPS.map((s) => [s, 'proposed', null]));
    expect(plan.find((m) => m.step === 'pilot')).toMatchObject({ title: 'Pilot: agree the site, the length and the success measure', after: 'Site validation', proof: 'the pilot plan agreed in writing', buyerAgreed: null });
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const d = work(await loadCommitments(db.client()));
    // The deal's held card carries no obligation: a proposal is no task.
    expect(d.cards.map((c) => [c.accountName, c.tier, c.obligations])).toEqual([[ACCOUNT, 'held', []]]);
    expect(d.waiting).toEqual([]);
    expect(db.store.gapAuditEvent).toEqual([]);
  });

  it('ONE review: agree (with edits), decline and leave the rest proposed; each answered on its own; the buyer\'s agreement only when the seller names who and when', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const r = await reviewPlan(p, {
      accountName: ACCOUNT,
      dealId: DEAL,
      actor: ACTOR,
      now: NOW,
      items: [
        { step: 'discovery', decision: 'agree' },
        { step: 'pilot', decision: 'agree', title: 'Pilot at Columbus: two weeks, gate check-in time', dueDay: '2026-10-20', responsible: { side: 'buyer', name: 'Ann Scratch' }, buyerAgreed: { by: 'Ann Scratch', on: '2026-10-05' } },
        { step: 'procurement', decision: 'decline', reason: 'they buy through the pilot budget' },
        { step: 'stakeholder_alignment', decision: 'agree', buyerAgreed: { by: 'Ann Scratch', on: 'next week' } },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.results).toEqual([
      { step: 'discovery', ok: true, commitmentId: `plan:${DEAL}:discovery`, created: true },
      { step: 'pilot', ok: true, commitmentId: `plan:${DEAL}:pilot`, created: true },
      { step: 'procurement', ok: true, commitmentId: null, created: false },
      { step: 'stakeholder_alignment', ok: false, reason: 'bad_buyer_agreement' },
    ]);
    const by = (s: string) => r.plan.find((m) => m.step === s)!;
    expect(r.plan.map((m) => [m.step, m.state])).toEqual([['discovery', 'agreed'], ['site_validation', 'proposed'], ['pilot', 'agreed'], ['stakeholder_alignment', 'proposed'], ['procurement', 'declined']]);
    // The seller agreed to discovery; the buyer's agreement was not said, so it is not recorded (never inferred).
    expect(by('discovery')).toMatchObject({ buyerAgreed: null, dueDay: null, responsible: null, line: 'No date agreed yet.', phase: 'upcoming' });
    expect(milestoneLine(by('discovery'))).toBe('Who: not set. No date agreed yet. Buyer agreement: not recorded. Proof: their words on the problem, confirmed in GAP.');
    expect(by('pilot')).toMatchObject({ title: 'Pilot at Columbus: two weeks, gate check-in time', dueDay: '2026-10-20', responsible: { side: 'buyer', name: 'Ann Scratch' }, buyerAgreed: { by: 'Ann Scratch', on: '2026-10-05' }, phase: 'waiting' });
    expect(milestoneLine(by('pilot'))).toBe('Their side: Ann Scratch. Waiting on Ann Scratch: Pilot at Columbus: two weeks, gate check-in time; due Oct 20. Buyer agreed: Ann Scratch, 2026-10-05. After site validation. Proof: the pilot plan agreed in writing.');
    expect(by('procurement').declined).toMatchObject({ reason: 'they buy through the pilot budget', by: ACTOR });
    // Each agreed milestone is a commitment on THIS deal.
    const cs = await loadCommitments(p, { accountNames: [ACCOUNT] });
    expect(cs.map((c) => [c.commitmentId, c.kind, c.dealId, c.status])).toEqual([
      [`plan:${DEAL}:discovery`, 'deal_step', DEAL, 'open'],
      [`plan:${DEAL}:pilot`, 'deal_step', DEAL, 'waiting'],
    ]);
  });

  it('agreeing twice makes one record; an agreed step cannot be declined; a declined step is not proposed again', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    await reviewPlan(p, { accountName: ACCOUNT, dealId: DEAL, actor: ACTOR, now: NOW, items: [{ step: 'discovery', decision: 'agree' }, { step: 'procurement', decision: 'decline' }] });
    const rows = db.store.gapAuditEvent.length;
    const again = await reviewPlan(p, { accountName: ACCOUNT, dealId: DEAL, actor: ACTOR, now: NOW, items: [{ step: 'discovery', decision: 'agree', title: 'A different title' }, { step: 'discovery', decision: 'decline' }] });
    expect(again.ok && again.results).toEqual([
      { step: 'discovery', ok: true, commitmentId: `plan:${DEAL}:discovery`, created: false },
      { step: 'discovery', ok: false, reason: 'already_agreed' },
    ]);
    expect(db.store.gapAuditEvent.length).toBe(rows);
    const plan = await loadPlan(db.client(), ACCOUNT, DEAL, NOW);
    expect(plan.find((m) => m.step === 'discovery')?.title).toBe('Discovery: confirm the problem in their words');
    expect(plan.find((m) => m.step === 'procurement')?.state).toBe('declined');
    expect(await reviewPlan(p, { accountName: 'Nobody Co', dealId: DEAL, actor: ACTOR, now: NOW, items: [] })).toEqual({ ok: false, reason: 'account_not_found' });
    expect(await reviewPlan(p, { accountName: ACCOUNT, dealId: 'Kroger pilot', actor: ACTOR, now: NOW, items: [] })).toEqual({ ok: false, reason: 'bad_deal' });
  });

  it('unknown fields create no task: an undated milestone is never due, never in Waiting, never owed today; a dated one is deal work on its day', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    await reviewPlan(p, { accountName: ACCOUNT, dealId: DEAL, actor: ACTOR, now: NOW, items: [{ step: 'discovery', decision: 'agree' }, { step: 'site_validation', decision: 'agree', dueDay: '2026-10-08', responsible: { side: 'seller' } }] });
    const cs = await loadCommitments(p, { accountNames: [ACCOUNT] });
    const today = work(cs);
    expect(today.cards.map((c) => [c.tier, c.obligations])).toEqual([['held', []]]);
    expect(today.waiting.map((w) => w.title)).toEqual(['Site validation: walk one yard with their operator']);
    expect(todaySummary({ now: NOW, commitments: cs, done: [], waiting: today.waiting }).owed.map((o) => o.title)).toEqual(['Site validation: walk one yard with their operator']);
    const onTheDay = work(cs, nyDayAt('2026-10-08', 8));
    const card = onTheDay.cards.find((c) => c.accountName === ACCOUNT)!;
    expect(card.tier).toBe('deal');
    expect(card.obligations?.map((o) => [o.title, o.line, o.scope])).toEqual([['Site validation: walk one yard with their operator', 'Due today.', 'Deal: YardFlow - Kroger']]);
  });

  it('the buyer\'s agreement is recorded later only by the seller, only on a milestone', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    await reviewPlan(p, { accountName: ACCOUNT, dealId: DEAL, actor: ACTOR, now: NOW, items: [{ step: 'pilot', decision: 'agree' }] });
    const r = await recordBuyerAgreement(p, { commitmentId: `plan:${DEAL}:pilot`, by: 'Ben Scratch', on: '2026-10-06', actor: ACTOR, now: NOW });
    expect(r.ok && r.commitment.detail?.buyerAgreed).toEqual({ by: 'Ben Scratch', on: '2026-10-06' });
    expect((await loadPlan(db.client(), ACCOUNT, DEAL, NOW)).find((m) => m.step === 'pilot')?.buyerAgreed).toEqual({ by: 'Ben Scratch', on: '2026-10-06' });
    expect(await recordBuyerAgreement(p, { commitmentId: `plan:${DEAL}:pilot`, by: 'Ben', on: 'tomorrow', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'bad_buyer_agreement' });
    await ensureCommitment(p, { accountName: ACCOUNT, kind: 'task', title: 'A task', source: { kind: 'seller', id: 'x' } }, { actor: ACTOR, now: NOW });
    expect(await recordBuyerAgreement(p, { commitmentId: 'seller:x', by: 'Ben', on: '2026-10-06', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'not_a_milestone' });
  });
});

describe('the route and the view (R52)', () => {
  it('POST review through the real route records the batch; GET returns the plan', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    holder.client = db.client();
    const { GET, POST } = await import('@/app/api/gap/deals/plan/route');
    const res = await POST(new NextRequest('http://localhost/api/gap/deals/plan', { method: 'POST', body: JSON.stringify({ op: 'review', accountName: ACCOUNT, dealId: DEAL, items: [{ step: 'discovery', decision: 'agree' }, { step: 'pilot', decision: 'decline' }] }), headers: { 'content-type': 'application/json' } }));
    const body = (await res.json()) as { results: Array<{ step: string; ok: boolean }> };
    expect(res.status).toBe(200);
    expect(body.results.map((x) => [x.step, x.ok])).toEqual([['discovery', true], ['pilot', true]]);
    const bad = await POST(new NextRequest('http://localhost/api/gap/deals/plan', { method: 'POST', body: JSON.stringify({ op: 'review', accountName: ACCOUNT, dealId: DEAL, items: [{ step: 'demo', decision: 'agree' }] }), headers: { 'content-type': 'application/json' } }));
    expect(bad.status).toBe(400);
    const got = await GET(new NextRequest(`http://localhost/api/gap/deals/plan?account=${encodeURIComponent(ACCOUNT)}&deal=${DEAL}`));
    const plan = ((await got.json()) as { plan: Array<{ step: string; state: string }> }).plan;
    expect(plan.map((m) => m.state)).toEqual(['agreed', 'proposed', 'declined', 'proposed', 'proposed']);
  });

  it('the view shows agreed milestones with the buyer agreement always said and the proposals in one review', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    await reviewPlan(db.client(), { accountName: ACCOUNT, dealId: DEAL, actor: ACTOR, now: NOW, items: [{ step: 'discovery', decision: 'agree' }] });
    const plan = planFor(DEAL, withPhases(await loadCommitments(db.client()), NOW), []);
    render(<DealPlan accountName={ACCOUNT} dealId={DEAL} plan={plan} />);
    const agreed = screen.getAllByTestId('plan-milestone');
    expect(agreed).toHaveLength(1);
    expect(within(agreed[0]).getByTestId('plan-milestone-line').textContent).toMatch(/Buyer agreement: not recorded\./);
    expect(screen.getAllByTestId('plan-proposal').map((f) => f.getAttribute('data-step'))).toEqual(['site_validation', 'pilot', 'stakeholder_alignment', 'procurement']);
    expect(screen.getByTestId('plan-review-submit').textContent).toBe('Record the plan (4 agreed, 0 declined)');
    expect(screen.getByTestId('deal-plan-review').textContent).toMatch(/Proposed by GAP, not agreed by anyone yet/);
  });
});
