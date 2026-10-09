// @vitest-environment node
/**
 * V1 (the commercial-context audit, 2026-10-08): ONE Kenco relationship across email, CRM and Work. The joined
 * fixture: no GAP persona for Dave, a dated September thread from dave.kiesling@kencogroup.com, the account
 * "Kenco Logistics" known under the alias "Kenco" and the verified domain kencogroup.com, and the day's in-deals
 * read with the open deal 62704698979 and the CRM contact 217664765537. C01 the briefing takes the same deal
 * coverage the day uses; C02/C03 the person is placed by the identity machinery, alias-aware, ambiguity kept;
 * C04 a negative is said only under a complete read; C05 Pursue carries the message's date, thread, subject and
 * words; C06 the angle is scoped to the open deal and the prompt carries the conversation and the next step.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { defaultIntel } from '@/lib/gap/work/briefing-send';
import { loadIntelligence, rankPeople } from '@/lib/gap/work/intel';
import { applyDecision } from '@/lib/gap/work/decide';
import { dealCoverageFrom, dealsAt, dealWords, coverageFromNames } from '@/lib/gap/work/deal-coverage';
import { resolvePersonAccount } from '@/lib/gap/work/person-identity';
import { buildAnglePrompt, developAngle } from '@/lib/gap/agents/develop-angle';
import { listAgentTasks, type ClaimedTask } from '@/lib/gap/agents/tasks';
import type { IdentityContext } from '@/lib/gap/identity/resolve';
import type { InDealsSummary } from '@/lib/gap/deals/in-deals';

const NOW = new Date('2026-10-08T15:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const DAVE = 'dave.kiesling@kencogroup.com';
const ROADMAP = 'We will keep Open Dock at the ungated locations, Birdseye for security and gate automation at the secure yards, and pilot Blue Yonder YMS where the WMS is migrating. Please cancel for now and reconnect toward the end of October during 2027 budgeting.';

const identity: IdentityContext = {
  accountsByHubspotCompanyId: new Map([['55608495412', 'Kenco Logistics']]),
  verifiedDomainToAccounts: new Map([['kencogroup.com', ['Kenco Logistics']]]),
  aliasToAccounts: new Map([['kenco', ['Kenco Logistics']]]),
  accountNames: ['Kenco Logistics', 'Kencore Inc', 'PepsiCo'],
};
const summary = (status: 'complete' | 'unavailable'): InDealsSummary => ({
  status, count: status === 'complete' ? 1 : null, openDeals: 1, unresolved: [], checkedAt: '2026-10-08T14:55:00.000Z',
  accounts: status === 'complete' ? [{ accountName: 'Kenco Logistics', alsoRecordedAs: ['Kenco'], dealContacts: 2, people: [], known: 2, deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', lastActivityAt: '2026-10-01T16:00:00.000Z', closeDate: '2026-09-30', nextStep: 'Reconnect at the end of October during 2027 budgeting', contactIds: ['234991610011', '217664765537'] }] }] : [],
});

function world() {
  return ledgerDb({
    accounts: ['Kenco Logistics', 'Kencore Inc', 'PepsiCo'],
    personas: [],
    inbound: [
      { id: 'm-sep16', thread_id: 't-kenco', rfc_message_id: '<sep16@kencogroup.com>', from_email: 'Dave.Kiesling@kencogroup.com', from_name: 'Dave Kiesling', subject: 'Re: YardFlow and the 2027 roadmap', body_text: ROADMAP, received_at: days(22), source: 'gmail', thread: { account_name: null } },
      { id: 'm-aug', thread_id: 't-kenco', from_email: DAVE, from_name: 'Dave Kiesling', subject: 'Re: intro', body_text: 'Thanks for the intro.', received_at: days(60), source: 'gmail', thread: { account_name: null } },
    ],
  }, NOW);
}

describe('V1: one Kenco relationship across email, CRM and Work', () => {
  it('C02/C03: a mailbox person with no persona is placed by the verified domain; the thread alias maps to the canonical name; a similar name does not; two accounts on one domain stay ambiguous', () => {
    expect(resolvePersonAccount({ email: DAVE, identity })).toMatchObject({ accountName: 'Kenco Logistics', via: 'domain', ambiguous: false, domain: 'kencogroup.com' });
    expect(resolvePersonAccount({ email: DAVE, threadAccount: 'Kenco', identity })).toMatchObject({ accountName: 'Kenco Logistics', ambiguous: false });
    expect(resolvePersonAccount({ email: 'x@kencore.example', threadAccount: 'Kencore Inc', identity })).toMatchObject({ accountName: 'Kencore Inc' });
    expect(resolvePersonAccount({ email: 'x@kencore.example', identity })).toMatchObject({ accountName: null, ambiguous: false });
    expect(resolvePersonAccount({ email: 'who@gmail.com', identity })).toMatchObject({ accountName: null, via: null });
    const shared: IdentityContext = { ...identity, verifiedDomainToAccounts: new Map([['kencogroup.com', ['Kenco Logistics', 'Kenco Fleet Services']]]) };
    expect(resolvePersonAccount({ email: DAVE, identity: shared })).toMatchObject({ accountName: null, ambiguous: true });
    expect(resolvePersonAccount({ email: DAVE, identity, hubspotCompanyIds: ['55608495412'] })).toMatchObject({ accountName: 'Kenco Logistics', via: 'hubspot_contact' });
    expect(resolvePersonAccount({ email: DAVE, persona: { account_name: 'Kenco' }, identity })).toMatchObject({ accountName: 'Kenco', via: 'persona' });
  });

  it('C04: the deal words are explicit: open under a complete read, none only under a complete read, unknown otherwise', () => {
    const complete = dealCoverageFrom(summary('complete'));
    expect(dealsAt(complete, 'kenco logistics')).toMatchObject({ inDeal: true, account: { accountName: 'Kenco Logistics' } });
    expect(dealsAt(complete, 'Kenco')).toMatchObject({ inDeal: true });
    expect(dealsAt(complete, 'PepsiCo')).toEqual({ inDeal: false });
    expect(dealWords(complete, dealsAt(complete, 'PepsiCo'))).toMatch(/^no open deal found \(HubSpot read Oct 8, 10:55 AM New York\)$/);
    expect(dealWords(complete, dealsAt(complete, 'Kenco'))).toBe('their account is in an open deal (YardFlow - Kenco, presentationscheduled): work it from the deal');
    const unavailable = dealCoverageFrom(summary('unavailable'));
    expect(dealsAt(unavailable, 'Kenco Logistics')).toEqual({ inDeal: null });
    expect(dealWords(unavailable, { inDeal: null })).toBe('open deal unknown: HubSpot could not be read');
    expect(dealWords(dealCoverageFrom(null), { inDeal: null })).toBe('open deal unknown: HubSpot not read for this list');
    expect(coverageFromNames(null).status).toBe('absent');
    expect(dealsAt(coverageFromNames(new Set(['Kroger'])), 'Kroger')).toMatchObject({ inDeal: true });
  });

  it('C01: the briefing composition (defaultIntel) takes the day\'s in-deals read: complete says Dave is in the open deal; unavailable says unknown, never no deal', async () => {
    const w = world();
    const complete = await defaultIntel(w.client(), NOW, { inDeals: async () => summary('complete'), identity });
    const dave = complete.people.find((p) => p.id === DAVE)!;
    expect(dave).toMatchObject({ accountName: 'Kenco Logistics', opportunity: 'open', inDeal: true, person: { via: 'domain', deals: [{ id: '62704698979', name: 'YardFlow - Kenco' }] } });
    expect(dave.line).toContain('their account is in an open deal (YardFlow - Kenco, presentationscheduled): work it from the deal');
    expect(dave.line).not.toContain('no live opportunity');
    const down = await defaultIntel(w.client(), NOW, { inDeals: async () => summary('unavailable'), identity });
    const dave2 = down.people.find((p) => p.id === DAVE)!;
    expect(dave2).toMatchObject({ accountName: 'Kenco Logistics', opportunity: 'unknown' });
    expect(dave2.inDeal).toBeUndefined();
    expect(dave2.line).toContain('open deal unknown: HubSpot could not be read');
    const thrown = await defaultIntel(w.client(), NOW, { inDeals: async () => { throw new Error('HubSpot 503'); }, identity });
    expect(thrown.people.find((p) => p.id === DAVE)?.opportunity).toBe('unknown');
  });

  it('C03 on the ranker: the thread alias "Kenco" places the person at Kenco Logistics and the deal is found under the alias; without an identity context the thread name is kept as said', () => {
    const rows = [{ from_email: DAVE, from_name: 'Dave', subject: 'Re: yards', received_at: days(22), thread_account: 'Kenco' }];
    const placed = rankPeople(rows, [], { now: NOW, decided: new Set(), coverage: dealCoverageFrom(summary('complete')), unsubscribed: new Set(), identity })[0];
    expect(placed).toMatchObject({ accountName: 'Kenco Logistics', opportunity: 'open' });
    const bare = rankPeople(rows, [], { now: NOW, decided: new Set(), coverage: dealCoverageFrom(summary('complete')), unsubscribed: new Set(), identity: null })[0];
    expect(bare).toMatchObject({ accountName: 'Kenco', opportunity: 'open' });
  });

  it('C05/C06: Pursue on Dave reloads the sources and the task carries the account, how it was placed, the September date, the thread, the subject, his words and the open deal; the angle prompt carries the conversation and the deal and the result is scoped to it', async () => {
    const w = world();
    const c = w.client();
    const r = await applyDecision(c, { key: `person:${DAVE}`, decision: 'pursue', actor: 'casey', now: NOW }, { identity, inDeals: async () => summary('complete'), contactLookup: async () => ({ contactId: '217664765537', email: DAVE, companyIds: ['55608495412'], dealIds: ['62704698979'], name: 'David Kiesling', title: 'Vice President of Transportation Management' }) });
    expect(r).toMatchObject({ ok: true, accountName: 'Kenco Logistics', href: '/gap/accounts/kenco-logistics/', effects: ['angle_queued'] });
    const [task] = await listAgentTasks(c, { now: NOW, itemKey: `person:${DAVE}` });
    expect(task.input).toMatchObject({
      email: DAVE, accountName: 'Kenco Logistics', resolvedVia: 'hubspot_contact', ambiguous: false, name: 'David Kiesling', title: 'Vice President of Transportation Management',
      lastWroteAt: days(22).toISOString(), messages: 2, subject: 'Re: YardFlow and the 2027 roadmap', inboundMessageId: 'm-sep16', threadId: 't-kenco', hubspotContactId: '217664765537',
      deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', nextStep: 'Reconnect at the end of October during 2027 budgeting' }], dealCoverage: 'complete', opportunity: 'open',
    });
    expect(String((task.input as Record<string, unknown>).excerpt)).toContain('Open Dock');
    // The angle: the prompt carries the words, the date and the deal; the result is deal work scoped to the one deal.
    const angleJson = JSON.stringify({ whyItMatters: 'My guess is that Dave has laid out a clear 2027 roadmap: Open Dock stays at the ungated sites, Birdseye covers the secure yards and Blue Yonder YMS pilots follow the WMS migration, so the question for the end of October is where a standard driver journey still adds production capacity across those yards.', accounts: ['Kenco Logistics'], roles: ['Vice President of Transportation Management'], people: [], starters: ['Which sites move to Blue Yonder first, and how are drivers checked in there today?', 'Where does Birdseye hand off to the dock once a truck is inside the secure yards?'], proposedAction: 'email', caveat: 'Confirm the end-of-October reconnect he asked for still stands.' });
    const generate = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: angleJson, provider: 'test' }));
    const claimed: ClaimedTask = { ...task, status: 'running', attempts: 1, attempt: 1, leaseUntil: new Date(NOW.getTime() + 400_000).toISOString(), fence: 'f' };
    const out = await developAngle(claimed, { prisma: c, now: NOW }, { generate });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result).toMatchObject({ inDeal: true, dealId: '62704698979', accountName: 'Kenco Logistics', sourceLine: expect.stringMatching(/^the mailbox, observed Sep 16, 2026 \(a recent report\)$/) });
    const prompt = generate.mock.calls[0][0];
    expect(prompt).toContain('What they last wrote (Sep 16, 2026, subject "Re: YardFlow and the 2027 roadmap")');
    expect(prompt).toContain('Open Dock');
    expect(prompt).toContain('is in an open HubSpot deal: YardFlow - Kenco (presentationscheduled), next step: Reconnect at the end of October during 2027 budgeting');
    expect(prompt).toContain('never a cold opener');
    expect(prompt).not.toContain('undated');
    // Two deals at one company: no deal id is assumed; the prompt asks the caveat to say which deal.
    const two = buildAnglePrompt({ title: 't', sourceLine: 's', accountName: 'Kenco Logistics', accountHint: null, categories: [], note: null, person: { name: 'Dave', title: null, email: DAVE }, roster: [], theses: [], recent: [], candidateAccounts: [], decision: 'pursue', deals: [{ id: '1', name: 'A', stage: 's', nextStep: null }, { id: '2', name: 'B', stage: 's', nextStep: 'x' }] });
    expect(two).toContain('2 open HubSpot deals');
    expect(two).toContain('say in the caveat which deal the angle serves');
  });

  it('C02 negative controls: with no CRM read, no identity and no persona, the person stays unplaced with the domain as the hint and the deal unknown; nothing is created', async () => {
    const w = world();
    const c = w.client();
    const r = await applyDecision(c, { key: `person:${DAVE}`, decision: 'pursue', actor: 'casey', now: NOW }, { identity: null, inDeals: async () => null, contactLookup: async () => null });
    expect(r).toMatchObject({ ok: true, accountName: null, href: '/gap/replies/' });
    const [task] = await listAgentTasks(c, { now: NOW, itemKey: `person:${DAVE}` });
    expect(task.input).toMatchObject({ accountName: null, accountHint: 'kencogroup.com', resolvedVia: null, dealCoverage: 'absent', opportunity: 'unknown', deals: [] });
    expect(w.store.account).toHaveLength(3);
    expect(w.store.persona).toHaveLength(0);
    const intel = await loadIntelligence(world().client(), { now: NOW, identity: null });
    expect(intel.people.find((p) => p.id === DAVE)).toMatchObject({ accountName: null, accountHint: 'kencogroup.com', opportunity: 'unknown' });
  });
});
