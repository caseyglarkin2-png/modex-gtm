/**
 * THE DONE NOTE, READ (seller acceptance follow-up, 2026-10-09). Pure.
 *
 * "DONE: researching catalysts" closed an obligation on October 9 and the activity view then read it as the follow-up
 * done. A seller's note after DONE is read before it is recorded: a note that says what HAPPENED (a call made, a deck
 * sent, an answer given) is a completion; a note that says what the seller is DOING or WILL DO (researching, looking
 * into, will call, still waiting, drafting) is progress, and progress never completes an obligation and never reads as
 * contact or commercial advancement. The reading is by the first clause of the note's own words (a signature block is
 * cut); it is deterministic and it says the cue it matched so the seller can see why.
 *
 * Knowledge program C3 (2026-10-09): a completion note is also read for FACTS, when a clock is given (`readDoneNote(note,
 * { now })`): a dated meeting ("meeting scheduled for 10.14.2026", "meeting Oct 14", "call next Tuesday", read in New
 * York from `now`) and a sent note ("sent them a note today", "emailed Dave", "called Craig"). The facts are what the
 * seller said, never a send or a contact GAP proved; the command layer turns a meeting into a prepare_meeting
 * commitment and records a sent note as a claim (replies/commands-apply.ts). Casey's October 9 note on Kenco is the pin.
 */
import { addDays, nyDay, parseDuePhrase } from './dates';

export type DoneNoteReading = { kind: 'empty' } | { kind: 'progress'; cue: string; note: string; facts?: DoneFact[] } | { kind: 'completion'; note: string; facts?: DoneFact[] };

/**
 * C3: a fact a DONE note states.
 *   meeting  a meeting the seller named with a day on or after today (New York): "meeting scheduled for 10.14.2026",
 *            "call next Tuesday" (ambiguous when the words allow two days, as parseDuePhrase says)
 *   sent     a note, email, message or call the seller says went out, to whom ("them", or the name), on which day
 *            (today unless the clause names one; a weekday in a sent clause is the one just past)
 */
export type DoneFact =
  | { kind: 'meeting'; day: string; phrase: string; ambiguous: boolean; words: string }
  | { kind: 'sent'; who: string | null; when: string; channel: 'email' | 'call' | 'message'; phrase: string; words: string };

