/**
 * R63-B S10: the Kroger brief's mutual plan read "Proposed by GAP, not agreed by anyone yet" while all five milestones
 * were pre-checked and the button read "Record the plan (5 agreed, 0 declined)". R52: proposed stays proposed. Nothing
 * is decided until the seller chooses Agree or Decline, the button counts only those choices, and the recorded rows
 * carry agreed and declined exactly as chosen (an undecided proposal is not sent and stays proposed).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { planFor } from '@/lib/gap/deals/action-plan';
import { DealPlan, planReviewLabel } from '@/components/gap/deal-plan';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/components/gap/refresh-now', () => ({ refreshNow: vi.fn() }));
const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response('{}', { status: 200 }));
vi.stubGlobal('fetch', fetchMock);

const ACCOUNT = 'Kroger Scratch Co r63';
const DEAL = '312797001';

beforeEach(() => fetchMock.mockClear());

describe('R63-B S10: proposed stays proposed until the seller decides', () => {
  it('no proposal arrives agreed: each says Not decided, and the button records nothing until a choice is made', () => {
    const plan = planFor(DEAL, [], []);
    render(<DealPlan accountName={ACCOUNT} dealId={DEAL} plan={plan} />);
    const proposals = screen.getAllByTestId('plan-proposal');
    expect(proposals.length).toBe(plan.filter((m) => m.state === 'proposed').length);
    expect(proposals.length).toBeGreaterThan(1);
    for (const p of proposals) {
      expect((within(p).getByTestId('plan-undecided') as HTMLInputElement).checked).toBe(true);
      expect((within(p).getByTestId('plan-agree') as HTMLInputElement).checked).toBe(false);
      expect((within(p).getByTestId('plan-decline') as HTMLInputElement).checked).toBe(false);
      expect(p.textContent).toMatch(/Stays proposed until you decide\./);
    }
    const submit = screen.getByTestId('plan-review-submit') as HTMLButtonElement;
    expect(submit.textContent).toBe('Record the plan (choose Agree or Decline on a step first)');
    expect(submit.disabled).toBe(true);
    expect(screen.getByTestId('deal-plan-review').textContent).toMatch(/Proposed by GAP, not agreed by anyone yet/);
    // S13: each choice is a 24 px target.
    expect(within(proposals[0]).getByTestId('plan-agree').className).toMatch(/\bh-6\b.*\bw-6\b/);
  });

  it('the button counts only what was chosen, and only those are recorded, agreed and declined exactly as chosen', async () => {
    const plan = planFor(DEAL, [], []);
    render(<DealPlan accountName={ACCOUNT} dealId={DEAL} plan={plan} />);
    const proposals = screen.getAllByTestId('plan-proposal');
    const [first, second] = proposals.map((p) => p.getAttribute('data-step')!);
    fireEvent.click(within(proposals[0]).getByTestId('plan-agree'));
    fireEvent.click(within(proposals[1]).getByTestId('plan-decline'));
    const left = proposals.length - 2;
    expect(screen.getByTestId('plan-review-submit').textContent).toBe(`Record the plan (1 agreed, 1 declined, ${left} still proposed)`);
    fireEvent.click(screen.getByTestId('plan-review-submit'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ op: 'review', accountName: ACCOUNT, dealId: DEAL });
    expect(body.items.map((x: { step: string; decision: string }) => [x.step, x.decision])).toEqual([[first, 'agree'], [second, 'decline']]);
    await waitFor(() => expect(screen.getByTestId('plan-status').textContent).toBe(`Recorded: 1 agreed, 1 declined; ${left} still proposed.`));
  });

  it('the label in words', () => {
    expect(planReviewLabel(0, 0, 5)).toBe('Record the plan (choose Agree or Decline on a step first)');
    expect(planReviewLabel(2, 0, 3)).toBe('Record the plan (2 agreed, 0 declined, 3 still proposed)');
    expect(planReviewLabel(4, 1, 0)).toBe('Record the plan (4 agreed, 1 declined)');
  });
});
