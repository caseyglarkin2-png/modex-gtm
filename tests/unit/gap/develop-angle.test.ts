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
import { buildAnglePrompt, developAngle, loadAngles, parseAngle, sourceLineFor, validateAngle, type DevelopAngleDeps } from '@/lib/gap/agents/develop-angle';
import { agentTaskHandlers } from '@/lib/gap/agents/handlers';
import { runAgentTasks, type ClaimedTask } from '@/lib/gap/agents/tasks';
import { applyDecision } from '@/lib/gap/work/decide';

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
  });

  it('the parser wants why, two starters and an action; the checks refuse an em dash, "yard" alone, a product name, money, a person not offered, a why too short', () => {
    const a = parseAngle(GOOD)!;
    expect(a).toMatchObject({ proposedAction: 'email', people: [1, 2], roles: ['VP Operations', 'Director of Distribution', 'Yard Operations Manager'] });
    expect(parseAngle(JSON.stringify({ whyItMatters: 'x', starters: ['one'], proposedAction: 'email' }))).toBeNull();
    expect(parseAngle('nope')).toBeNull();
    const roster = new Set([1, 2]);
    expect(validateAngle(a, roster)).toEqual({ ok: true });
    expect(validateAngle({ ...a, whyItMatters: a.whyItMatters.replace(', and', ' — and') }, roster)).toMatchObject({ ok: false, reason: 'em_dash' });
    expect(validateAngle({ ...a, whyItMatters: a.whyItMatters.replace('the yards outside', 'the yard outside') }, roster)).toMatchObject({ ok: false, reason: 'yard_singular' });
    expect(validateAngle({ ...a, starters: ['Would YardFlow fit?', a.starters[1]] }, roster)).toMatchObject({ ok: false, reason: 'product_named' });
    expect(validateAngle({ ...a, caveat: 'Worth $40,000 a year.' }, roster)).toMatchObject({ ok: false, reason: 'money_promised' });
    expect(validateAngle({ ...a, people: [1, 9] }, roster)).toMatchObject({ ok: false, reason: 'person_not_offered', detail: '9' });
    expect(validateAngle({ ...a, whyItMatters: 'Too short to say.' }, roster)).toMatchObject({ ok: false, reason: 'length' });
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
    expect(person.mock.calls[0][0]).toContain('they last wrote to us Sep 16, 2026. The angle is for reopening that conversation.');
    const bad: DevelopAngleDeps = { generate: async () => ({ text: 'I cannot help with that.', provider: 'test' }) };
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, bad)).toMatchObject({ ok: false, reason: 'could_not_satisfy' });
    const stranger: DevelopAngleDeps = { generate: async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), people: [3] }), provider: 'test' }) };
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, stranger)).toMatchObject({ ok: true });
    const outside: DevelopAngleDeps = { generate: async () => ({ text: JSON.stringify({ ...JSON.parse(GOOD), people: [4] }), provider: 'test' }) };
    expect(await developAngle(task(), { prisma: w.client(), now: NOW }, outside)).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: 'person_not_offered 4' });
    expect(buildAnglePrompt({ title: 't', sourceLine: 's', accountName: null, accountHint: null, categories: [], note: null, person: null, roster: [], theses: [], recent: [], candidateAccounts: [], decision: 'more' })).toContain('No account is named.');
  });
});
