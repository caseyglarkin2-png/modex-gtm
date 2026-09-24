/**
 * Decision card UI (GAP Prospecting OS, Sprint 2, S2-T11).
 *
 * Pins the six explain labels and their texts, the action chip, the blocked
 * badge, the three target chip labels, the "No hypothesis" case, the acted
 * state, the onAct wiring, plain-text rendering of explain fields, and the
 * private-intent leak guard (the fixture is clean and the card never reads
 * `intentScore` off a wider object).
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DecisionCard, EXPLAIN_LABELS, TARGET_LABEL, type QueueItem } from '@/components/gap/decision-card';
import { FORBIDDEN_EXPLAIN_PATTERNS } from '@/lib/gap/routing/explain';

const EXPLAIN = {
  whyAccount: 'Acme Foods is in TAM (tier A, heat tier 2) and opened a second DC in Reno.',
  whyPerson: 'Jordan Reyes is the VP of Operations, the role that owns yards.',
  whyProblem: 'Hidden capacity: dock hours lost to gate congestion across its yards.',
  whyNow: 'The Reno ramp doubles inbound volume this quarter.',
  whyAction: 'A fresh trigger and a valid phone number put this in call now.',
  evidenceIds: ['ev_1', 'ev_2'],
  signalIds: ['sig_1'],
  wouldProveWrong: 'Reno runs its own gate with no dwell problem.',
};

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'dec_1',
    action: 'call_now',
    lane: 'work_queue',
    ruleId: 'R7',
    priority: 92,
    blocked: false,
    target: null,
    explain: { ...EXPLAIN },
    account: { name: 'Acme Foods', hubspotCompanyId: '123', tam: 'in', tamTier: 'A', heatTier: 2 },
    persona: { id: 41, personaKey: 'vp_operations', displayName: 'Jordan Reyes', email: 'jordan@acme.example', hubspotContactId: '900' },
    hypothesis: { id: 'hyp_1', status: 'approved', family: 'hidden_capacity', confidence: 62 },
    humanAction: null,
    humanActionAt: null,
    createdAt: '2026-09-23T12:00:00.000Z',
    ...overrides,
  };
}

describe('<DecisionCard>', () => {
  it('renders all six explain labels with their texts from the fixture', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    const explain = screen.getByTestId('explain');
    expect(EXPLAIN_LABELS.map((entry) => entry.label)).toEqual([
      'Why this account',
      'Why this person',
      'Why this problem',
      'Why now',
      'Why this action',
      'Would prove us wrong',
    ]);
    for (const { key, label } of EXPLAIN_LABELS) {
      const term = within(explain).getByText(label, { selector: 'dt' });
      const definition = term.nextElementSibling;
      expect(definition?.tagName).toBe('DD');
      expect(definition).toHaveTextContent(EXPLAIN[key] as string);
    }
  });

  it('renders the action chip, rule id, priority, lane and counts', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.getByTestId('action-chip')).toHaveTextContent('call now');
    expect(screen.getByTestId('decision-card')).toHaveAttribute('data-action', 'call_now');
    expect(screen.getByText('R7')).toBeInTheDocument();
    expect(screen.getByText('priority 92')).toBeInTheDocument();
    expect(screen.getByText('work queue')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-counts')).toHaveTextContent('2 evidence, 1 signals');
  });

  it('renders the account, persona and hypothesis lines', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.getByTestId('account-line')).toHaveTextContent('Acme Foods');
    expect(screen.getByTestId('account-line')).toHaveTextContent('TAM in, tier A, heat tier 2');
    expect(screen.getByTestId('persona-line')).toHaveTextContent('Jordan Reyes');
    expect(screen.getByTestId('persona-line')).toHaveTextContent('vp operations');
    const hypothesis = screen.getByTestId('hypothesis-line');
    expect(hypothesis).toHaveTextContent('hidden capacity');
    expect(hypothesis).toHaveTextContent('approved');
    expect(hypothesis).toHaveTextContent('confidence 62%');
  });

  it('falls back to the email when the persona has no display name', () => {
    render(<DecisionCard item={item({ persona: { id: 41, personaKey: 'vp_operations', displayName: null, email: 'jordan@acme.example', hubspotContactId: null } })} onAct={() => {}} />);
    expect(screen.getByTestId('persona-line')).toHaveTextContent('jordan@acme.example');
  });

  it('shows the blocked badge only when blocked', () => {
    const { rerender } = render(<DecisionCard item={item({ blocked: true, lane: 'blocked', action: 'do_not_contact' })} onAct={() => {}} />);
    expect(screen.getByText('blocked', { selector: '[class*="destructive"]' })).toBeInTheDocument();
    rerender(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.queryByText('blocked', { selector: '[class*="destructive"]' })).not.toBeInTheDocument();
  });

  it.each([
    ['hubspot_native', 'Rig-built sequence exists'],
    ['build_required', 'Sequence not built'],
    ['modex_queue', 'Secondary lane'],
  ] as const)('renders the target chip for %s as "%s"', (target, label) => {
    render(<DecisionCard item={item({ action: 'enroll_gap_sequence', target })} onAct={() => {}} />);
    expect(screen.getByTestId('target-chip')).toHaveTextContent(label);
    expect(TARGET_LABEL[target]).toBe(label);
  });

  it('renders no target chip when target is null', () => {
    render(<DecisionCard item={item({ target: null })} onAct={() => {}} />);
    expect(screen.queryByTestId('target-chip')).not.toBeInTheDocument();
  });

  it('renders "No hypothesis" when the hypothesis is null', () => {
    render(<DecisionCard item={item({ hypothesis: null })} onAct={() => {}} />);
    expect(screen.getByTestId('hypothesis-line')).toHaveTextContent('No hypothesis');
    expect(screen.queryByText('confidence', { exact: false })).not.toBeInTheDocument();
  });

  it('acted state hides the buttons and shows "Acted: call_now" with the time', () => {
    render(<DecisionCard item={item({ humanAction: 'call_now', humanActionAt: '2026-09-23T14:05:00.000Z' })} onAct={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTestId('acted')).toHaveTextContent('Acted: call_now at 2026-09-23 14:05Z');
  });

  it('clicking "I did this" calls onAct with the decision action, "I did something else" with other', () => {
    const onAct = vi.fn();
    render(<DecisionCard item={item()} onAct={onAct} />);
    fireEvent.click(screen.getByRole('button', { name: 'I did this' }));
    expect(onAct).toHaveBeenCalledWith('call_now');
    fireEvent.click(screen.getByRole('button', { name: 'I did something else' }));
    expect(onAct).toHaveBeenLastCalledWith('other');
    expect(onAct).toHaveBeenCalledTimes(2);
  });

  it('disables both buttons while acting and shows the act error inline', () => {
    render(<DecisionCard item={item()} onAct={() => {}} acting actError="already acted" />);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'I did something else' })).toBeDisabled();
    expect(screen.getByTestId('act-error')).toHaveTextContent('already acted');
  });

  it('renders explain text literally: <b>x</b> in whyNow produces no bold element', () => {
    const { container } = render(
      <DecisionCard item={item({ explain: { ...EXPLAIN, whyNow: 'Trigger <b>x</b> fired <script>alert(1)</script>' } })} onAct={() => {}} />,
    );
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('Trigger <b>x</b> fired <script>alert(1)</script>')).toBeInTheDocument();
  });

  it('shows "Not stated" for a blank explain field instead of an empty cell', () => {
    render(<DecisionCard item={item({ explain: { ...EXPLAIN, wouldProveWrong: '   ' } })} onAct={() => {}} />);
    const term = screen.getByText('Would prove us wrong', { selector: 'dt' });
    expect(term.nextElementSibling).toHaveTextContent('Not stated');
  });
});

describe('<DecisionCard> leak guard', () => {
  it('the fixture explain carries no forbidden private-intent phrase', () => {
    const texts = [EXPLAIN.whyAccount, EXPLAIN.whyPerson, EXPLAIN.whyProblem, EXPLAIN.whyNow, EXPLAIN.whyAction, EXPLAIN.wouldProveWrong];
    for (const text of texts) {
      for (const { label, pattern } of FORBIDDEN_EXPLAIN_PATTERNS) {
        expect(pattern.test(text), `fixture text "${text}" matches forbidden pattern ${label}`).toBe(false);
      }
    }
  });

  it('never renders intent_score or its value even when the account object carries intentScore', () => {
    const wider = {
      ...item(),
      account: { name: 'Acme Foods', hubspotCompanyId: '123', tam: 'in', tamTier: 'A', heatTier: 2, intentScore: 9137, lastIntentAt: '2026-09-22T00:00:00.000Z', intent_score: 9137 },
      persona: { id: 41, personaKey: 'vp_operations', displayName: 'Jordan Reyes', email: null, hubspotContactId: null, lastIntentSource: 'visited /demo/acme' },
    } as unknown as QueueItem;
    const { container } = render(<DecisionCard item={wider} onAct={() => {}} />);
    const text = container.textContent ?? '';
    expect(text).not.toContain('intent_score');
    expect(text).not.toContain('intentScore');
    expect(text).not.toContain('9137');
    expect(text).not.toContain('/demo/');
    expect(text).not.toContain('2026-09-22');
    for (const { label, pattern } of FORBIDDEN_EXPLAIN_PATTERNS) {
      expect(pattern.test(text), `rendered card matches forbidden pattern ${label}`).toBe(false);
    }
  });
});
