/**
 * THE ASSIGNMENT PACKET (the Gmail action UI audit, GUI-02 to GUI-08, 2026-10-10). Server only; nothing here writes.
 *
 * One view model for the assignment email and its two renderers (text and HTML), so the seller can decide and act
 * from Gmail: the evidence, the relationship history, the business contact details, the source links and the
 * prepared material, with uncertain information shown and labelled (he judges). Missing contact fields or an
 * unprepared draft never block the intelligence. The layout, in this order:
 *
 *   STOP (first, only for an opt-out)           "STOP: Tim Cooper asked not to be contacted on Oct 5, 2026"
 *   the first line                              the account, the person and the current situation, as of when
 *   What changed or remains unresolved          two or three facts: the event date and source; the capture or import
 *                                               date apart; the producer's interpretation apart and optional
 *   Who                                         name, title, company; email; phones by kind with source and update
 *                                               date; time zone; LinkedIn; HubSpot contact, company, deal links;
 *                                               unknown says unavailable; every person carries the relationship word
 *   Relationship                                last inbound and outbound with dates, any later response, meetings,
 *                                               the open deal and stage, promises, drafts, the opt-out, the links,
 *                                               and what was searched and when
 *   Evidence                                    two or three excerpts with a descriptive source and date; the rest
 *                                               counted as independent sources, syndications never counted
 *   Possible next move                          the move and the options including no action, each with a reason;
 *                                               internal, vendor and administrative work labelled
 *   Prepared material (only when prepared)      "Ready to send" only with the actual matching recipient and the
 *                                               complete message (the IW15 hold stands); else "Nothing is prepared
 *                                               yet; preparation remains" with what is missing
 *   Controls                                    the commands with their exact effects; a link never approves or sends
 *
 * Pinned by tests/unit/gap/gui-packet.test.ts. The text and the HTML are rendered from ONE section model.
 */
import type { AskContext } from '../ask/grounding';
import { contactPacketFor, type ContactPacket, type ContactPacketDeps } from '../people/contact-packet';
import { accountHref } from '../account-intel/href';
import { dateOnlyText, importOf, producerLabel } from '../signals/intelligence-record';
import { properCase } from '../people/contact-packet';
import { nameFromAddress, personWords } from './relationship-state';
import { COMMAND_WORDS } from './briefing';
import { cleanLine, clipWords, dedupeSentences } from './clean-text';
import type { PursuedItem } from './intel';
import type { DayPlan, PlanItem } from './plan';
import { dateWords, dealsFromSummary, relationshipStateFor, type RelationshipDeps, type RelationshipState } from './relationship-state';
import type { PackLike, Prepared } from './assignment';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface PacketSource {
  label: string;
  url: string | null;
}

export interface PacketFact {
  text: string;
  eventDate: string | null;
  reportedOn: string | null;
  capturedOn: string | null;
  source: PacketSource;
  interpretation: string | null;
  /** Only the producer's claim is available (a headline, a classifier score, a label): said as such. */
  weak: boolean;
  /** What kind of claim the text is: a reported fact with an outside source, our own interpretation (a dossier, a thesis), or the buyer's words. */
  claim: 'reported' | 'interpretation' | 'buyer';
}

export interface PacketEvidence {
  text: string;
  source: PacketSource;
  eventDate: string | null;
  reportedOn: string | null;
  weak: boolean;
  /** The story marked it unverified (a fact whose present-day status is not established). */
  unverified?: boolean;
}

/** Our own web properties: a record whose only sources are these is our interpretation, never a reported fact. */
export const OWN_SOURCE_DOMAINS = ['yardflow.ai', 'modex-gtm.vercel.app', 'freightroll.com'];
const ownUrl = (url: string | null | undefined) => !!url && OWN_SOURCE_DOMAINS.some((d) => { try { const h = new URL(url).hostname.replace(/^www\./, ''); return h === d || h.endsWith(`.${d}`); } catch { return false; } });

/**
 * The sales documents GAP serves itself (modex-gtm's public/docs): the canonical links the vault's notes name by
 * title ("Pilot-Program"). Nothing is invented: a name not here has no link on record.
 */
export const KNOWN_ASSET_PATHS: Readonly<Record<string, string>> = {
  'pilot-program': '/docs/pilot-program.pdf',
  'pricing-and-packaging': '/docs/pricing-and-packaging.pdf',
  'roi-one-pager': '/docs/roi-one-pager.pdf',
  'solution-overview': '/docs/solution-overview.pdf',
};
/** The asset registry as a link function over the app's base URL. */
export const knownAssetLink = (baseUrl: string) => (name: string): string | null => {
  const path = KNOWN_ASSET_PATHS[name.toLowerCase()];
  return path ? `${baseUrl.replace(/\/$/, '')}${path}` : null;
};

/** A blanket instruction the agent imposed on the seller ("Nobody at X gets a cold email until then"): not a rule GAP enforces, so it is not said. */
const BLANKET = /\s*Nobody (?:at [^.]*|they named) gets a cold email until [^.]*\.|;?\s*[Tt]he account cools before anyone else is touched(\.?)|;?\s*a cold email to anyone else waits for their answer(\.?)|\s*before anyone (?:there|at the account) gets a cold email(\.?)/g;
export const stripBlanket = (s: string): string => s.replace(BLANKET, (m, d1?: string, d2?: string, d3?: string) => (m.trimStart().startsWith(';') ? (d1 || d2 || d3 || '') : '')).replace(/\s{2,}/g, ' ').trim();

export type MoveKind = 'outbound' | 'internal' | 'administrative' | 'vendor' | 'none';

export interface PacketMove {
  label: string;
  reason: string;
  kind: MoveKind;
}

export interface PacketAsset {
  name: string;
  url: string | null;
}

export interface AssignmentPacket {
  account: string;
  accountUrl: string;
  person: ContactPacket | null;
  /** The situation after the first line's colon: the item's why and the state line, repeated sentences dropped. */
  situation: string;
  /** The opt-out, first in the packet (GUI-06); derived from the relationship. */
  stop: { name: string; at: string | null; words: string | null; source: string } | null;
  changed: PacketFact[];
  who: ContactPacket[];
  relationship: RelationshipState;
  /** The between-us lines of the story (printed under Relationship, not Evidence). */
  betweenUs: string[];
  evidence: PacketEvidence[];
  /** Independent sources on record beyond the printed excerpts (syndications not counted). */
  evidenceMore: number;
  whyTheyCare: string | null;
  buyerSaid: Array<{ text: string; who: string | null; at: string | null }>;
  /** The move in words (what "The move:" says). */
  move: string;
  moves: PacketMove[];
  prepared: Prepared;
  /** The sender the prepared email would go from (the GAP mailbox), or null when none is configured. */
  preparedSender: string | null;
  /** The pack's sources ("title (date) url"). */
  preparedSources: string[];
  /** X09: the line above a proposed revision ("Revised on your words: ..."), internal. */
  note: string | null;
  assets: PacketAsset[];
  hold: { reason: 'recipient_mismatch'; detail: string } | null;
  /** A prepared angle that later correspondence with its target supersedes: what happened since, in words; null when the angle stands. */
  angleSuperseded: { since: string; target: string } | null;
  coverageLine: string | null;
  sellerNote: string[];
  /** GUI-08: a deal item's context, in lines (the exchange, the stakeholder, the promise, the next-step evidence). */
  dealContext: string[];
  /** The item's kind and state words (the digest's summary reads the same). */
  item: { kind: PlanItem['kind']; stateKind: PlanItem['stateKind']; title: string; personName: string | null; personTitle: string | null };
  /** ISO instant the packet was built. */
  asOf: string;
}

export interface BuildPacketArgs {
  item: PlanItem;
  plan: DayPlan;
  now: Date;
  ctx: AskContext | null;
  pack: PackLike | null;
  /** The pursued items at read time (the prepared angle is read off them by the caller; here they add the writer's name). */
  pursued: PursuedItem[];
  prepared: Prepared;
  hold: AssignmentPacket['hold'];
  /** The prepared copy (the pack's queued, or X09's override) when an email is prepared; null otherwise. */
  copy: { subject: string; body: string; to: string | null } | null;
  note?: string | null;
  baseUrl: string;
  senderEmail?: string | null;
  /** The in-deals summary the assignment already read (the deal links and stages); null or absent means not read, said. */
  inDeals?: InDealsSummaryLike | null;
}

export type InDealsSummaryLike = Parameters<typeof dealsFromSummary>[0];

