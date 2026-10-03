/**
 * Cross-account Apollo review (Casey, 2026-10-03): a thin reader over the per-account projection. It never calls Apollo
 * or any API, evaluates only the accounts Casey picks (at most 10), keeps one row per gap, and copies requests to the
 * clipboard for Casey to run by hand.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apolloBatchText, apolloRequestText, filterCandidates, MAX_REVIEW_ACCOUNTS, reviewApolloCandidates } from '@/lib/gap/people/apollo-review';
import { ApolloReviewTable } from '@/components/gap/apollo-review-table';
import type { ApolloCandidate } from '@/lib/gap/people/apollo-candidates';

const cand = (account: string, kind: ApolloCandidate['kind'], target: string, decision = 'WHO and the first touch'): ApolloCandidate => ({
  key: `${account}|${kind}|${target}`, account, kind, target, missing: 'Missing thing.', whyItMatters: 'It matters.', decision, possibleMatch: null, creditCost: 'UNKNOWN', checkedFirst: ['GAP contacts (1)'],
});

describe('reviewApolloCandidates', () => {
  it('evaluates only the chosen accounts (at most 10), keeps one row per gap, notes the quiet ones and the unreadable ones', async () => {
    // 'acme-inc' resolves to the same account as 'acme' (an alias): still one row per gap.
    const load = vi.fn(async (_p: unknown, slug: string) => (slug === 'broken' ? null : { brief: { accountName: slug === 'acme-inc' ? 'ACME' : slug.toUpperCase() }, inputs: {} }) as never);
    const project = vi.fn((brief: { accountName: string }) => (brief.accountName === 'QUIET'
      ? { candidates: [], notNeeded: 'HubSpot contacts could not be read just now.', unknownIsFine: null }
      : { candidates: [cand(brief.accountName, 'FIND_OWNER', 'owner')], notNeeded: null, unknownIsFine: null }) as never);
    const slugs = ['acme', 'acme', 'acme-inc', 'quiet', 'broken', ...Array.from({ length: 12 }, (_, i) => `x${i}`)];
    const r = await reviewApolloCandidates({}, slugs, new Date(), { load: load as never, project: project as never });
    expect(load).toHaveBeenCalledTimes(MAX_REVIEW_ACCOUNTS);
    expect(r.rows.filter((x) => x.account === 'ACME')).toHaveLength(1);
    expect(r.notes).toEqual([{ account: 'QUIET', note: 'HubSpot contacts could not be read just now.' }]);
    expect(r.failed).toEqual(['broken']);
  });
});

describe('request text and filters', () => {
  it('one request carries every reason and cost unknown; a batch says GAP spent nothing', () => {
    const c = cand('Acme', 'FIND_EMAIL', 'Dana Trans, Director of Transportation', 'Whether the first touch can go to the owner by email');
    expect(apolloRequestText(c)).toBe('[FIND EMAIL] Acme: Dana Trans, Director of Transportation\nMissing: Missing thing.\nWhy it matters: It matters.\nCould change: Whether the first touch can go to the owner by email\nPossible match: none on record\nGAP checked: GAP contacts (1)\nCredit cost: unknown until run');
    expect(apolloBatchText([c])).toMatch(/^1 Apollo lookup for Casey to decide \(GAP spent nothing\):/);
  });
  it('filters by account, lookup type and decision', () => {
    const rows = [cand('Acme', 'FIND_OWNER', 'a'), cand('Beta', 'FIND_EMAIL', 'b', 'Whether the first touch can go to the owner by email'), cand('Beta', 'CONFIRM_TITLE', 'c', 'Whether X leads WHO')];
    expect(filterCandidates(rows, { account: 'Beta' }).map((r) => r.target)).toEqual(['b', 'c']);
    expect(filterCandidates(rows, { kind: 'FIND_OWNER' }).map((r) => r.target)).toEqual(['a']);
    expect(filterCandidates(rows, { decision: 'email' }).map((r) => r.target)).toEqual(['b']);
  });
});

describe('<ApolloReviewTable>', () => {
  const fetchSpy = vi.fn();
  const writeText = vi.fn().mockResolvedValue(undefined);
  beforeEach(() => { fetchSpy.mockReset(); writeText.mockClear(); vi.stubGlobal('fetch', fetchSpy); Object.assign(navigator, { clipboard: { writeText } }); });
  afterEach(() => vi.unstubAllGlobals());

  it('copy one, copy selected: only the clipboard is touched, never the network', async () => {
    const rows = [cand('Acme', 'FIND_OWNER', 'owner'), cand('Beta', 'FIND_EMAIL', 'Dana')];
    render(<ApolloReviewTable rows={rows} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[1]);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(apolloRequestText(rows[1])));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Acme: Find owner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy selected (1)' }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(apolloBatchText([rows[0]])));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByText('Unknown until run')).toHaveLength(2);
  });
  it('the lookup filter narrows the rows', () => {
    render(<ApolloReviewTable rows={[cand('Acme', 'FIND_OWNER', 'owner'), cand('Beta', 'FIND_EMAIL', 'Dana')]} />);
    fireEvent.change(screen.getByLabelText('Filter by lookup type'), { target: { value: 'FIND_EMAIL' } });
    expect(screen.getAllByTestId('apollo-review-row')).toHaveLength(1);
  });
});
