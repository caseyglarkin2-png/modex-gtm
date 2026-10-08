/**
 * REVISE_MESSAGE (X09, GAP OS sales execution engine, 2026-10-08). Server only. The first agent task.
 *
 * The seller said what is wrong with a first touch ("too generic, find a specific operational reason for this person
 * to care"). The task takes that critique, the card's current copy and the thesis's own verified facts (nothing else:
 * the model is never handed a fact the thesis does not carry), asks the model for one candidate, and judges it with
 * the message compiler exactly as a template is judged (every check and the critic, compiler/compile.ts, against the
 * same contract the compile route builds: the evidence refs, the hypothesis, the step count). A candidate that fails
 * ends the task `could_not_satisfy` with the compiler's reasons, final: no retry spends another call and no fact is
 * invented. A cleared candidate is PROPOSED (execution/copy-revision.ts; the agent never approves) and the assignment
 * is re-sent in the same thread at the next revision with the proposed copy and the critique it answers; APPROVE on
 * that email (X11) approves this revision and drafts it. `reviseRequest` is the REVISE command's effect: queue one
 * task (superseding a queued one) and tell the seller.
 */
import { gapGenerate } from '../ai/spend';
import type { GmailSender, GmailSendPayload } from '@/lib/email/gmail-sender';
import { compile, type CompileResult } from '../compiler/compile';
import { evidenceRefsFromSignals, type SignalRow } from '../compiler/evidence-from-signals';
import type { CriticClient } from '../critic-client';
import { makeCriticClient } from '../critic-client';
import { gapGmailSender } from '../execution/gap-sender';
import { loadActionPack, type ActionPack } from '../execution/action-pack';
import { loadProposedCopyRevisions, proposeCopyRevision } from '../execution/copy-revision';
import type { postReviewLog } from '../review-feed';
import { HEDGE_TOKENS } from '../taxonomy';
import { loadAssignments, sendAssignment } from '../work/assignment';
import { loadDayPlan } from '../work/plan';
import { loadSellerSettings, type SellerSettings } from '../work/settings';
import type { ApplyInput } from '../replies/commands-apply';
import type { AssignmentRef } from '../replies/commands';
import type { PlanItem } from '../work/plan';
import { queueAgentTask, type ClaimedTask, type HandlerResult } from './tasks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface ReviseDeps {
  generate?: (prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>;
  critic?: CriticClient;
  postReview?: typeof postReviewLog;
  send?: (payload: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>;
  settings?: (prisma: PrismaLike) => Promise<SellerSettings>;
  sender?: () => GmailSender | null;
  baseUrl?: string;
  actionSecret?: string | null;
  pack?: (prisma: PrismaLike, args: { hypothesisId: string; decisionId: string; stepIndex: number }) => Promise<ActionPack | null>;
}

const FIRST_TOUCH_KEY = /^first_touch:(.+)$/;
const MAX_TOKENS = 700;

type Candidate = { subject: string; body: string };

/** The model's answer must be one JSON object with a subject and a body; anything else is not a usable draft. */
export function parseCandidate(text: string): Candidate | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const o = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const subject = typeof o.subject === 'string' ? o.subject.trim() : '';
    const body = typeof o.body === 'string' ? o.body.trim() : '';
    if (!subject || !body) return null;
    return { subject, body };
  } catch {
    return null;
  }
}

