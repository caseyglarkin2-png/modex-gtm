import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountEngagementSummaryCard } from '@/components/accounts/account-engagement-summary-card';
import type { AccountEngagementSummary } from '@/lib/account-command-center';

const summary: AccountEngagementSummary = {
  sent: 12,
  delivered: 10,
  opened: 6,
  replied: 2,
  positiveReplies: 1,
  meetingsInfluenced: 1,
  latestOutcomeLabel: 'positive',
  latestOutcomeNote: '',
};

describe('AccountEngagementSummaryCard drill-down links (S3-T5)', () => {
  it('wraps every metric tile in a link to ?tab=engagement&metric={key} when accountSlug is provided', () => {
    render(<AccountEngagementSummaryCard summary={summary} accountSlug="boston-beer-company" />);
    const sentLink = screen.getByTestId('engagement-metric-sent');
    expect(sentLink.tagName).toBe('A');
    expect(sentLink).toHaveAttribute('href', '/accounts/boston-beer-company?tab=engagement&metric=sent');

    expect(screen.getByTestId('engagement-metric-replied')).toHaveAttribute(
      'href',
      '/accounts/boston-beer-company?tab=engagement&metric=replied',
    );
    expect(screen.getByTestId('engagement-metric-positiveReplies')).toHaveAttribute(
      'href',
      '/accounts/boston-beer-company?tab=engagement&metric=positiveReplies',
    );
  });

  it('renders plain tiles (no links) when accountSlug is omitted', () => {
    render(<AccountEngagementSummaryCard summary={summary} />);
    expect(screen.queryByTestId('engagement-metric-sent')).toBeNull();
    // Numbers still render
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
