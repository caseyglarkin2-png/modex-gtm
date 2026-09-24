import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import type { HubSpotEmailEngagement, PollReport } from '@/lib/gap/replies/hubspot-poller';

/**
 * S2-T9: read-only HubSpot reply poller.
 *
 * The poller turns INCOMING_EMAIL engagements logged on HubSpot contacts into
 * the same InboundMessage + EmailThread + Notification shape check-inbox writes
 * for Gmail replies, so routing's `undispositionedInbound` sees a HubSpot
 * sequence reply exactly as it sees a Gmail one. It never writes to HubSpot,
 * never stops a sequence, never touches Persona status: the structural test at
 * the bottom greps the source for every write helper the codebase owns.
 */

// ---------------------------------------------------------------------------
// Module mocks (hoisted). The route tests need the poller, the cron helpers and
// prisma under control; the poller tests import the real job via importActual.
// ---------------------------------------------------------------------------

const mockedPoll = vi.fn<(...args: any[]) => Promise<PollReport>>();
const mockedClaim = vi.fn<(...args: any[]) => Promise<{ claimed: boolean; reason?: string; key: string }>>();
const mockedRelease = vi.fn<(...args: any[]) => Promise<void>>(async () => undefined);
const mockedStarted = vi.fn(async () => undefined);
const mockedSuccess = vi.fn(async () => undefined);
const mockedSkipped = vi.fn(async () => undefined);
const mockedFailure = vi.fn(async () => undefined);
/** S4-T4: ingest is a module mock; its own writes are reply-ingest.test.ts. */
const mockedIngest = vi.fn<(...args: any[]) => Promise<any>>();

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/gap/replies/ingest', () => ({ ingestReply: mockedIngest }));
vi.mock('@/lib/cron-idempotency', () => ({
  claimDailyRun: mockedClaim,
  releaseDailyRun: mockedRelease,
}));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedStarted,
  markCronSuccess: mockedSuccess,
  markCronSkipped: mockedSkipped,
  markCronFailure: mockedFailure,
}));
vi.mock('@/lib/gap/replies/hubspot-poller', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gap/replies/hubspot-poller')>();
  return { ...actual, pollHubSpotReplies: mockedPoll };
});

const pollerModule = await vi.importActual<typeof import('@/lib/gap/replies/hubspot-poller')>(
  '@/lib/gap/replies/hubspot-poller',
);
const { pollHubSpotReplies, WATERMARK_KEY, DEFAULT_LOOKBACK_DAYS, searchIncomingEmailsFromHubSpot } = pollerModule;
const { GET } = await import('@/app/api/cron/gap-hubspot-replies/route');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2026-09-23T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const ACCOUNT = 'Acme Logistics';
const CONTACT_ID = '9001';

function engagement(overrides: Partial<HubSpotEmailEngagement> = {}): HubSpotEmailEngagement {
  return {
    id: '5551',
    fromEmail: 'Pat@Acme.example',
    toEmail: 'casey@yardflow.ai',
    subject: 'Re: 48-minute turns',
    text: 'Sure, Thursday at 10 works. Which yards did you have in mind?',
    html: '<p>Sure, Thursday at 10 works. Which yards did you have in mind?</p>',
    timestamp: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
    ...overrides,
  };
}

const OOO = engagement({
  id: '5552',
  subject: 'Automatic reply: 48-minute turns',
  text: 'I am currently out of the office and will return Monday.',
  html: null,
  timestamp: new Date(NOW.getTime() - 60 * 60 * 1000),
});

const STRANGER = engagement({
  id: '5553',
  fromEmail: 'nobody@unknown.example',
  subject: 'Re: 48-minute turns',
  text: 'Who are you?',
  timestamp: new Date(NOW.getTime() - 30 * 60 * 1000),
});

/**
 * In-memory prisma covering exactly the delegates the poller touches. Stateful
 * so a second run against the same store reads what the first run wrote.
 */
