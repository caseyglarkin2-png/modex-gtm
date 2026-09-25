import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedSendViaGmail, mockedCreateGmailDraft, mockedSendGmailDraft } = vi.hoisted(() => ({
  mockedSendViaGmail: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedCreateGmailDraft: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedSendGmailDraft: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/email/gmail-sender', () => ({
  sendViaGmail: mockedSendViaGmail,
  createGmailDraft: mockedCreateGmailDraft,
  sendGmailDraft: mockedSendGmailDraft,
}));

import { gmailDirectAdapter, gmailDraftAdapter, sendDraftedGmailAdapter } from '@/lib/gap/execution/gmail-adapter';
import type { ExecutionIntent } from '@/lib/gap/execution/contract';

const NOW = new Date('2026-09-24T12:00:00.000Z');

function intent(overrides: Partial<ExecutionIntent> = {}): ExecutionIntent {
  return {
    engine: 'gmail_direct',
    personaId: 7,
    hypothesisId: 'H1',
    sequenceVersionId: 'v1',
    stepIndex: 0,
    compileIds: [],
    senderIdentity: 'casey@yardflow.ai',
    idempotencyKey: 'idem_1',
    actor: 'casey@freightroll.com',
    actorKind: 'human',
    mode: 'live',
    now: NOW,
    ...overrides,
  };
}

const INPUT = { to: 'recipient@example.com', subject: 'Hi', html: '<p>Hi</p>' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('gmailDirectAdapter', () => {
  it('sends immediately and returns a sent receipt with sentAt set', async () => {
    mockedSendViaGmail.mockResolvedValueOnce({ provider: 'gmail', id: 'msg_1', threadId: 't1' });

    const receipt = await gmailDirectAdapter(intent(), INPUT);

    expect(receipt).toEqual({ engine: 'gmail_direct', status: 'sent', engineId: 'msg_1', createdAt: NOW, sentAt: NOW, threadId: 't1' });
    expect(mockedSendViaGmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'recipient@example.com', subject: 'Hi' }));
  });

  it('translates a thrown refusal (e.g. suppression) into a refused receipt, never throws', async () => {
    mockedSendViaGmail.mockRejectedValueOnce(new Error('suppressed: unsubscribed'));

    const receipt = await gmailDirectAdapter(intent(), INPUT);

    expect(receipt).toEqual({ engine: 'gmail_direct', status: 'refused', engineId: null, createdAt: NOW, refusalReason: 'suppressed: unsubscribed' });
  });

  it('carries thread context (References, In-Reply-To, Subject) for a reply step', async () => {
    mockedSendViaGmail.mockResolvedValueOnce({ provider: 'gmail', id: 'msg_2', threadId: 't1' });

    await gmailDirectAdapter(
      intent({ threadContext: { threadId: 't1', references: ['<a@x>', '<b@x>'], inReplyTo: '<b@x>', subject: 'Re: Hi' } }),
      INPUT,
    );

    const payload = mockedSendViaGmail.mock.calls[0][0];
    expect(payload.threadId).toBe('t1');
    expect(payload.headers).toEqual({ Subject: 'Re: Hi', 'In-Reply-To': '<b@x>', References: '<a@x> <b@x>' });
  });
});

describe('gmailDraftAdapter', () => {
  it('creates a draft and returns a drafted receipt, never a sent one', async () => {
    mockedCreateGmailDraft.mockResolvedValueOnce({ provider: 'gmail', draftId: 'draft_1', messageId: null, threadId: null });

    const receipt = await gmailDraftAdapter(intent({ engine: 'gmail_draft' }), INPUT);

    expect(receipt).toEqual({ engine: 'gmail_draft', status: 'drafted', engineId: 'draft_1', createdAt: NOW, threadId: null, draftMessageId: null });
    expect(mockedSendViaGmail).not.toHaveBeenCalled();
  });
});

describe('sendDraftedGmailAdapter: lineage from a drafted receipt to a sent one', () => {
  it('sends the named draft and the new receipt supersedes the draft receipt, never collapsing them into one event', async () => {
    const draftReceipt = { engine: 'gmail_draft' as const, status: 'drafted' as const, engineId: 'draft_1', createdAt: NOW, threadId: 't1' };
    mockedSendGmailDraft.mockResolvedValueOnce({ provider: 'gmail', id: 'msg_real', threadId: 't1' });

    const sentReceipt = await sendDraftedGmailAdapter(intent({ engine: 'gmail_direct' }), draftReceipt, { to: 'recipient@example.com' });

    expect(sentReceipt).toEqual({
      engine: 'gmail_direct',
      status: 'sent',
      engineId: 'msg_real',
      createdAt: NOW,
      sentAt: NOW,
      threadId: 't1',
      supersedesEngineId: 'draft_1',
    });
    expect(mockedSendGmailDraft).toHaveBeenCalledWith('draft_1', { to: 'recipient@example.com' });
  });

  it('refuses supersedes_receipt_not_a_draft when handed a receipt that was never a drafted draft, without calling the wire', async () => {
    const notADraft = { engine: 'gmail_direct' as const, status: 'sent' as const, engineId: 'msg_already_sent', createdAt: NOW };

    const receipt = await sendDraftedGmailAdapter(intent(), notADraft, { to: 'recipient@example.com' });

    expect(receipt).toEqual({ engine: 'gmail_direct', status: 'refused', engineId: null, createdAt: NOW, refusalReason: 'supersedes_receipt_not_a_draft' });
    expect(mockedSendGmailDraft).not.toHaveBeenCalled();
  });
});
