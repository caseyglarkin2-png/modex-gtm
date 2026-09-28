import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, audit, prisma } = vi.hoisted(() => {
  const session = { value: null as null | { user: { email: string } } };
  const audit: any[] = [];
  const prisma = {
    prospectingSignal: { findUnique: vi.fn(async ({ where }: any) => (where.id === 's1' ? { id: 's1', account_name: 'PepsiCo' } : null)) },
    gapAuditEvent: {
      findFirst: vi.fn(async ({ where }: any) => audit.find((a) => a.kind === where.kind && a.subject_id === where.subject_id) ?? null),
      create: vi.fn(async ({ data }: any) => { audit.push(data); return { id: 'a' }; }),
    },
  };
  return { session, audit, prisma };
});
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));

import { POST } from '@/app/api/gap/evidence/ignore/route';

const req = (body: unknown) => new NextRequest('https://x/api/gap/evidence/ignore', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  audit.length = 0;
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('POST /api/gap/evidence/ignore', () => {
  it('no session: 401, nothing recorded', async () => {
    session.value = null;
    expect((await POST(req({ signalId: 's1' }))).status).toBe(401);
    expect(audit).toHaveLength(0);
  });

  it('records one append-only evidence.ignored row, then answers already-ignored without a second row', async () => {
    expect((await POST(req({ signalId: 's1' }))).status).toBe(201);
    expect(audit).toEqual([{ kind: 'evidence.ignored', actor: 'casey@freightroll.com', subject_type: 'prospecting_signal', subject_id: 's1', payload: { accountName: 'PepsiCo', reason: null } }]);
    const again = await POST(req({ signalId: 's1' }));
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ alreadyIgnored: true });
    expect(audit).toHaveLength(1);
  });

  it('an unknown signal is 404; a malformed body is 400', async () => {
    expect((await POST(req({ signalId: 'nope' }))).status).toBe(404);
    expect((await POST(req({ signalId: 's1', extra: true }))).status).toBe(400);
  });
});
