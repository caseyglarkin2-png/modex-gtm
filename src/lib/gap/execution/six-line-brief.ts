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
import { factUrl } from '../research/claim-rules';
import { outreachFactRefusal } from '../research/evidence-gate';
import { loadAccountFirstTouches } from '../motion/load';
import { accountRepliedRecently } from '../replies/account-reply';
import { factUsability, isUsableFact, usabilityLine } from '../research/currentness';
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import { resolveAccountOpportunity, type OpportunityTruth } from '../opportunity/active-opportunity';
import { accountHref } from '../account-intel/href';
import { BEST_PROOF_MEASURED } from '../story/anchor';
import { optOutReplyOnFile } from '../replies/opt-out';

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
  /** R63-B S1: this person opted out (an opt-out reply on file, recorded or not, or a recorded do not contact). */
  optOut?: BriefOptOut | null;
}

/** R63-B S1: an opt-out on file for the person the pack is for (replies/opt-out.ts, the send gate's own read). */
export interface BriefOptOut {
  email: string;
  name: string | null;
  /** Their words, when the opt-out is a reply on file. */
  said: string | null;
  at: string | null;
  /** Recorded as do not contact (the person's flag or a confirmed do-not-contact answer). */
  recorded: boolean;
}

const dayYear = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

/**
 * R63-B S1: the opt-out in words, never temporary ("Do not contact yet" read as if it would pass): what they said and
 * when, that nothing goes to them, and, while it is not recorded, to record it from their reply.
 */
export function optOutLine(o: BriefOptOut): string {
  const who = o.name?.trim() || o.email;
  if (o.recorded) return `${who} asked not to be contacted${o.at ? ` (${dayYear(o.at)})` : ''}; it is recorded as do not contact. Nothing goes to them from here.`;
  return `${who} replied "${o.said ?? 'stop'}"${o.at ? ` on ${dayYear(o.at)}` : ''}: an opt-out. Nothing goes to them from here; record it as do not contact from their reply.`;
}

/** R63-B S1: what the pack's EMAIL slot shows. An opt-out on file shows no draft at all (no subject, no body). */
export type EmailSlot = 'opted_out' | 'thesis_hold' | 'email' | 'missing';
export function emailSlot(x: { optedOut: boolean; rendered: boolean; thesisHold: boolean }): EmailSlot {
  if (x.optedOut) return 'opted_out';
  if (!x.rendered) return 'missing';
  return x.thesisHold ? 'thesis_hold' : 'email';
}

export interface SixLineBrief {
  know: { fact: BriefFact; verified: true; supporting: number } | { fact: null; reason: string };
  /** UX-06: BEST PROOF, YardFlow's own number in the canon phrasing; never Checked, never the buyer's. */
  proof: { text: string; tag: 'Our proof, measured' };
  think: string | null;
  learn: string | null;
  whyYou: { text: string; owned: true } | { text: string; owned: false } | null;
  history: string[];
  historyState: 'clear' | 'caution' | 'blocked';
  wrongIf: string | null;
  /** How Casey knows this person (work sources): HIS context, never evidence, never sent by GAP. */
  context: string[];
  /**
   * The canonical account intelligence (account-intel/build.ts), one line: the motion, and a caution when the
   * account says "not now". It informs; every send still runs its own gates at the click.
   */
  account: { motion: string; caution: string | null; href: string } | null;
}

/** What the six-line brief takes from the canonical account brief (never recomputed here). */
export interface BriefAccountIntel {
  accountName: string;
  motion: { type: string; who: string | null; why: string };
  motionLine: string;
  firstDiscoveryQuestion: string | null;
}

/**
 * R63-A S10: the account row says the motion once. A cautious motion (no good motion, in a deal, warm intro only) is
 * its one amber line (its label and why); a first touch in motion says that alone, never "Do not contact yet: In
 * motion: ..." under "No good motion yet: In motion: ...". Otherwise the plain motion line.
 */
