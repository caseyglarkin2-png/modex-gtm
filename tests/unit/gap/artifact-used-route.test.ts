// @vitest-environment node
/**
 * Batch item 8 (R53): POST /api/gap/deals/artifact-used records that the seller copied a prepared deal artifact: one
 * append-only `deal.artifact_used` row on the account, never a send and never a HubSpot write.
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

import { POST } from '@/app/api/gap/deals/artifact-used/route';

const post = (body: unknown) => new NextRequest('http://localhost/api/gap/deals/artifact-used', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

describe('POST /api/gap/deals/artifact-used (batch item 8)', () => {
  let db: ReturnType<typeof ledgerDb>;
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    db = ledgerDb({ accounts: ['Kroger Scratch Co'] });
    h.client = db.client();
  });

  it('records the copy on the account; an unknown account is 404 and an unknown kind is 400, each writing nothing', async () => {
    const res = await POST(post({ accountName: 'Kroger Scratch Co', dealId: '70001', kind: 'recap', textHash: 'abc123' }));
    expect(res.status).toBe(201);
    expect(db.store.gapAuditEvent.map((r) => [r.kind, r.subject_type, r.subject_id, r.payload])).toEqual([['deal.artifact_used', 'account', 'Kroger Scratch Co', { dealId: '70001', kind: 'recap', textHash: 'abc123', how: 'copied' }]]);
    expect((await POST(post({ accountName: 'Nobody Co', dealId: '70001', kind: 'recap', textHash: 'abc123' }))).status).toBe(404);
    expect((await POST(post({ accountName: 'Kroger Scratch Co', dealId: '70001', kind: 'contract', textHash: 'abc123' }))).status).toBe(400);
    expect(db.store.gapAuditEvent).toHaveLength(1);
  });
});
