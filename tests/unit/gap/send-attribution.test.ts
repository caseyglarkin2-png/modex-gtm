/**
 * Phase 2 A2: immutable SEND-TIME attribution on every GAP send row.
 */
import { describe, expect, it, vi } from 'vitest';
import { captureSendAttribution, openerApproachFor, sendAttributionOf } from '@/lib/gap/execution/send-attribution';

const AT = new Date('2026-09-28T15:00:00.000Z');

function prismaFake(over: Record<string, unknown> = {}) {
  return {
    prospectingHypothesis: {
      findUnique: vi.fn(async () => ({
        problem_family: 'hidden_capacity',
        persona: 'supply_chain',
        signals: [
          { role: 'supporting', signal_id: 'sig-2', signal: { id: 'sig-2', type: 'news', source_kind: 'evidence_record', source_type: 'public_secondary' } },
          { role: 'primary', signal_id: 'sig-1', signal: { id: 'sig-1', type: 'acquisition', source_kind: 'evidence_record', source_type: 'public_primary' } },
        ],
      })),
    },
    persona: { findUnique: vi.fn(async () => ({ title: 'VP Supply Chain', seniority: 'vp', role_in_deal: 'economic_buyer' })) },
    account: { findUnique: vi.fn(async () => ({ tier: 'Tier 1', hubspot_company_id: '8536615981' })) },
    canonicalAccountLink: { findUnique: vi.fn(async () => ({ canonical_company_id: 'domain:kroger.com', status: 'resolved' })) },
    sequenceVersion: { findUnique: vi.fn(async () => ({ steps: [] })) },
    ...over,
  };
}

const input = { hypothesisId: 'hyp-kr', personaId: 1886, accountName: 'Kroger', stepIndex: 0, sequenceVersionId: 'ver-hc', at: AT };

describe('captureSendAttribution', () => {
  it('stamps the primary fact, signal and source type, opener, persona, account and problem family', async () => {
    const a = await captureSendAttribution(prismaFake(), input);
    expect(a).toEqual({
      version: 1,
      primaryFactId: 'sig-1',
      signalType: 'acquisition',
      signalSourceKind: 'evidence_record',
      signalSourceType: 'public_primary',
      openerApproach: 'verified_fact_observation',
      personaTitle: 'VP Supply Chain',
      personaSeniority: 'vp',
      personaRoleInDeal: 'economic_buyer',
      personaKey: 'supply_chain',
      accountName: 'Kroger',
      accountTier: 'Tier 1',
      hubspotCompanyId: '8536615981',
      canonicalCompanyId: 'domain:kroger.com',
      problemFamily: 'hidden_capacity',
      workSources: [], // Universal Work Intake: no source memberships for this person
      capturedAt: AT.toISOString(),
    });
  });

  it('a canonical link in conflict is not presented as the account identity', async () => {
    const a = await captureSendAttribution(prismaFake({ canonicalAccountLink: { findUnique: vi.fn(async () => ({ canonical_company_id: 'domain:pepsico.com', status: 'conflict' })) } }), input);
    expect(a).toMatchObject({ canonicalCompanyId: null });
  });

  it('never throws and never invents: a failed read is unrecorded with the reason', async () => {
    const a = await captureSendAttribution(prismaFake({ account: { findUnique: vi.fn(async () => { throw new Error('db down'); }) } }), input);
    expect(a).toEqual({ version: 1, unrecorded: true, reason: 'db down' });
  });
});

describe('openerApproachFor', () => {
  it('first touch is the verified-fact observation; follow-ups name their step purpose', () => {
    expect(openerApproachFor(0, null)).toBe('verified_fact_observation');
    const steps = { schema: 'steps.v2', steps: [0, 1, 2].map((i) => ({ index: i, delayBusinessDays: i === 0 ? 0 : 4, purpose: ['intrigue', 'root_cause', 'value_offer'][i], subject: 's', body: 'b', productProofAllowed: i > 0 })) };
    expect(openerApproachFor(1, steps)).toMatch(/^follow_up:/);
    expect(openerApproachFor(5, null)).toBe('follow_up:step_5');
  });
});

describe('sendAttributionOf', () => {
  it('a row written before attribution existed reads as unrecorded, never a guess', () => {
    expect(sendAttributionOf({ engine: 'gmail_direct', recipient: 'x@y.com' })).toEqual({ version: 1, unrecorded: true, reason: 'recorded_before_attribution' });
    expect(sendAttributionOf(null)).toMatchObject({ unrecorded: true });
  });
});
