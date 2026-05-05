import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountEngagementSummaryCard } from '@/components/accounts/account-engagement-summary-card';

describe('AccountEngagementSummaryCard', () => {
  it('renders account-level momentum metrics and latest outcome context', () => {
    render(
      <AccountEngagementSummaryCard
        summary={{
          sent: 6,
          delivered: 5,
          opened: 3,
          replied: 2,
          positiveReplies: 1,
          meetingsInfluenced: 1,
          latestOutcomeLabel: 'positive',
          latestOutcomeNote: 'Buyer asked for rollout details',
        }}
      />,
    );

    expect(screen.getByText('Engagement Summary')).toBeInTheDocument();
    expect(screen.getByText('Latest outcome: positive')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('Buyer asked for rollout details')).toBeInTheDocument();
  });
});
