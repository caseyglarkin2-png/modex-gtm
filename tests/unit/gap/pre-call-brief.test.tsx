/**
 * Pre-call brief (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Pins that the brief REUSES the FACT and HYPOTHESIS blocks (their heading
 * texts, captions and test ids come from fact-hypothesis-blocks.tsx), the
 * persona and account lines, the would-prove-wrong list, the last
 * dispositions, the open BIDs with the unconfirmed marker, the suggested
 * questions, and the empty states.
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BRIEF_LABELS, PreCallBrief } from '@/components/gap/pre-call-brief';
import type { CallBrief } from '@/lib/gap/ui/gap-api-client';

function brief(overrides: Partial<CallBrief> = {}): CallBrief {
  return {
    persona: { id: 41, name: 'Jordan Reyes', title: 'VP Operations', email: 'jordan@acme.example', phone: '+1 555 0100', personaKey: 'executive_ops' },
    account: { name: 'Acme Foods', hubspotCompanyId: '123', tam: 'in', tamTier: 'A', heatTier: 2 },
    hypothesis: {
      id: 'hyp_1',
      status: 'active',
      problemFamily: 'hidden_capacity',
      confidence: 62,
      observation: 'Acme opened a second DC in Reno [S:sig_1]. Job posts ask for a yard coordinator [S:sig_2].',
      signals: [
        { id: 'sig_1', title: 'Reno DC opening', evidence_url: 'https://news.example/reno' },
        { id: 'sig_2', title: 'Yard coordinator posting', evidence_text: 'Indeed posting, 2026-09-10' },
      ],
      problemHypothesis: 'My guess is the Reno ramp doubles gate queues before the yards can absorb them.',
      rootCauseHypotheses: ['Gate waiting', 'Reactive spotting'],
      impactHypotheses: ['Fewer turns', 'Overtime'],
      whyNow: 'The Reno ramp lands this quarter.',
      falsificationQuestions: ['Does Reno run its own gate with no dwell problem?'],
      whatANoMeans: 'The yards are not the constraint at Reno.',
      wouldProveWrong: ['Reno runs a separate gate with no queue.', 'Detention is already near zero.'],
    },
    lastDispositions: [
      { id: 'd1', channel: 'email', responseClass: 'request_information', buyerLanguage: 'Send me the two-site comparison.', createdAt: '2026-09-20T14:00:00.000Z' },
    ],
    openBids: [
      { id: 'b1', type: 'business_problem', rawBuyerLanguage: 'Trucks wait an hour at the gate.', humanConfirmed: true },
      { id: 'b2', type: 'impact', rawBuyerLanguage: 'We pay detention weekly.', humanConfirmed: false },
    ],
    suggestedQuestions: ['Which door do you trust least?', 'How do you find a trailer today?'],
    ...overrides,
  };
}

describe('<PreCallBrief>', () => {
  it('reuses the FACT and HYPOTHESIS blocks: their headings, captions and test ids are present', () => {
    render(<PreCallBrief brief={brief()} />);
    const fact = screen.getByTestId('fact-block');
    expect(fact).toHaveAttribute('data-block', 'fact');
    expect(within(fact).getByText('FACT')).toBeInTheDocument();
    expect(within(fact).getByText('Observed, cited')).toBeInTheDocument();
    expect(within(fact).getByText('Acme opened a second DC in Reno.')).toBeInTheDocument();
    expect(within(fact).getByRole('link', { name: '1' })).toHaveAttribute('href', 'https://news.example/reno');

    const hypothesis = screen.getByTestId('hypothesis-block');
    expect(hypothesis).toHaveAttribute('data-block', 'hypothesis');
    expect(within(hypothesis).getByText('HYPOTHESIS')).toBeInTheDocument();
    expect(within(hypothesis).getByText('Seller inference, unproven')).toBeInTheDocument();
    expect(within(hypothesis).getByText('confidence 62%')).toBeInTheDocument();
    expect(within(hypothesis).getByText('Gate waiting')).toBeInTheDocument();
    expect(within(hypothesis).getByText('Does Reno run its own gate with no dwell problem?')).toBeInTheDocument();
  });

  it('renders the persona and account lines', () => {
    render(<PreCallBrief brief={brief()} />);
    expect(screen.getByTestId('brief-persona')).toHaveTextContent('Jordan Reyes');
    expect(screen.getByTestId('brief-persona')).toHaveTextContent('VP Operations');
    expect(screen.getByText('jordan@acme.example', { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId('brief-account')).toHaveTextContent('Acme Foods');
    expect(screen.getByTestId('brief-account')).toHaveTextContent('tier A');
    expect(screen.getByTestId('brief-account')).toHaveTextContent('heat tier 2');
    expect(screen.getByText('hidden capacity')).toBeInTheDocument();
  });

  it('renders would-prove-wrong, last dispositions, open BIDs and suggested questions under their labels', () => {
    render(<PreCallBrief brief={brief()} />);
    const proveWrong = screen.getByTestId('brief-prove-wrong');
    expect(within(proveWrong).getByText(BRIEF_LABELS.wouldProveWrong)).toBeInTheDocument();
    expect(within(proveWrong).getAllByRole('listitem')).toHaveLength(2);

    const dispositions = screen.getByTestId('brief-dispositions');
    expect(within(dispositions).getByText(BRIEF_LABELS.lastDispositions)).toBeInTheDocument();
    expect(dispositions).toHaveTextContent('request information');
    expect(dispositions).toHaveTextContent('Send me the two-site comparison.');
    expect(dispositions).toHaveTextContent('email 2026-09-20 14:00Z');

    const bids = screen.getByTestId('brief-bids');
    expect(within(bids).getByText(BRIEF_LABELS.openBids)).toBeInTheDocument();
    expect(bids).toHaveTextContent('Trucks wait an hour at the gate.');
    expect(within(bids).getAllByText('unconfirmed')).toHaveLength(1);

    const questions = screen.getByTestId('brief-questions');
    expect(within(questions).getByText(BRIEF_LABELS.suggestedQuestions)).toBeInTheDocument();
    expect(within(questions).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Which door do you trust least?',
      'How do you find a trailer today?',
    ]);
  });

  it('renders the empty states when the brief has nothing yet', () => {
    render(<PreCallBrief brief={brief({ hypothesis: null, lastDispositions: [], openBids: [], suggestedQuestions: [] })} />);
    expect(screen.getByTestId('brief-no-hypothesis')).toBeInTheDocument();
    expect(screen.queryByTestId('fact-block')).toBeNull();
    expect(screen.queryByTestId('hypothesis-block')).toBeNull();
    expect(screen.getByText('Nothing named yet')).toBeInTheDocument();
    expect(screen.getByText('No prior disposition')).toBeInTheDocument();
    expect(screen.getByText('No buyer input yet')).toBeInTheDocument();
    expect(screen.getByText('No questions suggested')).toBeInTheDocument();
  });

  it('falls back to the email when the persona has no name', () => {
    render(<PreCallBrief brief={brief({ persona: { id: 7, name: null, email: 'ops@acme.example' } })} />);
    expect(screen.getByTestId('brief-persona')).toHaveTextContent('ops@acme.example');
  });
});
