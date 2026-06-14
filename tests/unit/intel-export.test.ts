import { describe, expect, it, vi, beforeEach } from 'vitest';

import { deriveAccountDomain, emailDomain } from '@/lib/intel/export/domain';
import { encodeCursor, decodeCursor } from '@/lib/intel/export/cursor';
import {
  replyKey,
  openKey,
  clickKey,
  bounceKey,
  micrositeKey,
  captureKey,
  outcomeKey,
  buildReplyRecord,
  expandEmailLog,
  buildCaptureRecord,
  buildOutcomeRecord,
  snippet,
  type EmailLogRow,
  type ReplyRow,
} from '@/lib/intel/export/records';

describe('idempotency-key builders', () => {
  it('produces the exact contract keys', () => {
    expect(replyKey('abc123')).toBe('reply:inmsg_abc123');
    expect(openKey(88213)).toBe('open:emlog_88213');
    expect(clickKey(88213)).toBe('click:emlog_88213');
    expect(bounceKey(88213)).toBe('bounce:emlog_88213');
    expect(micrositeKey('sess-9')).toBe('ms:sess-9');
    expect(captureKey(42)).toBe('cap:42');
    expect(outcomeKey('out-cuid')).toBe('out:out-cuid');
  });
});

describe('account_domain derivation', () => {
  it('emits the corporate domain from a corporate email', () => {
    expect(deriveAccountDomain('george.sebastian@pepsico.com')).toBe('pepsico.com');
    expect(deriveAccountDomain('jamie.taylor@kdrp.com')).toBe('kdrp.com');
  });

  it('omits free / consumer domains so clawd name-resolves', () => {
    expect(deriveAccountDomain('someone@gmail.com')).toBeUndefined();
    expect(deriveAccountDomain('someone@outlook.com')).toBeUndefined();
    expect(deriveAccountDomain('someone@yahoo.com')).toBeUndefined();
    expect(deriveAccountDomain('someone@icloud.com')).toBeUndefined();
  });

  it('omits on absent / malformed addresses', () => {
    expect(deriveAccountDomain(null)).toBeUndefined();
    expect(deriveAccountDomain(undefined)).toBeUndefined();
    expect(deriveAccountDomain('not-an-email')).toBeUndefined();
    expect(deriveAccountDomain('a@localhost')).toBeUndefined(); // no dot -> not a domain
  });

  it('lowercases and trims', () => {
    expect(emailDomain('  George@PepsiCo.com ')).toBe('pepsico.com');
  });
});

describe('keyset cursor encode/decode', () => {
  it('round-trips an (occurred_at, id) pair', () => {
    const at = new Date('2026-06-12T20:31:00.000Z');
    const c = encodeCursor(at, 88213);
    const decoded = decodeCursor(c);
    expect(decoded).toEqual({ occurredAt: '2026-06-12T20:31:00.000Z', id: '88213' });
  });

  it('is opaque base64 and stable for string ids', () => {
    const c = encodeCursor('2026-06-12T20:31:00.000Z', 'inmsg-x');
    expect(c).toBe(Buffer.from(JSON.stringify(['2026-06-12T20:31:00.000Z', 'inmsg-x']), 'utf8').toString('base64'));
    expect(decodeCursor(c)).toEqual({ occurredAt: '2026-06-12T20:31:00.000Z', id: 'inmsg-x' });
  });

  it('decodes null / garbage to null (fail-soft -> page from start)', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor('not-base64-!!!')).toBeNull();
    expect(decodeCursor(Buffer.from('{"a":1}', 'utf8').toString('base64'))).toBeNull();
  });
});

describe('snippet', () => {
  it('trims to 280 chars and drops empties', () => {
    expect(snippet(null)).toBeUndefined();
    expect(snippet('   ')).toBeUndefined();
    expect(snippet('hello')).toBe('hello');
    const long = 'x'.repeat(400);
    expect(snippet(long)?.length).toBe(280);
  });
});

describe('stream 1: replies record', () => {
  const baseRow: ReplyRow = {
    id: 'gmail-msg-1',
    received_at: new Date('2026-06-12T10:00:00.000Z'),
    from_email: 'george.sebastian@pepsico.com',
    from_name: 'George Sebastian',
    subject: 'Re: yards',
    body_text: 'Sounds good, can we meet Thursday?',
    snippet: 'Sounds good, can we meet Thursday?',
    thread_id: 'thread-1',
    thread: { account_name: 'PepsiCo', persona_email: 'george.sebastian@pepsico.com' },
  };

  it('builds the contract envelope with derived domain and no intent', () => {
    const rec = buildReplyRecord(baseRow);
    expect(rec.idempotency_key).toBe('reply:inmsg_gmail-msg-1');
    expect(rec.occurred_at).toBe('2026-06-12T10:00:00.000Z');
    expect(rec.account_name).toBe('PepsiCo');
    expect(rec.account_domain).toBe('pepsico.com');
    expect(rec.person_email).toBe('george.sebastian@pepsico.com');
    expect(rec.person_name).toBe('George Sebastian');
    expect(rec.subject).toBe('Re: yards');
    expect(rec.snippet).toBe('Sounds good, can we meet Thursday?');
    expect(rec.thread_id).toBe('thread-1');
    expect(rec.intent).toBeUndefined(); // modex has no classification column
  });

  it('omits account_domain for a free-domain sender but keeps account_name', () => {
    const rec = buildReplyRecord({
      ...baseRow,
      from_email: 'someguy@gmail.com',
      thread: { account_name: 'PepsiCo', persona_email: null },
    });
    expect(rec.account_domain).toBeUndefined();
    expect(rec.account_name).toBe('PepsiCo');
    expect(rec.person_email).toBe('someguy@gmail.com');
  });
});

