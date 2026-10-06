/**
 * THE SELLER'S CALENDAR (GAP OS execution recovery, R40 / R44 / R45, 2026-10-06): New York days, pure and
 * client-safe. Every due date GAP keeps is a New York calendar day plus an instant, so "by Friday" said at 11:30 pm on
 * a Tuesday is that Friday in New York, never the Saturday a UTC reading would give (the timezone trap the next-day
 * resume test pins). Nothing here reads the clock: every function takes `now`.
 *
 *   nyDay(instant)            the New York calendar day of an instant ('2026-10-09')
 *   nyDayAt(day, hour)        the instant of that wall-clock hour in New York (daylight saving handled)
 *   endOfNyDay(instant)       the first instant of the next New York day (the "due today" boundary)
 *   nextBusinessDay(day, n)   n Monday-to-Friday days after `day`
 *   parseDuePhrase(text, now) "by Friday", "tomorrow", "Oct 9", "10/9", "end of the week": the day it names, with
 *                             `ambiguous` when the words allow two readings ("next Friday")
 *   parseReturnDate(text,now) an out-of-office return date ("I will return on Monday, October 14")
 */

export const SELLER_TZ = 'America/New_York';
/** The hour a date-only obligation becomes due (the start of the seller's working morning). */
export const DUE_HOUR = 9;
const DAY_MS = 86_400_000;

const PARTS = new Intl.DateTimeFormat('en-US', { timeZone: SELLER_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

interface Wall {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

function wallOf(t: number): Wall {
  const p: Record<string, number> = {};
  for (const part of PARTS.formatToParts(new Date(t))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour === 24 ? 0 : p.hour, mi: p.minute, s: p.second };
}

/** Wall clock minus real time, in ms, at instant `t`. */
function offsetAt(t: number): number {
  const w = wallOf(t);
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - Math.floor(t / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function isDay(day: unknown): day is string {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))));
}

export function nyDay(t: Date | string): string {
  const w = wallOf(new Date(t).getTime());
  return dayKey(w.y, w.m, w.d);
}

/** The instant a New York wall-clock time occurs (the later reading on a repeated hour, the shifted one on a skipped hour). */
export function nyWallToInstant(y: number, m: number, d: number, h = 0, mi = 0): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return new Date(t);
}

export function nyDayAt(day: string, hour = DUE_HOUR, minute = 0): Date {
  return nyWallToInstant(Number(day.slice(0, 4)), Number(day.slice(5, 7)), Number(day.slice(8, 10)), hour, minute);
}

/** Calendar arithmetic on a day key (no time zone involved). */
export function addDays(day: string, n: number): string {
  const t = Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))) + n * DAY_MS;
  const x = new Date(t);
  return dayKey(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
}

/** 0 Sunday .. 6 Saturday. */
export function weekdayOf(day: string): number {
  return new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)))).getUTCDay();
}

export function nextBusinessDay(day: string, n = 1): string {
  let d = day;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    const w = weekdayOf(d);
    if (w !== 0 && w !== 6) left -= 1;
  }
  return d;
}

