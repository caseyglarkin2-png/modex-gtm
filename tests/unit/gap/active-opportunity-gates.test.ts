/**
 * Final Monday blocker: the Gmail DRAFT and the direct SEND re-read HubSpot
 * opportunity truth at the click, account level, fail closed. These drive the
 * real draft/send code with the real action-time check over a fake HubSpot.
 */
import { describe, expect, it, vi } from 'vitest';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';
import { makeActiveOpportunityCheck } from '@/lib/gap/enroll/service';
import type { ExecutionReceipt } from '@/lib/gap/execution/contract';
import { NOW, baseDeps, db, gmailFake, prismaOf, type Db } from './fixtures/seller-db';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';
import { findManyFrom } from './fixtures/where';

const KROGER = 'c-kroger';
const OPEN_DEAL = { id: 'd-kroger', closed: 'false', name: 'YardFlow - Kroger', contacts: ['someone-else'] };
const YF = { serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai', displayName: 'Casey Larkin' };
const ACTOR = 'casey@freightroll.com';

/** The seller fixture plus the account identity the resolver reads (Kroger has a hubspot_company_id). */
function prismaWithIdentity(d: Db, hubspotCompanyId: string | null = KROGER) {
  const p: any = prismaOf(d);
  p.account = { findUnique: vi.fn(async () => ({ hubspot_company_id: hubspotCompanyId, pipeline_stage: 'targeted' })) };
  p.canonicalAccountLink = { findMany: vi.fn(async () => []) };
  p.$transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(p));
  p.emailLog = { ...p.emailLog, create: vi.fn(async () => ({ id: 1 })) };
  p.routingDecision.updateMany = vi.fn(async ({ where, data }: any) => {
    d.decisions.find((x) => x.id === where.id).human_action = data.human_action;
    return { count: 1 };
  });
  p.gapAuditEvent.findMany = vi.fn(async (args: any) => findManyFrom(d.audit, args));
  return p;
}

const via = (hs: ReturnType<typeof fakeHubSpot>, configured = true) => makeActiveOpportunityCheck({ reads: hs, configured: () => configured });

function direct() {
  return vi.fn(async (intent: any): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'sent', engineId: 'msg-1', threadId: 'thr-1', createdAt: intent.now, sentAt: intent.now }));
}

async function draftWith(hs: ReturnType<typeof fakeHubSpot>, opts: { configured?: boolean; hubspotCompanyId?: string | null; factAt?: Date } = {}) {
  const d = db();
  const gmail = gmailFake();
  const p = prismaWithIdentity(d, opts.hubspotCompanyId === undefined ? KROGER : opts.hubspotCompanyId);
  // R55: the newest verified fact at the account (a material change after a lost deal unparks it).
  if (opts.factAt) p.prospectingSignal = { findFirst: vi.fn(async () => ({ observed_at: opts.factAt })) };
  const r = await createSellerGmailDraft(p, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, {
    ...baseDeps(d, 'pass', gmail),
    activeOpportunity: via(hs, opts.configured ?? true),
  });
  return { r, gmail };
}

describe('GAP Gmail draft: HubSpot opportunity truth at the click', () => {
  it('an open deal on the account company refuses the draft (nothing reaches Gmail)', async () => {
    const { r, gmail } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [OPEN_DEAL.id] }, deals: [OPEN_DEAL] }));
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(String((r as { detail?: string }).detail)).toContain('YardFlow - Kroger');
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it('the open deal is with a DIFFERENT contact: the account is still blocked', async () => {
    const { r } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [OPEN_DEAL.id] }, deals: [{ ...OPEN_DEAL, contacts: ['not-joey'] }] }));
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
  });

  it('a closed deal is not an open one: with something material since it closed lost, the draft proceeds; without, the account is parked (R55)', async () => {
    const lost = { ...OPEN_DEAL, closed: 'true', won: 'false', closedate: '2026-01-05T00:00:00Z' };
    const { r, gmail } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [OPEN_DEAL.id] }, deals: [lost] }), { factAt: new Date('2026-09-01T00:00:00Z') });
    expect(r).toMatchObject({ ok: true });
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
    const parked = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [OPEN_DEAL.id] }, deals: [lost] }));
    expect(parked.r).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(String((parked.r as { detail?: string }).detail)).toMatch(/^Parked: "YardFlow - Kroger" closed lost/);
    expect(parked.gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it("an open deal on ANOTHER company does not block this account", async () => {
    const { r } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [], 'c-other': [OPEN_DEAL.id] }, deals: [OPEN_DEAL] }));
    expect(r).toMatchObject({ ok: true });
  });

  it('HubSpot read fails: UNKNOWN refuses the draft (fail closed)', async () => {
    const { r, gmail } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [] }, fail: { companyAssoc: new Error('HubSpot 503') } }));
    expect(r).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
    expect(String((r as { detail?: string }).detail)).toContain("Can't verify whether this account already has an active opportunity");
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it('HubSpot not configured: UNKNOWN refuses the draft', async () => {
    const { r } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [] } }), { configured: false });
    expect(r).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
  });

  it('company identity cannot be determined (no company id, no matching domain): UNKNOWN refuses the draft', async () => {
    const { r } = await draftWith(fakeHubSpot({}), { hubspotCompanyId: null });
    expect(r).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
  });

  it("local pipeline_stage 'targeted' is not the truth: HubSpot's open deal still refuses", async () => {
    // prismaWithIdentity returns pipeline_stage 'targeted' (production's value for every account).
    const { r } = await draftWith(fakeHubSpot({ companyDeals: { [KROGER]: [OPEN_DEAL.id] }, deals: [OPEN_DEAL] }));
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
  });
});

describe('direct send: HubSpot opportunity truth at the click', () => {
  it('routed and previewed while CLEAR, a deal opens before Send: the re-read refuses and nothing is sent', async () => {
    const d = db();
    const prisma = prismaWithIdentity(d);
    const world = { companyDeals: { [KROGER]: [] as string[] }, deals: [OPEN_DEAL] };
    const hs = fakeHubSpot(world);
    const deps = { ...baseDeps(d, 'pass'), gapSender: () => YF, signature: async () => '<div>Casey</div>', activeOpportunity: via(hs), directAdapter: direct() as any };
    const pv = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, deps);
    if (!pv.ok || !('preview' in pv)) throw new Error(`expected a preview, got ${JSON.stringify(pv)}`);

    world.companyDeals[KROGER] = [OPEN_DEAL.id]; // the AE opens a deal in HubSpot
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.preview.contentHash, recipient: pv.preview.to } }, deps);
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(deps.directAdapter).not.toHaveBeenCalled();
  });

  it('HubSpot unreadable at Send: UNKNOWN refuses and nothing is sent', async () => {
    const d = db();
    const prisma = prismaWithIdentity(d);
    const deps = { ...baseDeps(d, 'pass'), gapSender: () => YF, signature: async () => '<div>Casey</div>', activeOpportunity: via(fakeHubSpot({ fail: { byId: new Error('timeout') } })), directAdapter: direct() as any };
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, deps);
    expect(r).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
    expect(deps.directAdapter).not.toHaveBeenCalled();
  });
});
