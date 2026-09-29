/**
 * Release E: the six-line brief reads the CANONICAL account intelligence: one ACCOUNT line (the motion), a
 * caution when the account says "not now" or is in a deal, a link to the account page, and LEARN falls back to
 * the account's discovery plan when the thesis has no question. It informs; the gates still run at the click.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { buildBrief } from '@/lib/gap/execution/six-line-brief';
import { SixLineBriefView } from '@/components/gap/six-line-brief';

const hyp = { account_name: 'General Mills', problem_hypothesis: 'Arrivals pile up.', falsification_questions: [], what_a_no_means: null, signals: [] };
const intel = (type: string, why: string, line: string) => ({ accountName: 'General Mills', motion: { type, who: null, why }, motionLine: line, firstDiscoveryQuestion: 'Did the change add trailer volume at the sites that remain?' });

describe('six-line brief reads the account intelligence', () => {
  it('shows the motion and links the account page; LEARN falls back to the account discovery plan', () => {
    const b = buildBrief({ hypothesis: hyp, firstName: 'Dana', angle: null, suggestedAngle: null, history: null, account: intel('FACT_LED', 'x', 'Fact-led: Dana Ops, on the verified fact.') });
    expect(b.account).toEqual({ motion: 'Fact-led: Dana Ops, on the verified fact.', caution: null, href: '/gap/accounts/general-mills' });
    expect(b.learn).toBe('Did the change add trailer volume at the sites that remain?');
    render(<SixLineBriefView brief={b} personaId={null} accountName="General Mills" />);
    expect(screen.getByTestId('brief-account').textContent).toMatch(/Fact-led: Dana Ops/);
    expect(screen.getByRole('link', { name: 'Everything GAP knows about this account' }).getAttribute('href')).toBe('/gap/accounts/general-mills');
  });

  it('a "not now" account carries its caution into the brief', () => {
    const b = buildBrief({ hypothesis: hyp, firstName: 'Dana', angle: null, suggestedAngle: null, history: null, account: intel('NO_GOOD_MOTION', 'Do not contact yet: the buyer contradicted the current story.', 'No good motion yet: the buyer contradicted the current story.') });
    expect(b.account?.caution).toBe('Do not contact yet: the buyer contradicted the current story.');
  });

  it('no account intelligence is simply no line (never a guess)', () => {
    expect(buildBrief({ hypothesis: hyp, firstName: 'Dana', angle: null, suggestedAngle: null, history: null }).account).toBeNull();
  });
});
