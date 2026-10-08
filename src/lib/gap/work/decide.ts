/**
 * DECIDE (I02, GAP OS prospecting first, 2026-10-08). Server only.
 *
 * Casey's decision on an intelligence item (work/intel.ts): pursue, explore, save, skip, dismiss, more. The decision is
 * his; GAP records it, and only Pursue and More spend anything (an agent task to develop the angle, and the existing
 * evidence research when the item has a source and an account). Nothing here contacts anyone: a pursued item becomes
 * prepared material the seller still approves and sends through the existing controls.
 *
 *   signal    the decision rides on the signal's own feedback field (use, good_context, skip, ignored) through the one
 *             signal op service; Pursue and More also queue research when the signal has a link and an account
 *   trigger   a live Pounce trigger: one append-only `prospect.decision` row; Pursue and More capture it as a signal
 *             first (so research can run once an account resolves) and develop the angle
 *   person    someone who wrote in: one `prospect.decision` row; Pursue and More develop the angle for that person
 *
 * A skip hides the item for SKIP_DAYS (work/intel.ts); a dismiss hides it until Casey changes his mind on the
 * Signals page; explore records the look and changes nothing else.
 */
import { applySignalOp } from '../signals/ops';
import { captureSignal } from '../signals/intake';
import { queueAgentTask } from '../agents/tasks';
import { nyDay } from './dates';
import { DECISIONS, PROSPECT_DECISION, type Decision } from './intel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type DecisionKey = { kind: 'signal'; id: string } | { kind: 'trigger'; id: number } | { kind: 'person'; email: string };

export function parseDecisionKey(key: string): DecisionKey | null {
  const m = /^(signal|trigger|person):(.+)$/.exec(key.trim());
  if (!m) return null;
  if (m[1] === 'signal') return { kind: 'signal', id: m[2] };
  if (m[1] === 'trigger') return /^\d+$/.test(m[2]) ? { kind: 'trigger', id: Number(m[2]) } : null;
  const email = m[2].trim().toLowerCase();
  return email.includes('@') ? { kind: 'person', email } : null;
}

export const isDecision = (v: unknown): v is Decision => typeof v === 'string' && (DECISIONS as readonly string[]).includes(v);

export interface DecideInput {
  key: string;
  decision: Decision;
  note?: string | null;
  actor: string;
  now: Date;
  /** Where the decision came from (`app`, `gmail:link`). */
  via?: string;
}

export type DecideResult =
  | { ok: true; key: string; decision: Decision; effects: string[]; angleTaskId: string | null; accountName: string | null; href: string }
  | { ok: false; reason: 'bad_key' | 'bad_decision' | 'not_found' | string };

export interface DecideDeps {
  /** The signal capture (tests inject one; production captures through signals/intake.ts). */
  capture?: typeof captureSignal;
  queueAngle?: (prisma: PrismaLike, input: { key: string; decision: Decision; note: string | null; actor: string; now: Date; via: string; input: Record<string, unknown> }) => Promise<{ id: string }>;
}

const SPENDS = new Set<Decision>(['pursue', 'more']);

async function queueAngle(prisma: PrismaLike, input: { key: string; decision: Decision; note: string | null; actor: string; now: Date; via: string; input: Record<string, unknown> }): Promise<{ id: string }> {
  const q = await queueAgentTask(prisma, { kind: 'develop_angle', itemKey: input.key, itemToken: '', day: nyDay(input.now), revision: 0, request: input.note ?? input.decision, requestedBy: input.actor, requestedFrom: input.via, input: { decision: input.decision, ...input.input } }, { now: input.now, actor: input.actor });
  return { id: q.id };
}

async function recordDecision(prisma: PrismaLike, key: string, input: DecideInput, payload: Record<string, unknown>): Promise<void> {
  await prisma.gapAuditEvent.create({ data: { kind: PROSPECT_DECISION, actor: input.actor, subject_type: 'prospect', subject_id: key, payload: { decision: input.decision, note: input.note ?? null, via: input.via ?? 'app', at: input.now.toISOString(), ...payload } } });
}

