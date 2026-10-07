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
const defect = process.env.MATRIX_DEFECTS === '1' ? it : it.skip;

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

  // DEFECT src/lib/gap/replies/list.ts:213-240 (loadKnownAddresses: enrollments and personas WITH A HYPOTHESIS only;
  // ReplyItem requires a hypothesisId, :63): a reply from the open deal's own HubSpot contact, a GAP persona with no
  // GAP thesis, is not listed by GET /api/gap/replies at all, so the buyer's question on an active deal never reaches
  // Work. Mandate section 3: Work carries actionable replies and deal work, the reply ranked above the meeting.
  defect('a reply from the open deal\'s contact is listed and leads that account\'s card, the meeting kept as its own obligation', async () => {
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

  it('work arriving mid-session: a reply that lands between two reads puts its account first on the next read', async () => {
    const { a, p } = A.Arrive;
    const before = await readDay(new Date());
    expect(before.day.cards.find((c) => c.accountName === a.name)?.tier ?? null).not.toBe('reply');
    await s.inbound(a, p, 'Yes, we see this at Columbus. Can we talk Thursday?', { key: 'arrive' });
    const after = await readDay(new Date());
    expect([after.day.cards[0]?.accountName, after.day.cards[0]?.tier]).toEqual([a.name, 'reply']);
  }, 180_000);

  it('an evening meeting is on Work in the afternoon of its day', async () => {
    const { a } = A.Evening;
    const { nyDay, nyDayAt } = await import('@/lib/gap/work/dates');
    const today = nyDay(new Date());
    await s.meeting(a, 'evening', { date: new Date(`${today}T00:00:00.000Z`), time: '9:00 PM', status: 'Scheduled', objective: 'West coast check-in', attendees: 'Lee Matrix', dealId: null });
    const afternoon = await readDay(nyDayAt(today, 14));
    expect(afternoon.meetings.filter((m) => m.accountName === a.name).map((m) => m.what)).toEqual(['West coast check-in']);
  }, 180_000);

  // DEFECT src/lib/gap/work/day-load.ts:64: the window is `meeting_date >= now - 24h` on a date-only row stored at UTC
  // midnight, so from 8 pm New York (midnight UTC plus the offset) today's evening meeting falls out of Work.
  defect('an evening meeting is still on Work at 8:30 pm New York, half an hour before it starts', async () => {
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

  // DEFECT src/lib/gap/work/day-load.ts:155 and :160 with src/components/gap/work-today.tsx:45: a skip ("Set aside for
  // today."), a snooze and an unproven "Logged outside GAP" are listed and COUNTED under "Done today". Completion,
  // waiting and skipped must differ (mandate section 4; section 7 "skip without false completion").
  defect('the Today panel never counts a skip or a snooze as done', async () => {
    const { a } = A.SkipDone;
    const { nyDay, addDays } = await import('@/lib/gap/work/dates');
    expect((await outcome(a.name, { kind: 'skipped', reason: 'not today' })).status).toBe(201);
    expect((await outcome(a.name, { kind: 'snoozed', until: addDays(nyDay(new Date()), 3), reason: 'travel' })).status).toBe(201);
    const { summary } = await readDay(new Date());
    expect(summary.done.filter((d) => d.accountName === a.name)).toEqual([]);
  }, 180_000);

  // DEFECT src/lib/gap/work/commitments.ts:397-398: any newer outcome at an account settles its older snooze reminders,
  // and a reminder that had already come back is marked DONE (terminal, proof "outcome"). Skipping the account for
  // today silently completes the returned reminder; it never comes back.
  defect('skipping an account whose snooze reminder came back does not complete the reminder', async () => {
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
