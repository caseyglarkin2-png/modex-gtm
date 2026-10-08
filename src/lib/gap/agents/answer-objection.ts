/**
 * ANSWER_OBJECTION (X16d, GAP OS sales execution engine, 2026-10-08). Server only. The objections task.
 *
 * A confirmed disposition that carries an objection (the existing-solution classes: they run a YMS, a 3PL runs the
 * yards; or a captured objection BID) queues this task from the disposition service. The agent prepares ONE talking
 * point for the seller: what to say back, in the seller's voice, from the objection, the buyer's own words and the
 * thesis's verified facts (nothing else: the model is never handed a fact the thesis does not carry), ending in one
 * question that keeps the conversation on their operation. It is a talking point the seller says in their own words
 * on the next call, never an email and never sent: so it is not compiled as copy, but it is checked the same way the
 * copy rules read (only cited facts, no product name, no money, no em dash, yards plural, bounded length). A talking
 * point that breaks a rule ends the task `could_not_satisfy`, final: no retry spends another call and no fact is
 * invented. The call brief shows the cleared talking point under the objection (replies/brief.ts, X16c timeline's
 * sibling), read from the task's own result: no second record.
 */
import { generateTextWithMetadata } from '@/lib/ai/client';
import { HEDGE_TOKENS } from '../taxonomy';
import { nyDay } from '../work/dates';
import { listAgentTasks, queueAgentTask, type ClaimedTask, type HandlerResult } from './tasks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface AnswerObjectionDeps {
  generate?: (prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>;
}

export const OBJECTION_KEY = /^objection:(.+)$/;
const MAX_TOKENS = 500;
const MIN_WORDS = 35;
const MAX_WORDS = 140;

export interface ObjectionAnswer {
  answer: string;
  question: string;
}

export interface PreparedObjectionAnswer {
  taskId: string;
  dispositionId: string;
  objection: string;
  answer: string;
  question: string;
  factsUsed: string[];
  preparedAt: string;
}

/** The model's answer must be one JSON object with an answer and a question. */
export function parseObjectionAnswer(text: string): ObjectionAnswer | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const o = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const answer = typeof o.answer === 'string' ? o.answer.trim() : '';
    const question = typeof o.question === 'string' ? o.question.trim() : '';
    if (!answer || !question) return null;
    return { answer, question };
  } catch {
    return null;
  }
}

export type ObjectionCheck = { ok: true; factsUsed: string[] } | { ok: false; reason: 'unknown_fact' | 'product_named' | 'money_promised' | 'em_dash' | 'yard_singular' | 'length'; detail?: string };

/** The copy rules a talking point must still keep (it is said out loud, so it carries the same truth bar). */
export function validateObjectionAnswer(a: ObjectionAnswer, factIds: ReadonlySet<string>): ObjectionCheck {
  const text = `${a.answer} ${a.question}`;
  const cited = [...new Set([...text.matchAll(/\[\[SRC:([A-Za-z0-9_-]+)\]\]/g)].map((m) => m[1]))];
  const unknown = cited.filter((id) => !factIds.has(id));
  if (unknown.length) return { ok: false, reason: 'unknown_fact', detail: unknown.join(', ') };
  if (/\b(yardflow|freightroll)\b/i.test(text)) return { ok: false, reason: 'product_named' };
  if (/\$\s?\d|\b\d+(\.\d+)?\s?%|\b(dollars|roi|savings)\b/i.test(text)) return { ok: false, reason: 'money_promised' };
  if (/—/.test(text)) return { ok: false, reason: 'em_dash' };
  if (/\byard\b/i.test(text)) return { ok: false, reason: 'yard_singular' };
  const words = a.answer.replace(/\[\[SRC:[A-Za-z0-9_-]+\]\]/g, '').trim().split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS || words > MAX_WORDS) return { ok: false, reason: 'length', detail: `${words} words` };
  return { ok: true, factsUsed: cited };
}

type FactRow = { id: string; title?: string | null; evidence_text?: string | null; observed_at?: Date | string | null; evidence_url?: string | null };

