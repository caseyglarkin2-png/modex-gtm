import { describe, expect, it } from 'vitest';
import { progressLine, readDoneNote, sellerWordsOf } from '@/lib/gap/work/done-note';

describe('the DONE note is read before it is recorded (seller acceptance follow-up, 2026-10-09)', () => {
  it('the October 9 note "researching catalysts" with the signature block is progress, not a completion', () => {
    const r = readDoneNote('researching catalysts\nCasey Larkin · GTM, YardFlow by FreightRoll · c. 410-236-7434 · yardflow.ai');
    expect(r).toEqual({ kind: 'progress', cue: 'researching', note: 'researching catalysts' });
    if (r.kind === 'progress') expect(progressLine(r)).toMatch(/^Recorded as in progress, not done: "researching catalysts"\. The item stays open\./);
  });

  it('a note that says what happened is a completion even when a later clause says "will"', () => {
    expect(readDoneNote('called Joey, he will send the comparison Friday')).toEqual({ kind: 'completion', note: 'called Joey, he will send the comparison Friday' });
    expect(readDoneNote('sent the deck to Dave').kind).toBe('completion');
    expect(readDoneNote('Left a voicemail. Will try again Monday.').kind).toBe('completion');
  });

  it('what the seller is doing or will do is progress, with the cue it matched', () => {
    expect(readDoneNote('will call tomorrow')).toMatchObject({ kind: 'progress', cue: 'will' });
    expect(readDoneNote('still waiting on their reply')).toMatchObject({ kind: 'progress', cue: 'still' });
    expect(readDoneNote('drafting the follow-up')).toMatchObject({ kind: 'progress', cue: 'drafting' });
    expect(readDoneNote("I'm looking into the Chattanooga site")).toMatchObject({ kind: 'progress', cue: 'looking into' });
    expect(readDoneNote('we will send the comparison Friday')).toMatchObject({ kind: 'progress' });
    expect(readDoneNote('not yet, need the numbers first')).toMatchObject({ kind: 'progress', cue: 'not yet' });
  });

  it('an empty note, or one that is only a signature, is empty', () => {
    expect(readDoneNote('')).toEqual({ kind: 'empty' });
    expect(readDoneNote(null)).toEqual({ kind: 'empty' });
    expect(readDoneNote('--\nCasey Larkin')).toEqual({ kind: 'empty' });
    expect(sellerWordsOf('  called them  \n\n-- \nCasey')).toBe('called them');
  });
});
