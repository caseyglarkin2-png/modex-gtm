/**
 * PROMOTE AN ACCEPTED ANGLE INTO THE EXISTING DRAFT WORKFLOW (C24 of the commercial-context audit, 2026-10-08).
 * Server only. The bridge from a prepared angle (develop_angle's result: agents/develop-angle.ts, with its claim
 * references and its context revision) to the draft preparation GAP already has; no second draft store, no
 * second orchestration, nothing sent.
 *
 * The seller accepts an angle for ONE person and ONE action; the lane is decided by what is on record:
 *
 *   reply    the person wrote in (the Pursue carried their message id): the proposed text is a REPLY in their
 *            thread, composed from the angle's starters and editable by the seller, created as a Gmail DRAFT through
 *            execution/seller-reply.ts createSellerReplyDraft (every click-time gate: opt-out, do-not-contact, a newer
 *            message, already answered by hand, a draft already outstanding, placeholders, em dashes). Prepared and
 *            sent stay two ledger facts (REPLY_DRAFTED, REPLY_SENT); the send is only ever CONFIRM + SEND in the app.
 *   thesis   nobody wrote in but the item has a verified public fact (a signal or a captured trigger): the angle
 *            becomes a proposal through story/draft-from-fact.ts draftThesisFromFact (the outreach evidence gate, one
 *            draft per fact and person, submitted for review), and the existing approval, routing, compile and
 *            Gmail-draft path takes it from there. Nothing here approves or routes.
 *   call     the accepted action is a call: nothing is drafted; the destination is the person's call brief.
 *   research the accepted action is research, or the item has no message and no verified fact: nothing is drafted;
 *            said in words.
 *
 * Every promotion is one append-only ledger row (`angle.promoted` on the item) carrying the task id, the context
 * revision the angle was prepared against, the claim references (source ids and dates) and the destination (the
 * draft id, the hypothesis id or the href), so the draft links back to its sources and its revision. Pinned by
 * tests/unit/gap/stream-b-promote-angle.test.ts.
 */
import { loadAgentTask } from './tasks';
import type { PreparedAngle } from './develop-angle';
import { createSellerReplyDraft, type SellerReplyDeps } from '../execution/seller-reply';
import { draftThesisFromFact, type DraftFromFactResult } from '../story/draft-from-fact';
import { citedQuote, reportedFor } from '../research/propose';
import { GATE_SIGNAL_SELECT } from '../research/evidence-gate';
import { isPersona, type Persona } from '../taxonomy';
import { accountHref } from '../account-intel/href';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const ANGLE_PROMOTED = 'angle.promoted' as const;
export const PROMOTED_SUBJECT_TYPE = 'prospect' as const;

export type PromoteLane = 'reply' | 'thesis' | 'call' | 'research';

export interface PromoteAngleInput {
  taskId: string;
  actor: string;
  now: Date;
  /** The person the seller chose (a persona id from the angle's peopleNamed, or the person item's own address). */
  personaId?: number | null;
  /** The accepted action; the angle's own proposedAction when absent. */
  action?: 'email' | 'call' | 'research';
  /** The seller's edited text for the reply lane; the composed text when absent. */
  body?: string | null;
  /** The thesis lane's family when the seller chose one. */
  problemFamily?: string | null;
}

export interface PromoteAngleDeps {
  reply?: SellerReplyDeps;
  /** The thesis proposal service (the real one by default; tests inject a stub since it reads prospectingSignal). */
  draftThesis?: typeof draftThesisFromFact;
}

export interface PromotionLinks {
  taskId: string;
  itemKey: string;
  contextRevision: string | null;
  /** The claims the angle rests on: source id, class and date, from the angle's support (C22). */
  sources: Array<{ sourceId: string; claimClass: string; at: string | null }>;
}