export async function applyDecision(prisma: PrismaLike, input: DecideInput, deps: DecideDeps = {}): Promise<DecideResult> {
  const parsed = parseDecisionKey(input.key);
  if (!parsed) return { ok: false, reason: 'bad_key' };
  if (!isDecision(input.decision)) return { ok: false, reason: 'bad_decision' };
  const key = parsed.kind === 'person' ? `person:${parsed.email}` : parsed.kind === 'trigger' ? `trigger:${parsed.id}` : `signal:${parsed.id}`;
  const via = input.via ?? 'app';
  const effects: string[] = [];
  const angle = deps.queueAngle ?? queueAngle;
  let angleTaskId: string | null = null;
  let accountName: string | null = null;
  let href = '/gap/signals/';

  if (parsed.kind === 'signal') {
    const s = await prisma.gapSignal.findUnique({ where: { id: parsed.id } });
    if (!s) return { ok: false, reason: 'not_found' };
    accountName = s.account_name ?? null;
    href = accountName ? `/gap/accounts/${encodeURIComponent(accountName.toLowerCase().replace(/\s+/g, '-'))}/` : '/gap/signals/';
    const op = async (o: Record<string, unknown>, effect: string) => {
      const r = await applySignalOp(prisma, { id: parsed.id, actor: input.actor, now: input.now, ...o } as Parameters<typeof applySignalOp>[1]);
      if (r.ok) effects.push(effect);
      else effects.push(`${effect}_refused:${r.reason}`);
      return r.ok;
    };
    if (input.decision === 'pursue') await op({ op: 'feedback', value: 'use' }, 'marked_use');
    else if (input.decision === 'save') await op({ op: 'feedback', value: 'good_context' }, 'saved_as_context');
    else if (input.decision === 'skip') await op({ op: 'feedback', value: 'skip' }, 'skipped_30_days');
    else if (input.decision === 'dismiss') await op({ op: 'ignore' }, 'dismissed');
    else if (input.decision === 'explore') effects.push('explored');
    if (SPENDS.has(input.decision)) {
      if (s.url && s.account_name && s.resolution === 'resolved' && (s.research_status === 'none' || s.research_status === 'no_usable_fact' || s.research_status === 'research_failed')) await op({ op: 'research' }, 'research_queued');
      // After a research op the feedback is cleared by the op service; a pursue keeps its mark.
      if (input.decision === 'pursue' && effects.includes('research_queued')) await op({ op: 'feedback', value: 'use' }, 'marked_use');
      angleTaskId = (await angle(prisma, { key, decision: input.decision, note: input.note ?? null, actor: input.actor, now: input.now, via, input: { title: s.title ?? null, url: s.url ?? null, accountName: s.account_name ?? null, accountHint: s.account_hint ?? null, publishedAt: s.published_at ? new Date(s.published_at).toISOString() : null, relevance: s.relevance ?? null, categories: Array.isArray(s.categories) ? s.categories : [], note: s.note ?? null } })).id;
      effects.push('angle_queued');
    }
    await recordDecision(prisma, key, input, { accountName, effects });
    return { ok: true, key, decision: input.decision, effects, angleTaskId, accountName, href };
  }

  if (parsed.kind === 'trigger') {
    const t = typeof prisma.pounceTrigger?.findUnique === 'function' ? await prisma.pounceTrigger.findUnique({ where: { id: parsed.id } }) : null;
    if (!t) return { ok: false, reason: 'not_found' };
    const known = typeof prisma.account?.findFirst === 'function' ? await prisma.account.findFirst({ where: { name: { equals: t.account_name, mode: 'insensitive' } }, select: { name: true } }).catch(() => null) : null;
    accountName = known?.name ?? null;
    href = accountName ? `/gap/accounts/${encodeURIComponent(accountName.toLowerCase().replace(/\s+/g, '-'))}/` : '/gap/signals/';
    let signalId: string | null = null;
    if (SPENDS.has(input.decision)) {
      // The trigger becomes a signal GAP can research and remember; an unknown company stays a hint until Casey names it.
      const c = await (deps.capture ?? captureSignal)(prisma, { url: t.url, title: t.title, publishedAt: t.published_at ? new Date(t.published_at) : null, sourceName: t.source, origin: 'pounce_scan', actor: input.actor, now: input.now, accountName: accountName ?? undefined, accountHint: accountName ? null : t.account_name, resolutionBasis: accountName ? 'trigger_account' : null }, { fetchHtml: null }).catch(() => null);
      if (c?.ok) {
        signalId = c.signal.id;
        effects.push(c.signal.created ? 'captured_as_signal' : 'signal_existed');
        const r = await applySignalOp(prisma, { id: signalId, actor: input.actor, now: input.now, op: 'feedback', value: 'use' } as Parameters<typeof applySignalOp>[1]).catch(() => null);
        if (r?.ok) effects.push('marked_use');
        if (accountName) {
          const rr = await applySignalOp(prisma, { id: signalId, actor: input.actor, now: input.now, op: 'research' } as Parameters<typeof applySignalOp>[1]).catch(() => null);
          if (rr?.ok) effects.push('research_queued');
        }
      }
      angleTaskId = (await angle(prisma, { key, decision: input.decision, note: input.note ?? null, actor: input.actor, now: input.now, via, input: { title: t.title, url: t.url, accountName, accountHint: accountName ? null : t.account_name, publishedAt: t.published_at ? new Date(t.published_at).toISOString() : null, source: t.source, categories: Array.isArray(t.categories) ? t.categories : [], signalId } })).id;
      effects.push('angle_queued');
    } else {
      effects.push(input.decision === 'skip' ? 'skipped_30_days' : input.decision === 'dismiss' ? 'dismissed' : input.decision === 'save' ? 'saved' : 'explored');
    }
    await recordDecision(prisma, key, input, { accountName, accountHint: accountName ? null : t.account_name, title: t.title, url: t.url, signalId, effects });
    return { ok: true, key, decision: input.decision, effects, angleTaskId, accountName, href };
  }

  // person
  const persona = typeof prisma.persona?.findFirst === 'function' ? await prisma.persona.findFirst({ where: { email: { equals: parsed.email, mode: 'insensitive' } }, select: { id: true, name: true, title: true, account_name: true } }).catch(() => null) : null;
  accountName = persona?.account_name ?? null;
  href = accountName ? `/gap/accounts/${encodeURIComponent(accountName.toLowerCase().replace(/\s+/g, '-'))}/` : '/gap/replies/';
  if (SPENDS.has(input.decision)) {
    angleTaskId = (await angle(prisma, { key, decision: input.decision, note: input.note ?? null, actor: input.actor, now: input.now, via, input: { email: parsed.email, personaId: persona?.id ?? null, name: persona?.name ?? null, title: persona?.title ?? null, accountName } })).id;
    effects.push('angle_queued');
  } else {
    effects.push(input.decision === 'skip' ? 'skipped_30_days' : input.decision === 'dismiss' ? 'dismissed' : input.decision === 'save' ? 'saved' : 'explored');
  }
  await recordDecision(prisma, key, input, { accountName, personaId: persona?.id ?? null, effects });
  return { ok: true, key, decision: input.decision, effects, angleTaskId, accountName, href };
}

/** The seller line for a decision just taken. */
export function decisionLine(r: Extract<DecideResult, { ok: true }>): string {
  const what = r.key.startsWith('person:') ? 'the person' : r.key.startsWith('trigger:') ? 'the trigger' : 'the signal';
  switch (r.decision) {
    case 'pursue':
      return `Pursuing ${what}. GAP is developing the angle${r.effects.includes('research_queued') ? ' and checking the source' : ''}; it comes back on the item and in the next briefing. Nothing is sent until you approve it.`;
    case 'more':
      return `GAP is finding out more about ${what}${r.effects.includes('research_queued') ? ' (the source is being checked)' : ''}; it comes back on the item.`;
    case 'save':
      return `Saved ${what} as context. It stays on the account; it leaves the day.`;
    case 'skip':
      return `Skipped ${what} for 30 days.`;
    case 'dismiss':
      return `Dismissed ${what}. It stays on the Signals page if you change your mind.`;
    default:
      return `Opened ${what}.`;
  }
}
