/**
 * THE MORNING BRIEFING, rendered (X05a, GAP OS sales execution engine, 2026-10-08). Pure: the day's plan (work/plan.ts)
 * in, a subject, a plain-text body and an HTML body out. The cron (X05b) sends it from the GAP identity to the
 * seller's configured address.
 *
 * Rules (pinned by tests/unit/gap/briefing.test.ts):
 *   - the subject names the day, how many items need the seller and the day token in brackets (`[GAP#<token>]`),
 *     which a reply keeps, so the mailbox cron can bind a START or NEXT reply to this day (X07)
 *   - the items are listed in the plan's order: account, what, who, why, the link; the START link leads
 *   - NO line of the body starts with a command word: a reply that quotes the body must never read as a command
 *   - the commands footer appears only when email commands are enabled (X07); before that the links are the way
 *   - when nothing needs the seller the briefing says so in words; the legacy pipeline digest is named while it runs
 *   - C31: the headline names its count basis: "N to execute" is the plan's items, the same durable list in the same
 *     order START and NEXT walk (item 1 is what START opens, named in the body); "M to decide" is the intelligence
 *     shown, counted apart and never folded into the execution count
 *   - C32: each item card carries the identity, the relationship or motion, why it surfaced, the last material
 *     exchange, the next prepared action (whole, never cut mid-sentence), the source and date, and its own deep link;
 *     an intelligence item at an account with an open deal links to that deal's brief, never to generic Work
 *   - C33: the greeting follows the New York hour of the send (21:47 is "Good evening"); a replay of an earlier plan
 *     says when that plan was made and that what changed since is on Work
 *   - seller acceptance follow-up (2026-10-09): a resend's plan is REFRESHED (work/plan.ts) and the line says what
 *     changed ("Refreshed plan (revision 1, 7:51 AM New York): added ...; removed ...; moved ... up") or that nothing
 *     did ("Unchanged since the 7:05 AM plan"); `planStatusLine` is the one place that says it
 */
import type { DayPlan, PlanItem } from './plan';
import type { IntelItem, PursuedItem } from './intel';
import { dateOnlyText } from '../signals/intelligence-record';
import { cleanLine, dedupeSentences } from './clean-text';

/**
 * GUI-11 (the Gmail action UI audit, 2026-10-10): the template rules this renderer holds, pinned by
 * tests/unit/gap/gui-digest.test.ts:
 *   - every prose line goes through cleanLine (no [[wiki]] syntax, no URL cut mid-way) before it is printed
 *   - an item's line and card lines are deduplicated by sentence (dedupeSentences): a state word prints once
 *   - the count basis says its units: plan items to execute; intelligence items to decide, split into records and
 *     people; the retained records not in this email are counted and placed (the Intelligence page)
 *   - content first: the intelligence items, the pursued, the plan items; the digest's composition, the producers'
 *     coverage and the retained-list link follow the items as bookkeeping
 *   - a classifier-only source label (fit_rationale, relevance, score, a snake_case field) prints as "the producer's
 *     own claim", never as a source, WHATEVER the publisher (the morning audit of 2026-10-10: a Clawd row always
 *     carries its URL's host as the publisher, so "Sources: fit_rationale https://celestica.com/" went out); its link
 *     is kept, and without one it says "(no source link)"
 *   - the HTML is one column, table-free, max-width 640px with 16px side padding, long words and links allowed to wrap
 *   - no body line starts with a command word or a selection (ITEM 6, OPEN 6, SEND ME 6)
 */
const fmt = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);
/** A source label that is a classifier's field (fit_rationale, urgency_score, relevance, score), not a publication. */
const CLASSIFIER_LABEL = /^(?:[a-z]+(?:_[a-z0-9]+)+|relevance|score)$/;
const OWN_CLAIM_WORDS = "the producer's own claim";
const OWN_CLAIM = `${OWN_CLAIM_WORDS} (no source link)`;
/** I05: how many pursued items the email shows (the rest are on Work); briefing-send reads supersession for these. */
export const PURSUED_SHOWN = 3;

/**
 * C32: a long text kept whole or cut at a sentence end, never mid-sentence. Under `max` it is returned as is; over it,
 * the longest run of whole sentences that fits (a sentence ends at . ! ? or ;); when no sentence end fits, the whole
 * text stands rather than a fragment.
 */
export function clipAtSentence(text: string, max = 200): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max + 1);
  const ends = [...head.matchAll(/[.!?;](?=\s|$)/g)].map((m) => m.index as number).filter((i) => i > 0);
  return ends.length ? t.slice(0, ends[ends.length - 1] + 1).trim() : t;
}

/** C33: the greeting for a New York hour: morning until noon, afternoon until five, evening after; a neutral opener at night. */
export function greetingFor(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }).format(now)) % 24;
  if (hour >= 5 && hour < 12) return 'Good morning.';
  if (hour >= 12 && hour < 17) return 'Good afternoon.';
  if (hour >= 17 && hour < 24) return 'Good evening.';
  return 'Hello.';
}

/** The reply commands (X07). Named here so the render can keep every body line clear of them. */
export const COMMAND_WORDS = ['APPROVE', 'REVISE', 'SKIP', 'DEFER', 'DONE', 'NEXT', 'HELP', 'START'] as const;

