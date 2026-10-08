/**
 * ACCOUNT STORY (account-first UX, UX-05, 2026-10-06): what is going on at the account, what has already happened
 * between us and them, and why that leads to this person now, in a few tagged lines beside NEXT. ONE derived
 * projection over readers GAP already has (the brief, buyer inputs, the context history, the reply class, clawd's
 * outreach history, the vault note, the pursuit state): no table, no model call, no second recommendation authority.
 *
 *   rows        WHAT HAS HAPPENED BETWEEN US, THEIR GOAL (only in the buyer's words), WHAT IS CHANGING (program
 *               statements and catalysts, the relevant ones first), NETWORK IMPLICATION (only when it adds a
 *               sentence), YARD OPPORTUNITY, WHAT WE NEED TO LEARN (one line), STORIES THAT MATTER (collapsed),
 *               YOUR NOTE; each present only with a basis
 *   tags        every SENTENCE carries Buyer said / Checked / Unverified / Our read / Unknown / Contradicted and its
 *               basis ids; a row takes the WEAKEST class of its sentences; a line with no basis is Our read or
 *               Unknown; YARD OPPORTUNITY is Our read with its Wrong if unless the buyer confirmed it; a Checked
 *               line whose money figure does not parse ("$175 new facility") is downgraded to Unverified
 *   voice       a source's first-person sentence is attributed ("FedEx says: ..."), never read as GAP's claim; no
 *               dateline, no machine note; one idea once across the rows
 *   rise        an Unverified item that names the chosen person's unit or a divestiture rises beside the person as
 *               "check before contacting" (FedEx: the CMA CGM sale of FedEx Supply Chain against Courtney Keen)
 *   never       private engagement (microsite sessions, ROI reads) is not a row and is not read aloud; the story
 *               feeds the opening but is not the email
 *
 * Pure; pinned by tests/unit/gap/story-projection.test.ts.
 */
import type { AccountInputs, AccountIntelligenceBrief } from '../account-intel/build';
import type { Statement } from '../account-intel/truth';
import { sellerLine, type NowLine, type SellerTag } from '../context/now';
import { sensitivityOf } from '../research/sensitivity';
import { sameIdea } from '../context/same-idea';
import { sellerRelevance } from '../research/continuity';
import type { PursuitState } from '../pursuit/state';
import type { StoryTouch } from './touches';
import { isCostBid } from '../bid/cost';
import { isReplyKindClass, REPLY_KIND_WORDS } from '../capture/reply-kind';

export type StoryTag = SellerTag;

/** Strongest to weakest: a row takes the weakest class of its sentences. */
export const STRENGTH: Record<StoryTag, number> = { 'Buyer said': 0, 'You noted': 0.5, Checked: 1, 'Our read': 2, Unverified: 3, Unknown: 4, Contradicted: 5 };
export const weakestTag = (tags: readonly StoryTag[]): StoryTag => tags.reduce((w, t) => (STRENGTH[t] > STRENGTH[w] ? t : w), tags[0] ?? 'Unknown');

export interface StorySentence {
  text: string;
  tag: StoryTag;
  /** Where it comes from, in words. */
  basis: string;
  /** The ids behind it ("evidence:f1", "bid:b1", "hypothesis:h1", "signal:s1", "touch:2026-06-01"). */
  basisIds: string[];
  cite?: NowLine['cite'];
}

export type StoryRowKey = 'between_us' | 'goal' | 'changing' | 'network' | 'yard' | 'learn' | 'stories' | 'note';

export interface StoryRow {
  key: StoryRowKey;
  label: string;
  tag: StoryTag;
  sentences: StorySentence[];
  /** YARD OPPORTUNITY under Our read: what would make it wrong. */
  wrongIf: string | null;
  /** STORIES THAT MATTER opens on request. */
  collapsed: boolean;
}

export interface AccountStory {
  rows: StoryRow[];
  /** The rows the 820 second screen must hold (between us, what is changing, the yard opportunity), in order. */
  first: StoryRow[];
  /** Unverified items that name the chosen person's unit: beside the person, before the stack. */
  checkBeforeContacting: StorySentence[];
  /** A set-aside (divested unit) that rests on an unverified report: said under the stack's set-aside line. */
  setAsideCaveats: StorySentence[];
}

