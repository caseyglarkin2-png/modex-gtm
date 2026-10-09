/**
 * THE DONE NOTE, READ (seller acceptance follow-up, 2026-10-09). Pure.
 *
 * "DONE: researching catalysts" closed an obligation on October 9 and the activity view then read it as the follow-up
 * done. A seller's note after DONE is read before it is recorded: a note that says what HAPPENED (a call made, a deck
 * sent, an answer given) is a completion; a note that says what the seller is DOING or WILL DO (researching, looking
 * into, will call, still waiting, drafting) is progress, and progress never completes an obligation and never reads as
 * contact or commercial advancement. The reading is by the first clause of the note's own words (a signature block is
 * cut); it is deterministic and it says the cue it matched so the seller can see why.
 */
export type DoneNoteReading = { kind: 'empty' } | { kind: 'progress'; cue: string; note: string } | { kind: 'completion'; note: string };

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
export function readDoneNote(note: string | null | undefined): DoneNoteReading {
  const words = sellerWordsOf(note);
  if (!words) return { kind: 'empty' };
  const first = words.split(/[,.;:]/)[0]?.trim() ?? words;
  const lead = PROGRESS_LEAD.exec(first);
  if (lead) return { kind: 'progress', cue: lead[1].toLowerCase(), note: words };
  const pron = PROGRESS_PRONOUN.exec(first);
  if (pron) {
    // "I'm researching", "we will call": the verb after the pronoun decides.
    const rest = first.slice(pron[0].length).trim();
    const inner = PROGRESS_LEAD.exec(rest);
    if (inner) return { kind: 'progress', cue: inner[1].toLowerCase(), note: words };
    if (PROGRESS_AFTER_PRONOUN.test(pron[0].slice(pron[1].length).trim())) return { kind: 'progress', cue: pron[0].toLowerCase().trim(), note: words };
  }
  return { kind: 'completion', note: words };
}

/** The seller line for a progress note. */
export function progressLine(r: Extract<DoneNoteReading, { kind: 'progress' }>): string {
  return `Recorded as in progress, not done: "${r.note.slice(0, 120)}". The item stays open. When it has happened, reply DONE: what happened; to set it aside, SKIP or DEFER.`;
}
