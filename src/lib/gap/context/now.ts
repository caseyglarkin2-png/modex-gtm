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
import { sameIdea } from './same-idea';
import type { Source, Statement } from '../account-intel/truth';
import { sensitivityOf } from '../research/sensitivity';
import { sellerRelevance } from '../research/continuity';
import { readPerson } from '../people/person-prior';
import { EMPLOYMENT_LABEL } from '../people/employment';
import { ROLE_LABEL } from '../people/role-currentness';
import type { AccountContext } from './context';
import type { ReadyTarget } from './send-target';

/** "Unverified": a third party's report GAP has not checked (a signal); not our inference, not checked. */
export type SellerTag = 'Buyer said' | 'Checked' | 'Unverified' | 'Our read' | 'Unknown' | 'Contradicted';

/** Names stored all lower case ("adel ghanem") read as names. Anything with a capital is left as written. */
export { displayName } from '../people/display-name';
import { displayName } from '../people/display-name';

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
  /** A multi-division parent: which division owns the yard decision is the first unknown (the operating unit). */
  unit: string | null;
  /** "Last touch Sep 3, 2026 (29 days ago): Email to ..." or "No touch on record." */
  lastTouch: string;
  /** The newest buyer reply on record, dated, else null. */
  lastReply: string | null;
  next: { text: string; source: 'meeting' | 'deal' | 'conversation' | 'restriction' | 'motion' };
  who: { name: string; title: string | null; why: string; route: string | null; location?: string | null; inHubSpotOnly?: boolean; hubspotContactId?: string | null; personaId?: number | null; employment?: { state: string; label: string; why: string } | null; role?: { state: string; label: string; why: string } | null } | null;
  /** A better-fit person on record who is not yet a GAP contact (shown beside the ready-card person). */
  betterFit: string | null;
  /** The HubSpot contact behind `betterFit` or a HubSpot-only WHO: the ADD TO GAP control (owner resolution). */
  addToGap?: { name: string; title: string | null; hubspotContactId: string } | null;
  /** A GAP-created first-touch draft still outstanding (it holds the account): the remediation control. */
  outstandingDraft?: { recipient: string; name: string | null; decisionId: string; gmailDraftId: string; createdAt: string } | null;
  /** People on record who left the company (contact currentness): historical, never WHO, never do-not-contact. */
  historical?: Array<{ name: string; title: string | null; personaId: number | null; elsewhere: string | null }>;
  /** GAP contacts marked do not contact: never WHO; the legacy suppression review explains each flag. */
  blocked?: Array<{ name: string; title: string | null; personaId: number }>;
  whoUnknown: string | null;
  alternate: { name: string; title: string | null; why: string } | null;
  whyNow: NowLine[];
  gap: Array<{ element: 'Current state' | 'Problem' | 'Impact' | 'Root cause'; state: 'Buyer said' | 'Our read' | 'Unknown' }>;
  currentState: string;
  know: NowLine[];
  think: { text: string; wrongIf: string | null; testedBy: string | null } | null;
  impact: string;
  ask: string | null;
  /** The transportation owner leads and the ready card is the alternative (round 6, PepsiCo). */
  ownerFirst?: { owner: string; ready: string } | null;
  /** Whose unanswered reply NEXT answers (the control opens that thread in Gmail). */
  replyThread?: string | null;
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
/** Comparison form: the catalyst label ("RECENT EVENT:") and punctuation do not make a different idea. */
const CATALYST_WINDOW_MS = 45 * 86_400_000;
const PROGRAM_WINDOW_MS = 180 * 86_400_000;
/** A market piece (a stock forecast, a fair-value take) is not a trigger (click test round 4: PFG, GXO). */
const MARKET_PIECE = /\b(stock forecasts?|price target|fair value|gf value|\d+(?:\.\d+)?% (?:gain|drop|rise|fall|decline|jump)|stock price|quote & history|stock quote|shares (?:rose|fell|jump|drop)|stock (?:price|rating)|dividend|buy rating|sell rating|analyst(?:s)? (?:say|rating))\b/i;
const SOURCE_KIND: Record<string, string> = { conference: 'a conference', event: 'an event', meeting: 'a meeting', referral: 'a referral' };

