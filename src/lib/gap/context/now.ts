/**
 * NOW (V2, 2026-10-02): the 10-to-30-second answer for one account, projected from the account brief (the ONE
 * intelligence and motion) and the account context. Deterministic: no model call, no score, no new decision.
 *
 * Order follows the five reviewers: the state line, NEXT (one action), WHO (one person and why), one WHY NOW above
 * the fold; then the gap (current state, problem, impact, root cause) before anything that sounds like a pitch.
 * Each idea appears ONCE, in the first slot it qualifies for: NEXT > WHO > WHY NOW > KNOW > THINK.
 *
 * Seller words only. Tags are "Buyer said", "Checked", "Our read" (plus Unknown and Contradicted); the basis is on the
 * line. A third party's report stays attributed. A system record backs our relationship and commercial state,
 * never the buyer's operations. A satellite count is a fact about one site on one date, never a problem. Private
 * engagement is interest, never a reason: it is its own labelled line and is never read aloud. WEDGE shows only when
 * the buyer confirmed a problem or impact. Pinned by tests/unit/gap/now-projection.test.ts.
 */
import { VENDOR_LEAD, type AccountInputs, type AccountIntelligenceBrief, type DiscoveryQuestion, type MotionType } from '../account-intel/build';
import type { Source, Statement } from '../account-intel/truth';
import { sensitivityOf } from '../research/sensitivity';
import { readPerson } from '../people/person-prior';
import type { AccountContext } from './context';

/** "Unverified": a third party's report GAP has not checked (a signal); not our inference, not checked. */
export type SellerTag = 'Buyer said' | 'Checked' | 'Unverified' | 'Our read' | 'Unknown' | 'Contradicted';