export function accountLines(a: BriefAccountIntel): { motion: string; caution: string | null } {
  const m = a.motion;
  if (m.type !== 'NO_GOOD_MOTION' && m.type !== 'IN_DEAL' && m.type !== 'INTRO_ONLY') return { motion: a.motionLine, caution: null };
  if (m.type !== 'NO_GOOD_MOTION') return { motion: '', caution: a.motionLine };
  const held = m.why.replace(/^Do not contact yet: /, '');
  return { motion: '', caution: /^In motion: /.test(held) ? held : m.why };
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []);
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the getHypothesis row (house glue)
export function knowOf(hypothesis: any, now: Date = new Date(), contradicted: ReadonlyMap<string, string> = new Map()): SixLineBrief['know'] {
  const links: Array<{ role?: string | null; signal?: Record<string, unknown> | null }> = Array.isArray(hypothesis?.signals) ? hypothesis.signals : [];
  // I06: an unusable fact (ended, closed, undated, superseded) is not known; an aged one is, with its date.
  const unusable = (sig: Record<string, unknown>) => !isUsableFact(sig, now);
  const verifiedAny = links.filter((l) => l.signal && outreachFactRefusal(l.signal as never, String(hypothesis.account_name ?? '')) === null);
  const fresh = verifiedAny.filter((l) => !unusable(l.signal!));
  // Final review P1: a fact another verified fact contradicts is not known (the send gate refuses it too).
  const verified = fresh.filter((l) => !contradicted.has(String(l.signal!.id ?? '')));
  const primary = verified.find((l) => l.role === 'primary') ?? verified[0];
  if (!primary?.signal) {
    const clash = fresh.find((l) => contradicted.has(String(l.signal!.id ?? '')));
    if (clash?.signal) return { fact: null, reason: `Verified facts about ${contradicted.get(String(clash.signal.id))} contradict each other: neither can be quoted. Ignore the side you do not believe in Research.` };
    const stale = verifiedAny.find((l) => l.role === 'primary') ?? verifiedAny[0];
    if (stale?.signal) return { fact: null, reason: `${usabilityLine(factUsability(stale.signal, now), stale.signal)} It cannot be quoted to a buyer. Find another verified fact.` };
    return { fact: null, reason: links.length ? 'No verified fact: what is linked is a keyword hit or unverified context.' : 'No fact is linked to this thesis.' };
  }
  const s = primary.signal;
  const observed = s.observed_at ? new Date(String(s.observed_at)).toISOString() : null;
  return {
    fact: { title: String(s.title ?? ''), quote: String(s.evidence_text ?? ''), publishedAt: observed, url: factUrl(s as { evidence_url?: string | null; metadata?: unknown }) },
    verified: true,
    supporting: verified.length - 1,
  };
}

