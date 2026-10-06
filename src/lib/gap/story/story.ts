/**
 * ACCOUNT STORY (account-first UX, UX-05, 2026-10-06): what is going on at the account, what has already happened
 * between us and them, and why that leads to this person now, in a few tagged lines beside NEXT. ONE derived
 * projection over readers GAP already has (the brief, buyer inputs, the context history, the reply class, clawd's
 * outreach history, the vault note, the pursuit state): no table, no model call, no second recommendation authority.
 *
 *   rows        WHAT HAS HAPPENED BETWEEN US, GOAL, WHAT IS CHANGING, NETWORK IMPLICATION, YARD OPPORTUNITY,
 *               WHAT WE NEED TO LEARN, STORIES THAT MATTER (collapsed), YOUR NOTE; each present only with a basis
 *   tags        every SENTENCE carries Buyer said / Checked / Unverified / Our read / Unknown / Contradicted and its
 *               basis ids; a row takes the WEAKEST class of its sentences; a line with no basis is Our read or
 *               Unknown; YARD OPPORTUNITY is Our read with its Wrong if unless the buyer confirmed it
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
import { sellerRelevance } from '../research/continuity';
import type { PursuitState } from '../pursuit/state';
import type { StoryTouch } from './touches';

export type StoryTag = SellerTag;

/** Strongest to weakest: a row takes the weakest class of its sentences. */
export const STRENGTH: Record<StoryTag, number> = { 'Buyer said': 0, Checked: 1, 'Our read': 2, Unverified: 3, Unknown: 4, Contradicted: 5 };
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
  /** Unverified items that name the chosen person's unit or a set-aside that rests on one: beside the person. */
  checkBeforeContacting: StorySentence[];
}

export interface StoryInput {
  accountName: string;
  now: Date;
  state: PursuitState;
  brief: AccountIntelligenceBrief;
  inputs: Pick<AccountInputs, 'facts' | 'bids' | 'domains' | 'account' | 'signals'>;
  /** NOW's own WHY NOW and KNOW lines (already filtered: no market chatter, no imagery, one idea once). */
  whyNow: NowLine[];
  know: NowLine[];
  touches: StoryTouch[];
  clawdRead: 'ok' | 'unavailable' | 'not_configured';
  /** The vault's account note, when one exists (seller-visible, never quotable, never read aloud). */
  vaultNote: { text: string; at: string | null } | null;
  /** The resolver's set-aside people (serializable), for the divested-unit rise. */
  excluded: Array<{ key: string; name: string; title: string | null; code: string; reason: string }>;
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
const sentence = (t: string) => {
  const s = t.replace(/^[A-Z][A-Z /]+:\s*/, '').replace(/\s+/g, ' ').trim();
  return /[.!?]$/.test(s) ? s : `${s}.`;
};
const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const first = (name: string) => name.split(' ')[0];
const row = (key: StoryRowKey, sentences: StorySentence[], over: Partial<StoryRow> = {}): StoryRow => ({ key, label: STORY_LABEL[key], tag: weakestTag(sentences.map((s) => s.tag)), sentences, wrongIf: null, collapsed: false, ...over });
const fromLine = (l: NowLine): StorySentence => ({ text: sentence(l.text), tag: l.tag, basis: l.basis, basisIds: [l.id], cite: l.cite });

/** A program or a stated goal, not a one-day event. */
const GOAL = /\b(program|programme|initiative|plan(?:s|ned|ning)?|redesign|moderni[sz]|transform|invest(?:s|ing|ment)?|expan(?:d|sion)|consolidat|roadmap|strategy|target(?:s|ing)?|goal|aims?|commit(?:s|ted|ment)|network 2\.0|optimi[sz])\b/i;
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
  const used = new Set<string>();
  const take = (id: string) => (used.has(id) ? false : (used.add(id), true));
  const rows: StoryRow[] = [];

