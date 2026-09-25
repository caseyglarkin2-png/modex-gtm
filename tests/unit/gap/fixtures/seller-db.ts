/** Shared Seller Action Center fixture (seller-draft and seller-send tests). */
import { vi } from 'vitest';
import { SEED_FAMILIES } from '@/lib/gap/sequences/families';
import type { CompileResult } from '@/lib/gap/compiler/compile';

export const NOW = new Date('2026-09-25T15:00:00.000Z');
export const HC = SEED_FAMILIES.find((f) => f.key === 'hidden_capacity')!;

export interface Db {
  decisions: any[];
  hypotheses: any[];
  personas: any[];
  versions: any[];
  families: any[];
  compiles: any[];
  approvals: any[];
  audit: any[];
}

export function db(): Db {
  return {
    decisions: [
      { id: 'dec-joey', lane: 'work_queue', action: 'enroll_gap_sequence', hypothesis_id: 'hyp-kr', persona_id: 1886, account_name: 'Kroger', rule_id: 'enroll', inputs_snapshot: { target: 'modex_queue' }, created_at: NOW },
      { id: 'dec-jason', lane: 'work_queue', action: 'research_required', hypothesis_id: null, persona_id: 1788, account_name: 'Kroger', rule_id: 'no_hypothesis', inputs_snapshot: {}, created_at: NOW },
      { id: 'dec-gm', lane: 'blocked', action: 'do_not_contact', hypothesis_id: null, persona_id: 7, account_name: 'General Mills', rule_id: 'suppressed', inputs_snapshot: {}, created_at: NOW },
    ],
    hypotheses: [
      {
        id: 'hyp-kr',
        account_name: 'Kroger',
        status: 'active',
        primary_persona_id: 1886,
        problem_family: 'hidden_capacity',
        problem_hypothesis: 'My guess is that physical handoffs constrain production capacity at Kroger.',
        observation: 'KR 10-Q (2026-06-26) mentions: capital expenditure [S:sig-1].',
        sequence_version_id: null,
        sequence_family_id: null,
        falsification_questions: [],
        signals: [{ signal: { id: 'sig-1', title: 'KR 10-Q mentions capital expenditure', evidence_url: 'https://sec.gov/x', external_ok: true, observed_at: NOW, freshness_expires_at: null, source_type: 'filing', metadata: null } }],
        events: [],
      },
    ],
    personas: [
      { id: 1886, name: 'joey maggard', title: 'corporate supply chain planning manager', email: 'joey.maggard@kroger.com', phone: '+15137624000', linkedin_url: 'http://www.linkedin.com/in/joey-maggard', hubspot_contact_id: '217681150841', account_name: 'Kroger', do_not_contact: false, email_valid: true, email_status: 'unverified' },
      { id: 1788, name: 'jason gaiser', title: null, email: 'jason.gaiser@kroger.com', phone: null, linkedin_url: null, hubspot_contact_id: null, account_name: 'Kroger', do_not_contact: false, email_valid: true, email_status: 'unverified' },
    ],
    versions: [{ id: 'ver-hc', family_id: 'fam-hc', version: 1, status: 'draft', steps: HC.steps, family: { id: 'fam-hc', name: 'Hidden Capacity', engine: 'modex_draft_queue' } }],
    families: [{ id: 'fam-hc', problem_family: 'hidden_capacity', engine: 'modex_draft_queue', archived_at: null, created_at: NOW }],
    compiles: [],
    approvals: [],
    audit: [],
  };
}

