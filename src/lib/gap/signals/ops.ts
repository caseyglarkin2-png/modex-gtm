/**
 * SIGNAL OPS (GAP Signal Intelligence): the Signal Inbox's reads and Casey's
 * actions on a signal. Every action writes the GapSignal row only (and an
 * append-only audit row for provenance). Nothing here touches a hypothesis,
 * evidence, a BID, HubSpot, Slack, a draft or a send.
 *
 *   assign     Casey names the account (resolution 'resolved', basis 'human').
 *              A shared link then goes to research by default.
 *   research   queue it for evidence research (resolved + a URL required).
 *   ignore     Casey chose not to pursue it.
 *   feedback   USE / IRRELEVANT / WRONG ACCOUNT / ALREADY KNEW / GOOD CONTEXT /
 *              NOT SAYABLE. Labels improve prioritization later; they are never
 *              buyer truth and never a score. WRONG ACCOUNT un-resolves it.
 */
import { classifySignal, signalStatus, type SignalStatus } from './intake';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const SIGNAL_FEEDBACK = ['use', 'ignored', 'irrelevant', 'wrong_account', 'already_knew', 'good_context', 'not_sayable'] as const;
export type SignalFeedback = (typeof SIGNAL_FEEDBACK)[number];
export const SIGNAL_OP_AUDIT = 'signal.op' as const;

export interface SignalView {
  id: string;
  url: string | null;
  title: string | null;
  sourceName: string | null;
  sourceClass: string;
  publishedAt: string | null;
  capturedAt: string;
  origin: string;
  caseyShared: boolean;
  note: string | null;
  accountHint: string | null;
  accountName: string | null;
  candidates: Array<{ name: string; why: string }>;
  resolution: string;
  researchStatus: string;
  relevance: string;
  categories: string[];
  eventId: string | null;
  /** Other sources covering the same event. */
  alsoCoveredBy: number;
  feedback: string | null;
  status: SignalStatus;
  statusDetail: string;
  why: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const RELEVANCE_WHY: Record<string, string> = {
  outreach_evidence_candidate: 'It may describe a physical-network change GAP can verify at the source.',
  account_context: 'Worth knowing about the account; not something to quote.',
  leadership: 'A leadership change may change who matters.',
  deal_context: 'May bear on an existing opportunity.',
  risk: 'A risk or disruption: may change how, or whether, to approach.',
  research_lead: 'Not yet understood: research decides whether it matters.',
};

export function toView(r: Row, clusterSize = 1): SignalView {
  const st = signalStatus({ url: r.url ?? null, resolution: r.resolution, research_status: r.research_status, feedback: r.feedback ?? null, origin: r.origin, relevance: r.relevance });
  const cats: string[] = Array.isArray(r.categories) ? r.categories : [];
  return {
    id: r.id,
    url: r.url ?? null,
    title: r.title ?? null,
    sourceName: r.source_name ?? null,
    sourceClass: r.source_class ?? 'other',
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
    capturedAt: new Date(r.created_at).toISOString(),
    origin: r.origin,
    caseyShared: r.origin === 'casey_share' || r.origin === 'conference_note',
    note: r.note ?? null,
    accountHint: r.account_hint ?? null,
    accountName: r.account_name ?? null,
    candidates: Array.isArray(r.candidates) ? r.candidates : [],
    resolution: r.resolution,
    researchStatus: r.research_status,
    relevance: r.relevance,
    categories: cats,
    eventId: r.event_id ?? null,
    alsoCoveredBy: Math.max(0, clusterSize - 1),
    feedback: r.feedback ?? null,
    status: st.status,
    statusDetail: st.detail,
    why: `${RELEVANCE_WHY[r.relevance] ?? RELEVANCE_WHY.research_lead}${cats.length ? ` Themes: ${cats.map((c) => c.replace(/_/g, ' ')).join(', ')}.` : ''}`,
  };
}

/** Inbox order: Casey-shared first, then needs-you (account), contradictions, fresh resolved, the rest. One row per event. */
export function inboxRank(v: SignalView): number {
  if (v.status === 'Ignored') return 9;
  if (v.status === 'Needs you') return v.caseyShared ? 0 : 1;
  // A Casey share stays on top while GAP is still working on it; a settled one takes its normal place.
  if (v.caseyShared && (v.status === 'Captured' || v.status === 'Researching' || v.status === 'Fact ready')) return 0;
  if (v.relevance === 'outreach_evidence_candidate' || v.relevance === 'risk' || v.relevance === 'leadership') return 2;
  return 3;
}

export async function listSignals(prisma: PrismaLike, opts: { limit?: number; mine?: string | null; includeIgnored?: boolean } = {}): Promise<SignalView[]> {
  const visible = opts.includeIgnored ? {} : { OR: [{ feedback: null }, { feedback: { in: ['good_context', 'use'] } }], resolution: { not: 'rejected' } };
  const [recent, waiting]: [Row[], Row[]] = await Promise.all([
    prisma.gapSignal.findMany({ where: { ...visible, ...(opts.mine ? { submitted_by: opts.mine } : {}) }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: Math.min(opts.limit ?? 60, 300) * 3 }),
    // Final review P1: a share that still needs Casey never falls out of the inbox window, however old.
    prisma.gapSignal.findMany({ where: { ...visible, origin: { in: ['casey_share', 'conference_note'] }, resolution: { in: ['needs_account', 'ambiguous'] } }, orderBy: [{ created_at: 'desc' }], take: 100 }),
  ]);
  const rows: Row[] = [...new Map([...recent, ...waiting].map((r) => [r.id, r])).values()];
  // One row per event: the event's first source leads; the others are counted, never lost.
  const byEvent = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r.event_id ?? r.id;
    byEvent.set(k, [...(byEvent.get(k) ?? []), r]);
  }
  const views = [...byEvent.values()].map((group) => {
    const lead = group.find((g) => g.origin === 'casey_share') ?? group.find((g) => g.id === (g.event_id ?? g.id)) ?? group[0];
    return toView(lead, group.length);
  });
  return views.sort((a, b) => inboxRank(a) - inboxRank(b) || b.capturedAt.localeCompare(a.capturedAt)).slice(0, opts.limit ?? 60);
}