/** R63-B S15: HubSpot's answer in words ("HubSpot opportunity CLEAR" was the reader's code on a seller screen). */
export function opportunityHistoryLine(o: BriefHistory['opportunity']): string {
  if (o.status === 'ACTIVE') return `An open HubSpot deal${o.detail ? `: ${o.detail}` : ''}, checked moments ago`;
  if (o.status === 'UNKNOWN') return `HubSpot could not be checked${o.detail ? `: ${o.detail}` : ''}`;
  return 'No open HubSpot deal, checked moments ago';
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
  // R63-B S1: the person's opt-out is said once, in words, in place of their reply's "not triaged yet".
  const o = h.optOut ?? null;
  const optOutReply = !!o && !!h.accountReply && h.accountReply !== 'unknown' && h.accountReply.from.toLowerCase() === o.email.toLowerCase();
  lines.push(
    optOutReply && o
      ? optOutLine(o)
      : h.accountReply === 'unknown'
        ? `Account reply status unknown (no company email at ${accountName} to check)`
        : h.accountReply
          ? `${h.accountReply.from} replied ${day(h.accountReply.receivedAt)}, not triaged yet`
          : 'No account reply waiting',
  );
  if (o && !optOutReply) lines.push(optOutLine(o));
  if (h.lastResponse && !(o && h.lastResponse.responseClass === 'do_not_contact')) lines.push(`Last buyer response: ${h.lastResponse.responseClass.replace(/_/g, ' ')} (${day(h.lastResponse.at)})`);
  lines.push(opportunityHistoryLine(h.opportunity));
  const state: SixLineBrief['historyState'] =
    o || h.opportunity.status !== 'CLEAR' || (h.accountReply && h.accountReply !== 'unknown') ? 'blocked' : others.length || h.accountReply === 'unknown' ? 'caution' : 'clear';
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
  /** Relationship context lines (intake/context.ts loadRelationshipContext). */
  context?: string[] | null;
  /** The canonical account intelligence for this account (null when it could not be read). */
  account?: BriefAccountIntel | null;
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
    // UX-06: BEST PROOF is YardFlow's own number, beside the opening, never the buyer's.
    proof: { text: BEST_PROOF_MEASURED, tag: 'Our proof, measured' },
    think: typeof h?.problem_hypothesis === 'string' && h.problem_hypothesis.trim() ? h.problem_hypothesis.trim() : null,
    // The thesis's own question first; else the account's discovery plan (the same plan the account page shows).
    learn: falsify[0] ?? input.account?.firstDiscoveryQuestion ?? null,
    whyYou: input.angle ? { text: input.angle, owned: true } : input.suggestedAngle ? { text: input.suggestedAngle, owned: false } : null,
    history: hist.lines,
    historyState: hist.state,
    wrongIf: (typeof h?.what_a_no_means === 'string' && h.what_a_no_means.trim()) || falsify[1] || null,
    context: (input.context ?? []).filter((l) => typeof l === 'string' && l.trim()),
    account: input.account
      ? {
          // R63-A S10: the motion once ("No good motion yet: In motion: ..." and "Do not contact yet: In motion: ..."
          // were one fact twice): a cautious motion is its one amber line, and a first touch in motion says only that.
          ...accountLines(input.account),
          href: accountHref(input.account.accountName),
        }
      : null,
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
  input: { accountName: string; personaId: number | null; email: string | null; sent: Array<{ sentAt: string }>; now: Date; /** R63-B S1 */ name?: string | null; doNotContact?: boolean },
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
    const [touches, reply, last, opp, optOutReply] = await Promise.all([
      loadAccountFirstTouches(prisma, [input.accountName], input.now),
      replyAddress ? accountRepliedRecently(prisma, replyAddress, input.now, { accountName: input.accountName }) : Promise.resolve('unknown' as const),
      email
        ? prisma.conversationDisposition.findFirst({ where: { contact_email: email, human_confirmed: true }, orderBy: { created_at: 'desc' }, select: { response_class: true, created_at: true } })
        : Promise.resolve(null),
      (deps.opportunity ?? ((a: string, e: string | null) => resolveAccountOpportunity(prisma, a, { email: e }, { timeoutMs: 8_000 })))(input.accountName, email || null),
      // R63-B S1: the person's opt-out reply on file, recorded or not (the send gate's own read).
      email ? optOutReplyOnFile(prisma, email).catch(() => null) : Promise.resolve(null),
    ]);
    const recorded = !!input.doNotContact || last?.response_class === 'do_not_contact';
    const optOut: BriefOptOut | null =
      optOutReply || recorded
        ? { email, name: input.name?.trim() || optOutReply?.fromName || null, said: optOutReply?.said ?? null, at: optOutReply?.receivedAt ?? (last?.response_class === 'do_not_contact' ? new Date(last.created_at).toISOString() : null), recorded }
        : null;
    const others = (touches.get(input.accountName) ?? []).filter((t) => !t.released && t.personaId !== input.personaId && t.recipient !== email);
    const lastAt = input.sent.length ? input.sent[input.sent.length - 1].sentAt : null;
    return {
      personTouches: { count: input.sent.length, lastAt },
      colleagueTouches: others.map((o) => ({ recipient: o.recipient, sentAt: o.sentAt, outstanding: !!o.outstanding })),
      accountReply: reply === 'unknown' ? 'unknown' : reply ? { from: reply.from_email, receivedAt: new Date(reply.received_at).toISOString() } : null,
      lastResponse: last ? { responseClass: String(last.response_class), at: new Date(last.created_at).toISOString() } : null,
      opportunity: opportunityLine(opp),
      optOut,
    };
  } catch {
    return null;
  }
}
