/**
 * ONE FRESHNESS AUTHORITY (acceptance batch item 2a, 2026-10-07). Pure.
 *
 * The recording's dead end: the PepsiCo Tulsa fact (dated 2026-07-23) was offered as draftable, approved and routed
 * READY, and then the preview refused "C01: cites stale evidence", because the compiler aged evidence by a flat 45
 * days from its date while the approval gate, routing and the draftable list read only an explicit expiry (which a
 * verified research fact usually does not carry). Two clocks, one fact. This module is the ONE clock; every reader
 * that asks "may this fact open a first touch today?" calls it: the evidence gate (approval, activation, routing, the
 * send gate), the compiler's evidence refs, the account read (the draftable list, the story's live facts), the enroll
 * service, the inbox, thesis grouping and proposal.
 *
 * The rule is the evidence-validity clock research/continuity.ts already defines (`outreachCurrentUntil`): the
 * signal type's window (signals/freshness.ts) from the newest evidence that the change is current. In order:
 *
 *   ENDED              a newer source says the program ended (metadata.continuity.kind): never current.
 *   CLOSED             a notice whose stated due date passed (metadata.claimAttributes.dueDate, batch item 7): a
 *                      closed RFP is not an opening; an open one is current at most until its due date.
 *   EXPLICIT           a recorded expiry (freshness_expires_at: a corroboration, an evidence record's fresh_until)
 *                      wins: current until then.
 *   PENDING CHANGE     an announced future change ("will close ... by March 2027") with a stated effective date: the
 *                      window runs from that date, so a closure announced in July that takes effect later stays
 *                      current until after it happens.
 *   EVENT / STATE      otherwise the type's window from the fact's own date: a one-day event is stale after it.
 *
 * Undated is never current. Nothing here reads the clock: `now` is passed in.
 */
import { SIGNAL_TTL_DAYS } from '../signals/freshness';

const DAY_MS = 86_400_000;
/** The window for a type GAP does not know (the registry's `other`). */
const DEFAULT_WINDOW_DAYS = SIGNAL_TTL_DAYS.other;

export interface CurrentnessFact {
  observed_at?: Date | string | null;
  freshness_expires_at?: Date | string | null;
  /** The signal type (prospecting_signals.type): its window. */
  type?: string | null;
  evidence_text?: string | null;
  metadata?: unknown;
}

export type CurrentnessBasis = 'ended' | 'closed' | 'explicit' | 'effective_date' | 'type_window' | 'undated';

