/**
 * S4-T4: /api/cron/check-inbox wiring for reply ingestion.
 *
 * The route's prisma is a RECORDING proxy: every `prisma.<model>.<method>`
 * call lands on a list, in order, with canned answers. The flag-off test pins
 * that list to today's sequence and asserts ingestReply is never called; the
 * flag-on tests assert the same prisma list (ingest is a module mock, so its
 * own writes are its own tests) plus exactly one ingest call per HUMAN reply,
 * and that an ingest failure lands on the report without failing the cron.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  calls,
  answers,
  mockedIngest,
  mockedGetRecentReplies,
  mockedMarkAsProcessed,
  mockedCronSuccess,
} = vi.hoisted(() => {
  const calls: string[] = [];
  const answers: Record<string, (...args: any[]) => any> = {};
  return {
    calls,
    answers,
    mockedIngest: vi.fn<(...args: any[]) => Promise<any>>(),
    mockedGetRecentReplies: vi.fn<(...args: any[]) => Promise<any[]>>(),
    mockedMarkAsProcessed: vi.fn(async () => undefined),
    mockedCronSuccess: vi.fn(async () => undefined),
  };
});

function recordingPrisma() {
  return new Proxy(
    {},
    {
      get(_t, model: string) {
        if (model === 'then') return undefined;
        return new Proxy(
          {},
          {
            get(_m, method: string) {
              return async (...args: any[]) => {
                const key = `${model}.${method}`;
                calls.push(key);
                return answers[key] ? answers[key](...args) : {};
              };
            },
          },
        );
      },
    },
  );
}

vi.mock('@/lib/prisma', () => ({ prisma: recordingPrisma() }));
vi.mock('@/lib/email/gmail-inbox', () => ({
  getRecentReplies: mockedGetRecentReplies,
  markAsProcessed: mockedMarkAsProcessed,
}));
vi.mock('@/lib/hubspot/emails', () => ({ logReplyToHubSpot: vi.fn(async () => undefined) }));
vi.mock('@/lib/hubspot/contacts', () => ({
  searchContactByEmail: vi.fn(async () => null),
  stampContactReplyIntent: vi.fn(async () => undefined),
}));
vi.mock('@/lib/hubspot/companies', () => ({ searchCompanyByDomain: vi.fn(async () => null) }));
vi.mock('@/lib/hubspot/deals', () => ({ ensureLocalMeetingDealLink: vi.fn(async () => undefined) }));
vi.mock('@/lib/microsites/intent-notifications', () => ({ sendSlackNotification: vi.fn(async () => undefined) }));
vi.mock('@/lib/feature-flags', () => ({ INBOX_POLLING_ENABLED: true }));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: vi.fn(async () => undefined),
  markCronSuccess: mockedCronSuccess,
  markCronSkipped: vi.fn(async () => undefined),
  markCronFailure: vi.fn(async () => undefined),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/gap/replies/ingest', () => ({ ingestReply: mockedIngest }));

const { GET } = await import('@/app/api/cron/check-inbox/route');

const SECRET = 'test-cron-secret';
const RECEIVED = new Date('2026-09-23T14:58:00.000Z');

function reply(overrides: Record<string, unknown> = {}) {
  return {
    messageId: 'gm-msg-1',
    threadId: 'gm-thread-1',
    rfcMessageId: '<abc@acme.example>',
    from: 'Pat Plant <pat@acme.example>',
    fromName: 'Pat Plant',
    fromEmail: 'pat@acme.example',
    subject: 'Re: 48-minute turns',
    snippet: 'Sure, Thursday at 10 works. Which yards did you have in mind?',
    bodyHtml: '<p>Sure, Thursday at 10 works. Which yards did you have in mind?</p>',
    bodyText: 'Sure, Thursday at 10 works. Which yards did you have in mind?',
    receivedAt: RECEIVED,
    headers: {},
    ...overrides,
  };
}

const OOO = reply({
  messageId: 'gm-msg-ooo',
  threadId: 'gm-thread-2',
  subject: 'Automatic reply: 48-minute turns',
  snippet: 'I am currently out of the office and will return Monday.',
  bodyText: 'I am currently out of the office and will return Monday.',
  bodyHtml: '',
  headers: { 'auto-submitted': 'auto-replied' },
});

const PERSONA = {
  id: 7,
  name: 'Pat Plant',
  email: 'pat@acme.example',
  account_name: 'Acme Logistics',
  account: { pipeline_stage: null, outreach_status: 'Contacted', meeting_status: null },
};

function req() {
  return new Request('http://localhost/api/cron/check-inbox', {
    headers: { authorization: `Bearer ${SECRET}` },
  });
}

/** The exact prisma sequence for one persona-matched human reply, today. */
const ONE_HUMAN_REPLY_CALLS = [
  'systemConfig.findUnique',
  'notification.findFirst',
  'persona.findFirst',
  'notification.create',
  'emailThread.upsert',
  'inboundMessage.upsert',
  'activity.create',
  'persona.update',
  'account.updateMany',
  'emailLog.updateMany',
  'systemConfig.upsert',
  'systemConfig.upsert',
];

/**
 * With GAP_OS_ENABLED the cron ALSO runs the passive draft -> sent
 * reconciliation (last mile): one ledger read after the inbox's own writes.
 * The inbox's sequence above is unchanged.
 */
const ONE_HUMAN_REPLY_CALLS_GAP_ON = [...ONE_HUMAN_REPLY_CALLS, 'gapAuditEvent.findMany'];