/** Names stored all lower case ("adel ghanem") read as names. Anything with a capital is left as written. */
export const displayName = (n: string) => (n && n === n.toLowerCase() ? n.replace(/(^|[\s'-])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase()) : n);

export interface NowLine {
  /** Identity for deduplication (a fact id, a BID id, else the text). */
  id: string;
  text: string;
  tag: SellerTag;
  /** Where it comes from, in words ("their own publication, Sep 12", "reported by reuters.com, Sep 12"). */
  basis: string;
  /** May Casey quote it to the buyer? */
  cite: 'OK to cite to the buyer' | 'Checked, not for outreach' | 'Never cite (from imagery)' | null;
}

export interface NowView {
  name: string;
  /** "Manufacturer · Direct buyer · Ready for a first touch · Owner: Casey" */
  stateLine: string;
  next: { text: string; source: 'meeting' | 'deal' | 'conversation' | 'restriction' | 'motion' };
  who: { name: string; title: string | null; why: string; route: string | null } | null;
  whoUnknown: string | null;
  alternate: { name: string; title: string | null; why: string } | null;
  whyNow: NowLine[];
  gap: Array<{ element: 'Current state' | 'Problem' | 'Impact' | 'Root cause'; state: 'Buyer said' | 'Our read' | 'Unknown' }>;
  currentState: string;
  know: NowLine[];
  think: { text: string; wrongIf: string | null; testedBy: string | null } | null;
  impact: string;
  ask: string | null;
  relationship: string | null;
  /** "Private: interest signal, never mention to the buyer. ..." (only when material). */
  private: string | null;
  wedge: string | null;
  asset: { label: string; href: string | null } | null;
  /** What Listen reads: NOW in plain sentences, never the private line. */
  listen: string;
}

const STATE: Record<MotionType, string> = {
  IN_DEAL: 'In a deal',
  FOLLOW_UP: 'In a conversation',
  INTRO_ONLY: 'Warm intro only',
  FACT_LED: 'Ready for a first touch',
  REFERRAL_LED: 'Relationship-led',
  RELATIONSHIP_LED: 'Relationship-led',
  NO_GOOD_MOTION: 'Not contacting yet',
};

const OPERATIONS: ReadonlySet<string> = new Set(['identity', 'footprint', 'freight', 'volume', 'yard', 'technology', 'catalysts', 'economics']);
const SYSTEM: ReadonlySet<Source['kind']> = new Set(['persona', 'hubspot', 'account', 'work_source', 'ledger']);
const day = (s: string | null | undefined) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'undated');
const host = (u: string | null) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, '') : null;
  } catch {
    return null;
  }
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The seller tag and basis of a statement, or null when it cannot be said in NOW (a system record about their operations). */
export function sellerLine(s: Statement, section: string, x: { domains: readonly string[]; accountName: string; citable: ReadonlySet<string> }): NowLine | null {
  const src = s.sources[0];
  const id = src?.kind === 'evidence' || src?.kind === 'bid' ? `${src.kind}:${src.ref ?? s.text}` : `text:${norm(s.text)}`;
  if (s.truth === 'BUYER_CONFIRMED') return { id, text: s.text, tag: 'Buyer said', basis: `${src?.label ?? 'the buyer'}, ${day(s.asOf ?? src?.at)}`, cite: null };
  if (s.truth === 'CONTRADICTED') return { id, text: s.text, tag: 'Contradicted', basis: 'sources disagree', cite: null };
  if (s.truth === 'UNKNOWN') return { id, text: s.text, tag: 'Unknown', basis: 'not known', cite: null };
  if (s.truth === 'MODELED_ESTIMATE' || s.truth === 'INFERENCE') return { id, text: s.text, tag: 'Our read', basis: s.truth === 'MODELED_ESTIMATE' ? 'our model' : 'our inference', cite: null };
  // VERIFIED_PUBLIC
  if (s.sources.every((y) => SYSTEM.has(y.kind)) && OPERATIONS.has(section)) return null;
  const ev = s.sources.find((y) => y.kind === 'evidence');
  if (ev) {
    const h = host(ev.url);
    // Their own publication ONLY when the host is one of the account's domains. Never a name match: "The ...", "US ..."
    // and "General ..." matched thestreet.com, businessinsider.com and generalaviationnews.com (final review P1).
    const own = !!h && x.domains.some((d) => h === d || h.endsWith(`.${d.replace(/^www\./, '')}`));
    return { id, text: s.text, tag: 'Checked', basis: `${own ? 'their own publication' : `reported by ${h ?? ev.label}`}, ${day(s.asOf ?? ev.at)}`, cite: ev.ref && x.citable.has(ev.ref) ? 'OK to cite to the buyer' : 'Checked, not for outreach' };
  }
  if (s.sources.some((y) => y.kind === 'audit')) return { id, text: s.text, tag: 'Checked', basis: `seen in imagery, ${day(s.asOf)}; a fact about those sites on that date, never a problem`, cite: 'Never cite (from imagery)' };
  return { id, text: s.text, tag: 'Checked', basis: 'our own record', cite: 'Checked, not for outreach' };
}

/** Discovery order (GAP): current process, verify the problem, root cause, impact. No stack or future question before the current state. */
const ASK_ORDER: DiscoveryQuestion['type'][] = ['CURRENT_PROCESS', 'VERIFY_PROBLEM', 'ROOT_CAUSE', 'IMPACT', 'OWNERSHIP', 'CURRENT_STACK', 'CHANGE_REQUIREMENT', 'DESIRED_FUTURE'];
const LATE: ReadonlySet<string> = new Set(['CURRENT_STACK', 'CHANGE_REQUIREMENT', 'DESIRED_FUTURE']);

export function projectNow(brief: AccountIntelligenceBrief, ctx: AccountContext, i: Pick<AccountInputs, 'facts' | 'bids' | 'domains' | 'account'>, now: Date): NowView {
  const used = new Set<string>();
  const take = (l: NowLine) => (used.has(l.id) || used.has(`text:${norm(l.text)}`) ? false : (used.add(l.id), used.add(`text:${norm(l.text)}`), true));
  const live = i.facts.filter((f) => !f.expiresAt || new Date(f.expiresAt).getTime() > now.getTime());
  const citable = new Set(live.filter((f) => !sensitivityOf(f.quote)).flatMap((f) => [f.id, ...(f.sameQuoteIds ?? [])]));
  const lx = { domains: i.domains, accountName: i.account.name, citable };
  const m = brief.motion;

  // NEXT: an upcoming meeting (within 14 days) is the next thing; otherwise GAP's own next action, unchanged.
  const meeting = ctx.relationship.meetings.upcoming;
  const soon = meeting && new Date(meeting.at).getTime() - now.getTime() <= 14 * 86_400_000;
  const next: NowView['next'] = soon
    ? { text: `Prepare for the meeting on ${day(meeting!.at)}: ${meeting!.what}. Read BRIEF before you go.`, source: 'meeting' }
    : { text: m.who ? brief.glance.nextAction.split(m.who).join(displayName(m.who)) : brief.glance.nextAction, source: m.type === 'IN_DEAL' ? 'deal' : m.type === 'FOLLOW_UP' ? 'conversation' : m.type === 'INTRO_ONLY' ? 'restriction' : 'motion' };

  // WHO: the motion's person when it has one (buyer truth, a relationship, the introducer), else the person prior.
  const p = brief.people;
  const restriction = ctx.relationship.restriction;
  let who: NowView['who'] = null;
  if (m.type === 'INTRO_ONLY' && restriction) who = { name: restriction.introducer, title: null, why: `Holds the introduction to ${restriction.route}; this account is reached only through them.`, route: ctx.relationship.routes[0]?.route ?? null };
  else if (m.type === 'FOLLOW_UP' && m.who) who = { name: m.who, title: null, why: 'They are already talking to you: continue that thread.', route: null };
  else if ((m.type === 'REFERRAL_LED' || m.type === 'RELATIONSHIP_LED') && m.who) who = { name: m.who, title: null, why: `You have a way in: ${m.why.split(':')[0]}.`, route: null };
  else if (p?.primary && !p.primary.doNotContact) who = { name: displayName(p.primary.name), title: p.primary.title, why: p.primary.why, route: null };
  const whoUnknown = who ? null : brief.glance.likelyOwner.startsWith('Unknown') ? `${brief.glance.likelyOwner} Find the US / North America transportation operations owner (BRIEF: buyer map).` : brief.glance.likelyOwner;
  // When the motion names the person (a relationship, a thread, an introducer), the prior's best operator is the
  // alternate; otherwise the prior's own second choice.
  const altSrc = who && p?.primary && who.name !== displayName(p.primary.name) && !p.primary.doNotContact ? p.primary : p?.alternate ?? null;
  const alt = altSrc && displayName(altSrc.name) !== who?.name ? { name: displayName(altSrc.name), title: altSrc.title, why: altSrc.why } : null;
  const ownerMissing = !!who && p?.primary?.lane !== 'PRIMARY_OPERATOR' && m.type !== 'INTRO_ONLY' && m.type !== 'FOLLOW_UP' && m.type !== 'IN_DEAL';

  // WHY NOW: dated catalysts (checked first, then unverified signals); never private engagement.
  const whyNow: NowLine[] = [];
  const cat = brief.sections.catalysts.statements.filter((s) => s.truth !== 'CONTRADICTED' && !/^ENDED/.test(s.text) && !VENDOR_LEAD.test(s.text.replace(/^[A-Z /]+:\s*/, '')));
  const rankedCat = [...cat].sort((a, b) => Number(b.truth === 'VERIFIED_PUBLIC') - Number(a.truth === 'VERIFIED_PUBLIC') || String(b.asOf ?? b.sources[0]?.at ?? '').localeCompare(String(a.asOf ?? a.sources[0]?.at ?? '')));
  // At most ONE unverified signal (dogfood, 2026-10-02: three unverified headlines crowded out the decision), and when
  // there is one, a slot is kept for the newest (Walmart's yard-modernization hiring must not be crowded out by facts).
  let signals = 0;
  const hasSignal = rankedCat.some((s) => s.sources[0]?.kind === 'signal');
  let checked = 0;
  for (const s of rankedCat) {
    const isSignal = s.sources[0]?.kind === 'signal';
    // An undated signal is not a reason to act now.
    if (isSignal && (signals >= 1 || !s.sources[0]?.at)) continue;
    if (!isSignal && hasSignal && checked >= 2) continue;
    const l = sellerLine(s, 'catalysts', lx);
    // A slot is spent only by a line that is shown (a duplicate or an unsayable line spends nothing).
    if (l && whyNow.length < 3 && take(l)) {
      if (isSignal) signals += 1;
      else checked += 1;
      whyNow.push(isSignal ? { ...l, text: l.text.replace(/^Signal, not verified:\s*/, '').replace(/\s*\((?:shared )?[0-9a-z ,-]+\)$/i, ''), tag: 'Unverified', basis: `a third party's report, not checked; ${/^\d{4}-/.test(String(s.sources[0].at)) && s.text.includes('(shared ') ? 'shared' : 'published'} ${day(s.sources[0].at)}` } : l);
    }
  }

  // The gap, from buyer truth only; a hypothesis is "our read", never the buyer's.
  const bidOf = (t: string) => i.bids.find((b) => b.type === t);
  // Only a grounded thesis leads (build.ts: "an ungrounded draft never leads"); the discovery plan reads the same one.
  const top = brief.hypotheses.find((h) => h.truth !== 'CONTRADICTED' && h.grounded) ?? null;
  const gap: NowView['gap'] = [
    { element: 'Current state', state: bidOf('current_state') ? 'Buyer said' : 'Unknown' },
    { element: 'Problem', state: bidOf('business_problem') ? 'Buyer said' : top ? 'Our read' : 'Unknown' },
    { element: 'Impact', state: bidOf('impact') ? 'Buyer said' : 'Unknown' },
    { element: 'Root cause', state: bidOf('root_cause') ? 'Buyer said' : top?.rootCause ? 'Our read' : 'Unknown' },
  ];
  const cs = bidOf('current_state');
  const currentState = cs ? `Current state (buyer said, ${day(cs.at)}): ${cs.summary}` : 'Current state: not confirmed by the buyer.';
  // A volume metric ("300 trucks a day") is not a cost: only a confirmed impact is.
  const imp = bidOf('impact');
  const impact = imp ? `Impact (buyer said, ${day(imp.at)}): ${imp.summary}` : 'Impact: unknown. The buyer has not named a cost (our model is in BRIEF, never their pain).';

  // KNOW: buyer truth, then checked facts about their operations (max 3), each with its basis and the outreach axis.
  const know: NowLine[] = [];
  const order: Array<keyof AccountIntelligenceBrief['sections']> = ['footprint', 'freight', 'yard', 'technology', 'volume', 'identity'];
  const candidates = order.flatMap((k) => brief.sections[k].statements.filter((s) => s.truth === 'BUYER_CONFIRMED' || s.truth === 'VERIFIED_PUBLIC').map((s) => ({ s, k })));
  candidates.sort((a, b) => Number(b.s.truth === 'BUYER_CONFIRMED') - Number(a.s.truth === 'BUYER_CONFIRMED'));
  for (const { s, k } of candidates) {
    const l = sellerLine(s, k, lx);
    if (l && know.length < 3 && take(l)) know.push(l);
  }

  // THINK: one hedged problem, its short "wrong if", and the ASK that tests it.
  const think = top ? { text: top.problem, wrongIf: top.wrongIf ? top.wrongIf.split(/(?<=\.)\s/)[0] : null, testedBy: top.discoveryQuestion } : null;

  // ASK: one question, in discovery order; nothing about the stack or the future before the current state; a VP gets
  // the variance question (a network VP cannot describe 300 sites); never a site the buyer has not named.
  const sites = brief.wedge.candidates.map((c) => c.name.toLowerCase());
  const qs = [...brief.discovery].filter((q) => !(gap[0].state === 'Unknown' && LATE.has(q.type))).filter((q) => !sites.some((n) => n && q.question.toLowerCase().includes(n))).sort((a, b) => ASK_ORDER.indexOf(a.type) - ASK_ORDER.indexOf(b.type));
  const vp = who?.title ? readPerson(who.title).seniority >= 4 : false;
  let ask: string | null = qs[0]?.question ?? null;
  if (ask && qs[0].type === 'CURRENT_PROCESS' && vp) ask = 'Does every site check trailers in and find them the same way, or does each site run its own process?';
  if (m.type === 'INTRO_ONLY') ask = null;

  // WEDGE: the pitch conclusion, only after the buyer confirmed a problem or impact.
  const wedge = bidOf('business_problem') || imp ? brief.thesis.whereYardFlowMayFit : null;

  // ASSET: one existing asset, only when it serves NEXT (a meeting, a deal, a conversation, a first touch).
  const assetUseful = soon || ['IN_DEAL', 'FOLLOW_UP', 'FACT_LED'].includes(m.type);
  const a = assetUseful ? ctx.assets.find((x) => !x.legacy && (soon ? /meeting_prep|one_pager/.test(x.kind) : /one_pager|email|sequence/.test(x.kind))) ?? null : null;

  const owner = ctx.relationship.owner && !/^(unassigned|none|n\/a|tbd)$/i.test(ctx.relationship.owner) ? ctx.relationship.owner : null;
  const stage = brief.deals[0]?.stage && !/^\d+$/.test(brief.deals[0].stage) ? brief.deals[0].stage.replace(/([a-z])(scheduled|qualified|presented|sent|won|lost)\b/g, '$1 $2').replace(/[_-]+/g, ' ') : null;
  const stateLine = [brief.glance.fit, m.type === 'IN_DEAL' && stage ? `In a deal (${stage})` : STATE[m.type], owner ? `Owner: ${owner}` : null].filter(Boolean).join(' · ');
  const view: NowView = {
    name: brief.accountName,
    stateLine,
    next,
    who,
    whoUnknown: ownerMissing ? 'No US / North America transportation operations owner on record yet: find them (BRIEF: buyer map).' : whoUnknown,
    alternate: alt,
    whyNow,
    gap,
    currentState,
    know,
    think,
    impact,
    ask,
    relationship: m.type === 'INTRO_ONLY' ? null : ctx.relationship.line,
    private: ctx.engagement.material ? ctx.engagement.line : null,
    wedge,
    asset: a ? { label: a.label, href: a.href } : null,
    listen: '',
  };
  view.listen = listenText(view);
  return view;
}

/** What Listen reads aloud: NOW as plain sentences. Never the private line (it could be heard near the buyer). */
export function listenText(v: NowView): string {
  return [
    `${v.name}. ${v.stateLine}.`,
    `Next: ${v.next.text}`,
    v.who ? `Who: ${v.who.name}${v.who.title ? `, ${v.who.title}` : ''}. ${v.who.why}` : v.whoUnknown ? `Who: ${v.whoUnknown}` : null,
    v.whyNow[0] ? `Why now: ${v.whyNow[0].text}` : null,
    v.currentState,
    v.think ? `Our read: ${v.think.text}` : null,
    v.impact,
    v.ask ? `Ask: ${v.ask}` : null,
    v.relationship ? `Relationship: ${v.relationship}` : null,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 4800);
}
