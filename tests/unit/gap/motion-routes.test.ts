import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, audit, prisma } = vi.hoisted(() => {
  const session = { value: null as null | { user: { email: string } } };
  const audit: any[] = [];
  const people: Record<number, string> = { 1: 'PepsiCo', 2: 'PepsiCo', 9: 'Kroger' };
  const prisma = {
    persona: {
      findUnique: vi.fn(async ({ where }: any) => (people[where.id] ? { id: where.id, account_name: people[where.id] } : null)),
      findMany: vi.fn(async ({ where }: any) => where.id.in.filter((id: number) => people[id]).map((id: number) => ({ id, account_name: people[id] }))),
    },
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { audit.push(data); return { created_at: new Date() }; }) },
  };
  return { session, audit, prisma };
});
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));

import { POST as anglePOST } from '@/app/api/gap/personas/[id]/angle/route';
import { POST as motionPOST } from '@/app/api/gap/accounts/motion/route';

const req = (url: string, body: unknown) => new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  audit.length = 0;
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('POST /api/gap/personas/[id]/angle', () => {
  it('401 without a session; 201 appends the angle; 404 unknown person; 400 empty', async () => {
    session.value = null;
    expect((await anglePOST(req('https://x/a', { text: 'x' }), ctx('1'))).status).toBe(401);
    session.value = { user: { email: 'casey@freightroll.com' } };
    expect((await anglePOST(req('https://x/a', { text: 'Owns the DC network.' }), ctx('1'))).status).toBe(201);
    expect(audit[0]).toMatchObject({ kind: 'persona.angle', subject_id: '1', actor: 'casey@freightroll.com', payload: { text: 'Owns the DC network.', source: 'human' } });
    expect((await anglePOST(req('https://x/a', { text: 'x' }), ctx('404'))).status).toBe(404);
    expect((await anglePOST(req('https://x/a', { text: '  ' }), ctx('1'))).status).toBe(400);
  });
});

describe('POST /api/gap/accounts/motion', () => {
  it('records the primary/next choice; refuses people from another account or the same person twice', async () => {
    expect((await motionPOST(req('https://x/m', { accountName: 'PepsiCo', primaryPersonaId: 2, nextPersonaId: 1 }))).status).toBe(201);
    expect(audit[0]).toMatchObject({ kind: 'account.motion', subject_type: 'account', subject_id: 'PepsiCo', payload: { primaryPersonaId: 2, nextPersonaId: 1 } });
    expect((await motionPOST(req('https://x/m', { accountName: 'PepsiCo', primaryPersonaId: 9 }))).status).toBe(409);
    expect((await motionPOST(req('https://x/m', { accountName: 'PepsiCo', primaryPersonaId: 1, nextPersonaId: 1 }))).status).toBe(409);
    expect(audit).toHaveLength(1);
  });
});
