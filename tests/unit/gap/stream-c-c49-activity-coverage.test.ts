// @vitest-environment node
/**
 * C49 (GAP OS commercial context and execution audit, 2026-10-08): the activity read says how much it covered. The
 * independent code review found `take: 1000` and `.catch(() => [])`: a day with 1,001 rows lost its oldest row
 * silently, and a thrown read rendered as a zero-activity day. Now loadActivity pages by a (created_at, id) cursor and
 * answers complete, partial (the page cap stopped it; the counts are a floor) or unavailable (the ledger threw or no
 * client was given; never a zero), and the same provider evidence recorded twice counts once.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ACTIVITY_PAGE, accountability, loadAccountability, loadActivity } from '@/lib/gap/work/activity';

const SINCE = new Date('2026-10-08T04:00:00Z');
const UNTIL = new Date('2026-10-09T03:59:59Z');
const sent = (i: number, over: Record<string, unknown> = {}) => ({ kind: 'execution.gmail_direct_sent', actor: 'x', subject_type: 'routing_decision', subject_id: `dec-${i}`, created_at: new Date(SINCE.getTime() + i * 1000), payload: { recipient: `p${i}@kroger.example.com`, stepIndex: 0, gmailSentMessageId: `g-${i}`, accountName: 'Kroger', ...over } });

describe('C49: activity-read coverage', () => {
  it('1,001 rows in the window read complete after paging, with every row counted', async () => {
    const db = ledgerDb({ audit: Array.from({ length: ACTIVITY_PAGE + 1 }, (_, i) => sent(i)) }, UNTIL);
    const r = await loadActivity(db.client(), { since: SINCE, until: UNTIL });
    expect(r).toMatchObject({ coverage: 'complete', detail: null, rows: 1001, deduped: 0 });
    expect(r.events).toHaveLength(1001);
    // Newest first, and the oldest row (the one the old cap dropped) is present.
    expect(r.events[0].ref.subjectId).toBe('dec-1000');
    expect(r.events[1000].ref.subjectId).toBe('dec-0');
  });

  it('a page cap says partial with the newest rows read and the counts a floor; the accountability view carries it', async () => {
    const db = ledgerDb({ audit: Array.from({ length: 1001 }, (_, i) => sent(i)) }, UNTIL);
    const r = await loadActivity(db.client(), { since: SINCE, until: UNTIL, pageSize: 400, maxPages: 2 });
    expect(r).toMatchObject({ coverage: 'partial', rows: 800 });
    expect(r.detail).toMatch(/more than 800 rows; the newest 800 were read/);
    expect(r.events[0].ref.subjectId).toBe('dec-1000');
    expect(r.events[799].ref.subjectId).toBe('dec-201');
    const a = accountability({ day: '2026-10-08', plan: null, events: r.events, tasks: [], coverage: r.coverage, coverageDetail: r.detail });
    expect(a).toMatchObject({ coverage: 'partial', coverageDetail: r.detail });
    expect(a.completed).toEqual([{ kind: 'message_sent', label: 'Message sent', cls: 'contact', provider: 800, selfReported: 0 }]);
  });

  it('the cursor pages through rows that share one created_at by id, losing none and repeating none', async () => {
    const at = new Date('2026-10-08T15:00:00Z');
    // Every Postgres row carries an id; the seed sets one so the (created_at, id) cursor has its tie-breaker.
    const db = ledgerDb({ audit: Array.from({ length: 7 }, (_, i) => ({ ...sent(i), id: `ev-${i}`, created_at: at })) }, UNTIL);
    const r = await loadActivity(db.client(), { since: SINCE, until: UNTIL, pageSize: 3 });
    expect(r).toMatchObject({ coverage: 'complete', rows: 7 });
    expect(new Set(r.events.map((e) => e.ref.subjectId)).size).toBe(7);
  });

  it('a thrown read is unavailable with the error in words, never a zero-activity day; the view says the counts are not zero', async () => {
    const client = { gapAuditEvent: { findMany: async () => { throw new Error('connection reset'); } } };
    const r = await loadActivity(client, { since: SINCE, until: UNTIL });
    expect(r).toMatchObject({ events: [], coverage: 'unavailable', detail: 'connection reset', rows: 0 });
    const a = await loadAccountability({ ...client, gapAgentTask: undefined }, new Date('2026-10-08T20:00:00Z'));
    expect(a).toMatchObject({ coverage: 'unavailable', coverageDetail: 'connection reset', completed: [] });
    expect(await loadActivity({}, { since: SINCE, until: UNTIL })).toMatchObject({ coverage: 'unavailable', detail: 'no ledger client' });
  });

  it('the same provider evidence recorded twice counts once; two sends with their own Gmail ids and self-reported rows are never collapsed', async () => {
    const db = ledgerDb({
      audit: [
        sent(1),
        { ...sent(2), subject_id: 'dec-1', payload: { ...sent(1).payload, reconciledFromSent: true } },
        sent(3),
        { ...sent(4), kind: 'execution.gmail_manual_sent', payload: { recipient: 'a@kroger.example.com', stepIndex: 0, accountName: 'Kroger' } },
        { ...sent(5), kind: 'execution.gmail_manual_sent', payload: { recipient: 'a@kroger.example.com', stepIndex: 0, accountName: 'Kroger' } },
        { kind: 'crm.sync_result', actor: 'x', subject_type: 'crm_sync', subject_id: 'p1', created_at: new Date(SINCE.getTime() + 9000), payload: { proposalId: 'p1', accountName: 'Kroger', outcome: 'written', objectRef: 'n-1' } },
        { kind: 'crm.sync_result', actor: 'x', subject_type: 'crm_sync', subject_id: 'p1', created_at: new Date(SINCE.getTime() + 9500), payload: { proposalId: 'p1', accountName: 'Kroger', outcome: 'recovered', objectRef: 'n-1' } },
      ],
    }, UNTIL);
    const r = await loadActivity(db.client(), { since: SINCE, until: UNTIL });
    expect(r).toMatchObject({ coverage: 'complete', rows: 7, deduped: 2 });
    const a = accountability({ day: '2026-10-08', plan: null, events: r.events, tasks: [] });
    expect(a.completed).toEqual([
      { kind: 'message_sent', label: 'Message sent', cls: 'contact', provider: 2, selfReported: 2 },
      { kind: 'crm_updated', label: 'CRM updated', cls: 'maintenance', provider: 1, selfReported: 0 },
    ]);
  });
});