export interface BuildPacketDeps {
  relationship?: (prisma: PrismaLike, q: { accountName: string; email: string | null; name: string | null; now: Date }) => Promise<RelationshipState>;
  relationshipDeps?: RelationshipDeps;
  contact?: ContactPacketDeps;
  /** The account's imported intelligence records (gap_signals of origin report_import); absent means the table. */
  imported?: (prisma: PrismaLike, accountName: string) => Promise<ImportedRow[]>;
  /** A link for a named asset ("Pilot-Program"), when a registry knows one; absent means the app's own documents (KNOWN_ASSET_PATHS). */
  assetLink?: (name: string, accountName: string) => string | null;
  /** The account's signal rows with links, for the evidence links; absent means the table. */
  signalLinks?: (prisma: PrismaLike, accountName: string) => Promise<SignalLinkRow[]>;
}

export interface ImportedRow {
  id: string;
  title: string | null;
  url: string | null;
  source_name: string | null;
  published_at: Date | string | null;
  metadata: unknown;
  created_at: Date | string;
}

const COMMAND_LINE = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
/** A body line must never start with a command word; one that would is led with a dash. */
export const safeLine = (s: string) => (COMMAND_LINE.test(s) ? `- ${s}` : s);
const endSentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
/** A move as an option label: the sentence without its final period (the reason follows a colon). */
const moveLabel = (s: string) => cleanLine(s).replace(/[.]+$/, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clock = (d: Date) => `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York`;
const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const textKey = (s: string) => cleanLine(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
const BETWEEN_US = 'What has happened between us';
const CHANGING = 'What is changing';
const NOTE_ROW = 'Your note';
/** A named sales document in the vault's words ("Pilot-Program", "ROI-One-Pager"); an all-caps token ("RETIREMENT-HANDOFF") is not one. */
const ASSET_NAME = /\b([A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+)\b/g;
const URL_IN = /https?:\/\/[^\s)<>"']+/g;

/** The situation sentence list with repeats dropped ("Opted out: Tim Cooper, Oct 5" said once). */
function situationOf(item: PlanItem, ctx: AskContext | null, hold: AssignmentPacket['hold']): string {
  if (hold) return `Held: ${cleanLine(hold.detail)}`;
  const parts = [endSentence(item.why), ctx?.state.stateLine ? endSentence(ctx.state.stateLine) : null].filter((x): x is string => !!x);
  const sentences = parts.flatMap((p) => p.split(/(?<=[.!?])\s+/)).map(cleanLine).map(stripBlanket).filter(Boolean);
  const own = item.person?.name ? nameKeyOf(item.person.name) : null;
  // "Someone replied: Cowan, David, Jun 10" on Phil's item: another person's reply is the account's state, not this item's.
  const kept = own ? sentences.filter((x) => { const m = /^(?:Someone replied|Opted out|Replied|Wrote):\s*(.+?),\s*[A-Z][a-z]{2} \d{1,2}/.exec(x); return !m || nameKeyOf(m[1]) === own; }) : sentences;
  return dedupeSentences(kept).join(' ');
}

const nameKeyOf = (s: string | null | undefined) => lower(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
/** "Oct 9" or "Oct 9, 2025" as an ISO day on the seller's clock; a day without a year is this year, or last year when it would be ahead of now. */
export function storyDate(words: string, now: Date): string | null {
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})(?:,\s*(\d{4}))?$/.exec(words.trim());
  if (!m || MONTHS[m[1].toLowerCase()] === undefined) return null;
  const month = MONTHS[m[1].toLowerCase()];
  let year = m[3] ? Number(m[3]) : now.getUTCFullYear();
  let d = new Date(Date.UTC(year, month, Number(m[2]), 12));
  if (!m[3] && d.getTime() > now.getTime() + 86_400_000) { year -= 1; d = new Date(Date.UTC(year, month, Number(m[2]), 12)); }
  return d.toISOString().slice(0, 10);
}
/** The story's "Last email to <name>, <date>" or "We wrote <name> on <date>" line for a person, as a dated fact. */
export function storyWroteOn(lines: readonly string[], name: string, now: Date): { at: string; source: string } | null {
  for (const raw of lines) {
    const l = cleanLine(raw);
    const m = /^(?:Last email to|We wrote)\s+(.+?)(?:,\s+([A-Z][a-z]{2}\s+\d{1,2}(?:,\s*\d{4})?)|\s+on\s+([A-Z][a-z]{2}\s+\d{1,2}(?:,\s*\d{4})?))[:.]/.exec(l);
    if (!m) continue;
    const named = m[1].split(',')[0].trim();
    if (nameKeyOf(named) !== nameKeyOf(name)) continue;
    const at = storyDate(m[2] ?? m[3] ?? '', now);
    if (!at) continue;
    const src = /\(([^()]+)\)\s*$/.exec(l)?.[1] ?? 'the account story';
    return { at, source: src };
  }
  return null;
}
/** A buyer quote cut short upstream ("...once on video a fe") takes the story's longer copy of the same words when one exists. */
export function lengthenQuote(text: string, lines: readonly string[]): string {
  const plain = (s: string) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ').trim();
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length < 60 || /[.!?"]$/.test(t)) return t;
  const head = plain(t).slice(0, 50).toLowerCase();
  for (const raw of lines) {
    for (const q of plain(raw).matchAll(/"([^"]{60,})"/g)) {
      const cand = q[1].trim();
      if (cand.length > t.length && cand.toLowerCase().startsWith(head)) return cand;
    }
  }
  return t;
}

/** The people a between-us line names ("Last email to Dave Kiesling, Oct 9", "Craig Morrison, Vice President replied on Sep 24"). */
export function peopleNamedIn(lines: readonly string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const l = cleanLine(raw);
    const m = /^(?:Last email to|We wrote)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)+?)(?:,|\s+on\b)/.exec(l) ?? /^([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)+?)(?:,.*?)?\s+(?:replied|wrote|opted out)\b/.exec(l);
    if (m && !out.some((x) => nameKeyOf(x) === nameKeyOf(m[1]))) out.push(m[1]);
  }
  return out;
}

/** "reported by supplychaindive.com, Oct 1, 2026" -> the label and the date words it carries. */
function sourceOfBasis(basis: string): { label: string; date: string | null } {
  const b = cleanLine(basis);
  const m = b.match(/^(?:reported by|the anchor:|per)\s+(.+?)(?:,\s*([A-Z][a-z]{2} \d{1,2},? \d{4}|[A-Z][a-z]{2} \d{1,2}))?$/);
  if (m) return { label: m[1], date: m[2] ?? null };
  return { label: b, date: null };
}

/** The producer's imported records at the account, read through the contract's guard (importOf). */
async function defaultImported(prisma: PrismaLike, accountName: string): Promise<ImportedRow[]> {
  if (typeof prisma?.gapSignal?.findMany !== 'function') return [];
  return prisma.gapSignal.findMany({
    where: { account_name: accountName, origin: 'report_import', feedback: null, resolution: { not: 'rejected' }, source_class: { not: 'report_archive' } },
    orderBy: { created_at: 'desc' },
    take: 12,
    select: { id: true, title: true, url: true, source_name: true, published_at: true, metadata: true, created_at: true },
  }).catch(() => []);
}

function factsFromImported(rows: ImportedRow[]): PacketFact[] {
  const out: PacketFact[] = [];
  for (const r of rows) {
    const rec = importOf(r.metadata);
    if (!rec || rec.visibility === 'archive') continue;
    const outside = rec.sources.find((s) => s.url && !ownUrl(s.url)) ?? null;
    const src = outside ?? rec.sources.find((s) => s.url) ?? rec.sources[0] ?? null;
    // A dossier we wrote, or a record whose only links are our own pages, is our interpretation: said as such, never "reported".
    const ours = rec.producer === 'war_room_dossier' || (!outside && rec.sources.some((s) => ownUrl(s.url)));
    const weak = !ours && !src?.url;
    out.push({
      text: clipWords(cleanLine(rec.text || rec.title), 260),
      eventDate: rec.eventDate ? dateOnlyText(rec.eventDate) : null,
      reportedOn: `${dateOnlyText(rec.reportedOn)}${rec.reportedOnBasis === 'captured' ? ' (the capture date; the report states none)' : ''}`,
      capturedOn: dateWords(rec.importedAt),
      source: { label: ours ? `${producerLabel(rec.producer)}, our own material` : weak ? `${producerLabel(rec.producer)}: only the producer's claim is available` : src?.publisher ?? src?.label ?? producerLabel(rec.producer), url: src?.url ?? null },
      interpretation: rec.interpretation ? clipWords(cleanLine(rec.interpretation), 200) : null,
      weak,
      claim: ours ? 'interpretation' : 'reported',
    });
  }
  return out;
}