/** The first instant of the New York day after `t` ("due today" means due before this). */
export function endOfNyDay(t: Date): Date {
  return nyDayAt(addDays(nyDay(t), 1), 0);
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** "Oct 9", "today", "tomorrow" relative to the New York day of `now`. */
export function dayLabel(day: string, now: Date): string {
  const today = nyDay(now);
  if (day === today) return 'today';
  if (day === addDays(today, 1)) return 'tomorrow';
  if (day === addDays(today, -1)) return 'yesterday';
  const m = MONTHS[Number(day.slice(5, 7)) - 1];
  return `${m[0].toUpperCase()}${m.slice(1)} ${Number(day.slice(8, 10))}`;
}

export interface ParsedDay {
  day: string;
  /** The words that named it, as written. */
  phrase: string;
  /** The words allow two readings ("next Friday"); the seller confirms the date. */
  ambiguous: boolean;
}

function monthIndex(word: string): number {
  const w = word.toLowerCase().slice(0, 3);
  return MONTHS.indexOf(w);
}

/** A month and day with no year: this year, or next year when it is more than a week behind today. */
function resolveMonthDay(month: number, d: number, today: string): string | null {
  if (month < 0 || month > 11 || d < 1 || d > 31) return null;
  const y = Number(today.slice(0, 4));
  let candidate = dayKey(y, month + 1, d);
  if (!isDay(candidate) || Number(candidate.slice(8, 10)) !== d) return null;
  if (candidate < addDays(today, -7)) candidate = dayKey(y + 1, month + 1, d);
  return candidate;
}

/**
 * The day a phrase names, read in New York from `now`. Returns the first dated phrase in the text, or null. A bare
 * weekday is its next occurrence (today counts: "by Friday" said on a Friday is today); "next <weekday>" is marked
 * ambiguous (this coming one or the week after) and proposes the later reading only when the coming one is today
 * or tomorrow.
 */
export function parseDuePhrase(text: string, now: Date): ParsedDay | null {
  const s = ` ${text.replace(/\s+/g, ' ')} `;
  const today = nyDay(now);
  const hits: Array<{ at: number; r: ParsedDay }> = [];
  const add = (at: number, r: ParsedDay | null) => {
    if (r) hits.push({ at, r });
  };
  let m: RegExpExecArray | null;
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while ((m = iso.exec(s))) add(m.index, isDay(m[0]) ? { day: m[0], phrase: m[0], ambiguous: false } : null);
  const numeric = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
  while ((m = numeric.exec(s))) {
    const month = Number(m[1]) - 1;
    const d = Number(m[2]);
    const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : null;
    const day = year ? dayKey(year, month + 1, d) : resolveMonthDay(month, d, today);
    add(m.index, day && isDay(day) ? { day, phrase: m[0], ambiguous: false } : null);
  }
  const monthName = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/gi;
  while ((m = monthName.exec(s))) {
    const month = monthIndex(m[1]);
    const d = Number(m[2]);
    const day = m[3] ? dayKey(Number(m[3]), month + 1, d) : resolveMonthDay(month, d, today);
    add(m.index, day && isDay(day) ? { day, phrase: m[0].trim(), ambiguous: false } : null);
  }
  const dayMonth = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi;
  while ((m = dayMonth.exec(s))) {
    const day = resolveMonthDay(monthIndex(m[2]), Number(m[1]), today);
    add(m.index, day ? { day, phrase: m[0].trim(), ambiguous: false } : null);
  }
  const rel = /\b(today|tonight|end of (?:the )?day|eod|tomorrow|end of (?:the |this )?week|this week|next week)\b/gi;
  while ((m = rel.exec(s))) {
    const w = m[1].toLowerCase();
    const wd = weekdayOf(today);
    let day = today;
    if (w === 'tomorrow') day = addDays(today, 1);
    else if (/week/.test(w) && w !== 'next week') day = wd <= 5 && wd >= 1 ? addDays(today, 5 - wd) : today;
    else if (w === 'next week') day = addDays(today, ((8 - wd) % 7) || 7);
    add(m.index, { day, phrase: m[1], ambiguous: false });
  }
  const weekday = /\b(next\s+|this\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi;
  while ((m = weekday.exec(s))) {
    const target = WEEKDAYS.indexOf(m[2].toLowerCase());
    const wd = weekdayOf(today);
    const ahead = (target - wd + 7) % 7;
    const coming = addDays(today, ahead);
    if (m[1] && /next/i.test(m[1])) {
      // "next Friday": the coming Friday or the one after. Propose the later reading only when the coming one is
      // today or tomorrow (nobody says "next Friday" for tomorrow); the seller checks either way.
      const day = ahead <= 1 ? addDays(coming, 7) : coming;
      add(m.index, { day, phrase: m[0].trim(), ambiguous: true });
    } else add(m.index, { day: coming, phrase: m[0].trim(), ambiguous: false });
  }
  if (!hits.length) return null;
  hits.sort((a, b) => a.at - b.at);
  return hits[0].r;
}

/** An out-of-office notice's return day: "will return on ...", "back on ...", "out of the office until ...". */
export function parseReturnDate(text: string, now: Date): ParsedDay | null {
  const back = /\b(?:return(?:ing)?|be back|back in the office|back)\b(?:\s+(?:to the office|in the office))?\s*(?:on|by)?\s*([^.;\n]{0,60})/i.exec(text);
  const span = back ? null : /\b(until|through|thru)\s+([^.;\n]{0,60})/i.exec(text);
  const found = back ? parseDuePhrase(back[1], now) : span ? parseDuePhrase(span[2], now) : null;
  if (!found) return null;
  // "out through Friday" names the last day away: back the next business day. "until" and "return on" name the day back.
  const day = span && /through|thru/i.test(span[1]) ? nextBusinessDay(found.day) : found.day;
  return day >= nyDay(now) ? { ...found, day } : null;
}
