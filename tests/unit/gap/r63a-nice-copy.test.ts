/**
 * R63-A N6 (copy) and N4 (dates) on the surfaces they were seen: "Current (confirmed), Current (confirmed): ...",
 * "On evidence Glen also leads Lisa", "...where the day is lost Wrong if: If trailers ...", "Read BRIEF before you go."
 */
import { describe, expect, it } from 'vitest';
import { compactReason } from '@/components/gap/people-stack';
import { endSentence, ourReadLine } from '@/lib/gap/context/brief';

describe('R63-A N6: the copy reads as sentences, once', () => {
  it('a compact row never says its currentness twice', () => {
    expect(compactReason('Current (confirmed)', 'Current (confirmed): Recent evidence places them at Nfi, email on record')).toBeNull();
    expect(compactReason('Runs transportation', 'Current (confirmed): Recent evidence places them at Nfi')).toBe('Runs transportation');
  });

  it('our read ends as a sentence and its "wrong if" never doubles the if', () => {
    expect(ourReadLine({ problem: 'the gate is where the day is lost', wrongIf: 'If trailers do not wait, this is closed.' })).toBe('Our read: the gate is where the day is lost. Wrong if trailers do not wait, this is closed.');
    expect(ourReadLine({ problem: 'Trailers wait at the gate.', wrongIf: null })).toBe('Our read: Trailers wait at the gate.');
    expect(endSentence('Is it the gate?')).toBe('Is it the gate?');
  });
});
