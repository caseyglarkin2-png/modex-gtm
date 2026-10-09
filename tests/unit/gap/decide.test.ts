// @vitest-environment node
/**
 * I02 (GAP OS prospecting first, 2026-10-08): Casey's decision on an intelligence item. Pinned: Pursue on a signal
 * marks it in use, queues the existing research when it has a link and an account, and queues the angle task; More
 * queues the angle (and research when possible) without the mark; Save keeps it as context; Skip hides it for 30
 * days; Dismiss ignores it; Explore records the look and changes nothing. Pursue on a trigger at a company that is not
 * an account captures it as a signal (account hint kept), marks it, queues the angle, never research; on a person it
 * queues the angle for that person. Every decision is one append-only row. Nothing here contacts anyone. The signed
 * link op `decide` round-trips; the route refuses a bad body and a signed-out caller.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyDecision, decisionLine, parseDecisionKey } from '@/lib/gap/work/decide';
import { PROSPECT_DECISION, loadDecided, loadIntelligence } from '@/lib/gap/work/intel';
import { claimAgentTasks, listAgentTasks, queueAgentTask, runAgentTasks } from '@/lib/gap/agents/tasks';
import type { IdentityContext } from '@/lib/gap/identity/resolve';
import type { InDealsSummary } from '@/lib/gap/deals/in-deals';
import { ACTION_OPS, signActionToken, verifyActionToken } from '@/lib/gap/work/action-token';

const NOW = new Date('2026-10-08T16:00:00Z');
const ACTOR = 'casey@freightroll.com';
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

function world() {
  return ledgerDb({
    accounts: ['Kenco', 'PepsiCo'],
    personas: [{ id: 1, email: 'dave@kencogroup.com', name: 'Dave Kiesling', title: 'VP Operations', account_name: 'Kenco', do_not_contact: false }],
    signals: [
      { id: 's-old', url: 'https://freightwaves.com/kenco-lab', url_hash: 'h1', title: 'Kenco opens new innovation lab for warehouse automation testing', source_name: 'freightwaves.com', source_class: 'news', published_at: new Date('2026-06-24T12:00:00Z'), created_at: days(10), origin: 'discovery', account_name: 'Kenco', account_hint: null, resolution: 'resolved', research_status: 'none', relevance: 'outreach_evidence_candidate', categories: ['digital_ops'], score: 6, event_id: null, feedback: null, feedback_at: null, note: null, metadata: null },
      { id: 's-noacct', url: 'https://x/2', url_hash: 'h2', title: 'An industry study on yard dwell', source_name: 'x', source_class: 'news', published_at: days(2), created_at: days(2), origin: 'discovery', account_name: null, account_hint: 'Industry', resolution: 'needs_account', research_status: 'none', relevance: 'research_lead', categories: [], score: 2, event_id: null, feedback: null, feedback_at: null, note: null, metadata: null },
    ],
    triggers: [{ id: 7, account_name: 'Tractor Supply Company', title: 'Tractor Supply opens Idaho distribution center with automation', url: 'https://chainstoreage.com/tsc', source: 'chainstoreage.com', score: 7, categories: ['network_capex'], published_at: days(1), first_seen_at: days(1), dismissed: false }],
    inbound: [{ id: 'm1', thread_id: 't1', from_email: 'dave@kencogroup.com', from_name: 'Dave', subject: 'Re: yards', received_at: days(20), source: 'gmail', thread: { account_name: 'Kenco' } }],
  }, NOW);
}

describe('I02: decisions on signals', () => {
  let db: ReturnType<typeof world>;
  beforeEach(() => { db = world(); });

  it('Pursue marks it in use, queues research (a link and an account) and the angle task; the decision row is written; the item leaves the day', async () => {
    const c = db.client();
    const r = await applyDecision(c, { key: 'signal:s-old', decision: 'pursue', actor: ACTOR, now: NOW, via: 'gmail:link' });
    expect(r).toMatchObject({ ok: true, key: 'signal:s-old', decision: 'pursue', accountName: 'Kenco', href: '/gap/accounts/kenco/' });
    if (!r.ok) return;
    expect(r.effects).toEqual(['research_queued', 'marked_use', 'angle_queued']);
    const s = db.store.gapSignal.find((x) => x.id === 's-old')!;
    expect(s).toMatchObject({ feedback: 'use', research_status: 'queued' });
    const tasks = await listAgentTasks(c, { now: NOW });
    expect(tasks.map((t) => [t.kind, t.itemKey, t.status])).toEqual([['develop_angle', 'signal:s-old', 'queued']]);
    expect(tasks[0].input).toMatchObject({ decision: 'pursue', title: 'Kenco opens new innovation lab for warehouse automation testing', accountName: 'Kenco' });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === PROSPECT_DECISION).map((e) => [e.subject_id, (e.payload as { decision: string; via: string }).decision, (e.payload as { via: string }).via])).toEqual([['signal:s-old', 'pursue', 'gmail:link']]);
    expect((await loadIntelligence(c, { now: NOW })).signals.map((i) => i.id)).toEqual(['s-noacct']);
    expect(decisionLine(r)).toMatch(/^Pursuing the signal\. GAP is developing the angle and checking the source/);
  });

  it('A02: a second Pursue without a note on an item whose angle is prepared keeps the angle (no regeneration); a running task is kept; More, a note or a failed task queue a fresh one', async () => {
    const c = db.client();
    const first = await applyDecision(c, { key: 'signal:s-old', decision: 'pursue', actor: ACTOR, now: NOW });
    if (!first.ok) throw new Error('first');
    const again = await applyDecision(c, { key: 'signal:s-old', decision: 'pursue', actor: ACTOR, now: new Date(NOW.getTime() + 5000) });
    // queued (not yet run): the queue supersedes, as X08 pins; the task is fresh
    expect(again).toMatchObject({ ok: true, effects: expect.arrayContaining(['angle_queued']) });
    const [task] = await runAgentTasks(c, { now: new Date(NOW.getTime() + 6000), max: 5, claimer: 'test', handlers: { develop_angle: async () => ({ ok: true, result: { whyItMatters: 'prepared', accounts: [], roles: [], people: [], starters: ['a', 'b'], proposedAction: 'research', caveat: null } }) } }).then((r) => r.results);
    expect(task.outcome).toBe('succeeded');
    const third = await applyDecision(c, { key: 'signal:s-old', decision: 'pursue', actor: ACTOR, now: new Date(NOW.getTime() + 7000) });
    expect(third).toMatchObject({ ok: true, angleTaskId: task.id, effects: expect.arrayContaining(['angle_kept']) });
    expect((await listAgentTasks(c, { now: new Date(NOW.getTime() + 7000), itemKey: 'signal:s-old' })).filter((t) => t.status === 'queued')).toHaveLength(0);
    const more = await applyDecision(c, { key: 'signal:s-old', decision: 'more', actor: ACTOR, now: new Date(NOW.getTime() + 8000), note: 'focus on the gate' });
    expect(more).toMatchObject({ ok: true, effects: expect.arrayContaining(['angle_queued']) });
    expect(more.ok && more.angleTaskId).not.toBe(task.id);
  });

  it('More on a signal with no account queues the angle only; Save keeps context; Skip hides 30 days; Dismiss ignores; Explore changes nothing; an unknown signal is not_found', async () => {
    const c = db.client();
    const more = await applyDecision(c, { key: 'signal:s-noacct', decision: 'more', actor: ACTOR, now: NOW });
    expect(more).toMatchObject({ ok: true, effects: ['angle_queued'], accountName: null, href: '/gap/signals/' });
    expect(db.store.gapSignal.find((x) => x.id === 's-noacct')).toMatchObject({ feedback: null, research_status: 'none' });
    expect(await applyDecision(c, { key: 'signal:s-old', decision: 'save', actor: ACTOR, now: NOW })).toMatchObject({ ok: true, effects: ['saved_as_context'] });
    expect(db.store.gapSignal.find((x) => x.id === 's-old')!.feedback).toBe('good_context');
    expect(await applyDecision(c, { key: 'signal:s-old', decision: 'skip', actor: ACTOR, now: NOW })).toMatchObject({ ok: true, effects: ['skipped_30_days'] });
    expect(db.store.gapSignal.find((x) => x.id === 's-old')).toMatchObject({ feedback: 'skip' });
    expect(await applyDecision(c, { key: 'signal:s-old', decision: 'dismiss', actor: ACTOR, now: NOW })).toMatchObject({ ok: true, effects: ['dismissed'] });
    expect(db.store.gapSignal.find((x) => x.id === 's-old')!.feedback).toBe('ignored');
    expect(await applyDecision(c, { key: 'signal:s-noacct', decision: 'explore', actor: ACTOR, now: NOW })).toMatchObject({ ok: true, effects: ['explored'] });
    expect(await applyDecision(c, { key: 'signal:nope', decision: 'pursue', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'not_found' });
    expect(await applyDecision(c, { key: 'nonsense', decision: 'pursue', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'bad_key' });
    expect((await listAgentTasks(c, { now: NOW })).map((t) => t.itemKey)).toEqual(['signal:s-noacct']);
  });
});

describe('I02: decisions on triggers and people', () => {
  it('Pursue on a trigger at a company that is not an account captures it as a signal with the hint, marks it, queues the angle and no research; a dismiss is one row and the trigger leaves the day', async () => {
    const db = world();
    const c = db.client();
    const capture = vi.fn(async (_prisma: unknown, _input: unknown) => ({ ok: true as const, signal: { id: 'sig-from-trigger', created: true } }));
    db.store.gapSignal.push({ id: 'sig-from-trigger', url: 'https://chainstoreage.com/tsc', url_hash: 'h7', title: 'Tractor Supply opens Idaho distribution center with automation', source_name: 'chainstoreage.com', source_class: 'news', published_at: days(1), created_at: NOW, origin: 'pounce_scan', account_name: null, account_hint: 'Tractor Supply Company', resolution: 'needs_account', research_status: 'none', relevance: 'research_lead', categories: [], score: 0, event_id: null, feedback: null, feedback_at: null, note: null, metadata: null });
    const r = await applyDecision(c, { key: 'trigger:7', decision: 'pursue', actor: ACTOR, now: NOW }, { capture });
    expect(r).toMatchObject({ ok: true, accountName: null, href: '/gap/signals/' });
    if (!r.ok) return;
    expect(r.effects).toEqual(['captured_as_signal', 'marked_use', 'angle_queued']);
    expect(capture.mock.calls[0][1]).toMatchObject({ url: 'https://chainstoreage.com/tsc', origin: 'pounce_scan', accountHint: 'Tractor Supply Company' });
    const tasks = await listAgentTasks(c, { now: NOW });
    expect(tasks[0]).toMatchObject({ kind: 'develop_angle', itemKey: 'trigger:7' });
    expect(tasks[0].input).toMatchObject({ accountHint: 'Tractor Supply Company', signalId: 'sig-from-trigger' });
    const dismissed = await applyDecision(c, { key: 'trigger:7', decision: 'dismiss', actor: ACTOR, now: NOW });
    expect(dismissed).toMatchObject({ ok: true, effects: ['dismissed'] });
    expect(await loadDecided(c, NOW)).toEqual(new Set(['trigger:7']));
    expect((await loadIntelligence(c, { now: NOW })).triggers).toEqual([]);
    expect(await applyDecision(c, { key: 'trigger:99', decision: 'pursue', actor: ACTOR, now: NOW }, { capture })).toEqual({ ok: false, reason: 'not_found' });
  });

  it('Pursue on a person queues the angle for that person with what GAP holds; Skip hides them 30 days and comes back after; the person leaves the day meanwhile', async () => {
    const db = world();
    const c = db.client();
    const r = await applyDecision(c, { key: 'person:Dave@KencoGroup.com', decision: 'pursue', actor: ACTOR, now: NOW });
    expect(r).toMatchObject({ ok: true, key: 'person:dave@kencogroup.com', accountName: 'Kenco', effects: ['angle_queued'], href: '/gap/accounts/kenco/' });
    // I05: the account link goes through the one slug helper (an apostrophe or a comma in the name is no new slug).
    const { accountHref } = await import('@/lib/gap/account-intel/href');
    expect(accountHref("Southern Glazer's Wine & Spirits")).toBe('/gap/accounts/southern-glazer-s-wine-spirits');
    const tasks = await listAgentTasks(c, { now: NOW });
    expect(tasks[0].input).toMatchObject({ email: 'dave@kencogroup.com', personaId: 1, name: 'Dave Kiesling', title: 'VP Operations', accountName: 'Kenco' });
    expect((await loadIntelligence(c, { now: NOW })).people).toEqual([]);
    const db2 = world();
    const c2 = db2.client();
    db2.setClock(days(31));
    await applyDecision(c2, { key: 'person:dave@kencogroup.com', decision: 'skip', actor: ACTOR, now: days(31) });
    db2.setClock(NOW);
    expect((await loadIntelligence(c2, { now: NOW })).people.map((p) => p.id)).toEqual(['dave@kencogroup.com']);
    expect((await loadIntelligence(c2, { now: days(20) })).people).toEqual([]);
  });

  it('parseDecisionKey and the signed link op round-trip', () => {
    expect(parseDecisionKey('signal:abc')).toEqual({ kind: 'signal', id: 'abc' });
    expect(parseDecisionKey('trigger:12')).toEqual({ kind: 'trigger', id: 12 });
    expect(parseDecisionKey('trigger:x')).toBeNull();
    expect(parseDecisionKey('person:A@B.com')).toEqual({ kind: 'person', email: 'a@b.com' });
    expect(parseDecisionKey('person:nope')).toBeNull();
    expect(ACTION_OPS).toContain('decide');
    const t = signActionToken({ op: 'decide', item: 'signal:s-old|pursue', day: '2026-10-08' }, { secret: 'k', now: NOW, ttlSeconds: 86_400 });
    expect(verifyActionToken(t, { secret: 'k', now: NOW })).toMatchObject({ ok: true, payload: { op: 'decide', item: 'signal:s-old|pursue' } });
  });
});

describe('I05: a pursued item never vanishes', () => {
  it('after Pursue the item leaves the undecided lists and appears under pursued, in progress until the angle task succeeds, then with the angle', async () => {
    const db = world();
    const c = db.client();
    await applyDecision(c, { key: 'signal:s-old', decision: 'pursue', actor: ACTOR, now: NOW });
    const before = await loadIntelligence(c, { now: NOW });
    expect(before.signals.map((i) => i.id)).toEqual(['s-noacct']);
    expect(before.pursued.map((p) => [p.key, p.status, p.title])).toEqual([['signal:s-old', 'in_progress', 'Kenco opens new innovation lab for warehouse automation testing']]);
    const { runAgentTasks } = await import('@/lib/gap/agents/tasks');
    const { developAngle } = await import('@/lib/gap/agents/develop-angle');
    const generate = async () => ({ text: JSON.stringify({ whyItMatters: 'My guess is the lab means the warehouses are being standardized while the yards outside still run on radio and clipboards, which is a reason to ask.', accounts: ['Kenco'], roles: ['VP Operations'], people: [1], starters: ['How does the gate know where a trailer should go?', 'Who owns dwell across your yards?'], proposedAction: 'email', caveat: null }), provider: 'test' });
    await runAgentTasks(c, { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { develop_angle: (t, ctx) => developAngle(t, ctx, { generate }) } });
    const after = await loadIntelligence(c, { now: new Date(NOW.getTime() + 2000) });
    expect(after.pursued[0]).toMatchObject({ key: 'signal:s-old', status: 'ready', accountName: 'Kenco', angle: { proposedAction: 'email', peopleNamed: [{ personaId: 1, name: 'Dave Kiesling' }] } });
    expect(after.pursued[0].angle!.whyItMatters).toContain('the yards outside');
  });
});

describe('C23: the kept angle is bound to its context revision', () => {
  const CRAIG = 'craig.morrison@kencogroup.com';
  const identity: IdentityContext = { accountsByHubspotCompanyId: new Map([['55608495412', 'Kenco Logistics']]), verifiedDomainToAccounts: new Map([['kencogroup.com', ['Kenco Logistics']]]), aliasToAccounts: new Map([['kenco', ['Kenco Logistics']]]), accountNames: ['Kenco Logistics', 'PepsiCo'] };
  const summary = (nextStep: string): InDealsSummary => ({ status: 'complete', count: 1, openDeals: 1, unresolved: [], checkedAt: '2026-10-08T14:55:00.000Z', accounts: [{ accountName: 'Kenco Logistics', alsoRecordedAs: ['Kenco'], dealContacts: 1, people: [], known: 1, deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', lastActivityAt: null, closeDate: null, nextStep, contactIds: ['234991610011'] }] }] });
  const prepared = async () => ({ ok: true as const, result: { whyItMatters: 'prepared', accounts: [], roles: [], people: [], starters: ['a', 'b'], proposedAction: 'research' as const, caveat: null } });
  const craigWorld = () => ledgerDb({ accounts: ['Kenco Logistics', 'PepsiCo'], personas: [], inbound: [{ id: 'm-c', thread_id: 't-c', from_email: CRAIG, from_name: 'Craig', subject: 'Re: the record', body_text: 'Poking holes in the Primo record now.', received_at: days(10), source: 'gmail', thread: { account_name: null } }] }, NOW);

  it('an unchanged Pursue keeps the prepared angle with no new task; the same person placed at the account after the identity fix, or a new deal next step, replaces it; a repeat unchanged click still spends nothing', async () => {
    const c = craigWorld().client();
    const at = (n: number) => new Date(NOW.getTime() + n * 1000);
    // Before the fix: no identity, no CRM read; the angle is prepared with no account.
    const first = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: at(1) }, { identity: null, inDeals: async () => null, contactLookup: async () => null });
    expect(first).toMatchObject({ ok: true, accountName: null, effects: ['angle_queued'] });
    const [t1] = await listAgentTasks(c, { now: at(1), itemKey: `person:${CRAIG}` });
    expect(typeof t1.input?.contextRevision).toBe('string');
    expect(await runAgentTasks(c, { now: at(2), max: 5, claimer: 'test', handlers: { develop_angle: prepared } })).toMatchObject({ succeeded: 1 });
    const same = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: at(3) }, { identity: null, inDeals: async () => null, contactLookup: async () => null });
    expect(same).toMatchObject({ ok: true, angleTaskId: t1.id, effects: ['angle_kept'] });
    expect((await listAgentTasks(c, { now: at(3), itemKey: `person:${CRAIG}` })).filter((t) => t.status === 'queued')).toHaveLength(0);
    // After the fix: the verified domain places Craig at Kenco Logistics and the CRM read finds the deal: the old no-account angle is replaced.
    const placed = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: at(4) }, { identity, inDeals: async () => summary('Reconnect at the end of October'), contactLookup: async () => null });
    expect(placed).toMatchObject({ ok: true, accountName: 'Kenco Logistics', effects: ['angle_queued'] });
    expect(placed.ok && placed.angleTaskId).not.toBe(t1.id);
    const tasks = await listAgentTasks(c, { now: at(4), itemKey: `person:${CRAIG}` });
    const t2 = tasks.find((t) => t.status === 'queued')!;
    expect(t2.input).toMatchObject({ accountName: 'Kenco Logistics', opportunity: 'open' });
    expect(t2.input?.contextRevision).not.toBe(t1.input?.contextRevision);
    expect(await runAgentTasks(c, { now: at(5), max: 5, claimer: 'test', handlers: { develop_angle: prepared } })).toMatchObject({ succeeded: 1 });
    // The same context again: kept, no spend. A changed deal next step: queued again.
    const again = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: at(6) }, { identity, inDeals: async () => summary('Reconnect at the end of October'), contactLookup: async () => null });
    expect(again).toMatchObject({ ok: true, angleTaskId: t2.id, effects: ['angle_kept'] });
    const moved = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: at(7) }, { identity, inDeals: async () => summary('Send the phased proposal'), contactLookup: async () => null });
    expect(moved).toMatchObject({ ok: true, effects: ['angle_queued'] });
    expect(moved.ok && moved.angleTaskId).not.toBe(t2.id);
    expect((await listAgentTasks(c, { now: at(7), itemKey: `person:${CRAIG}` })).filter((t) => t.kind === 'develop_angle')).toHaveLength(3);
  });

  it('a succeeded angle from before the rule (no revision on its input) is replaced by the next Pursue; a running task is still kept', async () => {
    const c = craigWorld().client();
    const legacy = await queueAgentTask(c, { kind: 'develop_angle', itemKey: `person:${CRAIG}`, itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: { decision: 'pursue', email: CRAIG, accountName: null } }, { now: NOW, actor: ACTOR });
    expect(await runAgentTasks(c, { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { develop_angle: prepared } })).toMatchObject({ succeeded: 1 });
    const r = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: new Date(NOW.getTime() + 2000) }, { identity: null, inDeals: async () => null, contactLookup: async () => null });
    expect(r).toMatchObject({ ok: true, effects: ['angle_queued'] });
    expect(r.ok && r.angleTaskId).not.toBe(legacy.id);
    // Running (claimed, not finished): kept whatever the context, so two angle tasks never run at once on one item.
    await claimAgentTasks(c, { now: new Date(NOW.getTime() + 3000), max: 5, claimer: 'test' });
    const running = await applyDecision(c, { key: `person:${CRAIG}`, decision: 'pursue', actor: ACTOR, now: new Date(NOW.getTime() + 4000) }, { identity, inDeals: async () => summary('x'), contactLookup: async () => null });
    expect(running).toMatchObject({ ok: true, angleTaskId: r.ok ? r.angleTaskId : null, effects: ['angle_kept'] });
  });
});
