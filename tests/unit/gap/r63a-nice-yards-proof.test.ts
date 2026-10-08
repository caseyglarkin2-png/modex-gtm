/**
 * R63-A N5 and N7. "Yards" is always plural in what a seller reads ("the change moved no load onto the yard", "Learn
 * whether the yard is where trucks wait"), and the deal artifacts' proof line is the canon's own phrases ("at 24 live
 * Primo Brands sites ... measured" read as measured at all 24 sites).
 */
import { describe, expect, it } from 'vitest';
import { YARDFLOW_PROOF } from '@/lib/gap/deals/artifacts';
import { CANON_PROOF } from '@/lib/gap/compiler/canon';
import { canonPhrasingProblems } from '@/lib/gap/compiler/checks/c01-evidence';
import { suggestAngle } from '@/lib/gap/motion/persona-angle';
import { EVENT_DRAFT_DEFAULTS } from '@/lib/gap/story/draft-defaults';

describe('R63-A N5 and N7', () => {
  it('N7: the proof is the canon phrases and passes the phrasing rule', () => {
    expect(YARDFLOW_PROOF).toBe('For reference, our own result at Primo Brands: trailer turns 48 to 24 minutes, measured. Primo Brands has 24 sites live. That is a YardFlow result at Primo Brands, not a forecast for your yards.');
    expect(YARDFLOW_PROOF).toContain(CANON_PROOF.turnTime);
    expect(canonPhrasingProblems(YARDFLOW_PROOF)).toEqual([]);
    expect(YARDFLOW_PROOF).not.toMatch(/24 live Primo/);
  });

  it('N5: the angle and the default "wrong if" say yards, plural', () => {
    expect(suggestAngle({ title: 'VP Linehaul Transportation', personaKey: null, accountName: 'Fedex' })).toBe('Runs transportation at Fedex, so carrier dwell and detention are visible to them. Learn whether their yards are where trucks wait.');
    expect(EVENT_DRAFT_DEFAULTS.noMeans).toBe('If trailers do not wait longer at those sites since the change, it moved no load onto the yards: this thesis is closed for them.');
  });
});
