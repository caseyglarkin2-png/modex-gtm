// @vitest-environment node
/**
 * R62 MATRIX, DEALS (the Sprint 5 review cases added to the R62 list at 4e936a90): two open deals under one company,
 * the words, obligations and meetings recorded through the REAL routes (POST /api/gap/bids, POST /api/gap/commitments,
 * POST /api/gap/crm-sync), HubSpot's deals answered by the stub and read by the REAL opportunity resolver, the deal
 * states reconciled the way the account page does it (syncDealStates over the live read), and the page's own reads
 * (loadAccountView, loadAccountDealWorkspace, the Work day). A deal HubSpot closes is named with its outcome and never
 * by its id; a reopened deal lists what its closure skipped and Restore is refused while it is closed; a new recap
 * retires the earlier unwritten one; buyer words carry their deal; the artifacts speak to their recipient. Skipped
 * without GAP_SCRATCH_DATABASE_URL pointing at the matrix database (127.0.0.1:55433/gap_matrix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const MATRIX_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
const RUN = MATRIX_URL.test(process.env.GAP_SCRATCH_DATABASE_URL ?? '');

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nyDayIn = (days: number) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

const PROBLEM = 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.';
const DETENTION = 'We pay about forty thousand a month in detention at Columbus.';
const CAMERAS = 'Any pilot has to run on our existing gate cameras.';
/** HubSpot's closedate for the closures here: a fixed past instant, so the outcome reads "closed won, Oct 5, 2026". */
const CLOSED_AT = '2026-10-05T16:00:00.000Z';