function evidenceFromStory(ctx: AskContext | null): { evidence: PacketEvidence[]; changed: PacketFact[]; betweenUs: string[] } {
  const evidence: PacketEvidence[] = [];
  const changed: PacketFact[] = [];
  const betweenUs: string[] = [];
  for (const row of ctx?.story ?? []) {
    for (const l of row.lines) {
      const text = cleanLine(l.text);
      if (!text) continue;
      if (row.label === BETWEEN_US) { betweenUs.push(`${endSentence(text)}${l.basis ? ` (${cleanLine(l.basis)})` : ''}`); continue; }
      if (row.label === NOTE_ROW) continue;
      const src = sourceOfBasis(l.basis || 'no source named');
      // Weak is a producer's bare claim (a headline, a score); an unverified or unknown fact is said apart, never as "the producer's claim".
      const weak = /only the producer|headline|classifier|fit_rationale|score \d/i.test(l.basis);
      const unverified = l.tag === 'Unverified';
      const ours = /^(our read|our thesis)/i.test(l.basis) || /\(our read[;,]/i.test(text);
      // A story's "reported by X, <date>" basis: the date is the REPORT's, the label the publisher; the event date is not stated.
      if (row.label === CHANGING) changed.push({ text: endSentence(text), eventDate: null, reportedOn: src.date, capturedOn: null, source: { label: src.label || 'no source named', url: null }, interpretation: null, weak, claim: ours ? 'interpretation' : 'reported' });
      else evidence.push({ text: endSentence(text), source: { label: cleanLine(l.basis) || 'no source named', url: null }, eventDate: src.date, reportedOn: null, weak, unverified });
    }
  }
  return { evidence, changed, betweenUs };
}

/** The pack's hypothesis signals as evidence: a title with a link is a headline link, never full evidence. */
function evidenceFromPack(pack: PackLike | null): { evidence: PacketEvidence[]; sources: string[] } {
  const signals = (pack?.hypothesis?.signals ?? []).map((s) => s.signal).filter((s): s is NonNullable<typeof s> => !!s && !!s.title);
  const sources = signals.map((s) => `${s.title}${s.observed_at ? ` (${dateWords(s.observed_at)})` : ''}${s.evidence_url ? ` ${s.evidence_url}` : ''}`);
  const host = (u: string | null | undefined): string | null => { if (!u) return null; try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };
  const evidence = signals.map((s) => ({ text: `${cleanLine(String(s.title))} (a headline link, not full evidence)`, source: { label: host(s.evidence_url) ?? 'the pack', url: s.evidence_url ?? null }, eventDate: s.observed_at ? dateWords(s.observed_at) : null, reportedOn: null, weak: true }));
  return { evidence, sources };
}

/** The account's signal rows GAP holds (title, url, publisher), bounded, for linking a story excerpt to its original article. */
export interface SignalLinkRow { title: string | null; url: string | null; source_name: string | null }
async function defaultSignalLinks(prisma: PrismaLike, accountName: string): Promise<SignalLinkRow[]> {
  if (typeof prisma?.gapSignal?.findMany !== 'function') return [];
  return prisma.gapSignal.findMany({ where: { account_name: accountName, url: { not: null } }, orderBy: { created_at: 'desc' }, take: 80, select: { title: true, url: true, source_name: true } }).catch(() => []);
}
/** The first words of a text as a match key (the story's excerpt starts with the signal's title or summary). */
const headKey = (s: string) => textKey(s).split(' ').slice(0, 9).join(' ');
/** An excerpt gets its original link when a signal row's title (or the excerpt) starts the other. */
export function linkEvidence<T extends { text: string; source: PacketSource }>(items: T[], rows: readonly SignalLinkRow[]): T[] {
  if (!rows.length) return items;
  return items.map((e) => {
    if (e.source.url) return e;
    const k = headKey(e.text);
    if (k.split(' ').length < 4) return e;
    const hit = rows.find((r) => {
      if (!r.url || !r.title) return false;
      const t = headKey(r.title);
      if (t.length < 16) return false;
      const shorter = Math.min(t.length, k.length);
      const longer = Math.max(t.length, k.length);
      // Six words of the shorter key, and the shorter covers most of the longer: a short profile title never claims a story.
      return (k.startsWith(t) || t.startsWith(k)) && (t.length <= k.length ? t : k).split(' ').length >= 6 && shorter >= 0.8 * longer;
    });
    return hit?.url ? { ...e, source: { ...e.source, url: hit.url } } : e;
  });
}

/** Independent evidence: one entry per distinct text; syndications of one text under several names count once. */
function independent(ev: PacketEvidence[]): PacketEvidence[] {
  const seen = new Set<string>();
  const out: PacketEvidence[] = [];
  for (const e of ev) {
    const k = textKey(e.text.replace(/\s*\(a headline link, not full evidence\)$/, ''));
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

/** GUI-08: the documents the vault note names, with a link when one is on record. */
export function assetsOf(lines: readonly string[], accountName: string, link?: (name: string, accountName: string) => string | null): PacketAsset[] {
  const out = new Map<string, string | null>();
  for (const raw of lines) {
    const line = cleanLine(raw);
    const urls = raw.match(URL_IN) ?? [];
    for (const m of line.matchAll(ASSET_NAME)) {
      const name = m[1];
      // A document is Title-Cased at both ends ("Pricing-and-Packaging", "ROI-One-Pager"); "In-sourcing" and "RETIREMENT-HANDOFF" are words.
      const parts = name.split('-');
      if (name === name.toUpperCase() || !/^[A-Z0-9]/.test(parts[parts.length - 1]) || out.has(name)) continue;
      const slug = name.toLowerCase();
      const url = urls.find((u) => u.toLowerCase().includes(slug)) ?? link?.(name, accountName) ?? null;
      out.set(name, url);
    }
  }
  return [...out.entries()].map(([name, url]) => ({ name, url }));
}

/** The possible moves for the item: the lead, then the alternatives, each with a reason; no outbound to an opted-out person. */
export function movesOf(x: { item: PlanItem; move: string; prepared: Prepared; hold: AssignmentPacket['hold']; rel: RelationshipState; personName: string | null; angleSuperseded?: AssignmentPacket['angleSuperseded'] }): PacketMove[] {
  const moves: PacketMove[] = [];
  const who = x.personName ?? 'them';
  const stopped = !!x.rel.optOut;
  const vendorish = x.rel.purpose === 'vendor_solicitation' || x.rel.purpose === 'media';
  if (stopped) {
    moves.push({ label: `Record ${who}'s opt-out as do not contact and close the item (DONE: what happened)`, reason: 'they asked not to be contacted; nothing goes back to them from this item', kind: 'administrative' });
    moves.push({ label: 'No action (SKIP)', reason: 'the opt-out stands either way; nothing is lost by leaving it', kind: 'none' });
    return moves;
  }
  if (x.hold) {
    moves.push({ label: 'Choose the person on the account, then APPROVE on the next revision', reason: 'the prepared email and this item name different people; nothing goes out until they agree', kind: 'internal' });
    moves.push({ label: 'No action (DEFER)', reason: 'the hold stands; the item returns on the next plan', kind: 'none' });
    return moves;
  }
  if (vendorish) {
    moves.push({ label: `File it (DONE: what happened), no reply`, reason: `${who} is ${x.rel.purposeWord}; not a buyer conversation`, kind: x.rel.purpose === 'media' ? 'administrative' : 'vendor' });
    moves.push({ label: 'Answer them yourself from Gmail', reason: 'only if you want the conversation; GAP prepares nothing for a vendor or media sender', kind: 'administrative' });
    moves.push({ label: 'No action (SKIP)', reason: 'nothing is owed', kind: 'none' });
    return moves;
  }
  if (x.prepared.kind === 'email') {
    moves.push({ label: moveLabel(x.move), reason: `a prepared email to ${x.prepared.to ?? who} is below; APPROVE sends it to the send step in the app (CONFIRM + SEND there)`, kind: 'outbound' });
    moves.push({ label: 'Revise the email (REVISE: your words)', reason: 'GAP rewrites the copy on your words and sends a new revision here; nothing goes out', kind: 'outbound' });
    moves.push({ label: 'No action today (DEFER)', reason: 'the item returns on the next plan; the prepared email keeps', kind: 'none' });
    return moves;
  }
  if (x.prepared.kind === 'angle') {
    if (!x.prepared.who) {
      moves.push({ label: 'Choose the person on the account for the prepared angle', reason: 'the angle names nobody; a first touch needs a person before any copy is written', kind: 'internal' });
      moves.push({ label: 'No action today (DEFER)', reason: 'the item returns on the next plan', kind: 'none' });
      return moves;
    }
    if (x.angleSuperseded) {
      moves.push({ label: `Continue the correspondence with ${x.angleSuperseded.target} in your own words`, reason: `${x.angleSuperseded.since}; the prepared angle predates it and is kept below for reference, not as a first touch`, kind: 'outbound' });
      moves.push({ label: `Call ${x.angleSuperseded.target}`, reason: 'a call needs no copy; record what happened with DONE', kind: 'outbound' });
    } else {
      moves.push({ label: `Write ${x.prepared.who} from the prepared angle, in your own words`, reason: 'the angle is grounded; the email is not written yet (nothing is prepared to send)', kind: 'outbound' });
      moves.push({ label: `Call ${x.prepared.who} on the opener`, reason: 'a call needs no copy; record what happened with DONE', kind: 'outbound' });
    }
    moves.push({ label: 'No action today (DEFER)', reason: 'the item returns on the next plan', kind: 'none' });
    return moves;
  }
  const admin = x.item.kind === 'admin' || x.item.stateKind === 'replied';
  if (x.rel.requestState === 'unfulfilled' && x.rel.request) {
    moves.push({ label: `Answer ${who}'s request of ${dateWords(x.rel.request.at)}${x.rel.request.draft ? ' (a draft exists, unsent)' : ''}`, reason: x.rel.request.basis, kind: 'outbound' });
  } else if (x.rel.requestState === 'unknown' && x.rel.request) {
    moves.push({ label: `Check whether ${who}'s request of ${dateWords(x.rel.request.at)} was met before writing`, reason: x.rel.request.basis, kind: 'internal' });
  } else if (x.rel.requestState === 'redirected' && x.rel.request?.redirectedTo) {
    const r = x.rel.request.redirectedTo;
    moves.push(r.writtenAfter
      ? { label: `Follow the thread with ${r.name} (we wrote ${dateWords(r.writtenAfter.at)}), not ${who}`, reason: x.rel.request.basis, kind: 'outbound' }
      : { label: `Write ${r.name}, whom ${who} pointed to on ${dateWords(r.at)}`, reason: x.rel.request.basis, kind: 'outbound' });
  }
  moves.push({ label: moveLabel(stripBlanket(x.move)), reason: admin ? 'an administrative item: record what they said or dismiss it; no outbound is prepared' : x.item.kind === 'deal' ? "the deal's next step as GAP reads it; the exchange and the promise are under Relationship" : "GAP's read of the next step; nothing is prepared to send", kind: admin ? 'administrative' : x.item.kind === 'deal' ? 'outbound' : 'internal' });
  if (admin) moves.push({ label: 'Record what they said (DONE: what happened) or dismiss it (SKIP)', reason: 'either settles the item for the day', kind: 'administrative' });
  moves.push({ label: 'No action today (DEFER)', reason: 'the item returns on the next plan', kind: 'none' });
  return moves;
}

/** GUI-08: a deal item's context lines: the exchange, the stakeholder, the promise, the next-step evidence; never the close date alone. */
function dealContextOf(item: PlanItem, rel: RelationshipState, sellerNote: readonly string[]): string[] {
  if (item.kind !== 'deal' && item.stateKind !== 'in_deal') return [];
  const lines: string[] = [];
  for (const d of rel.deals) {
    lines.push(`The deal: ${d.name}${d.stage ? ` (${d.stage})` : ''}${d.url ? ` ${d.url}` : ''}.${d.lastActivityAt ? ` Last HubSpot activity ${dateWords(d.lastActivityAt)}.` : ' No HubSpot activity date on the deal.'}${d.closeDate ? ` Close date ${dateWords(d.closeDate)} (a field on the deal, not evidence of activity).` : ''}`);
    lines.push(d.nextStep ? `Next step on the deal (HubSpot): ${endSentence(cleanLine(d.nextStep))}` : 'Next step on the deal (HubSpot): none written.');
  }
  if (!rel.deals.length) lines.push('No open deal was read for this account (see Searched).');
  const stakeholder = rel.person.name ?? rel.person.email;
  lines.push(stakeholder ? `Stakeholder: ${stakeholder} (${rel.purposeWord}).` : 'Stakeholder: nobody named on the item; the people are under Who.');
  const last = [rel.lastInbound ? `they wrote ${dateWords(rel.lastInbound.at)}${rel.lastInbound.subject ? ` ("${rel.lastInbound.subject}")` : ''}` : null, rel.lastOutbound ? `we wrote ${dateWords(rel.lastOutbound.at)}${rel.lastOutbound.subject ? ` ("${rel.lastOutbound.subject}")` : ''}` : null].filter(Boolean);
  lines.push(last.length ? `Last meaningful exchange: ${last.join('; ')}.` : stakeholder ? 'Last meaningful exchange: none on record in what was searched.' : 'Last meaningful exchange: nobody is named on the item; the correspondence lines above carry the account\'s exchanges.');
  const promise = rel.promises[0];
  lines.push(promise ? `Promise: "${promise.title}" (${promise.owner}${promise.dueAt ? `, due ${dateWords(promise.dueAt)}` : ''}, ${promise.status}).` : 'Promise: none on the ledger.');
  const vaultNext = sellerNote.find((l) => /^next action/i.test(cleanLine(l)));
  if (vaultNext) lines.push(`${endSentence(cleanLine(vaultNext))} (your vault note; not a buyer commitment)`);
  return lines;
}

export async function buildAssignmentPacket(prisma: PrismaLike, a: BuildPacketArgs, deps: BuildPacketDeps = {}): Promise<AssignmentPacket> {
  const { item, ctx, now } = a;
  const personName = item.person?.name ?? null;
  // A reply item names its person without an address (the card carries name and title only); the address is on the
  // inbound message the item's link points at (`from=reply:<id>`), so the relationship and the contact can be read.
  const replyId = /from=reply(?:%3A|:)([A-Za-z0-9]+)/.exec(item.href ?? '')?.[1] ?? null;
  const replyRow: { from_email: string | null; from_name: string | null } | null = replyId && typeof prisma?.inboundMessage?.findUnique === 'function'
    ? await prisma.inboundMessage.findUnique({ where: { id: replyId }, select: { from_email: true, from_name: true } }).catch(() => null)
    : null;
  const personEmail = a.copy?.to ?? a.pack?.persona?.email ?? replyRow?.from_email ?? null;
  // The relationship for the item's person: by their address when the prepared email names it and no hold stands, else by name at the account.
  const relQuery = { accountName: item.accountName, email: a.hold ? (replyRow?.from_email ? lower(replyRow.from_email) : null) : personEmail ? lower(personEmail) : null, name: personName, now };
  // The deals come from the summary the assignment already read (one HubSpot-backed read for the day, never one per packet).
  const dealsRead = dealsFromSummary(a.inDeals ?? null, item.accountName);
  const relationshipDeps: RelationshipDeps = { deals: async () => dealsRead, ...(deps.relationshipDeps ?? {}) };
  const relationship = await (deps.relationship ? deps.relationship(prisma, relQuery) : relationshipStateFor(prisma, relQuery, relationshipDeps)).catch((e): RelationshipState => emptyRelationship(relQuery, e instanceof Error ? e.message : String(e)));
  const purposeWord = relationship.purposeWord;

  // Who: the item's person (the one live read), then the account's chosen person when different (no live read).
  const who: ContactPacket[] = [];
  const contactDeps: ContactPacketDeps = { deals: async () => dealsRead.deals, ...(deps.contact ?? {}) };
  const company = relationship.hubspotCompanyId ?? null;
  const first = personName || relationship.person.email
    ? await contactPacketFor(prisma, { name: personName, email: relationship.person.email, accountName: item.accountName, now, hubspotCompanyId: company, fallback: { name: personName, title: item.person?.title ?? null, email: relationship.person.email } }, contactDeps).catch(() => null)
    : null;
  if (first) who.push({ ...first, purpose: purposeWord });
  // One person is one entry: by address, by name, or by a name against an address's words ("dave.kiesling" is Dave Kiesling).
  const sameWords = (name: string | null | undefined, email: string | null | undefined) => !!name && !!email && nameKeyOf(name) === personWords({ name: null, email }).sort().join(' ');
  const has = (name: string | null | undefined, email?: string | null) => who.some((w) => (name && nameKeyOf(w.name) === nameKeyOf(name)) || (email && w.email && lower(w.email) === lower(email)) || sameWords(name, w.email) || sameWords(w.name, email));
  const story = evidenceFromStory(ctx);
  // A name in the correspondence resolves to the address the correspondence carries (HubSpot's logged emails to or from them).
  const addressFor = (name: string): string | null => relationship.correspondents.find((c) => (c.name && nameKeyOf(c.name) === nameKeyOf(name)) || sameWords(name, c.email))?.email ?? null;
  const nameFor = (email: string): string | null => relationship.correspondents.find((c) => c.email === lower(email))?.name ?? null;
  // The prepared email's or angle's target: never recommended by address alone while Who is empty (Kenco, October 10); an angle naming nobody adds nobody.
  const targetEmail = a.prepared.kind === 'angle' ? (a.prepared.who?.includes('@') ? a.prepared.who : a.prepared.email ?? null) : a.prepared.kind === 'email' ? a.prepared.to : null;
  const targetName = a.prepared.kind === 'angle' ? (a.prepared.who && !a.prepared.who.includes('@') ? a.prepared.who : targetEmail ? nameFor(targetEmail) : null) : a.prepared.kind === 'email' ? a.pack?.persona?.name ?? (a.prepared.to ? nameFor(a.prepared.to) : null) : null;
  if ((targetName || targetEmail) && !has(targetName, targetEmail)) {
    const t = await contactPacketFor(prisma, { name: targetName, email: targetEmail ?? (targetName ? addressFor(targetName) : null), accountName: item.accountName, now, hubspotCompanyId: company, fallback: { name: targetName ?? (targetEmail ? nameFromAddress(targetEmail) : null), title: null, email: targetEmail } }, { ...contactDeps, hubspotContact: first ? null : contactDeps.hubspotContact }).catch(() => null);
    if (t) who.push({ ...t, purpose: a.prepared.kind === 'angle' ? 'the prepared angle is for them' : 'the prepared email is to them' });
  }
  const chosen = (ctx?.people ?? []).find((p) => p.chosen && !has(p.name)) ?? null;
  if (chosen) {
    const other = await contactPacketFor(prisma, { name: chosen.name, email: addressFor(chosen.name), accountName: item.accountName, now, hubspotCompanyId: company, fallback: { name: chosen.name, title: chosen.title, email: null } }, { ...contactDeps, hubspotContact: null }).catch(() => null);
    if (other) who.push({ ...other, purpose: `${chosen.slot}: ${cleanLine(chosen.reason)}` });
  }
  // An item with no person of its own names the people the correspondence names (the last person we wrote, the one who replied), bounded.
  if (!personName) {
    for (const name of peopleNamedIn(story.betweenUs)) {
      if (who.length >= 3 || has(name)) continue;
      const email = addressFor(name);
      const c = await contactPacketFor(prisma, { name, email, accountName: item.accountName, now, hubspotCompanyId: company, fallback: { name, title: null, email } }, { ...contactDeps, hubspotContact: null }).catch(() => null);
      if (c) who.push({ ...c, purpose: 'named in the correspondence (under Relationship)' });
    }
  }

  // A prepared angle that the correspondence has moved past: we wrote (or they wrote) its target after the angle was
  // prepared. The angle is kept for reference; the moves follow the correspondence (Kenco: the angle for Dave Kiesling
  // spoke of an undated note while we had written Dave on October 9).
  let angleSuperseded: AssignmentPacket['angleSuperseded'] = null;
  if (a.prepared.kind === 'angle' && a.prepared.preparedAt && (targetName || targetEmail)) {
    const target = who.find((w) => (targetName && nameKeyOf(w.name) === nameKeyOf(targetName)) || (targetEmail && w.email && lower(w.email) === lower(targetEmail))) ?? null;
    const tEmail = target?.email ?? targetEmail;
    const tName = target?.name ?? targetName ?? (tEmail ? nameFromAddress(tEmail) : a.prepared.who ?? 'them');
    const sameAsItem = relationship.person.email && tEmail && lower(relationship.person.email) === lower(tEmail);
    const tRel = sameAsItem ? relationship : (tEmail || tName) ? await (deps.relationship ? deps.relationship(prisma, { accountName: item.accountName, email: tEmail ? lower(tEmail) : null, name: tName, now }) : relationshipStateFor(prisma, { accountName: item.accountName, email: tEmail ? lower(tEmail) : null, name: tName, now }, relationshipDeps)).catch(() => null) : null;
    const since = a.prepared.preparedAt;
    const later = [tRel?.lastOutbound && tRel.lastOutbound.at > since ? `we wrote ${tName} ${dateWords(tRel.lastOutbound.at)}${tRel.lastOutbound.subject ? ` ("${cleanLine(tRel.lastOutbound.subject)}")` : ''} (${tRel.lastOutbound.source})` : null, tRel?.lastInbound && tRel.lastInbound.at > since ? `${tName} wrote ${dateWords(tRel.lastInbound.at)}${tRel.lastInbound.subject ? ` ("${cleanLine(tRel.lastInbound.subject)}")` : ''}` : null].filter((x): x is string => !!x);
    // The account story's own line ("Last email to Dave Kiesling, Oct 9") when the relationship read found nothing newer.
    if (!later.length) {
      const told = storyWroteOn(story.betweenUs, tName, now);
      if (told && told.at > since) later.push(`we wrote ${tName} ${dateWords(told.at)} (${told.source})`);
    }
    if (later.length) angleSuperseded = { since: `since the angle was prepared on ${dateWords(since)}: ${later.join('; ')}`, target: tName };
  }

  // The angle's target by name once Who resolved the address (never "an angle for dave.kiesling@...").
  const prepared: Prepared = a.prepared.kind === 'angle' && a.prepared.who?.includes('@')
    ? { ...a.prepared, who: who.find((w) => w.email && lower(w.email) === lower(a.prepared.kind === 'angle' ? a.prepared.who : null))?.name ?? a.prepared.who }
    : a.prepared;

  const packEv = evidenceFromPack(a.pack);
  const importedRows = await (deps.imported ? deps.imported(prisma, item.accountName) : defaultImported(prisma, item.accountName)).catch(() => [] as ImportedRow[]);
  const signalRows = await (deps.signalLinks ? deps.signalLinks(prisma, item.accountName) : defaultSignalLinks(prisma, item.accountName)).catch(() => [] as SignalLinkRow[]);
  const changed: PacketFact[] = [];
  const whoName = relationship.person.name ?? relationship.person.email ?? 'They';
  if (relationship.request && relationship.requestState !== 'fulfilled') {
    const r = relationship.request;
    const verdict = r.state === 'unfulfilled' ? 'Unresolved' : r.state === 'redirected' ? `Redirected to ${r.redirectedTo?.name ?? 'someone else'}` : 'Whether it was met is unknown';
    changed.push({ text: `${whoName} asked for something on ${dateWords(r.at)}${r.subject ? ` ("${cleanLine(r.subject)}")` : ''}${r.excerpt ? `, "${clipWords(cleanLine(r.excerpt), 140).replace(/[.]+$/, '')}"` : ''}. ${verdict}: ${r.basis}.`, eventDate: dateWords(r.at), reportedOn: null, capturedOn: null, source: { label: relationship.links.threadKind === 'thread' ? 'their Gmail thread' : "GAP's synced inbox", url: relationship.links.thread }, interpretation: null, weak: false, claim: 'buyer' });
  } else if (relationship.request?.state === 'fulfilled') {
    const r = relationship.request;
    changed.push({ text: `${relationship.person.name ?? 'They'} asked for something on ${dateWords(r.at)}${r.subject ? ` ("${cleanLine(r.subject)}")` : ''}; met: ${r.basis}. No repeat send is inferred from the old reply.`, eventDate: dateWords(r.at), reportedOn: null, capturedOn: null, source: { label: "GAP's synced inbox and our Sent", url: relationship.links.thread }, interpretation: null, weak: false, claim: 'buyer' });
  }
  if (relationship.referral && !(relationship.request?.redirectedTo && relationship.request.redirectedTo.at === relationship.referral.at)) {
    const f = relationship.referral;
    changed.push({ text: `${whoName} pointed to ${f.name} on ${dateWords(f.at)}${f.subject ? ` ("${cleanLine(f.subject)}")` : ''}. ${f.writtenAfter ? `We wrote ${f.name} ${dateWords(f.writtenAfter.at)}${f.writtenAfter.subject ? ` under "${cleanLine(f.writtenAfter.subject)}"` : ''} (${f.writtenAfter.source}).` : relationship.outboundRead.read ? `Nothing to ${f.name} on record after that.` : `Whether we wrote ${f.name} is not known (${relationship.outboundRead.basis}).`}`, eventDate: dateWords(f.at), reportedOn: null, capturedOn: null, source: { label: relationship.links.threadKind === 'thread' ? 'their Gmail thread' : "GAP's synced inbox", url: relationship.links.thread }, interpretation: null, weak: false, claim: 'buyer' });
  }
  if (item.context?.lastExchange || item.context?.nextAction) {
    const c = item.context;
    changed.push({ text: [c.lastExchange ? endSentence(cleanLine(c.lastExchange)) : null, c.nextAction ? `Next prepared action: ${endSentence(stripBlanket(cleanLine(c.nextAction)))}` : null].filter(Boolean).join(' '), eventDate: c.date, reportedOn: null, capturedOn: null, source: { label: c.source ?? 'the Work card', url: null }, interpretation: null, weak: false, claim: 'reported' });
  }
  changed.push(...factsFromImported(importedRows));
  changed.push(...story.changed);
  const changedUnique = linkEvidence(dedupeFacts(changed), signalRows).slice(0, 3);

  const allEvidence = linkEvidence(independent([...story.evidence, ...packEv.evidence]), signalRows);
  const evidence = allEvidence.slice(0, 3);
  const sellerNote = ((ctx as { sellerNote?: { lines: string[] } | null } | null)?.sellerNote?.lines ?? []).map((l) => cleanLine(l));
  // A reply item's move is about ITS person's reply, never the account's newest reply from someone else.
  const replyItem = item.stateKind === 'replied' && !!personName;
  const ownReplyAt = replyItem ? (relationship.lastInbound?.at ?? item.context?.date ?? null) : null;
  const move = stripBlanket(replyItem ? `Read ${personName}'s reply${ownReplyAt ? ` of ${dateWords(ownReplyAt)}` : ''} and record what they said.` : ctx?.state.next || item.title);
  const moves = movesOf({ item, move, prepared, hold: a.hold, rel: relationship, personName: first?.name ?? personName, angleSuperseded });
  const coverage = typeof ctx?.coverageLine === 'string' ? ctx.coverageLine.trim() : '';
  // The buyer's words: the item's own person first, each attributed.
  const buyerSaid = (ctx?.buyerSaid ?? []).slice().sort((x, y) => Number(!!personName && !!y.who && nameKeyOf(y.who) === nameKeyOf(personName)) - Number(!!personName && !!x.who && nameKeyOf(x.who) === nameKeyOf(personName))).slice(0, 3).map((b) => ({ text: cleanLine(lengthenQuote(b.text, story.betweenUs)), who: properCase(b.who) ?? b.who, at: b.at }));

  return {
    account: item.accountName,
    accountUrl: `${a.baseUrl.replace(/\/$/, '')}${accountHref(item.accountName)}`,
    person: first,
    situation: situationOf(item, ctx, a.hold),
    // The stop: the suppression row when the person's address is known; else the item's own state (the Work card said
    // opted out) with the message on record, so an opt-out without an address on the contact still leads the packet.
    stop: relationship.optOut
      ? { name: first?.name ?? personName ?? relationship.person.email ?? 'This person', at: relationship.optOut.at, words: relationship.optOut.words, source: relationship.optOut.source }
      : item.stateKind === 'opted_out'
        ? (() => { const said = (ctx?.buyerSaid ?? []).find((b) => /asked not to be contacted/i.test(b.text)); return { name: personName ?? first?.name ?? 'This person', at: said?.at ?? null, words: said?.text.replace(/^Asked not to be contacted:\s*/i, '').replace(/^"|"$/g, '') ?? null, source: "the item's state (opted out) and their message on record" }; })()
        : null,
    changed: changedUnique,
    who,
    relationship,
    betweenUs: story.betweenUs,
    evidence,
    evidenceMore: Math.max(0, allEvidence.length - evidence.length),
    whyTheyCare: ctx?.opening?.whyTheyCare ? cleanLine(ctx.opening.whyTheyCare) : null,
    buyerSaid,
    move,
    moves,
    prepared,
    preparedSender: a.senderEmail ?? null,
    preparedSources: packEv.sources,
    note: a.note ?? null,
    assets: assetsOf([...sellerNote, move, item.title], item.accountName, deps.assetLink ?? knownAssetLink(a.baseUrl)),
    hold: a.hold,
    angleSuperseded,
    coverageLine: coverage ? (/^(Not read this time|Partly read|Read)\b/i.test(coverage) ? coverage : `Not read this time: ${coverage}`) : null,
    sellerNote,
    dealContext: dealContextOf(item, relationship, sellerNote),
    item: { kind: item.kind, stateKind: item.stateKind, title: item.title, personName: item.person?.name ?? null, personTitle: item.person?.title ?? null },
    asOf: now.toISOString(),
  };
}

function dedupeFacts(facts: PacketFact[]): PacketFact[] {
  const seen = new Set<string>();
  const out: PacketFact[] = [];
  for (const f of facts) {
    const k = textKey(f.text);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}

function emptyRelationship(q: { accountName: string; email: string | null; name: string | null; now: Date }, why: string): RelationshipState {
  return {
    person: { email: q.email, name: q.name },
    purpose: null,
    purposeWord: 'unknown (the relationship could not be read)',
    lastInbound: null,
    lastOutbound: null,
    laterResponse: null,
    answerOwed: { owed: false, basis: 'not read', known: false },
    quiet: { quiet: false, days: null, basis: 'not read' },
    request: null,
    requestState: 'none',
    referral: null,
    outboundRead: { read: false, basis: `the relationship could not be read: ${why}` },
    correspondents: [],
    hubspotCompanyId: null,
    reads: { inbox: { read: false, count: 0, detail: why }, sent: { read: false, count: 0, detail: why }, drafts: { read: false, count: 0, detail: why }, engagements: { read: false, count: 0, detail: why }, commitments: { read: false, count: 0 }, deals: { read: false, detail: why }, conversations: { read: false, count: 0 } },
    meetings: [],
    nextMeetingAt: null,
    deals: [],
    promises: [],
    drafts: [],
    optOut: null,
    links: { thread: null, threadKind: null, hubspotContact: null, hubspotCompany: null },
    searched: `the relationship could not be read: ${why}; read ${clock(q.now)}`,
  };
}

// ---------------------------------------------------------------------------
// The section model and the two renderers
// ---------------------------------------------------------------------------

export interface PacketSection {
  heading: string | null;
  lines: string[];
}

export interface PacketLinks {
  /** The signed "Open it in GAP" link. */
  open: string;
}

export interface RenderOpts {
  commandsEnabled: boolean;
}

const unavailable = (v: string | null | undefined) => (v && v.trim() ? v.trim() : 'unavailable');

function whoLines(c: ContactPacket): string[] {
  const head = `- ${endSentence(`${c.name}${c.title ? `, ${c.title}` : ''}, ${c.company}`)} Relationship: ${c.purpose ?? 'unknown'}.`;
  const email = c.email ? `${c.email}${c.emailStatus ? ` (${c.emailStatus})` : ''}` : 'unavailable';
  const phones = c.phones.length ? c.phones.map((p) => `${p.value} (${p.kind === 'main' ? 'main line, not a personal number' : p.kind}; ${p.source}${p.updatedAt ? `, updated ${dateWords(p.updatedAt)}` : ''})`).join('; ') : 'unavailable';
  const deals = c.dealUrls.length ? c.dealUrls.map((d) => `${d.name} ${d.url}`).join('; ') : 'none open on record';
  return [
    head,
    `  Email: ${email}. Phones: ${phones}. Time zone: ${unavailable(c.timezone)}. LinkedIn: ${unavailable(c.linkedin)}.`,
    `  HubSpot contact: ${unavailable(c.hubspotContactUrl)}. HubSpot company: ${unavailable(c.hubspotCompanyUrl)}. Deals: ${deals}.`,
    `  Source: ${c.source}${c.updatedAt ? `; updated ${dateWords(c.updatedAt)}` : ''}.`,
  ];
}

/** The request state in capitals, for the relationship line. */
const REQUEST_WORD: Record<string, string> = { fulfilled: 'MET', unfulfilled: 'UNFULFILLED', unknown: 'UNKNOWN', redirected: 'REDIRECTED' };

function relationshipLines(p: AssignmentPacket): string[] {
  const r = p.relationship;
  const named = !!(r.person.name || r.person.email);
  const who = r.person.name ?? r.person.email ?? 'this person';
  const lines: string[] = [];
  if (named) {
    lines.push(r.lastInbound ? `- Last from ${who}: ${dateWords(r.lastInbound.at)}${r.lastInbound.subject ? `, "${cleanLine(r.lastInbound.subject)}"` : ''}${r.lastInbound.excerpt ? `: "${clipWords(r.lastInbound.excerpt, 160)}"` : ''} (${r.lastInbound.purpose ? PURPOSE_LINE[r.lastInbound.purpose] : 'purpose unknown'}).` : `- Nothing from ${who} in what was read.`);
    // What we sent is only evidence when our outbound history was read; otherwise it is not known, said as such.
    const owedWords = r.answerOwed.known ? (r.answerOwed.owed ? `An answer is owed: ${r.answerOwed.basis}.` : null) : `Whether an answer went is not known: ${r.answerOwed.basis}.`;
    if (r.lastOutbound) lines.push(`- Last from us: ${dateWords(r.lastOutbound.at)}${r.lastOutbound.subject ? `, "${cleanLine(r.lastOutbound.subject)}"` : ''} (${r.lastOutbound.source}). ${r.laterResponse ? `They wrote after it on ${dateWords(r.laterResponse.at)}.` : owedWords ?? `Nothing from them since (${r.quiet.basis}).`}`);
    else lines.push(r.outboundRead.read ? `- Nothing from us to ${who} on record (${r.outboundRead.basis})${r.answerOwed.known && r.answerOwed.owed ? `; an answer is owed: ${r.answerOwed.basis}` : ''}.` : `- What we sent ${who} is not known: ${r.outboundRead.basis}.`);
    if (r.request) lines.push(`- Their request of ${dateWords(r.request.at)}${r.request.subject ? ` ("${cleanLine(r.request.subject)}")` : ''}: ${REQUEST_WORD[r.request.state] ?? 'UNKNOWN'}: ${endSentence(r.request.basis)}`);
    if (r.referral && !(r.request?.redirectedTo && r.request.redirectedTo.at === r.referral.at)) lines.push(`- They pointed to ${r.referral.name} on ${dateWords(r.referral.at)}${r.referral.writtenAfter ? `; we wrote ${r.referral.name} ${dateWords(r.referral.writtenAfter.at)} (${r.referral.writtenAfter.source})` : r.outboundRead.read ? `; nothing to ${r.referral.name} on record after that` : `; whether we wrote ${r.referral.name} is not known`}.`);
  }
  lines.push(r.meetings.length ? `- Meetings and calls: ${r.meetings.slice(0, 3).map((m) => `${dateWords(m.at)} ${m.kind}${m.title ? ` "${cleanLine(m.title)}"` : ''} (${m.source})${m.outcome ? `: ${clipWords(cleanLine(m.outcome), 160)}` : ''}`).join('; ')}.` : '- Meetings and calls: none on record in what was read.');
  if (r.nextMeetingAt) lines.push(`- A meeting is ahead on ${dateWords(r.nextMeetingAt)}.`);
  // The deal context (a deal item) carries the deal and the promise in full; they are not repeated here.
  if (!p.dealContext.length) {
    lines.push(r.deals.length ? `- Open deal: ${r.deals.map((d) => `${d.name}${d.stage ? ` (${d.stage})` : ''}${d.nextStep ? `, next step: ${clipWords(cleanLine(d.nextStep), 120)}` : ''}${d.url ? ` ${d.url}` : ''}`).join('; ')}.` : '- Open deal: none read.');
    lines.push(r.promises.length ? `- Promises: ${r.promises.slice(0, 3).map((c) => `"${cleanLine(c.title)}" (${c.theirs ? `with ${who}, ` : ''}${c.owner}${c.dueAt ? `, due ${dateWords(c.dueAt)}` : ''}, ${c.status})`).join('; ')}.` : '- Promises: none on the ledger.');
  }
  if (named) {
    if (r.drafts.length) lines.push(`- Drafts: ${r.drafts.map((d) => `${dateWords(d.at)}${d.subject ? ` "${cleanLine(d.subject)}"` : ''}`).join('; ')} (unsent; a draft is never a contact).`);
    lines.push(r.optOut ? `- Opt-out: ${who} asked not to be contacted${r.optOut.at ? ` on ${dateWords(r.optOut.at)}` : ''}${r.optOut.words ? ` ("${cleanLine(r.optOut.words)}")` : ''}; ${r.optOut.source}.` : '- Opt-out: none on record.');
    const links = [r.links.thread ? `${r.links.threadKind === 'thread' ? 'their Gmail thread' : 'a Gmail search for their address (no thread id on record)'} ${r.links.thread}` : null, r.links.hubspotContact ? `HubSpot contact ${r.links.hubspotContact}` : null, r.links.hubspotCompany ? `HubSpot company ${r.links.hubspotCompany}` : null].filter(Boolean);
    if (links.length) lines.push(`- Links: ${links.join('; ')}.`);
  }
  for (const b of dedupeSentences(p.betweenUs)) lines.push(`- ${b}`);
  for (const d of p.dealContext) lines.push(`- ${d}`);
  return lines;
}

const PURPOSE_LINE: Record<string, string> = {
  buyer_conversation: 'buyer conversation',
  customer_support: 'a customer asking for support',
  partner_referral: 'a partner or referral',
  vendor_solicitation: 'a vendor pitching us',
  media: 'media',
  internal: 'internal',
  calendar: 'calendar',
  automated: 'automated',
  suspicious: 'suspicious',
  unknown: 'purpose unknown',
};

const KIND_LABEL: Record<MoveKind, string> = { outbound: '', internal: ' (internal work)', administrative: ' (administrative)', vendor: ' (vendor, not a buyer)', none: '' };

export function packetSections(p: AssignmentPacket, links: PacketLinks, opts: RenderOpts): PacketSection[] {
  const sections: PacketSection[] = [];
  const first: string[] = [];
  if (p.stop) first.push(`STOP: ${p.stop.name} asked not to be contacted${p.stop.at ? ` on ${dateWords(p.stop.at)}` : ''}${p.stop.words ? ` ("${cleanLine(p.stop.words)}")` : ''}. No outbound to them from this item; ${p.stop.source}.`);
  const who = p.item.personName ? (p.item.personTitle ? `${p.item.personName} (${p.item.personTitle})` : p.item.personName) : null;
  first.push(`${p.account}${who ? `: ${who}` : ''}. Why now: ${p.situation} As of ${clock(new Date(p.asOf))}.`);
  sections.push({ heading: null, lines: first });

  sections.push({
    heading: 'What changed or remains unresolved:',
    lines: p.changed.length
      ? p.changed.flatMap((f) => {
          const when = [f.eventDate ? `event ${f.eventDate}` : null, f.reportedOn ? `${f.claim === 'interpretation' ? 'written' : 'reported'} ${f.reportedOn}` : null, f.capturedOn ? `imported ${f.capturedOn}` : null].filter(Boolean).join('; ');
          const src = `${f.source.label}${f.source.url ? ` ${f.source.url}` : ''}`;
          const prefix = f.claim === 'interpretation' ? 'Our read (interpretation, not a reported fact or a buyer statement): ' : '';
          const out = [`- ${prefix}${f.text} (${[when, src].filter(Boolean).join('; ')})`];
          if (f.interpretation) out.push(`  ${f.claim === 'interpretation' ? 'Its one-line read' : "The producer's read"} (not an obligation): ${endSentence(f.interpretation)}`);
          return out;
        })
      : ['- Nothing new on record since the last plan; the relationship and the evidence below are what GAP holds.'],
  });

  sections.push({ heading: 'Who:', lines: p.who.length ? p.who.flatMap(whoLines) : ['- No person is named on this item and none is named in the correspondence on record; the account page lists the people.'] });
  sections.push({ heading: p.relationship.person.name ? `Relationship with ${p.relationship.person.name} (${p.relationship.purposeWord}):` : 'Relationship (the account):', lines: relationshipLines(p) });

  const ev: string[] = p.evidence.map((e) => `- ${e.text} (${e.source.label}${e.eventDate && !e.source.label.includes(e.eventDate) ? `, ${e.eventDate}` : ''})${e.source.url ? ` ${e.source.url}` : ''}${e.weak && !/headline link/.test(e.text) ? " (only the producer's claim is available)" : ''}${e.unverified ? ' (unverified: its present-day status is not established)' : ''}`);
  if (!ev.length) ev.push('- No excerpt on record beyond the relationship above.');
  if (p.evidenceMore > 0) ev.push(`- ${p.evidenceMore} more independent source${p.evidenceMore === 1 ? '' : 's'} on record (syndications of one text not counted); open the account for them.`);
  if (p.whyTheyCare) ev.push(`Why they care (our read): ${endSentence(p.whyTheyCare)}`);
  for (const b of p.buyerSaid) ev.push(`${b.who ? `${cleanLine(b.who)} said` : 'They said'}: "${b.text}"${b.at ? ` (${dateWords(b.at)})` : ''}`);
  if (p.sellerNote.length) {
    ev.push('Your vault note (for you, never quote it to the buyer):');
    for (const l of p.sellerNote.slice(0, 3)) ev.push(`- ${endSentence(l)}`);
  }
  sections.push({ heading: 'Evidence:', lines: ev });

  const mv: string[] = [`The move: ${endSentence(p.move)}`];
  for (const m of p.moves) mv.push(`- ${m.label}${KIND_LABEL[m.kind]}: ${endSentence(m.reason)}`);
  sections.push({ heading: 'Possible next move:', lines: mv });

  const pm: string[] = [];
  if (p.hold) {
    pm.push(p.hold.detail);
    pm.push('Nothing is prepared yet; preparation remains: the account\'s chosen person and the draft must agree.');
  } else if (p.prepared.kind === 'email') {
    if (p.note) pm.push(`Internal note: ${p.note}`);
    pm.push(`Ready to send, to ${p.prepared.to ?? 'no address on the pack (not ready)'}, from ${p.preparedSender ?? 'the GAP mailbox (not configured yet)'}, subject "${p.prepared.subject}":`);
    for (const l of p.prepared.body.split('\n')) pm.push(`> ${l}`);
    if (p.preparedSources.length) pm.push(`Sources: ${p.preparedSources.join('; ')}`);
  } else if (p.prepared.kind === 'angle') {
    if (!p.prepared.who) {
      pm.push(`GAP has prepared an angle for ${p.account}${p.prepared.preparedAt ? ` (prepared ${dateWords(p.prepared.preparedAt)})` : ''} that names nobody: ${endSentence(p.prepared.whyItMatters)}`);
      if (p.prepared.opener) pm.push(`Opener: ${p.prepared.opener}`);
      pm.push('Nothing is prepared to send; preparation remains: the person on the account, then the email or the call written from this opener, by you.');
    } else if (p.angleSuperseded) {
      pm.push(`The angle GAP prepared for ${p.prepared.who}${p.prepared.preparedAt ? ` on ${dateWords(p.prepared.preparedAt)}` : ''} is superseded by later correspondence (${p.angleSuperseded.since}). Kept for reference, not as a first touch: ${endSentence(p.prepared.whyItMatters)}`);
      if (p.prepared.opener) pm.push(`Its opener was: ${p.prepared.opener}`);
      pm.push('Nothing is prepared to send; the next message follows the correspondence above, in your words.');
    } else {
      pm.push(`GAP has prepared an angle for ${p.prepared.who}${p.prepared.preparedAt ? ` (prepared ${dateWords(p.prepared.preparedAt)})` : ''}: ${endSentence(p.prepared.whyItMatters)}`);
      if (p.prepared.opener) pm.push(`Opener: ${p.prepared.opener}`);
      pm.push('Nothing is prepared to send yet; preparation remains: the email or the call written from this opener, by you.');
    }
  } else {
    pm.push(`Nothing is prepared yet; preparation remains: ${p.item.kind === 'admin' || p.item.stateKind === 'replied' || p.item.stateKind === 'opted_out' ? 'an administrative item has nothing to prepare' : p.item.kind === 'deal' ? "the deal's next step is yours to take; GAP has no copy for it" : 'no grounded angle or copy is ready for this item'}.`);
  }
  if (p.assets.length) pm.push(`Assets named: ${p.assets.map((x) => `${x.name} (${x.url ? `${x.url}, the app's own PDF; not a tracked link` : 'no link on record'})`).join('; ')}.`);
  if (p.hold || p.prepared.kind !== 'none' || p.assets.length) sections.push({ heading: p.hold || p.prepared.kind === 'none' ? null : 'Prepared material:', lines: pm });
  else sections.push({ heading: null, lines: pm });

  const ctl: string[] = [`Open it in GAP: ${links.open}`, `The account: ${p.accountUrl}`];
  if (opts.commandsEnabled) {
    ctl.push('To act from here, put one of these on the first line of your reply: APPROVE, REVISE: your words, SKIP, DEFER, DONE: what happened, NEXT, ITEM n, HELP.');
    ctl.push('- ITEM n: sends item n of today\'s plan as its own email (ITEM alone lists the items with their standing); nothing goes to a buyer.');
    ctl.push('- APPROVE: approves the prepared email for the send step in the app (CONFIRM + SEND there); nothing is sent from your reply.');
    ctl.push('- REVISE: your words: GAP rewrites the copy on your words and sends a new revision here; nothing goes out.');
    ctl.push('- SKIP: drops the item for today. DEFER: holds it; it returns on the next plan.');
    ctl.push('- DONE: what happened: records what you did; a note of progress keeps the item open.');
    ctl.push('- NEXT: the next item. HELP: these commands.');
    ctl.push('Opening a link never approves or sends anything.');
  }
  sections.push({ heading: 'Controls:', lines: ctl });
  // The bookkeeping last: what was read for this packet, and what was not.
  const read: string[] = [`- Searched: ${p.relationship.searched}.`];
  if (p.coverageLine) read.push(`- ${p.coverageLine}`);
  sections.push({ heading: 'Read for this packet:', lines: read });
  sections.push({ heading: null, lines: ['This is an internal message from GAP to you; nothing in it went to a buyer.'] });
  return sections;
}

/** The text email: every prose line scrubbed and never starting with a command word. */
export function renderPacketText(p: AssignmentPacket, links: PacketLinks, opts: RenderOpts): string {
  const out: string[] = [];
  for (const s of packetSections(p, links, opts)) {
    if (out.length) out.push('');
    if (s.heading) out.push(safeLine(s.heading));
    for (const l of s.lines) out.push(l.startsWith('> ') ? l : `${l.startsWith('  ') ? '  ' : ''}${safeLine(cleanLine(l) || l)}`);
  }
  return out.join('\n');
}

/** URLs become anchors; a sentence's trailing punctuation stays outside the link. */
const linkify = (s: string) => esc(s).replace(/https?:\/\/[^\s<>"']+/g, (raw) => { const m = raw.match(/^(.*?)([.,;:)]*)$/) as RegExpMatchArray; return `<a href="${m[1]}">${m[1]}</a>${m[2]}`; });

/** The HTML email: the same sections; bullets as lists, quoted copy as a blockquote, links clickable. */
export function renderPacketHtml(p: AssignmentPacket, links: PacketLinks, opts: RenderOpts): string {
  const parts: string[] = [];
  for (const s of packetSections(p, links, opts)) {
    if (s.heading) parts.push(`<h3 style="margin:16px 0 4px;font-size:15px">${esc(safeLine(s.heading))}</h3>`);
    let list: string[] = [];
    let quote: string[] = [];
    const flush = () => {
      if (list.length) parts.push(`<ul style="margin:4px 0 8px 18px;padding:0">${list.map((x) => `<li>${x}</li>`).join('')}</ul>`);
      if (quote.length) parts.push(`<blockquote style="margin:6px 0 8px;padding-left:10px;border-left:3px solid #999;white-space:pre-wrap">${quote.join('\n')}</blockquote>`);
      list = [];
      quote = [];
    };
    for (const raw of s.lines) {
      if (raw.startsWith('> ')) { if (list.length) flush(); quote.push(esc(raw.slice(2))); continue; }
      if (quote.length) flush();
      const indented = raw.startsWith('  ');
      const line = safeLine(cleanLine(raw) || raw);
      if (line.startsWith('- ')) { list.push(linkify(line.slice(2))); continue; }
      if (indented) { if (list.length) list[list.length - 1] += `<br>${linkify(line)}`; else parts.push(`<p style="margin:2px 0 2px 18px">${linkify(line)}</p>`); continue; }
      flush();
      parts.push(`<p style="margin:4px 0">${linkify(line)}</p>`);
    }
    flush();
  }
  return `<div style="font-family:system-ui,sans-serif;line-height:1.45">${parts.join('')}</div>`;
}
