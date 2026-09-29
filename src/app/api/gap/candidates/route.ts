/**
 * GET  /api/gap/candidates[?source=<id>&all=1]   companies GAP met but could not place, with what Scout found
 * POST /api/gap/candidates
 *   `{ op: 'scout', company, hint?, force? }`                one cheap web pass; stores the verdict (once a day per company unless forced; a daily cap across GAP)
 *   `{ op: 'add', company, name, vertical, reason, domain? }` THE account creation contract (checks first; refuses a duplicate)
 *   `{ op: 'check', name, domain? }`                         the creation check alone (read-only)
 *   `{ op: 'map', company, accountName }`                    this company IS that existing account (a curated alias)
 *   `{ op: 'research_more' | 'ignore' | 'reopen', company }` recorded decisions
 *
 * Every write is Casey's click. After an add or a map, the sources that met the company are re-qualified
 * (bounded). Never creates a Persona; never routes, drafts, sends or enrolls; never writes HubSpot.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { accountCreationCheck, createGapAccount, decideCandidate, loadCandidateQueue, mapCandidateToAccount, replanSourcesFor, scoutCandidate } from '@/lib/gap/entity/candidates';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const company = z.string().trim().min(1).max(300);
const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('scout'), company, hint: z.string().max(300).optional(), force: z.boolean().optional() }).strict(),
  z.object({ op: z.literal('check'), name: company, domain: z.string().max(200).optional() }).strict(),
  z.object({ op: z.literal('add'), company, name: company, vertical: z.string().trim().min(1).max(80), reason: z.string().trim().min(1).max(500), domain: z.string().max(200).optional() }).strict(),
  z.object({ op: z.literal('map'), company, accountName: company }).strict(),
  z.object({ op: z.literal('research_more'), company }).strict(),
  z.object({ op: z.literal('ignore'), company }).strict(),
  z.object({ op: z.literal('reopen'), company }).strict(),
]);

export async function GET(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const source = request.nextUrl.searchParams.get('source') ?? undefined;
  return NextResponse.json({ items: await loadCandidateQueue(prisma, { workSourceId: source, includeDecided: request.nextUrl.searchParams.get('all') === '1' }) });
}

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  const now = new Date();
  if (b.op === 'scout') {
    const r = await scoutCandidate(prisma, { company: b.company, hint: b.hint, force: b.force, actor: g.email, now });
    if ('refused' in r) return NextResponse.json({ error: r.refused, scoutedAt: r.scoutedAt ?? null, reason: r.why ?? null }, { status: r.refused === 'web_failed' ? 502 : 429 });
    return NextResponse.json(r);
  }
  if (b.op === 'check') return NextResponse.json(await accountCreationCheck(prisma, { name: b.name, domain: b.domain }));
  if (b.op === 'add') {
    const r = await createGapAccount(prisma, { name: b.name, company: b.company, vertical: b.vertical, reason: b.reason, domain: b.domain, actor: g.email, now });
    if (!r.ok) return NextResponse.json({ error: r.reason, matches: r.matches ?? [] }, { status: 409 });
    const replan = await replanSourcesFor(prisma, { company: b.company, actor: g.email, now });
    return NextResponse.json({ ...r, replan });
  }
  if (b.op === 'map') {
    const r = await mapCandidateToAccount(prisma, { company: b.company, accountName: b.accountName, actor: g.email, now });
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 409 });
    const replan = await replanSourcesFor(prisma, { company: b.company, actor: g.email, now });
    return NextResponse.json({ ...r, replan });
  }
  const decision = b.op === 'ignore' ? 'ignored' : b.op === 'reopen' ? 'open' : 'research_more';
  const r = await decideCandidate(prisma, { company: b.company, decision, actor: g.email, now });
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason }, { status: 400 });
}