function makePrisma(seed: { personas?: unknown[]; config?: Record<string, string> } = {}) {
  const config = new Map<string, string>(Object.entries(seed.config ?? {}));
  const notifications: any[] = [];
  const messages = new Map<string, any>();
  const threads = new Map<string, any>();
  const personas = seed.personas ?? [
    { id: 1, email: 'pat@acme.example', account_name: ACCOUNT, name: 'Pat Plant', hubspot_contact_id: CONTACT_ID },
  ];

  const db: any = {
    __store: { config, notifications, messages, threads },
    systemConfig: {
      findUnique: vi.fn(async ({ where }: any) =>
        config.has(where.key) ? { key: where.key, value: config.get(where.key) } : null,
      ),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        config.set(where.key, config.has(where.key) ? update.value : create.value);
        return { key: where.key, value: config.get(where.key) };
      }),
    },
    persona: {
      // SF8: only sorts when the caller explicitly asks for id asc (as
      // production now does), so a fixture seeded out of id order proves
      // the caller REQUESTS deterministic ordering, not just that a
      // first-wins dedupe exists over whatever order the DB happened to hand back.
      findMany: vi.fn(async (q: any = {}) =>
        q?.orderBy?.id === 'asc' ? [...(personas as any[])].sort((a, b) => a.id - b.id) : personas,
      ),
    },
    notification: {
      findFirst: vi.fn(async ({ where }: any) =>
        notifications.find(
          (n) => n.source_id === where.source_id && (!where.type?.in || where.type.in.includes(n.type)),
        ) ?? null,
      ),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: notifications.length + 1, read: false, ...data };
        notifications.push(row);
        return row;
      }),
    },
    emailThread: {
      findUnique: vi.fn(async ({ where }: any) => threads.get(where.id) ?? null),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const row = threads.has(where.id) ? { ...threads.get(where.id), ...update } : { ...create };
        threads.set(where.id, row);
        return row;
      }),
    },
    inboundMessage: {
      findUnique: vi.fn(async ({ where }: any) => messages.get(where.id) ?? null),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const row = messages.has(where.id) ? { ...messages.get(where.id), ...update } : { read: false, ...create };
        messages.set(where.id, row);
        return row;
      }),
    },
    $transaction: vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(db)),
  };
  return db;
}

function makeSearch(rows: HubSpotEmailEngagement[]) {
  return vi.fn<(args: { since: Date; limit: number }) => Promise<HubSpotEmailEngagement[]>>(async () => rows);
}

// ---------------------------------------------------------------------------
// Watermark
// ---------------------------------------------------------------------------

describe('pollHubSpotReplies: watermark', () => {
  it('first run with no stored watermark searches from now minus 7 days', async () => {
    const prisma = makePrisma();
    const search = makeSearch([]);

    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: true }, { searchIncomingEmails: search });

    const expected = new Date(NOW.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS);
    expect(DEFAULT_LOOKBACK_DAYS).toBe(7);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toEqual({ since: expected, limit: 200 });
    expect(report.since).toBe(expected.toISOString());
  });

  it('a stored watermark is the search floor', async () => {
    const stored = '2026-09-21T08:00:00.000Z';
    const prisma = makePrisma({ config: { [WATERMARK_KEY]: stored } });
    const search = makeSearch([]);

    await pollHubSpotReplies(prisma, { now: NOW, dryRun: true }, { searchIncomingEmails: search });

    expect(search.mock.calls[0][0].since).toEqual(new Date(stored));
  });

  it('an explicit since overrides the stored watermark', async () => {
    const prisma = makePrisma({ config: { [WATERMARK_KEY]: '2026-09-21T08:00:00.000Z' } });
    const search = makeSearch([]);
    const since = new Date('2026-09-01T00:00:00.000Z');

    await pollHubSpotReplies(prisma, { now: NOW, since, dryRun: true }, { searchIncomingEmails: search });

    expect(search.mock.calls[0][0].since).toEqual(since);
  });

  it('a corrupt stored watermark falls back to the default lookback', async () => {
    const prisma = makePrisma({ config: { [WATERMARK_KEY]: 'not-a-date' } });
    const search = makeSearch([]);

    await pollHubSpotReplies(prisma, { now: NOW, dryRun: true }, { searchIncomingEmails: search });

    expect(search.mock.calls[0][0].since).toEqual(new Date(NOW.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS));
  });

  it('a dry run never writes the watermark', async () => {
    const prisma = makePrisma();
    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: true },
      { searchIncomingEmails: makeSearch([engagement()]) },
    );

    expect(report.dryRun).toBe(true);
    expect(report.newest).toBe(engagement().timestamp.toISOString());
    expect(prisma.systemConfig.upsert).not.toHaveBeenCalled();
    expect(prisma.__store.config.has(WATERMARK_KEY)).toBe(false);
  });

  it('an apply run advances the watermark to the newest timestamp seen, never past now', async () => {
    const prisma = makePrisma();
    const future = engagement({ id: '5559', timestamp: new Date(NOW.getTime() + 60 * 60 * 1000) });

    await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false },
      { searchIncomingEmails: makeSearch([engagement(), OOO]) },
    );
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(OOO.timestamp.toISOString());

    await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([future]) });
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(NOW.toISOString());
  });

  it('an apply run that sees nothing leaves the watermark where it was', async () => {
    const stored = '2026-09-21T08:00:00.000Z';
    const prisma = makePrisma({ config: { [WATERMARK_KEY]: stored } });

    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([]) });

    expect(report.newest).toBeNull();
    expect(prisma.systemConfig.upsert).not.toHaveBeenCalled();
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(stored);
    expect(report).toMatchObject({ watermarkHeld: false, watermarkHeldReason: null });
  });

  /**
   * SHOULD FIX (Opus adversarial review, 2026-09-24): before this fix, ANY
   * full page held the watermark at its pre-run floor, so a backlog past
   * `limit` never drained -- since/limit never change on their own, so the
   * next run re-read this exact same page forever. The three fixture rows
   * carry distinct timestamps, so there is no genuine ambiguity at the
   * tail; the run must advance to the row just before the batch's newest
   * timestamp (here, OOO's, since STRANGER alone owns the newest one).
   * Mutate the fix back to "any full page holds" and this goes RED.
   */
  it('SHOULD FIX: a capped run with distinct timestamps still advances the watermark (partial advance, not a stall)', async () => {
    const stored = '2026-09-21T08:00:00.000Z';
    const prisma = makePrisma({ config: { [WATERMARK_KEY]: stored } });
    const rows = [engagement({ id: '1' }), OOO, STRANGER];

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false, limit: 3 },
      { searchIncomingEmails: makeSearch(rows) },
    );

    expect(report.seen).toBe(3);
    expect(report.newest).toBe(STRANGER.timestamp.toISOString());
    // Advanced to OOO's timestamp (the row just before the tie-free newest one), not all the way to STRANGER's.
    expect(report).toMatchObject({ watermarkHeld: false, watermarkHeldReason: null, watermarkPartialAdvance: true });
    expect(prisma.systemConfig.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(OOO.timestamp.toISOString());
    // The rows themselves still landed.
    expect(report.created).toBe(1);
    expect(prisma.__store.messages.size).toBe(1);
  });

  it('R2-11 preserved: a genuinely ambiguous full page (every row ties on the newest timestamp) still holds at the original floor', async () => {
    const stored = '2026-09-21T08:00:00.000Z';
    const prisma = makePrisma({ config: { [WATERMARK_KEY]: stored } });
    const tied = new Date(NOW.getTime() - 30 * 60 * 1000);
    const rows = [
      engagement({ id: '1', timestamp: tied }),
      engagement({ id: '2', timestamp: tied }),
      engagement({ id: '3', timestamp: tied }),
    ];

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false, limit: 3 },
      { searchIncomingEmails: makeSearch(rows) },
    );

    expect(report).toMatchObject({ watermarkHeld: true, watermarkHeldReason: 'page_full' });
    expect(report.watermarkPartialAdvance).toBeUndefined();
    expect(prisma.systemConfig.upsert).not.toHaveBeenCalled();
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(stored);
  });

  it('R2-11: a run under the limit advances the watermark and reports it not held', async () => {
    const prisma = makePrisma();
    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false, limit: 4 },
      { searchIncomingEmails: makeSearch([engagement(), OOO, STRANGER]) },
    );
    expect(report).toMatchObject({ seen: 3, watermarkHeld: false, watermarkHeldReason: null });
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(STRANGER.timestamp.toISOString());
  });
});