export interface StoryInput {
  accountName: string;
  now: Date;
  state: PursuitState;
  brief: AccountIntelligenceBrief;
  /** R63-B S9: the open deals and the last recorded conversation feed "what has happened between us" too. */
  inputs: Pick<AccountInputs, 'facts' | 'bids' | 'domains' | 'account' | 'signals'> & Partial<Pick<AccountInputs, 'opportunity' | 'conversation'>>;
  /** R63-B S9: the meeting on the calendar ahead (context relationship), when one is booked. */
  booked?: { at: string; what: string } | null;
  /** NOW's own WHY NOW and KNOW lines (already filtered: no market chatter, no imagery, one idea once). */
  whyNow: NowLine[];
  know: NowLine[];
  touches: StoryTouch[];
  clawdRead: 'ok' | 'unavailable' | 'not_configured';
  /** The vault's account note, when one exists (seller-visible, never quotable, never read aloud). */
  vaultNote: { text: string; at: string | null } | null;
  /** The resolver's set-aside people (serializable), for the divested-unit rise; a first-party source when the company announced it. */
  excluded: Array<{ key: string; name: string; title: string | null; code: string; reason: string; source?: { url: string; publisher: string; quote: string; publishedAt: string } | null }>;
}

export const STORY_LABEL: Record<StoryRowKey, string> = {
  between_us: 'What has happened between us',
  goal: 'Their goal',
  changing: 'What is changing',
  network: 'Network implication',
  yard: 'Yard opportunity',
  learn: 'What we need to learn',
  stories: 'Stories that matter',
  note: 'Your note',
};

