// @vitest-environment node
/**
 * X09 (GAP OS sales execution engine, 2026-10-08): `revise_message`, the first agent task. The seller's critique, the
 * card's current copy and the thesis's verified facts go to the model; the candidate MUST pass the message
 * compiler (every check, the critic) or the task ends `could_not_satisfy` with the reasons, final, never a retry and
 * never an invented fact; a cleared candidate is PROPOSED (copy-revision.ts, never approved by the agent) and the
 * assignment is re-sent in the same thread at the next revision with the proposed copy and the critique it answers.
 * Pinned: the prompt carries the critique, the current copy and only the thesis's own facts with their ids; a
 * candidate citing a fact the thesis does not carry is refused by the compiler; garbage from the model is
 * could_not_satisfy; the REVISE command queues exactly one task (superseding a queued one) and answers the seller.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { reviseMessage, reviseRequest, type ReviseDeps } from '@/lib/gap/agents/revise-message';
import { loadAgentTask, queueAgentTask, runAgentTasks, type ClaimedTask } from '@/lib/gap/agents/tasks';
import { loadProposedCopyRevisions } from '@/lib/gap/execution/copy-revision';
import type { CriticClient, CriticScoreResult } from '@/lib/gap/critic-client';
import { ASSIGNMENT_SENT, sendAssignment } from '@/lib/gap/work/assignment';
import { planDay, type DayPlan } from '@/lib/gap/work/plan';
import { STEPS_SCHEMA } from '@/lib/gap/sequence/steps';
import { STEP_PURPOSES } from '@/lib/gap/taxonomy';
import type { WorkDay } from '@/lib/gap/work/list';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-08T16:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SIGNAL = { id: 'sig-1', title: 'PepsiCo expands Tulsa DC', evidence_url: 'https://tulsaworld.com/p', external_ok: true, observed_at: new Date('2026-07-23T10:00:00Z'), freshness_expires_at: new Date('2027-01-01T00:00:00Z'), source_type: 'public_primary', claim_class: 'site_expansion', evidence_text: 'PepsiCo is expanding its Tulsa distribution center by 180,000 square feet', source_kind: 'evidence_record', account_name: 'PepsiCo', type: 'site_expansion', metadata: null };

const DAY: WorkDay = {
  cards: [{ accountName: 'PepsiCo', href: '/gap/accounts/pepsico', lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'A prepared first touch', person: { name: 'Karen Ortiz', title: 'Director' }, next: { label: 'Send email', href: '/gap/pack/dec-1' }, blocker: null, index: 0, source: 'pursuit', tier: 'ready' }],
  waiting: [],
  snoozed: [],
  counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 },
};

const GOOD = JSON.stringify({ subject: 'Tulsa: the gate', body: 'Karen, PepsiCo is expanding its Tulsa distribution center by 180,000 square feet [[SRC:sig-1]].\n\nMy guess is the gate team feels the extra doors before anyone else does, and the wait starts there rather than at the dock. Is the gate where your drivers lose the most time?' });

async function world() {
  const db = ledgerDb({
    accounts: ['PepsiCo'],
    personas: [{ id: 7, name: 'Karen Ortiz', title: 'Director', email: 'karen@pepsico.com', phone: null, linkedin_url: null, hubspot_contact_id: null, account_name: 'PepsiCo', do_not_contact: false, email_valid: true, email_status: 'unverified' }],
    hypotheses: [{ id: 'hyp-1', account_name: 'PepsiCo', status: 'active', problem_family: 'dwell', observation: 'PepsiCo is expanding its Tulsa DC [S:sig-1].', problem_hypothesis: 'The gate falls behind.', sequence_version_id: 'ver-1', sequence_family_id: 'fam-1', primary_persona_id: 7, metadata: null, signals: [{ signal_id: 'sig-1', signal: SIGNAL }], events: [] }],
    routingDecisions: [{ id: 'dec-1', rule_id: 'r', action: 'enroll_gap_sequence', lane: 'ready', persona_id: 7, hypothesis_id: 'hyp-1', account_name: 'PepsiCo', inputs_snapshot: null, created_at: new Date('2026-10-01T00:00:00Z') }],
    sequenceVersions: [{ id: 'ver-1', family_id: 'fam-1', version: 1, status: 'frozen', family: { id: 'fam-1', name: 'Dwell', engine: 'modex_draft_queue', program: null }, steps: { schema: STEPS_SCHEMA, steps: [{ index: 0, delay: { value: 0, unit: 'business_days' }, purpose: STEP_PURPOSES[0], productProofAllowed: false, requiredEvidenceTypes: [], claimsUsed: [], templates: { subjectTemplate: 'A question on Tulsa', bodyTemplate: '{{first_name}}, {{observation}}\n\nMy guess is the gate is where the day goes. Is it?' } }] } }],
  }, NOW);
  const c = db.client();
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => DAY }, 'test');
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => ({ provider: 'gmail', id: 'gm-1', threadId: p.threadId ?? 'th-item-0' }));
  await sendAssignment(c, { plan, item: plan.items[0], revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, { send });
  send.mockClear();
  const generate = vi.fn<(prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>>(async () => ({ text: GOOD, provider: 'test' }));
  const critic: CriticClient & { score: ReturnType<typeof vi.fn> } = { score: vi.fn(async (): Promise<CriticScoreResult> => ({ ok: true, verdict: 'pass', score: 90, findings: [] })) };
  const settings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review' as const, targets: {} };
  const deps: ReviseDeps = { generate, critic, send, postReview: (async () => undefined) as unknown as ReviseDeps['postReview'], settings: async () => settings, sender: () => SENDER, baseUrl: 'https://app.example', actionSecret: null };
  const task = (over: Partial<ClaimedTask> = {}): ClaimedTask => ({ id: 'at_1', kind: 'revise_message', itemKey: plan.items[0].key, itemToken: plan.items[0].token, day: '2026-10-08', revision: 0, request: 'Too generic. Make it about the gate, and name the Tulsa site.', requestedBy: SELLER, requestedFrom: 'gmail:cmd-1', status: 'running', attempts: 1, attempt: 1, queuedAt: NOW.toISOString(), leaseUntil: new Date(NOW.getTime() + 400_000).toISOString(), fence: 'f', result: null, lastError: null, final: false, supersededBy: null, ...over });
  return { db, c, plan, send, generate, critic, deps, task, settings };
}

describe('X09: reviseMessage', () => {
  it('a cleared candidate is proposed (never approved), compiled against the thesis\'s own facts, and the assignment is re-sent at the next revision with the proposed copy and the critique', async () => {
    const w = await world();
    const r = await reviseMessage(w.task(), { prisma: w.c, now: NOW }, w.deps);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result).toMatchObject({ compileVerdict: 'pass', emailed: true, assignmentRevision: 1, decisionId: 'dec-1' });
    const prompt = w.generate.mock.calls[0][0];
    expect(prompt).toContain('Too generic. Make it about the gate, and name the Tulsa site.');
    expect(prompt).toContain('A question on Tulsa');
    expect(prompt).toContain('sig-1');
    expect(prompt).toContain('180,000 square feet');
    expect(prompt).not.toContain('[S:sig-1]');
    const proposed = await loadProposedCopyRevisions(w.c, { decisionId: 'dec-1', stepIndex: 0 });
    expect(proposed).toHaveLength(1);
    expect(proposed[0]).toMatchObject({ approved: false, compileVerdict: 'pass', basis: { critique: w.task().request, facts: ['sig-1'] }, taskId: 'at_1' });
    expect(proposed[0].queued.body).not.toContain('[[SRC:');
    expect(w.db.store.gapCompile).toHaveLength(1);
    expect(w.db.store.gapCompile[0].inputs_snapshot.body).toContain('[[SRC:sig-1]]');
    expect(w.critic.score).toHaveBeenCalledTimes(1);
    const sent = w.db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT);
    expect(sent).toHaveLength(2);
    expect(sent[1].payload).toMatchObject({ revision: 1, contentHash: proposed[0].contentHash, prepared: { kind: 'email', subject: 'Tulsa: the gate' } });
    const mail = w.send.mock.calls[0][0];
    expect(mail.subject).toMatch(/\[GAP#[a-f0-9]{32}\.1\]$/);
    expect(mail.threadId).toBe('th-item-0');
    expect(mail.text).toContain('Revised on your words: "Too generic. Make it about the gate, and name the Tulsa site."');
    expect(mail.text).toContain('> Karen, PepsiCo is expanding its Tulsa distribution center by 180,000 square feet.');
    expect(mail.text).not.toContain('[[SRC:');
  });

  it('a candidate that fails the compiler ends could_not_satisfy with the reasons, final; nothing is proposed, nothing is sent', async () => {
    const w = await world();
    w.generate.mockResolvedValue({ text: JSON.stringify({ subject: 'Big savings', body: 'Karen, YardFlow cuts your detention 40% at Tulsa [[SRC:sig-1]].\n\nYou are losing money every day. Can we book 15 minutes?' }), provider: 'test' });
    const r = await reviseMessage(w.task(), { prisma: w.c, now: NOW }, w.deps);
    expect(r).toMatchObject({ ok: false, reason: 'could_not_satisfy' });
    if (r.ok) return;
    expect(r.detail).toMatch(/C0\d|C1\d/);
    expect(await loadProposedCopyRevisions(w.c, { decisionId: 'dec-1', stepIndex: 0 })).toHaveLength(0);
    expect(w.send).not.toHaveBeenCalled();
  });

  it('a fact the thesis does not carry, garbage from the model, and an item that is not a first touch are each refused by name', async () => {
    const w = await world();
    w.generate.mockResolvedValue({ text: JSON.stringify({ subject: 'Tulsa', body: 'Karen, PepsiCo closed its Denver yard [[SRC:other]].\n\nMy guess is the gate feels it first. Is the gate where the wait starts?' }), provider: 'test' });
    expect(await reviseMessage(w.task(), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'could_not_satisfy' });
    w.generate.mockResolvedValue({ text: 'Sure! Here is a draft:\nTulsa...', provider: 'test' });
    expect(await reviseMessage(w.task(), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'could_not_satisfy', detail: expect.stringMatching(/not a usable draft/i) });
    expect(await reviseMessage(w.task({ itemKey: 'commitment:c-1' }), { prisma: w.c, now: NOW }, w.deps)).toMatchObject({ ok: false, reason: 'not_a_first_touch' });
    expect(w.send).not.toHaveBeenCalled();
  });

  it('through the drain: the handler records a success on the task with the revision', async () => {
    const w = await world();
    const q = await queueAgentTask(w.c, { kind: 'revise_message', itemKey: w.plan.items[0].key, itemToken: w.plan.items[0].token, day: '2026-10-08', revision: 0, request: 'make it about the gate', requestedBy: SELLER, requestedFrom: 'gmail:cmd-1' }, { now: NOW, actor: 'cron' });
    const report = await runAgentTasks(w.c, { now: new Date(NOW.getTime() + 1000), max: 3, claimer: 'inst', handlers: { revise_message: (t, ctx) => reviseMessage(t, ctx, w.deps) } });
    expect(report).toMatchObject({ claimed: 1, succeeded: 1 });
    expect((await loadAgentTask(w.c, q.id))).toMatchObject({ status: 'succeeded', result: { compileVerdict: 'pass', emailed: true } });
  });
});

describe('X09: the REVISE command queues one task', () => {
  it('queues the critique on the item (superseding a queued one) and answers the seller; the next drain runs it', async () => {
    const w = await world();
    const m = { id: 'cmd-9', threadId: 'th-item-0', rfcMessageId: '<c@m>', fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP 1 of 1', snippet: '', bodyText: 'REVISE: shorter', rawText: '', bodyHtml: '', deliveryStatus: null, labelIds: [], receivedAt: NOW, headers: {} };
    const input = { m, ctx: { senders: [SELLER], assignmentsByThread: new Map(), assignmentsByMessageId: new Map(), briefingsByThread: new Map() }, now: NOW, settings: w.settings, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron', item: w.plan.items[0], ref: { itemKey: w.plan.items[0].key, itemToken: w.plan.items[0].token, revision: 0, contentHash: 'h', day: '2026-10-08' }, critique: 'shorter' };
    const first = await reviseRequest(w.c, input);
    expect(first).toMatchObject({ effect: 'revision_queued' });
    expect(first.text).toMatch(/working on it/i);
    const second = await reviseRequest(w.c, { ...input, critique: 'shorter, and name Tulsa', now: new Date(NOW.getTime() + 5000) });
    const tasks = w.db.store.gapAuditEvent.filter((e) => e.subject_type === 'agent_task' && e.kind === 'agent.task_queued');
    expect(tasks).toHaveLength(2);
    expect((await loadAgentTask(w.c, String(first.extra?.taskId)))?.status).toBe('superseded');
    expect((await loadAgentTask(w.c, String(second.extra?.taskId)))?.status).toBe('queued');
  });
});