// ---------------------------------------------------------------------------
// Classification and persistence
// ---------------------------------------------------------------------------

describe('pollHubSpotReplies: classification and persistence', () => {
  it('a human reply from a known persona becomes one InboundMessage, one EmailThread and one reply Notification', async () => {
    const prisma = makePrisma();

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false },
      { searchIncomingEmails: makeSearch([engagement(), OOO, STRANGER]) },
    );

    expect(report).toEqual({
      since: new Date(NOW.getTime() - 7 * DAY_MS).toISOString(),
      newest: STRANGER.timestamp.toISOString(),
      seen: 3,
      created: 1,
      existing: 0,
      unknownSender: 1,
      filtered: { auto_reply_subject: 1 },
      dryRun: false,
      watermarkHeld: false,
      watermarkHeldReason: null,
    });

    const { messages, threads, notifications } = prisma.__store;
    expect([...messages.keys()]).toEqual([`hs:${engagement().id}`]);
    const msg = messages.get(`hs:${engagement().id}`);
    expect(msg).toMatchObject({
      id: 'hs:5551',
      source: 'hubspot',
      hubspot_engagement_id: '5551',
      thread_id: `hs-thread:${CONTACT_ID}`,
      from_email: 'pat@acme.example',
      subject: 'Re: 48-minute turns',
      body_text: engagement().text,
      body_html: engagement().html,
      snippet: engagement().text,
      received_at: engagement().timestamp,
    });

    expect([...threads.keys()]).toEqual([`hs-thread:${CONTACT_ID}`]);
    expect(threads.get(`hs-thread:${CONTACT_ID}`)).toMatchObject({
      id: `hs-thread:${CONTACT_ID}`,
      account_name: ACCOUNT,
      persona_email: 'pat@acme.example',
      last_message_at: engagement().timestamp,
    });

    const replies = notifications.filter((n: any) => n.type === 'reply');
    expect(replies).toHaveLength(1);
    expect(replies[0]).toMatchObject({
      type: 'reply',
      account_name: ACCOUNT,
      persona_email: 'pat@acme.example',
      subject: 'Re: 48-minute turns',
      source_id: 'hs:5551',
      read: false,
    });

    // One transaction per persisted engagement, and only for the human reply.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('SF8: a reply from an email shared by two personas attributes to the lowest-id persona, deterministically, regardless of DB row order', async () => {
    const shared = 'dup@acme.example';
    const prisma = makePrisma({
      personas: [
        // Seeded out of id order: the fix must sort, not trust array order.
        { id: 20, email: shared, account_name: 'Wrong Account', hubspot_contact_id: '9099' },
        { id: 3, email: shared, account_name: ACCOUNT, hubspot_contact_id: CONTACT_ID },
      ],
    });

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false },
      { searchIncomingEmails: makeSearch([engagement({ fromEmail: shared })]) },
    );

    expect(report.created).toBe(1);
    expect(report.unknownSender).toBe(0);
    const msg = prisma.__store.messages.get('hs:5551');
    // Attributed to persona id 3 (ACCOUNT/CONTACT_ID), never id 20.
    expect(msg).toMatchObject({ thread_id: `hs-thread:${CONTACT_ID}` });
    expect(prisma.__store.threads.get(`hs-thread:${CONTACT_ID}`)).toMatchObject({ account_name: ACCOUNT });
    expect(prisma.__store.threads.has('hs-thread:9099')).toBe(false);
  });

  it('the out-of-office autoresponder is filtered under the exact classifier reason and recorded as filtered_inbound, never as an InboundMessage', async () => {
    const prisma = makePrisma();

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false },
      { searchIncomingEmails: makeSearch([OOO]) },
    );

    expect(report.created).toBe(0);
    expect(report.filtered).toEqual({ auto_reply_subject: 1 });
    expect(prisma.__store.messages.size).toBe(0);
    expect(prisma.__store.threads.size).toBe(0);
    const filtered = prisma.__store.notifications.filter((n: any) => n.type === 'filtered_inbound');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({
      type: 'filtered_inbound',
      account_name: ACCOUNT,
      persona_email: 'pat@acme.example',
      subject: '[filtered: auto_reply_subject] Automatic reply: 48-minute turns',
      source_id: 'hs:5552',
      read: true,
    });
    // The filtered type must never contain the substring "reply": /engagement
    // counts notifications whose type contains it.
    expect(filtered[0].type.includes('reply')).toBe(false);
  });

  it('a body-only autoresponder is filtered under auto_reply_body', async () => {
    const prisma = makePrisma();
    const bodyOnly = engagement({
      id: '5560',
      subject: 'Re: 48-minute turns',
      text: 'Thanks for reaching out. I am currently out of the office until the 30th.',
    });

    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([bodyOnly]) });

    expect(report.filtered).toEqual({ auto_reply_body: 1 });
    expect(prisma.__store.messages.size).toBe(0);
  });

  it('an unknown sender is counted and writes no row of any kind', async () => {
    const prisma = makePrisma();

    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([STRANGER]) });

    expect(report.unknownSender).toBe(1);
    expect(report.created).toBe(0);
    expect(prisma.__store.notifications).toHaveLength(0);
    expect(prisma.__store.messages.size).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('a persona without a hubspot_contact_id is not in scope: its sender reads as unknown', async () => {
    const prisma = makePrisma({
      personas: [{ id: 1, email: 'pat@acme.example', account_name: ACCOUNT, name: 'Pat Plant', hubspot_contact_id: null }],
    });

    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([engagement()]) });

    expect(report.unknownSender).toBe(1);
    expect(prisma.__store.messages.size).toBe(0);
  });

  it('strips html to text for classification and the body when the engagement has no text', async () => {
    const prisma = makePrisma();
    const htmlOnly = engagement({
      id: '5561',
      text: null,
      html: '<div>Hi Casey,<br>I am currently out of the office.<br>Pat</div>',
    });

    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([htmlOnly]) });

    expect(report.filtered).toEqual({ auto_reply_body: 1 });
  });

  it('a second apply run with the same engagements counts them existing and creates nothing', async () => {
    const prisma = makePrisma();
    const search = makeSearch([engagement(), OOO, STRANGER]);

    await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: search });
    const second = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: search });

    expect(second).toMatchObject({ seen: 3, created: 0, existing: 2, unknownSender: 1, filtered: {} });
    expect(prisma.__store.messages.size).toBe(1);
    expect(prisma.__store.notifications).toHaveLength(2);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('a dry run classifies and counts but writes nothing', async () => {
    const prisma = makePrisma();

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: true },
      { searchIncomingEmails: makeSearch([engagement(), OOO, STRANGER]) },
    );

    expect(report).toMatchObject({ seen: 3, created: 1, existing: 0, unknownSender: 1, filtered: { auto_reply_subject: 1 }, dryRun: true });
    expect(prisma.__store.messages.size).toBe(0);
    expect(prisma.__store.threads.size).toBe(0);
    expect(prisma.__store.notifications).toHaveLength(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('two replies from the same contact share one synthetic thread whose last_message_at is the newest', async () => {
    const prisma = makePrisma();
    const older = engagement({ id: '5570', timestamp: new Date(NOW.getTime() - 5 * DAY_MS), text: 'First note back from Pat.' });
    const newer = engagement({ id: '5571', timestamp: new Date(NOW.getTime() - 1 * DAY_MS), text: 'Second: yes, let us talk.' });

    // Newest first on purpose: the thread must keep the max, not the last written.
    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([newer, older]) });

    expect(report.created).toBe(2);
    expect(prisma.__store.threads.size).toBe(1);
    expect(prisma.__store.threads.get(`hs-thread:${CONTACT_ID}`).last_message_at).toEqual(newer.timestamp);
    expect(prisma.__store.messages.size).toBe(2);
  });

  it('passes the limit through to the search', async () => {
    const prisma = makePrisma();
    const search = makeSearch([]);
    await pollHubSpotReplies(prisma, { now: NOW, dryRun: true, limit: 50 }, { searchIncomingEmails: search });
    expect(search.mock.calls[0][0].limit).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// The default HubSpot search helper (fake client, no network)
// ---------------------------------------------------------------------------

describe('searchIncomingEmailsFromHubSpot', () => {
  function fakeClient(pages: Array<{ results: any[]; paging?: { next?: { after?: string } } }>) {
    const doSearch = vi.fn(async (_request: Record<string, unknown>) => pages.shift() ?? { results: [] });
    return { client: { crm: { objects: { emails: { searchApi: { doSearch } } } } } as any, doSearch };
  }

  it('POSTs one read-only search filtered to INCOMING_EMAIL since the floor and maps the rows', async () => {
    const since = new Date('2026-09-20T00:00:00.000Z');
    const { client, doSearch } = fakeClient([
      {
        results: [
          {
            id: '777',
            properties: {
              hs_timestamp: '2026-09-21T10:00:00.000Z',
              hs_email_direction: 'INCOMING_EMAIL',
              hs_email_from_email: 'Pat@Acme.example',
              hs_email_to_email: 'casey@yardflow.ai',
              hs_email_subject: 'Re: turns',
              hs_email_text: 'yes',
              hs_email_html: '<p>yes</p>',
            },
          },
        ],
      },
    ]);

    const rows = await searchIncomingEmailsFromHubSpot({ since, limit: 10 }, client);

    expect(doSearch).toHaveBeenCalledTimes(1);
    const req = doSearch.mock.calls[0][0] as any;
    expect(req.filterGroups).toEqual([
      {
        filters: [
          { propertyName: 'hs_email_direction', operator: 'EQ', value: 'INCOMING_EMAIL' },
          { propertyName: 'hs_timestamp', operator: 'GTE', value: String(since.getTime()) },
        ],
      },
    ]);
    // R2-11: the string form leaves the direction to HubSpot's default; the
    // watermark logic needs oldest-first, so the direction is stated.
    expect(req.sorts).toEqual([{ propertyName: 'hs_timestamp', direction: 'ASCENDING' }]);
    expect(req.limit).toBe(10);
    expect(rows).toEqual([
      {
        id: '777',
        fromEmail: 'Pat@Acme.example',
        toEmail: 'casey@yardflow.ai',
        subject: 'Re: turns',
        text: 'yes',
        html: '<p>yes</p>',
        timestamp: new Date('2026-09-21T10:00:00.000Z'),
      },
    ]);
  });

  it('falls back to the sender in hs_email_headers when the from property is empty, and follows paging up to the limit', async () => {
    const { client, doSearch } = fakeClient([
      {
        results: [
          { id: '1', properties: { hs_timestamp: '1758400000000', hs_email_headers: JSON.stringify({ from: { email: 'a@x.example' } }) } },
        ],
        paging: { next: { after: '1' } },
      },
      { results: [{ id: '2', properties: { hs_timestamp: '2026-09-21T10:00:00.000Z', hs_email_sender_email: 'b@x.example' } }] },
    ]);

    const rows = await searchIncomingEmailsFromHubSpot({ since: new Date(0), limit: 2 }, client);

    expect(doSearch).toHaveBeenCalledTimes(2);
    expect((doSearch.mock.calls[1][0] as any).after).toBe('1');
    expect(rows.map((r) => [r.id, r.fromEmail])).toEqual([
      ['1', 'a@x.example'],
      ['2', 'b@x.example'],
    ]);
    expect(rows[0].timestamp).toEqual(new Date(1758400000000));
  });

  it('drops rows without a usable timestamp or sender instead of throwing', async () => {
    const { client } = fakeClient([
      { results: [{ id: '1', properties: { hs_timestamp: 'garbage', hs_email_from_email: 'a@x.example' } }, { id: '2', properties: { hs_timestamp: '2026-09-21T10:00:00.000Z' } }] },
    ]);
    const rows = await searchIncomingEmailsFromHubSpot({ since: new Date(0), limit: 10 }, client);
    expect(rows).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Structural: the module owns no HubSpot write path
// ---------------------------------------------------------------------------

describe('S2-T9 structural: no HubSpot write path', () => {
  const ROOT = path.resolve(__dirname, '../../..');
  const POLLER = readFileSync(path.join(ROOT, 'src/lib/gap/replies/hubspot-poller.ts'), 'utf8');
  const ROUTE = readFileSync(path.join(ROOT, 'src/app/api/cron/gap-hubspot-replies/route.ts'), 'utf8');
  const SOURCES: Array<[string, string]> = [
    ['hubspot-poller.ts', POLLER],
    ['route.ts', ROUTE],
  ];

  const FORBIDDEN = [
    'basicApi.create',
    'basicApi.update',
    'basicApi.archive',
    'batchApi',
    '.patch(',
    'enrollments',
    'notes',
    'createNote',
    'updateContact',
    'upsertContact',
    'stampContactReplyIntent',
    'propertiesApi',
    'associations',
    'logReplyToHubSpot',
    'logEmailToHubSpot',
    'HUBSPOT_ACCESS_TOKEN =',
  ];

  it.each(SOURCES)('%s contains no write helper name', (_name, src) => {
    for (const token of FORBIDDEN) {
      expect(src.includes(token), `forbidden token "${token}"`).toBe(false);
    }
  });

  it('the only HubSpot API call in either file is the emails searchApi.doSearch (a POST, but read-only)', () => {
    const calls = (POLLER + ROUTE).match(/client\.crm\.[A-Za-z0-9_.]+/g) ?? [];
    expect(calls).toEqual(['client.crm.objects.emails.searchApi.doSearch']);
  });

  it('imports nothing from the hubspot library except the client factory', () => {
    for (const [name, src] of SOURCES) {
      const hubspotImports = [...src.matchAll(/from ['"]@\/lib\/hubspot\/([^'"]+)['"]/g)].map((m) => m[1]);
      expect(hubspotImports, name).toEqual(name === 'hubspot-poller.ts' ? ['client'] : []);
    }
  });

  it('never stops a sequence, changes persona status or writes an Activity', () => {
    for (const [name, src] of SOURCES) {
      expect(src.includes('persona.update'), name).toBe(false);
      expect(src.includes('activity.create'), name).toBe(false);
      expect(src.includes('sequenceRun'), name).toBe(false);
      expect(src.includes('sequenceEnrollment'), name).toBe(false);
    }
  });

  it('S4-T4: the only sequence effect is ingestReply, behind isGapOsEnabled(), after the InboundMessage upsert (a new row, or a SHOULD FIX retry on a dedup hit)', () => {
    // Two call sites: the new-row path and the dedup-hit retry path (SHOULD FIX, 2026-09-24).
    expect(POLLER.match(/ingestReply\(/g)?.length).toBe(2);
    expect(POLLER).toContain("from '@/lib/gap/replies/ingest'");
    expect(POLLER.indexOf('isGapOsEnabled()')).toBeLessThan(POLLER.indexOf('ingestReply('));
    expect(POLLER.indexOf('inboundMessage.upsert')).toBeLessThan(POLLER.lastIndexOf('ingestReply('));
    // No direct stop or pause of its own.
    expect(POLLER).not.toMatch(/stopRun/);
    expect(POLLER).not.toMatch(/pause\(/);
    expect(POLLER).not.toMatch(/stop\(/);
    expect(ROUTE).not.toContain('ingestReply');
  });
});

// ---------------------------------------------------------------------------
// S4-T4: reply ingestion under the flag
// ---------------------------------------------------------------------------

describe('pollHubSpotReplies: S4-T4 reply ingestion', () => {
  const savedFlag = process.env.GAP_OS_ENABLED;
  beforeEach(() => {
    delete process.env.GAP_OS_ENABLED;
    mockedIngest.mockReset();
    mockedIngest.mockResolvedValue({ ok: true, action: 'paused', enrollments: [{ id: 'enr_1' }], itemsStopped: 2 });
  });
  afterAll(() => {
    if (savedFlag === undefined) delete process.env.GAP_OS_ENABLED;
    else process.env.GAP_OS_ENABLED = savedFlag;
  });

  it('flag off: an apply run with a human reply never calls ingestReply and the report has no gap key', async () => {
    const prisma = makePrisma();
    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([engagement()]) });
    expect(mockedIngest).not.toHaveBeenCalled();
    expect('gap' in report).toBe(false);
    expect(prisma.__store.messages.size).toBe(1);
  });

  it('flag on: exactly one ingestReply call per human reply, after the transaction, with the hubspot source, the local message id, the contact id and the verdict passed through', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrisma();
    const order: string[] = [];
    prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<unknown>) => {
      order.push('transaction');
      return fn(prisma);
    });
    mockedIngest.mockImplementation(async () => {
      order.push('ingest');
      return { ok: true, action: 'paused', enrollments: [{ id: 'enr_1' }], itemsStopped: 2 };
    });

    const report = await pollHubSpotReplies(
      prisma,
      { now: NOW, dryRun: false },
      { searchIncomingEmails: makeSearch([engagement(), OOO, STRANGER]) },
    );

    expect(mockedIngest).toHaveBeenCalledTimes(1);
    const [client, arg] = mockedIngest.mock.calls[0];
    expect(client).toBe(prisma);
    expect(arg).toEqual({
      contactEmail: 'pat@acme.example',
      source: 'hubspot',
      inboundMessageId: 'hs:5551',
      hubspotContactId: CONTACT_ID,
      receivedAt: engagement().timestamp,
      isAutoresponder: false,
      now: NOW,
    });
    expect(order).toEqual(['transaction', 'ingest']);
    expect(report.gap).toEqual({ paused: 1, errors: [] });
    // The rest of the report is what it was before.
    expect(report).toMatchObject({ seen: 3, created: 1, unknownSender: 1, filtered: { auto_reply_subject: 1 } });
  });

  it('flag on: the out-of-office never reaches ingest (filtered before the InboundMessage)', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrisma();
    await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([OOO]) });
    expect(mockedIngest).not.toHaveBeenCalled();
  });

  it('flag on, dry run: nothing is written and ingest is not called; the report carries no gap key', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrisma();
    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: true }, { searchIncomingEmails: makeSearch([engagement()]) });
    expect(mockedIngest).not.toHaveBeenCalled();
    expect('gap' in report).toBe(false);
  });

  /**
   * SHOULD FIX (Opus adversarial review, 2026-09-24). Before this fix, once
   * the Notification/InboundMessage committed, `already` was true on every
   * later run and the row was skipped outright -- a failed ingestReply
   * (a thrown error, a transient DB hiccup) was never retried, so a real
   * human reply could sit forever with its live enrollment still unpaused.
   * ingestReply is idempotent by construction (driven by the enrollment's
   * CURRENT live status; see its own header), so retrying it on a dedup
   * hit is always safe. Mutate the retry away and this goes RED.
   */
  it('flag on: a second apply run (dedup hit) retries ingestReply, because the first run may have failed after the row was written', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrisma();
    await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([engagement()]) });
    const report2 = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([engagement()]) });
    expect(mockedIngest).toHaveBeenCalledTimes(2);
    expect(mockedIngest.mock.calls[1][1]).toEqual(mockedIngest.mock.calls[0][1]);
    // No row is rewritten on the retry: still exactly one message, one dedup hit counted.
    expect(prisma.__store.messages.size).toBe(1);
    expect(report2.existing).toBe(1);
  });

  it('flag on: a dedup-hit retry never fires for a FILTERED reply (it never called ingest the first time either)', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrisma();
    await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([OOO]) });
    mockedIngest.mockClear();
    await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([OOO]) });
    expect(mockedIngest).not.toHaveBeenCalled();
  });

  it('flag on: an ingest failure lands on report.gap.errors, the row stays written and the watermark still advances', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    mockedIngest.mockRejectedValue(new Error('enrollment table on fire'));
    const prisma = makePrisma();
    const report = await pollHubSpotReplies(prisma, { now: NOW, dryRun: false }, { searchIncomingEmails: makeSearch([engagement()]) });
    expect(report.gap).toEqual({ paused: 0, errors: ['hs:5551: enrollment table on fire'] });
    expect(report.created).toBe(1);
    expect(prisma.__store.messages.has('hs:5551')).toBe(true);
    expect(prisma.__store.config.get(WATERMARK_KEY)).toBe(engagement().timestamp.toISOString());
  });
});

