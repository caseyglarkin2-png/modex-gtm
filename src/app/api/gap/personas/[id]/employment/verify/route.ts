/**
 * POST /api/gap/personas/[id]/employment/verify   VERIFY CURRENT ROLE (owner resolution, 2026-10-05)
 *
 * One bounded, source-backed public check (people/employment-verify.ts: same_role / different_role / left / conflict
 * / unknown), recorded as DERIVED evidence with the URL's tier (people/employment-store.ts). Never overwrites Casey's
 * own correction; an answer without a source asserts nothing; no Apollo credit. Session only; Casey's click, never a
 * render. 200 with the verification, the employment read (`read`) and the role read (`role`). The sibling
 * /api/gap/people/verify-role takes a persona OR a HubSpot-only person.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordEmploymentVerification } from '@/lib/gap/people/employment-store';
import { verifyEmployment } from '@/lib/gap/people/employment-verify';
import { intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const raw = (await params).id;
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const persona = await prisma.persona.findUnique({ where: { id: Number(raw) }, select: { id: true, name: true, title: true, account_name: true, linkedin_url: true, company_domain: true } });
  if (!persona) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const companyDomains = persona.company_domain ? [persona.company_domain] : [];
  const v = await verifyEmployment({ name: persona.name, title: persona.title, company: persona.account_name, linkedinUrl: persona.linkedin_url, companyDomains });
  const r = await recordEmploymentVerification(prisma, { personaId: persona.id, actor: g.email, now: new Date(), verdict: v.verdict, company: v.company, title: v.title, priorTitle: v.priorTitle, sourceUrl: v.sourceUrl, sourceDate: v.sourceDate, confidence: v.confidence, summary: v.summary, companyDomains });
  if (!r.ok) return NextResponse.json({ error: r.reason, verification: v }, { status: r.reason === 'persona_not_found' ? 404 : 409 });
  return NextResponse.json({ verification: v, ...r });
}
