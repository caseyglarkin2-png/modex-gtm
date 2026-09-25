import { describe, expect, it, vi } from 'vitest';
import { recordManualSend, type SentCandidate } from '@/lib/gap/execution/manual-send';
import { DRAFTED, DRAFT_SENT, MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';

const MSG: SentCandidate = { id: '1a0da5d97f8142c0', threadId: '1a0da5c10f51fe73', to: 'joey.maggard@kroger.com', subject: 'doors versus spots', sentAt: '2026-09-25T20:59:19.000Z', text: 'x', rfcMessageId: '<a@mail.gmail.com>' };
const NOW = new Date('2026-09-25T23:00:00Z');

function db() {
  const audit: any[] = [];
  const decision = { human_action: null as string | null };
  return {
    audit, decision,
    prisma: {
      gapAuditEvent: {
        findFirst: vi.fn(async ({ where }: any) => audit.find((a) => a.kind === where.kind && a.payload.gmailSentMessageId === where.payload.equals) ?? null),
        create: vi.fn(async ({ data }: any) => { audit.push(data); return { id: `a${audit.length}` }; }),
      },
      routingDecision: {
        updateMany: vi.fn(async ({ data }: any) => { if (decision.human_action) return { count: 0 }; decision.human_action = data.human_action; return { count: 1 }; }),
        findUnique: vi.fn(async () => ({ id: 'dec' })),
      },
    },
  };
}
const input = (ownerStatement: string | null) => ({
  decisionId: 'dec', hypothesisId: 'h', personaId: 1886, accountName: 'Kroger', sequenceVersionId: 'v1', stepIndex: 0, senderIdentity: 'casey@yardflow.ai',
  match: { kind: 'match' as const, message: MSG, matchedOn: ['recipient'] }, actor: 'casey@freightroll.com', now: NOW, ownerStatement,
});

describe('recordManualSend', () => {
  it('writes ONE manual execution row with the real Gmail ids and never a draft record; idempotent', async () => {
    const { prisma, audit } = db();
    await recordManualSend(prisma, input(null));
    await recordManualSend(prisma, input(null));
    const exec = audit.filter((a) => a.kind === MANUAL_SENT);
    expect(exec).toHaveLength(1);
    expect(exec[0].payload).toMatchObject({ engine: 'manual', channel: 'gmail', status: 'sent', gmailSentMessageId: MSG.id, gmailThreadId: MSG.threadId, sentAt: MSG.sentAt, senderIdentity: 'casey@yardflow.ai' });
    expect(audit.some((a) => a.kind === DRAFTED || a.kind === DRAFT_SENT)).toBe(false);
  });

  it('human_action = emailed ONLY from Casey explicit statement; Gmail proof alone never sets it', async () => {
    const a = db();
    expect(await recordManualSend(a.prisma, input(null))).toMatchObject({ humanAction: 'not_recorded' });
    expect(a.decision.human_action).toBeNull();
    const b = db();
    expect(await recordManualSend(b.prisma, input('I manually sent it from my YardFlow Gmail account.'))).toMatchObject({ humanAction: 'recorded' });
    expect(b.decision.human_action).toBe('emailed');
    const h = b.audit.filter((x) => x.kind === 'decision.human_action');
    expect(h).toHaveLength(1);
    expect(h[0].payload).toMatchObject({ action: 'emailed', source: 'owner_statement', statement: expect.stringContaining('manually sent') });
  });
});
