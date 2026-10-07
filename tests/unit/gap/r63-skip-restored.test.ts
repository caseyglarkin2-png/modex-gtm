/**
 * R63-B S11: Work showed "Skipped: Send Ben the Columbus detention numbers (the deal ... closed won on Oct 7; kept for
 * history)" under SET ASIDE OR LOGGED TODAY while the deal was reopened and the same obligation, restored, stood under
 * OWED. After Restore the skipped line leaves Work (the skipped record stays in the account's history): one
 * obligation, one place. A skip nobody restored is still listed.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { loadCompletedToday } from '@/lib/gap/work/day-load';
import { restoredIdFor } from '@/lib/gap/work/commitment-model';
import { todaySummary } from '@/lib/gap/work/today';

const LATE = new Date('2026-10-07T21:00:00Z');
const ACCOUNT = 'Kroger Scratch Co r63';
const at = (iso: string) => new Date(iso);
const DETENTION = 'capture:detention';
const skip = (id: string, title: string, created: string) => ({ id: `s-${id}`, kind: 'account.commitment', subject_type: 'account', subject_id: ACCOUNT, created_at: at(created), payload: { commitmentId: id, op: 'status', commitment: { commitmentId: id, accountName: ACCOUNT, title, status: 'skipped', reason: 'the deal "Kroger Scratch Co r63 Columbus DC" closed won on Oct 7; kept for history' } } });
const restored = { commitmentId: restoredIdFor(DETENTION), accountName: ACCOUNT, kind: 'deliverable', title: 'Send Ben the Columbus detention numbers', status: 'open', dueAt: '2026-10-10T13:00:00.000Z', source: { kind: 'deal', id: `restore:${DETENTION}` }, detail: { restoredFrom: DETENTION } };

describe('R63-B S11: a restored skip leaves Work; the obligation stands once', () => {
  it('after Restore the skipped line is gone from SET ASIDE OR LOGGED TODAY and the obligation is under OWED once; a skip nobody restored stays', async () => {
    const d = ledgerDb({
      audit: [
        skip(DETENTION, 'Send Ben the Columbus detention numbers', '2026-10-07T14:00:00Z'),
        skip('capture:volumes', 'Ben sends the gate volumes', '2026-10-07T14:00:01Z'),
        { id: 'r1', kind: 'account.commitment', subject_type: 'account', subject_id: ACCOUNT, created_at: at('2026-10-07T18:00:00Z'), payload: { commitmentId: restoredIdFor(DETENTION), op: 'create', commitment: restored } },
      ],
    });
    const rows = await loadCompletedToday(d.client(), LATE);
    const t = todaySummary({ now: LATE, commitments: [restored as never], waiting: [], done: rows });
    expect(t.setAside.map((x) => x.line)).toEqual(['Skipped: Ben sends the gate volumes (the deal "Kroger Scratch Co r63 Columbus DC" closed won on Oct 7; kept for history).']);
    expect(JSON.stringify(t.setAside)).not.toMatch(/detention numbers/);
    expect(t.owed.filter((o) => o.title === 'Send Ben the Columbus detention numbers')).toHaveLength(1);
  });

  it('before Restore the skip is still said as set aside today', async () => {
    const d = ledgerDb({ audit: [skip(DETENTION, 'Send Ben the Columbus detention numbers', '2026-10-07T14:00:00Z')] });
    const rows = await loadCompletedToday(d.client(), LATE);
    expect(rows.map((x) => [x.kind, x.line])).toEqual([['set_aside', 'Skipped: Send Ben the Columbus detention numbers (the deal "Kroger Scratch Co r63 Columbus DC" closed won on Oct 7; kept for history).']]);
  });
});