const norm = (s: string) => s.replace(/^[A-Z][A-Z /]+:\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A seller line never carries a raw URL or an empty bracket (the source is on the basis line). */
const noUrls = (t: string) => t.replace(/\s*\(?\s*https?:\/\/[^\s)]+\)?/g, '')
  // Machine words (click test round 3): a pipeline version "(V2)", a filing index "(2)". A trailing source host
  // "(careers.walmart.com)" stays: it is the provenance of a titleless note.
  .replace(/\s*\(V\d+\)/g, '').replace(/^((?:[A-Z][A-Z /]+:\s*)?)\(\d+\)\s+/, '$1').replace(/\(\s*\)/g, '').replace(/\s+([).,;])/g, '$1').replace(/\s{2,}/g, ' ').trim();

/** The seller tag and basis of a statement, or null when it cannot be said in NOW (a system record about their operations). */
export function sellerLine(s: Statement, section: string, x: { domains: readonly string[]; accountName: string; citable: ReadonlySet<string> }): NowLine | null {
  const src = s.sources[0];
  const id = src?.kind === 'evidence' || src?.kind === 'bid' ? `${src.kind}:${src.ref ?? s.text}` : `text:${norm(s.text)}`;
  s = { ...s, text: noUrls(s.text) };
  if (s.truth === 'BUYER_CONFIRMED') return { id, text: s.text, tag: 'Buyer said', basis: `${src?.label ?? 'the buyer'}, ${day(s.asOf ?? src?.at)}`, cite: null };
  if (s.truth === 'CONTRADICTED') return { id, text: s.text, tag: 'Contradicted', basis: 'sources disagree', cite: null };
  if (s.truth === 'UNKNOWN') return { id, text: s.text, tag: 'Unknown', basis: 'not known', cite: null };
  if (s.truth === 'MODELED_ESTIMATE' || s.truth === 'INFERENCE') return { id, text: s.text, tag: 'Our read', basis: s.truth === 'MODELED_ESTIMATE' ? 'our model (how it is calculated: View details)' : 'our inference', cite: null };
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

export function projectNow(brief: AccountIntelligenceBrief, ctx: AccountContext, i: Pick<AccountInputs, 'facts' | 'bids' | 'domains' | 'account'> & { firstTouches?: AccountInputs['firstTouches'] }, now: Date, opts: { ready?: ReadyTarget | null } = {}): NowView {
  const used = new Set<string>();
  // Each idea once, also when two sources say it in different words (round 4: Giant Eagle twice, Gatik twice).
  const shown: string[] = [];
  const take = (l: NowLine) => {
    if (used.has(l.id) || used.has(`text:${norm(l.text)}`) || shown.some((t) => sameIdea(t, l.text, i.account.name))) return false;
    used.add(l.id);
    used.add(`text:${norm(l.text)}`);
    shown.push(l.text);
    return true;
  };
  const live = i.facts.filter((f) => !f.expiresAt || new Date(f.expiresAt).getTime() > now.getTime());
  const citable = new Set(live.filter((f) => !sensitivityOf(f.quote)).flatMap((f) => [f.id, ...(f.sameQuoteIds ?? [])]));
  const lx = { domains: i.domains, accountName: i.account.name, citable };
  const m = brief.motion;

  // NEXT: an upcoming meeting (within 14 days) is the next thing; otherwise GAP's own next action, unchanged.
  const meeting = ctx.relationship.meetings.upcoming;
  const soon = meeting && new Date(meeting.at).getTime() - now.getTime() <= 14 * 86_400_000;
  // In a deal, the deal's own next step (HubSpot) is NEXT when someone wrote one; otherwise GAP's deal guidance.
  const dealNext = m.type === 'IN_DEAL' ? brief.deals.find((d) => d.nextStep?.trim())?.nextStep?.trim() ?? null : null;
  let next: NowView['next'] = soon
    ? { text: `Prepare for the meeting on ${day(meeting!.at)}: ${meeting!.what}. Read BRIEF before you go.`, source: 'meeting' }
    : m.type === 'FACT_LED' && opts.ready
      ? { text: `Review the thesis, then open the first-touch card for ${displayName(opts.ready.name)} (every gate runs at the click).`, source: 'motion' }
    : dealNext
      ? { text: `Deal next step (HubSpot): ${dealNext}`, source: 'deal' }
      : { text: m.who ? brief.glance.nextAction.split(m.who).join(displayName(m.who)) : brief.glance.nextAction, source: m.type === 'IN_DEAL' ? 'deal' : m.type === 'FOLLOW_UP' ? 'conversation' : m.type === 'INTRO_ONLY' ? 'restriction' : 'motion' };

  // WHO: the motion's person when it has one (buyer truth, a relationship, the introducer), else the person prior.
  const p = brief.people;
  const restriction = ctx.relationship.restriction;
  let who: NowView['who'] = null;
  if (m.type === 'INTRO_ONLY' && restriction) who = { name: restriction.introducer, title: null, why: `Holds the introduction to ${restriction.route}; this account is reached only through them.`, route: ctx.relationship.routes[0]?.route ?? null };
  else if (m.type === 'FOLLOW_UP' && m.who) who = { name: m.who, title: null, why: 'They are already talking to you: continue that thread.', route: null };
  else if (m.type === 'RELATIONSHIP_LED' && m.met) who = { name: displayName(m.met.name), title: m.met.title, why: `You met them at ${m.met.source} (${SOURCE_KIND[m.met.sourceType] ?? m.met.sourceType.replace(/_/g, ' ')})${m.met.company ? `; works at ${m.met.company}` : ''}.${m.met.title ? '' : ' Title not on record: confirm it before you write.'}`, route: null };
  else if ((m.type === 'REFERRAL_LED' || m.type === 'RELATIONSHIP_LED') && m.who) who = { name: m.who, title: null, why: `You have a way in: ${m.why.split(':')[0]}.`, route: null };
  else if (p?.primary && !p.primary.doNotContact) who = { name: displayName(p.primary.name), title: p.primary.title, why: p.primary.why, route: null, location: p.primary.location ?? null, inHubSpotOnly: p.primary.source === 'hubspot', hubspotContactId: p.primary.hubspotContactId ?? null, personaId: p.primary.personaId ?? null, employment: p.primary.employment ? { state: p.primary.employment.state, label: EMPLOYMENT_LABEL[p.primary.employment.state], why: p.primary.employment.why } : null, role: p.primary.role && p.primary.role.state !== 'ROLE_UNVERIFIED' ? { state: p.primary.role.state, label: ROLE_LABEL[p.primary.role.state], why: p.primary.role.why } : null };
  // ONE ANSWER (click test P0): a first touch can only go where a READY card is. When the cockpit has one for this
  // account, NOW names that person (the cockpit's own pick, by the same prior) and says who is a better fit but not
  // yet a GAP contact; NEXT opens that card.
  const ready = m.type === 'FACT_LED' ? opts.ready ?? null : null;
  let betterFit: string | null = null;
  let ownerFirst: NowView['ownerFirst'] = null;
  let readyAlt: NowView['alternate'] = null;
  if (ready) {
    const all = p?.lanes.flatMap((l) => l.people) ?? [];
    const rp = all.find((x) => displayName(x.name) === displayName(ready.name));
    const owner = p?.primary && !p.primary.doNotContact && displayName(p.primary.name) !== displayName(ready.name) ? p.primary : null;
    if (owner && owner.lane === 'PRIMARY_OPERATOR' && rp?.lane !== 'PRIMARY_OPERATOR') {
      // The lane outranks readiness (Casey's order; round 6, PepsiCo: the card went to a VP Supply Chain whose
      // ownership is not stated while a transportation owner was on record). The ready card stays one tap away.
      const n = displayName(owner.name);
      ownerFirst = { owner: n, ready: displayName(ready.name) };
      next = { text: `${owner.source === 'hubspot' ? `Add ${n}${owner.title ? ` (${owner.title})` : ''} from HubSpot as a GAP contact, then first-touch them` : `First-touch ${n}${owner.title ? ` (${owner.title})` : ''}`}: the transportation owner on record. Ready now instead: the first-touch card for ${displayName(ready.name)} (ask who owns the yards).`, source: 'motion' };
      who = { name: n, title: owner.title, why: owner.why, route: null, location: owner.location ?? null, inHubSpotOnly: owner.source === 'hubspot', hubspotContactId: owner.hubspotContactId ?? null, personaId: owner.personaId ?? null };
      readyAlt = { name: displayName(ready.name), title: ready.title, why: 'Ready now: a first-touch card exists. Ask who owns the yards.' };
    } else {
      if (owner) betterFit = `Better fit on record: ${displayName(owner.name)}${owner.title ? `, ${owner.title}` : ''}${owner.source === 'hubspot' ? ' (in HubSpot, not yet a GAP contact: add them)' : ''}.`;
      who = { name: displayName(ready.name), title: ready.title, why: rp?.why ?? 'The person the cockpit has a ready first touch for.', route: null, location: rp?.location ?? null, inHubSpotOnly: false };
    }
  }
  // AN UNANSWERED REPLY is the next thing (click test round 4, GXO: the only live buyer thread sat under "work the
  // deal"). The buyer wrote last and nothing was sent after: answer it, to its writer. A meeting soon still leads.
  const ago = (at: string) => Math.max(0, Math.floor((now.getTime() - new Date(at).getTime()) / 86_400_000));
  const repRow = ctx.history.find((h) => h.kind === 'reply');
  const replier = repRow?.text.match(/^Reply from\s+([^:<]+?)\s*:/)?.[1]?.trim() ?? null;
  const answered = !!repRow && (ctx.history.some((h) => (h.kind === 'email_sent' || h.kind === 'asset_sent') && h.at > repRow.at) || (i.firstTouches ?? []).some((t) => !!t.sentAt && t.state !== 'draft outstanding' && String(t.sentAt) > repRow.at));
  const unanswered = repRow && replier && !answered && m.type !== 'INTRO_ONLY' ? { at: repRow.at, who: displayName(replier) } : null;
  if (unanswered && !soon) {
    next = { text: `Answer ${unanswered.who}'s reply of ${day(unanswered.at)} (unanswered for ${ago(unanswered.at)} days): read the full thread in Gmail, then reply in it.`, source: 'conversation' };
    const known = p?.lanes.flatMap((l) => l.people).find((x) => displayName(x.name) === unanswered.who);
    who = { name: unanswered.who, title: known?.title ?? null, why: `They wrote last (${day(unanswered.at)}); the thread is waiting on you.`, route: null, location: known?.location ?? null, inHubSpotOnly: false };
    betterFit = null;
    ownerFirst = null;
    readyAlt = null;
  }
  const whoUnknown = who ? null : brief.glance.likelyOwner.startsWith('Unknown') ? `${brief.glance.likelyOwner} Find the US / North America transportation operations owner (BRIEF: buyer map).` : brief.glance.likelyOwner;
  // The ADD TO GAP control: the HubSpot-only person NOW names (WHO, or the better fit beside a ready card).
  const hsOwner = p?.primary && p.primary.source === 'hubspot' && p.primary.hubspotContactId && !p.primary.doNotContact ? p.primary : null;
  const addToGap: NowView['addToGap'] = hsOwner && (who?.inHubSpotOnly || betterFit) ? { name: displayName(hsOwner.name), title: hsOwner.title, hubspotContactId: hsOwner.hubspotContactId! } : null;
  // A GAP-created first-touch draft still outstanding holds the account: the seller gets a control, not an instruction.
  const od = (i.firstTouches ?? []).find((t) => t.state === 'draft outstanding' && t.decisionId && t.gmailDraftId) ?? null;
  const odName = od ? p?.lanes.flatMap((l) => l.people).find((x) => x.personaId != null && x.personaId === od.personaId)?.name ?? null : null;
  const outstandingDraft: NowView['outstandingDraft'] = od ? { recipient: od.recipient, name: odName ? displayName(odName) : null, decisionId: od.decisionId!, gmailDraftId: od.gmailDraftId!, createdAt: od.sentAt ?? '' } : null;
  // Historical contacts: people the evidence says left (never WHO, never an alternate, never do-not-contact).
  const blocked: NowView['blocked'] = (p?.lanes.flatMap((l) => l.people) ?? []).filter((x) => x.doNotContact && x.source === 'gap' && typeof x.personaId === 'number').map((x) => ({ name: displayName(x.name), title: x.title, personaId: x.personaId as number }));
  const historical: NowView['historical'] = (p?.lanes.flatMap((l) => l.people) ?? []).filter((x) => x.employment?.state === 'LEFT_COMPANY_CONFIRMED').map((x) => ({ name: displayName(x.name), title: x.title, personaId: x.personaId ?? null, elsewhere: x.employment?.elsewhere?.company ? `${x.employment.elsewhere.company}${x.employment.elsewhere.title ? ` (${x.employment.elsewhere.title})` : ''}` : null }));
  // When the motion names the person (a relationship, a thread, an introducer), the prior's best operator is the
  // alternate; otherwise the prior's own second choice.
  const altSrc = who && p?.primary && who.name !== displayName(p.primary.name) && !p.primary.doNotContact ? p.primary : p?.alternate ?? null;
  // Never the same person as both "add next" and "alternate" (round 4: Isaac Scott twice on PepsiCo).
  const alt = readyAlt ?? (altSrc && displayName(altSrc.name) !== who?.name && !betterFit?.includes(displayName(altSrc.name)) ? { name: displayName(altSrc.name), title: altSrc.title, why: altSrc.why } : null);
  const ownerMissing = !!who && p?.primary?.lane !== 'PRIMARY_OPERATOR' && m.type !== 'INTRO_ONLY' && m.type !== 'FOLLOW_UP' && m.type !== 'IN_DEAL';

  // WHY NOW: dated catalysts (checked first, then unverified signals); never private engagement.
  const whyNow: NowLine[] = [];
  const cat = brief.sections.catalysts.statements.filter((s) => s.truth !== 'CONTRADICTED' && !/^ENDED/.test(s.text) && !VENDOR_LEAD.test(s.text.replace(/^[A-Z /]+:\s*/, '')));
  // Seller relevance first (click test: a sale in Brazil and a plant in Kazakhstan led WHY NOW): a physical network,
  // site or automation change beats context (activity abroad, a divestiture, legal text), which shows only when
  // nothing better exists. Then checked before unverified, then newest.
  const rel = (s: (typeof cat)[number]) => sellerRelevance(s.text.replace(/^[A-Z][A-Z /]+:\s*/, '')).rank;
  const relevantExists = cat.some((s) => s.truth === 'VERIFIED_PUBLIC' && rel(s) <= 5);
  const rankedCat = [...cat]
    .filter((s) => !relevantExists || s.sources[0]?.kind === 'signal' || rel(s) <= 5)
    .sort((a, b) => Number(b.truth === 'VERIFIED_PUBLIC') - Number(a.truth === 'VERIFIED_PUBLIC') || rel(a) - rel(b) || String(b.asOf ?? b.sources[0]?.at ?? '').localeCompare(String(a.asOf ?? a.sources[0]?.at ?? '')));
  // At most ONE unverified signal (dogfood, 2026-10-02: three unverified headlines crowded out the decision), and when
  // there is one, a slot is kept for the newest (Walmart's yard-modernization hiring must not be crowded out by facts).
  let signals = 0;
  const hasSignal = rankedCat.some((s) => s.sources[0]?.kind === 'signal');
  let checked = 0;
  for (const s of rankedCat) {
    const isSignal = s.sources[0]?.kind === 'signal';
    // An undated signal is not a reason to act now.
    if (isSignal && (signals >= 1 || !s.sources[0]?.at)) continue;
    // An unverified report about activity abroad, a divestiture or a market piece is not their US yard network.
    if (isSignal && (rel(s) >= 7 || MARKET_PIECE.test(s.text))) continue;
    // Nor is an event past the 45-day catalyst window (Sources says the same; Tyson led on a 50-day-old "this week").
    const at = Date.parse(String(s.asOf ?? s.sources[0]?.at ?? ''));
    // A physical network transformation is a multi-year program, not a one-day event: it stays a reason for 180
    // days (round 5: General Mills' network redesign aged out while a CEO headline led).
    if (!isSignal && Number.isFinite(at) && now.getTime() - at > (rel(s) === 1 ? PROGRAM_WINDOW_MS : CATALYST_WINDOW_MS)) continue;
    if (!isSignal && hasSignal && checked >= 2) continue;
    const l0 = sellerLine(s, 'catalysts', lx);
    // Kept past 45 days only as a network program: say so, never "RECENT EVENT" (round 7: a 93-day-old redesign).
    const l = l0 && !isSignal && Number.isFinite(at) && now.getTime() - at > CATALYST_WINDOW_MS ? { ...l0, text: l0.text.replace(/^RECENT EVENT:/, 'ONGOING PROGRAM:') } : l0;
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
  // While a buyer's reply waits, the reply is the conversation: no discovery question beside it (round 6, GXO).
  if (unanswered && !soon) ask = null;

  // WEDGE: the pitch conclusion, only after the buyer confirmed a problem or impact.
  const wedge = bidOf('business_problem') || imp ? brief.thesis.whereYardFlowMayFit : null;

  // ASSET: one existing asset, only when it serves NEXT (a meeting, a deal, a conversation, a first touch).
  const assetUseful = soon || ['IN_DEAL', 'FOLLOW_UP', 'FACT_LED'].includes(m.type);
  const a = assetUseful ? ctx.assets.find((x) => !x.legacy && (soon ? /meeting_prep|one_pager/.test(x.kind) : /one_pager|email|sequence/.test(x.kind))) ?? null : null;

  const owner = ctx.relationship.owner && !/^(unassigned|none|n\/a|tbd)$/i.test(ctx.relationship.owner) ? ctx.relationship.owner : null;
  const stage = brief.deals[0]?.stage && !/^\d+$/.test(brief.deals[0].stage) ? brief.deals[0].stage.replace(/([a-z])(scheduled|qualified|presented|sent|won|lost)\b/g, '$1 $2').replace(/[_-]+/g, ' ') : null;
  const d0 = brief.deals[0];
  const money = d0?.amount && Number.isFinite(Number(d0.amount)) && Number(d0.amount) > 0 ? `$${Number(d0.amount) >= 1e6 ? `${(Number(d0.amount) / 1e6).toFixed(1)}M` : `${Math.round(Number(d0.amount) / 1e3)}K`}` : null;
  // A close date in the past is not deal state: it says the deal record needs updating.
  const closeAt = d0?.closeDate && !Number.isNaN(new Date(d0.closeDate).getTime()) ? new Date(d0.closeDate) : null;
  const closes = closeAt ? (closeAt.getTime() < now.getTime() - 86_400_000 ? `close date ${day(d0!.closeDate)} has passed: update the deal` : `closes ${day(d0!.closeDate)}`) : null;
  const dealBits = [stage, money, closes].filter(Boolean).join(', ');
  const stateLine = [brief.glance.fit, m.type === 'IN_DEAL' ? (dealBits ? `In a deal (${dealBits})` : STATE[m.type]) : STATE[m.type], owner ? `Owner: ${owner}` : null].filter(Boolean).join(' · ');
  // LAST TOUCH: the newest thing that happened (a sent email, a reply, a meeting, a field note), and how long ago.
  // GAP's own first touches count too (they live in the GAP ledger, not the legacy email log).
  const gapTouch = [...(i.firstTouches ?? [])].filter((t) => t.sentAt && t.state !== 'draft outstanding').sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)))[0];
  const ltHist = ctx.history.find((h) => h.visibility === 'seller' && h.kind !== 'outcome');
  const lt = gapTouch && (!ltHist || String(gapTouch.sentAt) > ltHist.at) ? { at: String(gapTouch.sentAt), text: `GAP first touch to ${gapTouch.recipient}` } : ltHist;
  // The reply is shown once (round 4: GXO's reply was both "Last touch" and "Latest buyer reply").
  const ltIsReply = !!lt && 'kind' in lt && lt.kind === 'reply';
  const lastTouch = lt ? `Last touch ${day(lt.at)} (${ago(lt.at)} days ago): ${ltIsReply ? 'their reply, below.' : lt.text}` : 'No touch on record.';
  // The newest thing the BUYER wrote, whenever it was: it is never buried below the fold of BRIEF.
  const rep = ctx.history.find((h) => h.kind === 'reply');
  const lastReply = rep ? `Latest buyer reply ${day(rep.at)} (${ago(rep.at)} days ago): ${rep.text.replace(/^Reply from\s+/, '')}` : null;
  const view: NowView = {
    name: brief.accountName,
    stateLine,
    lastTouch,
    lastReply,
    unit: brief.division ? `Division: unknown. ${brief.division.question}` : null,
    next,
    who,
    betterFit,
    addToGap,
    outstandingDraft,
    historical,
    blocked,
    whoUnknown: ownerMissing ? 'No US / North America transportation operations owner on record yet: find them (BRIEF: buyer map).' : whoUnknown,
    alternate: alt,
    whyNow,
    gap,
    currentState,
    know,
    think,
    impact,
    ask,
    ownerFirst,
    replyThread: unanswered && !soon ? unanswered.who : null,
    // "Last email" is the Last touch line's job; a second, older answer beside it contradicted it (round 4, Kroger).
    relationship: m.type === 'INTRO_ONLY' || /^Last email /.test(ctx.relationship.line ?? '') ? null : ctx.relationship.line,
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
    v.unit,
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
