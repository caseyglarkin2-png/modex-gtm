import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OnePageSendDialog } from '@/components/email/one-pager-send-dialog';
import { Button } from '@/components/ui/button';

describe('OnePageSendDialog quality guard', () => {
  it('shows low-quality warning but still allows user-controlled send', async () => {
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

    const send = await screen.findByRole('button', { name: /Send to 1 Recipient/i });
    expect(send).toBeEnabled();
    expect(screen.getByText(/below the advisory threshold/i)).toBeVisible();
    expect(screen.queryByText(/I acknowledge the warning/i)).not.toBeInTheDocument();
  });

  it('preselects all recipients on open', async () => {
    render(
      <OnePageSendDialog
        accountName="Acme Foods"
        generatedContentId={12}
        generatedContent={{
          account_name: 'Acme Foods',
          content: 'Acme Foods overview summary next step implementation outcome. Your team can reply this week to book a 15-minute review next week.',
          version: 1,
          provider_used: 'openai',
          quality: {
            score: 82,
            scores: {
              clarity: 80,
              personalization: 75,
              cta_strength: 85,
              compliance_risk: 10,
              deliverability_risk: 10,
            },
            flags: [],
            fixes: [],
            blockedByThreshold: false,
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Send to 1 Recipient/i })).toBeEnabled();
    });
    expect(screen.getByText(/All recipients with email are preselected/i)).toBeVisible();
  });

  it('does not disable the trigger for canonical warnings', async () => {
    render(
      <OnePageSendDialog
        accountName="Acme Foods"
        generatedContentId={13}
        generatedContent={{
          account_name: 'Acme Foods',
          content: 'Acme Foods overview summary next step implementation outcome. Your team can reply this week to book a 15-minute review next week.',
          version: 1,
          provider_used: 'openai',
          quality: {
            score: 82,
            scores: {
              clarity: 80,
              personalization: 75,
              cta_strength: 85,
              compliance_risk: 10,
              deliverability_risk: 10,
            },
            flags: [],
            fixes: [],
            blockedByThreshold: false,
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
          name: 'Blocked Casey',
          email: 'casey@example.com',
          canonicalStatus: 'conflict',
          readiness: {
            score: 90,
            tier: 'high',
            stale: false,
            freshness_days: 4,
            reasons: [],
          },
        }]}
        trigger={<Button>Preview & Send</Button>}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Preview & Send/i });
    expect(trigger).toBeEnabled();
  });
});
