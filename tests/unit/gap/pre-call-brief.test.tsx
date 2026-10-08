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
    persona: {
      id: 41,
      personaKey: 'executive_ops',
      name: 'Jordan Reyes',
      title: 'VP Operations',
      email: 'jordan@acme.example',
      phone: '+1 555 0100',
      role: 'economic_buyer',
      doNotContact: false,
    },
    account: { name: 'Acme Foods', hubspotCompanyId: '123', tier: 'A', vertical: 'food_and_beverage' },
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
      contraryEvidence: 'Detention is already near zero.',
      predictedBuyerLanguage: 'Trucks stack up at the gate every morning.',
      wouldProveWrong: ['Reno runs a separate gate with no queue.', 'Detention is already near zero.'],
    },
    lastDispositions: [
      { id: 'd1', channel: 'email', responseClass: 'request_information', buyerLanguage: 'Send me the two-site comparison.', humanConfirmed: true, createdAt: '2026-09-20T14:00:00.000Z' },
      { id: 'd0', channel: 'call', responseClass: 'voicemail', buyerLanguage: null, humanConfirmed: false, createdAt: '2026-09-19T14:00:00.000Z' },
    ],
    // Open BIDs are unconfirmed and unsuperseded by definition (brief.ts), so every row here is unconfirmed.
    openBids: [
      { id: 'b1', type: 'business_problem', rawBuyerLanguage: 'Trucks wait an hour at the gate.', humanConfirmed: false, capturedAt: '2026-09-20T14:00:00.000Z' },
      { id: 'b2', type: 'impact', rawBuyerLanguage: 'We pay detention weekly.', humanConfirmed: false, capturedAt: null },
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
    expect(within(fact).getByRole('link', { name: 'Source 1: Reno DC opening (news.example)' }) /* R63-B N12: a citation names its source */).toHaveAttribute('href', 'https://news.example/reno');

    const hypothesis = screen.getByTestId('hypothesis-block');
    expect(hypothesis).toHaveAttribute('data-block', 'hypothesis');
    expect(within(hypothesis).getByText('WHAT WE THINK IS HAPPENING')).toBeInTheDocument();
    expect(within(hypothesis).getByText('Seller inference, unproven')).toBeInTheDocument();
    // Red team T7: no auto confidence number is shown.
    expect(within(hypothesis).queryByText(/confidence \d+%/)).toBeNull();
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
    expect(screen.getByTestId('brief-account')).toHaveTextContent('food and beverage');
    expect(screen.getByText('economic buyer')).toBeInTheDocument();
    expect(screen.queryByTestId('brief-do-not-contact')).toBeNull();
    expect(screen.getByText('hidden capacity')).toBeInTheDocument();
  });

  it('warns when the persona is do-not-contact', () => {
    render(<PreCallBrief brief={brief({ persona: { ...brief().persona, doNotContact: true } })} />);
    expect(screen.getByTestId('brief-do-not-contact')).toHaveTextContent('do not contact');
  });

  it('renders would-prove-wrong, last dispositions, open BIDs and suggested questions under their labels', () => {
    render(<PreCallBrief brief={brief()} />);
    // UX-06 re-check: "Would prove wrong" is said ONCE, inside the HYPOTHESIS block, with the thesis's own questions
    // and the brief's statements together; the standalone block shows only when there is no hypothesis block.
    expect(screen.queryByTestId('brief-prove-wrong')).toBeNull();
    const block = screen.getByTestId('hypothesis-block');
    expect(block.textContent?.match(/Would prove wrong/g)).toHaveLength(1);
    expect(block).toHaveTextContent('Does Reno run its own gate with no dwell problem?');
    expect(block).toHaveTextContent('Reno runs a separate gate with no queue.');
    expect(block).toHaveTextContent('Detention is already near zero.');

    const dispositions = screen.getByTestId('brief-dispositions');
    expect(within(dispositions).getByText(BRIEF_LABELS.lastDispositions)).toBeInTheDocument();
    expect(dispositions).toHaveTextContent('request information');
    expect(dispositions).toHaveTextContent('Send me the two-site comparison.');
    expect(dispositions).toHaveTextContent('email 2026-09-20 14:00Z');
    expect(dispositions).toHaveTextContent('voicemail');
    expect(within(dispositions).getAllByText('unconfirmed')).toHaveLength(1);

    const bids = screen.getByTestId('brief-bids');
    expect(within(bids).getByText(BRIEF_LABELS.openBids)).toBeInTheDocument();
    expect(bids).toHaveTextContent('Trucks wait an hour at the gate.');
    expect(within(bids).getAllByText('unconfirmed')).toHaveLength(2);

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
    render(<PreCallBrief brief={brief({ persona: { id: 7, personaKey: null, name: null, title: null, email: 'ops@acme.example', phone: null, role: null, doNotContact: false } })} />);
    expect(screen.getByTestId('brief-persona')).toHaveTextContent('ops@acme.example');
  });
});

