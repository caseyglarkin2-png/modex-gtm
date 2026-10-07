// @vitest-environment node
/**
 * SPRINT 5 (GAP OS execution recovery, R50-R55): advance active opportunities, through the REAL routes, services,
 * ledger and Postgres (the embedded scratch database) with HubSpot answered by the harness's own stub server
 * (scripts/gap/recovery/stubs.mjs, spawned here on a loopback port: the real opportunity resolver and the real CRM
 * writer run against it). Only the session is mocked. The corpus holds two open deals under one company (Kroger: the
 * yard pilot with Ann, the Columbus DC deal with Ben), a closed-won customer (Costco), a closed-lost account (Sysco),
 * a scheduled meeting and a CANCELED one. Skipped without GAP_SCRATCH_DATABASE_URL. Run it on its own (it builds the
 * HubSpot client against the stub).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const URL_ = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
const RUN = SCRATCH_URL.test(URL_);

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ACTOR = 'casey@freightroll.com';

describe.skipIf(!RUN)('Sprint 5: advance active opportunities (scratch database, real routes and services, the HubSpot stub)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  type Corpus = import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let corpus: Corpus;
  let stub: ChildProcess;
  let base = '';
  let dir = '';
  let dealsFile = '';
  const tag = `s5-${Date.now().toString(36)}`;
  const account = (b: string) => corpus.accounts.find((a) => a.name.startsWith(b))!;
  const stubGet = async (path: string) => (await fetch(`${base}${path}`)).json();
  const stubPost = async (path: string, body: unknown) => (await fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
  const writeDeals = (deals: Corpus['stub']['deals']) => writeFileSync(dealsFile, JSON.stringify(deals));

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED']) process.env[f] = 'true';
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    corpus = await seedCorpus(prisma, { tag });
    // The harness's own HubSpot stub, on a loopback port, answering from this corpus's deals file.
    dir = mkdtempSync(join(tmpdir(), 'gap-s5-'));
    dealsFile = join(dir, 'deals.json');
    writeDeals(corpus.stub.deals);
    const port = 4600 + Math.floor(Math.random() * 300);
    base = `http://127.0.0.1:${port}`;
    stub = spawn(process.execPath, ['scripts/gap/recovery/stubs.mjs', String(port)], { env: { ...process.env, STUB_DEALS_FILE: dealsFile, STUB_COMPANIES: corpus.stub.companies.join('|'), STUB_WRITES_FILE: join(dir, 'writes.jsonl'), STUB_LOG: join(dir, 'requests.jsonl') }, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('the stub did not start')), 20_000);
      stub.stdout!.on('data', (b: Buffer) => {
        if (/stubs listening/.test(b.toString())) {
          clearTimeout(t);
          resolve();
        }
      });
    });
    // The real HubSpot client, pointed at the stub (never HubSpot): loopback only, a throwaway token.
    process.env.HUBSPOT_API_BASE_PATH = base;
    process.env.HUBSPOT_ACCESS_TOKEN = 'scratch-stub-token';
    expect(process.env.HUBSPOT_API_BASE_PATH).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  }, 240_000);
  afterAll(async () => {
    stub?.kill();
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    delete process.env.HUBSPOT_API_BASE_PATH;
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
    rmSync(dir, { recursive: true, force: true });
    await prisma?.$disconnect();
  });

  async function krogerTruth() {
    const { resolveAccountOpportunity } = await import('@/lib/gap/opportunity/active-opportunity');
    return resolveAccountOpportunity(prisma, account('Kroger').name);
  }
  async function workspace() {
    const { loadAccountDealWorkspace } = await import('@/lib/gap/deals/workspace');
    const t = await krogerTruth();
    if (t.status !== 'ACTIVE') throw new Error(`Kroger is not in a deal: ${JSON.stringify(t)}`);
    return loadAccountDealWorkspace(prisma, { accountName: account('Kroger').name, deals: t.deals.map((d) => ({ id: d.id, name: d.name, stage: d.stage, nextStep: d.nextStep ?? null, contactIds: d.contactIds })), now: new Date() });
  }
  const dealIds = () => corpus.stub.deals[account('Kroger').name].map((d) => String(d.id));

  describe('R50: two opportunities under one company', () => {
    it('the real resolver reads both deals from the stub, each with its own contact; obligations and buyer words recorded through the routes stay with their own deal; account-level work is labeled', async () => {
      const kroger = account('Kroger');
      const [pilot, columbus] = dealIds();
      const ann = kroger.people.find((p) => p.name.startsWith('Ann'))!;
      const ben = kroger.people.find((p) => p.name.startsWith('Ben'))!;
      const t = await krogerTruth();
      expect(t.status).toBe('ACTIVE');
      if (t.status !== 'ACTIVE') return;
      expect(t.deals.map((d) => [d.id, d.name, d.contactIds.length])).toEqual([[pilot, `YardFlow - ${kroger.name}`, 1], [columbus, `${kroger.name} Columbus DC`, 1]]);
      // Obligations through the real route: one per deal, one account-level.
      const { POST: commit } = await import('@/app/api/gap/commitments/route');
      for (const [title, dealId] of [['Send the pilot plan', pilot], ['Book the Columbus yard walk', columbus], ['Ask who runs the Atlanta yards', null]] as const) {
        const r = await commit(req('/api/gap/commitments', 'POST', { op: 'create', accountName: kroger.name, kind: 'deal_step', title, dueDay: new Date(Date.now() + 2 * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), ...(dealId ? { dealId } : {}) }));
        expect(r.status, JSON.stringify(await r.clone().json())).toBe(201);
      }
      // Buyer words: Ben's from a note opened on the Columbus deal (Capture binds them to the deal by its id).
      const { proposeHypothesis } = await import('@/lib/gap/hypothesis/service');
      const { citedQuote } = await import('@/lib/gap/research/propose');
      const fact = kroger.facts[0];
      const h = await proposeHypothesis(prisma, { accountName: kroger.name, primaryPersonaId: ben.id, observation: citedQuote(`${kroger.name} automates Ohio DC`, `${kroger.name} is automating its Ohio distribution center with a new robotic fulfillment system.`, fact.id, kroger.name), signalIds: [fact.id], primarySignalId: fact.id, sourceRef: `s5:${tag}`, persona: 'transportation', problemFamily: 'hidden_capacity', problemHypothesis: 'My guess is the gate is where the day is lost.', rootCauseHypotheses: ['Manual check-in'], impactHypotheses: ['Detention'], whyNow: null, falsificationQuestions: ['Do trailers wait?'], whatANoMeans: 'If trailers do not wait, this is closed.', confidence: 40, createdBy: ACTOR });
      const hypothesisId = h.ok ? h.id : (h as { existingId?: string }).existingId!;
      const { POST: saveNote } = await import('@/app/api/gap/captures/route');
      const note = await saveNote(req('/api/gap/captures', 'POST', { accountName: kroger.name, personaId: ben.id, dealId: columbus, dealName: `${kroger.name} Columbus DC`, source: { kind: 'account', id: kroger.slug }, context: 'call', rawText: 'Ben: We lose about 3 hours per shift hunting for trailers at the Columbus gate.' }));
      const view = (await note.json()) as { id: string; dealId: string; dealName: string; candidates: Array<{ id: string }> };
      expect(note.status).toBe(201);
      expect([view.dealId, view.dealName]).toEqual([columbus, `${kroger.name} Columbus DC`]);
      const { POST: decide } = await import('@/app/api/gap/captures/[id]/route');
      const d = await decide(req(`/api/gap/captures/${view.id}`, 'POST', { op: 'decide', candidateId: view.candidates[0].id, decision: 'confirm', type: 'business_problem', hypothesisId }), { params: Promise.resolve({ id: view.id }) });
      expect(d.status, JSON.stringify(await d.clone().json())).toBe(200);
      // The words are bound to the Columbus deal by its id, recorded on the row (not inferred from Ben's contact).
      const stored = await prisma.buyerInputData.findFirst({ where: { account_name: kroger.name, raw_buyer_language: { contains: 'hunting for trailers' } }, select: { metadata: true } });
      expect((stored?.metadata as { scope?: unknown } | null)?.scope).toEqual({ dealId: columbus });
      // Ann's requirement through the BID route, scoped to the pilot.
      const { POST: bid } = await import('@/app/api/gap/bids/route');
      const b = await bid(req('/api/gap/bids', 'POST', { hypothesisId, contactEmail: ann.email, type: 'constraint', rawBuyerLanguage: 'Any pilot has to run on our existing gate cameras.', source: 'call', scope: { dealId: pilot } }));
      expect(b.status, JSON.stringify(await b.clone().json())).toBe(201);

      const w = await workspace();
      const byDeal = (id: string) => w.opportunities.deals.find((x) => x.dealId === id)!;
      expect(byDeal(pilot).contacts.map((p) => p.name)).toEqual([ann.name]);
      expect(byDeal(columbus).contacts.map((p) => p.name)).toEqual([ben.name]);
      expect(byDeal(pilot).commitments.map((c) => c.title)).toEqual(['Send the pilot plan']);
      expect(byDeal(columbus).commitments.map((c) => c.title)).toEqual(['Book the Columbus yard walk']);
      expect(byDeal(pilot).needs.map((n) => n.quote)).toEqual(['Any pilot has to run on our existing gate cameras.']);
      expect(byDeal(columbus).needs.map((n) => [n.quote, n.scope.basis])).toEqual([['We lose about 3 hours per shift hunting for trailers at the Columbus gate.', 'recorded']]);
      expect(w.opportunities.accountLevel.commitments.map((c) => [c.title, c.scope.label])).toEqual([['Ask who runs the Atlanta yards', 'account-level']]);
      expect(byDeal(pilot).nextStep).toBe('Pilot scope call with Ann');
      // An open deal still blocks a cold first touch at the click (the real action-time check, HubSpot via the stub).
      const { checkActiveOpportunityNow } = await import('@/lib/gap/enroll/service');
      expect(await checkActiveOpportunityNow(prisma, kroger.name, ann.email, new Date())).toMatchObject({ status: 'ACTIVE', detail: expect.stringMatching(/open HubSpot deal/) });
    }, 120_000);
  });

  describe('R51: meetings from the record', () => {
    it('the scheduled meeting is due with its prepared starting point (its own deal\'s words only); the canceled one waits; a moved meeting is read at its new time', async () => {
      const kroger = account('Kroger');
      const { loadMeetingRows, loadMeetingStartingPoints } = await import('@/lib/gap/work/day-load');
      const { loadCommitments } = await import('@/lib/gap/work/commitments');
      const { workDay } = await import('@/lib/gap/work/list');
      const now = new Date();
      const rows = (await loadMeetingRows(prisma, now)).filter((m) => m.accountName === kroger.name);
      expect(rows.map((m) => [m.what, m.canceled]).sort()).toEqual([['Columbus yard walk with Ben', false], ['Pilot scope call', true]]);
      const commitments = await loadCommitments(prisma, { accountNames: [kroger.name] });
      const preps = await loadMeetingStartingPoints(prisma, rows.filter((m) => new Date(m.at).getTime() <= now.getTime() + 24 * 3_600_000), commitments, now);
      const walk = rows.find((m) => !m.canceled)!;
      const day = (at: Date) => workDay({ now: at, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [{ accountName: kroger.name, deals: dealIds().map((id, n) => ({ id, name: n ? `${kroger.name} Columbus DC` : `YardFlow - ${kroger.name}`, stage: 'x' })) }] }, commitments, meetings: rows.filter((m) => !m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId })), canceledMeetings: rows.filter((m) => m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId })), meetingPreps: preps });
      // Read the morning of the meeting (8 am New York the day of the walk): it is due, prepared, on the Columbus deal.
      const { nyDay, nyDayAt } = await import('@/lib/gap/work/dates');
      const morning = nyDayAt(nyDay(walk.at), 8);
      const { loadMeetingStartingPoints: lmsp } = await import('@/lib/gap/work/day-load');
      const morningPreps = await lmsp(prisma, [walk], commitments, morning);
      const d = workDay({ now: morning, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [{ accountName: kroger.name, deals: dealIds().map((id, n) => ({ id, name: n ? `${kroger.name} Columbus DC` : `YardFlow - ${kroger.name}`, stage: 'x' })) }] }, commitments, meetings: [{ accountName: walk.accountName, at: walk.at, what: walk.what, meetingId: walk.meetingId, dealId: walk.dealId }], canceledMeetings: rows.filter((m) => m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId })), meetingPreps: morningPreps });
      const o = d.cards.find((c) => c.accountName === kroger.name)!.obligations!.find((x) => x.kind === 'meeting')!;
      expect(o).toMatchObject({ scope: `Deal: ${kroger.name} Columbus DC`, href: `/gap/accounts/${kroger.slug}?view=brief#meeting-${walk.meetingId}` });
      expect(o.prep).toMatch(/^Objective: Columbus yard walk with Ben\./);
      expect(o.prep).toMatch(/1 confirmed need on record\./);
      expect(d.waiting.map((w) => w.line)).toContain('Canceled: nothing to prepare unless it is rebooked.');
      expect(day(now).waiting.some((w) => w.title.includes('Pilot scope call'))).toBe(true);
      // The workspace prepares the Columbus meeting inside its deal: Ben's words, never the pilot's requirement.
      const w = await workspace();
      const prep = w.meetings.find((m) => m.meetingId === walk.meetingId)!;
      expect(prep.dealId).toBe(dealIds()[1]);
      expect(prep.confirmedNeeds.map((n) => n.text)).toEqual(['Problem: "We lose about 3 hours per shift hunting for trailers at the Columbus gate."']);
      expect(w.meetings.find((m) => m.state === 'canceled')?.headline).toMatch(/^Canceled: Pilot scope call/);
      // Moved three days out: the row is the truth, and it is no longer due that morning.
      await prisma.meeting.update({ where: { id: walk.meetingId }, data: { meeting_date: new Date(new Date(walk.at).getTime() + 3 * 86_400_000) } });
      const moved = (await loadMeetingRows(prisma, morning, 6 * 86_400_000)).find((m) => m.meetingId === walk.meetingId)!;
      expect(new Date(moved.at).getTime() - new Date(walk.at).getTime()).toBe(3 * 86_400_000);
      const d2 = workDay({ now: morning, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, commitments: [], meetings: [{ accountName: moved.accountName, at: moved.at, what: moved.what, meetingId: moved.meetingId }] });
      expect(d2.cards.some((c) => c.accountName === kroger.name)).toBe(false);
    }, 120_000);
  });

  describe('R52 and R53: the plan and the next artifact', () => {
    it('one review through the route agrees, dates and declines milestones on the pilot deal (once); the recap for Columbus carries only Ben\'s words and is prepared, never sent', async () => {
      const kroger = account('Kroger');
      const [pilot, columbus] = dealIds();
      const { POST, GET } = await import('@/app/api/gap/deals/plan/route');
      const body = { op: 'review', accountName: kroger.name, dealId: pilot, items: [{ step: 'discovery', decision: 'agree' }, { step: 'pilot', decision: 'agree', dueDay: '2026-10-30', responsible: { side: 'buyer', name: 'Ann Scratch' } }, { step: 'procurement', decision: 'decline', reason: 'pilot budget' }] };
      const r1 = await POST(req('/api/gap/deals/plan', 'POST', body));
      expect(r1.status).toBe(200);
      const rows = await prisma.gapAuditEvent.count({ where: { subject_type: 'account', subject_id: kroger.name } });
      const r2 = await POST(req('/api/gap/deals/plan', 'POST', { ...body, items: body.items.filter((x) => x.decision === 'agree') }));
      expect(((await r2.json()) as { results: Array<{ created: boolean }> }).results.map((x) => x.created)).toEqual([false, false]);
      expect(await prisma.gapAuditEvent.count({ where: { subject_type: 'account', subject_id: kroger.name } })).toBe(rows);
      const plan = ((await (await GET(req(`/api/gap/deals/plan?account=${encodeURIComponent(kroger.name)}&deal=${pilot}`, 'GET'))).json()) as { plan: Array<{ step: string; state: string; buyerAgreed: unknown; line: string | null }> }).plan;
      expect(plan.map((m) => [m.step, m.state])).toEqual([['discovery', 'agreed'], ['site_validation', 'proposed'], ['pilot', 'agreed'], ['stakeholder_alignment', 'proposed'], ['procurement', 'declined']]);
      expect(plan.find((m) => m.step === 'discovery')).toMatchObject({ buyerAgreed: null, line: 'No date agreed yet.' });
      const w = await workspace();
      const recap = w.artifacts[columbus].all.find((a) => a.kind === 'recap')!;
      expect(recap.text).toContain('"We lose about 3 hours per shift hunting for trailers at the Columbus gate."');
      expect(recap.text).not.toContain('gate cameras');
      expect(recap).toMatchObject({ status: 'Prepared, not sent', governed: false, problems: [] });
      expect(w.artifacts[pilot].all.find((a) => a.kind === 'recap')!.text).not.toMatch(/What we agreed as next steps/);
    }, 120_000);
  });

  describe('R54: bounded, recoverable CRM sync against the stub', () => {
    it('approved with writes off: recorded, not written (the stub saw no write); with writes on: a failure keeps the text, the retry writes once, a lost answer is recovered, a newer human value is never overwritten', async () => {
      const kroger = account('Kroger');
      const [pilot] = dealIds();
      const { POST } = await import('@/app/api/gap/crm-sync/route');
      const post = async (b: unknown) => {
        const r = await POST(req('/api/gap/crm-sync', 'POST', b));
        return { status: r.status, body: (await r.json()) as { item?: { proposalId: string; state: string; detail: string | null; objectRef: string | null }; error?: string } };
      };
      const note = { kind: 'note', objectType: 'deal', objectId: pilot, body: `Recap for the pilot (${tag}).` };
      const origin = { kind: 'recap', id: `${pilot}:${tag}`, label: 'the agreed recap prepared in GAP' };
      // OFF (as in production): the pair is recorded, nothing reaches the stub.
      const off = await post({ op: 'approve', accountName: kroger.name, dealId: pilot, dealName: `YardFlow - ${kroger.name}`, change: note, origin });
      expect([off.status, off.body.item?.state]).toEqual([200, 'off']);
      expect(((await stubGet('/__stub/writes')) as { notes: unknown[] }).notes).toHaveLength(0);
      const id = off.body.item!.proposalId;
      expect(await prisma.gapAuditEvent.count({ where: { subject_type: 'crm_sync', subject_id: id, kind: { in: ['crm.sync_proposed', 'crm.sync_approved'] } } })).toBe(2);
      // ON, against the stub only (loopback asserted): HubSpot down -> failed, the text kept.
      expect(process.env.HUBSPOT_API_BASE_PATH).toMatch(/^http:\/\/127\.0\.0\.1:/);
      process.env.GAP_HUBSPOT_MIRROR_ENABLED = 'true';
      process.env.ALLOW_EXTERNAL_WRITES_IN_TEST = 'true';
      try {
        await stubPost('/__stub/control', { failWrites: true });
        const failed = await post({ op: 'retry', proposalId: id });
        expect(failed.body.item).toMatchObject({ state: 'failed' });
        expect(failed.body.item?.detail).toMatch(/503|unavailable/i);
        await stubPost('/__stub/control', { failWrites: false });
        const written = await post({ op: 'retry', proposalId: id });
        expect(written.body.item).toMatchObject({ state: 'written' });
        const again = await post({ op: 'retry', proposalId: id });
        expect(again.body.item?.state).toBe('written');
        const notes = ((await stubGet('/__stub/writes')) as { notes: Array<{ properties: { hs_note_body: string } }> }).notes.filter((n) => n.properties.hs_note_body.includes(tag));
        expect(notes).toHaveLength(1);
        expect(notes[0].properties.hs_note_body).toContain(`GAP reference gapcrm${id.replace(/^crm/, '')}`);
        // A task whose answer is lost after the write: the retry finds it by its external id (never a second).
        const { loadCommitments } = await import('@/lib/gap/work/commitments');
        const plan = (await loadCommitments(prisma, { accountNames: [kroger.name] })).find((c) => c.title === 'Send the pilot plan')!;
        await stubPost('/__stub/control', { failWrites: 'after_write' });
        const task = await post({ op: 'approve', accountName: kroger.name, dealId: pilot, change: { kind: 'task', objectType: 'deal', objectId: pilot, subject: `Send the pilot plan (${tag})`, body: 'From GAP.', dueAt: null }, origin: { kind: 'commitment', id: plan.commitmentId, label: 'the GAP obligation' } });
        expect(task.body.item?.state).toBe('failed');
        await stubPost('/__stub/control', { failWrites: false });
        const recovered = await post({ op: 'retry', proposalId: task.body.item!.proposalId });
        expect(recovered.body.item).toMatchObject({ state: 'written', detail: 'found in HubSpot by its GAP reference' });
        expect(((await stubGet('/__stub/writes')) as { tasks: Array<{ properties: { hs_task_subject: string } }> }).tasks.filter((t) => t.properties.hs_task_subject.includes(tag))).toHaveLength(1);
        // The deal's next step: a person edits it in HubSpot after the seller saw it; the approval never overwrites it.
        const milestone = (await loadCommitments(prisma, { accountNames: [kroger.name] })).find((c) => c.source.kind === 'plan' && c.dealId === pilot && c.title.startsWith('Pilot'))!;
        await stubPost('/__stub/deal-property', { dealId: pilot, property: 'hs_next_step', value: `Ann is out until Oct 12 (${tag})`, sourceType: 'CRM_UI' });
        const conflict = await post({ op: 'approve', accountName: kroger.name, dealId: pilot, change: { kind: 'deal_property', objectType: 'deal', objectId: pilot, property: 'hs_next_step', from: 'Pilot scope call with Ann', to: `Pilot (${tag})` }, origin: { kind: 'plan', id: milestone.commitmentId, label: 'the next agreed milestone in the plan' } });
        expect(conflict.body.item).toMatchObject({ state: 'conflict' });
        const t = await krogerTruth();
        expect(t.status === 'ACTIVE' && t.deals.find((d) => d.id === pilot)?.nextStep).toBe(`Ann is out until Oct 12 (${tag})`);
      } finally {
        delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
        delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
        await stubPost('/__stub/control', { failWrites: false });
      }
    }, 120_000);
  });

  describe('R55: won, lost and reopened', () => {
    it('a closed-won customer is refused a cold touch at the click and held as a customer; a lost account is parked until a newer verified fact; reopening a deal makes one next step and revives nothing', async () => {
      const { resolveAccountOpportunity } = await import('@/lib/gap/opportunity/active-opportunity');
      const { checkActiveOpportunityNow } = await import('@/lib/gap/enroll/service');
      const costco = account('Costco');
      const won = await resolveAccountOpportunity(prisma, costco.name);
      expect(won).toMatchObject({ status: 'CLEAR', closure: { kind: 'customer' } });
      expect(await checkActiveOpportunityNow(prisma, costco.name, costco.people[0].email, new Date())).toMatchObject({ status: 'ACTIVE', detail: expect.stringMatching(/^A customer: ".+" closed won on Sep 15, 2026\. No first-touch campaign here/) });
      const sysco = account('Sysco');
      expect(await checkActiveOpportunityNow(prisma, sysco.name, sysco.people[0].email, new Date())).toMatchObject({ status: 'ACTIVE', detail: expect.stringMatching(/^Parked: ".+" closed lost on Sep 1, 2026/) });
      // Something material: a verified fact registered after the loss.
      const { registerSignal } = await import('@/lib/gap/signals/registry');
      const { VERIFIED_EXCERPT } = await import('@/lib/gap/research/evidence-gate');
      await registerSignal(prisma, { accountName: sysco.name, sourceKind: 'evidence_record', sourceId: `s5:${tag}:sysco-new`, type: 'site_expansion' as never, title: `${sysco.name} adds a Texas hub`, sourceType: 'public_secondary', evidenceUrl: `https://news.example.com/${sysco.slug}/texas-${tag}`, evidenceText: `${sysco.name} is opening a new distribution hub in Texas.`, externalOk: true, observedAt: new Date('2026-09-25T00:00:00Z'), confidence: 80, metadata: { verified: VERIFIED_EXCERPT }, registeredBy: ACTOR });
      expect(await checkActiveOpportunityNow(prisma, sysco.name, sysco.people[0].email, new Date())).toEqual({ status: 'CLEAR' });

      // Kroger's pilot deal closes lost, then reopens: its open work is skipped and kept; one next step comes back.
      const kroger = account('Kroger');
      const [pilot] = dealIds();
      const { syncDealStates } = await import('@/lib/gap/deals/closure');
      const { loadCommitments } = await import('@/lib/gap/work/commitments');
      const sync = async () => {
        const t = await resolveAccountOpportunity(prisma, kroger.name);
        if (t.status === 'UNKNOWN') throw new Error('unknown');
        return syncDealStates(prisma, { accountName: kroger.name, open: t.status === 'ACTIVE' ? t.deals.map((d) => ({ id: d.id, name: d.name })) : [], closed: t.closed ?? [], now: new Date() });
      };
      await sync();
      const deals = corpus.stub.deals[kroger.name];
      writeDeals({ ...corpus.stub.deals, [kroger.name]: deals.map((d) => (String(d.id) === pilot ? { ...d, hs_is_closed: true, hs_is_closed_won: false, closedate: new Date().toISOString() } : d)) });
      const closed = await sync();
      expect(closed.closed).toEqual([pilot]);
      const afterClose = (await loadCommitments(prisma, { accountNames: [kroger.name] })).filter((c) => c.dealId === pilot);
      expect(afterClose.filter((c) => c.status !== 'skipped')).toEqual([]);
      expect(afterClose.find((c) => c.title === 'Send the pilot plan')?.reason).toMatch(/closed lost on .+; kept for history$/);
      writeDeals(corpus.stub.deals);
      const reopened = await sync();
      expect([reopened.reopened, reopened.created]).toEqual([[pilot], 1]);
      const open = (await loadCommitments(prisma, { accountNames: [kroger.name] })).filter((c) => c.dealId === pilot && c.status !== 'skipped');
      expect(open.map((c) => c.title)).toEqual([`Reopened: decide the next step on "YardFlow - ${kroger.name}"`]);
      expect((await sync()).created).toBe(0);
    }, 180_000);
  });
});
