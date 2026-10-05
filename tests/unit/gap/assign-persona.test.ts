/**
 * HYPOTHESIS PERSONA ASSIGNMENT (owner resolution, 2026-10-05). An approved account-level hypothesis gets the person
 * Casey chose, audited on its own event log; the person must be at the same account, contactable and current; the
 * narrative is untouched; an active row is never retargeted; the machine then refuses activation for a departed or
 * conflicted person with its own reason, never 'suppressed'.
 */
import { describe, expect, it, vi } from 'vitest';
import { assignHypothesisPersona } from '@/lib/gap/hypothesis/assign-persona';
import { transition, type HypothesisSnapshot } from '@/lib/gap/hypothesis/machine';
import { refusalSentence } from '@/lib/gap/ui/refusal-copy';

const NOW = new Date('2026-10-05T15:00:00Z');

function db(seed: { hyp?: any; personas?: any[]; unsubscribed?: string[]; fields?: Record<number, any[]> } = {}) {
  const hyp = seed.hyp ?? { id: 'h1', account_name: 'FedEx', status: 'approved', primary_persona_id: null, problem_family: 'hidden_capacity', observation: 'FACT', problem_hypothesis: 'GUESS' };
  const personas = seed.personas ?? [{ id: 2187, account_name: 'FedEx', name: 'Jeffrey Tallman', title: 'Vice President - Operations Planning and Engineering - North America', email: 'jptallman@fedex.com', do_not_contact: false, hubspot_contact_id: '219922589799' }];
  const events: any[] = [];
  const audits: any[] = [];
  const updates: any[] = [];
  const tx = {
    prospectingHypothesis: { updateMany: vi.fn(async ({ where, data }: any) => { if (hyp.id !== where.id || hyp.status !== where.status || hyp.primary_persona_id !== where.primary_persona_id) return { count: 0 }; updates.push(data); Object.assign(hyp, data); return { count: 1 }; }) },
    hypothesisEvent: { create: vi.fn(async ({ data }: any) => { events.push(data); return { id: `evt_${events.length}` }; }) },
  };
  const prisma = {
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => (where.id === hyp.id ? { ...hyp } : null)) },
    persona: {
      findUnique: vi.fn(async ({ where }: any) => personas.find((p) => p.id === where.id) ?? null),
      findMany: vi.fn(async ({ where }: any) => personas.filter((p) => where.id.in.includes(p.id))),
    },
    unsubscribedEmail: { findFirst: vi.fn(async ({ where }: any) => ((seed.unsubscribed ?? []).includes(where.email.equals) ? { id: 'u' } : null)) },
    contactEnrichment: { findMany: vi.fn(async ({ where }: any) => Object.entries(seed.fields ?? {}).filter(([pid]) => where.persona_id.in.includes(Number(pid))).map(([pid, fields]) => ({ persona_id: Number(pid), fields }))) },
    conversationDisposition: { findMany: vi.fn(async () => []) },
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { audits.push(data); return { id: 'a' }; }) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { prisma, hyp, events, audits, updates };
}
const input = { hypothesisId: 'h1', personaId: 2187, actor: 'casey@yardflow.ai', now: NOW, source: 'owner_resolution' as const, evidence: { candidateKey: 'gap:2187', reasons: ['Primary operator.'] } };

