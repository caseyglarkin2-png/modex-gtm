// @vitest-environment node
/**
 * Seller acceptance follow-up (2026-10-09), C1: a pursued person is placed at READ time. On October 9 Casey pursued
 * person:dave.kiesling@kencogroup.com five times from the intelligence panel; every task input carried accountName
 * null although kencogroup.com is the verified domain of the GAP account Kenco (an open deal, contacts Dave and
 * Craig), so the briefing and the panel showed the prepared angle under "No account yet". Pinned: a person with no
 * persona whose domain is an account's verified domain is placed at that account through resolvePersonAccount, the
 * placement is said as changed with the line, the open deal is said from the day's coverage, nothing is queued; a
 * freemail person is never placed; a task that already carried its account is unchanged.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { loadIntelligence, loadPursued, placedViaOf } from '@/lib/gap/work/intel';
import { listAgentTasks, queueAgentTask, runAgentTasks } from '@/lib/gap/agents/tasks';
import { dealCoverageFrom } from '@/lib/gap/work/deal-coverage';
import type { IdentityContext } from '@/lib/gap/identity/resolve';
import type { InDealsSummary } from '@/lib/gap/deals/in-deals';

const NOW = new Date('2026-10-09T13:00:00Z');
const ACTOR = 'casey@freightroll.com';
const DAVE = 'dave.kiesling@kencogroup.com';
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const identity: IdentityContext = { accountsByHubspotCompanyId: new Map([['55608495412', 'Kenco']]), verifiedDomainToAccounts: new Map([['kencogroup.com', ['Kenco']]]), aliasToAccounts: new Map([['kenco', ['Kenco']]]), accountNames: ['Kenco', 'PepsiCo'] };
const summary: InDealsSummary = { status: 'complete', count: 1, openDeals: 1, unresolved: [], checkedAt: '2026-10-09T12:55:00.000Z', accounts: [{ accountName: 'Kenco', alsoRecordedAs: ['Kenco Logistics'], dealContacts: 2, people: [], known: 2, deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', lastActivityAt: null, closeDate: null, nextStep: 'Reconnect at the end of October', contactIds: ['234991610011'] }] }] };
const coverage = dealCoverageFrom(summary);

/** The October 9 task input shape, verbatim in its nulls: no persona, no account, the domain as the hint. */
const octoberNinth = (email: string, over: Record<string, unknown> = {}) => ({ decision: 'pursue', email, personaId: null, name: 'Dave Kiesling', title: null, accountName: null, accountHint: email.split('@')[1], resolvedVia: null, ambiguous: false, lastWroteAt: days(20).toISOString(), messages: 2, subject: 'Re: yards', inboundMessageId: 'm1', threadId: 't1', excerpt: null, purpose: 'buyer_conversation', hubspotContactId: null, deals: [], dealCoverage: 'absent', opportunity: 'unknown', ...over });

const prepared = async () => ({ ok: true as const, result: { whyItMatters: 'My guess is the warehouses are standardized while the yards outside are not.', accounts: [], roles: [], people: [], starters: ['Who owns dwell across your yards?'], proposedAction: 'email' as const, caveat: null, sourceLine: 'the mailbox' } });

function world() {
  // Dave wrote in; no persona for him (the Kenco shape); the thread names no account, so only the verified domain can place him.
  return ledgerDb({ accounts: ['Kenco', 'PepsiCo'], personas: [], inbound: [{ id: 'm1', thread_id: 't1', from_email: DAVE, from_name: 'Dave Kiesling', subject: 'Re: yards', received_at: days(20), source: 'gmail', thread: { account_name: null } }, { id: 'm2', thread_id: 't2', from_email: 'joe@gmail.com', from_name: 'Joe', subject: 'hello', received_at: days(21), source: 'gmail', thread: { account_name: null } }] }, NOW);
}

