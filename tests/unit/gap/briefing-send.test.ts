// @vitest-environment node
/**
 * X05b (GAP OS sales execution engine, 2026-10-08): sending the morning briefing, once. The hourly cron tick calls
 * `sendMorningBriefing`: it skips in words when no address is configured or the New York hour has not come; it
 * claims the day (SystemConfig `gap:briefing:<day>`, the key is the primary key) BEFORE sending so a double-fired
 * tick or a second instance never mails twice; a failed send records `briefing.failed`, releases the claim so the
 * next tick retries, and after BRIEFING_MAX_ATTEMPTS stops (`abandoned`, visible on health); before any retry it
 * checks Sent for that day's briefing to the recipient and, when Gmail's answer was lost but the mail went, records
 * `briefing.sent` from Sent and sends nothing (the unknown-send pattern); the send goes from the GAP identity as an
 * internal OPERATOR_ALERT with Reply-To the GAP mailbox and an Auto-Submitted header, never through sendEmail (which
 * logs to HubSpot); the plan it mails is the day snapshot (X04), planned if absent.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { BRIEFING_MAX_ATTEMPTS, BRIEFING_SENT, BRIEFING_FAILED, briefingClaimKey, sendMorningBriefing } from '@/lib/gap/work/briefing-send';
import { DAY_PLANNED } from '@/lib/gap/work/plan';
import type { WorkDay } from '@/lib/gap/work/list';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-08T12:30:00Z'); // 8:30 am New York
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: 'casey@freightroll.com', briefingHourNy: 7, commandSenders: ['casey@freightroll.com'], mode: 'review', targets: {} };
const DAY: WorkDay = {
  cards: [{ accountName: 'PepsiCo', href: '/gap/accounts/pepsico', lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'A prepared first touch', person: { name: 'Karen', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-1' }, blocker: null, index: 0, source: 'pursuit', tier: 'ready' }],
  waiting: [],
  snoozed: [],
  counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 },
};

function harness(over: { settings?: Partial<SellerSettings>; sendImpl?: () => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>; sent?: Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }> } = {}) {
  const db = ledgerDb({}, NOW);
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(over.sendImpl ?? (async () => ({ provider: 'gmail' as const, id: 'gm-1', threadId: 'th-1' })));
  const listSent = vi.fn(async () => over.sent ?? []);
  const load = vi.fn(async () => DAY);
  const run = (now = NOW, extra: { resend?: boolean } = {}) =>
    sendMorningBriefing(db.client(), { now, settings: { ...SETTINGS, ...over.settings }, sender: SENDER, baseUrl: 'https://app.example', actionSecret: 'secret', commandsEnabled: false, legacyDigest: true, load, ...extra }, { send, listSent });
  return { db, send, listSent, load, run };
}

describe('X05b: sendMorningBriefing', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('skips in words with no briefing address, and before the configured New York hour', async () => {
    const a = harness({ settings: { briefingTo: null } });
    expect(await a.run()).toMatchObject({ skipped: true, reason: 'no_briefing_address' });
    expect(a.send).not.toHaveBeenCalled();
    const b = harness({ settings: { briefingHourNy: 9 } });
    expect(await b.run()).toMatchObject({ skipped: true, reason: 'before_hour', hourNy: 8 });
    expect(b.send).not.toHaveBeenCalled();
    expect(b.db.store.systemConfig).toHaveLength(0);
  });

  it('plans the day if absent, claims it, sends once from the GAP identity as an internal message, records briefing.sent; a second tick the same day skips', async () => {
    const h = harness();
    const r = await h.run();
    expect(r).toMatchObject({ sent: true, day: '2026-10-08', to: 'casey@freightroll.com', gmailMessageId: 'gm-1', items: 1 });
    expect(h.load).toHaveBeenCalledTimes(1);
    expect(h.db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED)).toHaveLength(1);
    expect(h.send).toHaveBeenCalledTimes(1);
    const payload = h.send.mock.calls[0][0];
    expect(payload).toMatchObject({ to: 'casey@freightroll.com', sender: SENDER, purpose: 'OPERATOR_ALERT', replyTo: 'casey@yardflow.ai' });
    expect(payload.headers).toMatchObject({ 'Auto-Submitted': 'auto-generated' });
    // C31: the count names its basis (the plan items START and NEXT walk).
    expect(payload.subject).toMatch(/^GAP today, Thu Oct 8: 1 to execute \[GAP#[a-f0-9]{24}\]$/);
    expect(payload.text).toContain('1. PepsiCo: Ready for a first touch. Karen. A prepared first touch.');
    expect(payload.text).toContain('https://app.example/gap/start?t=');
    expect(payload.text).toContain('https://app.example/gap/item?t=');
    const sent = h.db.store.gapAuditEvent.filter((e) => e.kind === BRIEFING_SENT);
    expect(sent).toHaveLength(1);
    expect(sent[0].subject_id).toBe('2026-10-08');
    expect(sent[0].payload).toMatchObject({ to: 'casey@freightroll.com', gmailMessageId: 'gm-1', gmailThreadId: 'th-1', items: 1 });
    expect(sent[0].payload.dayToken).toMatch(/^[a-f0-9]{24}$/);
    expect(h.db.store.systemConfig.map((c) => c.key)).toEqual([briefingClaimKey('2026-10-08')]);

    const again = await h.run(new Date('2026-10-08T13:30:00Z'));
    expect(again).toMatchObject({ skipped: true, reason: 'already_sent' });
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.load).toHaveBeenCalledTimes(1);
  });

  it('X22: an explicit resend sends again the same day (past already_sent, past the hour, no claim), records briefing.sent with resend true, and the ordinary tick after it still skips', async () => {
    const h = harness();
    expect(await h.run()).toMatchObject({ sent: true });
    expect(await h.run()).toMatchObject({ skipped: true, reason: 'already_sent' });
    const again = await h.run(new Date('2026-10-08T10:00:00Z'), { resend: true }); // 6 am New York, before the hour
    expect(again).toMatchObject({ sent: true, day: '2026-10-08', gmailMessageId: 'gm-1' });
    expect(h.send).toHaveBeenCalledTimes(2);
    const rows = h.db.store.gapAuditEvent.filter((e) => e.kind === 'briefing.sent');
    expect(rows).toHaveLength(2);
    expect(rows[1].payload).toMatchObject({ resend: true });
    expect(await h.run()).toMatchObject({ skipped: true, reason: 'already_sent' });
  });

  it('the claim is taken BEFORE the send: another instance mid-send holds it, so this tick sends nothing and skips', async () => {
    const h = harness();
    await h.db.client().systemConfig.create({ data: { key: briefingClaimKey('2026-10-08'), value: '{"claimedAt":"2026-10-08T12:29:58Z"}' } });
    expect(await h.run()).toMatchObject({ skipped: true, reason: 'already_sent' });
    expect(h.send).not.toHaveBeenCalled();
    expect(h.db.store.gapAuditEvent.filter((e) => e.kind === BRIEFING_SENT)).toHaveLength(0);
  });

  it('a failed send records briefing.failed, releases the claim, and the next tick retries; after the limit it is abandoned', async () => {
    let calls = 0;
    const h = harness({ sendImpl: async () => { calls += 1; throw new Error('gmail 503'); } });
    await expect(h.run()).rejects.toThrow('gmail 503');
    expect(h.db.store.gapAuditEvent.filter((e) => e.kind === BRIEFING_FAILED)).toHaveLength(1);
    expect(h.db.store.systemConfig).toHaveLength(0);
    await expect(h.run(new Date('2026-10-08T13:30:00Z'))).rejects.toThrow('gmail 503');
    await expect(h.run(new Date('2026-10-08T14:30:00Z'))).rejects.toThrow('gmail 503');
    expect(calls).toBe(BRIEFING_MAX_ATTEMPTS);
    const r = await h.run(new Date('2026-10-08T15:30:00Z'));
    expect(r).toMatchObject({ skipped: true, reason: 'abandoned', attempts: BRIEFING_MAX_ATTEMPTS });
    expect(calls).toBe(BRIEFING_MAX_ATTEMPTS);
    expect(h.listSent).toHaveBeenCalled();
  });

  it('a lost Gmail answer: before a retry, Sent shows the day\'s briefing to the recipient, so it is recorded from Sent and nothing is sent again', async () => {
    const h = harness({ sendImpl: async () => { throw new Error('socket hang up'); } });
    await expect(h.run()).rejects.toThrow('socket hang up');
    h.listSent.mockResolvedValue([{ id: 'gm-lost', threadId: 'th-lost', internalDate: new Date('2026-10-08T12:30:05Z'), to: 'casey@freightroll.com', subject: 'GAP today, Thu Oct 8: 1 to execute [GAP#abc]' }]);
    const r = await h.run(new Date('2026-10-08T13:30:00Z'));
    expect(r).toMatchObject({ sent: true, recoveredFromSent: true, gmailMessageId: 'gm-lost' });
    expect(h.send).toHaveBeenCalledTimes(1);
    const sent = h.db.store.gapAuditEvent.filter((e) => e.kind === BRIEFING_SENT);
    expect(sent).toHaveLength(1);
    expect(sent[0].payload).toMatchObject({ recoveredFromSent: true, gmailMessageId: 'gm-lost' });
    expect(h.db.store.systemConfig.map((c) => c.key)).toEqual([briefingClaimKey('2026-10-08')]);
    expect(await h.run(new Date('2026-10-08T14:30:00Z'))).toMatchObject({ skipped: true, reason: 'already_sent' });
  });

  it('the Sent check never matches another day\'s briefing or another recipient', async () => {
    const h = harness({ sendImpl: async () => { throw new Error('x'); }, sent: [{ id: 'old', threadId: null, internalDate: new Date('2026-10-07T12:30:05Z'), to: 'casey@freightroll.com', subject: 'GAP today, Wed Oct 7: 2 need you [GAP#zzz]' }] });
    await expect(h.run()).rejects.toThrow('x');
    await expect(h.run(new Date('2026-10-08T13:30:00Z'))).rejects.toThrow('x');
    expect(h.db.store.gapAuditEvent.filter((e) => e.kind === BRIEFING_SENT)).toHaveLength(0);
  });
});
