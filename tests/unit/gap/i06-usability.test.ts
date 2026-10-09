// @vitest-environment node
/**
 * I06 (GAP OS prospecting first, the course correction, 2026-10-08): signal age is never an automatic
 * disqualification on the path from a fact to an approved outreach strategy. research/currentness.ts keeps ONE
 * clock, but it now answers two questions: is the fact CURRENT (a label: current or historical, and until when) and
 * is it USABLE (the gate: no only for a reason that is not the calendar: ended, closed, undated, superseded). A
 * 2018 site expansion is historical and usable; a notice whose due date passed is closed and unusable; an undated
 * fact cannot be cited with its date, so it is unusable; a fact a newer source says ended is unusable.
 */
import { describe, expect, it } from 'vitest';
import { currentnessLine, factCurrentness, factUsability, isCurrentFact, isUsableFact, usabilityLine } from '@/lib/gap/research/currentness';

const NOW = new Date('2026-10-08T15:00:00Z');
const HORMEL_2018 = { observed_at: new Date('2018-05-01T12:00:00Z'), type: 'site_expansion', evidence_text: 'Hormel Foods broke ground on a 300,000-square-foot distribution center expansion in Austin, Minnesota.' };

describe('I06: usability is not recency', () => {
  it('a 2018 site expansion is historical AND usable; the line says the date and that the copy must say it', () => {
    expect(isCurrentFact(HORMEL_2018, NOW)).toBe(false);
    const u = factUsability(HORMEL_2018, NOW);
    expect(u).toMatchObject({ usable: true, historical: true, reason: null });
    expect(u.currentness).toMatchObject({ current: false, basis: 'type_window' });
    expect(isUsableFact(HORMEL_2018, NOW)).toBe(true);
    expect(usabilityLine(u, HORMEL_2018)).toBe('A historical observation from May 1, 2018 (its window ran until Aug 29, 2018): it can carry a thesis, and the copy must say the date.');
    // The chronological label is honest about the window and never calls the fact unusable.
    expect(currentnessLine(factCurrentness(HORMEL_2018, NOW))).toBe('A historical observation: it was current until Aug 29, 2018. Cite it with its date.');
  });

  it('a current fact is usable and not historical, with the current-until line', () => {
    const u = factUsability({ observed_at: new Date('2026-10-01T12:00:00Z'), type: 'news' }, NOW);
    expect(u).toMatchObject({ usable: true, historical: false, reason: null });
    expect(usabilityLine(u)).toBe('Current until Nov 15, 2026.');
  });

  it('ended, closed, undated and superseded are the only refusals, each with its reason and its line', () => {
    const ended = factUsability({ ...HORMEL_2018, metadata: { continuity: { kind: 'ended' } } }, NOW);
    expect(ended).toMatchObject({ usable: false, reason: 'ended' });
    expect(usabilityLine(ended)).toBe('A newer source says this ended: not a story for a first touch.');
    const closed = factUsability({ observed_at: new Date('2026-09-01T00:00:00Z'), type: 'news', metadata: { claimAttributes: { dueDate: '2026-09-30' } } }, NOW);
    expect(closed).toMatchObject({ usable: false, reason: 'closed' });
    expect(usabilityLine(closed)).toMatch(/^This notice closed on Sep 30, 2026/);
    const undated = factUsability({ observed_at: null, type: 'news' }, NOW);
    expect(undated).toMatchObject({ usable: false, reason: 'undated', historical: true });
    expect(usabilityLine(undated)).toBe('Undated: not a story for a first touch.');
    const superseded = factUsability({ ...HORMEL_2018, metadata: { superseded: true } }, NOW);
    expect(superseded).toMatchObject({ usable: false, reason: 'superseded' });
    expect(usabilityLine(superseded)).toBe('Research marked this fact superseded by a newer one: it is not quoted.');
    // An open notice whose due date has not passed is usable.
    expect(isUsableFact({ observed_at: new Date('2026-09-01T00:00:00Z'), type: 'news', metadata: { claimAttributes: { dueDate: '2026-12-31' } } }, NOW)).toBe(true);
    // A recorded expiry in the past is age, not a refusal.
    expect(factUsability({ observed_at: new Date('2026-06-01T00:00:00Z'), freshness_expires_at: new Date('2026-07-01T00:00:00Z'), type: 'news' }, NOW)).toMatchObject({ usable: true, historical: true });
  });
});