describe('C1: a pursued person is placed at read time', () => {
  it('the Kenco shape: five pursues with accountName null (four failed, the last succeeded) read as one pursued item placed at Kenco by its verified domain, in the open deal, with the line; the task input is not rewritten and nothing is queued', async () => {
    const db = world();
    const c = db.client();
    // Four earlier clicks failed while the model route was unfunded; the drain superseded nothing (each was claimed), so the ledger holds five tasks.
    for (let i = 0; i < 4; i += 1) {
      await queueAgentTask(c, { kind: 'develop_angle', itemKey: `person:${DAVE}`, itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: octoberNinth(DAVE) }, { now: new Date(NOW.getTime() - (10 - i) * 60_000), actor: ACTOR });
      await runAgentTasks(c, { now: new Date(NOW.getTime() - (10 - i) * 60_000 + 1000), max: 1, claimer: 'test', handlers: { develop_angle: async () => ({ ok: false, reason: 'ai_billing' }) } });
    }
    const last = await queueAgentTask(c, { kind: 'develop_angle', itemKey: `person:${DAVE}`, itemToken: '', day: '2026-10-09', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: octoberNinth(DAVE) }, { now: new Date(NOW.getTime() - 60_000), actor: ACTOR });
    expect(await runAgentTasks(c, { now: new Date(NOW.getTime() - 30_000), max: 1, claimer: 'test', handlers: { develop_angle: prepared } })).toMatchObject({ succeeded: 1 });
    const before = await listAgentTasks(c, { now: NOW });
    expect(before.filter((t) => t.kind === 'develop_angle')).toHaveLength(5);

    const x = await loadIntelligence(c, { now: NOW, identity, coverage });
    expect(x.pursued, 'one pursued item per key (five tasks, one key)').toHaveLength(1);
    const dave = x.pursued.find((p) => p.key === `person:${DAVE}`)!;
    expect(dave).toMatchObject({ taskId: last.id, status: 'ready', accountName: 'Kenco', accountHint: null, placedVia: 'domain', placementChanged: true, dealLine: 'In an open deal: YardFlow - Kenco', writer: { email: DAVE, name: 'Dave Kiesling' } });
    expect(dave.placementLine).toBe('Placed at Kenco by its verified domain after the identity fix; the angle was developed before placement, so Pursue again to develop it as deal work');
    // Nothing was queued and the task inputs stand as they were (the placement is a reading, not a rewrite).
    const after = await listAgentTasks(c, { now: NOW });
    expect(after.filter((t) => t.kind === 'develop_angle')).toHaveLength(5);
    expect(after.every((t) => t.input?.accountName === null), 'no task input was rewritten').toBe(true);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === 'agent.task_queued')).toHaveLength(5);
  });

  it('a freemail writer is never placed (the hint stays the domain, no line); a task that already carried its account keeps it with its own via and no change', async () => {
    const db = world();
    const c = db.client();
    await queueAgentTask(c, { kind: 'develop_angle', itemKey: 'person:joe@gmail.com', itemToken: '', day: '2026-10-09', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: octoberNinth('joe@gmail.com', { name: 'Joe' }) }, { now: new Date(NOW.getTime() - 60_000), actor: ACTOR });
    await queueAgentTask(c, { kind: 'develop_angle', itemKey: 'person:craig.morrison@kencogroup.com', itemToken: '', day: '2026-10-09', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: octoberNinth('craig.morrison@kencogroup.com', { name: 'Craig Morrison', personaId: 2, accountName: 'Kenco', accountHint: null, resolvedVia: 'persona' }) }, { now: new Date(NOW.getTime() - 50_000), actor: ACTOR });
    const x = await loadPursued(c, NOW, { identity, coverage });
    const joe = x.find((p) => p.key === 'person:joe@gmail.com')!;
    expect(joe).toMatchObject({ accountName: null, accountHint: 'gmail.com', placedVia: null, placementChanged: false, placementLine: null, dealLine: null });
    const craig = x.find((p) => p.key === 'person:craig.morrison@kencogroup.com')!;
    expect(craig).toMatchObject({ accountName: 'Kenco', accountHint: null, placedVia: 'persona', placementChanged: false, placementLine: null, dealLine: 'In an open deal: YardFlow - Kenco' });
  });

  it('standalone (no maps supplied) the loader reads the persona and the thread one row each: a thread that names the account places by alias; without the deal coverage no deal line is said; without identity a domain places nothing', async () => {
    const db = ledgerDb({ accounts: ['Kenco'], personas: [], inbound: [{ id: 'm9', thread_id: 't9', from_email: 'ann@kencogroup.com', from_name: 'Ann', subject: 'yards', received_at: days(40), source: 'gmail', thread: { account_name: 'Kenco Logistics' } }] }, NOW);
    const c = db.client();
    await queueAgentTask(c, { kind: 'develop_angle', itemKey: 'person:ann@kencogroup.com', itemToken: '', day: '2026-10-09', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: octoberNinth('ann@kencogroup.com', { name: 'Ann' }) }, { now: new Date(NOW.getTime() - 60_000), actor: ACTOR });
    const withAlias: IdentityContext = { ...identity, aliasToAccounts: new Map([['kenco logistics', ['Kenco']], ['kenco', ['Kenco']]]) };
    const [ann] = await loadPursued(c, NOW, { identity: withAlias });
    expect(ann).toMatchObject({ accountName: 'Kenco', placedVia: 'alias', placementChanged: true, dealLine: null });
    expect(ann.placementLine).toBe("Placed at Kenco by the thread's account name after the identity fix; the angle was developed before placement, so Pursue again to develop it at the account");
    const [none] = await loadPursued(c, NOW, { identity: null });
    // No identity context: the thread's name is taken as it is (resolvePersonAccount's no-context path), never the domain.
    expect(none).toMatchObject({ accountName: 'Kenco Logistics', placedVia: 'alias', placementChanged: true });
  });

  it('placedViaOf maps the identity path to the four words', () => {
    expect(['persona', 'hubspot_contact', 'hubspot_company_id', 'alias', 'normalized', 'domain', null, 'nonsense'].map(placedViaOf)).toEqual(['persona', 'crm_contact', 'crm_contact', 'alias', 'alias', 'domain', null, null]);
  });
});
