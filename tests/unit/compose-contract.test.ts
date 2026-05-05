import { describe, expect, it } from 'vitest';
import { buildAccountComposePayload } from '@/lib/email/compose-contract';

const recipients = [
  {
    id: 7,
    name: 'Taylor Lane',
    email: 'taylor@example.com',
    accountName: 'Boston Beer Company',
    readiness: {
      score: 91,
      tier: 'high' as const,
      stale: false,
    },
  },
];

describe('compose contract', () => {
  it('builds a one-pager account-page send payload with generated content linkage', () => {
    const payload = buildAccountComposePayload({
      variant: 'one_pager_asset',
      accountName: 'Boston Beer Company',
      subject: 'yard network scorecard for Boston Beer Company',
      openingLine: 'Wanted to share the operator version.',
      ctaLine: 'If useful, I can send the short version.',
      asset: {
        id: 42,
        generatedContentId: 42,
        version: 3,
        content: '{"headline":"Boston Beer Company one-pager","subheadline":"Dock pressure","painPoints":["Queue variability"],"solutionSteps":[{"step":1,"title":"Gate Check-in","description":"Standard intake"}],"outcomes":["Reduce dwell volatility"],"proofStats":[{"value":"24","label":"Facilities Live"},{"value":">200","label":"Contracted Network"},{"value":"NEUTRAL","label":"Headcount Impact"},{"value":"48→24","label":"Avg. Drop & Hook (min)"},{"value":"$1M+","label":"Per-site Profit Lift"}],"customerQuote":"Illustrative quote.","bestFit":"Strong fit.","publicContext":"","suggestedNextStep":"If useful, I can send the short version."}',
        contentType: 'one_pager',
        providerUsed: 'ai_gateway',
      },
      recipients,
      selectedRecipientIds: [7],
      recipientSetKey: 'operators',
    });

    expect(payload.generatedContentId).toBe(42);
    expect(payload.recipients).toEqual([
      {
        to: 'taylor@example.com',
        personaId: 7,
        personaName: 'Taylor Lane',
        accountName: 'Boston Beer Company',
        readinessScore: 91,
        readinessTier: 'high',
        stale: false,
      },
    ]);
    expect(payload.workflowMetadata).toMatchObject({
      surface: 'account_page',
      shell: 'account_outreach',
      variant: 'one_pager_asset',
      recipientSetKey: 'operators',
      selectedRecipientIds: [7],
      assetId: 42,
      assetVersion: 3,
    });
    expect(payload.bodyHtml).toContain('Wanted to share the operator version.');
    expect(payload.bodyHtml).toContain('If useful, I can send the short version.');
  });

  it('builds an email-draft payload with plain-text send body and preview html', () => {
    const payload = buildAccountComposePayload({
      variant: 'email_draft',
      accountName: 'Boston Beer Company',
      subject: 'built this with Boston Beer Company in mind',
      openingLine: 'Wanted to send a quick note.',
      body: 'Dock pressure and manual coordination look like the real issue.',
      ctaLine: 'If useful, I can send the short operator version.',
      recipients,
      selectedRecipientIds: [7],
      recipientSetKey: 'manual',
    });

    expect(payload.generatedContentId).toBeUndefined();
    expect(payload.bodyHtml).toBe([
      'Wanted to send a quick note.',
      'Dock pressure and manual coordination look like the real issue.',
      'If useful, I can send the short operator version.',
    ].join('\n\n'));
    expect(payload.previewHtml).toContain('Wanted to send a quick note.');
    expect(payload.workflowMetadata).toMatchObject({
      surface: 'account_page',
      shell: 'account_outreach',
      variant: 'email_draft',
      recipientSetKey: 'manual',
      selectedRecipientIds: [7],
    });
  });
});