function factLine(s: FactRow): string {
  const when = s.observed_at ? new Date(s.observed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'undated';
  return `- id ${s.id}: ${s.title ?? ''}${s.evidence_text ? `. Quote: "${s.evidence_text}"` : ''} (${when}${s.evidence_url ? `, ${s.evidence_url}` : ''})`;
}

export function buildObjectionPrompt(input: { objection: string; buyerLanguage: string | null; responseClass: string; firstName: string; account: string; title: string | null; facts: string[]; observation: string; problemHypothesis: string; whatANoMeans: string | null }): string {
  return [
    'You prepare ONE talking point for a YardFlow seller to say out loud on their next call with a buyer who raised an objection. Answer with one JSON object only: {"answer": "...", "question": "..."}. No prose around it.',
    '',
    `The objection, as recorded (${input.responseClass.replace(/_/g, ' ')}): ${input.objection}`,
    input.buyerLanguage ? `The buyer's own words: "${input.buyerLanguage}"` : '',
    '',
    `The buyer: ${input.firstName}${input.title ? `, ${input.title}` : ''} at ${input.account}.`,
    '',
    'The only facts you may state about the account (cite each fact you use by putting its marker [[SRC:<id>]] at the end of the sentence that uses it):',
    ...input.facts,
    '',
    `What we think is happening (a hypothesis, never stated as fact): ${input.problemHypothesis || input.observation}`,
    input.whatANoMeans ? `What it would mean if they are right and we are wrong: ${input.whatANoMeans}` : '',
    '',
    'Hard rules (a checker rejects the talking point otherwise):',
    '- Start by granting the objection honestly in a few words. Never argue with it and never say they are wrong.',
    `- Then reframe with one cited fact or one hedged guess (hedges: ${HEDGE_TOKENS.slice(0, 8).join(', ')}) about where their current answer may still leave a gap. Never a fact that is not in the list above.`,
    `- ${MIN_WORDS} to ${MAX_WORDS} words in the answer, plain spoken sentences, no bullet points, no greeting.`,
    '- The question (separate field) is one open question about their operation that the objection does not already answer. No meeting request.',
    '- Never name a product, YardFlow, FreightRoll or "we help". Never promise savings, money, percentages or ROI. Never mention other customers by name.',
    '- No em dashes. Say "yards" never "yard" alone.',
  ].filter((l) => l !== '').join('\n');
}

export async function answerObjection(task: ClaimedTask, ctx: { prisma: PrismaLike; now: Date }, deps: AnswerObjectionDeps = {}): Promise<HandlerResult> {
  const { prisma } = ctx;
  const m = OBJECTION_KEY.exec(task.itemKey);
  if (!m) return { ok: false, reason: 'not_an_objection', detail: task.itemKey };
  const dispositionId = m[1];
  const d = await prisma.conversationDisposition.findUnique({ where: { id: dispositionId }, select: { id: true, account_name: true, persona_id: true, contact_email: true, response_class: true, objection: true, buyer_language: true, hypothesis_id: true, human_confirmed: true } }).catch(() => null);
  if (!d) return { ok: false, reason: 'disposition_not_found', detail: dispositionId };
  if (d.human_confirmed !== true) return { ok: false, reason: 'not_confirmed', detail: dispositionId };
  const objection = String(d.objection ?? task.request ?? '').trim();
  if (!objection) return { ok: false, reason: 'no_objection', detail: dispositionId };

  const persona: { name: string | null; title: string | null } | null = typeof d.persona_id === 'number' ? await prisma.persona.findUnique({ where: { id: d.persona_id }, select: { name: true, title: true } }).catch(() => null) : null;
  const firstName = String(persona?.name ?? '').trim().split(/\s+/)[0] || 'there';
  const select = { id: true, account_name: true, status: true, observation: true, problem_hypothesis: true, what_a_no_means: true, signals: true };
  const hypothesis = (d.hypothesis_id ? await prisma.prospectingHypothesis.findUnique({ where: { id: d.hypothesis_id }, select }).catch(() => null) : null)
    ?? (await prisma.prospectingHypothesis.findFirst({ where: { account_name: d.account_name, status: 'active' }, orderBy: { created_at: 'desc' }, select }).catch(() => null));
  const signals: FactRow[] = (Array.isArray(hypothesis?.signals) ? hypothesis.signals.map((l: { signal?: FactRow }) => l.signal).filter(Boolean) : []) as FactRow[];
  const factIds = new Set(signals.map((s) => s.id));

  const prompt = buildObjectionPrompt({
    objection,
    buyerLanguage: typeof d.buyer_language === 'string' && d.buyer_language.trim() ? d.buyer_language.trim() : null,
    responseClass: String(d.response_class ?? ''),
    firstName,
    account: String(d.account_name ?? ''),
    title: persona?.title ?? null,
    facts: signals.map(factLine),
    observation: String(hypothesis?.observation ?? '').replace(/\s*\[S:[A-Za-z0-9_-]+\]/g, ''),
    problemHypothesis: String(hypothesis?.problem_hypothesis ?? ''),
    whatANoMeans: typeof hypothesis?.what_a_no_means === 'string' && hypothesis.what_a_no_means.trim() ? hypothesis.what_a_no_means.trim() : null,
  });
  const out = await (deps.generate ?? generateTextWithMetadata)(prompt, MAX_TOKENS);
  const candidate = parseObjectionAnswer(out.text);
  if (!candidate) return { ok: false, reason: 'could_not_satisfy', detail: 'the model returned something that is not a usable talking point' };
  const check = validateObjectionAnswer(candidate, factIds);
  if (!check.ok) return { ok: false, reason: 'could_not_satisfy', detail: `${check.reason}${check.detail ? ` ${check.detail}` : ''}` };
  return {
    ok: true,
    result: { dispositionId, accountName: d.account_name, personaId: typeof d.persona_id === 'number' ? d.persona_id : null, hypothesisId: hypothesis?.id ?? null, objection, answer: candidate.answer, question: candidate.question, factsUsed: check.factsUsed, provider: out.provider },
  };
}

/** The disposition service's effect: queue one task per disposition (superseding a queued one on the same disposition). */
export async function queueObjectionTask(
  prisma: PrismaLike,
  input: { dispositionId: string; accountName: string; personaId: number | null; contactEmail: string; hypothesisId: string | null; objection: string; buyerLanguage: string | null; actor: string; now: Date },
): Promise<{ id: string; superseded: string[] }> {
  return queueAgentTask(
    prisma,
    { kind: 'answer_objection', itemKey: `objection:${input.dispositionId}`, itemToken: '', day: nyDay(input.now), revision: 0, request: input.objection, requestedBy: input.actor, requestedFrom: 'app:disposition', input: { dispositionId: input.dispositionId, accountName: input.accountName, personaId: input.personaId, contactEmail: input.contactEmail, hypothesisId: input.hypothesisId, buyerLanguage: input.buyerLanguage } },
    { now: input.now, actor: input.actor },
  );
}

/** The cleared talking points for a person (the succeeded tasks' results), newest first, bounded. Soft. */
export async function loadObjectionAnswers(prisma: PrismaLike, opts: { personaId: number; now: Date; take?: number }): Promise<PreparedObjectionAnswer[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const tasks = await listAgentTasks(prisma, { now: opts.now, status: 'succeeded' }).catch(() => []);
  return tasks
    .filter((t) => t.kind === 'answer_objection' && t.result && Number(t.result.personaId) === opts.personaId && typeof t.result.answer === 'string')
    .sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime())
    .slice(0, opts.take ?? 3)
    .map((t) => ({
      taskId: t.id,
      dispositionId: String(t.result!.dispositionId ?? ''),
      objection: String(t.result!.objection ?? t.request),
      answer: String(t.result!.answer),
      question: String(t.result!.question ?? ''),
      factsUsed: Array.isArray(t.result!.factsUsed) ? (t.result!.factsUsed as unknown[]).map(String) : [],
      preparedAt: t.queuedAt,
    }));
}
