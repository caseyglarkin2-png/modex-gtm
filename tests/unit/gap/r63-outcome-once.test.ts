// @vitest-environment node
/**
 * R63-B S3: a stale tab's "Skip today" was accepted again (201) and Work said "Walmart Scratch Co r63: Set aside for
 * today." twice under SET ASIDE OR LOGGED TODAY. The outcome write is idempotent per account per day: the second press
 * answers 200 with the existing row and writes nothing, Work says it once, and a different outcome (a snooze, a clear,
 * the next day's skip) is still written.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';

const h = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return h.client;
  },
}));
vi.mock('@/lib/auth', () => ({ auth: async () => ({ user: { email: 'casey@freightroll.com' } }) }));

import { POST } from '@/app/api/gap/accounts/outcome/route';
import { recordWorkOutcome, WORK_OUTCOME } from '@/lib/gap/work/outcome';
import { loadCompletedToday } from '@/lib/gap/work/day-load';

const ACCOUNT = 'Walmart Scratch Co r63';
const ACTOR = 'casey@freightroll.com';
let db: ReturnType<typeof ledgerDb>;
const outcomes = () => db.store.gapAuditEvent.filter((r) => r.kind === WORK_OUTCOME);
const post = (body: unknown) => POST(new NextRequest('http://localhost/api/gap/accounts/outcome', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }));

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
  db = ledgerDb({ accounts: [ACCOUNT] });
  h.client = db.client();
});

describe('R63-B S3: one outcome per account per day', () => {
  it('the route: the first Skip today is 201, a stale tab\'s second is 200 with the existing row; one row, one line on Work', async () => {
    db.setClock(new Date());
    const first = await post({ accountName: ACCOUNT, kind: 'skipped' });
    expect(first.status).toBe(201);
    const second = await post({ accountName: ACCOUNT, kind: 'skipped' });
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ ok: true, existing: true, outcome: { kind: 'skipped', accountName: ACCOUNT } });
    expect(outcomes()).toHaveLength(1);
    const today = (await loadCompletedToday(db.client(), new Date(Date.now() + 10_000))).filter((x) => x.accountName === ACCOUNT);
    expect(today.map((x) => x.line)).toEqual(['Set aside for today.']);
  });

  it('a different outcome is written (a snooze, a clear); the next day\'s skip is a new row', async () => {
    const now = new Date('2026-10-07T19:00:00Z');
    db.setClock(now);
    const p = db.client();
    expect((await recordWorkOutcome(p, { accountName: ACCOUNT, kind: 'skipped', actor: ACTOR, now })).ok).toBe(true);
    const again = await recordWorkOutcome(p, { accountName: ACCOUNT, kind: 'skipped', actor: ACTOR, now: new Date(now.getTime() + 60_000) });
    expect(again).toMatchObject({ ok: true, existing: true });
    expect(outcomes()).toHaveLength(1);
    expect(await recordWorkOutcome(p, { accountName: ACCOUNT, kind: 'snoozed', until: '2026-10-12T13:00:00Z', actor: ACTOR, now })).toMatchObject({ ok: true });
    expect(await recordWorkOutcome(p, { accountName: ACCOUNT, kind: 'snoozed', until: '2026-10-14T13:00:00Z', actor: ACTOR, now })).not.toHaveProperty('existing');
    expect(outcomes()).toHaveLength(3);
    const tomorrow = new Date('2026-10-08T15:00:00Z');
    db.setClock(tomorrow);
    expect(await recordWorkOutcome(p, { accountName: ACCOUNT, kind: 'skipped', actor: ACTOR, now: tomorrow })).not.toHaveProperty('existing');
    expect(outcomes()).toHaveLength(4);
  });

  it('two identical rows already on file (written before this fix) are one line on Work', async () => {
    const at = new Date('2026-10-07T18:00:00Z');
    const row = (id: string, created: Date) => ({ id, kind: WORK_OUTCOME, actor: ACTOR, subject_type: 'account', subject_id: ACCOUNT, created_at: created, payload: { kind: 'skipped', reason: null, until: '2026-10-08T04:00:00.000Z' } });
    const d = ledgerDb({ accounts: [ACCOUNT], audit: [row('o1', at), row('o2', new Date(at.getTime() + 30_000))] });
    const lines = (await loadCompletedToday(d.client(), new Date('2026-10-07T21:00:00Z'))).map((x) => [x.accountName, x.line]);
    expect(lines).toEqual([[ACCOUNT, 'Set aside for today.']]);
  });
});
