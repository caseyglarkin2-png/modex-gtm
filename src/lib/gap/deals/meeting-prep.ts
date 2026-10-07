/**
 * MEETING PREPARATION FROM THE CURRENT CONVERSATION (GAP OS execution recovery, R51, 2026-10-06). Pure, client-safe.
 *
 * From the meetings on record (the Meeting table, which the account context and Work already read; no new calendar
 * connector) and what GAP already holds for the deal, ONE preparation per meeting:
 *
 *   objective        the meeting row's own objective (Recorded), else a suggestion aimed at the first thing still
 *                    unknown (Suggested, labeled as such)
 *   attendees        who is named on the row, with their role, and the deal's own contacts (HubSpot)
 *   last commitment  the newest obligation on this deal (or account-level when the meeting has no deal) (Recorded)
 *   confirmed needs  ONLY human-confirmed buyer words scoped to this deal, plus the account-level ones, each labeled
 *                    (Buyer confirmed)
 *   open questions   the discovery questions for every truth section still unknown, the seller's own objective first
 *                    (To learn)
 *   to test          the account's working thesis, as a guess to test in the room (Our guess), never a finding
 *   public context   at most two verified public facts, AFTER the buyer's words and never in their place (Public source)
 *   materials        the demo pack, microsite or content that already exists for the account (Ours)
 *
 * Every line carries its trust word, so no speculative pain ever reads as a confirmed discovery finding, and public
 * news never stands in for what the buyer said. A canceled meeting prepares nothing; a moved meeting is read at its
 * new time (the row is the truth, read on every load).
 */
import { nyDay, nyDayAt } from '../work/dates';

export type TrustWord = 'Buyer confirmed' | 'Recorded' | 'HubSpot' | 'Public source' | 'Our guess' | 'To learn' | 'Ours' | 'Suggested';

export interface PrepLine {
  text: string;
  trust: TrustWord;
  /** Who said it, which record, which page. */
  source?: string | null;
  href?: string | null;
}

export interface MeetingRowInput {
  id: number;
  /** The meeting's instant (meetingInstant), or null when the row carries no date. */
  at: string | null;
  status: string;
  objective: string | null;
  /** Who the row names (free text: "Ann Scratch, Ben Scratch"). */
  attendees: string | null;
  /** The HubSpot deal the meeting belongs to, when the row says so. */
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MeetingState = 'upcoming' | 'canceled' | 'past' | 'undated';

export interface MeetingPrep {
  meetingId: number;
  at: string | null;
  state: MeetingState;
  /** "Meeting Wed, Oct 7, 10:00 AM: Pilot scope" or "Canceled: Pilot scope (was Oct 7)". */
  headline: string;
  dealId: string | null;
  dealName: string | null;
  objective: PrepLine;
  attendees: PrepLine[];
  lastCommitment: PrepLine | null;
  confirmedNeeds: PrepLine[];
  openQuestions: PrepLine[];
  toTest: PrepLine[];
  publicContext: PrepLine[];
  materials: PrepLine[];
  /** One line for Work's card: the prepared starting point. */
  startingPoint: string;
}

/** "10:00 AM", "10am", "14:30" -> [hour, minute]; null when the text names no time. */
export function parseTimeOfDay(text: string | null | undefined): [number, number] | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*/i.exec(text ?? '');
  if (!m) return null;
  let h = Number(m[1]);
  const mi = Number(m[2] ?? 0);
  const ap = (m[3] ?? '').toLowerCase().replace(/\./g, '');
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || mi > 59 || (!m[2] && !ap)) return null;
  return [h, mi];
}

/**
 * The meeting's instant from its row: a date-only row is stored at UTC midnight and means that calendar day (at the
 * row's time of day in New York, else 9 am New York); a row with a real instant keeps it.
 */
