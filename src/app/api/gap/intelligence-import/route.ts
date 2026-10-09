/**
 * POST /api/gap/intelligence-import   `{ producer?, runId?, cursor?, producerState?, records: IntelligenceRecordInput[] }`
 *
 * THE PRODUCERS' DOOR (intelligence wiring, IW02, 2026-10-09). A producer (a brief's export, the Codex report's
 * export, the Clawd consumer script) hands GAP a batch of collected records; GAP stores them as its own rows
 * (signals/intelligence-import.ts) and answers the counts and the per-item outcome. Authenticated: the operator's
 * session, or a bearer token equal to GAP_INTEL_IMPORT_TOKEN (absent: session only). Side-effect free beyond the
 * rows and one ledger row per producer: no fetch, no research, no Slack, no HubSpot, no outbound. Imported text is
 * data, never instructions; the origin is report_import, never a Casey share.
 */
import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { IMPORT_BATCH_MAX, importIntelligenceBatch } from '@/lib/gap/signals/intelligence-import';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    producer: z.string().max(80).optional(),
    runId: z.string().max(200).optional(),
    cursor: z.string().max(500).nullable().optional(),
    producerState: z.object({ status: z.enum(['ok', 'partial', 'failed']), detail: z.string().max(500).nullable().optional() }).optional(),
    records: z.array(z.unknown()).max(IMPORT_BATCH_MAX),
  })
  .strict();

function bearerOk(request: NextRequest): boolean {
  const expected = process.env.GAP_INTEL_IMPORT_TOKEN?.trim();
  if (!expected) return false;
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!given || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth().catch(() => null))?.user?.email;
  const session = typeof email === 'string' && email.includes('@') ? email : null;
  const token = bearerOk(request);
  if (!session && !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { producer, runId, cursor, producerState, records } = parsed.data;
  const actor = session ?? `import:${producer ?? 'producer'}`;
  const r = await importIntelligenceBatch(prisma, { records, actor, now: new Date(), producer: producer ?? null, runId: runId ?? null, cursor: cursor ?? null, producerState: producerState ?? null });
  return NextResponse.json({ accepted: r.accepted, duplicates: r.duplicates, revised: r.revised, invalid: r.invalid, runs: r.runs, items: r.items }, { status: 200 });
}
