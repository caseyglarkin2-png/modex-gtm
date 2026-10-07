/**
 * R60 decision 2: "HYPOTHESIS" and "BID" are GAP's internal vocabulary. Casey reads "what we think is happening" (the
 * read itself), "thesis" where it names the object, and "what the buyer said". Seller-facing headings and labels say
 * those words; ids, routes, flags and ledger kinds keep theirs.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRIEF_LABELS } from '@/components/gap/pre-call-brief';
import { HUMAN_ACTION_LABEL } from '@/components/gap/decision-card';
import { PURPOSE_LABEL } from '@/lib/gap/people/owner-resolution';

const src = (f: string) => readFileSync(f, 'utf8');
const SELLER_SURFACES = [
  'src/components/gap/account-brief.tsx',
  'src/components/gap/bid-chips.tsx',
  'src/components/gap/disposition-form.tsx',
  'src/components/gap/fact-hypothesis-blocks.tsx',
  'src/components/gap/pre-call-brief.tsx',
  'src/components/gap/research-this.tsx',
  'src/components/gap/six-line-brief.tsx',
  'src/components/gap/thesis-group-review.tsx',
  'src/components/gap/hypothesis-drawer.tsx',
  'src/components/gap/gap-subnav.tsx',
  'src/components/gap/owner-resolution-panel.tsx',
  'src/app/gap/hypotheses/page.tsx',
  'src/app/gap/learning/learning-dashboard.tsx',
  'src/lib/gap/routing/card-readiness.ts',
  'src/lib/gap/routing/seller-action.ts',
];

describe('R60: the seller reads the story and what the buyer said, never HYPOTHESIS or BID', () => {
  it('no seller-facing heading or label says Hypothesis or BID', () => {
    for (const f of SELLER_SURFACES) {
      const s = src(f);
      expect(s, f).not.toMatch(/>\s*(?:Hypothes[ie]s|HYPOTHESIS)\s*</);
      expect(s, f).not.toMatch(/label="Hypothesis"|'(?:Top|Review|Approve|Reject) hypothesis'|'Review the (?:waiting )?hypothesis'|propose a hypothesis|All hypotheses|Hypothesis funnel|Hypothesis \(inference\)|>Hypothesis:</);
      expect(s, f).not.toMatch(/\(BID\)|BID captured|Open BIDs|'BID types'|"BID types"/);
    }
  });
  it('the words that replace them', () => {
    expect(BRIEF_LABELS.openBids).toBe('What the buyer said');
    expect(HUMAN_ACTION_LABEL.approved_hypothesis).toBe('I approved the thesis');
    expect(PURPOSE_LABEL.HYPOTHESIS_ACTIVATION).toBe('this thesis');
    expect(src('src/components/gap/fact-hypothesis-blocks.tsx')).toContain('>WHAT WE THINK IS HAPPENING</h3>');
    expect(src('src/components/gap/account-brief.tsx')).toContain('>What we think is happening</h2>');
  });
});