/** The seller's own words: the first paragraph, with a signature block (a "--" line, a line of " · " separators, a name-and-title line) cut. */
export function sellerWordsOf(note: string | null | undefined): string {
  const lines = String(note ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim());
  const out: string[] = [];
  for (const l of lines) {
    if (/^(--|—|__)/.test(l)) break;
    if (/ · /.test(l)) {
      // A signature collapsed onto the note's own line ("researching catalysts Casey Larkin · GTM, ..."): keep the
      // words before the first separator, less a trailing two-word name.
      if (out.length) break;
      const before = l.split(' · ')[0].replace(/(^|\s+)[A-Z][a-z]+\s+[A-Z][a-z]+$/, '').trim();
      if (before) out.push(before);
      break;
    }
    if (/^(sent from my|get outlook for)/i.test(l)) break;
    if (!l) {
      if (out.length) break;
      continue;
    }
    out.push(l);
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

const PROGRESS_LEAD = /^(still\b|not yet\b|haven'?t\b|have not\b|hasn'?t\b|need to\b|needs to\b|going to\b|gonna\b|planning to\b|plan to\b|about to\b|will\b|i'?ll\b|i am going\b|i'?m going\b|in progress\b|wip\b|to ?do\b|todo\b|waiting (on|for)\b|working on\b|looking into\b|looking at\b|researching\b|reviewing\b|reading\b|checking\b|digging\b|drafting\b|preparing\b|thinking\b|pending\b|later\b|tomorrow\b|next week\b)/i;
const PROGRESS_PRONOUN = /^(i|we)('?m| am|'?re| are| will|'?ll| plan| need| still| have not| haven'?t)\b/i;
const PROGRESS_AFTER_PRONOUN = /^('?m|am|'?re|are|will|'?ll|plan|need|still|have not|haven'?t)\b/i;

/**
 * Read a DONE note. The FIRST CLAUSE decides (up to the first comma, period or semicolon): "called Joey, he will send
 * the comparison Friday" is a completion (the call happened) although a later clause says "will"; "researching
 * catalysts" and "will call tomorrow" are progress.
 */
export function readDoneNote(note: string | null | undefined, opts: { now?: Date | null } = {}): DoneNoteReading {
  const words = sellerWordsOf(note);
  if (!words) return { kind: 'empty' };
  // C3: the facts need the clock (relative days); without one none are read, and the reading is what it was.
  const facts = opts.now ? { facts: doneNoteFacts(words, opts.now) } : {};
  // A dotted date ("10.14.2026") must not split the first clause.
  const first = undot(words).split(/[,.;:]/)[0]?.trim() ?? words;
  const lead = PROGRESS_LEAD.exec(first);
  if (lead) return { kind: 'progress', cue: lead[1].toLowerCase(), note: words, ...facts };
  const pron = PROGRESS_PRONOUN.exec(first);
  if (pron) {
    // "I'm researching", "we will call": the verb after the pronoun decides.
    const rest = first.slice(pron[0].length).trim();
    const inner = PROGRESS_LEAD.exec(rest);
    if (inner) return { kind: 'progress', cue: inner[1].toLowerCase(), note: words, ...facts };
    if (PROGRESS_AFTER_PRONOUN.test(pron[0].slice(pron[1].length).trim())) return { kind: 'progress', cue: pron[0].toLowerCase().trim(), note: words, ...facts };
  }
  return { kind: 'completion', note: words, ...facts };
}

/** "10.14.2026" reads as "10/14/2026" (the seller's dotted date; a dotted day without a year is left alone: "1.5 hours" is not January 5). */
const undot = (s: string) => s.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g, '$1/$2/$3');

/** A meeting named ahead: the cue, with no held-meeting verb before it ("had the call" is a conversation, not a meeting to prepare). */
const MEETING_CUE = /\b(meeting|call|demo|walk-?through|walkthrough|site visit|visit|regroup|sync|check-?in|intro)\b/i;
const HELD_BEFORE = /\b(had|held|met|finished|wrapped|did|took|completed|done with|after)\b/i;
/** A send or a contact the seller reports, with what follows it. */
const SENT_VERB = /\b(sent|emailed|e-mailed|messaged|texted|pinged|called|rang|replied to|wrote to|wrote|left (?:him|her|them )?(?:a )?voicemail(?: for)?)\b\s*(.*)$/i;
const PRONOUN = /^(him|her|them|they|he|she)\b/i;
const NAME = /^((?:[A-Z][a-z'-]+)(?: [A-Z][a-z'-]+)?)\b/;
const TO_WHOM = /\bto (him|her|them|(?:[A-Z][a-z'-]+)(?: [A-Z][a-z'-]+)?)\b/;
const WEEKDAY_ONLY = /^(?:next |this |last )?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i;
/** A meeting named further ahead than this is not read (a month-and-day the calendar rolled into next year is a past meeting). */
export const MEETING_HORIZON_DAYS = 180;

/**
 * C3: the facts a completion note states, read clause by clause (a sentence, then its comma clauses for the send's
 * day). Pure; the day is read in New York from `now`.
 */
export function doneNoteFacts(words: string, now: Date): DoneFact[] {
  const out: DoneFact[] = [];
  const today = nyDay(now);
  const text = undot(words);
  for (const sentence of text.split(/(?<=[.;!?])\s+/).map((x) => x.trim()).filter(Boolean)) {
    const cue = MEETING_CUE.exec(sentence);
    if (cue && !HELD_BEFORE.test(sentence.slice(0, cue.index)) && !/\bcalled\b/i.test(sentence.slice(0, cue.index))) {
      const due = parseDuePhrase(sentence, now);
      // A day on or after today, within the horizon: "meeting Oct 1" said on Oct 9 is last week's meeting, not next year's.
      if (due && due.day >= today && due.day <= addDays(today, MEETING_HORIZON_DAYS) && !out.some((f) => f.kind === 'meeting' && f.day === due.day)) out.push({ kind: 'meeting', day: due.day, phrase: due.phrase, ambiguous: due.ambiguous, words: sentence });
    }
    for (const clause of sentence.split(/,\s*/).map((x) => x.trim()).filter(Boolean)) {
      const m = SENT_VERB.exec(clause);
      if (!m) continue;
      const verb = m[1].toLowerCase();
      const rest = m[2].trim();
      // "left them a voicemail": the pronoun sits inside the verb phrase.
      const pron = PRONOUN.exec(rest) ?? /\b(him|her|them)\b/i.exec(m[1]);
      const name = pron ? null : NAME.exec(rest);
      const to = pron ? null : name ? null : TO_WHOM.exec(rest);
      const who = pron ? 'them' : name ? name[1] : to ? (/^(him|her|them)$/i.test(to[1]) ? 'them' : to[1]) : null;
      const channel: 'email' | 'call' | 'message' = /^(called|rang|left)/.test(verb) ? 'call' : /^(messaged|texted|pinged)/.test(verb) ? 'message' : 'email';
      const when = sentDay(clause, now, today);
      out.push({ kind: 'sent', who, when, channel, phrase: m[1], words: clause });
    }
  }
  return out;
}

/** The day a send clause names, read as a past day: "today" and no day are today, "yesterday" is yesterday, a weekday is the one just past; a future date is today. */
function sentDay(clause: string, now: Date, today: string): string {
  if (/\byesterday\b/i.test(clause)) return addDays(today, -1);
  const d = parseDuePhrase(clause.replace(/\byesterday\b/gi, ''), now);
  if (!d) return today;
  if (d.day <= today) return d.day;
  if (WEEKDAY_ONLY.test(d.phrase)) return addDays(d.day, -7);
  return today;
}

/** The seller line for a progress note. */
export function progressLine(r: Extract<DoneNoteReading, { kind: 'progress' }>): string {
  return `Recorded as in progress, not done: "${r.note.slice(0, 120)}". The item stays open. When it has happened, reply DONE: what happened; to set it aside, SKIP or DEFER.`;
}