describe('stream 2: email_logs column expansion', () => {
  const base: EmailLogRow = {
    id: 501,
    account_name: 'PepsiCo',
    to_email: 'george.sebastian@pepsico.com',
    persona_name: 'George Sebastian',
    campaign_tag: 'allentown-tour',
    status: 'opened',
    opened_at: null,
    clicked_at: null,
    delivered_at: null,
    bounce_type: null,
    metadata: null,
  };
  const fallback = new Date('2026-06-01T00:00:00.000Z');

  it('a row with opened_at + clicked_at set yields two records (open + click)', () => {
    const recs = expandEmailLog(
      {
        ...base,
        opened_at: new Date('2026-06-12T20:31:00.000Z'),
        clicked_at: new Date('2026-06-12T20:35:00.000Z'),
        metadata: { destination_url: 'https://yardflow.ai/for/pepsico' },
      },
      fallback,
    );
    expect(recs).toHaveLength(2);
    const [open, click] = recs;
    expect(open.idempotency_key).toBe('open:emlog_501');
    expect(open.event_type).toBe('open');
    expect(open.occurred_at).toBe('2026-06-12T20:31:00.000Z');
    expect(open.campaign_tag).toBe('allentown-tour');
    expect(open.account_domain).toBe('pepsico.com');
    expect(click.idempotency_key).toBe('click:emlog_501');
    expect(click.event_type).toBe('click');
    expect(click.occurred_at).toBe('2026-06-12T20:35:00.000Z');
    expect(click.destination_url).toBe('https://yardflow.ai/for/pepsico');
  });

  it('a bounce yields one record', () => {
    const recs = expandEmailLog(
      { ...base, status: 'bounced', bounce_type: 'hard', delivered_at: new Date('2026-06-10T09:00:00.000Z') },
      fallback,
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].idempotency_key).toBe('bounce:emlog_501');
    expect(recs[0].event_type).toBe('bounce');
    expect(recs[0].bounce_type).toBe('hard');
    expect(recs[0].occurred_at).toBe('2026-06-10T09:00:00.000Z');
  });

  it('a bounce with no delivered_at uses the fallback occurred_at', () => {
    const recs = expandEmailLog({ ...base, status: 'bounced', bounce_type: 'soft' }, fallback);
    expect(recs).toHaveLength(1);
    expect(recs[0].occurred_at).toBe(fallback.toISOString());
    expect(recs[0].bounce_type).toBe('soft');
  });

  it('a row with nothing set yields zero records (no reply emitted here)', () => {
    expect(expandEmailLog({ ...base, status: 'sent' }, fallback)).toHaveLength(0);
  });

  it('open without a campaign_tag omits the tag', () => {
    const recs = expandEmailLog(
      { ...base, campaign_tag: null, opened_at: new Date('2026-06-12T20:31:00.000Z') },
      fallback,
    );
    expect(recs[0].campaign_tag).toBeUndefined();
  });
});

describe('stream 4 + 5: captures and outcomes envelopes', () => {
  it('capture: name-resolved (no email), with scores', () => {
    const rec = buildCaptureRecord({
      id: 7,
      created_at: new Date('2026-06-05T12:00:00.000Z'),
      account_name: 'NFI',
      persona_name: 'Jane Ops',
      intent: 'evaluating',
      channel: 'booth',
      notes: 'Met at MODEX, wants ROI one-pager',
      interest: 4,
      urgency: 3,
      influence: 5,
      fit: 4,
      heat_score: 80,
    });
    expect(rec.idempotency_key).toBe('cap:7');
    expect(rec.account_name).toBe('NFI');
    expect(rec.account_domain).toBeUndefined(); // no email on captures
    expect(rec.person_email).toBeUndefined();
    expect(rec.heat_score).toBe(80);
    expect(rec.channel).toBe('booth');
  });

  it('outcome: account-resolved, carries label + source', () => {
    const rec = buildOutcomeRecord({
      id: 'oc-1',
      created_at: new Date('2026-06-06T12:00:00.000Z'),
      account_name: 'Boston Beer',
      outcome_label: 'closed-won',
      source_kind: 'email',
      source_id: 'emlog_501',
      created_by: 'casey',
    });
    expect(rec.idempotency_key).toBe('out:oc-1');
    expect(rec.outcome_label).toBe('closed-won');
    expect(rec.source_kind).toBe('email');
    expect(rec.source_id).toBe('emlog_501');
    expect(rec.created_by).toBe('casey');
  });
});