export function prismaOf(d: Db) {
  let n = 0;
  const id = (p: string) => `${p}-${++n}`;
  return {
    routingDecision: {
      findUnique: vi.fn(async ({ where }: any) => d.decisions.find((x) => x.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => {
        if (where.created_at?.gt) {
          return d.decisions.filter((x) => x.persona_id === where.persona_id && x.created_at > where.created_at.gt).sort((a, b) => b.created_at - a.created_at)[0] ?? null;
        }
        return d.decisions.find((x) => x.hypothesis_id === where.hypothesis_id && x.action === where.action) ?? null;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
      update: vi.fn(),
    },
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => d.hypotheses.find((x) => x.id === where.id) ?? null) },
    persona: { findUnique: vi.fn(async ({ where }: any) => d.personas.find((x) => x.id === where.id) ?? null) },
    sequenceVersion: {
      findUnique: vi.fn(async ({ where }: any) => d.versions.find((x) => x.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => d.versions.find((x) => x.family_id === where.family_id) ?? null),
    },
    sequenceFamily: { findMany: vi.fn(async ({ where }: any) => d.families.filter((f) => f.problem_family === where.problem_family)) },
    gapCompile: {
      findMany: vi.fn(async ({ where }: any) =>
        d.compiles
          .filter((c) => c.hypothesis_id === where.hypothesis_id && c.sequence_version_id === where.sequence_version_id && c.step_index === where.step_index)
          .sort((a, b) => b.created_at - a.created_at),
      ),
      findUnique: vi.fn(async ({ where }: any) => d.compiles.find((c) => c.id === where.id) ?? null),
      update: vi.fn(async () => ({})),
    },
    sendApprovalRequest: {
      findFirst: vi.fn(async ({ where }: any) => {
        const tag = where.risk_reasons.has;
        return d.approvals.filter((a) => a.risk_reasons.includes(tag) && (!where.status || a.status === where.status)).at(-1) ?? null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: id('apr'), ...data };
        d.approvals.push(row);
        return row;
      }),
    },
    gapAuditEvent: {
      create: vi.fn(async ({ data }: any) => {
        const row = { id: id('evt'), created_at: new Date(NOW.getTime() + n), ...data };
        d.audit.push(row);
        return { id: row.id };
      }),
      findMany: vi.fn(async ({ where }: any) =>
        d.audit
          .filter((a) => a.subject_type === where.subject_type && a.subject_id === where.subject_id && where.kind.in.includes(a.kind))
          .sort((a, b) => b.created_at - a.created_at),
      ),
    },
  };
}

/** A compile stand-in that records the row the way compile() persists it. */
export function fakeCompile(d: Db, verdict: 'pass' | 'review_required' | 'reject') {
  return vi.fn(async (input: any): Promise<CompileResult> => {
    const row = {
      id: `cmp-${d.compiles.length + 1}`,
      hypothesis_id: input.hypothesisId,
      sequence_version_id: input.sequenceVersionId,
      step_index: input.stepIndex,
      verdict,
      created_at: NOW,
      inputs_snapshot: { subject: input.subject, body: input.body },
    };
    d.compiles.push(row);
    return {
      id: row.id,
      verdict,
      checks: verdict === 'reject' ? [{ code: 'C01', passed: false, severity: 'reject', detail: 'x', span: null }] : [],
      critic: verdict === 'pass' ? ({ ok: true, verdict: 'pass' } as any) : ({ ok: false, reason: 'critic_unconfigured' } as any),
      wordCount: 60,
      ctaFamily: null,
      allowedCtaFamily: 'gap_question' as any,
      evidenceIdsUsed: [],
      compilerVersion: 'test',
      hypothesisId: input.hypothesisId,
      stepIndex: 0,
    };
  });
}

export function gmailFake() {
  return {
    createGmailDraft: vi.fn(async () => ({ provider: 'gmail' as const, draftId: 'r-draft-1', messageId: 'm-draft-1', threadId: 't-1' })),
    sendGmailDraft: vi.fn(async () => {
      throw new Error('must never be called');
    }),
    sendViaGmail: vi.fn(async () => {
      throw new Error('must never be called');
    }),
  };
}

export const baseDeps = (d: Db, verdict: 'pass' | 'review_required' | 'reject' = 'pass', gmail = gmailFake()) => ({
  compile: fakeCompile(d, verdict),
  gmail,
  senderAddress: () => 'casey@freightroll.com',
  gapSender: () => null,
  signature: async () => null,
  nextTouch: async () => ({ state: 'not_started' as const }),
  unsubscribeUrl: (e: string) => `https://modex-gtm.vercel.app/unsubscribe?email=${encodeURIComponent(e)}&token=t`,
});