export interface Currentness {
  current: boolean;
  /** The instant it stops (or stopped) being current; null when undated or ended. */
  until: string | null;
  basis: CurrentnessBasis;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const toDate = (v: Date | string | null | undefined): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const FUTURE = /\b(?:will|plans? to|planning to|expects? to|expected to|is set to|are set to|scheduled to|intends? to|is to|are to|to be (?:completed|finished|closed|opened|built))\b/i;
const endOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
const DATED = /\b(?:by|on|in|effective|starting|beginning|from|through|until|before|around)\s+(?:the\s+)?(?:(end|close|middle|start|beginning|first half|second half)\s+of\s+(?:the\s+)?)?(?:(early|mid|late)[-\s]+)?(?:(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+)?(?:(\d{1,2})(?:st|nd|rd|th)?,?\s+)?(20\d{2})\b/gi;
const QUARTER = /\b(?:(?:the\s+)?(first|second|third|fourth|1st|2nd|3rd|4th)\s+quarter\s+(?:of\s+)?(?:fiscal\s+)?|q([1-4])\s+(?:fiscal\s+)?)(20\d{2})\b/gi;
const RELATIVE = /\b(later this year|by (?:the )?end of (?:the|this) year|by year[- ]end|this (?:fall|autumn|winter)|next year|by (?:the )?end of next year)\b/gi;

/**
 * The effective date an ANNOUNCED FUTURE change names (the latest date it states), or null: no future cue, no date,
 * or a date not after the announcement. Deterministic, no model.
 */
export function pendingEffectiveDate(text: string, announcedAt: Date): Date | null {
  if (!FUTURE.test(text)) return null;
  const found: Date[] = [];
  for (const m of text.matchAll(DATED)) {
    const [, part, season, mon, dayN, yearS] = m;
    const y = Number(yearS);
    let d: Date;
    if (mon) {
      const mi = MONTHS.indexOf(mon.slice(0, 3).toLowerCase());
      d = dayN ? new Date(Date.UTC(y, mi, Number(dayN), 23, 59, 59)) : endOfMonth(y, mi);
    } else if (season) {
      d = endOfMonth(y, season.toLowerCase() === 'early' ? 3 : season.toLowerCase() === 'mid' ? 7 : 11);
    } else if (part && /first half/i.test(part)) d = endOfMonth(y, 5);
    else d = endOfMonth(y, 11);
    found.push(d);
  }
  for (const m of text.matchAll(QUARTER)) {
    const q = m[2] ? Number(m[2]) : ['first', '1st'].includes(m[1].toLowerCase()) ? 1 : ['second', '2nd'].includes(m[1].toLowerCase()) ? 2 : ['third', '3rd'].includes(m[1].toLowerCase()) ? 3 : 4;
    found.push(endOfMonth(Number(m[3]), q * 3 - 1));
  }
  for (const m of text.matchAll(RELATIVE)) {
    const y = announcedAt.getUTCFullYear() + (/next year/i.test(m[1]) ? 1 : 0);
    found.push(endOfMonth(y, 11));
  }
  const after = found.filter((d) => d.getTime() > announcedAt.getTime());
  return after.length ? new Date(Math.max(...after.map((d) => d.getTime()))) : null;
}

/** May this fact open a first touch at `now`, and until when. The one rule (see the header). */
export function factCurrentness(f: CurrentnessFact, now: Date): Currentness {
  const continuity = isObj(f.metadata) && isObj(f.metadata.continuity) ? f.metadata.continuity : null;
  if (continuity && continuity.kind === 'ended') return { current: false, until: null, basis: 'ended' };
  // Batch item 7: a notice's stated due date bounds it (through the end of that day in New York).
  const attrs = isObj(f.metadata) && isObj(f.metadata.claimAttributes) ? f.metadata.claimAttributes : null;
  const dueRaw = attrs && typeof attrs.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(attrs.dueDate) ? attrs.dueDate : null;
  const dueEnd = dueRaw ? endOfNewYorkDay(dueRaw) : null;
  if (dueEnd && dueEnd.getTime() <= now.getTime()) return { current: false, until: dueEnd.toISOString(), basis: 'closed' };
  const bounded = (c: Currentness): Currentness => (dueEnd && c.until && dueEnd.getTime() < new Date(c.until).getTime() ? { ...c, until: dueEnd.toISOString() } : c);
  const explicit = toDate(f.freshness_expires_at);
  if (explicit) return bounded({ current: explicit.getTime() > now.getTime(), until: explicit.toISOString(), basis: 'explicit' });
  const observed = toDate(f.observed_at);
  if (!observed) return { current: false, until: null, basis: 'undated' };
  const windowDays = (f.type && (SIGNAL_TTL_DAYS as Record<string, number>)[f.type]) || DEFAULT_WINDOW_DAYS;
  const effective = f.evidence_text ? pendingEffectiveDate(f.evidence_text, observed) : null;
  const start = effective ?? observed;
  const until = new Date(start.getTime() + windowDays * DAY_MS);
  return bounded({ current: until.getTime() > now.getTime(), until: until.toISOString(), basis: effective ? 'effective_date' : 'type_window' });
}

/** The boolean every gate reads. */
export function isCurrentFact(f: CurrentnessFact, now: Date): boolean {
  return factCurrentness(f, now).current;
}

/** The last second of a calendar day in New York: 23:59:59 EST, or 23:59:59 EDT when daylight time is on. */
function endOfNewYorkDay(day: string): Date {
  const nyDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const est = new Date(`${day}T23:59:59-05:00`);
  return nyDay(est) === day ? est : new Date(`${day}T23:59:59-04:00`);
}

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

/** The seller words: "current until Nov 20, 2026" or why it may not open a first touch. */
export function currentnessLine(c: Currentness): string {
  if (c.basis === 'ended') return 'A newer source says this ended: not a story for a first touch.';
  if (c.basis === 'undated') return 'Undated: not a story for a first touch.';
  if (c.basis === 'closed') return `This notice closed on ${dayLabel(c.until!)}: not a story for a first touch.`;
  if (c.current) return `Current until ${dayLabel(c.until!)}${c.basis === 'effective_date' ? ' (the change takes effect later)' : ''}.`;
  return `This story is too old for a first touch: it was current until ${dayLabel(c.until!)}.`;
}

/** The fields every currentness reader must select on a prospecting signal. */
export const CURRENTNESS_SELECT = { observed_at: true, freshness_expires_at: true, type: true, evidence_text: true, metadata: true } as const;