export interface BriefingLinks {
  start: string;
  work: string;
  item: (it: PlanItem) => string;
  /** I04: a decision link for an intelligence item (null when links cannot be signed: the item then says "on Work"). */
  decide?: (key: string, decision: 'pursue' | 'skip' | 'dismiss' | 'more') => string | null;
  /** I05: the account page. */
  account?: (name: string) => string;
  /** C32: the account's deal brief (the deal workspace), for an item at an account with an open deal. */
  deal?: (name: string) => string;
  /** IW12: the complete retained intelligence with filters (the Intelligence page), so an omission today is never a loss. */
  intelligence?: string;
}

/** I04: the day's intelligence for the briefing (work/intel.ts) with the prepared angles by item key. */
export interface BriefingIntel {
  signals: IntelItem[];
  /** IW11: the producers' imported records as their own group (newest report first); absent on an older caller. */
  reports?: IntelItem[];
  /** IW06: the vault's recent calls and meetings, their own group (no decisions). */
  knowledge?: IntelItem[];
  triggers: IntelItem[];
  people: IntelItem[];
  /** I05: what Casey pursued, with the angle when it is ready. */
  pursued?: PursuedItem[];
  totals: { signals: number; triggers: number; people: number; reports?: number; knowledge?: number };
  angles: Record<string, { whyItMatters: string; starters: string[]; peopleNamed: Array<{ name: string | null; title: string | null }>; proposedAction: string }>;
  /** IW12/IW13: the producers' coverage in words (which sources were read and when; which were not), printed under the section head. */
  coverage?: { sources: string; unavailable: string | null } | null;
  /** IW12: the item keys shown in recent briefings: they rotate behind the unseen, so an omission today is not permanent. */
  shownBefore?: string[];
  /** IW11: the digest sizes (configurable; DEFAULT_DIGEST when absent). */
  digest?: Partial<DigestSizes>;
}

/** IW11: how many items the email carries and the reserved slots per section (your briefs, what GAP found, triggers, the vault). */
export interface DigestSizes {
  signals: number;
  people: number;
  reserved: { reports: number; found: number; triggers: number; vault: number };
}
export const DEFAULT_DIGEST: DigestSizes = Object.freeze({ signals: 6, people: 5, reserved: Object.freeze({ reports: 2, found: 2, triggers: 1, vault: 1 }) }) as DigestSizes;

export interface Digest {
  worth: IntelItem[];
  people: IntelItem[];
  /** The undecided items beyond the ones shown (the complete list is the Intelligence page). */
  omitted: number;
  breakdown: { reports: number; found: number; triggers: number; vault: number };
  /** How many shown-before items were moved behind the unseen. */
  rotated: number;
  keys: string[];
}
const EMPTY_DIGEST: Digest = { worth: [], people: [], omitted: 0, breakdown: { reports: 0, found: 0, triggers: 0, vault: 0 }, rotated: 0, keys: [] };

/**
 * IW11: the digest, by a rule the email states: four sections (your briefs' imported records, the signals GAP found,
 * the triggers, the vault's conversations) each get reserved slots (2, 2, 1, 1 of 6 by default), filled in rank order
 * with the items not shown in a recent briefing first; the remaining slots go to the sections in turn (briefs, found,
 * triggers, vault) until the digest is full; the email lists the sections in that order. No usefulness gate: an
 * omitted item is counted, listed on the Intelligence page, and rotates in.
 */
export function composeDigest(intel: Pick<BriefingIntel, 'signals' | 'reports' | 'knowledge' | 'triggers' | 'people' | 'totals'>, opts: { sizes?: Partial<DigestSizes>; shownBefore?: ReadonlySet<string> } = {}): Digest {
  const sizes: DigestSizes = { ...DEFAULT_DIGEST, ...(opts.sizes ?? {}), reserved: { ...DEFAULT_DIGEST.reserved, ...(opts.sizes?.reserved ?? {}) } };
  const seen = opts.shownBefore ?? new Set<string>();
  const order = (items: IntelItem[]) => [...items.filter((i) => !seen.has(i.key)), ...items.filter((i) => seen.has(i.key))];
  // The briefs' group comes from the reader (newest report first); an older caller's signals carry them inline.
  const reports = order([...(intel.reports ?? []), ...intel.signals.filter((s) => s.substance)].filter((it, i, all) => all.findIndex((x) => x.key === it.key) === i));
  const found = order(intel.signals.filter((s) => !s.substance));
  const triggers = order(intel.triggers);
  const vault = order((intel.knowledge ?? []).filter((k) => k.kind === 'knowledge'));
  const sections: Array<{ name: keyof DigestSizes['reserved']; items: IntelItem[]; picked: IntelItem[] }> = [
    { name: 'reports', items: reports, picked: [] },
    { name: 'found', items: found, picked: [] },
    { name: 'triggers', items: triggers, picked: [] },
    { name: 'vault', items: vault, picked: [] },
  ];
  const seenKeys = new Set<string>();
  let count = 0;
  const take = (s: (typeof sections)[number], n: number) => { for (const it of s.items) { if (count >= sizes.signals || n <= 0) break; if (seenKeys.has(it.key)) continue; seenKeys.add(it.key); s.picked.push(it); count += 1; n -= 1; } };
  for (const s of sections) take(s, sizes.reserved[s.name]);
  // The remaining slots: the sections in turn until the digest is full or nothing is left.
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  while (count < sizes.signals && seenKeys.size < total) for (const s of sections) take(s, 1);
  const worth = sections.flatMap((s) => s.picked);
  const people = intel.people.slice(0, sizes.people);
  const breakdown = { reports: sections[0].picked.length, found: sections[1].picked.length, triggers: sections[2].picked.length, vault: sections[3].picked.length };
  const omitted = Math.max(0, intel.totals.signals + intel.totals.triggers + (intel.totals.reports ?? 0) + (intel.totals.knowledge ?? 0) - worth.length);
  // The shown-before items that wait behind the unseen this time.
  const rotated = sections.flatMap((s) => s.items).filter((i) => seen.has(i.key) && !seenKeys.has(i.key)).length;
  return { worth, people, omitted, breakdown, rotated, keys: [...worth, ...people].map((i) => i.key) };
}