function factLine(s: SignalRow & { title?: string | null; evidence_text?: string | null; observed_at?: Date | string | null; evidence_url?: string | null }): string {
  const when = s.observed_at ? new Date(s.observed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'undated';
  return `- id ${s.id}: ${s.title ?? ''}${s.evidence_text ? `. Quote: "${s.evidence_text}"` : ''} (${when}${s.evidence_url ? `, ${s.evidence_url}` : ''})`;
}

export function buildRevisePrompt(input: { critique: string; firstName: string; account: string; current: Candidate; facts: string[]; observation: string; problemHypothesis: string }): string {
  return [
    'You revise ONE cold first-touch email for a YardFlow seller. Answer with one JSON object only: {"subject": "...", "body": "..."}. No prose around it.',
    '',
    `The seller's critique of the current email (follow it): ${input.critique}`,
    '',
    `Recipient first name: ${input.firstName}. Account: ${input.account}.`,
    `Current subject: ${input.current.subject}`,
    'Current body:',
    input.current.body,
    '',
    'The only facts you may state about the account (cite each fact you use by putting its marker [[SRC:<id>]] at the end of the sentence that uses it):',
    ...input.facts,
    '',
    `What we think is happening (a hypothesis, never stated as fact): ${input.problemHypothesis || input.observation}`,
    '',
    'Hard rules (an automatic checker rejects the draft otherwise):',
    '- 45 to 120 words in the body. Plain text, short paragraphs, no bullet points, no signature, no greeting line other than the first name.',
    '- Paragraph 1 states a cited fact with its [[SRC:<id>]] marker. Never state a fact that is not in the list above; never add numbers that are not in a cited fact.',
    `- The paragraph that says what we think is happening uses one of these hedges: ${HEDGE_TOKENS.slice(0, 8).join(', ')}. Every sentence that says something about them ("you", "your") carries a hedge or is a question.`,
    '- Exactly one question, at the end, about their operation. No meeting request, no calendar link.',
    '- Never name a product, YardFlow, FreightRoll or "we help". Never promise savings, money, percentages or ROI to them. Never mention other customers by name.',
    '- No em dashes. Say "yards" never "yard" alone. Do not start sentences with "I".',
    '- The subject is 2 to 7 plain words in sentence case: capitalize only the first word and real proper nouns, never Title Case, never Re: or Fwd:, no colon, no account name unless it is the proper noun. Like "Doors versus spots".',
  ].join('\n');
}

const compileReasons = (r: CompileResult): string => {
  const failed = r.checks.filter((c) => !c.passed).map((c) => `${c.code}${c.detail ? ` ${String(c.detail).slice(0, 120)}` : ''}`);
  const critic = r.critic.ok ? (r.critic.verdict !== 'pass' ? [`critic ${r.critic.verdict}: ${r.critic.findings.map((f) => f.message).slice(0, 2).join('; ')}`] : []) : [`critic ${r.critic.reason}`];
  return [...failed, ...critic].join(' | ') || r.verdict;
};

export async function reviseMessage(task: ClaimedTask, ctx: { prisma: PrismaLike; now: Date }, deps: ReviseDeps = {}): Promise<HandlerResult> {
  const { prisma, now } = ctx;
  const m = FIRST_TOUCH_KEY.exec(task.itemKey);
  if (!m) return { ok: false, reason: 'not_a_first_touch', detail: task.itemKey };
  const decisionId = m[1];
  const decision = await prisma.routingDecision.findUnique({ where: { id: decisionId }, select: { id: true, hypothesis_id: true, persona_id: true, account_name: true } });
  if (!decision?.hypothesis_id) return { ok: false, reason: 'decision_not_found', detail: decisionId };
  const stepIndex = 0;
  const pack = await (deps.pack ?? loadActionPack)(prisma, { hypothesisId: decision.hypothesis_id, decisionId, stepIndex });
  if (!pack || !pack.version || !pack.persona) return { ok: false, reason: 'pack_unavailable', detail: !pack ? 'no pack' : !pack.version ? 'no copy version for this approach' : 'no person on the card' };
  if (pack.hypothesis.status !== 'active') return { ok: false, reason: 'hypothesis_not_active', detail: String(pack.hypothesis.status) };

  // The base copy: the newest proposal (an iteration), else what the pack renders (the approved revision or the template).
  const proposed = await loadProposedCopyRevisions(prisma, { decisionId, stepIndex });
  const base: Candidate | null = proposed[0]?.queued ?? pack.rendered?.queued ?? null;
  if (!base) return { ok: false, reason: 'no_current_copy' };

  const signals: SignalRow[] = (Array.isArray(pack.hypothesis.signals) ? pack.hypothesis.signals.map((l: { signal?: SignalRow }) => l.signal).filter(Boolean) : []) as SignalRow[];
  const firstName = String(pack.persona.name ?? '').trim().split(/\s+/)[0] || 'there';
  const prompt = buildRevisePrompt({
    critique: task.request,
    firstName,
    account: pack.hypothesis.account_name,
    current: base,
    facts: signals.map((s) => factLine(s)),
    observation: String(pack.hypothesis.observation ?? '').replace(/\s*\[S:[A-Za-z0-9_-]+\]/g, ''),
    problemHypothesis: String(pack.hypothesis.problem_hypothesis ?? ''),
  });
  const answer = await (deps.generate ?? ((p: string, m?: number) => gapGenerate(ctx.prisma, { prompt: p, maxTokens: m ?? MAX_TOKENS, tier: 'routine', task: { id: task.id, kind: task.kind, itemKey: task.itemKey }, now: ctx.now })))(prompt, MAX_TOKENS);
  const candidate = parseCandidate(answer.text);
  if (!candidate) return { ok: false, reason: 'could_not_satisfy', detail: 'the model returned something that is not a usable draft' };

  const steps = pack.steps;
  const contract = {
    evidence: evidenceRefsFromSignals(signals, now),
    hypothesis: { observation: pack.hypothesis.observation ?? '', problemHypothesis: pack.hypothesis.problem_hypothesis ?? '', problemFamily: pack.hypothesis.problem_family ?? 'unmapped' },
    stepCount: steps.length || 1,
    claimsUsed: [] as string[],
  };
  const compiled = await compile(
    { hypothesisId: pack.hypothesis.id, sequenceVersionId: pack.version.id, stepIndex, subject: candidate.subject, body: candidate.body, priorBodies: [], contract, createdBy: `agent:revise_message:${task.id}` },
    { critic: deps.critic ?? makeCriticClient(), validateClaims: null, now: () => now, prisma, ...(deps.postReview ? { postReview: deps.postReview } : {}) },
  );
  if (compiled.verdict === 'reject') return { ok: false, reason: 'could_not_satisfy', detail: compileReasons(compiled) };

  const factsUsed = [...new Set([...candidate.body.matchAll(/\[\[SRC:([A-Za-z0-9_-]+)\]\]/g)].map((x) => x[1]))];
  const proposal = await proposeCopyRevision(
    prisma,
    { decisionId, hypothesisId: pack.hypothesis.id, versionId: pack.version.id, stepIndex, marked: candidate, compileId: compiled.id ?? null, compileVerdict: compiled.verdict, basis: { critique: task.request, facts: factsUsed }, proposedBy: `agent:revise_message:${task.id}`, taskId: task.id },
    now,
  );

  // Back to the seller in the same thread, at the next revision, with the proposed copy and the words it answers.
  const settings = await (deps.settings ?? loadSellerSettings)(prisma);
  const sender = (deps.sender ?? gapGmailSender)();
  const plan = await loadDayPlan(prisma, task.day);
  const item = plan?.items.find((i: PlanItem) => i.token === task.itemToken) ?? null;
  let emailed = false;
  let assignmentRevision: number | null = null;
  if (plan && item && settings.briefingTo && sender) {
    const latest = Math.max(0, ...(await loadAssignments(prisma, item.key)).map((a) => a.revision));
    assignmentRevision = latest + 1;
    const note = `Revised on your words: "${task.request.slice(0, 300)}".${compiled.verdict === 'review_required' ? ' GAP\'s checker wants a look before this one can be approved: open it in GAP.' : ' Reply APPROVE to create the Gmail draft with this copy, or REVISE again.'}`;
    const r = await sendAssignment(
      prisma,
      { plan, item, revision: assignmentRevision, to: settings.briefingTo, sender, baseUrl: deps.baseUrl ?? (process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') || 'https://modex-gtm.vercel.app'), actionSecret: deps.actionSecret ?? process.env.GAP_ACTION_SECRET?.trim() ?? null, commandsEnabled: true, now, actor: `agent:revise_message:${task.id}`, copyOverride: { subject: proposal.queued.subject, body: proposal.queued.body, to: pack.persona.email ?? null, contentHash: proposal.contentHash }, note },
      deps.send ? { send: deps.send } : {},
    );
    emailed = r.sent;
  }
  return { ok: true, result: { decisionId, revisionId: proposal.revisionId, contentHash: proposal.contentHash, compileId: compiled.id ?? null, compileVerdict: compiled.verdict, factsUsed, emailed, assignmentRevision, provider: answer.provider } };
}

/** The REVISE command's effect (commands-apply.ts deps.onRevise): queue one task and tell the seller. */
export async function reviseRequest(prisma: PrismaLike, input: ApplyInput & { item: PlanItem; ref: AssignmentRef; critique: string }): Promise<{ text: string; effect: string; ok: boolean; extra?: Record<string, unknown> }> {
  const critique = input.critique.trim();
  if (!critique) return { ok: false, text: 'Say what to change, for example REVISE: make it about the Tulsa gate, shorter. Nothing was queued.', effect: 'revision_not_queued' };
  if (!FIRST_TOUCH_KEY.test(input.item.key)) return { ok: false, text: 'GAP can revise a first-touch email. This item is not one; open it in GAP to work it there.', effect: 'revision_not_queued' };
  const q = await queueAgentTask(prisma, { kind: 'revise_message', itemKey: input.item.key, itemToken: input.item.token, day: input.ref.day, revision: input.ref.revision, request: critique, requestedBy: input.m.fromEmail.toLowerCase(), requestedFrom: `gmail:${input.m.id}` }, { now: input.now, actor: input.actor });
  return { ok: true, text: `Working on it. GAP will rewrite the email on your words ("${critique.slice(0, 200)}") against the verified facts on this account and send the revised item back in this thread, usually within a few minutes. If no fact supports what you asked, it will say so instead of inventing one.`, effect: 'revision_queued', extra: { taskId: q.id, superseded: q.superseded } };
}