const findMany = vi.hoisted(() => ({
  inboundMessage: vi.fn(),
  emailLog: vi.fn(),
  micrositeEngagement: vi.fn(),
  mobileCapture: vi.fn(),
  operatorOutcome: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inboundMessage: { findMany: (...a: unknown[]) => findMany.inboundMessage(...a) },
    emailLog: { findMany: (...a: unknown[]) => findMany.emailLog(...a) },
    micrositeEngagement: { findMany: (...a: unknown[]) => findMany.micrositeEngagement(...a) },
    mobileCapture: { findMany: (...a: unknown[]) => findMany.mobileCapture(...a) },
    operatorOutcome: { findMany: (...a: unknown[]) => findMany.operatorOutcome(...a) },
  },
}));

describe('exportStream envelope (mocked prisma)', () => {
  beforeEach(() => {
    for (const fn of Object.values(findMany)) fn.mockReset();
  });

  it('replies stream returns the contract envelope, ascending, with nextCursor when full', async () => {
    const { exportStream } = await import('@/lib/intel/export/streams');
    findMany.inboundMessage.mockResolvedValue([
      {
        id: 'm1',
        received_at: new Date('2026-06-12T10:00:00.000Z'),
        from_email: 'g@pepsico.com',
        from_name: 'G',
        subject: 'Re: yards',
        body_text: 'hi',
        snippet: 'hi',
        thread_id: 't1',
        thread: { account_name: 'PepsiCo', persona_email: 'g@pepsico.com' },
      },
    ]);
    const env = await exportStream({ stream: 'replies', since: null, cursor: null, limit: 1 });
    expect(env.stream).toBe('replies');
    expect(env.items).toHaveLength(1);
    expect(env.items[0].idempotency_key).toBe('reply:inmsg_m1');
    expect(env.watermark).toBe('2026-06-12T10:00:00.000Z');
    expect(env.nextCursor).not.toBeNull(); // page was full (limit 1, 1 row)
    expect(decodeCursor(env.nextCursor)).toEqual({ occurredAt: '2026-06-12T10:00:00.000Z', id: 'm1' });
  });

  it('email_events expands rows; partial page -> nextCursor null', async () => {
    const { exportStream } = await import('@/lib/intel/export/streams');
    findMany.emailLog.mockResolvedValue([
      {
        id: 9,
        account_name: 'PepsiCo',
        to_email: 'g@pepsico.com',
        persona_name: 'G',
        campaign_tag: 'tag',
        status: 'opened',
        opened_at: new Date('2026-06-12T20:00:00.000Z'),
        clicked_at: new Date('2026-06-12T20:05:00.000Z'),
        delivered_at: null,
        bounce_type: null,
        metadata: null,
        sent_at: new Date('2026-06-11T08:00:00.000Z'),
      },
    ]);
    const env = await exportStream({ stream: 'email_events', since: null, cursor: null, limit: 500 });
    expect(env.stream).toBe('email_events');
    expect(env.items).toHaveLength(2); // open + click
    expect(env.nextCursor).toBeNull(); // 1 row < limit 500
    expect(env.watermark).toBe('2026-06-12T20:05:00.000Z'); // max occurred_at across events
  });

  it('empty batch -> items [], nextCursor null, watermark = since', async () => {
    const { exportStream } = await import('@/lib/intel/export/streams');
    findMany.operatorOutcome.mockResolvedValue([]);
    const env = await exportStream({
      stream: 'outcomes',
      since: '2026-06-01T00:00:00.000Z',
      cursor: null,
      limit: 500,
    });
    expect(env.items).toEqual([]);
    expect(env.nextCursor).toBeNull();
    expect(env.watermark).toBe('2026-06-01T00:00:00.000Z');
  });

  it('unknown stream -> 200 empty envelope', async () => {
    const { exportStream } = await import('@/lib/intel/export/streams');
    const env = await exportStream({ stream: 'bogus', since: null, cursor: null, limit: 500 });
    expect(env.stream).toBe('bogus');
    expect(env.items).toEqual([]);
    expect(env.nextCursor).toBeNull();
  });

  it('fails soft to an empty envelope on a prisma error', async () => {
    const { exportStream } = await import('@/lib/intel/export/streams');
    findMany.mobileCapture.mockRejectedValue(new Error('db down'));
    const env = await exportStream({ stream: 'captures', since: '2026-06-01T00:00:00.000Z', cursor: null, limit: 10 });
    expect(env.items).toEqual([]);
    expect(env.nextCursor).toBeNull();
    expect(env.watermark).toBe('2026-06-01T00:00:00.000Z');
  });
});
