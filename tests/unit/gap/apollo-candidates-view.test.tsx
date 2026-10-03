/** The Apollo candidate list is read-only: it shows what and why, and has no control that could spend a credit. */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApolloCandidatesView } from '@/components/gap/apollo-candidates';

const c = { key: 'Acme|FIND_OWNER|x', account: 'Acme', kind: 'FIND_OWNER' as const, target: 'The North America transportation operating owner at Acme (a search, not a known person)', missing: 'Who runs transportation.', whyItMatters: 'WHO.', decision: 'WHO and the first touch', possibleMatch: null, creditCost: 'UNKNOWN' as const, checkedFirst: ['GAP contacts (1)'] };

describe('<ApolloCandidatesView>', () => {
  it('shows each request with its reason, cost unknown, and no button or link that could run it', () => {
    render(<ApolloCandidatesView view={{ candidates: [c], notNeeded: null, unknownIsFine: 'Until Casey decides, WHO stays unknown: GAP does not guess and does not spend.' }} />);
    expect(screen.getByText(/never spends Apollo credits on its own/)).toBeInTheDocument();
    expect(screen.getByText('Unknown until run')).toBeInTheDocument();
    expect(screen.getByText('None on record')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
  it('nothing to propose says why', () => {
    render(<ApolloCandidatesView view={{ candidates: [], notNeeded: 'Review the staged contact candidate Tom first: already found, no credit needed.', unknownIsFine: null }} />);
    expect(screen.getByTestId('apollo-none').textContent).toBe('Review the staged contact candidate Tom first: already found, no credit needed.');
  });
});
