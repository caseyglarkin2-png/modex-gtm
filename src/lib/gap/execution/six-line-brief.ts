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
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
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
  /** 'unknown' when no company address at the account could be checked (never "none waiting" by default). */
  accountReply: { from: string; receivedAt: string } | null | 'unknown';
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
export function knowOf(hypothesis: any, now: Date = new Date(), contradicted: ReadonlyMap<string, string> = new Map()): SixLineBrief['know'] {
  const links: Array<{ role?: string | null; signal?: Record<string, unknown> | null }> = Array.isArray(hypothesis?.signals) ? hypothesis.signals : [];
  const expired = (sig: Record<string, unknown>) => !!sig.freshness_expires_at && new Date(String(sig.freshness_expires_at)).getTime() <= now.getTime();
  const verifiedAny = links.filter((l) => l.signal && outreachFactRefusal(l.signal as never, String(hypothesis.account_name ?? '')) === null);
  // Review E P1: an expired fact is not known (every send gate drops it too).
  const fresh = verifiedAny.filter((l) => !expired(l.signal!));
  // Final review P1: a fact another verified fact contradicts is not known (the send gate refuses it too).
  const verified = fresh.filter((l) => !contradicted.has(String(l.signal!.id ?? '')));
  const primary = verified.find((l) => l.role === 'primary') ?? verified[0];
  if (!primary?.signal) {
    const clash = fresh.find((l) => contradicted.has(String(l.signal!.id ?? '')));
    if (clash?.signal) return { fact: null, reason: `Verified facts about ${contradicted.get(String(clash.signal.id))} contradict each other: neither can be quoted. Ignore the side you do not believe in Research.` };
    const stale = verifiedAny.find((l) => l.role === 'primary') ?? verifiedAny[0];
    if (stale?.signal) return { fact: null, reason: `The verified fact expired on ${new Date(String(stale.signal.freshness_expires_at)).toISOString().slice(0, 10)}: it cannot be quoted to a buyer. Find fresh evidence.` };
    return { fact: null, reason: links.length ? 'No verified fact: what is linked is a keyword hit or unverified context.' : 'No fact is linked to this thesis.' };
  }
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
  lines.push(
    h.accountReply === 'unknown'
      ? `Account reply status unknown (no company email at ${accountName} to check)`
      : h.accountReply
        ? `${h.accountReply.from} replied ${day(h.accountReply.receivedAt)}, not triaged yet`
        : 'No account reply waiting',
  );
  if (h.lastResponse) lines.push(`Last buyer response: ${h.lastResponse.responseClass.replace(/_/g, ' ')} (${day(h.lastResponse.at)})`);
  lines.push(`HubSpot opportunity ${h.opportunity.status}${h.opportunity.detail ? `: ${h.opportunity.detail}` : ''}, checked moments ago`);
  const state: SixLineBrief['historyState'] =
    h.opportunity.status !== 'CLEAR' || (h.accountReply && h.accountReply !== 'unknown') ? 'blocked' : others.length || h.accountReply === 'unknown' ? 'caution' : 'clear';
  return { lines, state };
}

export function buildBrief(input: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the getHypothesis row (house glue)
  hypothesis: any;
  firstName: string;
  angle: string | null;
  suggestedAngle: string | null;
  history: BriefHistory | null;
  now?: Date;
  /** Contradicted fact ids (research/conflicts.ts) -> the site. */
  contradicted?: ReadonlyMap<string, string> | null;
}): SixLineBrief {
  const h = input.hypothesis;
  const falsify = list(h?.falsification_questions);
  const hist = input.history ? historyLines(input.firstName, String(h?.account_name ?? ''), input.history) : { lines: ['History could not be read. Every send still checks it at the click.'], state: 'caution' as const };
  return {
    // A contradiction check that could not run never lets a fact read as known.
    know:
      input.contradicted === null
        ? { fact: null, reason: 'Could not check this fact against the other evidence just now. Every send re-checks before anything goes out.' }
        : knowOf(h, input.now ?? new Date(), input.contradicted ?? new Map()),
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
    // Review E P1: the account reply check needs a COMPANY address at the account. This person's, else any
    // person GAP holds there; with none, the status is unknown (never "none waiting").
    const isCompany = (e: string) => {
      const d = (e.split('@')[1] ?? '').toLowerCase();
      return !!d && !FREEMAIL_DOMAINS.has(d) && !OWN_DOMAINS.has(d);
    };
    const replyAddress = email && isCompany(email)
      ? email
      : ((await prisma.persona.findMany({ where: { account_name: input.accountName, email: { not: null } }, select: { email: true }, take: 50 })) as Array<{ email: string | null }>)
          .map((p) => String(p.email ?? '').toLowerCase())
          .find(isCompany) ?? null;
    const [touches, reply, last, opp] = await Promise.all([
      loadAccountFirstTouches(prisma, [input.accountName], input.now),
      replyAddress ? accountRepliedRecently(prisma, replyAddress, input.now, { accountName: input.accountName }) : Promise.resolve('unknown' as const),
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
      accountReply: reply === 'unknown' ? 'unknown' : reply ? { from: reply.from_email, receivedAt: new Date(reply.received_at).toISOString() } : null,
      lastResponse: last ? { responseClass: String(last.response_class), at: new Date(last.created_at).toISOString() } : null,
      opportunity: opportunityLine(opp),
    };
  } catch {
    return null;
  }
}
