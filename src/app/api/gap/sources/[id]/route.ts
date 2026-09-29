/**
 * GET  /api/gap/sources/:id?field=resolution|qualification|status&value=   the source and its members (drillable)
 * POST /api/gap/sources/:id
 *   `{ op: 'preview', kind, text }`   parse + resolve, writes nothing
 *   `{ op: 'commit',  kind, text }`   idempotent import (members + staged candidates + audit)
 *   `{ op: 'current' }`               make this the current source (quick adds default to it)
 *   `{ op: 'plan' }`                  qualify this source now, account by account (bounded; research runs in the background)
 *
 * Never creates a Persona or an Account; never routes, drafts, sends or enrolls.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { commitIntake, previewIntake, setCurrentWorkSource } from '@/lib/gap/intake/service';
import { planWorkSources } from '@/lib/gap/intake/plan';
import { loadSource, MEMBER_FILTERS } from '@/lib/gap/intake/views';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const TEXT_MAX = 1_000_000;
const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('preview'), kind: z.enum(['people', 'accounts']), text: z.string().min(1).max(TEXT_MAX) }).strict(),
  z.object({ op: z.literal('commit'), kind: z.enum(['people', 'accounts']), text: z.string().min(1).max(TEXT_MAX) }).strict(),
  z.object({ op: z.literal('current') }).strict(),
  z.object({ op: z.literal('plan') }).strict(),
]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const { id } = await params;
  const field = request.nextUrl.searchParams.get('field');
  const value = request.nextUrl.searchParams.get('value');
  const filter = field && value && (MEMBER_FILTERS as readonly string[]).includes(field) ? { field: field as (typeof MEMBER_FILTERS)[number], value } : null;
  const s = await loadSource(prisma, id, { filter });
  if (!s) return NextResponse.json({ error: 'source_not_found' }, { status: 404 });
  return NextResponse.json(s);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const { id } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  if (b.op === 'plan') {
    const r = await planWorkSources(prisma, { now: new Date(), actor: g.email, workSourceId: id, maxAccounts: 25, timeBudgetMs: 60_000 });
    return NextResponse.json(r);
  }
  if (b.op === 'current') {
    const r = await setCurrentWorkSource(prisma, { workSourceId: id, actor: g.email, now: new Date() });
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.reason }, { status: 404 });
  }
  if (b.op === 'preview') {
    const p = await previewIntake(prisma, { text: b.text, kind: b.kind });
    if (p.parse.error) return NextResponse.json({ error: p.parse.error }, { status: 400 });
    return NextResponse.json({ parse: p.parse, counts: p.counts, rows: p.rows.slice(0, 500).map((r) => ({ ...r.row, key: r.key, resolution: r.resolved.resolution, basis: r.resolved.basis, accountName: r.resolved.accountName, personaId: r.resolved.personaId })) });
  }
  const r = await commitIntake(prisma, { workSourceId: id, text: b.text, kind: b.kind, actor: g.email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'source_not_found' ? 404 : 400 });
  return NextResponse.json(r, { status: 201 });
}