  // WHAT HAS HAPPENED BETWEEN US: the last person touched with their title, what came back, the count.
  rows.push(betweenUs(i));

  // GOAL: what they say they are doing: a buyer input first, else a verified program statement, else an unverified one.
  const goalBid = i.inputs.bids.find((b) => b.type === 'future_state' || b.type === 'priority');
  const catalysts: Array<{ s: Statement; l: NowLine }> = i.brief.sections.catalysts.statements
    .filter((s) => s.truth !== 'CONTRADICTED' && !/^ENDED/.test(s.text))
    .map((s) => ({ s, l: sellerLine(s, 'catalysts', lx) }))
    .filter((x): x is { s: Statement; l: NowLine } => !!x.l)
    .map((x) => (x.s.sources[0]?.kind === 'signal' ? { s: x.s, l: { ...x.l, id: `signal:${x.s.sources[0].ref ?? x.l.id}`, tag: 'Unverified' as const, text: x.l.text.replace(/^Signal, not verified:\s*/, '').replace(/\s*\((?:shared )?[0-9a-z ,-]+\)$/i, ''), basis: `a third party's report, not checked; ${day(x.s.sources[0].at)}` } } : x));
  const programs = catalysts.filter((x) => GOAL.test(x.l.text) && sellerRelevance(x.l.text).rank <= 6).sort((a, b) => STRENGTH[a.l.tag] - STRENGTH[b.l.tag]);
  if (goalBid) {
    rows.push(row('goal', [{ text: sentence(goalBid.summary), tag: 'Buyer said', basis: `buyer said, ${goalBid.who ?? 'the buyer'}, ${day(goalBid.at)}`, basisIds: [`bid:${goalBid.id}`] }]));
    used.add(`bid:${goalBid.id}`);
  } else if (programs[0] && take(programs[0].l.id)) {
    rows.push(row('goal', [fromLine(programs[0].l)]));
  }

  // WHAT IS CHANGING: NOW's why-now lines (checked first, at most one unverified), each with its own tag.
  const changing = i.whyNow.filter((l) => take(l.id)).slice(0, 2).map(fromLine);
  if (changing.length) rows.push(row('changing', changing));

  // NETWORK IMPLICATION and YARD OPPORTUNITY: the top grounded angle (never an ungrounded draft), or the buyer's words.
  const top = i.brief.hypotheses.find((h) => h.grounded && h.truth !== 'CONTRADICTED') ?? null;
  const obs = top ? sentence(top.observation.text).replace(/\.$/, '') : '';
  if (top) {
    const review = top.needsReview.length ? '; the angle needs your review' : '';
    rows.push(row('network', [{ text: sentence(top.inference), tag: 'Our read', basis: `our inference from: ${obs.length > 110 ? `${obs.slice(0, 107).trimEnd()}...` : obs}${review}`, basisIds: [`hypothesis:${top.id}`, ...(top.observation.verified && i.inputs.facts.some((f) => f.quote === top.observation.text) ? [`evidence:${i.inputs.facts.find((f) => f.quote === top.observation.text)!.id}`] : [])] }]));
  }
  const problemBid = i.inputs.bids.find((b) => b.type === 'business_problem');
  const impactBid = i.inputs.bids.find((b) => b.type === 'impact');
  if (problemBid) {
    const s: StorySentence[] = [{ text: sentence(problemBid.summary), tag: 'Buyer said', basis: `buyer said, ${problemBid.who ?? 'the buyer'}, ${day(problemBid.at)}`, basisIds: [`bid:${problemBid.id}`] }];
    if (impactBid) s.push({ text: sentence(impactBid.summary), tag: 'Buyer said', basis: `buyer said, ${impactBid.who ?? 'the buyer'}, ${day(impactBid.at)}`, basisIds: [`bid:${impactBid.id}`] });
    rows.push(row('yard', s));
  } else if (top) {
    rows.push(row('yard', [{ text: sentence(top.problem), tag: 'Our read', basis: 'our read; not confirmed by the buyer', basisIds: [`hypothesis:${top.id}`] }], { wrongIf: top.wrongIf ? top.wrongIf.split(/(?<=\.)\s/)[0] : null }));
  }

