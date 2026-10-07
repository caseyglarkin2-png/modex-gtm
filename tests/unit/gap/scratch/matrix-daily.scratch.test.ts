// @vitest-environment node
/**
 * R62 MATRIX, DAILY WORK (mandate section 7, "Daily work"): Work read the way the page reads it (the replies route,
 * loadWorkCommitments, loadMeetingRows, loadWorkOutcomes, workDay; src/app/gap/page.tsx), with writes through the REAL
 * routes (POST /api/gap/accounts/outcome, the send route) and HubSpot, clawd and the AI gateway on the stub. Cases: a
 * reply and a meeting on the same deal, a snooze that returns on its day, work arriving mid-session, an evening
 * meeting, and the Done panel against a skip. Skipped without GAP_SCRATCH_DATABASE_URL pointing at the matrix database
 * (127.0.0.1:55433/gap_matrix).
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

describe.skipIf(!RUN)('R62 matrix: daily work (Work as the page reads it; writes through the real routes)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  let s: import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder;
  type Acct = import('@/scripts/gap/recovery/seed-matrix').MatrixAccount;
  const tag = `md${Date.now().toString(36)}`;
  const A: Record<string, { a: Acct; p: { id: number; name: string; email: string } }> = {};

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    const { taggedId } = await import('@/scripts/gap/recovery/seed-corpus');
    s = createMatrixSeeder(prisma, tag);
    // A deal account: Ben is the deal's HubSpot contact.
    const deal = await s.account('Daily Deal Co');
    const benContact = String(taggedId(tag, 31));
    const ben = await s.person(deal, 'Ben', 'Director, Columbus Distribution Center', { hubspotContactId: benContact });
    const d = s.openDeal(deal, 3101, { dealname: `${deal.name} Columbus DC`, contacts: [benContact] });
    A.Deal = { a: deal, p: ben };
    for (const base of ['Snooze', 'Arrive', 'Evening', 'Skip', 'SkipDone', 'SkipReminder']) {
      const a = await s.account(`Daily ${base} Co`);
      const p = await s.person(a, 'Lee', 'Director Transportation');
      const f = await s.fact(a, 'dc', `${a.name} opened a new distribution center in Ohio with 60 dock doors.`, { title: `${a.name} opens Ohio DC`, observedAt: new Date(Date.now() - 10 * 86_400_000).toISOString() });
      await s.thesis(a, p.id, f, 'approved');
      A[base] = { a, p };
    }
    h = await startMatrixHarness({ companies: s.companies, deals: s.deals });
    expect(d.contacts).toEqual([benContact]);
  }, 300_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  const names = () => new Set(Object.values(A).map((x) => x.a.name));
  async function readDay(now: Date) {
    const { GET } = await import('@/app/api/gap/replies/route');
    const { workDay } = await import('@/lib/gap/work/list');
    const { loadWorkCommitments, loadMeetingRows, resetWorkSweep, loadCompletedToday } = await import('@/lib/gap/work/day-load');
    const { loadWorkOutcomes } = await import('@/lib/gap/work/outcome');
    const { todaySummary } = await import('@/lib/gap/work/today');
    resetWorkSweep();
    const items = ((await (await GET(req('/api/gap/replies?state=undispositioned&limit=200', 'GET'))).json()) as { items: Array<{ id: string; accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string }> }).items.filter((r) => names().has(r.accountName));
    const replies = items.map((r) => ({ accountName: r.accountName, contactEmail: r.contactEmail, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt }));
    const commitments = (await loadWorkCommitments(prisma, new Date(), { replies })).filter((c) => names().has(c.accountName));
    const rows = (await loadMeetingRows(prisma, now)).filter((m) => names().has(m.accountName));
    const meetings = rows.filter((m) => !m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
    const outcomes = await loadWorkOutcomes(prisma, [...names()], now);
    const day = workDay({ now, candidates: [], motions: [], inDeals: { status: 'unavailable', accounts: [] }, held: new Map(), replies: items.map((r) => ({ ...r })), commitments, meetings, canceledMeetings: [], outcomes, inMotion: new Map() } as never);
    const done = (await loadCompletedToday(prisma, now)).filter((x) => x.accountName === null || names().has(x.accountName));
    return { day, commitments, meetings, summary: todaySummary({ now, commitments, done, waiting: day.waiting, meetings }) };
  }
  async function outcome(accountName: string, body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/gap/accounts/outcome/route');
    const res = await POST(req('/api/gap/accounts/outcome', 'POST', { accountName, ...body }));
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  /** The deal's meeting tomorrow at 10 am New York and Ben's reply about it (idempotent rows, shared by the two cases). */
  async function dealShape() {
    const { a, p } = A.Deal;
    const { nyDay, addDays, nyDayAt } = await import('@/lib/gap/work/dates');
    const tomorrow = addDays(nyDay(new Date()), 1);
    await s.meeting(a, 'walk', { date: new Date(`${tomorrow}T00:00:00.000Z`), time: '10:00 AM', status: 'Scheduled', objective: 'Columbus yard walk with Ben', attendees: 'Ben Matrix', dealId: String(s.deals[a.name][0].id) });
    await s.inbound(a, p, 'Looking forward to the walk tomorrow. Can you bring the detention numbers?', { key: 'deal-reply' });
    return { a, p, morning: nyDayAt(tomorrow, 8) };
  }

  it('a meeting on an open deal tomorrow is an obligation on that account\'s card the next morning, with its time and objective', async () => {
    const { a, morning } = await dealShape();
    const { day } = await readDay(morning);
    const cards = day.cards.filter((c) => c.accountName === a.name);
    expect(cards).toHaveLength(1);
    expect((cards[0].obligations ?? []).filter((o) => o.kind === 'meeting').map((o) => o.title)).toEqual(['Meeting today 10:00 AM: Columbus yard walk with Ben']);
  }, 180_000);

  // Was DEFECT src/lib/gap/replies/list.ts:213-240: a reply from an open deal's own contact was never listed.
  // Fixed by the writer at 6abad07a (item 8): the deal contact is a known address; the reply leads the card.
  it('a reply from the open deal\'s contact is listed and leads that account\'s card, the meeting kept as its own obligation', async () => {
    const { a, p, morning } = await dealShape();
    const { GET } = await import('@/app/api/gap/replies/route');
    const listed = ((await (await GET(req('/api/gap/replies?state=undispositioned&limit=200', 'GET'))).json()) as { items: Array<{ accountName: string; contactEmail: string }> }).items.filter((r) => r.accountName === a.name);
    expect(listed.map((r) => r.contactEmail)).toEqual([p.email]);
    const { day } = await readDay(morning);
    const cards = day.cards.filter((c) => c.accountName === a.name);
    expect([cards[0]?.stateKind, cards[0]?.tier]).toEqual(['replied', 'reply']);
    expect((cards[0].obligations ?? []).filter((o) => o.kind === 'meeting')).toHaveLength(1);
  }, 180_000);

  it('a snooze returns on its day and not before: in the Snoozed footer the day before, a card again at 9 am New York on its day', async () => {
    const { a } = A.Snooze;
    const { nyDay, addDays, nyDayAt } = await import('@/lib/gap/work/dates');
    const back = addDays(nyDay(new Date()), 2);
    const o = await outcome(a.name, { kind: 'snoozed', until: back, reason: 'travel' });
    expect(o.status, JSON.stringify(o.body)).toBe(201);
    const dayBefore = await readDay(nyDayAt(addDays(nyDay(new Date()), 1), 16));
    expect(dayBefore.day.cards.some((c) => c.accountName === a.name)).toBe(false);
    expect(dayBefore.day.snoozed.map((x) => x.accountName)).toContain(a.name);
    const onTheDay = await readDay(nyDayAt(back, 9));
    const card = onTheDay.day.cards.find((c) => c.accountName === a.name);
    expect(card, JSON.stringify(onTheDay.day.snoozed)).toBeDefined();
    expect((card!.obligations ?? []).map((x) => x.line)).toEqual(expect.arrayContaining([expect.stringMatching(/^Back today/)]));
  }, 180_000);

  it('work arriving mid-session: a reply that lands between two reads puts its account in the reply tier, ahead of all other work, on the next read', async () => {
    const { a, p } = A.Arrive;
    const before = await readDay(new Date());
    expect(before.day.cards.find((c) => c.accountName === a.name)?.tier ?? null).not.toBe('reply');
    await s.inbound(a, p, 'Yes, we see this at Columbus. Can we talk Thursday?', { key: 'arrive' });
    const after = await readDay(new Date());
    // Since item 8 the deal contact's reply is a reply card too; replies order among themselves by their own due time, so
    // the arriving reply leads every card that is not a buyer commitment or another reply.
    const i = after.day.cards.findIndex((c) => c.accountName === a.name);
    expect(after.day.cards[i]?.tier).toBe('reply');
    expect(after.day.cards.slice(0, i).map((c) => c.tier).filter((t) => t !== 'reply' && t !== 'commitment')).toEqual([]);
  }, 180_000);

  it('an evening meeting is on Work in the afternoon of its day', async () => {
    const { a } = A.Evening;
    const { nyDay, nyDayAt } = await import('@/lib/gap/work/dates');
    const today = nyDay(new Date());
    await s.meeting(a, 'evening', { date: new Date(`${today}T00:00:00.000Z`), time: '9:00 PM', status: 'Scheduled', objective: 'West coast check-in', attendees: 'Lee Matrix', dealId: null });
    const afternoon = await readDay(nyDayAt(today, 14));
    expect(afternoon.meetings.filter((m) => m.accountName === a.name).map((m) => m.what)).toEqual(['West coast check-in']);
  }, 180_000);

  // Was DEFECT src/lib/gap/work/day-load.ts:64: today's evening meeting fell off Work after 8 pm New York.
  // Fixed by the writer at 6abad07a (item 8): the window opens at yesterday's date-only midnight.
  it('an evening meeting is still on Work at 8:30 pm New York, half an hour before it starts', async () => {
    const { a } = A.Evening;
    const { nyDay, nyDayAt } = await import('@/lib/gap/work/dates');
    const today = nyDay(new Date());
    await s.meeting(a, 'evening', { date: new Date(`${today}T00:00:00.000Z`), time: '9:00 PM', status: 'Scheduled', objective: 'West coast check-in', attendees: 'Lee Matrix', dealId: null });
    const evening = new Date(nyDayAt(today, 20).getTime() + 30 * 60_000);
    const late = await readDay(evening);
    expect(late.meetings.filter((m) => m.accountName === a.name).map((m) => m.what)).toEqual(['West coast check-in']);
  }, 180_000);

  it('skip records an outcome, never a send or a completion of the account: the account leaves today\'s cards and nothing is sent', async () => {
    const { a, p } = A.Skip;
    const o = await outcome(a.name, { kind: 'skipped', reason: 'not today' });
    expect(o.status, JSON.stringify(o.body)).toBe(201);
    const after = await readDay(new Date());
    expect(after.day.cards.find((c) => c.accountName === a.name)?.tier ?? 'later').toBe('later');
    expect(h.writtenTo(p.email)).toBe(0);
  }, 180_000);

  // Was DEFECT src/lib/gap/work/day-load.ts:155, :160: skips and snoozes were counted under Done today.
  // Fixed by the writer at 1e7b4aa4 (item 8): Done excludes them; todaySummary.setAside lists them.
  it('the Today panel never counts a skip or a snooze as done', async () => {
    const { a } = A.SkipDone;
    const { nyDay, addDays } = await import('@/lib/gap/work/dates');
    expect((await outcome(a.name, { kind: 'skipped', reason: 'not today' })).status).toBe(201);
    expect((await outcome(a.name, { kind: 'snoozed', until: addDays(nyDay(new Date()), 3), reason: 'travel' })).status).toBe(201);
    const { summary } = await readDay(new Date());
    expect(summary.done.filter((d) => d.accountName === a.name)).toEqual([]);
  }, 180_000);

  // Was DEFECT src/lib/gap/work/commitments.ts:397-398: a skip completed a returned reminder.
  // Fixed by the writer at 1e7b4aa4 (item 8): a skip re-snoozes it to tomorrow and never marks it done.
  it('skipping an account whose snooze reminder came back does not complete the reminder', async () => {
    const { a } = A.SkipReminder;
    const soon = new Date(Date.now() + 4_000).toISOString();
    const o = await outcome(a.name, { kind: 'snoozed', until: soon, reason: 'call back after lunch' });
    expect(o.status, JSON.stringify(o.body)).toBe(201);
    await new Promise((r) => setTimeout(r, 5_000));
    const { loadCommitments } = await import('@/lib/gap/work/commitments');
    const reminder = (await loadCommitments(prisma, { accountNames: [a.name] })).find((c) => c.kind === 'reminder')!;
    expect(reminder.status).toBe('snoozed');
    const skip = await outcome(a.name, { kind: 'skipped', reason: 'not today' });
    expect(skip.status, JSON.stringify(skip.body)).toBe(201);
    const after = (await loadCommitments(prisma, { accountNames: [a.name] })).find((c) => c.commitmentId === reminder.commitmentId)!;
    expect(after.status).not.toBe('done');
  }, 180_000);

  it('no case reached the network', () => {
    expect(h.refusedFetches).toEqual([]);
  });
});