export interface BriefingInput {
  plan: DayPlan;
  dayToken: string;
  links: BriefingLinks;
  commandsEnabled: boolean;
  /** The legacy HubSpot pipeline digest (cron daily-digest) still runs: say so until Casey retires it (X19). */
  legacyDigest: boolean;
  /** I04: the intelligence sections; absent (an older caller) renders the items alone. */
  intel?: BriefingIntel | null;
  /** C33: an explicit resend (X22): said as such beside the plan's own time. */
  resend?: boolean;
}

export interface RenderedBriefing {
  subject: string;
  text: string;
  html: string;
  /** IW12: what the email selected (the keys), what it omitted and how it was composed, for the sent row. */
  digest: { keys: string[]; omitted: number; breakdown: { reports: number; found: number; triggers: number }; rotated: number };
}

const dayLabel = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '');
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** IW10: an imported passage is printed whole up to this many characters, cut at a sentence end past it. */
const SUBSTANCE_MAX = 700;
const endSentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

function who(it: PlanItem): string | null {
  if (!it.person?.name) return null;
  return it.person.title ? `${it.person.name} (${it.person.title})` : it.person.name;
}

/** One item line: "1. Boston Beer: Someone replied. Phil Savastano (VP Operations). Phil Savastano wrote Oct 8." */
/** GUI-11: the item line's sentences, cleaned and deduplicated (the title, the person, the why, the carried-from day). */
function itemParts(it: PlanItem): string[] {
  // X18: carried work says the day it came from.
  // Cleaned before the sentence is closed, so a dropped cut URL never leaves the sentence open.
  const parts = [endSentence(cleanLine(it.title)), who(it) ? endSentence(cleanLine(who(it) as string)) : null, it.why ? endSentence(cleanLine(it.why)) : null, it.carriedFrom ? `Carried from ${dayLabel(it.carriedFrom)}.` : null].filter((x): x is string => !!x);
  return dedupeSentences(parts);
}

export function itemLine(it: PlanItem, n: number): string {
  return `${n}. ${cleanLine(it.accountName)}: ${itemParts(it).join(' ')}`;
}

const dateText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
/** "Oct 8, 2026" on the seller's clock (the words relationship-state's dateWords says; kept here so the renderer stays pure). */
const dayWords = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'an unknown date' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
};
/**
 * A lowercase name proper-cased ("nicholas schwartz" is Nicholas Schwartz; "o'neil-smith" is O'Neil-Smith); a name
 * with any capital is kept as written. The same rule as people/contact-packet.ts properCase, copied rather than
 * imported: this renderer is reachable from a client component (components/gap/work-list.tsx through work/list.ts),
 * and contact-packet carries a dynamic import of the HubSpot client. tests/unit/gap/gui-briefing-morning.test.ts pins
 * the two equal.
 */
export function properCaseName(s: string | null | undefined): string | null {
  if (!s || !s.trim()) return null;
  const t = s.trim();
  if (/[A-Z]/.test(t)) return t;
  const small = new Set(['of', 'and', 'the', 'for', 'at', 'in', 'on', 'to', 'de', 'van', 'von', 'da', 'del', 'la', 'le', 'du']);
  return t.replace(/\b([a-z])([a-z'-]*)/g, (m, a: string, rest: string, offset: number) => (offset > 0 && small.has(m) ? m : a.toUpperCase() + rest.replace(/(['-])([a-z])/g, (_x, p: string, c: string) => p + c.toUpperCase())));
}
/** A person named from an address ("dave.kiesling@kencogroup.com" is Dave Kiesling); the address itself when nothing is left. */
const nameOfAddress = (email: string) => properCaseName(email.split('@')[0].replace(/\d+/g, ' ').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim()) ?? email;

/**
 * C32: the card lines under an item: the relationship or motion, the last material exchange, the next prepared action
 * (whole), the source and date. Only what the plan item carries; nothing is invented, and a missing line is absent.
 */
export function itemCardLines(it: PlanItem): string[] {
  const c = it.context;
  if (!c) return [];
  const out: string[] = [];
  if (c.motion) out.push(endSentence(cleanLine(c.motion)));
  if (c.lastExchange) out.push(`Last: ${endSentence(cleanLine(c.lastExchange))}`);
  if (c.nextAction) out.push(`Next: ${endSentence(cleanLine(clipAtSentence(c.nextAction, 400)))}`);
  const src = [c.source ? cleanLine(c.source) : null, c.date ? dateText(c.date) : null].filter(Boolean).join(', ');
  if (src) out.push(`Source: ${src}.`);
  // GUI-11: a card line that repeats one of the item line's own sentences (the state word again) prints once.
  const parts = itemParts(it);
  return dedupeSentences([...parts, ...out]).filter((l) => !parts.includes(l));
}

const timeNy = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

