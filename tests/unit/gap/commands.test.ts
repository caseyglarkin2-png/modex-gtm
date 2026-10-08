/**
 * X07a (GAP OS sales execution engine, 2026-10-08): email commands, judged. A reply from the seller to a GAP
 * assignment or briefing becomes a `command` verdict in the GAP mailbox cron BEFORE `own` and before attribution
 * (the review's B6). Pinned, all pure:
 *   - the parser reads the first non-quoted line: APPROVE, REVISE: words (the rest of the body is the critique),
 *     SKIP [reason], DEFER [when], DONE: what happened, NEXT, HELP, START; a line of sentence length that is none of
 *     these is REVISE with the body as the critique; a short unknown line is `unknown` (one HELP reply, nothing runs)
 *   - authentication (the review's B5): the sender must be a configured command sender; the message must sit in the
 *     Gmail thread of a recorded assignment or briefing (or name its message id in In-Reply-To / References); Gmail's
 *     Authentication-Results must show DMARC pass aligned to the From domain; an auto-submitted or bulk message, and a
 *     forward, are refused; each refusal names its reason and nothing runs
 *   - a reply with no text part falls back to its HTML
 *   - classifyMailboxMessage says `command` first: a self-addressed reply from a command sender is never `own`
 */
import { describe, expect, it } from 'vitest';
import { authenticateCommand, commandTextOf, parseCommand, type CommandContext } from '@/lib/gap/replies/commands';
import { classifyMailboxMessage, type GapSendContext } from '@/lib/gap/replies/gap-mailbox';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';

const MAILBOX = 'casey@yardflow.ai';
const SELLER = 'casey@freightroll.com';
const AUTH_OK = 'mx.google.com; dkim=pass header.i=@freightroll-com.20230601.gappssmtp.com; spf=pass (google.com: domain of casey@freightroll.com designates 209.85.1.1 as permitted sender) smtp.mailfrom=casey@freightroll.com; dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=freightroll.com';

function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  return {
    id: 'cmd-1',
    threadId: 'th-assign-1',
    rfcMessageId: '<cmd-1@mail>',
    fromEmail: SELLER,
    fromName: 'Casey Larkin',
    subject: 'Re: GAP 1 of 2, PepsiCo: Ready for a first touch [GAP#aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.0]',
    snippet: 'APPROVE',
    bodyText: 'APPROVE',
    rawText: 'APPROVE\n\nOn Thu, Oct 8, 2026 GAP wrote:\n> PepsiCo: Karen Ortiz.',
    bodyHtml: '',
    deliveryStatus: null,
    labelIds: ['INBOX'],
    receivedAt: new Date('2026-10-08T14:00:00Z'),
    headers: { 'Authentication-Results': AUTH_OK, 'In-Reply-To': '<assign-1@mail.gmail.com>' },
    ...over,
  };
}

const CTX: CommandContext = {
  senders: [SELLER],
  assignmentsByThread: new Map([['th-assign-1', { itemKey: 'first_touch:dec-1', itemToken: 'a'.repeat(32), revision: 0, contentHash: 'hash-1', day: '2026-10-08' }]]),
  assignmentsByMessageId: new Map([['<assign-1@mail.gmail.com>', { itemKey: 'first_touch:dec-1', itemToken: 'a'.repeat(32), revision: 0, contentHash: 'hash-1', day: '2026-10-08' }]]),
  briefingsByThread: new Map([['th-brief-1', { day: '2026-10-08', dayToken: 'day0token' }]]),
};

