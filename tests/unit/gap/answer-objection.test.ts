// @vitest-environment node
/**
 * X16d (GAP OS sales execution engine, 2026-10-08): the objections task. A confirmed disposition that carries an
 * objection ("we have a YMS", a 3PL runs the yards) queues `answer_objection`; the agent prepares a talking point
 * for the seller from the objection, the buyer's words and the thesis's own facts (nothing else), and the call
 * brief shows it under the objection. Never an email: a talking point the seller says in their own words. Pinned:
 * the prompt carries the objection, the buyer's words, the facts with ids and what a no would mean; a talking point
 * citing a fact the thesis does not carry, naming the product, promising money, using an em dash or "yard" alone is
 * refused (could_not_satisfy, final, no retry); a cleared one is the task's result and the brief loader finds it for
 * the person; the queue supersedes an earlier queued task on the same disposition.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { answerObjection, buildObjectionPrompt, loadObjectionAnswers, parseObjectionAnswer, queueObjectionTask, validateObjectionAnswer, type AnswerObjectionDeps } from '@/lib/gap/agents/answer-objection';
import { loadAgentTask, runAgentTasks, type ClaimedTask } from '@/lib/gap/agents/tasks';
import { agentTaskHandlers } from '@/lib/gap/agents/handlers';

const NOW = new Date('2026-10-08T16:00:00Z');
const SIGNAL = { id: 'sig-1', title: 'PepsiCo expands Tulsa DC', evidence_url: 'https://tulsaworld.com/p', external_ok: true, observed_at: new Date('2026-07-23T10:00:00Z'), evidence_text: 'PepsiCo is expanding its Tulsa distribution center by 180,000 square feet', source_kind: 'evidence_record', account_name: 'PepsiCo' };
const GOOD = JSON.stringify({ answer: 'Fair, and most sites we talk to run one. The expansion in Tulsa adds 180,000 square feet of distribution space [[SRC:sig-1]], so my guess is the YMS sees the trailers it was told about, and the gate still works from a clipboard when the yards fill up.', question: 'When a trailer is not where the YMS says it is, how does the gate find it today?' });

function world(over: { objection?: string | null; confirmed?: boolean } = {}) {
  const db = ledgerDb({
    accounts: ['PepsiCo'],
    personas: [{ id: 7, name: 'Karen Ortiz', title: 'Director of Yard Ops', email: 'karen@pepsico.com', account_name: 'PepsiCo' }],
    hypotheses: [{ id: 'hyp-1', account_name: 'PepsiCo', status: 'active', problem_family: 'dwell', observation: 'PepsiCo is expanding its Tulsa DC [S:sig-1].', problem_hypothesis: 'The gate falls behind.', what_a_no_means: 'The yards are not the constraint in Tulsa.', created_at: new Date('2026-09-01T00:00:00Z'), signals: [{ signal_id: 'sig-1', signal: SIGNAL }] }],
    dispositions: [{ id: 'D1', account_name: 'PepsiCo', persona_id: 7, contact_email: 'karen@pepsico.com', channel: 'call', response_class: 'existing_solution_yms', objection: over.objection === undefined ? 'We already run a YMS.' : over.objection, buyer_language: 'We put in a YMS last year and it covers the yards.', hypothesis_id: 'hyp-1', human_confirmed: over.confirmed ?? true, created_at: new Date('2026-10-08T15:00:00Z') }],
  }, NOW);
  const generate = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: GOOD, provider: 'test' }));
  const deps: AnswerObjectionDeps = { generate };
  const task = (over: Partial<ClaimedTask> = {}): ClaimedTask => ({ id: 'at_1', kind: 'answer_objection', itemKey: 'objection:D1', itemToken: '', day: '2026-10-08', revision: 0, request: 'We already run a YMS.', requestedBy: 'casey@freightroll.com', requestedFrom: 'app:disposition', status: 'running', attempts: 1, attempt: 1, queuedAt: NOW.toISOString(), leaseUntil: new Date(NOW.getTime() + 400_000).toISOString(), fence: 'f', result: null, lastError: null, final: false, supersededBy: null, input: { dispositionId: 'D1', accountName: 'PepsiCo', personaId: 7 }, ...over });
  return { db, c: db.client(), generate, deps, task };
}

describe('X16d: the prompt and the checks', () => {
  it('the prompt carries the objection, the buyer words, the facts with ids and what a no would mean; the parser wants answer and question', () => {
    const p = buildObjectionPrompt({ objection: 'We already run a YMS.', buyerLanguage: 'it covers the yards', responseClass: 'existing_solution_yms', firstName: 'Karen', account: 'PepsiCo', title: 'Director of Yard Ops', facts: ['- id sig-1: PepsiCo expands Tulsa DC'], observation: 'PepsiCo is expanding its Tulsa DC.', problemHypothesis: 'The gate falls behind.', whatANoMeans: 'The yards are not the constraint.' });
    for (const s of ['We already run a YMS.', 'it covers the yards', 'sig-1', 'The yards are not the constraint.', 'Karen', 'Director of Yard Ops', '[[SRC:<id>]]']) expect(p).toContain(s);
    expect(parseObjectionAnswer(GOOD)).toMatchObject({ question: 'When a trailer is not where the YMS says it is, how does the gate find it today?' });
    expect(parseObjectionAnswer('not json')).toBeNull();
    expect(parseObjectionAnswer(JSON.stringify({ answer: 'x' }))).toBeNull();
  });

  it('refuses an unknown fact, the product name, money, an em dash and "yard" alone; accepts the good one', () => {
    const good = parseObjectionAnswer(GOOD)!;
    expect(validateObjectionAnswer(good, new Set(['sig-1']))).toEqual({ ok: true, factsUsed: ['sig-1'] });
    expect(validateObjectionAnswer({ ...good, answer: good.answer.replace('sig-1', 'sig-9') }, new Set(['sig-1']))).toMatchObject({ ok: false, reason: 'unknown_fact' });
    expect(validateObjectionAnswer({ ...good, answer: `YardFlow does this. ${good.answer}` }, new Set(['sig-1']))).toMatchObject({ ok: false, reason: 'product_named' });
    expect(validateObjectionAnswer({ ...good, answer: `${good.answer} That is $40,000 a year.` }, new Set(['sig-1']))).toMatchObject({ ok: false, reason: 'money_promised' });
    expect(validateObjectionAnswer({ ...good, answer: good.answer.replace(', and', ' — and') }, new Set(['sig-1']))).toMatchObject({ ok: false, reason: 'em_dash' });
    expect(validateObjectionAnswer({ ...good, answer: good.answer.replace('the yards fill up', 'the yard fills up') }, new Set(['sig-1']))).toMatchObject({ ok: false, reason: 'yard_singular' });
    expect(validateObjectionAnswer({ answer: 'Too short.', question: 'Why?' }, new Set())).toMatchObject({ ok: false, reason: 'length' });
  });
});

describe('X16d: the task', () => {
  it('a cleared talking point is the result with the facts used; the brief loader finds it for the person; the registry carries the handler', async () => {
    const w = world();
    const q = await queueObjectionTask(w.c, { dispositionId: 'D1', accountName: 'PepsiCo', personaId: 7, contactEmail: 'karen@pepsico.com', hypothesisId: 'hyp-1', objection: 'We already run a YMS.', buyerLanguage: 'it covers the yards', actor: 'casey@freightroll.com', now: NOW });
    expect(q.superseded).toEqual([]);
    const again = await queueObjectionTask(w.c, { dispositionId: 'D1', accountName: 'PepsiCo', personaId: 7, contactEmail: 'karen@pepsico.com', hypothesisId: 'hyp-1', objection: 'We already run a YMS.', buyerLanguage: null, actor: 'casey@freightroll.com', now: new Date(NOW.getTime() + 1000) });
    expect(again.superseded).toEqual([q.id]);
    expect(Object.keys(agentTaskHandlers())).toContain('answer_objection');
    const report = await runAgentTasks(w.c, { now: new Date(NOW.getTime() + 2000), max: 5, claimer: 'test', handlers: { answer_objection: (t, ctx) => answerObjection(t, ctx, w.deps) } });
    expect(report).toMatchObject({ claimed: 1, succeeded: 1 });
    const done = await loadAgentTask(w.c, again.id);
    expect(done).toMatchObject({ status: 'succeeded', result: { dispositionId: 'D1', personaId: 7, factsUsed: ['sig-1'], provider: 'test' } });
    expect(w.generate.mock.calls[0][0]).toContain('We put in a YMS last year and it covers the yards.');
    const answers = await loadObjectionAnswers(w.c, { personaId: 7, now: new Date(NOW.getTime() + 3000) });
    expect(answers).toHaveLength(1);
    expect(answers[0]).toMatchObject({ dispositionId: 'D1', objection: 'We already run a YMS.', question: 'When a trailer is not where the YMS says it is, how does the gate find it today?', factsUsed: ['sig-1'] });
    expect(await loadObjectionAnswers(w.c, { personaId: 8, now: NOW })).toEqual([]);
  });

  it('garbage from the model, or a talking point that breaks a rule, is could_not_satisfy and final; an unconfirmed or missing disposition is refused', async () => {
    const w = world();
    // A03: a voice-rule break is re-asked once; a second break stands.
    const singular = JSON.stringify({ ...JSON.parse(GOOD), answer: JSON.parse(GOOD).answer.replace('when the yards fill up', 'when the yard fills up') });
    w.generate.mockResolvedValueOnce({ text: singular, provider: 'test' }).mockResolvedValueOnce({ text: GOOD, provider: 'test' });
    const reasked = await answerObjection(w.task(), { prisma: w.c, now: NOW }, w.deps);
    expect(reasked.ok).toBe(true);
    expect(w.generate.mock.calls[w.generate.mock.calls.length - 1][0]).toContain('rejected by the checker: it says "yard" in the singular here: "');
    w.generate.mockResolvedValueOnce({ text: singular, provider: 'test' }).mockResolvedValueOnce({ text: singular, provider: 'test' }).mockResolvedValueOnce({ text: singular, provider: 'test' });
    expect(await answerObjection(w.task(), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: expect.stringMatching(/^yard_singular .*the yard fills up.* \(after 2 re-asks\)$/) });
    w.generate.mockResolvedValueOnce({ text: 'I cannot help with that.', provider: 'test' });
    expect(await answerObjection(w.task(), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'could_not_satisfy' });
    const named = { text: JSON.stringify({ answer: 'YardFlow fixes that for the yards across every site we have seen so far, honestly, and it does it in a week or two at most without any trouble.', question: 'Would you like a demo?' }), provider: 'test' };
    // A03: a product name is re-asked once; named twice, the refusal stands.
    w.generate.mockResolvedValueOnce(named).mockResolvedValueOnce(named).mockResolvedValueOnce(named);
    expect(await answerObjection(w.task(), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: expect.stringContaining('product_named') });
    const q = await queueObjectionTask(w.c, { dispositionId: 'D1', accountName: 'PepsiCo', personaId: 7, contactEmail: 'karen@pepsico.com', hypothesisId: 'hyp-1', objection: 'We already run a YMS.', buyerLanguage: null, actor: 'x', now: NOW });
    w.generate.mockResolvedValueOnce({ text: 'nope', provider: 'test' });
    await runAgentTasks(w.c, { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { answer_objection: (t, ctx) => answerObjection(t, ctx, w.deps) } });
    expect(await loadAgentTask(w.c, q.id)).toMatchObject({ status: 'failed', final: true });
    expect(w.generate).toHaveBeenCalledTimes(10); // A03c: 2 (re-asked once) + 3 (stubborn) + 1 (garbage) + 3 (named) + 1 (nope)
    const unconfirmed = world({ confirmed: false });
    expect(await answerObjection(unconfirmed.task(), { prisma: unconfirmed.c, now: NOW }, unconfirmed.deps)).toMatchObject({ ok: false, reason: 'not_confirmed' });
    expect(await answerObjection(w.task({ itemKey: 'objection:D9' }), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'disposition_not_found' });
  });
});