export type PromoteAngleResult =
  | { ok: true; lane: 'reply'; alreadyDrafted: boolean; gmailDraftId: string; contentHash: string; messageId: string; recipient: string; body: string; href: string; links: PromotionLinks; line: string }
  | { ok: true; lane: 'thesis'; hypothesisId: string; preparation: Extract<DraftFromFactResult, { ok: true }>['preparation']; existing: boolean; href: string; links: PromotionLinks; line: string }
  | { ok: true; lane: 'call' | 'research'; href: string | null; links: PromotionLinks; line: string }
  | { ok: false; reason: 'task_not_found' | 'not_an_angle' | 'angle_not_prepared' | 'person_not_offered' | 'no_person' | 'no_verified_fact' | string; detail?: string };

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const firstName = (name: string | null, email: string | null): string => (name ?? '').trim().split(/\s+/)[0] || (email ?? '').split('@')[0].split('.')[0].replace(/^./, (c) => c.toUpperCase()) || 'there';
const dayText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/**
 * The reply the seller edits: a greeting, one line that names their last message by its date (never its content:
 * the seller writes that), the angle's two starters as the questions, no sign-off (Gmail adds the signature). No em
 * dash, no product, no number: the angle was checked for those; the reply gates check again at the click.
 */
export function composeAngleReply(angle: Pick<PreparedAngle, 'starters'>, person: { name: string | null; email: string | null }, lastWroteAt: string | null): string {
  const hi = `Hi ${firstName(person.name, person.email)},`;
  const thanks = lastWroteAt ? `Thanks for your note on ${dayText(lastWroteAt)}.` : 'Thanks for your note.';
  const questions = angle.starters.slice(0, 2).map((s) => s.trim()).filter(Boolean).join(' ');
  return `${hi}\n\n${thanks}\n\nTwo questions before we talk again: ${questions}`;
}

/** The persona key for a thesis: the persona row's lane when it is one, else read off the title, else operations. */
export function personaKeyOf(p: { persona_lane?: string | null; title?: string | null } | null): Persona {
  if (p?.persona_lane && isPersona(p.persona_lane)) return p.persona_lane;
  const t = (p?.title ?? '').toLowerCase();
  if (/transport|fleet|logistics/.test(t)) return 'transportation';
  if (/supply chain|network/.test(t)) return 'supply_chain';
  if (/distribution|warehouse|dc\b/.test(t)) return 'distribution';
  if (/automation|innovation|technolog|digital/.test(t)) return 'automation';
  if (/security|loss prevention/.test(t)) return 'security';
  if (/finance|procurement|purchas/.test(t)) return 'finance_procurement';
  if (/chief|coo|ceo|president|svp|evp|vp/.test(t)) return 'executive_ops';
  return 'site_ops';
}

function linksOf(task: { id: string; itemKey: string }, angle: PreparedAngle): PromotionLinks {
  const sources = new Map<string, { sourceId: string; claimClass: string; at: string | null }>();
  for (const s of angle.support ?? []) for (const r of s.refs) if (!sources.has(r.sourceId)) sources.set(r.sourceId, { sourceId: r.sourceId, claimClass: r.claimClass, at: r.at });
  return { taskId: task.id, itemKey: task.itemKey, contextRevision: angle.contextRevision ?? null, sources: [...sources.values()] };
}

async function record(prisma: PrismaLike, itemKey: string, actor: string, now: Date, payload: Record<string, unknown>): Promise<void> {
  await prisma.gapAuditEvent.create({ data: { kind: ANGLE_PROMOTED, actor, subject_type: PROMOTED_SUBJECT_TYPE, subject_id: itemKey, payload: { ...payload, at: now.toISOString() } } });
}