describe('X07a: parseCommand', () => {
  it('reads the command on the first line and keeps its words', () => {
    expect(parseCommand('APPROVE')).toEqual({ kind: 'approve' });
    expect(parseCommand('approve.\n\nthanks')).toEqual({ kind: 'approve' });
    expect(parseCommand('REVISE: too generic. Find a specific operational reason for Karen to care.\nAnd shorter.')).toEqual({ kind: 'revise', text: 'too generic. Find a specific operational reason for Karen to care.\nAnd shorter.' });
    expect(parseCommand('Revise - make it about the Tulsa gate')).toEqual({ kind: 'revise', text: 'make it about the Tulsa gate' });
    expect(parseCommand('SKIP')).toEqual({ kind: 'skip', reason: null });
    expect(parseCommand('skip, wrong person')).toEqual({ kind: 'skip', reason: 'wrong person' });
    expect(parseCommand('DEFER')).toEqual({ kind: 'defer', when: null });
    expect(parseCommand('Defer until next Tuesday')).toEqual({ kind: 'defer', when: 'until next Tuesday' });
    expect(parseCommand('DONE: called Joey, he wants the comparison Friday')).toEqual({ kind: 'done', note: 'called Joey, he wants the comparison Friday' });
    expect(parseCommand('done')).toEqual({ kind: 'done', note: null });
    expect(parseCommand('NEXT')).toEqual({ kind: 'next' });
    expect(parseCommand('Help?')).toEqual({ kind: 'help' });
    expect(parseCommand('START')).toEqual({ kind: 'start' });
  });

  it('a sentence-length line that is no command is a revision request with the body as the critique; a short unknown line is unknown', () => {
    expect(parseCommand('This sounds too generic. Find a more specific operational reason for this person to care.')).toEqual({ kind: 'revise', text: 'This sounds too generic. Find a more specific operational reason for this person to care.' });
    expect(parseCommand('ok')).toEqual({ kind: 'unknown', line: 'ok' });
    expect(parseCommand('Looks good')).toEqual({ kind: 'unknown', line: 'Looks good' });
    expect(parseCommand('')).toEqual({ kind: 'unknown', line: '' });
  });

  it('a command word inside quoted text is never read (only the first non-quoted line counts)', () => {
    expect(parseCommand('> APPROVE\n> SKIP\n\nNEXT')).toEqual({ kind: 'next' });
    expect(parseCommand('\n\n  skip  \n> APPROVE')).toEqual({ kind: 'skip', reason: null });
  });
});

describe('X07a: commandTextOf', () => {
  it('uses the stripped text, falls back to the HTML with tags removed and the quoted history cut', () => {
    expect(commandTextOf(msg({ bodyText: 'NEXT', bodyHtml: '<p>APPROVE</p>' }))).toBe('NEXT');
    expect(commandTextOf(msg({ bodyText: '', bodyHtml: '<div dir="ltr">DONE: called him<br></div><div class="gmail_quote">On Thu, GAP wrote:<blockquote>APPROVE</blockquote></div>' }))).toBe('DONE: called him');
    expect(commandTextOf(msg({ bodyText: '', bodyHtml: '' }))).toBe('');
  });
});

