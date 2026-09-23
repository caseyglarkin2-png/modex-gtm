/**
 * Reply list (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Pins the row fields, the gmail | hubspot source badge, the AI suggestion
 * chip (present ONLY with a suggestion, labelled "suggested, not
 * confirmed"), the toggle and inline render, and, with the real
 * <DispositionForm> rendered inline, that the suggested class is never
 * pre-selected and the prefill carries the reply's ids.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReplyList, enrollmentLabel, hypothesisLabel, sourceBadgeOf } from '@/components/gap/reply-list';
import { AI_SUGGESTION_LABEL, CONVERSATION_CLASSES, DispositionForm } from '@/components/gap/disposition-form';
import type { GapApiClient, ReplyItem } from '@/lib/gap/ui/gap-api-client';

function item(overrides: Partial<ReplyItem> = {}): ReplyItem {
  return {
    id: 'r1',
    source: { kind: 'inbound_message', id: 'gm_18f2' },
    contactEmail: 'jordan@acme.example',
    personaId: 41,
    accountName: 'Acme Foods',
    hypothesisId: 'hyp_1',
    hypothesisTitle: 'hidden_capacity',
    subject: 'Re: gate queues at Reno',
    snippet: 'Yes, trucks sit at the gate for an hour every morning. Who can I loop in?',
    receivedAt: '2026-09-22T15:30:00.000Z',
    enrollmentId: 'enr_1',
    enrollmentStatus: 'paused',
    ...overrides,
  };
}

const SUGGESTION = {
  responseClass: 'problem_confirmed',
  bids: [{ type: 'business_problem', quote: 'trucks sit at the gate for an hour', why: 'names the problem' }],
  why: 'agrees with the hypothesis',
};

describe('helpers', () => {
  it('maps source kinds to badges and labels enrollment and hypothesis', () => {
    expect(sourceBadgeOf('inbound_message')).toBe('gmail');
    expect(sourceBadgeOf('hubspot_engagement')).toBe('hubspot');
    expect(sourceBadgeOf('manual')).toBe('other');
    expect(enrollmentLabel({ enrollmentId: 'e', enrollmentStatus: 'stop_pending' })).toBe('stop pending');
    expect(enrollmentLabel({ enrollmentId: 'e', enrollmentStatus: null })).toBe('enrolled');
    expect(enrollmentLabel({ enrollmentId: null })).toBe('not enrolled');
    expect(hypothesisLabel({ hypothesisId: 'hyp_1', hypothesisTitle: null })).toBe('hypothesis hyp_1');
    expect(hypothesisLabel({ hypothesisId: 'hyp_1', hypothesisTitle: 'hidden_capacity' })).toBe('hidden capacity');
  });
});

describe('<ReplyList>', () => {
  it('renders each row with its snippet, source badge, contact, account, hypothesis, time and enrollment', () => {
    render(<ReplyList items={[item(), item({ id: 'r2', source: { kind: 'hubspot_engagement', id: 'eng_7' }, enrollmentId: null, enrollmentStatus: null })]} expandedId={null} onToggle={() => {}} renderExpanded={() => null} />);
    const rows = screen.getAllByTestId('reply-row');
    expect(rows).toHaveLength(2);
    const first = within(rows[0]);
    expect(first.getByTestId('source-badge')).toHaveTextContent('gmail');
    expect(first.getByText('Re: gate queues at Reno')).toBeInTheDocument();
    expect(first.getByTestId('reply-snippet')).toHaveTextContent('Yes, trucks sit at the gate for an hour every morning.');
    expect(first.getByTestId('reply-contact')).toHaveTextContent('jordan@acme.example');
    expect(first.getByTestId('reply-account')).toHaveTextContent('Acme Foods');
    expect(first.getByTestId('reply-hypothesis')).toHaveTextContent('hidden capacity');
    expect(first.getByText('2026-09-22 15:30Z')).toBeInTheDocument();
    expect(first.getByTestId('reply-enrollment')).toHaveTextContent('paused');
    const second = within(rows[1]);
    expect(second.getByTestId('source-badge')).toHaveTextContent('hubspot');
    expect(second.getByTestId('reply-enrollment')).toHaveTextContent('not enrolled');
  });

  it('shows the AI chip ONLY when a suggestion is present, labelled exactly', () => {
    render(<ReplyList items={[item(), item({ id: 'r2', suggestion: SUGGESTION })]} expandedId={null} onToggle={() => {}} renderExpanded={() => null} />);
    const rows = screen.getAllByTestId('reply-row');
    expect(within(rows[0]).queryByTestId('ai-suggestion')).toBeNull();
    const chip = within(rows[1]).getByTestId('ai-suggestion');
    expect(chip).toHaveTextContent(`${AI_SUGGESTION_LABEL}: problem confirmed`);
    expect(chip).toHaveTextContent('suggested, not confirmed');
  });

  it('clicking a row calls onToggle with the item, and the expanded row renders the inline content', () => {
    const onToggle = vi.fn();
    const renderExpanded = vi.fn((row: ReplyItem) => <p data-testid="inline">{row.id}</p>);
    const { rerender } = render(<ReplyList items={[item()]} expandedId={null} onToggle={onToggle} renderExpanded={renderExpanded} />);
    expect(screen.queryByTestId('reply-expanded')).toBeNull();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));

    rerender(<ReplyList items={[item()]} expandedId="r1" onToggle={onToggle} renderExpanded={renderExpanded} />);
    expect(screen.getByTestId('reply-expanded')).toBeInTheDocument();
    expect(screen.getByTestId('inline')).toHaveTextContent('r1');
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
  });

  it('with the real form inline: the reply ids are prefilled, the suggestion never pre-selects a class', () => {
    const postDisposition = vi.fn<GapApiClient['postDisposition']>();
    const client: GapApiClient = { postDisposition, listReplies: vi.fn(), getCallBrief: vi.fn(), postBid: vi.fn(), suggestReply: vi.fn() };
    const row = item({ suggestion: SUGGESTION });
    render(
      <ReplyList
        items={[row]}
        expandedId="r1"
        onToggle={() => {}}
        renderExpanded={(reply) => (
          <DispositionForm
            mode="reply"
            client={client}
            prefill={{ hypothesisId: reply.hypothesisId, personaId: reply.personaId, contactEmail: reply.contactEmail, channel: 'email', source: reply.source }}
            suggestion={reply.suggestion ?? null}
            autoFocus={false}
          />
        )}
      />,
    );
    const form = screen.getByTestId('disposition-form');
    expect(form).toHaveAttribute('data-channel', 'email');
    expect(screen.getAllByTestId('ai-suggestion')).toHaveLength(2);
    for (const cls of CONVERSATION_CLASSES) {
      expect(screen.getByTestId(`class-chip-${cls}`)).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.getByTestId('disposition-submit')).toBeDisabled();
    expect(postDisposition).not.toHaveBeenCalled();
  });

  it('renders the empty, loading and error states', () => {
    const { rerender } = render(<ReplyList items={[]} expandedId={null} onToggle={() => {}} renderExpanded={() => null} />);
    expect(screen.getByTestId('reply-list-empty')).toBeInTheDocument();
    rerender(<ReplyList items={[]} loading expandedId={null} onToggle={() => {}} renderExpanded={() => null} />);
    expect(screen.getByText('Loading replies...')).toBeInTheDocument();
    rerender(<ReplyList items={[]} error="http_500" expandedId={null} onToggle={() => {}} renderExpanded={() => null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('http_500');
  });
});