export async function promoteAngle(prisma: PrismaLike, input: PromoteAngleInput, deps: PromoteAngleDeps = {}): Promise<PromoteAngleResult> {
  const task = await loadAgentTask(prisma, input.taskId);
  if (!task) return { ok: false, reason: 'task_not_found' };
  if (task.kind !== 'develop_angle') return { ok: false, reason: 'not_an_angle', detail: task.kind };
  if (task.status !== 'succeeded' || !task.result || typeof task.result.whyItMatters !== 'string') return { ok: false, reason: 'angle_not_prepared', detail: task.status === 'failed' ? task.lastError ?? 'failed' : task.status };
  const angle = task.result as unknown as PreparedAngle;
  const taskInput = (task.input ?? {}) as Record<string, unknown>;
  const links = linksOf(task, angle);
  const action = input.action ?? angle.proposedAction;
  const accountName = angle.accountName ?? str(taskInput.accountName);

  // The person: the chosen persona must be one the angle offered (never a stranger), else the person item's own address.
  const offered = angle.peopleNamed ?? [];
  const personItemEmail = task.itemKey.startsWith('person:') ? task.itemKey.slice(7).toLowerCase() : null;
  let persona: { id: number; name: string | null; email: string | null; title: string | null; persona_lane?: string | null } | null = null;
  if (input.personaId != null) {
    if (!offered.some((p) => p.personaId === input.personaId)) return { ok: false, reason: 'person_not_offered', detail: String(input.personaId) };
    persona = typeof prisma?.persona?.findUnique === 'function' ? await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, name: true, email: true, title: true, persona_lane: true } }).catch(() => null) : null;
    if (!persona) return { ok: false, reason: 'no_person', detail: `persona ${input.personaId} not found` };
  } else if (personItemEmail) {
    persona = typeof prisma?.persona?.findFirst === 'function' ? await prisma.persona.findFirst({ where: { email: { equals: personItemEmail, mode: 'insensitive' } }, select: { id: true, name: true, email: true, title: true, persona_lane: true } }).catch(() => null) : null;
  } else if (offered.length === 1 && typeof prisma?.persona?.findUnique === 'function') {
    persona = await prisma.persona.findUnique({ where: { id: offered[0].personaId }, select: { id: true, name: true, email: true, title: true, persona_lane: true } }).catch(() => null);
  }
  const personName = persona?.name ?? str(taskInput.name);
  const personEmail = persona?.email ?? personItemEmail;

  if (action === 'call') {
    const href = persona ? `/gap/call/${persona.id}` : accountName ? `${accountHref(accountName)}/` : null;
    await record(prisma, task.itemKey, input.actor, input.now, { taskId: task.id, lane: 'call', personaId: persona?.id ?? null, href, contextRevision: links.contextRevision, sources: links.sources });
    return { ok: true, lane: 'call', href, links, line: persona ? `Nothing drafted: the angle is a call. The call brief for ${personName ?? personEmail ?? 'them'} is ready.` : 'Nothing drafted: the angle is a call, and no person is on record to call yet.' };
  }
  if (action === 'research') {
    const href = accountName ? `${accountHref(accountName)}/` : null;
    await record(prisma, task.itemKey, input.actor, input.now, { taskId: task.id, lane: 'research', href, contextRevision: links.contextRevision, sources: links.sources });
    return { ok: true, lane: 'research', href, links, line: 'Nothing drafted: the angle asks for research first. Check the source or find the people on the account page.' };
  }

  // Email: a reply in their thread when they wrote in; else a thesis from the item's verified fact.
  const messageId = str(taskInput.inboundMessageId);
  if (messageId && personEmail && (!persona || !input.personaId || (persona.email ?? '').toLowerCase() === personEmail)) {
    const body = (input.body ?? composeAngleReply(angle, { name: personName, email: personEmail }, str(taskInput.lastWroteAt))).trim();
    const r = await createSellerReplyDraft(prisma, { messageId, body, actor: input.actor, now: input.now }, deps.reply);
    if (!r.ok) return { ok: false, reason: r.reason, detail: r.detail };
    const href = accountName ? `${accountHref(accountName)}/` : '/gap/replies/';
    await record(prisma, task.itemKey, input.actor, input.now, { taskId: task.id, lane: 'reply', messageId, gmailDraftId: r.drafted.gmailDraftId, contentHash: r.drafted.contentHash, alreadyDrafted: r.alreadyDrafted, recipient: personEmail, contextRevision: links.contextRevision, sources: links.sources });
    return { ok: true, lane: 'reply', alreadyDrafted: r.alreadyDrafted, gmailDraftId: r.drafted.gmailDraftId, contentHash: r.drafted.contentHash, messageId, recipient: personEmail, body, href, links, line: `${r.alreadyDrafted ? 'The Gmail draft of this reply already exists' : 'A Gmail draft of the reply is saved'} in ${personName ?? personEmail}'s thread. Edit or send it there, or CONFIRM + SEND from GAP; nothing was sent.` };
  }

  const signalId = str(taskInput.signalId) ?? (task.itemKey.startsWith('signal:') ? task.itemKey.slice(7) : null);
  if (!signalId || !accountName) return { ok: false, reason: 'no_verified_fact', detail: 'Nobody wrote in and the item carries no checked fact at a known account: research first.' };
  const fact = typeof prisma?.gapSignal?.findUnique === 'function' ? await prisma.gapSignal.findUnique({ where: { id: signalId }, select: { ...GATE_SIGNAL_SELECT, url: true } }).catch(() => null) : null;
  if (!fact?.evidence_text) return { ok: false, reason: 'no_verified_fact', detail: 'The item has no verified excerpt at its source yet: research first, then draft from the checked fact.' };
  const observation = citedQuote(fact.title ?? angle.title, fact.evidence_text, signalId, accountName, reportedFor(fact, input.now));
  const draft = deps.draftThesis ?? draftThesisFromFact;
  const t = await draft(prisma, { accountName, factId: signalId, personaId: persona?.id ?? null, persona: personaKeyOf(persona), observation, problemHypothesis: angle.whyItMatters, falsificationQuestions: angle.starters, whatANoMeans: angle.caveat, problemFamily: input.problemFamily ?? null, actor: input.actor, now: input.now });
  if (!t.ok) return { ok: false, reason: t.reason, detail: t.detail };
  const href = `/gap/preview/${encodeURIComponent(t.hypothesisId)}`;
  await record(prisma, task.itemKey, input.actor, input.now, { taskId: task.id, lane: 'thesis', hypothesisId: t.hypothesisId, preparation: t.preparation, existing: t.existing, factId: signalId, personaId: persona?.id ?? null, contextRevision: links.contextRevision, sources: links.sources });
  const words = t.preparation === 'submitted' ? 'is under review: approve it there and the routing prepares the email through the usual draft' : t.preparation === 'in_use' ? 'is already in use' : t.preparation === 'incomplete' ? `needs ${t.missing.join(', ')} before it can be reviewed` : `is a draft (${t.submitRefusal ?? 'not submitted'})`;
  return { ok: true, lane: 'thesis', hypothesisId: t.hypothesisId, preparation: t.preparation, existing: t.existing, href, links, line: `The angle ${t.existing ? 'joins the existing proposal, which' : 'is now a proposal that'} ${words}. Nothing was sent.` };
}

/** The promotions recorded for one item, newest first (the UI's "prepared" state beside the angle). */
export async function loadPromotions(prisma: PrismaLike, itemKey: string): Promise<Array<{ at: string; lane: PromoteLane; taskId: string; payload: Record<string, unknown> }>> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: Array<{ payload: Record<string, unknown> | null; created_at: Date | string }> = await prisma.gapAuditEvent.findMany({ where: { kind: ANGLE_PROMOTED, subject_type: PROMOTED_SUBJECT_TYPE, subject_id: itemKey }, orderBy: [{ created_at: 'desc' }], take: 20 }).catch(() => []);
  return rows.map((r) => ({ at: String((r.payload ?? {}).at ?? new Date(r.created_at).toISOString()), lane: ((r.payload ?? {}).lane as PromoteLane) ?? 'research', taskId: String((r.payload ?? {}).taskId ?? ''), payload: r.payload ?? {} }));
}