/** Up to `max` names, then "and N more". */
function named(keys: readonly string[], labels: Record<string, string>, max = 4, suffix: (k: string) => string = () => ''): string {
  const names = keys.slice(0, max).map((k) => `${labels[k] ?? k}${suffix(k)}`);
  const more = keys.length - names.length;
  return more > 0 ? `${names.join(', ')} and ${more} more` : names.join(', ');
}

/**
 * Seller acceptance follow-up (2026-10-09): what a resend says about its plan. A REFRESHED plan (a new revision written
 * by this send) says what changed, from the plan's own record: "Refreshed plan (revision 1, 7:51 AM New York): added
 * Kenco: Follow up due; removed Dole: Decide; moved PepsiCo: Ready for a first touch up". An UNCHANGED one says
 * "Unchanged since the 7:05 AM plan". A replay of an older plan that was NOT compared (the scheduled send reading a
 * plan the page made earlier) still says it replays that plan as it stood then: no comparison was made, none is claimed.
 */
export function planStatusLine(plan: DayPlan, resend: boolean, now: Date): string | null {
  const plannedAt = new Date(plan.plannedAt);
  const changes = plan.fresh && (plan.revision ?? 0) > 0 ? plan.changes ?? null : null;
  let line: string | null = null;
  if (changes) {
    const parts = [
      changes.added.length ? `added ${named(changes.added, changes.labels)}` : null,
      changes.removed.length ? `removed ${named(changes.removed, changes.labels)}` : null,
      changes.moved.length ? `moved ${named(changes.moved.map((m) => m.key), changes.labels, 4, (k) => { const m = changes.moved.find((x) => x.key === k); return m ? (m.to < m.from ? ' up' : ' down') : ''; })}` : null,
    ].filter((x): x is string => !!x);
    line = `Refreshed plan (revision ${plan.revision}, ${timeNy(plannedAt)} New York): ${parts.length ? parts.join('; ') : 'the order changed'}.`;
  } else if (plan.unchanged) {
    line = `Unchanged since the ${timeNy(plannedAt)} plan.`;
  } else if (!plan.fresh && now.getTime() - plannedAt.getTime() > 5 * 60_000) {
    line = `This replays the plan GAP made at ${timeNy(plannedAt)} New York on ${dayLabel(plan.day)}, as it stood then; what changed since is on Work, not here.`;
  } else if (resend) {
    line = `The plan was made at ${timeNy(plannedAt)} New York on ${dayLabel(plan.day)}.`;
  }
  return line ? `${resend ? 'This is a resend. ' : ''}${line}` : null;
}

