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

describe('Release B review: a manual send records the BARE recipient address', () => {
  it('a display-name To header is stored as the address, so person history can match it', async () => {
    const audit: any[] = [];
    const prisma: any = {
      gapAuditEvent: { findFirst: vi.fn(async () => null), create: vi.fn(async ({ data }: any) => { audit.push(data); return { id: 'a1' }; }) },
      routingDecision: { updateMany: vi.fn(async () => ({ count: 1 })), findUnique: vi.fn(async () => ({ id: 'dec' })) },
    };
    await recordManualSend(prisma, { ...input(null), match: { kind: 'match' as const, message: { ...MSG, to: '"Joey Maggard" <Joey.Maggard@Kroger.com>' }, matchedOn: ['recipient'] } });
    expect(audit.find((a) => a.kind === MANUAL_SENT).payload.recipient).toBe('joey.maggard@kroger.com');
  });

  it('red team T10: the send record carries the evidence tier at record time (unrecorded when the hypothesis cannot be read)', async () => {
    const a = db();
    await recordManualSend(a.prisma, input(null));
    expect(a.audit.find((x: any) => x.kind === MANUAL_SENT).payload.evidenceTier).toBe('unrecorded');
    const b = db();
    const keyword = { id: 's1', account_name: 'Kroger', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_text: null, observed_at: new Date('2026-09-01T00:00:00Z'), external_ok: null, metadata: null, freshness_expires_at: null };
    (b.prisma as any).prospectingHypothesis = { findUnique: vi.fn(async () => ({ id: 'hyp-kr', account_name: 'Kroger', observation: 'KR 10-Q mentions capex [S:s1].', signals: [{ signal: keyword }], events: [] })) };
    await recordManualSend(b.prisma, input(null));
    expect(b.audit.find((x: any) => x.kind === MANUAL_SENT).payload.evidenceTier).toBe('INSUFFICIENT');
  });
});

describe('Release D review S5/S8: one Gmail message is one send, fingerprinted and tiered when it went out', () => {
  it('recording the same Gmail message under a second card writes no second MANUAL_SENT', async () => {
    const { prisma, audit } = db();
    await recordManualSend(prisma, input(null));
    await recordManualSend(prisma, { ...input(null), decisionId: 'dec-other' });
    expect(audit.filter((a: any) => a.kind === MANUAL_SENT)).toHaveLength(1);
  });

  it('the record carries a content hash of the matched copy', async () => {
    const { prisma, audit } = db();
    await recordManualSend(prisma, input(null));
    expect(audit.find((a: any) => a.kind === MANUAL_SENT).payload.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('the evidence tier is judged at the Gmail send time, not when the send is recorded', async () => {
    const { prisma, audit } = db();
    const fact = { id: 's1', account_name: 'Kroger', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: 'Kroger will acquire Giant Eagle and consolidate two distribution centers.', observed_at: new Date('2026-09-18T00:00:00Z'), external_ok: true, metadata: { verified: 'excerpt_found_at_source' }, freshness_expires_at: new Date(new Date(MSG.sentAt).getTime() + 86_400_000) };
    (prisma as any).prospectingHypothesis = { findUnique: vi.fn(async () => ({ id: 'hyp-kr', account_name: 'Kroger', observation: '"Kroger will acquire Giant Eagle and consolidate two distribution centers" [S:s1].', signals: [{ signal: fact }], events: [] })) };
    // Recorded long after the fact expired; it was live when the email went out.
    await recordManualSend(prisma, { ...input(null), now: new Date(new Date(MSG.sentAt).getTime() + 10 * 86_400_000) });
    expect(audit.find((a: any) => a.kind === MANUAL_SENT).payload.evidenceTier).toBe('VERIFIED_FACT');
  });
});