export function meetingInstant(meetingDate: Date | string | null | undefined, meetingTime: string | null | undefined): Date | null {
  if (!meetingDate) return null;
  const d = new Date(meetingDate);
  if (Number.isNaN(d.getTime())) return null;
  const t = parseTimeOfDay(meetingTime);
  const dateOnly = d.getUTCHours() === 0 && d.getUTCMinutes() === 0;
  const calendarDay = dateOnly ? d.toISOString().slice(0, 10) : nyDay(d);
  return t ? nyDayAt(calendarDay, t[0], t[1]) : dateOnly ? nyDayAt(calendarDay, 9) : d;
}

export const isCanceled = (status: string) => /cancel/i.test(status);

export function meetingState(m: Pick<MeetingRowInput, 'at' | 'status'>, now: Date): MeetingState {
  if (isCanceled(m.status)) return 'canceled';
  if (!m.at) return 'undated';
  // A meeting that started within the last hour is still the one to prepare for (it may be running late).
  return new Date(m.at).getTime() >= now.getTime() - 3_600_000 ? 'upcoming' : 'past';
}

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

export interface PrepInput {
  meeting: MeetingRowInput;
  now: Date;
  deal: { id: string; name: string | null; contacts: ReadonlyArray<{ name: string; title: string | null }> } | null;
  /** The people GAP holds at the account (names the row mentions are matched to their titles). */
  people: ReadonlyArray<{ name: string; title: string | null }>;
  /** This deal's obligations (and the account-level ones), any status, with a seller line each. */
  commitments: ReadonlyArray<{ title: string; kind: string; status: string; line: string; createdAt: string; updatedAt: string; person: { name: string | null } | null; scopeLabel: string }>;
  /** Confirmed buyer words for this deal and the account-level ones (bid/select.ts already applied). */
  needs: ReadonlyArray<{ type: string; quote: string; who: string; at: string; scopeLabel: string }>;
  /** The discovery questions for the truth sections still unknown, in conversation order. */
  unknownQuestions: readonly string[];
  /** The seller's own learning objective, when set. */
  learningObjective: string | null;
  /** The working thesis's problem statements (guesses to test). */
  guesses: readonly string[];
  /** Verified public facts at the account. */
  publicFacts: ReadonlyArray<{ quote: string; title: string; url: string | null; publishedAt: string }>;
  /** What already exists for the account (demo pack, microsite, content). */
  materials: ReadonlyArray<{ label: string; href: string | null }>;
}

const NEED_WORD: Record<string, string> = { current_state: 'How it runs today', business_problem: 'Problem', root_cause: 'Why it happens', impact: 'Impact', metric: 'A number they gave', priority: 'Priority', future_state: 'What good looks like', constraint: 'Requirement', objection: 'Objection' };