export async function loadSignal(prisma: PrismaLike, id: string): Promise<SignalView | null> {
  const r: Row | null = await prisma.gapSignal.findUnique({ where: { id } });
  if (!r) return null;
  const size = r.event_id ? await prisma.gapSignal.count({ where: { event_id: r.event_id } }) : 1;
  return toView(r, size);
}

export type SignalOp =
  | { op: 'assign'; accountName: string }
  | { op: 'research' }
  | { op: 'ignore' }
  | { op: 'feedback'; value: SignalFeedback };

export type SignalOpRefusal = 'not_found' | 'account_not_found' | 'needs_account' | 'no_link' | 'bad_feedback';

async function audit(prisma: PrismaLike, actor: string, id: string, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind: SIGNAL_OP_AUDIT, actor, subject_type: 'gap_signal', subject_id: id, payload: JSON.parse(JSON.stringify(payload)) } }).catch(() => undefined);
}

export async function applySignalOp(prisma: PrismaLike, input: { id: string; actor: string; now: Date } & SignalOp): Promise<{ ok: true; signal: SignalView } | { ok: false; reason: SignalOpRefusal }> {
  const r: Row | null = await prisma.gapSignal.findUnique({ where: { id: input.id } });
  if (!r) return { ok: false, reason: 'not_found' };
  let data: Row;
  switch (input.op) {
    case 'assign': {
      const acct: { name: string } | null = await prisma.account.findFirst({ where: { name: { equals: input.accountName.trim(), mode: 'insensitive' } }, select: { name: true } });
      if (!acct) return { ok: false, reason: 'account_not_found' };
      const cls = r.url ? classifySignal(r.title ?? '', acct.name) : null;
      const changed = r.account_name !== acct.name;
      // Final review P0: research, event and promotion state belong to the account they were done for. A new
      // account starts over: its own research, its own event (re-clustered), never the old account's verified fact.
      const reset = changed ? { research_run_id: null, event_id: r.id, metadata: { ...((r.metadata ?? {}) as Record<string, unknown>), clustered: false, research: null, promotedAt: null, reassignedFrom: r.account_name ?? null } } : {};
      const followUp = r.url && r.origin === 'casey_share' && (changed || r.research_status === 'none');
      data = {
        account_name: acct.name,
        resolution: 'resolved',
        resolution_basis: 'human',
        ...(cls ? { relevance: cls.relevance, categories: cls.categories, score: cls.score } : {}),
        ...reset,
        ...(changed ? { research_status: followUp ? 'queued' : 'none', promoted_trigger_id: null } : followUp ? { research_status: 'queued' } : {}),
        ...(r.feedback === 'wrong_account' ? { feedback: null, feedback_by: null, feedback_at: null } : {}),
      };
      break;
    }
    case 'research':
      if (!r.url) return { ok: false, reason: 'no_link' };
      if (r.resolution !== 'resolved' || !r.account_name) return { ok: false, reason: 'needs_account' };
      data = {
        research_status: r.research_status === 'none' || r.research_status === 'no_usable_fact' || r.research_status === 'research_failed' ? 'queued' : r.research_status,
        feedback: null,
        feedback_by: null,
        feedback_at: null,
        // Stabilization B: Casey asking GAP to check a source is a CHECK, nothing else. Marked so the promotion pass
        // never turns the result into a Pounce trigger, a Slack ping or HubSpot trigger heat.
        metadata: { ...((r.metadata ?? {}) as Record<string, unknown>), manualVerify: { at: input.now.toISOString(), by: input.actor } },
      };
      break;
    case 'ignore':
      data = { feedback: 'ignored', feedback_by: input.actor, feedback_at: input.now };
      break;
    case 'feedback':
      if (!(SIGNAL_FEEDBACK as readonly string[]).includes(input.value)) return { ok: false, reason: 'bad_feedback' };
      // WRONG ACCOUNT: the resolution was wrong. The signal goes BACK to Casey (Needs you, still in the
      // inbox) to name the right one; the label itself is kept in the audit row, not as a hiding feedback.
      data =
        input.value === 'wrong_account'
          ? { account_name: null, resolution: 'needs_account', resolution_basis: null, candidates: undefined, research_status: 'none', research_run_id: null, event_id: r.id, promoted_trigger_id: null, metadata: { ...((r.metadata ?? {}) as Record<string, unknown>), clustered: false, research: null, promotedAt: null, reassignedFrom: r.account_name ?? null }, feedback: null, feedback_by: null, feedback_at: null }
          : { feedback: input.value, feedback_by: input.actor, feedback_at: input.now };
      break;
  }
  await prisma.gapSignal.update({ where: { id: r.id }, data });
  await audit(prisma, input.actor, r.id, { op: input.op, ...(input.op === 'assign' ? { accountName: data.account_name } : {}), ...(input.op === 'feedback' ? { value: input.value } : {}), before: { resolution: r.resolution, account: r.account_name, research: r.research_status, feedback: r.feedback } });
  return { ok: true, signal: (await loadSignal(prisma, r.id))! };
}
