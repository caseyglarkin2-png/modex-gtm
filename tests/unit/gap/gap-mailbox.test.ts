/**
 * Red team T9: the GAP mailbox (casey@yardflow.ai) as execution feedback.
 * Fixtures: hard DSN, soft DSN, OOO, direct buyer reply, colleague reply in
 * the thread, account-domain reply outside the thread, duplicate poll,
 * unrelated inbox mail, and a bounce that is never a reply.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyMailboxMessage, loadGapSendContext, parseDsn, pollGapMailbox, GAP_MAILBOX_WATERMARK_KEY, MAILBOX_OVERLAP_SECONDS } from '@/lib/gap/replies/gap-mailbox';
import { recordHardBounce } from '@/lib/email/bounce';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import { MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { findFirstFrom, findManyFrom, matchesWhere } from './fixtures/where';

const MAILBOX = 'casey@yardflow.ai';
const JOEY = 'joey.maggard@kroger.com';
const SENT_AT = new Date('2026-09-25T20:59:19Z');
const NOW = new Date('2026-09-27T12:00:00Z');

function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  return {
    id: 'm1',
    threadId: 'thr-joey',
    rfcMessageId: '<x@mail>',
    fromEmail: JOEY,
    fromName: 'Joey Maggard',
    subject: 'Re: doors versus spots',
    snippet: 'We do have a lot of that at Delaware.',
    bodyText: 'We do have a lot of that at Delaware. Who else is dealing with it?',
    rawText: 'We do have a lot of that at Delaware. Who else is dealing with it?',
    bodyHtml: '',
    deliveryStatus: null,
    labelIds: ['INBOX'],
    receivedAt: new Date('2026-09-26T15:00:00Z'),
    headers: {},
    ...over,
  };
}

const HARD_DSN = msg({
  id: 'dsn1',
  threadId: 'thr-nobody',
  fromEmail: 'mailer-daemon@googlemail.com',
  fromName: 'Mail Delivery Subsystem',
  subject: 'Delivery Status Notification (Failure)',
  headers: { 'Content-Type': 'multipart/report; report-type=delivery-status; boundary=x', 'X-Failed-Recipients': 'nobody.here@kroger.com' },
  deliveryStatus: 'Reporting-MTA: dns; googlemail.com\n\nFinal-Recipient: rfc822; nobody.here@kroger.com\nAction: failed\nStatus: 5.1.1\nDiagnostic-Code: smtp; 550 5.1.1 The email account that you tried to reach does not exist.',
  rawText: "Address not found. Your message wasn't delivered to nobody.here@kroger.com because the address couldn't be found.",
  bodyText: '',
});

function world() {
  const t = {
    audit: [
      { id: 'a0', kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec-a', created_at: SENT_AT, payload: { engine: 'manual', personaId: 1886, recipient: JOEY, stepIndex: 0, gmailSentMessageId: 'g0', gmailThreadId: 'thr-joey', sentAt: SENT_AT.toISOString(), senderIdentity: MAILBOX } },
      { id: 'a1', kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec-b', created_at: SENT_AT, payload: { engine: 'manual', personaId: 77, recipient: 'nobody.here@kroger.com', stepIndex: 0, gmailSentMessageId: 'g1', gmailThreadId: 'thr-nobody', sentAt: SENT_AT.toISOString(), senderIdentity: MAILBOX } },
    ] as any[],
    inbound: [] as any[],
    threads: [] as any[],
    notes: [] as any[],
    config: [] as any[],
    personas: [
      { id: 1886, email: JOEY, email_status: 'unverified', do_not_contact: false },
      { id: 77, email: 'Nobody.Here@kroger.com', email_status: 'unverified', do_not_contact: false },
    ] as any[],
    logs: [
      { id: 1, to_email: 'nobody.here@kroger.com', status: 'sent', thread_id: 'thr-nobody' },
      // S7: an older, unrelated send to the same address keeps its own history.
      { id: 2, to_email: 'nobody.here@kroger.com', status: 'opened', thread_id: 'thr-2025' },
    ] as any[],
  };
  let n = 0;
  const prisma: any = {
    gapAuditEvent: {
      findMany: vi.fn(async (args: any) => findManyFrom(t.audit, args)),
      findFirst: vi.fn(async (args: any) => findFirstFrom(t.audit, args)),
      count: vi.fn(async (args: any) => findManyFrom(t.audit, args).length),
      create: vi.fn(async ({ data }: any) => {
        t.audit.push({ id: `e${++n}`, created_at: NOW, ...data });
        return { id: `e${n}` };
      }),
    },
    inboundMessage: {
      findUnique: vi.fn(async ({ where }: any) => t.inbound.find((x) => x.id === where.id) ?? null),
      create: vi.fn(async ({ data }: any) => {
        t.inbound.push(data);
        return data;
      }),
    },
    emailThread: { upsert: vi.fn(async ({ where, create }: any) => (t.threads.find((x) => x.id === where.id) ?? (t.threads.push(create), create))) },
    notification: {
      findFirst: vi.fn(async (args: any) => findFirstFrom(t.notes, args)),
      create: vi.fn(async ({ data }: any) => {
        t.notes.push(data);
        return data;
      }),
    },
    systemConfig: {
      findUnique: vi.fn(async ({ where }: any) => t.config.find((c) => c.key === where.key) ?? null),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const c = t.config.find((x) => x.key === where.key);
        if (c) Object.assign(c, update);
        else t.config.push({ ...create });
      }),
    },
    persona: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const hit = t.personas.filter((p) => matchesWhere(p, where));
        hit.forEach((p) => Object.assign(p, data));
        return { count: hit.length };
      }),
    },
    emailLog: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const hit = t.logs.filter((p) => matchesWhere(p, where));
        hit.forEach((p) => Object.assign(p, data));
        return { count: hit.length };
      }),
    },
  };
  return { t, prisma };
}

const ingest = vi.fn(async () => ({ action: 'paused' }) as never);
beforeEach(() => ingest.mockClear());

const poll = (prisma: any, messages: MailboxMessage[]) =>
  pollGapMailbox(prisma, { now: NOW }, { list: async () => messages, mailbox: MAILBOX, ingest: ingest as never, bounce: recordHardBounce });

describe('parseDsn', () => {
  it('a Gmail hard bounce: failed, 5.1.1, the failed recipient', () => {
    expect(parseDsn(HARD_DSN)).toEqual({ action: 'failed', status: '5.1.1', recipients: ['nobody.here@kroger.com'], dsnClass: 'hard', hard: true });
  });
  it('a delayed (4.x) notice is soft', () => {
    const soft = { ...HARD_DSN, headers: { 'Content-Type': 'multipart/report; report-type=delivery-status' }, rawText: 'Delivery incomplete. Gmail will retry.', deliveryStatus: 'Final-Recipient: rfc822; slow@kroger.com\nAction: delayed\nStatus: 4.4.1' };
    expect(parseDsn(soft)).toMatchObject({ hard: false, status: '4.4.1', recipients: ['slow@kroger.com'] });
  });
  it('a normal reply is not a DSN', () => {
    expect(parseDsn(msg())).toBeNull();
  });
});

describe('pollGapMailbox', () => {
  it('HARD DSN -> the canonical bad-address truth (hard_bounce + DNC + EmailLog bounced + notification), never a reply', async () => {
    const { t, prisma } = world();
    const r = await poll(prisma, [HARD_DSN]);
    expect(r).toMatchObject({ hardBounces: 1, replies: 0, inboundMessagesCreated: 0, bouncedAddresses: ['nobody.here@kroger.com'] });
    expect(t.personas.find((p) => p.id === 77)).toMatchObject({ email_status: 'hard_bounce', do_not_contact: true });
    expect(t.logs[0]).toMatchObject({ status: 'bounced', bounce_type: 'hard' });
    expect(t.logs[1]).toMatchObject({ status: 'opened' });
    expect(t.logs[1].bounce_type).toBeUndefined();
    expect(t.notes.filter((x) => x.type === 'bounce')).toHaveLength(1);
    expect(t.inbound).toHaveLength(0);
    expect(ingest).not.toHaveBeenCalled();
  });

  it('OOO auto-reply in the GAP thread -> audited only: no InboundMessage, no pause, no buyer truth', async () => {
    const { t, prisma } = world();
    const ooo = msg({ id: 'ooo1', subject: 'Automatic reply: doors versus spots', headers: { 'Auto-Submitted': 'auto-replied' }, bodyText: 'I am out of the office until Monday.' });
    const r = await poll(prisma, [ooo]);
    expect(r).toMatchObject({ autoReplies: 1, replies: 0, inboundMessagesCreated: 0 });
    expect(t.inbound).toHaveLength(0);
    expect(ingest).not.toHaveBeenCalled();
  });

  it('direct buyer reply in the GAP thread -> an InboundMessage, a reply notification, the enrollment paused', async () => {
    const { t, prisma } = world();
    const r = await poll(prisma, [msg()]);
    expect(r).toMatchObject({ replies: 1, inboundMessagesCreated: 1 });
    expect(t.inbound[0]).toMatchObject({ id: 'm1', from_email: JOEY, thread_id: 'thr-joey' });
    expect(t.notes.filter((x) => x.type === 'reply')).toHaveLength(1);
    expect(ingest).toHaveBeenCalledWith(prisma, expect.objectContaining({ contactEmail: JOEY, isAutoresponder: false }));
    expect(t.audit.find((a) => a.kind === 'mailbox.reply')!.payload).toMatchObject({ attribution: 'gap_thread', personaIds: [1886] });
  });

  it('a colleague replying IN the thread holds the GAP-emailed person too', async () => {
    const { prisma } = world();
    await poll(prisma, [msg({ id: 'c1', fromEmail: 'pat.lee@kroger.com', fromName: 'Pat Lee' })]);
    const contacts = ingest.mock.calls.map((c: any[]) => c[1].contactEmail).sort();
    expect(contacts).toEqual([JOEY, 'pat.lee@kroger.com']);
  });

  it('a colleague at the account domain replying OUTSIDE the thread, after the first send, is attributed (account_domain)', async () => {
    const { t, prisma } = world();
    const r = await poll(prisma, [msg({ id: 'c2', threadId: 'thr-new', fromEmail: 'pat.lee@kroger.com', subject: 'Saw your note to Joey' })]);
    expect(r.replies).toBe(1);
    expect(t.audit.find((a) => a.kind === 'mailbox.reply')!.payload).toMatchObject({ attribution: 'account_domain' });
  });

  it('unrelated inbox mail (not a GAP thread, not an emailed account) is ignored and not stored', async () => {
    const { t, prisma } = world();
    const r = await poll(prisma, [msg({ id: 'u1', threadId: 'thr-other', fromEmail: 'newsletter@vendor.example', subject: 'Webinar' })]);
    expect(r).toMatchObject({ unrelated: 1, replies: 0, inboundMessagesCreated: 0 });
    expect(t.inbound).toHaveLength(0);
    expect(t.audit.filter((a) => String(a.kind).startsWith('mailbox.'))).toHaveLength(0);
  });

  it('a duplicate poll (overlapping window) handles each message once', async () => {
    const { t, prisma } = world();
    await poll(prisma, [msg(), HARD_DSN]);
    const again = await poll(prisma, [msg(), HARD_DSN]);
    expect(again).toMatchObject({ alreadyHandled: 2, replies: 0, hardBounces: 0 });
    expect(t.inbound).toHaveLength(1);
    expect(t.notes.filter((x) => x.type === 'bounce')).toHaveLength(1);
  });

  it('the watermark advances to the newest handled message and the next read overlaps it', async () => {
    const { t, prisma } = world();
    await poll(prisma, [msg()]);
    const wm = Number(t.config.find((c) => c.key === GAP_MAILBOX_WATERMARK_KEY)!.value);
    expect(wm).toBe(Math.floor(new Date('2026-09-26T15:00:00Z').getTime() / 1000));
    const list = vi.fn(async () => [] as MailboxMessage[]);
    await pollGapMailbox(prisma, { now: NOW }, { list, mailbox: MAILBOX, ingest: ingest as never });
    expect(list).toHaveBeenCalledWith(wm - MAILBOX_OVERLAP_SECONDS);
  });

  it('an unreadable mailbox throws and the watermark does not move', async () => {
    const { t, prisma } = world();
    await expect(pollGapMailbox(prisma, { now: NOW }, { list: async () => { throw new Error('Gmail mailbox list failed (503)'); }, mailbox: MAILBOX })).rejects.toThrow('503');
    expect(t.config).toHaveLength(0);
  });

  it('our own sent copies are never replies', async () => {
    const { prisma } = world();
    const r = await poll(prisma, [msg({ id: 'own1', fromEmail: MAILBOX })]);
    expect(r).toMatchObject({ own: 1, replies: 0 });
  });
});

describe('attribution context', () => {
  it('a reply from a consumer domain that is not in a GAP thread is unrelated (a shared domain says nothing about the account)', async () => {
    const { prisma } = world();
    const ctx = await loadGapSendContext(prisma);
    expect(classifyMailboxMessage(msg({ threadId: 'x', fromEmail: 'someone@gmail.com' }), ctx, MAILBOX)).toMatchObject({ kind: 'unrelated' });
  });
});

// ---------------------------------------------------------------------------
// Release C review (RevOps): B1, N1, N3, S2, S3, S4, S6
// ---------------------------------------------------------------------------

const dsnFor = (id: string, status: string | null, diagnostic: string, over: Partial<MailboxMessage> = {}) =>
  msg({
    id,
    threadId: 'thr-nobody',
    fromEmail: 'mailer-daemon@googlemail.com',
    subject: 'Delivery Status Notification (Failure)',
    headers: { 'Content-Type': 'multipart/report; report-type=delivery-status' },
    deliveryStatus: `Final-Recipient: rfc822; nobody.here@kroger.com\nAction: failed\n${status ? `Status: ${status}\n` : ''}Diagnostic-Code: smtp; ${diagnostic}`,
    rawText: diagnostic,
    snippet: '',
    bodyText: '',
    ...over,
  });

describe('B1: only a bad ADDRESS writes do-not-contact', () => {
  it.each([
    ['5.1.1', '550 5.1.1 user unknown', 'hard'],
    ['5.1.10', '550 5.1.10 RESOLVER.ADR.RecipientNotFound; Recipient not found by SMTP address lookup', 'hard'],
    ['5.0.0', '550 5.0.0 No such user here', 'hard'],
    ['5.7.1', '550 5.7.1 Message rejected due to local policy', 'policy'],
    ['5.7.26', '550 5.7.26 Unauthenticated email is not accepted from this domain', 'policy'],
    // A relay or policy denial phrased like a missing user is still a block about us, never a bad address.
    ['5.7.1', '550 5.7.1 Unrouteable address: user does not exist on this relay', 'policy'],
    ['5.4.1', '550 5.4.1 Recipient address rejected: user unknown in relay recipient table', 'policy'],
    ['5.4.1', '550 5.4.1 Recipient address rejected: Access denied', 'policy'],
    ['5.2.2', '552 5.2.2 The email account that you tried to reach is over quota', 'policy'],
    ['5.1.8', '553 5.1.8 Sender address rejected', 'policy'],
    ['5.0.0', '550 Rejected', 'policy'],
    [null, '550', 'policy'],
    [null, '550 unknown user', 'hard'],
    ['4.4.1', 'Connection timed out', 'soft'],
  ] as const)('status %s, "%s" -> %s', (status, diagnostic, cls) => {
    expect(parseDsn(dsnFor('d', status, diagnostic))!.dsnClass).toBe(cls);
  });

  it('a 5.7.x policy block is audited only: no hard_bounce, no DNC, no EmailLog change, no bounce notification', async () => {
    const { t, prisma } = world();
    const r = await poll(prisma, [dsnFor('pol1', '5.7.1', '550 5.7.1 Message rejected due to local policy')]);
    expect(r).toMatchObject({ hardBounces: 0, policyBounces: 1, bouncedAddresses: [] });
    expect(t.personas.find((p) => p.id === 77)).toMatchObject({ email_status: 'unverified', do_not_contact: false });
    expect(t.logs[0].status).toBe('sent');
    expect(t.notes).toHaveLength(0);
    expect(t.audit.find((a) => a.kind === 'mailbox.policy_bounce')!.payload).toMatchObject({ status: '5.7.1', dsnClass: 'policy', recipients: ['nobody.here@kroger.com'] });
  });

  it('an Exchange NDR ("Undeliverable:" from a MicrosoftExchange mailbox) is a DSN, never a reply', () => {
    const ndr = msg({
      id: 'x1',
      threadId: 'thr-nobody',
      fromEmail: 'MicrosoftExchange329e71ec88ae4615bbc36ab6ce41109e@kroger.com',
      subject: 'Undeliverable: Doors versus spots',
      headers: { 'X-Failed-Recipients': 'nobody.here@kroger.com' },
      rawText: 'Remote Server returned 550 5.1.10 RESOLVER.ADR.RecipNotFound; not found',
      bodyText: '',
    });
    expect(parseDsn(ndr)).toMatchObject({ dsnClass: 'hard', recipients: ['nobody.here@kroger.com'] });
  });
});

describe('N1 / N3: bounces act only on addresses GAP sent to', () => {
  it('a hard DSN for an address GAP never emailed is audited, never written', async () => {
    const { t, prisma } = world();
    const other = dsnFor('o1', '5.1.1', '550 5.1.1 user unknown', { deliveryStatus: 'Final-Recipient: rfc822; stranger@kroger.com\nAction: failed\nStatus: 5.1.1' });
    const r = await poll(prisma, [other]);
    expect(r).toMatchObject({ hardBounces: 0, unattributedBounces: 1, bouncedAddresses: [] });
    expect(t.personas.every((p) => p.do_not_contact === false)).toBe(true);
    expect(t.audit.find((a) => a.kind === 'mailbox.bounce_unattributed')!.payload).toMatchObject({ reason: 'not_a_gap_recipient', recipients: ['stranger@kroger.com'] });
  });

  it('a delivery notice with no parseable recipient is an intake error, not a quiet skip', async () => {
    const { prisma } = world();
    const r = await poll(prisma, [dsnFor('n1', '5.1.1', '550 5.1.1 user unknown', { deliveryStatus: 'Action: failed\nStatus: 5.1.1' })]);
    expect(r.errors).toEqual(['n1: delivery notice with no parseable recipient']);
    expect(r.unattributedBounces).toBe(1);
  });
});

describe('S3: exact sender before account domain', () => {
  it('a reply on a NEW thread from the exact address GAP emailed is attributed gap_recipient, to that person only', async () => {
    const { t, prisma } = world();
    await poll(prisma, [msg({ id: 'r1', threadId: 'thr-fresh', subject: 'Following up on your note' })]);
    const p = t.audit.find((a) => a.kind === 'mailbox.reply')!.payload;
    expect(p).toMatchObject({ attribution: 'gap_recipient', recipients: [JOEY], personaIds: [1886] });
  });
});

describe('S6: localized out-of-office subjects', () => {
  it.each([
    'Abwesenheitsnotiz: Doors versus spots',
    'Réponse automatique : Doors',
    'Respuesta automática: Doors',
    'Fuera de la oficina',
    'Automatisch antwoord: Doors',
  ])('"%s" is an auto reply, never a stop', async (subject) => {
    const { t, prisma } = world();
    const r = await poll(prisma, [msg({ id: `ooo-${subject.length}`, subject, bodyText: 'Back on Monday.' })]);
    expect(r).toMatchObject({ autoReplies: 1, replies: 0 });
    expect(t.inbound).toHaveLength(0);
    expect(ingest).not.toHaveBeenCalled();
  });
});

describe('S2: a poison message never halts intake silently', () => {
  it('fails, is retried under the cap (watermark held before it), then quarantined and passed', async () => {
    const { t, prisma } = world();
    const poison = msg({ id: 'p1', receivedAt: new Date('2026-09-26T14:00:00Z') });
    const boom = vi.fn(async () => {
      throw new Error('db timeout');
    });
    const run = () => pollGapMailbox(prisma, { now: NOW }, { list: async () => [poison], mailbox: MAILBOX, ingest: boom as never });
    const r1 = await run();
    expect(r1.errors[0]).toContain('p1: db timeout');
    expect(r1.quarantined).toBe(0);
    expect(t.config).toHaveLength(0);
    const r2 = await run();
    expect(r2.quarantined).toBe(0);
    const r3 = await run();
    expect(r3.quarantined).toBe(1);
    expect(t.audit.filter((a) => a.kind === 'mailbox.quarantined').map((a) => a.subject_id)).toEqual(['p1']);
    expect(Number(t.config.find((c) => c.key === GAP_MAILBOX_WATERMARK_KEY)!.value)).toBe(Math.floor(poison.receivedAt.getTime() / 1000));
    // Quarantined is handled: the next run passes it without retrying.
    const r4 = await run();
    expect(r4).toMatchObject({ alreadyHandled: 1, errors: [] });
  });
});

describe('S4: a reply that arrives before its send is recorded is not lost', () => {
  it('young unrelated mail holds the watermark; once the send lands it is re-read and becomes a reply', async () => {
    const { t, prisma } = world();
    const early = msg({ id: 'early1', threadId: 'thr-late', fromEmail: 'sam.ng@acme-foods.com', receivedAt: new Date('2026-09-27T09:00:00Z') });
    const later = msg({ id: 'later1', threadId: 'thr-other', fromEmail: 'newsletter@vendor.example', receivedAt: new Date('2026-09-27T11:00:00Z') });
    const r1 = await poll(prisma, [early, later]);
    expect(r1).toMatchObject({ unrelated: 2, held: 2 });
    const wm = Number(t.config.find((c) => c.key === GAP_MAILBOX_WATERMARK_KEY)!.value);
    expect(wm).toBeLessThan(Math.floor(early.receivedAt.getTime() / 1000));
    // The send is recorded late.
    t.audit.push({ id: 'late', kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec-c', created_at: NOW, payload: { personaId: 5, recipient: 'sam.ng@acme-foods.com', gmailThreadId: 'thr-late', sentAt: '2026-09-27T08:00:00Z' } });
    const list = vi.fn(async () => [early, later]);
    const r2 = await pollGapMailbox(prisma, { now: NOW }, { list, mailbox: MAILBOX, ingest: ingest as never });
    expect(list).toHaveBeenCalledWith(wm - MAILBOX_OVERLAP_SECONDS);
    expect(r2.replies).toBe(1);
  });

  it('old unrelated mail does not hold the watermark', async () => {
    const { t, prisma } = world();
    await poll(prisma, [msg({ id: 'u-old', threadId: 'thr-other', fromEmail: 'newsletter@vendor.example', receivedAt: new Date('2026-09-25T09:00:00Z') })]);
    expect(Number(t.config.find((c) => c.key === GAP_MAILBOX_WATERMARK_KEY)!.value)).toBe(Math.floor(new Date('2026-09-25T09:00:00Z').getTime() / 1000));
  });
});
