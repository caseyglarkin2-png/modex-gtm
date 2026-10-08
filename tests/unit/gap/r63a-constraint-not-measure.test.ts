/**
 * R63-A S17: the pilot success draft to Ann listed a constraint as a success measure ("Any pilot has to run on our
 * existing gate cameras."). Constraints and success measures are separate BID kinds in the R53 artifact: a requirement
 * is listed apart, as what the pilot has to respect, and never counted as a measure.
 */
import { describe, expect, it } from 'vitest';
import { prepareArtifacts, type ArtifactInput } from '@/lib/gap/deals/artifacts';
import { planFor } from '@/lib/gap/deals/action-plan';

const DEAL = { id: '70002', name: 'YardFlow - Kroger Scratch Co r63', contacts: [{ name: 'Ann Scratch', title: 'VP Supply Chain Operations' }] };
const GATE = { id: 'c1', type: 'constraint', quote: 'Any pilot has to run on our existing gate cameras.', who: 'Ann Scratch', at: '2026-10-07T15:00:00.000Z', accountLevel: false };
const input = (needs: ArtifactInput['needs']): ArtifactInput => ({ accountName: 'Kroger Scratch Co r63', deal: DEAL, needs, plan: planFor(DEAL.id, [], []), commitments: [], roi: null });
const pilotOf = (needs: ArtifactInput['needs']) => prepareArtifacts(input(needs)).find((a) => a.kind === 'pilot_criteria')!;

describe('R63-A S17: a constraint is never a success measure', () => {
  it('a requirement alone: no success measure is claimed; the requirement is listed as what the pilot respects', () => {
    const p = pilotOf([GATE]);
    expect(p.why).toBe('The pilot is proposed on YardFlow - Kroger Scratch Co r63 and no success measure is confirmed (one requirement it has to respect): ask Ann what they would need to see.');
    expect(p.text).toBe(['Pilot success criteria: none agreed yet.', '', 'What the pilot has to respect, as you told us:', '- "Any pilot has to run on our existing gate cameras." (Ann Scratch)', '', 'What would you need to see at the end of a pilot to call it worth rolling out?'].join('\n'));
    expect(p.gaps).toEqual(['No success measure confirmed by the buyer: nothing is invented.']);
    expect(p.citations.map((c) => c.ref)).toEqual(['bid:c1']);
  });

  it('a measure and a requirement: the measure defines success, the requirement is listed apart', () => {
    const p = pilotOf([GATE, { id: 'm1', type: 'metric', quote: 'We pay about forty thousand a month in detention.', who: 'Ann Scratch', at: '2026-10-07T15:00:00.000Z', accountLevel: false }]);
    expect(p.why).toBe('The pilot is proposed on YardFlow - Kroger Scratch Co r63; one measure of their own can define success, with one requirement it has to respect: confirm it with Ann.');
    const [success, respect] = p.text.split('What the pilot has to respect, as you told us:');
    expect(success).toContain('"We pay about forty thousand a month in detention."');
    expect(success).not.toContain('gate cameras');
    expect(respect).toContain('"Any pilot has to run on our existing gate cameras." (Ann Scratch)');
  });
});