describe('X07a: authenticateCommand', () => {
  it('accepts the seller\'s reply in the assignment thread with DMARC aligned, naming the assignment', () => {
    expect(authenticateCommand(msg(), CTX)).toEqual({ ok: true, target: { kind: 'assignment', itemKey: 'first_touch:dec-1', itemToken: 'a'.repeat(32), revision: 0, contentHash: 'hash-1', day: '2026-10-08' }, bound: 'thread' });
  });

  it('binds by In-Reply-To or References when the thread id is new (a client that broke the thread)', () => {
    expect(authenticateCommand(msg({ threadId: 'th-other' }), CTX)).toMatchObject({ ok: true, bound: 'message_id' });
    expect(authenticateCommand(msg({ threadId: 'th-other', headers: { 'Authentication-Results': AUTH_OK, References: '<x@y> <assign-1@mail.gmail.com>' } }), CTX)).toMatchObject({ ok: true, bound: 'message_id' });
  });

  it('a reply in the briefing thread names the day (START and NEXT act on the day)', () => {
    expect(authenticateCommand(msg({ threadId: 'th-brief-1', headers: { 'Authentication-Results': AUTH_OK } }), CTX)).toEqual({ ok: true, target: { kind: 'briefing', day: '2026-10-08', dayToken: 'day0token' }, bound: 'thread' });
  });

  it('refuses, by name: a sender not configured, no thread or message match, DMARC missing or failed or unaligned, an auto-submitted or bulk message, a forward', () => {
    expect(authenticateCommand(msg({ fromEmail: 'someone@else.com' }), CTX)).toEqual({ ok: false, reason: 'sender_not_allowed' });
    expect(authenticateCommand(msg({ threadId: 'th-none', headers: { 'Authentication-Results': AUTH_OK } }), CTX)).toEqual({ ok: false, reason: 'no_assignment_match' });
    expect(authenticateCommand(msg({ headers: { 'In-Reply-To': '<assign-1@mail.gmail.com>' } }), CTX)).toEqual({ ok: false, reason: 'no_authentication_results' });
    expect(authenticateCommand(msg({ headers: { 'Authentication-Results': AUTH_OK.replace('dmarc=pass', 'dmarc=fail') } }), CTX)).toEqual({ ok: false, reason: 'dmarc_not_passed' });
    expect(authenticateCommand(msg({ headers: { 'Authentication-Results': AUTH_OK.replace('header.from=freightroll.com', 'header.from=evil.com') } }), CTX)).toEqual({ ok: false, reason: 'dmarc_not_aligned' });
    expect(authenticateCommand(msg({ headers: { 'Authentication-Results': AUTH_OK, 'Auto-Submitted': 'auto-replied' } }), CTX)).toEqual({ ok: false, reason: 'auto_submitted' });
    expect(authenticateCommand(msg({ headers: { 'Authentication-Results': AUTH_OK, Precedence: 'bulk' } }), CTX)).toEqual({ ok: false, reason: 'auto_submitted' });
    expect(authenticateCommand(msg({ subject: 'Fwd: GAP 1 of 2, PepsiCo [GAP#a.0]' }), CTX)).toEqual({ ok: false, reason: 'forwarded' });
    expect(authenticateCommand(msg({ bodyText: '---------- Forwarded message ---------\nFrom: GAP' }), CTX)).toEqual({ ok: false, reason: 'forwarded' });
    expect(authenticateCommand(msg(), { ...CTX, senders: [] })).toEqual({ ok: false, reason: 'sender_not_allowed' });
  });

  it('the From domain is compared case-insensitively and a sender list is matched exactly', () => {
    expect(authenticateCommand(msg({ fromEmail: 'Casey@FreightRoll.com', headers: { 'Authentication-Results': AUTH_OK.replace('header.from=freightroll.com', 'header.from=FreightRoll.com') } }), CTX)).toMatchObject({ ok: true });
  });
});

describe('X07a: classifyMailboxMessage says command first', () => {
  const sendCtx: GapSendContext = { threads: new Map(), recipients: new Map(), bounceRecipients: new Map(), domains: new Map() };

  it('a reply from a command sender in an assignment thread is `command`, before own and before attribution', () => {
    const v = classifyMailboxMessage(msg(), sendCtx, MAILBOX, CTX);
    expect(v.kind).toBe('command');
    if (v.kind === 'command') {
      expect(v.command).toEqual({ kind: 'approve' });
      expect(v.auth).toMatchObject({ ok: true, bound: 'thread' });
    }
    // The mailbox's own address, used as a command sender by mistake, is refused by settings; here it never reaches `own`.
    const self = classifyMailboxMessage(msg({ fromEmail: MAILBOX }), sendCtx, MAILBOX, { ...CTX, senders: [MAILBOX] });
    expect(self.kind).toBe('command');
  });

  it('a refused command is still a `command` verdict with its reason (never a reply, never unrelated); without a command context nothing changes', () => {
    const v = classifyMailboxMessage(msg({ fromEmail: 'someone@else.com', headers: { 'Authentication-Results': AUTH_OK } }), sendCtx, MAILBOX, CTX);
    expect(v).toMatchObject({ kind: 'command', auth: { ok: false, reason: 'sender_not_allowed' } });
    expect(classifyMailboxMessage(msg({ fromEmail: MAILBOX }), sendCtx, MAILBOX).kind).toBe('own');
    expect(classifyMailboxMessage(msg(), sendCtx, MAILBOX).kind).toBe('unrelated');
  });

  it('a message from a command sender outside any GAP thread is not a command: it falls through to the ordinary verdicts', () => {
    const v = classifyMailboxMessage(msg({ threadId: 'th-none', headers: { 'Authentication-Results': AUTH_OK } }), sendCtx, MAILBOX, CTX);
    expect(v.kind).toBe('unrelated');
  });
});
