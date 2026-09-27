/**
 * Ops closeout (item 10B): the HubSpot v3 webhook signature, pinned to
 * HubSpot's own published example (developers.hubspot.com, "Validating
 * requests", v3 Java example): method + FULL request URI (scheme and host) +
 * raw body + timestamp, HMAC-SHA256 with the app secret, base64. Our verifier
 * signed only the pathname, so every genuine delivery answered 403 and
 * webhook_events stayed at 0 in production.
 */
import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hubspotSignatureUri, validHubSpotSignatureV3 } from '@/lib/hubspot/webhook-signature';

const OFFICIAL = {
  secret: 'cfc68c0b-4b4e-4ef8-b764-95350e4ea479',
  method: 'POST',
  uri: 'https://webhook.site/335453f5-94b3-49d9-b684-a55354d4b8df',
  body: '[{"eventId":531833541,"subscriptionId":3923621,"portalId":48807704,"appId":16111050,"occurredAt":1752613920733,"subscriptionType":"contact.creation","attemptNumber":0,"objectId":138017612137,"changeFlag":"CREATED","changeSource":"CRM_UI","sourceId":"userId:76023669"}]',
  timestamp: '1752613922216',
  signature: 'gbj1XPRvUt0noT7i7fXfTzOD4sLzQmf0VT28ZYq0EYg=',
};
const AT = new Date(Number(OFFICIAL.timestamp));

describe('HubSpot v3 signature: the official example', () => {
  it('validates HubSpot’s published example exactly', () => {
    expect(validHubSpotSignatureV3({ ...OFFICIAL, now: AT })).toBe(true);
  });

  it('the pathname alone (our old input) does NOT validate', () => {
    expect(validHubSpotSignatureV3({ ...OFFICIAL, uri: '/335453f5-94b3-49d9-b684-a55354d4b8df', now: AT })).toBe(false);
  });

  it('a timestamp older than 5 minutes is refused', () => {
    expect(validHubSpotSignatureV3({ ...OFFICIAL, now: new Date(AT.getTime() + 5 * 60_000 + 1) })).toBe(false);
  });

  it('a tampered body, a missing secret or a missing header is refused', () => {
    expect(validHubSpotSignatureV3({ ...OFFICIAL, body: OFFICIAL.body.replace('CREATED', 'DELETED'), now: AT })).toBe(false);
    expect(validHubSpotSignatureV3({ ...OFFICIAL, secret: '', now: AT })).toBe(false);
    expect(validHubSpotSignatureV3({ ...OFFICIAL, signature: null, now: AT })).toBe(false);
    expect(validHubSpotSignatureV3({ ...OFFICIAL, timestamp: null, now: AT })).toBe(false);
  });
});

describe('the signed URI is the full URL, with HubSpot’s listed characters decoded', () => {
  it('scheme + host + path + query', () => {
    expect(hubspotSignatureUri(new URL('https://modex-gtm.vercel.app/api/webhooks/hubspot/?a=1'))).toBe('https://modex-gtm.vercel.app/api/webhooks/hubspot/?a=1');
  });

  it('decodes %3A %2F %3F %40 %21 %24 %27 %28 %29 %2A %2C %3B and nothing else', () => {
    const url = new URL('https://x.example/hook/?q=%3A%2F%3F%40%21%24%27%28%29%2A%2C%3B%20%26');
    expect(hubspotSignatureUri(url)).toBe("https://x.example/hook/?q=:/?@!$'()*,;%20%26");
  });
});

// ---------------------------------------------------------------------------
// The route: a correctly signed delivery is recorded once; a replay is skipped.
// ---------------------------------------------------------------------------

const rows = new Map<string, { id: string; type: string }>();
const mockedPrisma = {
  webhookEvent: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
    create: vi.fn(async ({ data }: { data: { id: string; type: string } }) => { rows.set(data.id, data); return data; }),
  },
  generatedContent: { create: vi.fn(async () => ({})) },
};
vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/email/bounce', () => ({ recordHardBounce: vi.fn(async () => ({})) }));

const SECRET = 'test-app-secret';
const TARGET = 'https://modex-gtm.vercel.app/api/webhooks/hubspot/';
function signed(body: string, ts = String(Date.now())) {
  const sig = crypto.createHmac('sha256', SECRET).update(`POST${TARGET}${body}${ts}`).digest('base64');
  return new Request(TARGET, { method: 'POST', body, headers: { 'x-hubspot-signature-v3': sig, 'x-hubspot-request-timestamp': ts, 'content-type': 'application/json' } });
}

describe('POST /api/webhooks/hubspot', () => {
  beforeEach(() => {
    rows.clear();
    vi.clearAllMocks();
    process.env.HUBSPOT_WEBHOOK_SECRET = SECRET;
  });

  const body = JSON.stringify([{ eventId: 7001, subscriptionType: 'contact.propertyChange', objectId: 42, propertyName: 'lifecyclestage', propertyValue: 'lead', occurredAt: Date.now() }]);

  it('a delivery signed over the full URL is accepted and recorded in webhook_events', async () => {
    const { POST } = await import('@/app/api/webhooks/hubspot/route');
    const res = await POST(signed(body));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 1, skipped: 0 });
    expect(rows.get('7001')).toEqual({ id: '7001', type: 'contact.propertyChange' });
  });

  it('a duplicate delivery of the same eventId is idempotent: skipped, not re-recorded', async () => {
    const { POST } = await import('@/app/api/webhooks/hubspot/route');
    await POST(signed(body));
    const again = await POST(signed(body));
    expect(await again.json()).toEqual({ processed: 0, skipped: 1 });
    expect(mockedPrisma.webhookEvent.create).toHaveBeenCalledTimes(1);
  });

  it('a delivery signed over the pathname only is refused 403 and writes nothing', async () => {
    const { POST } = await import('@/app/api/webhooks/hubspot/route');
    const ts = String(Date.now());
    const sig = crypto.createHmac('sha256', SECRET).update(`POST/api/webhooks/hubspot/${body}${ts}`).digest('base64');
    const res = await POST(new Request(TARGET, { method: 'POST', body, headers: { 'x-hubspot-signature-v3': sig, 'x-hubspot-request-timestamp': ts } }));
    expect(res.status).toBe(403);
    expect(mockedPrisma.webhookEvent.create).not.toHaveBeenCalled();
  });
});