  // WHAT WE NEED TO LEARN: the unknowns, in discovery order, as Unknown sentences.
  const bid = (t: string) => i.inputs.bids.some((b) => b.type === t);
  const learn: StorySentence[] = [];
  if (!bid('current_state')) learn.push({ text: 'How they run the yards today: not confirmed by the buyer.', tag: 'Unknown', basis: 'no buyer input on the current state', basisIds: [] });
  if (!bid('impact')) learn.push({ text: 'What it costs them: no cost named by the buyer.', tag: 'Unknown', basis: 'no buyer input on impact', basisIds: [] });
  if (!bid('root_cause') && !top?.rootCause) learn.push({ text: 'Why it happens: unknown.', tag: 'Unknown', basis: 'no root cause on record', basisIds: [] });
  if (i.brief.discovery[0] && learn.length < 3) learn.push({ text: `Ask: ${i.brief.discovery[0].question}`, tag: 'Unknown', basis: 'the first discovery question', basisIds: [] });
  if (learn.length) rows.push(row('learn', learn.slice(0, 3)));

  // STORIES THAT MATTER: the checked lines not already told, with their cite status, collapsed.
  const stories = [...i.know, ...catalysts.map((x) => x.l).filter((l) => l.tag === 'Checked')].filter((l) => take(l.id)).slice(0, 4).map(fromLine);
  if (stories.length) rows.push(row('stories', stories, { collapsed: true }));

  // YOUR NOTE: the vault's account note (seller-visible, never quotable, never read aloud).
  if (i.vaultNote?.text.trim()) rows.push(row('note', [{ text: sentence(i.vaultNote.text.replace(/<[^>]+>/g, '')), tag: 'Our read', basis: `your vault note${i.vaultNote.at ? `, ${day(i.vaultNote.at)}` : ''}; never quote it to the buyer`, basisIds: ['vault:account-note'] }]));

  // CHECK BEFORE CONTACTING: an Unverified sale or divestiture that names the chosen person's unit, and any
  // set-aside that rests on it.
  const checkBeforeContacting: StorySentence[] = [];
  const divestSignals = catalysts.filter((x) => x.l.tag === 'Unverified' && DIVEST.test(x.l.text));
  const p = i.state.person;
  if (p && p.title && divestSignals.length) {
    const phrases = unitPhrases(p.title, i.accountName);
    for (const x of divestSignals) {
      if (!names(x.l.text, phrases)) continue;
      checkBeforeContacting.push({ text: `Check before contacting ${p.name}: ${lower(sentence(x.l.text))} It names their unit (${p.title}) and is not verified.`, tag: 'Unverified', basis: x.l.basis, basisIds: [x.l.id] });
    }
  }
  for (const e of i.excluded.filter((e) => e.code === 'divested_entity')) {
    const backing = divestSignals.find((x) => names(x.l.text, unitPhrases(e.title, i.accountName)) || names(e.reason, unitPhrases(e.title, i.accountName)));
    if (!backing) continue;
    checkBeforeContacting.push({ text: `${e.name}${e.title ? `, ${e.title}` : ''} is set aside as a divested unit; that rests on an unverified report (${lower(sentence(backing.l.text)).replace(/\.$/, '')}).`, tag: 'Unverified', basis: backing.l.basis, basisIds: [backing.l.id, `set-aside:${e.key}`] });
  }

  const order: StoryRowKey[] = ['between_us', 'changing', 'yard'];
  return { rows, first: order.map((k) => rows.find((r) => r.key === k)).filter((r): r is StoryRow => !!r), checkBeforeContacting };
}

