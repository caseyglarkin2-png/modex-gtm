/**
 * R63-A S5, everywhere the statement shows: a paraphrase the seller noted is never quoted as the buyer's words. The
 * recap already said it as understood; the pilot success draft and the business-case inputs still put it in quotation
 * marks ("Pilot success, in your own measures: - "He said they pay forty thousand..."").
 */
import { describe, expect, it } from 'vitest';
import { prepareArtifacts, type ArtifactInput } from '@/lib/gap/deals/artifacts';
import { planFor } from '@/lib/gap/deals/action-plan';

const DEAL = { id: '70003', name: 'Kroger Scratch Co r63 Columbus DC', contacts: [{ name: 'Ben Scratch', title: 'Director, Columbus DC' }] };
const NOTED = { id: 'n1', type: 'metric', quote: 'He said they pay about forty thousand a month in detention at Columbus.', who: 'Ben Scratch', at: '2026-10-07T15:00:00.000Z', accountLevel: false, noted: true };
const OWN = { id: 'v1', type: 'metric', quote: 'We lose about 3 hours per shift hunting for trailers.', who: 'Ben Scratch', at: '2026-10-07T15:00:00.000Z', accountLevel: false };
const arts = prepareArtifacts({ accountName: 'Kroger Scratch Co r63', deal: DEAL, needs: [OWN, NOTED], plan: planFor(DEAL.id, [], []), commitments: [], roi: null } satisfies ArtifactInput);
/** The lines that carry the noted statement and a quotation mark (none may). */
const quotedNoted = (text: string) => text.split('\n').filter((l) => l.includes('forty thousand') && l.includes('"'));

describe('R63-A S5: a noted statement is never quoted in any prepared artifact', () => {
  it('the pilot draft quotes their own words and says the noted one as understood', () => {
    const text = arts.find((a) => a.kind === 'pilot_criteria')!.text;
    expect(text).toContain('- "We lose about 3 hours per shift hunting for trailers." (Ben Scratch)');
    expect(text).toContain('- They pay about forty thousand a month in detention at Columbus. (as I understood it from Ben Scratch)');
    expect(quotedNoted(text)).toEqual([]);
    expect(text).not.toMatch(/He said/);
  });

  it('the business-case inputs say the noted number as understood, never in quotation marks', () => {
    const text = arts.find((a) => a.kind === 'business_case')!.text;
    expect(text).toContain('- Your number: "We lose about 3 hours per shift hunting for trailers." (Ben Scratch)');
    expect(text).toContain('- Your number, as I understood it: They pay about forty thousand a month in detention at Columbus. (Ben Scratch)');
    expect(quotedNoted(text)).toEqual([]);
  });
});
