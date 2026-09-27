/**
 * Red team T8: THE CALL LOOP. After Casey uses Call, the existing disposition
 * workflow opens INLINE on the card. A real conversation completes the card
 * ("I called"); no answer, voicemail or a gatekeeper keeps it open to retry
 * and is never recorded as a human action (routing holds the person after
 * MAX_UNANSWERED_CALLS; see routing tests).
 *
 * CallMode (the brief + DispositionForm, which post through the GAP API) is
 * stubbed here so the card's handling of each outcome is what is tested.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/app/gap/call/[personaId]/call-mode', () => ({
  CallMode: ({ personaId, onRecorded, hypothesis }: { personaId: string; onRecorded?: (c: string) => void; hypothesis?: { id: string; problemFamily: string } }) => (
    <div data-testid="call-mode-stub" data-persona={personaId} data-hypothesis={hypothesis?.id ?? ''} data-family={hypothesis?.problemFamily ?? ''}>
      <button type="button" onClick={() => onRecorded?.('no_answer')}>record no answer</button>
      <button type="button" onClick={() => onRecorded?.('voicemail')}>record voicemail</button>
      <button type="button" onClick={() => onRecorded?.('problem_confirmed')}>record conversation</button>
    </div>
  ),
}));

import { DecisionCard, type QueueItem } from '@/components/gap/decision-card';

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'dec_1',
    action: 'call_now',
    lane: 'work_queue',
    ruleId: 'hot_call',
    priority: 92,
    blocked: false,
    target: null,
    explain: null,
    account: { name: 'Acme Foods', hubspotCompanyId: '123', tam: 'in', tamTier: 'A', heatTier: 2 },
    persona: { id: 41, personaKey: 'vp_operations', displayName: 'Jordan Reyes', email: 'jordan@acme.example', hubspotContactId: '900', phone: '(555) 123-4567', title: null, linkedinUrl: null },
    hypothesis: { id: 'hyp_1', status: 'active', family: 'hidden_capacity', confidence: 0 },
    humanAction: null,
    humanActionAt: null,
    createdAt: '2026-09-23T12:00:00.000Z',
    ...overrides,
  } as unknown as QueueItem;
}

describe('T8 inline call outcome', () => {
  it('clicking Call opens the disposition workflow inline on the card, for that person', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.queryByTestId('inline-call-outcome')).toBeNull();
    fireEvent.click(within(screen.getByTestId('contact-buttons')).getByRole('link', { name: /^Call$/ }));
    expect(screen.getByTestId('inline-call-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('call-mode-stub')).toHaveAttribute('data-persona', '41');
  });

  it('a call dialed elsewhere can still be recorded: Record call outcome opens the same workflow', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    fireEvent.click(screen.getByTestId('record-call-outcome'));
    expect(screen.getByTestId('inline-call-outcome')).toBeInTheDocument();
  });

  it.each(['no answer', 'voicemail'])('%s keeps the card open to retry and records NO human action', (label) => {
    const onAct = vi.fn();
    render(<DecisionCard item={item()} onAct={onAct} />);
    fireEvent.click(screen.getByTestId('record-call-outcome'));
    fireEvent.click(screen.getByText(`record ${label}`));
    expect(onAct).not.toHaveBeenCalled();
    expect(screen.getByTestId('call-retry-note')).toHaveTextContent('stays open to call again');
    expect(screen.getByTestId('inline-call-outcome')).toBeInTheDocument();
  });

  it('a real conversation completes the card as "I called"', () => {
    const onAct = vi.fn();
    render(<DecisionCard item={item()} onAct={onAct} />);
    fireEvent.click(screen.getByTestId('record-call-outcome'));
    fireEvent.click(screen.getByText('record conversation'));
    expect(onAct).toHaveBeenCalledWith('called');
  });

  it('no inline call recording on a blocked card, a card with no hypothesis, or one already acted on', () => {
    for (const over of [{ blocked: true }, { hypothesis: null }, { humanAction: 'called' }] as Partial<QueueItem>[]) {
      const { unmount } = render(<DecisionCard item={item(over)} onAct={() => {}} />);
      expect(screen.queryByTestId('record-call-outcome')).toBeNull();
      unmount();
    }
  });

  it.each(['evidence_thin', 'no_hypothesis', 'hyp_stale'])('Release C review SF2: no inline call recording on a research card (%s)', (ruleId) => {
    render(<DecisionCard item={item({ ruleId, action: 'research_required' } as Partial<QueueItem>)} onAct={() => {}} />);
    expect(screen.queryByTestId('record-call-outcome')).toBeNull();
    expect(screen.queryByTestId('inline-call-outcome')).toBeNull();
  });

  it('Release C review SF2: the call records against the CARD hypothesis, not whichever one the brief picks', () => {
    render(<DecisionCard item={item({ hypothesis: { id: 'hyp_card', status: 'active', family: 'new_sites_acquisitions', confidence: 0 } } as Partial<QueueItem>)} onAct={() => {}} />);
    fireEvent.click(screen.getByTestId('record-call-outcome'));
    const stub = screen.getByTestId('call-mode-stub');
    expect(stub).toHaveAttribute('data-hypothesis', 'hyp_card');
    expect(stub).toHaveAttribute('data-family', 'new_sites_acquisitions');
  });
});