const day = (s: string | null | undefined) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'undated');
const dayYear = (s: string | null | undefined) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'undated');
/** Seller prose: no machine label, no press-release dateline ("CINCINNATI -- "), no "(current as of ...)" note. */
const sentence = (t: string) => {
  const s = t
    .replace(/^[A-Z][A-Z /]+:\s*/, '')
    .replace(/^\s*[A-Z][A-Z .,'-]{2,40}(?:--|\s[-–—]\s?)(?:\(\s*[\w ]+\s*\)\s*-*)?\s*/, '')
    .replace(/\s*\(current as of [^)]*\)\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  // A story sentence is a summary line: a long filing sentence is cut at a word (the full text stays in SOURCES).
  const cut = cap.length > STORY_SENTENCE_MAX ? `${cap.slice(0, STORY_SENTENCE_MAX).replace(/\s+\S*$/, '').replace(/[,;:]$/, '')}...` : cap;
  return /[.!?]$/.test(cut) ? cut : `${cut}.`;
};
export const STORY_SENTENCE_MAX = 200;
/** The same money and a shared name is the same project however the two sources word it ("$300 million ... Greater Cincinnati" and "$300M project in Cincinnati-Dayton"). */
const money = (t: string) => (t.match(/\$\s?(\d+(?:\.\d+)?)\s*(m\b|million|b\b|billion)/gi) ?? []).map((m) => m.toLowerCase().replace(/\s+/g, '').replace(/million/, 'm').replace(/billion/, 'b'));
const properNouns = (t: string, account: string) => {
  const own = new Set(account.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  return new Set((t.match(/\b[A-Z][a-zA-Z]{3,}\b/g) ?? []).map((w) => w.toLowerCase()).filter((w) => !own.has(w)));
};
const sameProject = (a: string, b: string, account: string) => {
  const ma = money(a);
  if (!ma.length || !ma.some((m) => money(b).includes(m))) return false;
  const pb = properNouns(b, account);
  return [...properNouns(a, account)].some((w) => pb.has(w));
};
/** The same deal named by the same counterparty ("acquire Giant Eagle" and "Agreement to Acquire Giant Eagle") is one idea. */
const DEAL_WORD = /\b(acqui|merg|sell|sale|sold|divest|spin|buy|purchas|partner|agreement)/i;
const properPairs = (t: string, account: string) => {
  const own = new Set(account.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  // Every adjacent pair of capitalised words (overlapping: "Acquire Giant Eagle" yields "giant eagle" too).
  const words = t.replace(/[^A-Za-z&.\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const pairs: string[] = [];
  for (let k = 0; k + 1 < words.length; k += 1) if (/^[A-Z][A-Za-z&.-]{2,}$/.test(words[k]) && /^[A-Z][A-Za-z&.-]{2,}$/.test(words[k + 1])) pairs.push(`${words[k]} ${words[k + 1]}`.toLowerCase());
  return new Set(pairs.filter((p) => !p.split(/\s+/).every((w) => own.has(w))));
};
const sameDeal = (a: string, b: string, account: string) => {
  if (!DEAL_WORD.test(a) || !DEAL_WORD.test(b)) return false;
  const pb = properPairs(b, account);
  return [...properPairs(a, account)].some((p) => pb.has(p));
};
const sameText = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const row = (key: StoryRowKey, sentences: StorySentence[], over: Partial<StoryRow> = {}): StoryRow => ({ key, label: STORY_LABEL[key], tag: weakestTag(sentences.map((s) => s.tag)), sentences, wrongIf: null, collapsed: false, ...over });

/** A dollar figure with no magnitude and no thousands ("$175 new refrigerated facility"): the quote lost a word. */
const BROKEN_MONEY = /\$\s?\d{1,3}(?:\.\d+)?\s+(?!(?:m|b|k|mm|bn|million|billion|thousand|per|a|an|each|to)\b)[a-z]/i;
/** A source speaking in the first person ("we are redesigning our network"): attributed, never GAP's own claim. */
const FIRST_PERSON = /\b(we|we're|our|ours|us)\b/i;

/** A seller sentence from a NOW line: attributed when the source speaks as itself; downgraded when its number is broken. */
function fromLine(l: NowLine, accountName: string): StorySentence {
  let text = sentence(l.text);
  let tag = l.tag;
  let basis = l.basis;
  if (FIRST_PERSON.test(text)) text = `${accountName} says: "${text.replace(/\.$/, '')}."`;
  if (tag === 'Checked' && BROKEN_MONEY.test(text)) {
    tag = 'Unverified';
    basis = `${basis}; the dollar figure does not parse, check the source before using it`;
    text = text.replace(/\$\s?\d{1,3}(?:\.\d+)?(?=\s)/, '[figure unverified]');
  }
  return { text, tag, basis, basisIds: [l.id], cite: tag === 'Unverified' ? null : l.cite };
}

/** A program or a stated goal, not a one-day event. */
const GOAL = /\b(program|programme|initiative|plan(?:s|ned|ning)?|redesign|moderni[sz]|transform|invest(?:s|ing|ment)?|expan(?:d|sion)|consolidat|roadmap|strategy|target(?:s|ing)?|goal|aims?|commit(?:s|ted|ment)|network 2\.0|optimi[sz]|merger|acqui(?:re|sition))\b/i;
/** A sale, a divestiture, an acquisition: the item a person's unit may be named by. */
const DIVEST = /\b(sell|sale|sold|divest(?:s|ed|iture|ing)?|spin[- ]?off|acqui(?:re|res|red|sition)|merg(?:e|er|ed)|carve[- ]?out|transfer(?:s|red)?)\b/i;
const GENERIC = new Set(['the', 'and', 'inc', 'corp', 'llc', 'group', 'company', 'director', 'managing', 'senior', 'vice', 'president', 'head', 'chief', 'officer', 'manager', 'vp', 'svp', 'evp', 'north', 'america', 'global', 'operations', 'transportation', 'logistics', 'supply', 'chain', 'with', 'from', 'into', 'for']);

/** The distinctive unit words in a title or division ("FedEx Supply Chain" -> "fedex supply chain" as a phrase, plus "supply chain"). */
function unitPhrases(title: string | null, accountName: string): string[] {
  if (!title) return [];
  const acct = accountName.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim().split(/\s+/)[0];
  const parts = title.split(/[,;|/()]+|\s[-–—]\s/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const words = p.toLowerCase().replace(/[^a-z0-9& ]+/g, ' ').trim().split(/\s+/).filter((w) => w.length > 2);
    // A unit named with the account's own brand ("FedEx Supply Chain", "PBNA") is the strongest cue.
    if (acct && words.includes(acct) && words.length >= 2) out.push(words.join(' '));
    const distinct = words.filter((w) => !GENERIC.has(w) && w !== acct);
    // Two-word unit names ("supply chain" is generic on its own, but "fedex supply chain" above already matched);
    // an acronym (PBNA, FXG) is a unit cue on its own.
    for (const w of distinct) if (/^[a-z]{3,5}$/.test(w) && w === w.toLowerCase() && p.includes(w.toUpperCase())) out.push(w);
    if (words.length >= 2 && words.length <= 4 && !words.every((w) => GENERIC.has(w))) out.push(words.join(' '));
  }
  return [...new Set(out)];
}
const names = (text: string, phrases: string[]) => {
  const t = text.toLowerCase();
  return phrases.some((p) => p.length >= 4 && t.includes(p));
};

export function projectStory(i: StoryInput): AccountStory {
  const live = i.inputs.facts.filter((f) => !f.expiresAt || new Date(f.expiresAt).getTime() > i.now.getTime());
  const citable = new Set(live.filter((f) => !sensitivityOf(f.quote)).flatMap((f) => [f.id, ...(f.sameQuoteIds ?? [])]));
  const lx = { domains: i.inputs.domains, accountName: i.inputs.account.name, citable };
  // Each idea once across the rows, also when two sources say it in different words (Walmart: the $300M Cincinnati
  // center as a checked goal and as an unverified signal).
  const used = new Set<string>();
  const said: string[] = [];
  const take = (id: string, text = '') => {
    if (used.has(id) || (text && said.some((t) => sameIdea(t, text, i.accountName) || sameProject(t, text, i.accountName) || sameDeal(t, text, i.accountName)))) return false;
    used.add(id);
    if (text) said.push(text);
    return true;
  };
  const line = (l: NowLine) => fromLine(l, i.accountName);
  // Sprint 5 review (R50): a buyer sentence says whose words and, at an account with deals, which opportunity.
  // R63-A S5: a paraphrase the seller noted is "you noted they said", tagged as such, never "Buyer said".
  const saidBy = (b: { who: string | null; at: string; scope?: string | null; noted?: boolean }) => `${b.noted ? 'you noted they said' : 'buyer said'}, ${b.who ?? 'the buyer'}, ${day(b.at)}${b.scope ? `; ${b.scope}` : ''}`;
  const tagOf = (b: { noted?: boolean }): StoryTag => (b.noted ? 'You noted' : 'Buyer said');
  const rows: StoryRow[] = [];

  // WHAT HAS HAPPENED BETWEEN US: the last person touched with their title, what came back, the count.
  rows.push(betweenUs(i));

  // THEIR GOAL: only in the buyer's words (a future-state or priority input); a program statement is a change.
  const goalBid = i.inputs.bids.find((b) => b.type === 'future_state' || b.type === 'priority');
  if (goalBid) {
    rows.push(row('goal', [{ text: sentence(goalBid.summary), tag: tagOf(goalBid), basis: saidBy(goalBid), basisIds: [`bid:${goalBid.id}`] }]));
    used.add(`bid:${goalBid.id}`);
  }

  // WHAT IS CHANGING: the program statements and NOW's why-now lines, checked before unverified, the relevant before
  // the incidental (a merger before a uniform story), two sentences, each with its own tag.
  const catalysts: Array<{ s: Statement; l: NowLine }> = i.brief.sections.catalysts.statements
    .filter((s) => s.truth !== 'CONTRADICTED' && !/^ENDED/.test(s.text))
    .map((s) => ({ s, l: sellerLine(s, 'catalysts', lx) }))
    .filter((x): x is { s: Statement; l: NowLine } => !!x.l)
    .map((x) => (x.s.sources[0]?.kind === 'signal' ? { s: x.s, l: { ...x.l, id: `signal:${x.s.sources[0].ref ?? x.l.id}`, tag: 'Unverified' as const, text: x.l.text.replace(/^Signal, not verified:\s*/, '').replace(/\s*\((?:shared )?[0-9a-z ,-]+\)$/i, ''), basis: `a third party's report, not checked; ${day(x.s.sources[0].at)}` } } : x));
  const rawRank = (l: NowLine) => sellerRelevance(l.text.replace(/^[A-Z][A-Z /]+:\s*/, '')).rank;
  const programs = catalysts.map((x) => x.l).filter((l) => GOAL.test(l.text) && rawRank(l) <= 6);
  // A program statement (a merger that combines networks, a multi-year investment) is a change worth telling even
  // when the relevance heuristic files it as broad corporate context; an incidental headline never outranks it.
  const programIds = new Set(programs.map((l) => l.id));
  const rank = (l: NowLine) => (programIds.has(l.id) ? Math.min(rawRank(l), 4) : rawRank(l));
  // The seller sentence is built first, so a Checked line downgraded for a broken number sorts as Unverified.
  const candidates = [...programs, ...i.whyNow]
    .filter((l, k, a) => a.findIndex((y) => y.id === l.id) === k)
    .map((l) => ({ l, s: line(l) }))
    .sort((a, b) => STRENGTH[a.s.tag] - STRENGTH[b.s.tag] || rank(a.l) - rank(b.l));
  const relevantExists = candidates.some((c) => rank(c.l) <= 4);
  // What the company itself announced (the entity boundaries' first-party releases) and every checked line: an
  // unverified report of the same deal is never told beside or instead of them.
  const firstParty = i.excluded.map((e) => e.source?.quote).filter((q): q is string => !!q);
  const checkedTexts = [...firstParty, ...catalysts.filter((x) => x.l.tag === 'Checked').map((x) => x.l.text)];
  const reportedChecked = (text: string) => checkedTexts.some((t) => sameDeal(t, text, i.accountName) || sameProject(t, text, i.accountName));
  const changing: StorySentence[] = [];
  for (const c of candidates) {
    if (changing.length >= 2) break;
    // An incidental item (rank 5 and up: a uniform story, legal text) never leads over a network or site change.
    if (relevantExists && rank(c.l) >= 5) continue;
    if (c.s.tag === 'Unverified' && reportedChecked(c.l.text)) continue;
    if (take(c.l.id, c.l.text)) changing.push(c.s);
  }
  if (changing.length) rows.push(row('changing', changing));

  // NETWORK IMPLICATION and YARD OPPORTUNITY: the top grounded angle (never an ungrounded draft), or the buyer's words.
  const top = i.brief.hypotheses.find((h) => h.grounded && h.truth !== 'CONTRADICTED') ?? null;
  const obs = top ? sentence(top.observation.text).replace(/\.$/, '') : '';
  // The inference and the problem are often one sentence in an approved angle: NETWORK shows only when it adds one.
  if (top && !sameText(top.inference, top.problem)) {
    const review = top.needsReview.length ? '; the angle needs your review' : '';
    rows.push(row('network', [{ text: sentence(top.inference), tag: 'Our read', basis: `our inference from: ${obs.length > 110 ? `${obs.slice(0, 107).trimEnd()}...` : obs}${review}`, basisIds: [`hypothesis:${top.id}`, ...(top.observation.verified && i.inputs.facts.some((f) => f.quote === top.observation.text) ? [`evidence:${i.inputs.facts.find((f) => f.quote === top.observation.text)!.id}`] : [])] }]));
  }
  const problemBid = i.inputs.bids.find((b) => b.type === 'business_problem');
  // Sprint 5 review: what it costs them is an impact, or a number in money or detention terms (bid/cost.ts).
  const impactBid = i.inputs.bids.find((b) => b.type === 'impact') ?? i.inputs.bids.find((b) => isCostBid(b));
  if (problemBid) {
    const s: StorySentence[] = [{ text: sentence(problemBid.summary), tag: tagOf(problemBid), basis: saidBy(problemBid), basisIds: [`bid:${problemBid.id}`] }];
    if (impactBid) s.push({ text: sentence(impactBid.summary), tag: tagOf(impactBid), basis: saidBy(impactBid), basisIds: [`bid:${impactBid.id}`] });
    rows.push(row('yard', s));
  } else if (top) {
    // "Wrong if: If trailers..." doubles the word; the clause starts after it.
    const wrongIf = top.wrongIf ? top.wrongIf.split(/(?<=\.)\s/)[0].replace(/^If\s+/i, (m) => m.toLowerCase()) : null;
    rows.push(row('yard', [{ text: sentence(top.problem), tag: 'Our read', basis: 'our read; not confirmed by the buyer', basisIds: [`hypothesis:${top.id}`] }], { wrongIf }));
  }

  // WHAT WE NEED TO LEARN: one Unknown line naming what the buyer has not said (the ASK slot carries the question).
  const bid = (t: string) => i.inputs.bids.some((b) => b.type === t);
  const missing = [!bid('current_state') ? 'how they run the yards today' : null, !i.inputs.bids.some((b) => isCostBid(b)) ? 'what it costs them' : null, !bid('root_cause') && !top?.rootCause ? 'why it happens' : null].filter((x): x is string => !!x);
  if (missing.length) {
    const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} or ${missing[missing.length - 1]}`;
    // R63-B S9: the basis reads the same record as "what has happened between us": their words on record that do not
    // cover these are said as such, never "no buyer input on record".
    const words = happenedSoFar(i).buyerWords;
    const basis = words.count ? `the buyer's ${words.count === 1 ? 'statement' : `${words.count} statements`} on record ${words.count === 1 ? 'does' : 'do'} not cover ${missing.length === 1 ? 'this' : 'these'}` : 'no buyer input on record';
    rows.push(row('learn', [{ text: `Nothing from the buyer yet on ${list}.`, tag: 'Unknown', basis, basisIds: [] }]));
  }

  // STORIES THAT MATTER: the checked lines not already told, with their cite status, collapsed.
  const stories = [...i.know, ...catalysts.map((x) => x.l).filter((l) => l.tag === 'Checked')].filter((l) => take(l.id, l.text)).slice(0, 4).map(line);
  if (stories.length) rows.push(row('stories', stories, { collapsed: true }));

  // YOUR NOTE: the vault's account note (seller-visible, never quotable, never read aloud).
  if (i.vaultNote?.text.trim()) rows.push(row('note', [{ text: sentence(i.vaultNote.text.replace(/<[^>]+>/g, '')), tag: 'Our read', basis: `your vault note${i.vaultNote.at ? `, ${day(i.vaultNote.at)}` : ''}; never quote it to the buyer`, basisIds: ['vault:account-note'] }]));

  // CHECK BEFORE CONTACTING: an Unverified sale or divestiture that names the chosen person's unit, and any
  // set-aside that rests on it.
  const checkBeforeContacting: StorySentence[] = [];
  // A sale or divestiture on record: a checked line (or the company's own release) outranks a third party's report.
  const divestLines = catalysts.filter((x) => DIVEST.test(x.l.text) && (x.l.tag === 'Unverified' || x.l.tag === 'Checked')).sort((a, b) => STRENGTH[a.l.tag] - STRENGTH[b.l.tag]);
  const p = i.state.person;
  if (p && p.title && divestLines.length) {
    const phrases = unitPhrases(p.title, i.accountName);
    const hits = divestLines.filter((x) => names(x.l.text, phrases));
    const best = hits.find((x) => x.l.tag === 'Checked') ?? hits[0];
    if (best) {
      const checked = best.l.tag === 'Checked';
      checkBeforeContacting.push({ text: `Check before contacting ${p.name}: ${sentence(best.l.text)} It names their unit (${p.title})${checked ? '; confirm their employer before any touch' : ' and is not verified'}.`, tag: checked ? 'Checked' : 'Unverified', basis: best.l.basis, basisIds: [best.l.id] });
    }
  }
  const setAsideCaveats: StorySentence[] = [];
  const named = (people: typeof i.excluded) => {
    const n = people.slice(0, 3).map((e) => `${e.name}${e.title && people.length === 1 ? `, ${e.title}` : ''}`);
    return people.length > 3 ? `${n.join(', ')} and ${people.length - 3} more` : n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0];
  };
  const divested = i.excluded.filter((e) => e.code === 'divested_entity');
  // The company's own release: one Checked sentence per release, the set-aside stands on it.
  const bySource = new Map<string, { source: NonNullable<(typeof divested)[number]['source']>; people: typeof i.excluded }>();
  for (const e of divested) {
    if (!e.source) continue;
    const g = bySource.get(e.source.url) ?? { source: e.source, people: [] };
    g.people.push(e);
    bySource.set(e.source.url, g);
  }
  for (const { source, people } of bySource.values()) {
    setAsideCaveats.push({ text: `${named(people)} ${people.length === 1 ? 'is' : 'are'} set aside as a divested unit: ${sentence(source.quote.replace(/\s*\((?:NYSE|NASDAQ)[^)]*\)/g, '').replace(/\btoday announced\b/, `announced on ${day(source.publishedAt)}`))}`, tag: 'Checked', basis: `${source.publisher}, ${day(source.publishedAt)}`, basisIds: [`first-party:${source.url}`, ...people.map((e) => `set-aside:${e.key}`)] });
  }
  // A set-aside with no first-party source: it rests on whatever report names the unit, said with that report's tag.
  const unverifiedDivest = divestLines.filter((x) => x.l.tag === 'Unverified');
  const byBacking = new Map<string, { backing: (typeof divestLines)[number]; people: typeof i.excluded }>();
  for (const e of divested.filter((e) => !e.source)) {
    const backing = unverifiedDivest.find((x) => names(x.l.text, unitPhrases(e.title, i.accountName)) || names(e.reason, unitPhrases(e.title, i.accountName)));
    if (!backing) continue;
    const g = byBacking.get(backing.l.id) ?? { backing, people: [] };
    g.people.push(e);
    byBacking.set(backing.l.id, g);
  }
  // People set aside on the same report are one sentence, never one per person.
  for (const { backing, people } of byBacking.values()) {
    setAsideCaveats.push({ text: `${named(people)} ${people.length === 1 ? 'is' : 'are'} set aside as a divested unit; that rests on an unverified report (${sentence(backing.l.text).replace(/\.$/, '')}).`, tag: 'Unverified', basis: backing.l.basis, basisIds: [backing.l.id, ...people.map((e) => `set-aside:${e.key}`)] });
  }

  const order: StoryRowKey[] = ['between_us', 'changing', 'yard'];
  // Reading order: between us, the buyer's own goal, what is changing, the network read, the yard opportunity, what
  // to learn, the stories, the note.
  const ROW_ORDER: StoryRowKey[] = ['between_us', 'goal', 'changing', 'network', 'yard', 'learn', 'stories', 'note'];
  rows.sort((a, b) => ROW_ORDER.indexOf(a.key) - ROW_ORDER.indexOf(b.key));
  return { rows, first: order.map((k) => rows.find((r) => r.key === k)).filter((r): r is StoryRow => !!r), checkBeforeContacting, setAsideCaveats };
}

/**
 * R63-B S9: ONE reader for "has anything happened between us". Kroger's page said "Nothing has happened between us
 * yet" and "no buyer input on record" while it quoted the buyer twice, held two open deals and a meeting tomorrow:
 * the row read only the email ledgers. This reads the touches (emails, replies, a meeting that took place), the buyer's
 * own words on record, the last recorded conversation, the open deals and a meeting ahead; the between-us row and
 * the learn row both read it.
 */
export interface HappenedSoFar {
  /** Emails, replies and meetings that took place (the ledgers and the account history). */
  touched: boolean;
  buyerWords: { count: number; newest: { who: string | null; at: string } | null; ids: string[] };
  conversation: { who: string; responseClass: string; at: string } | null;
  deals: Array<{ id: string | null; name: string }>;
  booked: { at: string; what: string } | null;
  any: boolean;
}

export function happenedSoFar(i: Pick<StoryInput, 'touches' | 'inputs' | 'booked' | 'now'>): HappenedSoFar {
  const touched = i.touches.some((x) => x.kind !== 'meeting' || (new Date(x.at).getTime() <= i.now.getTime() && !/\bcancel(?:l)?ed\b/i.test(x.what)));
  const bids = [...i.inputs.bids].sort((a, b) => b.at.localeCompare(a.at));
  const opp = i.inputs.opportunity;
  const deals = opp?.status === 'ACTIVE' ? opp.deals.map((d) => ({ id: d.id ?? null, name: d.name ?? 'an unnamed deal' })) : [];
  const ahead = i.touches.find((x) => x.kind === 'meeting' && new Date(x.at).getTime() > i.now.getTime() && !/\bcancel(?:l)?ed\b/i.test(x.what));
  const booked = i.booked ?? (ahead ? { at: ahead.at, what: ahead.what.replace(/^Meeting \([^)]*\):?\s*/, '') } : null);
  const conversation = i.inputs.conversation ?? null;
  return {
    touched,
    buyerWords: { count: bids.length, newest: bids[0] ? { who: bids[0].who, at: bids[0].at } : null, ids: bids.map((b) => `bid:${b.id}`) },
    conversation,
    deals,
    booked,
    any: touched || bids.length > 0 || !!conversation || deals.length > 0 || !!booked,
  };
}

function betweenUs(i: StoryInput): StoryRow {
  const t = i.touches;
  if (!t.length) {
    // R63-B S9: no email or meeting on record is not "nothing happened" when a deal, their words or a meeting are.
    const other = beyondTouches(i);
    if (other.length) return row('between_us', other);
    return i.clawdRead === 'ok'
      ? row('between_us', [{ text: 'No touch on record between us.', tag: 'Checked', basis: 'GAP, clawd and the account history: nothing found', basisIds: [] }])
      : row('between_us', [{ text: i.clawdRead === 'not_configured' ? "No touch in GAP's own records; clawd's send history is not connected here." : "No touch in GAP's own records; clawd's send history could not be read.", tag: 'Unknown', basis: 'GAP and the account history only', basisIds: [] }]);
  }
  const s: StorySentence[] = [];
  const who = (x: StoryTouch) => `${x.name}${x.title ? `, ${x.title}` : ''}`;
  const sends = t.filter((x) => x.kind === 'send' || x.kind === 'asset');
  const last = sends[0] ?? null;
  const lastReply = t.find((x) => x.kind === 'reply') ?? null;
  // Silence is judged against the LAST email: an older reply (FedEx: a June automatic notice before an August send)
  // does not answer it.
  const answered = !!lastReply && (!last || lastReply.at > last.at);
  // R63-B S2: an email that went to a person after they opted out carries that fact beside it (it is history, and it
  // must never read as ordinary silence).
  const firstName = (x: StoryTouch) => (x.address ? x.address.split('@')[0] : x.name).toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ')[0] ?? '';
  const optedOutBefore = last && lastReply?.replyKind === 'opt_out' && lastReply.at < last.at && firstName(lastReply) === firstName(last) ? lastReply : null;
  if (last) {
    const subject = last.what.replace(/^Re:\s*/i, '').replace(/^["“]+|["”]+$/g, '').trim();
    const what = subject === 'GAP first touch' ? ' (a GAP first touch)' : subject && subject !== 'email' ? `: "${subject}"` : '';
    const silence = optedOutBefore ? ` Sent after they opted out on ${day(optedOutBefore.at)}: nothing else goes to them.` : !answered ? (i.clawdRead === 'ok' ? ' No answer on record.' : " No answer in GAP's records (clawd's history could not be read).") : '';
    s.push({ text: `Last email to ${who(last)}, ${day(last.at)}${what}.${silence}`, tag: !optedOutBefore && !answered && i.clawdRead !== 'ok' ? 'Unknown' : 'Checked', basis: `${last.source}, ${day(last.at)}${optedOutBefore ? `; their opt-out, ${day(optedOutBefore.at)}` : !answered && i.clawdRead === 'ok' ? '; GAP, clawd and the account history for the silence' : ''}`, basisIds: [`touch:${last.at}`, ...(optedOutBefore ? [`touch:${optedOutBefore.at}`] : [])] });
  }
  if (lastReply) {
    const k = lastReply.replyKind ?? 'human';
    // The email a reply answered is not always in GAP's ledgers (Walmart's opt-out answered a Resend-era send).
    const sentTo = sends.some((x) => x.name.toLowerCase() === lastReply.name.toLowerCase() && x.at < lastReply.at);
    const orphan = sentTo ? '' : " The email it answered is not in GAP's ledgers.";
    const text =
      k === 'opt_out' ? `${who(lastReply)} opted out on ${day(lastReply.at)}${lastReply.what ? ` ("${lastReply.what}")` : ''}.${orphan}`
      : k === 'out_of_office' ? `${who(lastReply)} sent an automatic reply on ${day(lastReply.at)}: not an answer.`
      : k === 'bounce' ? `The address for ${who(lastReply)} failed on ${day(lastReply.at)}.`
      : `${who(lastReply)} replied on ${day(lastReply.at)}: "${lastReply.what}".${orphan}`;
    s.push({ text, tag: k === 'opt_out' || k === 'human' ? 'Buyer said' : 'Checked', basis: `${lastReply.source}, ${day(lastReply.at)}`, basisIds: [`touch:${lastReply.at}`] });
  }
  const people = new Set(sends.map((x) => x.name.toLowerCase()));
  if (sends.length >= 2) {
    const oldest = sends[sends.length - 1];
    const sources = [...new Set(sends.map((x) => x.source))].map((x) => x.replace(' ledger', '')).join(' and ');
    s.push({ text: `${sends.length} emails to ${people.size} ${people.size === 1 ? 'person' : 'people'} since ${dayYear(oldest.at)}.`, tag: 'Checked', basis: `${sources}`, basisIds: sends.map((x) => `touch:${x.at}`) });
  }
  // Sprint 5 review: only a meeting that took place has happened between us: a future one (prepared on the brief) or a
  // canceled one (said on Work) is not told here as Checked history; the history's own "Meeting (status):" prefix is
  // not repeated.
  const meeting = t.find((x) => x.kind === 'meeting' && new Date(x.at).getTime() <= i.now.getTime() && !/\bcancel(?:l)?ed\b/i.test(x.what));
  if (meeting) s.push({ text: `Meeting ${day(meeting.at)}: ${meeting.what.replace(/^Meeting \([^)]*\):?\s*/, '').replace(/\.$/, '') || 'held'}.`, tag: 'Checked', basis: `account history, ${day(meeting.at)}`, basisIds: [`touch:${meeting.at}`] });
  if (!s.length) {
    // R63-B S9: the same reader as the learn row: an open deal, their words, a recorded conversation, a meeting ahead.
    const other = beyondTouches(i);
    if (other.length) return row('between_us', other);
    const booked = happenedSoFar(i).booked;
    s.push({ text: booked ? `Nothing has happened between us yet; a meeting is booked for ${day(booked.at)}.` : 'Nothing has happened between us yet.', tag: 'Checked', basis: 'GAP and the account history', basisIds: booked ? [`touch:${booked.at}`] : [] });
  }
  return row('between_us', s);
}

/**
 * What has happened beyond the email ledgers (happenedSoFar) as between-us sentences: an open deal, a recorded
 * conversation, their words, and then a meeting ahead; empty when none of the first three has (a meeting ahead alone
 * keeps "Nothing has happened between us yet; a meeting is booked").
 */
function beyondTouches(i: StoryInput): StorySentence[] {
  const h = happenedSoFar(i);
  if (!h.deals.length && !h.conversation && !h.buyerWords.count) return [];
  const out: StorySentence[] = [];
  if (h.deals.length) out.push({ text: h.deals.length === 1 ? `In an open deal: ${h.deals[0].name}.` : `In ${h.deals.length} open deals: ${h.deals.map((d) => d.name).join('; ')}.`, tag: 'Checked', basis: 'HubSpot, read now', basisIds: h.deals.map((d) => `deal:${d.id ?? d.name}`) });
  if (h.conversation) {
    const what = isReplyKindClass(h.conversation.responseClass) ? REPLY_KIND_WORDS[h.conversation.responseClass].replace(/^They /, 'they ') : 'a conversation';
    out.push({ text: `A conversation is recorded with ${h.conversation.who} on ${day(h.conversation.at)}: ${what}.`, tag: 'Checked', basis: `your recorded conversation, ${day(h.conversation.at)}`, basisIds: [`conversation:${h.conversation.at}`] });
  }
  if (h.buyerWords.count && h.buyerWords.newest) {
    const n = h.buyerWords.count;
    out.push({ text: `Their own words are on record: ${n === 1 ? 'one statement' : `${n} statements`}, the newest from ${h.buyerWords.newest.who ?? 'the buyer'} on ${day(h.buyerWords.newest.at)}.`, tag: 'Checked', basis: 'the buyer inputs you confirmed', basisIds: h.buyerWords.ids });
  }
  if (h.booked) out.push({ text: `A meeting is booked for ${day(h.booked.at)}: ${h.booked.what.replace(/\.$/, '')}.`, tag: 'Checked', basis: `the calendar, ${day(h.booked.at)}`, basisIds: [`touch:${h.booked.at}`] });
  return out;
}

/**
 * What Listen reads for the story: the rows with their tags in words; never the vault note, never the private line.
 * A sentence that already says it is unverified or unknown does not get the tag repeated after it.
 */
export function storyListenText(story: AccountStory): string {
  const spoken = (s: StorySentence) => {
    const bare = s.text.replace(/\.$/, '');
    const saysIt = (s.tag === 'Unverified' && /not verified|unverified/i.test(bare)) || (s.tag === 'Unknown' && /unknown|nothing from the buyer|not confirmed/i.test(bare));
    return saysIt ? `${bare}.` : `${bare} (${s.tag.toLowerCase()}).`;
  };
  const parts = story.rows.filter((r) => r.key !== 'note').map((r) => `${r.label}: ${r.sentences.map(spoken).join(' ')}`);
  const check = [...story.checkBeforeContacting, ...story.setAsideCaveats].map(spoken);
  return ['Account story.', ...parts, ...check].join(' ').replace(/\s+/g, ' ').trim();
}
