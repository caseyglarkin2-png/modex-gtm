// @vitest-environment node
/**
 * Sprint 5 review, the BLOCKER (R50 / R51): meeting preparation mixed two deals' buyer words. A joint meeting with no
 * deal id read both deals' rows unlabeled; a meeting on a deal that had since CLOSED read the open deal's rows (the
 * Columbus walk, after Columbus closed, showed Ann's pilot requirement and none of Ben's words). Rule: a meeting reads
 * its own deal's rows; a meeting on a closed deal reads that deal's kept rows, named with its outcome; a meeting bound
 * to no deal labels each line with its deal (Work's starting point reads the account-level words only).
 */
import { describe, expect, it } from 'vitest';
import { loadDealWorkspace } from '@/lib/gap/deals/workspace';
import { closedDealLabel, readScope } from '@/lib/gap/deals/scope';
import { loadMeetingStartingPoints } from '@/lib/gap/work/day-load';

const now = new Date('2026-10-07T15:00:00Z');
const PILOT = '392057001';
const COLUMBUS = '392057002';
const PILOT_REF = { id: PILOT, name: 'YardFlow - Kroger Scratch Co', contactIds: ['c-ann'] };
const COLUMBUS_REF = { id: COLUMBUS, name: 'Kroger Scratch Co Columbus DC', contactIds: ['c-ben'] };
const COLUMBUS_CLOSED = { id: COLUMBUS, name: 'Kroger Scratch Co Columbus DC', won: true, closedAt: '2026-10-07T12:00:00Z' };
const people = [
  { id: 1, name: 'Ann Scratch', title: 'VP Supply Chain Operations', email: 'ann@kroger.example.com', hubspot_contact_id: 'c-ann' },
  { id: 2, name: 'Ben Scratch', title: 'Director, Columbus Distribution Center', email: 'ben@kroger.example.com', hubspot_contact_id: 'c-ben' },
];
const bid = (id: string, email: string, type: string, text: string, dealId: string) => ({ id, account_name: 'Kroger Scratch Co', type, raw_buyer_language: text, normalized_summary: null, contact_email: email, human_confirmed: true, supersedes_id: null, confirmed_at: now, captured_at: now, metadata: { scope: { dealId } } });
const bids = [
  bid('b1', 'ben@kroger.example.com', 'business_problem', 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.', COLUMBUS),
  bid('b2', 'ben@kroger.example.com', 'metric', 'We pay about forty thousand a month in detention at Columbus.', COLUMBUS),
  bid('b3', 'ann@kroger.example.com', 'constraint', 'Any pilot has to run on our existing gate cameras.', PILOT),
];
const tomorrow = new Date('2026-10-08T00:00:00Z');
const meetings = [
  { id: 11, meeting_date: tomorrow, meeting_time: '10:00 AM', meeting_status: 'Scheduled', objective: 'Joint review with Ann and Ben', persona: 'Ann Scratch, Ben Scratch', hubspot_deal_id: null, created_at: now, updated_at: now },
  { id: 12, meeting_date: tomorrow, meeting_time: '2:00 PM', meeting_status: 'Scheduled', objective: 'Columbus yard walk with Ben', persona: 'Ben Scratch', hubspot_deal_id: COLUMBUS, created_at: now, updated_at: now },
];
const prisma = {
  persona: { findMany: async () => people },
  buyerInputData: { findMany: async () => bids },
  meeting: { findMany: async () => meetings },
  gapAuditEvent: { findMany: async () => [] },
};
const ws = (deals: Array<{ id: string; name: string; contactIds: string[] }>, closedDeals: typeof COLUMBUS_CLOSED[] = []) =>
  loadDealWorkspace(prisma, { accountName: 'Kroger Scratch Co', deals: deals.map((d) => ({ ...d, stage: 'qualifiedtobuy', nextStep: null })), commitments: [], now, materials: [], publicFacts: [], guesses: [], closedDeals });

describe('Sprint 5 review: meeting preparation never mixes two deals\' words', () => {
  it('a joint meeting bound to no deal labels every line with its deal', async () => {
    const w = await ws([PILOT_REF, COLUMBUS_REF]);
    const joint = w.meetings.find((m) => m.meetingId === 11)!;
    expect(joint.dealName).toBeNull();
    expect(joint.confirmedNeeds).toHaveLength(3);
    for (const n of joint.confirmedNeeds) expect(n.source).toMatch(/Deal: (YardFlow - Kroger Scratch Co|Kroger Scratch Co Columbus DC)/);
    const ann = joint.confirmedNeeds.find((n) => /gate cameras/.test(n.text))!;
    expect(ann.source).toMatch(/Deal: YardFlow - Kroger Scratch Co(?! Columbus)/);
  });
  it('a meeting on its open deal reads that deal\'s words only, with no label needed', async () => {
    const w = await ws([PILOT_REF, COLUMBUS_REF]);
    const walk = w.meetings.find((m) => m.meetingId === 12)!;
    expect(walk.dealName).toBe('Kroger Scratch Co Columbus DC');
    expect(walk.confirmedNeeds.map((n) => n.text)).toEqual([expect.stringMatching(/3 hours per shift/), expect.stringMatching(/forty thousand/)]);
  });
  it('after the Columbus deal closes, its walk reads Columbus\'s kept words, named with the outcome, never the pilot\'s', async () => {
    const w = await ws([PILOT_REF], [COLUMBUS_CLOSED]);
    const walk = w.meetings.find((m) => m.meetingId === 12)!;
    expect(walk.dealName).toBe('Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)');
    expect(walk.confirmedNeeds.map((n) => n.text).join(' ')).not.toMatch(/gate cameras/);
    expect(walk.confirmedNeeds).toHaveLength(2);
  });
  it('a closed deal is named with its outcome; an unknown HubSpot id is said in words, never the id', () => {
    expect(closedDealLabel(COLUMBUS_CLOSED)).toBe('Deal: Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)');
    expect(readScope({ dealId: COLUMBUS }, [PILOT_REF], {}, [COLUMBUS_CLOSED]).label).toBe('Deal: Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)');
    const unknown = readScope({ dealId: COLUMBUS }, [PILOT_REF]).label;
    expect(unknown).toBe('Deal: a deal that is not open here');
    expect(unknown).not.toMatch(/\d{6,}/);
  });
  it('Work\'s starting point for a meeting bound to no deal counts the account-level words only', async () => {
    const accountLevel = { ...bid('b4', 'ann@kroger.example.com', 'priority', 'Gate congestion is our top priority this year.', PILOT), metadata: null };
    const p = { buyerInputData: { findMany: async () => [...bids, accountLevel] } };
    const base = { accountName: 'Kroger Scratch Co', at: '2026-10-08T14:00:00Z', what: 'Joint review', canceled: false, attendees: 'Ann Scratch, Ben Scratch', objective: 'Joint review with Ann and Ben', updatedAt: now.toISOString(), createdAt: now.toISOString() };
    const out = await loadMeetingStartingPoints(p, [{ ...base, meetingId: 11, dealId: null }, { ...base, meetingId: 12, dealId: COLUMBUS }], [], now);
    expect(out.get(11)?.prep).toMatch(/1 confirmed need on record/);
    expect(out.get(12)?.prep).toMatch(/3 confirmed needs on record/);
  });
});
