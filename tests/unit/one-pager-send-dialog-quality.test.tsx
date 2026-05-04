import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OnePageSendDialog } from '@/components/email/one-pager-send-dialog';

describe('OnePageSendDialog quality guard', () => {
  it('blocks send below threshold until override acknowledgement', () => {
    render(
      <OnePageSendDialog
        accountName="Acme Foods"
        generatedContentId={11}
        generatedContent={{
          account_name: 'Acme Foods',
          content: 'free!!! click here now',
          version: 1,
          provider_used: 'openai',
          quality: {
            score: 45,
            scores: {
              clarity: 40,
              personalization: 30,
              cta_strength: 50,
              compliance_risk: 65,
              deliverability_risk: 70,
            },
            flags: ['deliverability_risk'],
            fixes: ['Reduce spam-like phrasing and limit excessive links/urgent language.'],
            blockedByThreshold: true,
          },
          campaign_type: 'trade_show',
          checklist: {
            complete: true,
            requiredComplete: 5,
            requiredTotal: 5,
            missingRequired: [],
          },
          checklist_completed_item_ids: [
            'clear_value_prop',
            'account_specific_proof',
            'cta_specific',
            'compliance_checked',
            'deliverability_checked',
          ],
        }}
        recipients={[{
          id: 1,
          name: 'Casey',
          email: 'casey@example.com',
          readiness: {
            score: 90,
            tier: 'high',
            stale: false,
            freshness_days: 4,
            reasons: [],
          },
        }]}
        open
        onOpenChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Select all 1 recipients/i));
    const send = screen.getByRole('button', { name: /Send to 1 Recipient/i });
    expect(send).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /I acknowledge quality risk and approve this send/i }));
    expect(send).toBeEnabled();
  });
});