// ---------------------------------------------------------------------------
// The route
// ---------------------------------------------------------------------------

const REPORT: PollReport = {
  since: '2026-09-16T12:00:00.000Z',
  newest: '2026-09-23T10:00:00.000Z',
  seen: 3,
  created: 1,
  existing: 1,
  unknownSender: 1,
  filtered: { auto_reply_subject: 1 },
  dryRun: false,
  watermarkHeld: false,
  watermarkHeldReason: null,
};

function makeReq(opts: { headers?: Record<string, string>; url?: string } = {}) {
  return new NextRequest(opts.url ?? 'http://localhost/api/cron/gap-hubspot-replies', {
    method: 'GET',
    headers: opts.headers ?? {},
  });
}

describe('GET /api/cron/gap-hubspot-replies (route)', () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'shh';
    process.env.GAP_OS_ENABLED = '1';
    process.env.GAP_ROUTING_ENABLED = '1';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    mockedClaim.mockResolvedValue({ claimed: true, key: 'cron-run:gap-hubspot-replies:2026-09-23' });
    mockedPoll.mockResolvedValue(REPORT);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('rejects an unauthenticated call with 401 and runs nothing', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockedPoll).not.toHaveBeenCalled();
    expect(mockedStarted).not.toHaveBeenCalled();
  });

  it('answers 200 with the skip payload when GAP_OS_ENABLED is off and never runs the job', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedPoll).not.toHaveBeenCalled();
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedSkipped).toHaveBeenCalledTimes(1);
  });

  it('names GAP_ROUTING_ENABLED when only that flag is off', async () => {
    process.env.GAP_ROUTING_ENABLED = '0';
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_ROUTING_ENABLED=false' });
    expect(mockedPoll).not.toHaveBeenCalled();
  });

  it('N9: a Bearer call WITHOUT ?mode is a dry run: no claim, dryRun true, mode dryrun', async () => {
    mockedPoll.mockResolvedValue({ ...REPORT, dryRun: true });
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...REPORT, dryRun: true, mode: 'dryrun' });
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedPoll).toHaveBeenCalledTimes(1);
    expect(mockedPoll.mock.calls[0][1]).toMatchObject({ dryRun: true, limit: 200, since: null });
  });

  it('a Bearer call with ?mode=apply claims the day, applies and returns the report', async () => {
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' }, url: 'http://localhost/api/cron/gap-hubspot-replies?mode=apply' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...REPORT, mode: 'apply' });
    expect(mockedClaim).toHaveBeenCalledWith('gap-hubspot-replies', expect.any(Date));
    expect(mockedPoll).toHaveBeenCalledTimes(1);
    expect(mockedPoll.mock.calls[0][0]).toEqual({ __tag: 'route-prisma' });
    expect(mockedPoll.mock.calls[0][1]).toMatchObject({ dryRun: false, limit: 200, since: null });
    expect(typeof mockedPoll.mock.calls[0][2].searchIncomingEmails).toBe('function');
    expect(mockedSuccess).toHaveBeenCalledTimes(1);
  });

  it('a manual ?secret= call defaults to dry run and does not consume the daily claim', async () => {
    mockedPoll.mockResolvedValue({ ...REPORT, dryRun: true });
    const res = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hubspot-replies?secret=shh' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ mode: 'dryrun', dryRun: true });
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedPoll.mock.calls[0][1]).toMatchObject({ dryRun: true });
  });

  it('?dryRun=1 forces a dry run even with ?mode=apply', async () => {
    await GET(makeReq({ headers: { authorization: 'Bearer shh' }, url: 'http://localhost/api/cron/gap-hubspot-replies?mode=apply&dryRun=1' }));
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedPoll.mock.calls[0][1]).toMatchObject({ dryRun: true });
  });

  it('a manual ?mode=apply call is idempotent per day: a second call the same day skips', async () => {
    mockedClaim.mockResolvedValue({ claimed: false, reason: 'already-ran-today', key: 'k' });
    const res = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hubspot-replies?secret=shh&mode=apply' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skipped: true, reason: 'already-ran-today' });
    expect(mockedPoll).not.toHaveBeenCalled();
  });

  it('?force=1 bypasses the daily claim only after the secret matched', async () => {
    mockedClaim.mockResolvedValue({ claimed: false, reason: 'already-ran-today', key: 'k' });
    const denied = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hubspot-replies?force=1&mode=apply' }));
    expect(denied.status).toBe(401);
    expect(mockedPoll).not.toHaveBeenCalled();

    const res = await GET(makeReq({ url: 'http://localhost/api/cron/gap-hubspot-replies?secret=shh&force=1&mode=apply' }));
    expect(res.status).toBe(200);
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedPoll.mock.calls[0][1]).toMatchObject({ dryRun: false });
  });

  it('passes limit and since through from the query, clamped and validated', async () => {
    await GET(makeReq({ url: 'http://localhost/api/cron/gap-hubspot-replies?secret=shh&limit=5&since=2026-09-01T00:00:00Z' }));
    expect(mockedPoll.mock.calls[0][1]).toMatchObject({ limit: 5, since: new Date('2026-09-01T00:00:00Z') });
    await GET(makeReq({ url: 'http://localhost/api/cron/gap-hubspot-replies?secret=shh&limit=99999&since=garbage' }));
    expect(mockedPoll.mock.calls[1][1]).toMatchObject({ limit: 500, since: null });
  });

  it('releases the daily claim and answers 500 when the job throws', async () => {
    mockedPoll.mockRejectedValueOnce(new Error('hubspot down'));
    const res = await GET(makeReq({ headers: { authorization: 'Bearer shh' }, url: 'http://localhost/api/cron/gap-hubspot-replies?mode=apply' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'hubspot down' });
    expect(mockedRelease).toHaveBeenCalledWith('gap-hubspot-replies', expect.any(Date));
    expect(mockedFailure).toHaveBeenCalledTimes(1);
  });
});
