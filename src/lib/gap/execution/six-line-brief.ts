/**
 * The SIX-LINE BRIEF (Phase 2 E1, 2026-09-28): what Casey reads first when
 * he is about to contact someone, in this exact mental model:
 *
 *   KNOW     verified facts only (the primary outreach fact, verified at source)
 *   THINK    the hypothesis, labelled as inference
 *   LEARN    one discovery objective (the first falsification question)
 *   WHY YOU  the human-owned PersonaAngle (a suggestion is labelled as such)
 *   HISTORY  the real touch and response state for this person and account,
 *            and HubSpot opportunity truth read moments ago
 *   WRONG IF the falsification condition, never persuasion
 *
 * `buildBrief` is pure; `loadBriefHistory` reads (never writes) the ledgers,
 * dispositions, account holds and a bounded live HubSpot read. Nothing here
 * changes a gate: every send still runs its own checks at the click.
 */
import { outreachFactRefusal } from '../research/evidence-gate';
import { loadAccountFirstTouches } from '../motion/load';
import { accountRepliedRecently } from '../replies/account-reply';
import { resolveAccountOpportunity, type OpportunityTruth } from '../opportunity/active-opportunity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface BriefFact {
  title: string;
  quote: string;
  publishedAt: string | null;
  url: string | null;
}

export interface BriefHistory {
  personTouches: { count: number; lastAt: string | null };
  colleagueTouches: Array<{ recipient: string; sentAt: string; outstanding: boolean }>;
  accountReply: { from: string; receivedAt: string } | null;
  lastResponse: { responseClass: string; at: string } | null;
  opportunity: { status: 'CLEAR' | 'ACTIVE' | 'UNKNOWN'; detail: string; checkedAt: string };
}

export interface SixLineBrief {
  know: { fact: BriefFact; verified: true; supporting: number } | { fact: null; reason: string };
  think: string | null;
  learn: string | null;
  whyYou: { text: string; owned: true } | { text: string; owned: false } | null;
  history: string[];
  historyState: 'clear' | 'caution' | 'blocked';
  wrongIf: string | null;
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []);
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the getHypothesis row (house glue)
export function knowOf(hypothesis: any): SixLineBrief['know'] {
  const links: Array<{ role?: string | null; signal?: Record<string, unknown> | null }> = Array.isArray(hypothesis?.signals) ? hypothesis.signals : [];
  const verified = links.filter((l) => l.signal && outreachFactRefusal(l.signal as never, String(hypothesis.account_name ?? '')) === null);
  const primary = verified.find((l) => l.role === 'primary') ?? verified[0];
  if (!primary?.signal) return { fact: null, reason: links.length ? 'No verified fact: what is linked is a keyword hit or unverified context.' : 'No fact is linked to this thesis.' };
  const s = primary.signal;
  const observed = s.observed_at ? new Date(String(s.observed_at)).toISOString() : null;
  return {
    fact: { title: String(s.title ?? ''), quote: String(s.evidence_text ?? ''), publishedAt: observed, url: (s.evidence_url as string | null) ?? null },
    verified: true,
    supporting: verified.length - 1,
  };
}

export function historyLines(firstName: string, accountName: string, h: BriefHistory): { lines: string[]; state: SixLineBrief['historyState'] } {
  const lines: string[] = [];
  lines.push(h.personTouches.count === 0 ? `No GAP touches to ${firstName} yet` : `${h.personTouches.count} GAP touch${h.personTouches.count === 1 ? '' : 'es'} to ${firstName}${h.personTouches.lastAt ? `, last ${day(h.personTouches.lastAt)}` : ''}`);
  const others = h.colleagueTouches;
  lines.push(
    others.length === 0
      ? `No one else at ${accountName} contacted in 30 days`
      : others.map((o) => (o.outstanding ? `a first-touch draft to ${o.recipient} is outstanding` : `${o.recipient} got a first touch ${day(o.sentAt)}`)).join('; '),
  );
  lines.push(h.accountReply ? `${h.accountReply.from} replied ${day(h.accountReply.receivedAt)}, not triaged yet` : 'No account reply waiting');
  if (h.lastResponse) lines.push(`Last buyer response: ${h.lastResponse.responseClass.replace(/_/g, ' ')} (${day(h.lastResponse.at)})`);
  lines.push(`HubSpot opportunity ${h.opportunity.status}${h.opportunity.detail ? `: ${h.opportunity.detail}` : ''}, checked moments ago`);
  const state: SixLineBrief['historyState'] = h.opportunity.status !== 'CLEAR' || h.accountReply ? 'blocked' : others.length ? 'caution' : 'clear';
  return { lines, state };
}

