/**
 * Last-mile hardening: a cold CALL or LINKEDIN action from GAP re-reads the
 * canonical HubSpot active-opportunity resolver at the click, exactly like
 * email draft / send / enroll. ACTIVE refuses, UNKNOWN fails closed, CLEAR
 * releases the dial / profile link. Driven through the real action-time check
 * (makeActiveOpportunityCheck) over a fake HubSpot.
 */
import { describe, expect, it, vi } from 'vitest';
import { checkColdOutbound, type ColdChannel } from '@/lib/gap/execution/cold-outbound';
import { makeActiveOpportunityCheck, type ActionTimeOpportunityCheck } from '@/lib/gap/enroll/service';
import { OPPORTUNITY_UNKNOWN_COPY } from '@/lib/gap/opportunity/active-opportunity';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';

const NOW = new Date('2026-09-27T15:00:00.000Z');
const COMPANY = 'c-acme';
const OPEN_DEAL = { id: 'd-acme', closed: 'false', name: 'YardFlow - Acme' };

function prismaFake(opts: { hubspotCompanyId?: string | null; decision?: Record<string, unknown> | null; persona?: Record<string, unknown> | null; factAt?: Date } = {}) {
  const decision = opts.decision === undefined ? { id: 'dec-1', account_name: 'Acme Foods', persona_id: 41, action: 'call_now', lane: 'work_queue', hypothesis_id: null, created_at: NOW } : opts.decision;
  const persona =
    opts.persona === undefined
      ? { id: 41, account_name: 'Acme Foods', email: 'jordan@acme.example', phone: '+1 (555) 010-2000', linkedin_url: 'https://www.linkedin.com/in/jordan', hubspot_contact_id: '900' }
      : opts.persona;
  return {
    // execution acceptance: the card is current (no newer card for this person) and carries no thesis here
    routingDecision: { findUnique: vi.fn(async () => decision), findFirst: vi.fn(async () => null) },
    persona: {
      findUnique: vi.fn(async () => persona),
      findMany: vi.fn(async () => (persona ? [{ email: persona.email, hubspot_contact_id: persona.hubspot_contact_id }] : [])),
    },
    account: { findUnique: vi.fn(async () => ({ hubspot_company_id: opts.hubspotCompanyId === undefined ? COMPANY : opts.hubspotCompanyId })) },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    conversationDisposition: { findFirst: vi.fn(async () => null) },
    // R55: the newest verified fact at the account (a material change after a lost deal unparks it).
    ...(opts.factAt ? { prospectingSignal: { findFirst: vi.fn(async () => ({ observed_at: opts.factAt })) } } : {}),
  };
}

const via = (hs: ReturnType<typeof fakeHubSpot>, configured = true) => makeActiveOpportunityCheck({ reads: hs, configured: () => configured });

const run = (channel: ColdChannel, opportunity: ActionTimeOpportunityCheck, prisma = prismaFake()) =>
  checkColdOutbound(prisma, { decisionId: 'dec-1', channel, now: NOW }, { opportunity });

