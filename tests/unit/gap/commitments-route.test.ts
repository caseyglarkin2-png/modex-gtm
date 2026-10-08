// @vitest-environment node
/**
 * Batch item 8 (acceptance B, R40): POST /api/gap/commitments `op: 'status', to: 'done'` with no note recorded a Done
 * proved by nothing. The seller's Done is proved by its words: no note answers 400 proof_required and writes nothing.
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

import { POST } from '@/app/api/gap/commitments/route';
import { ensureCommitment, loadCommitment } from '@/lib/gap/work/commitments';

const post = (body: unknown) => new NextRequest('http://localhost/api/gap/commitments', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

describe('POST /api/gap/commitments: Done needs its proof (batch item 8)', () => {
  let db: ReturnType<typeof ledgerDb>;
  let id = '';
  beforeEach(async () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    db = ledgerDb({ accounts: ['Pepsi Scratch Co'] });
    h.client = db.client();
    const made = await ensureCommitment(h.client, { accountName: 'Pepsi Scratch Co', kind: 'deliverable', title: 'Send Ann the dock schedule template', source: { kind: 'capture', id: 'cap1:c1' } }, { actor: 'casey@freightroll.com', now: new Date() });
    id = made.ok ? made.commitment.commitmentId : '';
  });

  it('Done with no note answers 400 proof_required and records nothing; Done with what happened is recorded with it as the proof', async () => {
    const rows = db.store.gapAuditEvent.length;
    const bare = await POST(post({ op: 'status', commitmentId: id, to: 'done' }));
    expect(bare.status).toBe(400);
    expect(await bare.json()).toEqual({ error: 'proof_required' });
    expect(db.store.gapAuditEvent).toHaveLength(rows);
    expect((await loadCommitment(h.client, id))?.status).toBe('open');
    const proved = await POST(post({ op: 'status', commitmentId: id, to: 'done', note: 'Sent the template from Gmail on Oct 7' }));
    expect(proved.status).toBe(200);
    expect(await loadCommitment(h.client, id)).toMatchObject({ status: 'done', proof: { kind: 'seller', note: 'Sent the template from Gmail on Oct 7' } });
  });
});
