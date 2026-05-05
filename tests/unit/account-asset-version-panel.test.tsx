import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountAssetVersionPanel } from '@/components/accounts/account-asset-version-panel';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION } from '@/lib/revops/cold-outbound-policy';

vi.mock('@/components/accounts/account-generated-asset-actions', () => ({
  AccountGeneratedAssetActions: ({
    asset,
  }: {
    asset: { id: number; version: number };
  }) => <div data-testid="selected-asset-actions">selected-{asset.id}-v{asset.version}</div>,
}));

function makeAsset(id: number, version: number, overrides: Partial<{
  content_type: string;
  freshnessStatus: string;
  signalCount: number;
  contactCount: number;
}> = {}) {
  return {
    id,
    version,
    content: '{"headline":"Test"}',
    created_at: new Date(`2026-05-0${Math.min(version, 9)}T00:00:00.000Z`),
    content_type: overrides.content_type ?? 'one_pager',
    provider_used: 'ai_gateway',
    version_metadata: {
      prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
      cta_mode: 'scorecard_reply',
      generation_input_contract: {
        signals: Array.from({ length: overrides.signalCount ?? 2 }, (_, index) => ({ title: `Signal ${index}` })),
        recommended_contacts: Array.from({ length: overrides.contactCount ?? 1 }, (_, index) => ({ name: `Contact ${index}` })),
        committee_gaps: [],
        freshness: { status: overrides.freshnessStatus ?? 'fresh', stale: overrides.freshnessStatus === 'stale' },
      },
      agentContext: { status: 'ok' },
      provenance: {
        scoped_account_names: ['Boston Beer Company', 'The Boston Beer Company'],
      },
    },
    checklist: {
      complete: true,
      requiredComplete: 3,
      requiredTotal: 3,
      missingRequired: [],
    },
    checklist_completed_item_ids: ['tone', 'proof'],
  };
}

describe('AccountAssetVersionPanel', () => {
  it('defaults to the recommended asset and switches versions inline', () => {
    render(
      <AccountAssetVersionPanel
        accountName="Boston Beer Company"
        recipients={[{ id: 1, name: 'Taylor Lane', email: 'taylor@example.com' }]}
        assets={[
          makeAsset(1, 1),
          makeAsset(2, 2, { freshnessStatus: 'stale' }),
          makeAsset(3, 3, { content_type: 'meeting_prep' }),
        ]}
      />,
    );

    expect(screen.getByText('one pager · v1')).toBeInTheDocument();
    expect(screen.getByTestId('selected-asset-actions')).toHaveTextContent('selected-1-v1');
    expect(screen.getByText('fresh')).toBeInTheDocument();
    expect(screen.getByText('Scope: Boston Beer Company, The Boston Beer Company')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Latest' }));
    expect(screen.getByText('meeting prep · v3')).toBeInTheDocument();
    expect(screen.getByTestId('selected-asset-actions')).toHaveTextContent('selected-3-v3');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });
    expect(screen.getByText('one pager · v2')).toBeInTheDocument();
    expect(screen.getByTestId('selected-asset-actions')).toHaveTextContent('selected-2-v2');
  });

  it('shows an empty state when no assets exist', () => {
    render(
      <AccountAssetVersionPanel
        accountName="Boston Beer Company"
        recipients={[]}
        assets={[]}
      />,
    );

    expect(screen.getByText(/No generated asset versions yet/i)).toBeInTheDocument();
  });
});