describe('cold CALL / LINKEDIN: action-time active-opportunity check', () => {
  it('1. an open deal on the account blocks the call action', async () => {
    const r = await run('call', via(fakeHubSpot({ companyDeals: { [COMPANY]: [OPEN_DEAL.id] }, deals: [OPEN_DEAL] })));
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(r.ok ? '' : r.message).toContain('Work this account from the existing deal');
    expect(r.ok ? '' : r.message).toContain('YardFlow - Acme');
    expect(r).not.toHaveProperty('href');
  });

  it('2. an open deal on the account blocks the LinkedIn cold action', async () => {
    const r = await run('linkedin', via(fakeHubSpot({ companyDeals: { [COMPANY]: [OPEN_DEAL.id] }, deals: [OPEN_DEAL] })));
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(r).not.toHaveProperty('href');
  });

  it.each(['call', 'linkedin'] as const)('3. UNKNOWN (HubSpot read fails) blocks %s, fail closed', async (channel) => {
    const r = await run(channel, via(fakeHubSpot({ companyDeals: { [COMPANY]: [] }, fail: { companyAssoc: new Error('HubSpot 503') } })));
    expect(r).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
    expect(r.ok ? '' : r.message).toContain(OPPORTUNITY_UNKNOWN_COPY);
    expect(r).not.toHaveProperty('href');
  });

  it.each(['call', 'linkedin'] as const)('3b. UNKNOWN (HubSpot unconfigured, identity unresolved) blocks %s', async (channel) => {
    expect(await run(channel, via(fakeHubSpot({ companyDeals: { [COMPANY]: [] } }), false))).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
    expect(await run(channel, via(fakeHubSpot({})), prismaFake({ hubspotCompanyId: null })).then((r) => r)).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
  });

  it('4. CLEAR allows both: the call returns the tel: link, LinkedIn the profile (a deal closed lost, something material since); R55: without it the account is parked', async () => {
    const hs = () => via(fakeHubSpot({ companyDeals: { [COMPANY]: [OPEN_DEAL.id] }, deals: [{ ...OPEN_DEAL, closed: 'true', won: 'false', closedate: '2026-03-01T00:00:00Z' }] }));
    const changed = prismaFake({ factAt: new Date('2026-09-01T00:00:00Z') });
    expect(await run('call', hs(), changed)).toEqual({ ok: true, channel: 'call', href: 'tel:+15550102000' });
    expect(await run('linkedin', hs(), changed)).toEqual({ ok: true, channel: 'linkedin', href: 'https://www.linkedin.com/in/jordan' });
    const parked = await run('call', hs());
    expect(parked).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(parked.ok ? '' : parked.message).toMatch(/Parked: "YardFlow - Acme" closed lost/);
  });

  it('5. the opportunity opens after routing but before the click: the action-time read blocks', async () => {
    // Routing ran CLEAR (the card says call_now). A deal opens in HubSpot afterwards.
    const world = { companyDeals: { [COMPANY]: [] as string[] }, deals: [] as Array<typeof OPEN_DEAL> };
    const hs = fakeHubSpot(world);
    expect(await run('call', via(hs))).toMatchObject({ ok: true });
    world.companyDeals[COMPANY].push(OPEN_DEAL.id);
    world.deals.push(OPEN_DEAL);
    expect(await run('call', via(fakeHubSpot(world)))).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(await run('linkedin', via(fakeHubSpot(world)))).toMatchObject({ ok: false, reason: 'active_opportunity' });
  });

  it.each(['call', 'linkedin'] as const)('6. a resolver that throws or answers garbage can never become CLEAR (%s)', async (channel) => {
    const throws: ActionTimeOpportunityCheck = async () => {
      throw new Error('boom');
    };
    const garbage = (async () => ({ status: 'MAYBE' })) as unknown as ActionTimeOpportunityCheck;
    const empty = (async () => undefined) as unknown as ActionTimeOpportunityCheck;
    for (const check of [throws, garbage, empty]) {
      const r = await run(channel, check);
      expect(r).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
      expect(r).not.toHaveProperty('href');
    }
  });

  it('never calls the resolver for a card with nothing to dial or open, and never releases a link for it', async () => {
    const check = vi.fn<ActionTimeOpportunityCheck>(async () => ({ status: 'CLEAR' }));
    const noPhone = prismaFake({ persona: { id: 41, account_name: 'Acme Foods', email: null, phone: null, linkedin_url: null, hubspot_contact_id: null } });
    expect(await run('call', check, noPhone)).toMatchObject({ ok: false, reason: 'no_phone' });
    expect(await run('linkedin', check, noPhone)).toMatchObject({ ok: false, reason: 'no_linkedin' });
    expect(await run('call', check, prismaFake({ decision: null }))).toMatchObject({ ok: false, reason: 'decision_not_found' });
    expect(check).not.toHaveBeenCalled();
  });

  it('checks the account the card is for, with the person as the recipient identity', async () => {
    const check = vi.fn<ActionTimeOpportunityCheck>(async () => ({ status: 'CLEAR' }));
    await run('call', check);
    expect(check).toHaveBeenCalledWith(expect.anything(), 'Acme Foods', 'jordan@acme.example', NOW);
  });
});