function betweenUs(i: StoryInput): StoryRow {
  const t = i.touches;
  if (!t.length) {
    return i.clawdRead === 'ok'
      ? row('between_us', [{ text: 'No touch on record between us.', tag: 'Checked', basis: 'GAP, clawd and the account history: nothing found', basisIds: [] }])
      : row('between_us', [{ text: i.clawdRead === 'not_configured' ? "No touch in GAP's own records; clawd's send history is not connected here." : "No touch in GAP's own records; clawd's send history could not be read.", tag: 'Unknown', basis: 'GAP and the account history only', basisIds: [] }]);
  }
  const s: StorySentence[] = [];
  const who = (x: StoryTouch) => `${x.name}${x.title ? `, ${x.title}` : ''}`;
  const sends = t.filter((x) => x.kind === 'send' || x.kind === 'asset');
  const last = sends[0] ?? null;
  const lastReply = t.find((x) => x.kind === 'reply') ?? null;
  if (last) {
    s.push({ text: `Last email to ${who(last)}, ${day(last.at)}${last.what && last.what !== 'email' ? `: "${last.what.replace(/^Re:\s*/i, '')}"` : ''}.`, tag: 'Checked', basis: `${last.source}, ${day(last.at)}`, basisIds: [`touch:${last.at}`] });
  }
  if (lastReply) {
    const k = lastReply.replyKind ?? 'human';
    const text =
      k === 'opt_out' ? `${who(lastReply)} opted out on ${day(lastReply.at)} ("${lastReply.what}").`
      : k === 'out_of_office' ? `${who(lastReply)} sent an automatic reply on ${day(lastReply.at)}: not an answer.`
      : k === 'bounce' ? `The address for ${who(lastReply)} failed on ${day(lastReply.at)}.`
      : `${who(lastReply)} replied on ${day(lastReply.at)}: "${lastReply.what}".`;
    s.push({ text, tag: k === 'opt_out' || k === 'human' ? 'Buyer said' : 'Checked', basis: `${lastReply.source}, ${day(lastReply.at)}`, basisIds: [`touch:${lastReply.at}`] });
  } else if (last) {
    s.push({ text: `No answer on record from ${first(last.name)}.`, tag: i.clawdRead === 'ok' ? 'Checked' : 'Unknown', basis: i.clawdRead === 'ok' ? 'GAP, clawd and the account history' : "GAP and the account history; clawd's history could not be read", basisIds: [] });
  }
  const people = new Set(sends.map((x) => x.name.toLowerCase()));
  if (sends.length >= 2) {
    const oldest = sends[sends.length - 1];
    const sources = [...new Set(sends.map((x) => x.source))].map((x) => x.replace(' ledger', '')).join(' and ');
    s.push({ text: `${sends.length} emails to ${people.size} ${people.size === 1 ? 'person' : 'people'} since ${dayYear(oldest.at)}.`, tag: 'Checked', basis: `${sources}`, basisIds: sends.map((x) => `touch:${x.at}`) });
  }
  const meeting = t.find((x) => x.kind === 'meeting');
  if (meeting) s.push({ text: `Meeting ${day(meeting.at)}: ${meeting.what.replace(/\.$/, '')}.`, tag: 'Checked', basis: `account history, ${day(meeting.at)}`, basisIds: [`touch:${meeting.at}`] });
  return row('between_us', s);
}

/** What Listen reads for the story: the rows with their tags in words; never the vault note, never the private line. */
export function storyListenText(story: AccountStory): string {
  const parts = story.rows
    .filter((r) => r.key !== 'note')
    .map((r) => `${r.label}: ${r.sentences.map((s) => `${s.text.replace(/\.$/, '')} (${s.tag.toLowerCase()}).`).join(' ')}`);
  const check = story.checkBeforeContacting.map((s) => `${s.text.replace(/\.$/, '')} (unverified).`);
  return ['Account story.', ...parts, ...check].join(' ').replace(/\s+/g, ' ').trim();
}
