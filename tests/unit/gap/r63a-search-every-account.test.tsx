/**
 * R63-A S13: GAP Accounts and Work search could not find Unlinked ("0 of 11 / No account matches") though its page
 * exists, and that page's "HubSpot could not be checked" read like an outage. The Accounts search now covers every
 * account (the ones GAP has not worked yet are listed after the GAP accounts), Work's search links to it, and an account
 * with no HubSpot company linked says so with the one step that lifts the hold.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams('q=Unlinked') }));
vi.mock('@/components/gap/refresh-now', () => ({ refreshNow: vi.fn(), RefreshNudge: () => null }));
import { AccountsIndex } from '@/components/gap/accounts-index';
import { WorkList } from '@/components/gap/work-list';
import { orderAccounts, toIndexRow } from '@/lib/gap/accounts/index-list';
import { opportunityHoldOf } from '@/lib/gap/work/opportunity-holds';
import { workDay } from '@/lib/gap/work/list';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-07T15:00:00Z');
const UNLINKED = 'Unlinked Scratch Co r63';
const SENTENCE = 'No HubSpot company is linked to this account. Link it in HubSpot; until then no cold touch.';
const worked = orderAccounts(Array.from({ length: 11 }, (_, k) => toIndexRow({ name: `Worked Scratch ${k}`, tier: 'Tier 2', vertical: 'cpg', priority_band: 'B' }, 2, null)));
const others = [toIndexRow({ name: UNLINKED, tier: 'Tier 1', vertical: 'cpg', priority_band: 'A' }, 0, null)];

describe('R63-A S13: the search covers every account; no HubSpot company linked is not an outage', () => {
  it('the Accounts search finds an account GAP has not worked yet, and Enter opens it', () => {
    render(<AccountsIndex rows={worked} others={others} />);
    fireEvent.change(screen.getByTestId('accounts-search'), { target: { value: 'Unlinked' } });
    expect(screen.queryByTestId('accounts-empty')).toBeNull();
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('0 of 11; 1 more not worked in GAP yet');
    expect(screen.getByTestId('accounts-other-row')).toHaveTextContent(`${UNLINKED}Tier 1 · cpg · no people on record in GAP yet`);
    fireEvent.submit(screen.getByTestId('accounts-search').closest('form')!);
    expect(push).toHaveBeenCalledWith('/gap/accounts/unlinked-scratch-co-r63');
  });

  it('Work search with no card matching says so and links to every account', () => {
    const held = opportunityHoldOf({ status: 'UNKNOWN', reason: 'timeout' })!;
    const day = workDay({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, opportunityHolds: new Map([['Worked Scratch 1', held]]) });
    render(<WorkList cards={day.cards} counts={day.counts} />);
    expect(screen.getByTestId('work-empty')).toHaveTextContent('No account on Work matches.');
    expect(screen.getByTestId('work-search-all').querySelector('a')?.getAttribute('href')).toMatch(/^\/gap\/accounts\/?\?q=Unlinked$/);
  });

  it('the account and its Work card say no HubSpot company is linked, with the step; HubSpot not answering keeps its words', () => {
    const input: PursuitInput = { accountName: UNLINKED, now: NOW, motionType: 'FACT_LED', opportunity: { status: 'UNKNOWN', detail: 'identity_unresolved', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] };
    const s = projectPursuitState(input);
    expect(s.stateLine).toBe('Held: no HubSpot company linked');
    expect(s.blocker).toBe(SENTENCE);
    const hold = opportunityHoldOf({ status: 'UNKNOWN', reason: 'identity_unresolved' })!;
    const day = workDay({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, opportunityHolds: new Map([[UNLINKED, hold]]) });
    expect(day.cards.find((c) => c.accountName === UNLINKED)).toMatchObject({ state: 'Held: no HubSpot company linked', why: SENTENCE, blocker: null });
    expect(opportunityHoldOf({ status: 'UNKNOWN', reason: 'timeout' })).toEqual({ kind: 'unknown', why: 'HubSpot could not be checked: HubSpot did not answer in time. No cold touch until it can.' });
  });
});