export function prepareMeeting(i: PrepInput): MeetingPrep {
  const m = i.meeting;
  const state = meetingState(m, i.now);
  const what = clean(m.objective) || 'meeting';
  const headline = state === 'canceled'
    ? `Canceled: ${what}${m.at ? ` (was ${dayOf(m.at)})` : ''}. Nothing to prepare unless it is rebooked.`
    : m.at ? `Meeting ${when(m.at)}: ${what}` : `Meeting (no date on record): ${what}`;
  // The open questions: the seller's own objective first, then every section still unknown (never invented).
  const openQuestions: PrepLine[] = [
    ...(i.learningObjective ? [{ text: i.learningObjective, trust: 'To learn' as const, source: 'your learning objective' }] : []),
    ...i.unknownQuestions.filter((q) => q !== i.learningObjective).map((q) => ({ text: q, trust: 'To learn' as const })),
  ];
  const objective: PrepLine = clean(m.objective)
    ? { text: clean(m.objective), trust: 'Recorded', source: 'the meeting on record' }
    : { text: openQuestions[0]?.text ?? 'Learn who else must agree before anything changes.', trust: 'Suggested', source: 'what is still unknown' };
  // Attendees: the names on the row with their role when GAP holds them; then the deal's own contacts.
  const named = clean(m.attendees).split(/\s*(?:,|;|\band\b|&)\s*/i).map((s) => s.trim()).filter(Boolean);
  const byName = new Map(i.people.map((p) => [p.name.toLowerCase(), p]));
  const attendees: PrepLine[] = named.map((n) => {
    const p = byName.get(n.toLowerCase()) ?? i.people.find((x) => x.name.toLowerCase().startsWith(`${n.toLowerCase()} `)) ?? null;
    return { text: p ? `${p.name}${p.title ? `, ${p.title}` : ''}` : `${n} (no role on record)`, trust: 'Recorded', source: 'named on the meeting' };
  });
  for (const c of i.deal?.contacts ?? []) {
    if (named.some((n) => c.name.toLowerCase().startsWith(n.toLowerCase()))) continue;
    attendees.push({ text: `${c.name}${c.title ? `, ${c.title}` : ''} (a contact on the deal; not named on the meeting)`, trust: 'HubSpot', source: i.deal?.name ?? 'the deal' });
  }
  const newest = [...i.commitments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
  const lastCommitment: PrepLine | null = newest ? { text: `${newest.title} (${newest.line.replace(/\.$/, '')})`, trust: 'Recorded', source: newest.scopeLabel } : null;
  const confirmedNeeds: PrepLine[] = i.needs.map((n) => ({ text: `${NEED_WORD[n.type] ?? n.type}: "${n.quote}"`, trust: 'Buyer confirmed', source: `${n.who}, ${dayOf(n.at)}${n.scopeLabel === 'account-level' ? ', account-level' : ''}` }));
  const toTest: PrepLine[] = i.guesses.slice(0, 2).map((g) => ({ text: g, trust: 'Our guess', source: 'the working thesis: ask, never assert' }));
  const publicContext: PrepLine[] = i.publicFacts.slice(0, 2).map((f) => ({ text: `"${f.quote}"`, trust: 'Public source', source: `${f.title}, ${dayOf(f.publishedAt)}; public, not the buyer's words`, href: f.url }));
  const materials: PrepLine[] = i.materials.filter((x) => x.href).slice(0, 3).map((x) => ({ text: x.label, trust: 'Ours', href: x.href }));
  const startingPoint = state === 'canceled'
    ? headline
    : [`Objective: ${objective.text.replace(/\.$/, '')}.`, openQuestions[0] && openQuestions[0].text !== objective.text ? `First to learn: ${openQuestions[0].text.replace(/\.$/, '')}.` : null, lastCommitment ? `Last commitment: ${newest!.title}.` : null, confirmedNeeds.length ? `${confirmedNeeds.length} confirmed need${confirmedNeeds.length === 1 ? '' : 's'} on record.` : 'Nothing confirmed from the buyer yet.'].filter(Boolean).join(' ');
  return {
    meetingId: m.id,
    at: m.at,
    state,
    headline,
    dealId: i.deal?.id ?? null,
    dealName: i.deal?.name ?? null,
    objective,
    attendees,
    lastCommitment,
    confirmedNeeds,
    openQuestions,
    toTest,
    publicContext,
    materials,
    startingPoint,
  };
}

/**
 * Which deal a meeting belongs to: the row's own deal id when it is an open deal here; else the deal whose contacts
 * include exactly the people named on it (one deal only); else none (an account-level meeting).
 */
export function meetingDeal<D extends { id: string; contacts: ReadonlyArray<{ name: string }> }>(m: Pick<MeetingRowInput, 'dealId' | 'attendees'>, deals: readonly D[]): D | null {
  if (m.dealId) return deals.find((d) => d.id === m.dealId) ?? null;
  const named = clean(m.attendees).toLowerCase();
  if (!named) return null;
  const hits = deals.filter((d) => d.contacts.some((c) => named.includes(c.name.toLowerCase()) || named.includes(c.name.split(' ')[0].toLowerCase())));
  return hits.length === 1 ? hits[0] : null;
}