export function renderBriefing(input: BriefingInput, now: Date): RenderedBriefing {
  const { plan, links } = input;
  const label = dayLabel(plan.day);
  const n = plan.items.length;
  const intel = input.intel ?? null;
  // C31: the intelligence SHOWN (the same selection the sections render), counted apart from the execution count.
  // IW11: composed by the stated rule (composeDigest): reserved slots per section, the unseen first, sizes configurable.
  const digest = intel ? composeDigest(intel, { sizes: intel.digest, shownBefore: new Set(intel.shownBefore ?? []) }) : EMPTY_DIGEST;
  const worthAll = digest.worth;
  const peopleAll = digest.people;
  const toDecide = worthAll.length + peopleAll.length;
  const execText = n === 0 ? 'nothing to execute' : `${n} to execute`;
  const countText = toDecide > 0 ? `${execText}, ${toDecide} to decide` : n === 0 ? 'nothing needs you' : execText;
  const subject = `GAP today, ${label}: ${countText} [GAP#${input.dayToken}]`;
  const c = plan.counts;

  const lines: string[] = [];
  const html: string[] = [];
  // C33: the greeting follows the hour the email actually goes out; a replay says when its plan was made.
  const greeting = greetingFor(now);
  lines.push(`${greeting} Here is ${label} from GAP, in order.`);
  html.push(`<p>${esc(greeting)} Here is ${esc(label)} from GAP, in order.</p>`);
  const planLine = planStatusLine(plan, input.resend === true, now);
  if (planLine) {
    lines.push(planLine);
    html.push(`<p style="color:#666">${esc(planLine)}</p>`);
  }
  // C31: the count basis, in words: the plan's items are what START and NEXT walk; intelligence is counted apart.
  // GUI-11: with its units: plan items; intelligence items split into records and people; the retained records
  // not in this email counted and placed (the Intelligence page), the people not shown placed on Work.
  const recordsTotal = intel ? intel.totals.signals + intel.totals.triggers + (intel.totals.reports ?? 0) + (intel.totals.knowledge ?? 0) : 0;
  const recordsOmitted = Math.max(0, recordsTotal - worthAll.length);
  const peopleOmitted = intel ? Math.max(0, intel.totals.people - peopleAll.length) : 0;
  const basis = [
    n === 0 ? 'Nothing to execute on the plan' : `${n} plan ${plural(n, 'item')} to execute, in this order (the list START, NEXT and ITEM walk)`,
    toDecide > 0 ? `${toDecide} intelligence ${plural(toDecide, 'item')} to decide, ${worthAll.length} of them ${plural(worthAll.length, 'record')} and ${peopleAll.length} ${plural(peopleAll.length, 'person', 'people')}` : null,
    recordsOmitted > 0 ? `${fmt(recordsOmitted)} more retained ${plural(recordsOmitted, 'record')} ${recordsOmitted === 1 ? 'is' : 'are'} on the Intelligence page, not in this email` : null,
    peopleOmitted > 0 ? `${fmt(peopleOmitted)} more ${plural(peopleOmitted, 'person', 'people')} who wrote in ${peopleOmitted === 1 ? 'is' : 'are'} on Work` : null,
  ].filter(Boolean).join('; ');
  lines.push(`${basis}.`);
  html.push(`<p style="color:#666">${esc(basis)}.</p>`);
  // GUI-11: the bookkeeping (how the digest was composed, the producers' coverage, the retained list) follows the items.
  const bookkeeping: { text: string[]; html: string[] } = { text: [], html: [] };
  // I04: intelligence first (the day is for new conversations), then the items in sections, deals in one line.
  const decideLinks = (key: string) => {
    const parts = (['pursue', 'skip', 'dismiss', 'more'] as const).map((d) => {
      const href = links.decide ? links.decide(key, d) : null;
      return href ? { d, href } : null;
    }).filter((x): x is { d: 'pursue' | 'skip' | 'dismiss' | 'more'; href: string } => !!x);
    return { text: parts.length ? parts.map((p) => `${p.d.charAt(0).toUpperCase()}${p.d.slice(1)}: ${p.href}`).join('  ') : `Decide it on Work: ${links.work}`, html: parts.length ? parts.map((p) => `<a href="${esc(p.href)}">${esc(p.d.charAt(0).toUpperCase() + p.d.slice(1))}</a>`).join(' · ') : `<a href="${esc(links.work)}">Decide it on Work</a>` };
  };
  const intelLine = (it: IntelItem) => {
    const a = intel?.angles[it.key];
    const who = a?.peopleNamed.length ? ` Who: ${a.peopleNamed.map((p) => `${p.name ?? 'someone'}${p.title ? ` (${p.title})` : ''}`).join('; ')}.` : '';
    // C5 (2026-10-09): an ambiguous placement is said with its names (the line carries it), never "No account yet".
    return cleanLine(`${it.accountName ?? (it.ambiguousAmong?.length ? `Claimed by ${it.ambiguousAmong.join(' and ')}` : null) ?? it.accountHint ?? 'No account yet'}: ${it.title}. ${it.line}${a ? ` The angle: ${a.whyItMatters}${who} Ask: ${a.starters[0] ?? ''}` : ''}`);
  };
  // C32: an item at an account with an open deal names the deal (stage and its whole next step) and links to its brief.
  const dealLine = (it: IntelItem): { text: string; href: string } | null => {
    if (it.opportunity !== 'open' || !it.accountName) return null;
    const href = links.deal ? links.deal(it.accountName) : links.account ? links.account(it.accountName) : links.work;
    const deals = it.person?.deals ?? [];
    // C57 pass 2: with more than one open deal and no settled scope, no deal is presented as the person's; the brief
    // is linked without naming one (the same rule decide.ts holds for the contact lookup).
    if (deals.length > 1) return { text: `${deals.length} open deals at ${it.accountName}; the person's deal is not settled. Work it from the deal brief: ${href}`, href };
    const d = deals[0] ?? null;
    const name = d?.name ?? 'an open HubSpot deal';
    const step = d?.nextStep ? ` Next step: ${endSentence(cleanLine(clipAtSentence(d.nextStep, 400)))}` : '';
    return { text: `In a deal at ${it.accountName}: ${name}${d?.stage ? ` (${d.stage})` : ''}.${step} Work it from the deal: ${href}`, href };
  };
  // I05, moved by the intelligence wiring (2026-10-09): what Casey pursued FOLLOWS the newly collected intelligence
  // (the angle when it is ready, the state when it is not), capped at three with the rest on Work, so an old pursued
  // angle never sits ahead of what was collected today while staying reachable.
  const pursuedAll = intel?.pursued ?? [];
  const pursued = pursuedAll.slice(0, PURSUED_SHOWN);
  const renderPursued = () => {
    if (!pursued.length) return;
    const more = pursuedAll.length - pursued.length;
    lines.push('', `Pursued (${pursued.length}${more > 0 ? ` of ${pursuedAll.length}` : ''}): what GAP prepared on your decisions.${more > 0 ? ` ${more} more on Work.` : ''}`);
    html.push(`<h3>Pursued (${pursued.length}${more > 0 ? ` of ${pursuedAll.length}` : ''})</h3><p style="color:#666">What GAP prepared on your decisions.${more > 0 ? ` ${more} more on Work.` : ''}</p><ul>`);
    for (const p of pursued) {
      // C5 (2026-10-09): an ambiguous placement is said with its names, never "No account yet"; a read-time placement says its line.
      const where = p.accountName ?? (p.ambiguousAmong?.length ? (p.ambiguityLine ?? `Claimed by ${p.ambiguousAmong.join(' and ')}: choose the account`) : null) ?? p.accountHint ?? 'No account yet';
      const a = p.angle;
      // The morning audit (2026-10-10): a lowercase name prints proper-cased ("nicholas schwartz" is Nicholas
      // Schwartz), the writer in the title and the people the angle names alike; a writer with no name is named from
      // the address, never by it.
      const writerName = p.writer ? properCaseName(p.writer.name) ?? nameOfAddress(p.writer.email) : null;
      const title = p.writer?.name && writerName && p.writer.name !== writerName ? p.title.split(p.writer.name).join(writerName) : p.title;
      const body = p.status === 'ready' && a ? `The angle: ${a.whyItMatters}${a.peopleNamed.length ? ` Who: ${a.peopleNamed.map((x) => `${properCaseName(x.name) ?? 'someone'}${x.title ? ` (${x.title})` : ''}`).join('; ')}.` : a.roles.length ? ` Roles: ${a.roles.join(', ')}.` : ''} Ask: ${a.starters[0] ?? ''} Proposed: ${a.proposedAction === 'email' ? 'an email' : a.proposedAction === 'call' ? 'a call' : 'research first'}.${a.caveat ? ` ${a.caveat}` : ''}` : p.status === 'failed' ? `GAP could not develop the angle${p.error ? ` (${p.error.slice(0, 120)})` : ''}; decide it again on Work to retry.` : 'GAP is developing the angle; it comes back here and on Work.';
      const open = p.accountName && links.account ? links.account(p.accountName) : links.work;
      // The morning audit (2026-10-10): an angle the correspondence has moved past (we wrote the writer, or they
      // wrote us, after the decision; briefing-send's markSupersededPursued reads it) is one line, never the angle text
      // or the Ask (Kenco: the angle for Dave Kiesling was decided Oct 8, we wrote Dave Oct 9 and he replied).
      const said = p.superseded
        ? cleanLine(`${where}: the angle for ${writerName ?? 'this person'} (prepared ${dayWords(p.decidedAt)}) is superseded by later correspondence (${p.superseded.since}); it is kept on the account page.`)
        : cleanLine(`${where}: ${title}. ${body}`);
      lines.push(`- ${said}`, `   ${p.accountName ? `Open ${p.accountName}` : 'Open Work'}: ${open}`);
      html.push(`<li>- ${esc(said)} <a href="${esc(open)}">${esc(p.accountName ? `Open ${p.accountName}` : 'Open Work')}</a></li>`);
    }
    html.push('</ul>');
  };
  if (intel && (intel.signals.length || intel.reports?.length || intel.knowledge?.length || intel.triggers.length || intel.people.length)) {
    // Reserved slots (the review's finding 4): the top signals and the top triggers both reach the email.
    const worth = worthAll;
    const worthTotal = intel.totals.signals + intel.totals.triggers + (intel.totals.reports ?? 0) + (intel.totals.knowledge ?? 0);
    // IW10: an imported record's substance under its line: the passage (whole, or cut at a sentence end), the
    // producer's confidence in its words, its read labelled as such (never an obligation), the sources and CRM ids,
    // the dates said as what they are. Imported text is data: escaped, never interpreted.
    const substanceLines = (it: IntelItem): { text: string[]; html: string[] } => {
      const s = it.substance;
      if (!s) return { text: [], html: [] };
      const oneLine = (v: string) => v.replace(/\s*\n+\s*/g, ' ').trim();
      const text: string[] = [];
      const htmlLines: string[] = [];
      // Cut at a sentence end past the cap; a passage with no sentence end is cut hard at twice the cap.
      const passage = cleanLine(clipAtSentence(oneLine(s.text), SUBSTANCE_MAX).slice(0, SUBSTANCE_MAX * 2));
      text.push(`What was reported: ${passage}`);
      htmlLines.push(`<b>What was reported:</b> ${esc(passage)}`);
      if (s.uncertainty) { const u = cleanLine(clipAtSentence(oneLine(s.uncertainty), 320)); text.push(`In the producer's words: ${u}`); htmlLines.push(`<b>In the producer's words:</b> ${esc(u)}`); }
      if (s.interpretation) { const r = cleanLine(clipAtSentence(oneLine(s.interpretation), 320)); text.push(`The producer's read (not an obligation): ${r}`); htmlLines.push(`<b>The producer's read (not an obligation):</b> ${esc(r)}`); }
      // GUI-11, the morning audit of 2026-10-10: a source whose label is a classifier's field (fit_rationale,
      // relevance, score) is the producer's own claim, not a publication, whatever the publisher: said as such with
      // its link kept; two fields over one link are one claim, said once.
      const src = s.sources
        .filter((x) => x.url || (x.label && CLASSIFIER_LABEL.test(x.label)))
        .map((x) => (x.label && CLASSIFIER_LABEL.test(x.label) ? { label: x.url ? OWN_CLAIM_WORDS : OWN_CLAIM, url: x.url } : { label: x.label ?? x.publisher ?? 'source', url: x.url }))
        .filter((x, k, all) => all.findIndex((y) => y.label === x.label && y.url === x.url) === k);
      const ids = s.sourceRecordIds.map((r) => `${r.system} ${r.type} ${r.id}`);
      if (src.length || ids.length) {
        text.push(`${src.length ? `Sources: ${src.map((x) => (x.url ? `${x.label} ${x.url}` : x.label)).join('; ')}.` : ''}${ids.length ? ` CRM: ${ids.join(', ')}.` : ''}`.trim());
        htmlLines.push(`${src.length ? `Sources: ${src.map((x) => (x.url ? `<a href="${esc(x.url)}">${esc(x.label)}</a>` : esc(x.label))).join('; ')}.` : ''}${ids.length ? ` CRM: ${esc(ids.join(', '))}.` : ''}`.trim());
      }
      const when = `Reported ${dateOnlyText(s.reportedOn)} by ${s.producerLabel}${s.reportedOnBasis === 'captured' ? ' (the capture date; the report states none)' : ''}${s.eventDate ? `; event date ${dateOnlyText(s.eventDate)}` : ''}; imported ${dateOnlyText(s.importedAt.slice(0, 10))}${s.revisions ? `; revised ${s.revisions} time${s.revisions === 1 ? '' : 's'}` : ''}${s.suggestions ? `; ${s.suggestions} drafted message${s.suggestions === 1 ? '' : 's'} archived, never sent` : ''}.`;
      text.push(when);
      htmlLines.push(esc(when));
      return { text, html: htmlLines };
    };
    const pushIntel = (it: IntelItem) => {
      // IW06: a vault conversation has no decisions; the account page holds the moves.
      const open = it.accountName && links.account ? links.account(it.accountName) : links.work;
      const d = it.kind === 'knowledge' ? { text: `${it.accountName ? `Open ${it.accountName}` : 'Open Work'}: ${open}`, html: `<a href="${esc(open)}">${esc(it.accountName ? `Open ${it.accountName}` : 'Open Work')}</a>` } : decideLinks(it.key);
      const deal = dealLine(it);
      const sub = substanceLines(it);
      lines.push(`- ${intelLine(it)}`, ...sub.text.map((l) => `   ${l}`), ...(deal ? [`   ${deal.text}`] : []), `   ${d.text}`);
      html.push(`<li>- ${esc(intelLine(it))}${sub.html.length ? `<br/><span style="color:#444">${sub.html.join('<br/>')}</span>` : ''}${deal ? `<br/>${esc(deal.text.replace(/ Work it from the deal: .*$/, ''))} <a href="${esc(deal.href)}">Work it from the deal</a>` : ''}<br/>${d.html}</li>`);
    };
    if (worth.length) {
      // IW11/IW12: the rule in words beside the count, the omitted counted, the complete list linked, the sources' coverage.
      const b = digest.breakdown;
      const parts = [b.reports ? `${b.reports} from your briefs` : null, b.found ? `${b.found} found by GAP` : null, b.triggers ? `${b.triggers} trigger${b.triggers === 1 ? '' : 's'}` : null, b.vault ? `${b.vault} from the vault` : null].filter(Boolean).join(', ');
      const how = `${parts ? `${parts}; ` : ''}${digest.omitted ? `${fmt(digest.omitted)} more waiting` : 'nothing omitted'}${digest.rotated ? `; ${digest.rotated} shown in an earlier briefing wait behind the unseen` : ''}.`;
      lines.push('', `Intelligence worth a look (${worth.length}${worthTotal > worth.length ? ` of ${fmt(worthTotal)}` : ''}). Any age, for your call; Pursue and GAP develops the angle.`);
      html.push(`<h3>Intelligence worth a look (${worth.length}${worthTotal > worth.length ? ` of ${fmt(worthTotal)}` : ''})</h3><p style="color:#666">Any age, for your call; Pursue and GAP develops the angle.</p>`);
      // GUI-11: how the digest was composed, the producers' coverage and the retained list follow the items.
      bookkeeping.text.push(`How this email was composed: ${how}`);
      bookkeeping.html.push(`<p style="color:#666">How this email was composed: ${esc(how)}</p>`);
      if (intel.coverage) {
        const cov = cleanLine(`${intel.coverage.sources}${intel.coverage.unavailable ? ` Not read this time: ${intel.coverage.unavailable}` : ''}`);
        bookkeeping.text.push(cov);
        bookkeeping.html.push(`<p style="color:#666">${esc(cov)}</p>`);
      }
      if (links.intelligence) {
        bookkeeping.text.push(`Everything retained, with filters: ${links.intelligence}`);
        bookkeeping.html.push(`<p style="color:#666"><a href="${esc(links.intelligence)}">Everything retained, with filters</a></p>`);
      }
      html.push('<ul>');
      worth.forEach(pushIntel);
      html.push('</ul>');
    }
    const people = peopleAll;
    if (people.length) {
      lines.push('', `Prospects to reengage (${people.length}${intel.totals.people > people.length ? ` of ${intel.totals.people}` : ''}). They wrote to us and went quiet.`);
      html.push(`<h3>Prospects to reengage (${people.length}${intel.totals.people > people.length ? ` of ${intel.totals.people}` : ''})</h3><p style="color:#666">They wrote to us and went quiet.</p><ul>`);
      people.forEach(pushIntel);
      html.push('</ul>');
    }
  } else if (intel) {
    lines.push('', 'No intelligence is waiting for a decision today.');
    html.push('<p>No intelligence is waiting for a decision today.</p>');
  }
  renderPursued();
  if (n === 0) {
    lines.push('', 'Nothing on the list needs you today. Open Work to see what is waiting and what is parked.');
    html.push('<p>Nothing on the list needs you today. Open Work to see what is waiting and what is parked.</p>');
  } else {
    // C31: the START target is item 1 of the plan, named here so the pointer and the rows reconcile.
    const first = plan.items[0];
    lines.push('', `Begin with item 1, ${first.accountName}: ${endSentence(first.title)} ${links.start}`, '');
    html.push(`<p><a href="${esc(links.start)}" style="font-weight:600">Begin with item 1, ${esc(first.accountName)}: ${esc(endSentence(first.title))}</a></p>`);
    // The sections: what is owed and prepared, numbered in the plan's order; the stalled deals in one line.
    const isDealHygiene = (it: PlanItem) => it.kind === 'deal' && it.stateKind === 'in_deal' && !/^Next step/i.test(it.title);
    const sections: Array<{ title: string; items: PlanItem[] }> = [
      { title: 'Ready to send', items: plan.items.filter((it) => it.kind === 'ready') },
      { title: 'Owed and in conversation', items: plan.items.filter((it) => it.kind === 'commitment' || it.kind === 'reply' || it.kind === 'meeting') },
      { title: 'Follow-ups', items: plan.items.filter((it) => it.kind === 'follow_up') },
      { title: 'Deals with a next step', items: plan.items.filter((it) => it.kind === 'deal' && !isDealHygiene(it)) },
      { title: 'Everything else', items: plan.items.filter((it) => !['ready', 'commitment', 'reply', 'meeting', 'follow_up', 'deal'].includes(it.kind)) },
    ];
    const index = new Map(plan.items.map((it, i) => [it.key, i + 1]));
    for (const s of sections) {
      if (!s.items.length) continue;
      lines.push(`${s.title} (${s.items.length})`);
      html.push(`<h3>${esc(s.title)} (${s.items.length})</h3><ol>`);
      for (const it of s.items) {
        const k = index.get(it.key) ?? 0;
        const card = itemCardLines(it);
        lines.push(itemLine(it, k), ...card.map((l) => `   ${l}`), `   ${links.item(it)}`);
        html.push(`<li value="${k}">${esc(itemLine(it, k).replace(/^\d+\. /, ''))}${card.length ? `<br/><span style="color:#666">${card.map(esc).join('<br/>')}</span>` : ''} <a href="${esc(links.item(it))}">Open</a></li>`);
      }
      html.push('</ol>');
      lines.push('');
    }
    const hygiene = plan.items.filter(isDealHygiene);
    if (hygiene.length) {
      // C32: a deal's words are kept whole or cut at a sentence end, never mid-sentence.
      const line = `Deals, in one line (${hygiene.length}): ${hygiene.map((it) => `${it.accountName}${it.why ? ` (${clipAtSentence(it.why.replace(/^(The deal's next step|A stalled deal): /, ''), 160).replace(/\.$/, '')})` : ''}`).join('; ')}. The deal workspace holds the detail.`;
      lines.push(line);
      html.push(`<p>${esc(line)}</p>`);
    }
  }
  // X18: the carried work, counted by the day it came from.
  const carried = plan.items.filter((it) => it.carriedFrom);
  if (carried.length) {
    const byDay = new Map<string, number>();
    for (const it of carried) byDay.set(it.carriedFrom as string, (byDay.get(it.carriedFrom as string) ?? 0) + 1);
    const words = (k: number) => (k === 1 ? 'one' : String(k));
    const line = `Carried over: ${carried.length} of ${n} (${[...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, k]) => `${words(k)} from ${dayLabel(d)}`).join(', ')}).`;
    lines.push('', line);
    html.push(`<p>${esc(line)}</p>`);
  }
  // GUI-11: the bookkeeping after the items: how the digest was composed, the coverage, the retained list, the counts.
  if (bookkeeping.text.length) {
    lines.push('', ...bookkeeping.text);
    html.push(...bookkeeping.html);
  }
  const counts = `Waiting on them: ${c.waiting} ${plural(c.waiting, 'account')}. Parked (research, holds, set aside): ${c.parked} ${plural(c.parked, 'account')}. Snoozed: ${c.snoozed} ${plural(c.snoozed, 'account')}.`;
  lines.push('', counts, `Everything, with what is waiting and parked: ${links.work}`);
  html.push(`<p>${esc(counts)}<br/><a href="${esc(links.work)}">Everything, with what is waiting and parked</a></p>`);
  if (input.commandsEnabled) {
    // GUI-09: every command with its exact effect, one line each; no line starts with a command word or a selection.
    const cmd = [
      'To work from your inbox, reply with START and item 1 arrives as its own email. Reply ITEM 6 (or OPEN 6, SEND ME 6) and item 6 arrives as its own email; ITEM alone lists the items with their numbers.',
      'On an item\'s email, the first line of your reply is the command:',
      '- Reply APPROVE to approve its email for the send step in the app only; nothing is sent until you press CONFIRM + SEND there.',
      '- Reply REVISE: your words and GAP rewrites the email on your words and sends the revision back to you.',
      '- Reply SKIP to set it aside for today; DEFER Oct 14 to bring it back that day; DONE: what happened to record your words as the record.',
      '- Reply NEXT for the next item; HELP for this list.',
      'Opening a link in this email never approves or sends anything. A reply to a GAP message reaches GAP only, never a buyer.',
    ];
    lines.push('', ...cmd);
    html.push(`<p>${cmd.map(esc).join('<br/>')}</p>`);
  }
  if (input.legacyDigest) {
    const legacy = 'The HubSpot pipeline digest still arrives separately each morning; say the word and it stops.';
    lines.push('', legacy);
    html.push(`<p style="color:#666">${esc(legacy)}</p>`);
  }
  const stamp = `Sent by GAP at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York. This is an internal message to you; nothing in it went to a buyer.`;
  lines.push('', stamp);
  html.push(`<p style="color:#888;font-size:12px">${esc(stamp)}</p>`);
  // GUI-11: one column, table-free, 640px at most with 16px side padding; long links and words wrap at 360px.
  const wrapper = 'max-width:640px;margin:0 auto;padding:0 16px;font-family:system-ui,sans-serif;font-size:15px;line-height:1.45;color:#111;overflow-wrap:anywhere;word-break:break-word';
  return { subject, text: lines.join('\n'), html: `<div style="${wrapper}">${html.join('\n')}</div>`, digest: { keys: digest.keys, omitted: digest.omitted, breakdown: digest.breakdown, rotated: digest.rotated } };
}