export function buildBrief(input: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the getHypothesis row (house glue)
  hypothesis: any;
  firstName: string;
  angle: string | null;
  suggestedAngle: string | null;
  history: BriefHistory | null;
}): SixLineBrief {
  const h = input.hypothesis;
  const falsify = list(h?.falsification_questions);
  const hist = input.history ? historyLines(input.firstName, String(h?.account_name ?? ''), input.history) : { lines: ['History could not be read. Every send still checks it at the click.'], state: 'caution' as const };
  return {
    know: knowOf(h),
    think: typeof h?.problem_hypothesis === 'string' && h.problem_hypothesis.trim() ? h.problem_hypothesis.trim() : null,
    learn: falsify[0] ?? null,
    whyYou: input.angle ? { text: input.angle, owned: true } : input.suggestedAngle ? { text: input.suggestedAngle, owned: false } : null,
    history: hist.lines,
    historyState: hist.state,
    wrongIf: (typeof h?.what_a_no_means === 'string' && h.what_a_no_means.trim()) || falsify[1] || null,
  };
}

/** HubSpot truth for the brief: bounded, never throws (UNKNOWN on any failure). */
function opportunityLine(t: OpportunityTruth): BriefHistory['opportunity'] {
  const checkedAt = new Date().toISOString();
  if (t.status === 'ACTIVE') return { status: 'ACTIVE', detail: t.deals.map((d) => (d.name ? `"${d.name}"` : d.id)).slice(0, 2).join(', '), checkedAt };
  if (t.status === 'UNKNOWN') return { status: 'UNKNOWN', detail: 'check HubSpot before contacting', checkedAt };
  return { status: 'CLEAR', detail: '', checkedAt };
}

export async function loadBriefHistory(
  prisma: PrismaLike,
  input: { accountName: string; personaId: number | null; email: string | null; sent: Array<{ sentAt: string }>; now: Date },
  deps: { opportunity?: (accountName: string, email: string | null) => Promise<OpportunityTruth> } = {},
): Promise<BriefHistory | null> {
  try {
    const email = (input.email ?? '').trim().toLowerCase();
    const [touches, reply, last, opp] = await Promise.all([
      loadAccountFirstTouches(prisma, [input.accountName], input.now),
      email ? accountRepliedRecently(prisma, email, input.now) : Promise.resolve(null),
      email
        ? prisma.conversationDisposition.findFirst({ where: { contact_email: email, human_confirmed: true }, orderBy: { created_at: 'desc' }, select: { response_class: true, created_at: true } })
        : Promise.resolve(null),
      (deps.opportunity ?? ((a: string, e: string | null) => resolveAccountOpportunity(prisma, a, { email: e }, { timeoutMs: 8_000 })))(input.accountName, email || null),
    ]);
    const others = (touches.get(input.accountName) ?? []).filter((t) => !t.released && t.personaId !== input.personaId && t.recipient !== email);
    const lastAt = input.sent.length ? input.sent[input.sent.length - 1].sentAt : null;
    return {
      personTouches: { count: input.sent.length, lastAt },
      colleagueTouches: others.map((o) => ({ recipient: o.recipient, sentAt: o.sentAt, outstanding: !!o.outstanding })),
      accountReply: reply ? { from: reply.from_email, receivedAt: new Date(reply.received_at).toISOString() } : null,
      lastResponse: last ? { responseClass: String(last.response_class), at: new Date(last.created_at).toISOString() } : null,
      opportunity: opportunityLine(opp),
    };
  } catch {
    return null;
  }
}