describe('assignHypothesisPersona', () => {
  it('attaches the person to an approved account-level hypothesis, audited with prior and new ids; the narrative is untouched', async () => {
    const { prisma, hyp, events, updates } = db();
    const r = await assignHypothesisPersona(prisma, input);
    expect(r).toMatchObject({ ok: true, status: 'approved', priorPersonaId: null, personaId: 2187 });
    expect(hyp.primary_persona_id).toBe(2187);
    expect(updates).toEqual([{ primary_persona_id: 2187 }]);
    expect(events[0]).toMatchObject({ hypothesis_id: 'h1', action: 'assign_persona', actor: 'casey@yardflow.ai', from_status: 'approved', to_status: 'approved', reason: 'owner_resolution', payload: { priorPrimaryPersonaId: null, primaryPersonaId: 2187, personaName: 'Jeffrey Tallman', source: 'owner_resolution', narrativeChanged: false, evidence: { candidateKey: 'gap:2187' } } });
    expect(hyp.observation).toBe('FACT');
    expect(hyp.problem_hypothesis).toBe('GUESS');
  });
  it('a person at another account cannot be attached; nor an unknown one; nor the same person twice', async () => {
    const { prisma, events } = db({ personas: [{ id: 9, account_name: 'PepsiCo', name: 'Pat', email: 'p@pepsico.com', do_not_contact: false }] });
    expect(await assignHypothesisPersona(prisma, { ...input, personaId: 9 })).toMatchObject({ ok: false, reason: 'persona_not_at_account' });
    expect(await assignHypothesisPersona(prisma, { ...input, personaId: 404 })).toMatchObject({ ok: false, reason: 'persona_not_found' });
    const same = db({ hyp: { id: 'h1', account_name: 'FedEx', status: 'approved', primary_persona_id: 2187 } });
    expect(await assignHypothesisPersona(same.prisma, input)).toMatchObject({ ok: false, reason: 'same_person' });
    expect(events).toEqual([]);
  });
  it('an active or closed hypothesis is never retargeted', async () => {
    expect(await assignHypothesisPersona(db({ hyp: { id: 'h1', account_name: 'FedEx', status: 'active', primary_persona_id: 1 } }).prisma, input)).toMatchObject({ ok: false, reason: 'hypothesis_in_use' });
    expect(await assignHypothesisPersona(db({ hyp: { id: 'h1', account_name: 'FedEx', status: 'expired', primary_persona_id: null } }).prisma, input)).toMatchObject({ ok: false, reason: 'hypothesis_closed' });
  });
  it('do-not-contact, unsubscribed, departed and conflicted people refuse before any write, each with its own reason', async () => {
    const dnc = db({ personas: [{ id: 2187, account_name: 'FedEx', name: 'J', email: 'j@fedex.com', do_not_contact: true }] });
    expect(await assignHypothesisPersona(dnc.prisma, input)).toMatchObject({ ok: false, reason: 'persona_do_not_contact' });
    const unsub = db({ unsubscribed: ['jptallman@fedex.com'] });
    expect(await assignHypothesisPersona(unsub.prisma, input)).toMatchObject({ ok: false, reason: 'recipient_unsubscribed' });
    const left = db({ fields: { 2187: [{ field_name: 'employment_status', field_value: 'left', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }, { field_name: 'employment_company', field_value: 'Other Co', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }] } });
    const r = await assignHypothesisPersona(left.prisma, input);
    expect(r).toMatchObject({ ok: false, reason: 'persona_left_account' });
    expect(!r.ok && r.detail).toMatch(/Casey marked them as no longer at FedEx/);
    expect(left.events).toEqual([]);
  });
  it('a concurrent change is stale_status, never a silent overwrite', async () => {
    const { prisma, hyp } = db();
    prisma.prospectingHypothesis.findUnique = vi.fn(async () => ({ ...hyp, primary_persona_id: 5 }));
    expect(await assignHypothesisPersona(prisma, input)).toMatchObject({ ok: false, reason: 'stale_status' });
  });
});

describe('the machine: a departed or conflicted primary person never activates, with its own reason', () => {
  const activatable = (over: Partial<HypothesisSnapshot> = {}): HypothesisSnapshot => ({
    status: 'approved',
    problemFamily: 'hidden_capacity',
    persona: 'supply_chain',
    observation: 'Fact [S:sig_a].',
    problemHypothesis: 'My guess is the yard.',
    falsificationQuestions: ['Q?'],
    linkedSignals: [{ id: 'sig_a', hasEvidence: true, outreachFact: true, expiresAt: null }],
    reviewedBy: 'casey',
    primaryPersonaId: 7,
    personaSuppressed: false,
    version: null,
    expiresAt: null,
    confirmedDispositions: [],
    ...over,
  });
  const ctx = { now: NOW, actor: 'casey' };
  it('refuses persona_left_account and persona_employment_conflict after the person guards, before the version guards', () => {
    expect(transition(activatable({ personaEmploymentBlocked: 'persona_left_account' }), 'activate', ctx)).toEqual({ ok: false, reason: 'persona_left_account' });
    expect(transition(activatable({ personaEmploymentBlocked: 'persona_employment_conflict' }), 'activate', ctx)).toEqual({ ok: false, reason: 'persona_employment_conflict' });
    expect(transition(activatable({ personaEmploymentBlocked: 'persona_left_account', primaryPersonaId: null }), 'activate', ctx)).toEqual({ ok: false, reason: 'no_persona' });
    expect(transition(activatable({ personaEmploymentBlocked: null }), 'activate', ctx).ok).toBe(true);
    expect(transition(activatable(), 'activate', ctx).ok).toBe(true);
  });
  it('the seller never reads the raw words: every new code has a sentence', () => {
    for (const code of ['no_persona', 'persona_left_account', 'persona_employment_conflict', 'persona_not_at_account', 'hypothesis_in_use']) expect(refusalSentence(code)).toMatch(/Next:/);
    expect(refusalSentence('no_persona')).toMatch(/^Approved\. GAP needs a person to test this with before it can route\./);
  });
});
