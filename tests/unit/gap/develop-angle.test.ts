// @vitest-environment node
/**
 * I03 (GAP OS prospecting first, 2026-10-08): the develop_angle task Pursue and More queue. Pinned: the prompt carries
 * the item, its source line with the date said as what it is (a historical observation is never today), the roster at
 * a known account (buyer roles first) and nothing else; the answer names people from that roster only, keeps the copy
 * rules (no em dash, yards plural, no product claim, no money) or ends could_not_satisfy, final; an item at a company
 * that is not an account gets candidate accounts and roles, no people; a person item develops the reopening angle;
 * the prepared angle is read back by key; the registry carries the handler.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { buildAnglePrompt, developAngle, loadAngles, parseAngle, sourceLineFor, validateAngle, type DevelopAngleDeps, MAX_ANGLE_CALLS } from '@/lib/gap/agents/develop-angle';
import { agentTaskHandlers } from '@/lib/gap/agents/handlers';
import { runAgentTasks, type ClaimedTask } from '@/lib/gap/agents/tasks';
import { applyDecision } from '@/lib/gap/work/decide';
import { assembleCommercialContext } from '@/lib/gap/context/assemble';
import { buyerSubjectRe, packetRecord, packetSeedFromInput, seedRevision, validateAngleClaims } from '@/lib/gap/agents/angle-claims';
import { buyerClaimsFromTimeline } from '@/lib/gap/context/assemble';
import type { ContextOpportunity, TimelineEvent } from '@/lib/gap/context/commercial-context';
import { DAVE_EMAIL, FILES, KENCO, ROADMAP, snapshot, vaultOf } from './stream-b-fixture';

const NOW = new Date('2026-10-08T16:00:00Z');
const ACTOR = 'casey@freightroll.com';
const GOOD = JSON.stringify({
  whyItMatters: 'My guess is a new automation lab means Kenco is standardizing how its warehouses run, and the yards outside those buildings may still be on radio and clipboards; the June announcement is a reason to ask, not a current event.',
  accounts: ['Kenco'],
  roles: ['VP Operations', 'Director of Distribution', 'Yard Operations Manager'],
  people: [1, 2],
  starters: ['When a trailer arrives at Chattanooga today, how does the gate know where it should go?', 'Who owns dwell time across your yards, and what do they look at each morning?'],
  proposedAction: 'email',
  caveat: 'The lab announcement says nothing about the yards themselves.',
});

function world() {
  return ledgerDb({
    accounts: ['Kenco'],
    personas: [
      { id: 1, name: 'Dave Kiesling', title: 'VP Operations', email: 'dave@kencogroup.com', account_name: 'Kenco', do_not_contact: false },
      { id: 2, name: 'Craig Morrison', title: 'Director, Distribution', email: 'craig@kencogroup.com', account_name: 'Kenco', do_not_contact: false },
      { id: 3, name: 'Pat Legal', title: 'General Counsel', email: 'pat@kencogroup.com', account_name: 'Kenco', do_not_contact: false },
      { id: 4, name: 'Gone Person', title: 'VP Operations', email: 'gone@kencogroup.com', account_name: 'Kenco', do_not_contact: true },
    ],
    hypotheses: [{ id: 'h1', account_name: 'Kenco', status: 'active', problem_family: 'hidden_capacity', observation: 'Kenco expands Chattanooga [S:sig-1].' }],
    signals: [{ id: 's-old', url: 'https://freightwaves.com/kenco-lab', title: 'Kenco opens new innovation lab for warehouse automation testing', source_name: 'freightwaves.com', source_class: 'news', published_at: new Date('2026-06-24T12:00:00Z'), created_at: new Date('2026-09-28T12:00:00Z'), origin: 'discovery', account_name: 'Kenco', account_hint: null, resolution: 'resolved', research_status: 'none', relevance: 'outreach_evidence_candidate', categories: ['digital_ops'], score: 6, event_id: null, feedback: null, feedback_at: null, note: null, metadata: null }],
  }, NOW);
}

const task = (over: Partial<ClaimedTask> = {}): ClaimedTask => ({ id: 'at_1', kind: 'develop_angle', itemKey: 'signal:s-old', itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', status: 'running', attempts: 1, attempt: 1, queuedAt: NOW.toISOString(), leaseUntil: new Date(NOW.getTime() + 400_000).toISOString(), fence: 'f', result: null, lastError: null, final: false, supersededBy: null, input: { decision: 'pursue', title: 'Kenco opens new innovation lab for warehouse automation testing', url: 'https://freightwaves.com/kenco-lab', accountName: 'Kenco', accountHint: null, publishedAt: '2026-06-24T12:00:00.000Z', relevance: 'outreach_evidence_candidate', categories: ['digital_ops'], note: null }, ...over });

describe('I03: the source line, the parser and the checks', () => {
  it('the source line says published or observed, the date, and whether it is a historical observation', () => {
    expect(sourceLineFor({ url: 'https://www.freightwaves.com/x', publishedAt: '2026-06-24T12:00:00.000Z' }, NOW)).toBe('freightwaves.com, published Jun 24, 2026 (a historical observation)');
    expect(sourceLineFor({ source: 'chainstoreage.com', publishedAt: '2026-10-07T12:00:00.000Z' }, NOW)).toBe('chainstoreage.com, published Oct 7, 2026 (a recent report)');
    expect(sourceLineFor({ observedAt: '2026-09-16T12:00:00.000Z' }, NOW)).toBe('the mailbox, observed Sep 16, 2026 (a recent report)');
    expect(sourceLineFor({}, NOW)).toBe('the mailbox, undated');
    // C54-1 (C29 at this surface): a date-only publication (an EDGAR filing day at midnight UTC) names its own day, never the prior New York day.
    expect(sourceLineFor({ source: 'x', publishedAt: '2026-10-03T00:00:00.000Z' }, NOW)).toBe('x, published Oct 3, 2026 (a recent report)');
    expect(sourceLineFor({ source: 'x', publishedAt: '2026-10-03T02:30:00.000Z' }, NOW)).toBe('x, published Oct 2, 2026 (a recent report)');
  });

  it('the parser wants why, two starters and an action; the checks refuse an em dash, "yard" alone, a product name, money, a person not offered, a why too short', () => {
    const a = parseAngle(GOOD)!;
    expect(a).toMatchObject({ proposedAction: 'email', people: [1, 2], roles: ['VP Operations', 'Director of Distribution', 'Yard Operations Manager'] });
    expect(parseAngle(JSON.stringify({ whyItMatters: 'x', starters: ['one'], proposedAction: 'email' }))).toBeNull();
    expect(parseAngle('nope')).toBeNull();
    const roster = new Set([1, 2]);
    expect(validateAngle(a, roster)).toEqual({ ok: true });
    expect(validateAngle({ ...a, whyItMatters: a.whyItMatters.replace(', and', ' — and') }, roster)).toMatchObject({ ok: false, reason: 'em_dash' });
    expect(validateAngle({ ...a, whyItMatters: a.whyItMatters.replace('the yards outside', 'the yard outside') }, roster)).toMatchObject({ ok: false, reason: 'yard_singular', detail: expect.stringContaining('the yard outside') });
    // A03b: the canonical compounds keep the singular; "throughput" is refused (the canon says production capacity); "id 1" parses as 1.
    expect(validateAngle({ ...a, whyItMatters: a.whyItMatters.replace('the yards outside', 'the yard management outside') }, roster)).toEqual({ ok: true });
    expect(validateAngle({ ...a, whyItMatters: a.whyItMatters.replace('the yards outside', 'the yard operations outside') }, roster)).toMatchObject({ ok: false, reason: 'yard_singular' });
    expect(validateAngle({ ...a, caveat: 'Throughput at the docks is unknown.' }, roster)).toMatchObject({ ok: false, reason: 'throughput' });
    expect(parseAngle(JSON.stringify({ ...JSON.parse(GOOD), people: ['id 1', '2', 'x'] }))?.people).toEqual([1, 2]);
    expect(validateAngle({ ...a, starters: ['Would YardFlow fit?', a.starters[1]] }, roster)).toMatchObject({ ok: false, reason: 'product_named' });
    expect(validateAngle({ ...a, caveat: 'Worth $40,000 a year.' }, roster)).toMatchObject({ ok: false, reason: 'money_promised' });
    expect(validateAngle({ ...a, people: [1, 9] }, roster)).toMatchObject({ ok: false, reason: 'person_not_offered', detail: '9' });
    expect(validateAngle({ ...a, whyItMatters: 'Too short to say.' }, roster)).toMatchObject({ ok: false, reason: 'length' });
  });
});

describe('A03: one bounded re-ask on a voice-rule break', () => {
  it('a first answer with "yard" in the singular is re-asked once with the break named and the previous answer; the fixed answer succeeds with calls 2; a second break is could_not_satisfy after exactly two calls; a stranger is never re-asked', async () => {
    const w = world();
    const singular = JSON.stringify({ ...JSON.parse(GOOD), whyItMatters: JSON.parse(GOOD).whyItMatters.replace('the yards outside', 'the yard outside') });
    const generate = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>()
      .mockResolvedValueOnce({ text: singular, provider: 'test' })
      .mockResolvedValueOnce({ text: GOOD, provider: 'test' });
    const r = await developAngle(task(), { prisma: w.client(), now: NOW }, { generate });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result).toMatchObject({ calls: 2, whyItMatters: JSON.parse(GOOD).whyItMatters });
    expect(generate).toHaveBeenCalledTimes(2);
    const second = generate.mock.calls[1][0];
    expect(second).toContain('rejected by the checker: it says "yard" in the singular here: "');
    expect(second).toContain('the yard outside');
    expect(second).toContain('Previous answer:');
    expect(second).toContain('the yard outside');

    const stubborn = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: singular, provider: 'test' }));
    const again = await developAngle(task(), { prisma: w.client(), now: NOW }, { generate: stubborn });
    // A03d: a singular "yard" that survives the re-asks is a warning on the angle, never a refusal.
    expect(again).toMatchObject({ ok: true, result: { calls: 3, warnings: [expect.stringContaining('the yard outside')] } });
    expect(stubborn).toHaveBeenCalledTimes(MAX_ANGLE_CALLS);
    expect(MAX_ANGLE_CALLS).toBe(3);
    const money = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), caveat: 'Worth $40,000 a year.' }), provider: 'test' }));
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, { generate: money })).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: 'money_promised (after 2 re-asks)' });

    const stranger = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), people: [9] }), provider: 'test' }));
    const never = await developAngle(task(), { prisma: w.client(), now: NOW }, { generate: stranger });
    expect(never).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: 'person_not_offered 9' });
    expect(stranger).toHaveBeenCalledTimes(1);
  });
});

describe('I03: the task', () => {
  it('a signal at a known account: the prompt carries the item, the source line, the roster with buyer roles first and never a do-not-contact person, the theses; the answer names roster people; the angle reads back by key', async () => {
    const w = world();
    const generate = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: GOOD, provider: 'test' }));
    const r = await developAngle(task(), { prisma: w.client(), now: NOW }, { generate });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result).toMatchObject({ key: 'signal:s-old', accountName: 'Kenco', sourceLine: 'freightwaves.com, published Jun 24, 2026 (a historical observation)', proposedAction: 'email', peopleNamed: [{ personaId: 1, name: 'Dave Kiesling' }, { personaId: 2, name: 'Craig Morrison' }] });
    const prompt = generate.mock.calls[0][0];
    expect(prompt).toContain('Kenco opens new innovation lab');
    expect(prompt).toContain('published Jun 24, 2026 (a historical observation)');
    expect(prompt).toContain('- id 1: Dave Kiesling, VP Operations');
    expect(prompt).toContain('- id 2: Craig Morrison, Director, Distribution');
    expect(prompt.indexOf('id 2: Craig')).toBeLessThan(prompt.indexOf('id 3: Pat Legal'));
    expect(prompt).not.toContain('Gone Person');
    expect(prompt).toContain('hidden_capacity: Kenco expands Chattanooga');
    expect(prompt).toMatch(/never presented as happening today/);
    // Through the drain: the result is read back by key.
    const c = w.client();
    await applyDecision(c, { key: 'signal:s-old', decision: 'pursue', actor: ACTOR, now: NOW });
    const report = await runAgentTasks(c, { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { develop_angle: (t, ctx) => developAngle(t, ctx, { generate }) } });
    expect(report).toMatchObject({ claimed: 1, succeeded: 1 });
    const angles = await loadAngles(c, { keys: ['signal:s-old'], now: new Date(NOW.getTime() + 2000) });
    expect(angles.get('signal:s-old')).toMatchObject({ key: 'signal:s-old', starters: expect.arrayContaining([expect.stringContaining('Chattanooga')]), peopleNamed: expect.arrayContaining([expect.objectContaining({ personaId: 1 })]) });
    expect(Object.keys(agentTaskHandlers())).toContain('develop_angle');
  });

  it('a trigger at a company that is not an account: no roster, the hint and the matching GAP accounts in the prompt, people empty; a person item carries the reopening context; garbage or a rule break is could_not_satisfy', async () => {
    const w = world();
    const noPeople = JSON.stringify({ ...JSON.parse(GOOD), accounts: ['Tractor Supply Company'], people: [] });
    const generate = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: noPeople, provider: 'test' }));
    const r = await developAngle(task({ itemKey: 'trigger:7', input: { decision: 'pursue', title: 'Tractor Supply opens Idaho distribution center with automation', url: 'https://chainstoreage.com/tsc', accountName: null, accountHint: 'Tractor Supply Company', publishedAt: '2026-10-07T12:00:00.000Z', source: 'chainstoreage.com', categories: ['network_capex'] } }), { prisma: w.client(), now: NOW }, { generate });
    expect(r).toMatchObject({ ok: true, result: { accountName: null, accountHint: 'Tractor Supply Company', peopleNamed: [], accounts: ['Tractor Supply Company'] } });
    const prompt = generate.mock.calls[0][0];
    expect(prompt).toContain('The company named is Tractor Supply Company; it is not a GAP account yet.');
    expect(prompt).toContain('No people are on record');
    const person = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), people: [1] }), provider: 'test' }));
    const pr = await developAngle(task({ itemKey: 'person:dave@kencogroup.com', input: { decision: 'pursue', email: 'dave@kencogroup.com', personaId: 1, name: 'Dave Kiesling', title: 'VP Operations', accountName: 'Kenco', lastWroteAt: '2026-09-16T12:00:00.000Z' } }), { prisma: w.client(), now: NOW }, { generate: person });
    expect(pr).toMatchObject({ ok: true, result: { key: 'person:dave@kencogroup.com', sourceLine: 'the mailbox, observed Sep 16, 2026 (a recent report)', peopleNamed: [{ personaId: 1 }] } });
    expect(person.mock.calls[0][0]).toContain('they last wrote to us Sep 16, 2026. The angle is for continuing that conversation, not opening a new one.');
    const bad: DevelopAngleDeps = { generate: async () => ({ text: 'I cannot help with that.', provider: 'test' }) };
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, bad)).toMatchObject({ ok: false, reason: 'could_not_satisfy' });
    const stranger: DevelopAngleDeps = { generate: async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), people: [3] }), provider: 'test' }) };
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, stranger)).toMatchObject({ ok: true });
    const outside: DevelopAngleDeps = { generate: async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), people: [4] }), provider: 'test' }) };
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, outside)).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: 'person_not_offered 4' });
    expect(buildAnglePrompt({ title: 't', sourceLine: 's', accountName: null, accountHint: null, categories: [], note: null, person: null, roster: [], theses: [], recent: [], candidateAccounts: [], decision: 'more' })).toContain('No account is named.');
  });
});

describe('C21/C22: the angle reads the commercial-context packet and every claim is traceable', () => {
  const open: ContextOpportunity = { status: 'open', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', nextStep: 'Reconnect at the end of October during 2027 budgeting', closeDate: '2026-09-30', contactIds: ['217664765537'] }], coverage: 'complete', checkedAt: '2026-10-08T14:55:00.000Z', scopedDealId: '62704698979' };
  const sep16: TimelineEvent = { id: 'm-sep16', at: '2026-09-16T14:02:00.000Z', direction: 'inbound', type: 'email', provider: 'gmail', providerIds: ['1a0aa7d3c587d944'], from: DAVE_EMAIL, to: ['casey@freightroll.com'], subject: 'Re: YardFlow and the 2027 roadmap', excerpt: ROADMAP, isDraft: false, purpose: 'buyer_conversation' };
  const oct1: TimelineEvent = { id: 'm-oct1', at: '2026-10-01T16:00:00.000Z', direction: 'outbound', type: 'email', provider: 'gmail', providerIds: ['out1'], from: 'casey@freightroll.com', to: [DAVE_EMAIL], subject: 'Re: YardFlow and the 2027 roadmap', excerpt: 'Understood, I will reconnect at the end of October.', isDraft: false, purpose: 'buyer_conversation' };
  const personInput = { decision: 'pursue', email: DAVE_EMAIL, name: 'David Kiesling', title: 'Vice President of Transportation Management', accountName: 'Kenco Logistics', resolvedVia: 'hubspot_contact', ambiguous: false, lastWroteAt: '2026-09-16T14:02:00.000Z', subject: 'Re: YardFlow and the 2027 roadmap', excerpt: ROADMAP, inboundMessageId: 'm-sep16', threadId: 't-kenco', hubspotContactId: '217664765537', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', nextStep: 'Reconnect at the end of October during 2027 budgeting' }], dealCoverage: 'complete', opportunity: 'open' };
  const kencoTask = (over: Partial<ClaimedTask> = {}) => task({ itemKey: `person:${DAVE_EMAIL}`, input: personInput, ...over });
  const packetOf = (over: { vaultDown?: boolean } = {}) => assembleCommercialContext({ opportunity: async () => ({ opportunity: open }), timeline: async () => ({ events: [sep16, oct1], coverage: [{ source: 'gmail' as const }] }), knowledge: { vault: over.vaultDown ? { readFile: async () => { throw new Error('vault not mounted'); } } : vaultOf(FILES), clawd: { fetchSnapshot: async () => snapshot() } } }, { ...KENCO, people: packetSeedFromInput(personInput).identity.people, threadId: 't-kenco' }).then((r) => r.packet);
  const gen = (text: string) => vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text, provider: 'test' }));
  const WHY = 'My guess is Dave has laid out the 2027 roadmap already: Open Dock stays at the ungated sites, Birdseye covers the secure yards and Blue Yonder YMS pilots follow the WMS migration, so the end-of-October reconnect is about where a standard driver journey still adds production capacity across those yards.';
  const STARTERS = ['Which sites move to Blue Yonder first, and how are drivers checked in there today?', 'Where does Birdseye hand off to the dock once a truck is inside the secure yards?'];
  const answer = (over: Record<string, unknown> = {}) => JSON.stringify({ whyItMatters: WHY, accounts: ['Kenco Logistics'], roles: ['Vice President of Transportation Management'], people: [], starters: STARTERS, proposedAction: 'email', caveat: null, ...over });

  it('C21: the prompt carries the systems on record with their class and date, the buyer words, the last exchange, the deal next step, the seller hypotheses as hypotheses and the gaps; the result carries the references, the revision and the gaps', async () => {
    const w = ledgerDb({ accounts: ['Kenco Logistics'], personas: [] }, NOW);
    const packet = await packetOf({ vaultDown: true });
    const record = packetRecord(packet);
    const buyerLabel = [...record.refs.entries()].find(([, c]) => c.sourceId === 'gmail:1a0aa7d3c587d944')![0];
    const generate = gen(answer({ support: [{ text: WHY, refs: [buyerLabel], kind: 'fact' }, { text: STARTERS[0], refs: [buyerLabel], kind: 'fact' }, { text: STARTERS[1], refs: [buyerLabel], kind: 'inference' }] }));
    const r = await developAngle(kencoTask(), { prisma: w.client(), now: NOW }, { generate, packet });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const prompt = generate.mock.calls[0][0];
    expect(prompt).toContain('Systems on record at the account (never ask about these as if unknown): ');
    expect(prompt).toMatch(/Open Dock \(Buyer said, Sep 16, 2026\)/);
    expect(prompt).toMatch(/Blue Yonder \(Buyer said, Sep 16, 2026\)/);
    expect(prompt).toContain(`[${buyerLabel}] Buyer said, Sep 16, 2026: ${DAVE_EMAIL}: We will keep Open Dock`);
    expect(prompt).toContain('Last exchange: they last wrote Sep 16, 2026 ("Re: YardFlow and the 2027 roadmap"); we last wrote Oct 1, 2026: "Understood, I will reconnect at the end of October."');
    expect(prompt).toContain("The deal's recorded next step: Reconnect at the end of October during 2027 budgeting.");
    expect(prompt).toContain('What the seller thinks (hypotheses, not facts');
    expect(prompt).toMatch(/Seller noted, Aug 7, 2026: Craig is bought in/);
    expect(prompt).toContain('Not read (say so in the caveat when it matters): vault: could not be read (vault unreadable: vault not mounted)');
    expect(prompt).not.toMatch(/\$98\.9M|Deck engagement|already emailed/);
    expect(prompt).toContain('"support": [{"text"');
    expect(r.result).toMatchObject({ contextRevision: packet.revision, contextGaps: ['vault: could not be read (vault unreadable: vault not mounted)', 'public: not configured'], inDeal: true, dealId: '62704698979' });
    expect((r.result.incumbents as Array<{ name: string }>).map((i) => i.name.toLowerCase())).toEqual(expect.arrayContaining(['open dock', 'blue yonder', 'birdseye']));
    const support = r.result.support as Array<{ where: string; kind: string; refs: Array<{ ref: string; sourceId: string; at: string | null; claimClass: string }> }>;
    expect(support.map((s) => s.where)).toEqual(['whyItMatters', 'starter', 'starter']);
    expect(support[0].refs[0]).toMatchObject({ ref: buyerLabel, sourceId: 'gmail:1a0aa7d3c587d944', claimClass: 'buyer_said', at: '2026-09-16T14:02:00.000Z' });
    expect(support[2].kind).toBe('inference');
    expect(r.result).not.toHaveProperty('support.0.text', undefined);
  });

  it('C57 F9: with no timeline injected, the handler reads the typed timeline itself (the stored inbound rows and the Sent reader given), so the prompt carries the last exchange naming our send; the identity the Pursue placed stands', async () => {
    const w = ledgerDb({ accounts: ['Kenco Logistics'], personas: [], inbound: [{ id: 'm-sep16', thread_id: 't-kenco', rfc_message_id: '<sep16@kencogroup.com>', from_email: DAVE_EMAIL, from_name: 'Dave Kiesling', subject: 'Re: YardFlow and the 2027 roadmap', body_text: ROADMAP, received_at: new Date('2026-09-16T14:02:00Z'), source: 'gmail', thread: { account_name: 'Kenco Logistics' } }] }, NOW);
    const listSent = vi.fn<(recipient: string, after: number, before: number) => Promise<Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }>>>(async () => [{ id: 'sent-oct1', threadId: 't-kenco', internalDate: new Date('2026-10-01T16:00:00Z'), to: DAVE_EMAIL, subject: 'Re: YardFlow and the 2027 roadmap' }]);
    const generate = gen(answer());
    const r = await developAngle(kencoTask(), { prisma: w.client(), now: NOW }, { generate, thread: { listSent, ownAddresses: new Set(['casey@yardflow.ai']) } });
    expect(r.ok).toBe(true);
    const prompt = generate.mock.calls[0][0];
    expect(prompt).toContain('Last exchange: they last wrote Sep 16, 2026 ("Re: YardFlow and the 2027 roadmap"); we last wrote Oct 1, 2026');
    expect(listSent).toHaveBeenCalledTimes(1);
    expect(String(listSent.mock.calls[0][0])).toBe(DAVE_EMAIL);
    if (r.ok) expect(r.result).toMatchObject({ accountName: 'Kenco Logistics', inDeal: true });
    expect(prompt).not.toContain('gmail: could not be read');
  });

  it('C22: an invented installed system is re-asked naming it, then refused; an unsupported buyer claim is refused unless labelled an inference; an unhedged pain with no record is refused; a supported July observation stays usable with its date; a label the record lacks is refused', async () => {
    const w = ledgerDb({ accounts: ['Kenco Logistics'], personas: [] }, NOW);
    const packet = await packetOf();
    const record = packetRecord(packet);
    const manhattan = gen(answer({ whyItMatters: WHY.replace('Open Dock', 'Manhattan') }));
    const refused = await developAngle(kencoTask(), { prisma: w.client(), now: NOW }, { generate: manhattan, packet });
    expect(refused).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: expect.stringMatching(/^invented_system manhattan: .* \(after 2 re-asks\)$/) });
    expect(manhattan).toHaveBeenCalledTimes(MAX_ANGLE_CALLS);
    expect(manhattan.mock.calls[1][0]).toContain('it names an installed system the record does not name (manhattan');
    // A fixed second answer succeeds with calls 2.
    const fixed = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>().mockResolvedValueOnce({ text: answer({ whyItMatters: WHY.replace('Open Dock', 'Manhattan') }), provider: 'test' }).mockResolvedValueOnce({ text: answer(), provider: 'test' });
    expect(await developAngle(kencoTask(), { prisma: w.client(), now: NOW }, { generate: fixed, packet })).toMatchObject({ ok: true, result: { calls: 2 } });
    // The pure validator: the buyer claim, the pain, the inference label, the historical observation, the unknown label.
    const buyer = { whyItMatters: 'I suspect the timing is right. Dave wants a pilot in Allentown before the budget closes.', starters: STARTERS };
    // C57 F11: Dave is a buyer subject because he is a packet person, not because of a list.
    const dave = { people: [{ name: 'Dave Kiesling', email: DAVE_EMAIL }] };
    expect(validateAngleClaims(buyer, [], record.refs, dave)).toMatchObject({ ok: false, reason: 'unsupported_buyer_claim', detail: 'Dave wants a pilot in Allentown before the budget closes.' });
    // C57 P2-3: the inference label never excuses an attribution; a guess with no attribution keeps its label.
    expect(validateAngleClaims(buyer, [{ text: 'Dave wants a pilot in Allentown before the budget closes.', refs: [], kind: 'inference' }], record.refs, dave)).toMatchObject({ ok: false, reason: 'unsupported_buyer_claim' });
    const guess = { whyItMatters: 'I suspect the timing is right. A pilot in Allentown before the budget closes could be the ask.', starters: STARTERS };
    expect(validateAngleClaims(guess, [{ text: 'A pilot in Allentown before the budget closes could be the ask.', refs: [], kind: 'inference' }], record.refs, dave)).toMatchObject({ ok: true, support: expect.arrayContaining([expect.objectContaining({ text: 'A pilot in Allentown before the budget closes could be the ask.', kind: 'inference' })]) });
    // The probe: labelled inference with an EMPTY record, the attribution is refused; the same labelled text names systems the record lacks too.
    const probe = { whyItMatters: 'My guess is the stack is moving. Alex told us they are replacing Open Dock with Kaleris next year.', starters: STARTERS };
    expect(validateAngleClaims(probe, [{ text: 'Alex told us they are replacing Open Dock with Kaleris next year.', refs: [], kind: 'inference' }], new Map(), { people: [{ name: 'Alex Rivera' }] })).toMatchObject({ ok: false, reason: 'unsupported_buyer_claim', detail: 'Alex told us they are replacing Open Dock with Kaleris next year.' });
    expect(validateAngleClaims(probe, [{ text: 'Alex told us they are replacing Open Dock with Kaleris next year.', refs: [], kind: 'inference' }], new Map(), {})).toMatchObject({ ok: false, reason: 'unsupported_buyer_claim' });
    // Kaleris is in the record (the July meeting names it), so it passes labelled; Manhattan is not, so the label does not save it.
    expect(validateAngleClaims({ whyItMatters: 'My guess is the stack is moving toward Kaleris at the secure sites.', starters: STARTERS }, [{ text: 'My guess is the stack is moving toward Kaleris at the secure sites.', refs: [], kind: 'inference' }], record.refs)).toMatchObject({ ok: true });
    expect(validateAngleClaims({ whyItMatters: 'My guess is the stack is moving toward Manhattan at the secure sites.', starters: STARTERS }, [{ text: 'My guess is the stack is moving toward Manhattan at the secure sites.', refs: [], kind: 'inference' }], record.refs)).toMatchObject({ ok: false, reason: 'invented_system', detail: expect.stringMatching(/^manhattan/) });
    // A starter that is a statement rather than a question is checked as one; a question with a buyer verb is not an attribution.
    expect(validateAngleClaims({ whyItMatters: WHY, starters: ['Dave told us the pilot starts in March.', STARTERS[1]] }, [{ text: 'Dave told us the pilot starts in March.', refs: [], kind: 'inference' }], record.refs, dave)).toMatchObject({ ok: false, reason: 'unsupported_buyer_claim' });
    expect(validateAngleClaims({ whyItMatters: WHY, starters: ['What does your team need from a pilot before the budget closes?', STARTERS[1]] }, [], record.refs, dave)).toMatchObject({ ok: true });
    const pain = { whyItMatters: 'Their yards run on radios and clipboards. I suspect the reconnect is the moment to ask about the ungated sites and the gate.', starters: STARTERS };
    expect(validateAngleClaims(pain, [], record.refs)).toMatchObject({ ok: false, reason: 'invented_pain', detail: 'Their yards run on radios and clipboards.' });
    expect(validateAngleClaims({ ...pain, whyItMatters: pain.whyItMatters.replace('Their yards run on', 'My guess is their yards still run on') }, [], record.refs)).toMatchObject({ ok: true });
    const julyLabel = [...record.refs.entries()].find(([, c]) => /open dock, we've got Terminal/.test(c.text))![0];
    const july = validateAngleClaims({ whyItMatters: 'My guess is the July picture still holds. In July Dave said the stack was all over the place with no real consistency, and the September roadmap keeps Open Dock and Blue Yonder.', starters: STARTERS }, [{ text: 'In July Dave said the stack was all over the place with no real consistency, and the September roadmap keeps Open Dock and Blue Yonder.', refs: [julyLabel], kind: 'fact' }], record.refs);
    expect(july).toMatchObject({ ok: true });
    if (july.ok) expect(july.support[1].refs[0]).toMatchObject({ ref: julyLabel, at: '2026-07-16T00:00:00.000Z', claimClass: 'buyer_said', sourceId: 'vault:05_Meetings/2026-07-16 Kenco Logistics.md#Buyer words (verbatim)' });
    expect(validateAngleClaims({ whyItMatters: WHY, starters: STARTERS }, [{ text: WHY, refs: ['K99'], kind: 'fact' }], record.refs)).toEqual({ ok: false, reason: 'unknown_ref', detail: 'K99' });
    // C57 F11: the buyer subjects come from the packet's people, never a hard-coded list: Bryan is refused when Bryan is a packet person and no buyer line supports it.
    const bryan = { whyItMatters: 'My guess is the timing works. Bryan confirmed the budget for a yard network pilot in 2027.', starters: STARTERS };
    expect(validateAngleClaims(bryan, [], record.refs, { people: [{ name: 'Bryan Alvarez', email: 'bryan.alvarez@kencogroup.com' }] })).toMatchObject({ ok: false, reason: 'unsupported_buyer_claim', detail: 'Bryan confirmed the budget for a yard network pilot in 2027.' });
    expect(validateAngleClaims(bryan, [], record.refs, { people: [{ name: 'Dave Kiesling' }] })).toMatchObject({ ok: true });
    expect(buyerSubjectRe([{ name: 'Bryan Alvarez' }]).test('Bryan said so')).toBe(true);
    expect(buyerSubjectRe([]).test('Bryan said so')).toBe(false);
    expect(buyerSubjectRe([]).test('the committee decided')).toBe(true);
    // C57 F10: the Pursue's purpose rides on the seeded message, so a vendor pitch never seeds a buyer fact.
    const vendorSeed = packetSeedFromInput({ ...personInput, email: 'seb@riserify.example', purpose: 'vendor_solicitation', excerpt: 'We book meetings for yard software vendors. Reply YES to book a strategy call.' });
    expect(vendorSeed.timeline[0].purpose).toBe('vendor_solicitation');
    expect(buyerClaimsFromTimeline(vendorSeed.timeline, 'Kenco Logistics').filter((c) => c.claimClass === 'buyer_said')).toEqual([]);
    expect(packetSeedFromInput({ ...personInput, purpose: 'not a purpose' }).timeline[0].purpose).toBeNull();
    expect(packetSeedFromInput(personInput).timeline[0].purpose).toBeNull();
    // C23 seed: the revision of what the Pursue carried moves with the CRM read and the message, not with the clock.
    expect(seedRevision(personInput)).toBe(seedRevision({ ...personInput, decision: 'more', note: 'x' }));
    expect(seedRevision(personInput)).not.toBe(seedRevision({ ...personInput, deals: [{ ...personInput.deals[0], nextStep: 'Send the phased proposal' }] }));
    expect(seedRevision(personInput)).not.toBe(seedRevision({ ...personInput, accountName: null, resolvedVia: null }));
    expect(seedRevision(personInput)).not.toBe(seedRevision({ ...personInput, lastWroteAt: '2026-10-07T10:00:00.000Z', inboundMessageId: 'm-oct7' }));
  });
});
