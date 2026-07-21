/**
 * The writer half of the reply-precision contract (2026-07-21).
 *
 * hasIntent() promotes on exactly one reply source: VERIFIED_REPLY_INTENT_SOURCE.
 * That value is written in exactly one place — stampContactReplyIntent, called by
 * /api/cron/check-inbox only after classifyInboundReply() certifies the inbound
 * message as human, and only against the contact resolved from the message's From
 * address. These tests pin the two halves together so they cannot drift apart:
 * a rename on either side would silently switch the reply path off (or, worse,
 * back on for ungated stamps).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { update } = vi.hoisted(() => ({ update: vi.fn(async () => ({ id: '1' })) }));

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => true,
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
  getHubSpotClient: () => ({ crm: { contacts: { basicApi: { update } } } }),
}));
vi.mock('@/lib/feature-flags', () => ({ HUBSPOT_SYNC_ENABLED: true }));
vi.mock('@/lib/enrichment/external-write-guard', () => ({
  assertExternalWriteAllowed: vi.fn(),
}));

import { stampContactReplyIntent } from '@/lib/hubspot/contacts';
import { hasIntent, VERIFIED_REPLY_INTENT_SOURCE, LEGACY_REPLY_INTENT_SOURCE } from '@/lib/revops/qualification/model';

const noIntent = {
  intent_score: '', last_intent_at: '', last_intent_source: '',
  hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '',
};

beforeEach(() => { update.mockClear(); });

describe('stampContactReplyIntent', () => {
  it('stamps the VERIFIED source, not the ungated legacy one', async () => {
    await stampContactReplyIntent('12345');
    expect(update).toHaveBeenCalledTimes(1);
    const [id, payload] = update.mock.calls[0] as unknown as [string, { properties: Record<string, string> }];
    expect(id).toBe('12345');
    expect(payload.properties.last_intent_source).toBe(VERIFIED_REPLY_INTENT_SOURCE);
    expect(payload.properties.last_intent_source).not.toBe(LEGACY_REPLY_INTENT_SOURCE);
  });

  it('writes exactly ONE contact — sender attribution is per-call, never per-thread', async () => {
    await stampContactReplyIntent('12345');
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('leaves intent_score alone (web/demo owns the score)', async () => {
    await stampContactReplyIntent('12345');
    const [, payload] = update.mock.calls[0] as unknown as [string, { properties: Record<string, string> }];
    expect(payload.properties.intent_score).toBeUndefined();
  });

  it('CONTRACT: what it writes is what hasIntent promotes on', async () => {
    await stampContactReplyIntent('12345');
    const [, payload] = update.mock.calls[0] as unknown as [string, { properties: Record<string, string> }];
    expect(hasIntent({
      ...noIntent,
      last_intent_source: payload.properties.last_intent_source,
      last_intent_at: payload.properties.last_intent_at,
    })).toBe(true);
  });
});