describe.skipIf(!RUN)('R62 matrix: deals (two opportunities, closure and reopening, recaps, scope and voice through the real routes)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  let s: import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder;
  const tag = `mdl${Date.now().toString(36)}`;
  type Person = { id: number; name: string; title: string | null; email: string };
  type StubDeal = import('@/scripts/gap/recovery/seed-corpus').StubDeal;
  type PrepLine = import('@/lib/gap/deals/meeting-prep').PrepLine;
  type Deal = { a: import('@/scripts/gap/recovery/seed-matrix').MatrixAccount; h: string; ann: Person; ben: Person; cal: Person; pilot: StubDeal; columbus: StubDeal };
  const D: Record<string, Deal> = {};

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    const { taggedId } = await import('@/scripts/gap/recovery/seed-corpus');
    s = createMatrixSeeder(prisma, tag);
    // Each case its own account: a thesis to hang the buyer's words on, Ann on the pilot deal (its CRM name carries a
    // suffix, the way HubSpot names it), Ben on the Columbus DC deal, Cal on neither.
    let n = 0;
    for (const k of ['Closed', 'Reopen', 'Recap', 'Scope', 'Voice']) {
      n += 1;
      const r = await s.readyAccount(`Deals ${k} Co`);
      const cid = (i: number) => String(taggedId(tag, 500 + n * 10 + i));
      const ann = await s.person(r.a, 'Ann', 'VP Supply Chain Operations', { hubspotContactId: cid(1) });
      const ben = await s.person(r.a, 'Ben', 'Director, Columbus Distribution Center', { hubspotContactId: cid(2) });
      const cal = await s.person(r.a, 'Cal', 'VP Transportation', { hubspotContactId: cid(3) });
      const pilot = s.openDeal(r.a, n * 10 + 1, { dealname: `YardFlow - ${r.a.name} x71007`, contacts: [cid(1)], hs_next_step: 'Pilot scope call with Ann' });
      const columbus = s.openDeal(r.a, n * 10 + 2, { dealname: `${r.a.name} Columbus DC`, dealstage: 'qualifiedtobuy', contacts: [cid(2)] });
      D[k] = { a: r.a, h: r.h, ann, ben, cal, pilot, columbus };
    }
    h = await startMatrixHarness({ companies: s.companies, deals: s.deals });
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
  }, 300_000);
  afterAll(async () => {
    delete process.env.GAP_CRM_APPROVED_WRITES_ENABLED;
    delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
    await h?.stop();
    await prisma?.$disconnect();
  });

  /** HubSpot closes the Columbus deal won (the stub's deals file, read by the real resolver). */
  function closeColumbus(d: Deal) {
    Object.assign(d.columbus, { hs_is_closed: true, hs_is_closed_won: true, closedate: CLOSED_AT, dealstage: 'closedwon' });
    h.setDeals(s.deals);
  }
  function reopenColumbus(d: Deal) {
    Object.assign(d.columbus, { hs_is_closed: false, dealstage: 'qualifiedtobuy' });
    delete d.columbus.hs_is_closed_won;
    delete d.columbus.closedate;
    h.setDeals(s.deals);
  }
  const closedLabel = (d: Deal) => `${d.columbus.dealname} (closed won, Oct 5, 2026)`;

  async function truth(d: Deal) {
    const { resolveAccountOpportunity } = await import('@/lib/gap/opportunity/active-opportunity');
    return resolveAccountOpportunity(prisma, d.a.name);
  }
  /** The account page's reconcile (page.tsx): syncDealStates over the live read, never on an UNKNOWN read. */
  async function sync(d: Deal) {
    const { syncDealStates } = await import('@/lib/gap/deals/closure');
    const t = await truth(d);
    if (t.status === 'UNKNOWN') throw new Error(`the deal read is unknown: ${JSON.stringify(t)}`);
    return syncDealStates(prisma, { accountName: d.a.name, open: t.status === 'ACTIVE' ? t.deals.filter((x) => !!x.id).map((x) => ({ id: x.id, name: x.name })) : [], closed: t.closed ?? [], now: new Date() });
  }
  /** The account page's deal workspace (view=brief): the open deals and the closed ones from the same live read. */
  async function workspace(d: Deal) {
    const { loadAccountDealWorkspace } = await import('@/lib/gap/deals/workspace');
    const t = await truth(d);
    const open = t.status === 'ACTIVE' ? t.deals : [];
    return loadAccountDealWorkspace(prisma, {
      accountName: d.a.name,
      deals: open.map((x) => ({ id: x.id, name: x.name, stage: x.stage, nextStep: x.nextStep ?? null, closeDate: x.closeDate ?? null, amount: x.amount ?? null, contactIds: x.contactIds ?? [] })) as never,
      now: new Date(),
      closedDeals: t.status === 'UNKNOWN' ? [] : t.closed ?? [],
    });
  }
  /** The account page's own read (NOW, the brief, the story): the real loaders and projections. */
  async function pageRead(d: Deal) {
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const now = new Date();
    const loaded = (await loadAccountView(prisma, d.a.slug, now, { live: true, context: true } as never)) as unknown as { brief: never; inputs: never } | null;
    if (!loaded) throw new Error(`account not loaded: ${d.a.name}`);
    const c = await loadAccountContext(prisma, loaded.inputs, now);
    const pursuit = await loadPursuit(prisma, { brief: loaded.brief, inputs: loaded.inputs, ctx: c, now });
    return { brief: loaded.brief, inputs: loaded.inputs, c, pursuit, now };
  }
  /** The buyer's words through POST /api/gap/bids (the seller's session confirms them), scoped to a deal or not. */
  async function bid(d: Deal, who: Person, type: string, words: string, dealId: string | null) {
    const { POST } = await import('@/app/api/gap/bids/route');
    const res = await POST(req('/api/gap/bids', 'POST', { hypothesisId: d.h, contactEmail: who.email, type, rawBuyerLanguage: words, source: 'call', ...(dealId ? { scope: { dealId } } : {}) }));
    const body = (await res.json()) as { bidId?: string; error?: string };
    expect(res.status, JSON.stringify(body)).toBe(201);
    return body.bidId!;
  }
  async function commit(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/gap/commitments/route');
    const res = await POST(req('/api/gap/commitments', 'POST', body));
    return { status: res.status, body: (await res.json()) as { created?: boolean; commitment?: { commitmentId: string; dueAt: string | null; status: string }; error?: string } };
  }

  it('a deal closed in HubSpot is named with its outcome on its kept rows, in Work and in meeting preparation; never its id', async () => {
    const d = D.Closed;
    const columbusId = String(d.columbus.id);
    // Recorded while the deal is open: Ben's detention figure on the Columbus deal, and his yard walk tomorrow on it.
    await bid(d, d.ben, 'metric', DETENTION, columbusId);
    const tomorrow = new Date(`${nyDayIn(1)}T00:00:00Z`);
    const meetingId = await s.meeting(d.a, 'walk', { date: tomorrow, time: '10:00 AM', status: 'Scheduled', objective: 'Columbus yard walk with Ben', attendees: d.ben.name, dealId: columbusId });
    expect((await sync(d)).closed).toEqual([]);
    // HubSpot closes Columbus won; the page's reconcile records the closure GAP keeps.
    closeColumbus(d);
    expect((await sync(d)).closed).toEqual([columbusId]);
    const { loadRecordedClosures } = await import('@/lib/gap/deals/closure');
    const recorded = await loadRecordedClosures(prisma, [d.a.name]);
    expect(recorded.get(columbusId)).toMatchObject({ id: columbusId, name: d.columbus.dealname, won: true, closedAt: expect.stringMatching(/^2026-10-05T16:00:00(?:\.000)?Z$/) });

    // The account page (view=brief): the kept words and the meeting preparation name the deal with its outcome.
    const w = await workspace(d);
    expect(w.opportunities.closed).toEqual([{ dealId: columbusId, label: closedLabel(d) }]);
    expect(w.opportunities.elsewhere.needs.map((x) => [x.quote, x.scope.label])).toEqual([[DETENTION, `Deal: ${closedLabel(d)}`]]);
    const prep = w.meetings.find((m) => m.meetingId === meetingId);
    expect(prep, JSON.stringify(w.meetings.map((m) => [m.meetingId, m.headline]))).toBeDefined();
    expect([prep!.dealName, prep!.confirmedNeeds.map((x) => x.text)]).toEqual([closedLabel(d), [expect.stringContaining(`"${DETENTION}"`)]]);
    const prepLines = [prep!.objective, ...prep!.attendees, prep!.lastCommitment, ...prep!.confirmedNeeds, ...prep!.openQuestions, ...prep!.toTest, ...prep!.publicContext, ...prep!.materials].filter((l): l is PrepLine => !!l);
    const prepText = [prep!.headline, prep!.dealName ?? '', prep!.startingPoint, ...prepLines.flatMap((l) => [l.text, l.source ?? ''])];
    expect(prepText.filter((t) => t.includes(columbusId))).toEqual([]);

    // Work, the morning of the walk (the page's own composition): the meeting's obligation names the closed deal.
    const { loadMeetingRows, loadMeetingStartingPoints } = await import('@/lib/gap/work/day-load');
    const { loadCommitments } = await import('@/lib/gap/work/commitments');
    const { workDay } = await import('@/lib/gap/work/list');
    const { nyDay, nyDayAt } = await import('@/lib/gap/work/dates');
    const walk = (await loadMeetingRows(prisma, new Date())).find((m) => m.meetingId === meetingId);
    expect(walk?.dealId).toBe(columbusId);
    const morning = nyDayAt(nyDay(walk!.at), 8);
    const commitments = await loadCommitments(prisma, { accountNames: [d.a.name] });
    const t = await truth(d);
    const open = t.status === 'ACTIVE' ? t.deals.map((x) => ({ id: x.id, name: x.name, stage: x.stage })) : [];
    expect(open.map((x) => x.id)).toEqual([String(d.pilot.id)]);
    const day = workDay({
      now: morning,
      candidates: [],
      replies: [],
      motions: [],
      held: new Map(),
      inDeals: { status: 'complete', accounts: [{ accountName: d.a.name, deals: open }] },
      commitments,
      meetings: [{ accountName: walk!.accountName, at: walk!.at, what: walk!.what, meetingId: walk!.meetingId, dealId: walk!.dealId }],
      meetingPreps: await loadMeetingStartingPoints(prisma, [walk!], commitments, morning),
      closedDeals: recorded,
    } as never);
    const card = day.cards.find((c) => c.accountName === d.a.name);
    const meeting = card?.obligations?.find((o) => o.kind === 'meeting');
    expect(meeting?.scope, JSON.stringify(card?.obligations)).toBe(`Deal: ${closedLabel(d)}`);
    const cardText = [card!.rankWhy ?? '', ...(card!.obligations ?? []).flatMap((o) => [o.title, o.line, o.scope ?? '', (o as { prep?: string | null }).prep ?? ''])];
    expect(cardText.filter((x) => x.includes(columbusId))).toEqual([]);
  }, 240_000);

  it('a reopened deal lists what its closure skipped; Restore makes one open obligation, refused while the deal is closed', async () => {
    const d = D.Reopen;
    const columbusId = String(d.columbus.id);
    const TITLE = 'Send Ben the Columbus detention numbers';
    const made = await commit({ op: 'create', accountName: d.a.name, kind: 'deliverable', title: TITLE, dueDay: nyDayIn(3), personaId: d.ben.id, dealId: columbusId });
    expect(made.status, JSON.stringify(made.body)).toBe(201);
    const cid = made.body.commitment!.commitmentId;
    const dueAt = made.body.commitment!.dueAt;
    await sync(d);
    // HubSpot closes the deal: the reconcile skips its open work, with GAP as the actor.
    closeColumbus(d);
    expect(await sync(d)).toMatchObject({ closed: [columbusId], skipped: 1 });
    const { loadCommitment, loadCommitments } = await import('@/lib/gap/work/commitments');
    const { restoredIdFor } = await import('@/lib/gap/work/commitment-model');
    expect(await loadCommitment(prisma, cid)).toMatchObject({ status: 'skipped', updatedBy: 'gap:deals', dealId: columbusId });
    // Restore while the deal is closed: refused for that reason, nothing made.
    const early = await commit({ op: 'restore', commitmentId: cid });
    expect([early.status, early.body.error]).toEqual([409, 'deal_closed']);
    expect((await loadCommitment(prisma, restoredIdFor(cid))) ?? null).toBeNull();
    // HubSpot reopens it: one reopen step, listing what the closure skipped with its due date and person.
    reopenColumbus(d);
    expect(await sync(d)).toMatchObject({ reopened: [columbusId] });
    const step = (await loadCommitments(prisma, { accountNames: [d.a.name] })).find((c) => c.source.id.startsWith(`reopen:${columbusId}:`));
    expect(step?.title).toBe(`Reopened: decide the next step on "${d.columbus.dealname}"`);
    expect(step?.detail?.skippedAtClosure).toEqual([{ commitmentId: cid, title: TITLE, kind: 'deliverable', dueAt, person: d.ben.name }]);
    // Restore: a NEW open obligation with the same words, person, deal and due date; the skipped record stays.
    const restored = await commit({ op: 'restore', commitmentId: cid });
    expect(restored.status, JSON.stringify(restored.body)).toBe(201);
    expect(await loadCommitment(prisma, restoredIdFor(cid))).toMatchObject({ status: 'open', kind: 'deliverable', title: TITLE, dueAt, dealId: columbusId, person: { name: d.ben.name }, detail: { restoredFrom: cid } });
    expect((await loadCommitment(prisma, cid))?.status).toBe('skipped');
    // Twice restores once: one open obligation with those words.
    const again = await commit({ op: 'restore', commitmentId: cid });
    expect([again.status, again.body.created]).toEqual([200, false]);
    const open = (await loadCommitments(prisma, { accountNames: [d.a.name] })).filter((c) => c.title === TITLE && c.status === 'open');
    expect(open.map((c) => c.commitmentId)).toEqual([restoredIdFor(cid)]);
  }, 240_000);

  it('a new recap retires the earlier unwritten recap on its deal; the replaced one is refused at retry and absent from Coverage', async () => {
    const d = D.Recap;
    const pilotId = String(d.pilot.id);
    const { POST, GET } = await import('@/app/api/gap/crm-sync/route');
    type Item = { proposalId: string; accountName: string; state: string; detail: string | null };
    const post = async (b: unknown) => {
      const r = await POST(req('/api/gap/crm-sync', 'POST', b));
      return { status: r.status, body: (await r.json()) as { item?: Item; error?: string; detail?: string | null } };
    };
    const get = async (q: string) => ((await (await GET(req(`/api/gap/crm-sync?${q}`, 'GET'))).json()) as { items: Item[] }).items;
    /** The recap the deal brief prepares and offers to write to HubSpot (the workspace's own candidate). */
    const recapCandidate = async () => {
      const w = await workspace(d);
      const c = w.crm[pilotId]?.candidates.find((x) => x.origin.kind === 'recap');
      expect(c, JSON.stringify(w.crm[pilotId]?.candidates.map((x) => x.origin))).toBeDefined();
      return c!;
    };
    const approve = (c: { change: unknown; origin: unknown }) => post({ op: 'approve', accountName: d.a.name, dealId: pilotId, dealName: d.pilot.dealname, change: c.change, origin: c.origin });
    await bid(d, d.ann, 'business_problem', 'Trailers sit two hours before a door opens at the pilot site.', pilotId);
    const first = await recapCandidate();
    const old = await approve(first);
    expect([old.status, old.body.item?.state], JSON.stringify(old.body)).toEqual([200, 'off']);
    // More of Ann's words: the recap changes, and the seller approves the current one.
    await bid(d, d.ann, 'constraint', CAMERAS, pilotId);
    const second = await recapCandidate();
    expect(second.origin.id).not.toBe(first.origin.id);
    const current = await approve(second);
    expect([current.status, current.body.item?.state], JSON.stringify(current.body)).toEqual([200, 'off']);
    const oldId = old.body.item!.proposalId;
    const newId = current.body.item!.proposalId;
    const { RECAP_REPLACED } = await import('@/lib/gap/deals/crm-model');
    const byId = new Map((await get(`account=${encodeURIComponent(d.a.name)}`)).map((it) => [it.proposalId, [it.state, it.detail]]));
    expect([byId.size, byId.get(newId)?.[0], byId.get(oldId)]).toEqual([2, 'off', ['discarded', RECAP_REPLACED]]);
    // Retried with approved writes ON (against the stub): refused for its reason, nothing reaches the CRM.
    expect(process.env.HUBSPOT_API_BASE_PATH).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    process.env.GAP_CRM_APPROVED_WRITES_ENABLED = 'true';
    process.env.ALLOW_EXTERNAL_WRITES_IN_TEST = 'true';
    try {
      const retry = await post({ op: 'retry', proposalId: oldId });
      expect([retry.status, retry.body.error], JSON.stringify(retry.body)).toEqual([409, 'discarded']);
    } finally {
      delete process.env.GAP_CRM_APPROVED_WRITES_ENABLED;
      delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
    }
    expect(((await h.stubGet('/__stub/writes')) as { notes: unknown[] }).notes).toEqual([]);
    // Coverage lists every approved change not written: the current recap, never the replaced one.
    expect((await get('state=off')).filter((it) => it.accountName === d.a.name).map((it) => it.proposalId)).toEqual([newId]);
  }, 240_000);

  it('buyer words in NOW, the brief and the story carry their deal; a detention figure counts as what it costs them', async () => {
    const d = D.Scope;
    const columbusId = String(d.columbus.id);
    await bid(d, d.ben, 'business_problem', PROBLEM, columbusId);
    await bid(d, d.ben, 'metric', DETENTION, columbusId);
    await bid(d, d.ann, 'constraint', CAMERAS, null);
    const { brief, inputs, c, pursuit, now } = await pageRead(d);
    const { projectNow } = await import('@/lib/gap/context/now');
    const { projectBrief } = await import('@/lib/gap/context/brief');
    const { projectStory } = await import('@/lib/gap/story/story');
    const columbus = `Deal: ${d.columbus.dealname}`;
    const pilotThroughAnn = `Deal: ${d.pilot.dealname} (through ${d.ann.name})`;
    // The brief: Commercial history names the deal on each buyer line (Ann's through her own single deal).
    const sections = projectBrief(brief, c, inputs, now);
    const said = (sections.find((x) => x.key === 'commercial')?.notes ?? []).filter((n) => n.startsWith('Buyer said'));
    expect([...said].sort()).toEqual([`Buyer said (business problem), ${columbus}: ${PROBLEM}`, `Buyer said (constraint), ${pilotThroughAnn}: ${CAMERAS}`].sort());
    // The detention figure is told once across the brief, with its deal on it.
    const detention = sections.flatMap((x) => [...x.lines.map((l) => `${l.text} | ${l.basis}`), ...x.notes]).filter((t) => t.includes('forty thousand'));
    expect(detention).toEqual([expect.stringContaining(columbus)]);
    // NOW reads the detention figure as the impact the buyer gave: a cost in money or detention terms.
    const v = projectNow(brief, c, inputs, now);
    expect(v.gap.map((g) => [g.element, g.state])).toContainEqual(['Impact', 'Buyer said']);
    // The story: the buyer's sentences in Yard opportunity each name the Columbus deal; What we need to learn no
    // longer says what it costs them is unknown.
    const story = projectStory({ accountName: d.a.name, now, state: pursuit.state, brief, inputs, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] } as never);
    const yard = story.rows.find((r) => r.key === 'yard');
    const basis = expect.stringMatching(new RegExp(`^buyer said, ${esc(d.ben.name)}, [A-Z][a-z]{2} \\d{1,2}; ${esc(columbus)}$`));
    const buyer = (yard?.sentences ?? []).filter((x) => x.tag === 'Buyer said').map((x) => [x.text, x.basis] as const).sort((p, q) => p[0].localeCompare(q[0]));
    expect(buyer).toEqual([[DETENTION, basis], [PROBLEM, basis]].sort((p, q) => String(p[0]).localeCompare(String(q[0]))));
    expect(story.rows.find((r) => r.key === 'learn')?.sentences[0]?.text ?? '').not.toMatch(/what it costs them/);
  }, 240_000);

  it('the prepared artifacts speak to their recipient in the second person and never carry the CRM deal name', async () => {
    const d = D.Voice;
    const pilotId = String(d.pilot.id);
    for (const [title, who] of [['Send Ann the dock schedule template', d.ann], ['Send Cal the gate camera spec', d.cal]] as const) {
      const r = await commit({ op: 'create', accountName: d.a.name, kind: 'deliverable', title, dueDay: nyDayIn(2), personaId: who.id, dealId: pilotId });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
    }
    await bid(d, d.ann, 'business_problem', 'Trailers sit two hours before a door opens.', pilotId);
    const w = await workspace(d);
    const arts = w.artifacts[pilotId]?.all ?? [];
    const recap = arts.find((x) => x.kind === 'recap');
    expect(recap?.text.split('\n')[0]).toBe('Hi Ann,');
    // What we owe Ann is said to her as "you"; what we owe Cal is listed for her team, by name.
    expect(recap?.text).toContain(['What I owe you:', '- Send you the dock schedule template', '', 'What I owe your team:', '- Send Cal the gate camera spec'].join('\n'));
    expect(recap?.text.match(/Send Ann|Ann's/g) ?? []).toEqual([]);
    // No buyer text carries the CRM deal name ("YardFlow - <account> x71007"); the guard finds nothing to refuse.
    expect(arts.map((x) => [x.kind, x.text.includes(d.pilot.dealname), x.problems])).toEqual(arts.map((x) => [x.kind, false, []]));
    expect(arts.find((x) => x.kind === 'introduction')?.text).toContain('Before we go further, who else needs to be part of this');
  }, 240_000);

  it('no case reached the network (only the stub and the sink were ever addressed)', () => {
    expect(h.refusedFetches).toEqual([]);
  });
});