const savedEnv = { CRON_SECRET: process.env.CRON_SECRET, GAP_OS_ENABLED: process.env.GAP_OS_ENABLED };
beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  delete process.env.GAP_OS_ENABLED;
  calls.length = 0;
  for (const k of Object.keys(answers)) delete answers[k];
  answers['systemConfig.findUnique'] = () => null;
  answers['notification.findFirst'] = () => null;
  answers['persona.findFirst'] = () => PERSONA;
  answers['notification.create'] = ({ data }: any) => ({ id: 1, ...data });
  mockedIngest.mockReset();
  mockedIngest.mockResolvedValue({ ok: true, action: 'paused', enrollments: [{ id: 'enr_1' }], itemsStopped: 2 });
  mockedGetRecentReplies.mockReset();
  mockedGetRecentReplies.mockResolvedValue([reply()]);
  mockedMarkAsProcessed.mockClear();
  mockedCronSuccess.mockClear();
});
afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('check-inbox: flag off (pin)', () => {
  it('runs today\'s prisma sequence, never calls ingestReply, and the response carries no gap key', async () => {
    const res = await GET(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      inbound_found: 1,
      replies_found: 1,
      notifications_created: 1,
      skipped: 0,
      filtered: 0,
      filtered_reasons: {},
      low_confidence_accepted: 0,
    });
    expect(calls).toEqual(ONE_HUMAN_REPLY_CALLS);
    expect(mockedIngest).not.toHaveBeenCalled();
    // The cron-monitor stats carry no gap block either.
    const stats = (mockedCronSuccess.mock.calls[0] as any)[1].stats;
    expect(Object.keys(stats)).toEqual([
      'repliesFound',
      'notificationsCreated',
      'skipped',
      'filtered',
      'lowConfidence',
      'filterReasons',
    ]);
  });

  it('flag off with an autoresponder in the batch: still no ingest call', async () => {
    mockedGetRecentReplies.mockResolvedValue([reply(), OOO]);
    await GET(req());
    expect(mockedIngest).not.toHaveBeenCalled();
  });
});

describe('check-inbox: flag on', () => {
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
  });

  it('calls ingestReply ONCE per human reply, after the InboundMessage upsert, with the gmail source and the sender address', async () => {
    const res = await GET(req());
    const body = await res.json();
    expect(res.status).toBe(200);

    // The route's own prisma sequence is unchanged; ingest adds calls of its own only inside ingest.ts.
    expect(calls).toEqual(ONE_HUMAN_REPLY_CALLS_GAP_ON);

    expect(mockedIngest).toHaveBeenCalledTimes(1);
    const [, arg] = mockedIngest.mock.calls[0];
    expect(arg).toMatchObject({
      contactEmail: 'pat@acme.example',
      source: 'gmail',
      inboundMessageId: 'gm-msg-1',
      receivedAt: RECEIVED,
      isAutoresponder: false,
    });
    expect(arg.now).toBeInstanceOf(Date);

    expect(body.gap_reply_ingest).toEqual({ paused: 1, errors: [] });
  });

  it('an autoresponder is filtered BEFORE ingest: one ingest call for the batch of two, and the OOO never reaches it', async () => {
    mockedGetRecentReplies.mockResolvedValue([OOO, reply()]);
    const res = await GET(req());
    const body = await res.json();
    expect(body.filtered).toBe(1);
    expect(body.notifications_created).toBe(1);
    expect(mockedIngest).toHaveBeenCalledTimes(1);
    expect(mockedIngest.mock.calls[0][1].inboundMessageId).toBe('gm-msg-1');
    expect(mockedIngest.mock.calls.map((c) => c[1].inboundMessageId)).not.toContain('gm-msg-ooo');
  });

  it('an unknown sender (no persona) still goes through ingest by address: the enrollment is keyed on to_email', async () => {
    answers['persona.findFirst'] = () => null;
    await GET(req());
    expect(mockedIngest).toHaveBeenCalledTimes(1);
    expect(mockedIngest.mock.calls[0][1].contactEmail).toBe('pat@acme.example');
  });

  it('an already-processed message (dedup hit) is skipped before ingest', async () => {
    answers['notification.findFirst'] = () => ({ id: 99 });
    const body = await (await GET(req())).json();
    expect(body.skipped).toBe(1);
    expect(mockedIngest).not.toHaveBeenCalled();
  });

  it('an ingest failure is recorded on the report and NEVER fails the cron; the rest of the reply processing continues', async () => {
    mockedIngest.mockRejectedValue(new Error('enrollment table on fire'));
    const res = await GET(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notifications_created).toBe(1);
    expect(body.gap_reply_ingest).toEqual({ paused: 0, errors: ['gm-msg-1: enrollment table on fire'] });
    // Everything after the ingest point still ran.
    expect(calls).toEqual(ONE_HUMAN_REPLY_CALLS_GAP_ON);
    expect(mockedMarkAsProcessed).toHaveBeenCalledWith('gm-msg-1');
    const stats = (mockedCronSuccess.mock.calls[0] as any)[1].stats;
    expect(stats.gapReplyIngest).toEqual({ paused: 0, errors: ['gm-msg-1: enrollment table on fire'] });
  });

  it('a no-op ingest (not enrolled) leaves paused at 0', async () => {
    mockedIngest.mockResolvedValue({ ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason: 'not_enrolled' });
    const body = await (await GET(req())).json();
    expect(body.gap_reply_ingest).toEqual({ paused: 0, errors: [] });
  });
});