describe('ops closeout 17: quantify only after the buyer acknowledges the problem', () => {
  it('shows the quantifying questions in their own section, labelled for after acknowledgement', () => {
    render(<PreCallBrief brief={brief({ afterAcknowledgementQuestions: ['How many trailers wait at the gate?'] })} />);
    const section = screen.getByTestId('brief-after-acknowledgement');
    expect(within(section).getByText(BRIEF_LABELS.afterAcknowledgement)).toBeInTheDocument();
    expect(within(section).getByText('How many trailers wait at the gate?')).toBeInTheDocument();
    expect(within(screen.getByTestId('brief-questions')).queryByText('How many trailers wait at the gate?')).toBeNull();
  });

  it('no section when there is nothing to quantify', () => {
    render(<PreCallBrief brief={brief({ afterAcknowledgementQuestions: [] })} />);
    expect(screen.queryByTestId('brief-after-acknowledgement')).toBeNull();
  });
});

describe('X16c: the timeline section', () => {
  it('renders the summary line and the entries, oldest last, the unconfirmed ones marked; without a timeline no section', () => {
    render(
      <PreCallBrief
        brief={brief({
          timeline: {
            unansweredCalls: 2,
            callsLeft: 1,
            entries: [
              { kind: 'attempt', at: '2026-10-08T15:00:00.000Z', line: 'Dial link opened (self-reported; no outcome recorded)', confirmed: true },
              { kind: 'disposition', at: '2026-10-06T15:00:00.000Z', line: 'Call: voicemail', confirmed: true },
              { kind: 'disposition', at: '2026-10-01T15:00:00.000Z', line: 'Call: no answer', confirmed: false },
            ],
          },
        })}
      />,
    );
    const section = screen.getByTestId('brief-timeline');
    expect(within(section).getByText(BRIEF_LABELS.timeline)).toBeTruthy();
    expect(within(section).getByText('2 unanswered calls since their last answer; 1 more before the hold.')).toBeTruthy();
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Dial link opened');
    expect(items[2].textContent).toContain('unconfirmed');
    expect(items[1].textContent).not.toContain('unconfirmed');
  });

  it('no section without a timeline; the held wording at the cap', () => {
    render(<PreCallBrief brief={brief()} />);
    expect(screen.queryByTestId('brief-timeline')).toBeNull();
    render(<PreCallBrief brief={brief({ timeline: { unansweredCalls: 3, callsLeft: 0, entries: [] } })} />);
    expect(screen.getByText('3 unanswered calls since their last answer; the person is held, no cold call.')).toBeTruthy();
  });
});

describe('X16d: the prepared objection talking points', () => {
  it('renders each objection with the talking point (fact markers stripped) and the question; nothing without any', () => {
    render(<PreCallBrief brief={brief({ objectionAnswers: [{ taskId: 'at_1', dispositionId: 'd9', objection: 'We already run a YMS.', answer: 'Fair, most sites run one. The Tulsa expansion adds doors [[SRC:sig-1]], so my guess is the gate still works from a clipboard.', question: 'How does the gate find a trailer the YMS has wrong?', factsUsed: ['sig-1'], preparedAt: '2026-10-08T16:00:00.000Z' }] })} />);
    const section = screen.getByTestId('brief-objections');
    expect(within(section).getByText(BRIEF_LABELS.objectionAnswers)).toBeTruthy();
    expect(within(section).getByText('We already run a YMS.')).toBeTruthy();
    expect(section.textContent).toContain('adds doors, so my guess');
    expect(section.textContent).not.toContain('[[SRC:');
    expect(within(section).getByText('How does the gate find a trailer the YMS has wrong?')).toBeTruthy();
  });

  it('no section without a talking point', () => {
    render(<PreCallBrief brief={brief()} />);
    expect(screen.queryByTestId('brief-objections')).toBeNull();
  });
});
