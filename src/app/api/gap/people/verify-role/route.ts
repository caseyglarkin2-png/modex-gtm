/**
 * POST /api/gap/people/verify-role   VERIFY CURRENT ROLE for a persona or a HubSpot-only person (owner resolution, 2026-10-05)
 *
 *   `{ personaId }`                                            a GAP contact
 *   `{ hubspotContactId, accountName, name, title }`           a HubSpot-only person (no GAP record)
 *
 * Exactly one subject. One bounded grounded search (people/employment-verify.ts: same_role / different_role / left /
 * conflict / unknown), recorded through the store: a persona gets the derived fields and both audit rows, a
 * HubSpot-only person gets the one 'person.role_verified' row that IS their record. 200 with
 * `{ verification, read: RoleRead }` (a persona also carries `employment`). Never callable without a session, never
 * on a render (no GET), never Apollo, never a HubSpot write. 404 unknown persona; 409 a human correction stands.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { accountEmploymentContext, loadHubSpotContactRoleEvidence, recordEmploymentVerification, recordHubSpotContactRoleVerification } from '@/lib/gap/people/employment-store';
import { verifyEmployment } from '@/lib/gap/people/employment-verify';
import { readRole } from '@/lib/gap/people/role-currentness';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.union([
  z.object({ personaId: z.number().int().positive() }).strict(),
  z
    .object({
      hubspotContactId: z.string().trim().regex(/^\d{1,40}$/),
      accountName: z.string().trim().min(1).max(200),
      name: z.string().trim().min(1).max(200),
      title: z.string().trim().max(200).nullable(),
    })
    .strict(),
]);

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const now = new Date();

  if ('personaId' in parsed.data) {
    const persona = await prisma.persona.findUnique({ where: { id: parsed.data.personaId }, select: { id: true, name: true, title: true, account_name: true, linkedin_url: true, company_domain: true } });
    if (!persona) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const ctx = await accountEmploymentContext(prisma, persona.account_name);
    const companyDomains = [...new Set([...(persona.company_domain ? [persona.company_domain] : []), ...ctx.domains])];
    const v = await verifyEmployment({ name: persona.name, title: persona.title, company: persona.account_name, linkedinUrl: persona.linkedin_url, companyDomains });
    const r = await recordEmploymentVerification(prisma, { personaId: persona.id, actor: g.email, now, verdict: v.verdict, company: v.company, title: v.title, priorTitle: v.priorTitle, sourceUrl: v.sourceUrl, sourceDate: v.sourceDate, confidence: v.confidence, summary: v.summary, companyDomains });
    if (!r.ok) return NextResponse.json({ error: r.reason, verification: v }, { status: r.reason === 'persona_not_found' ? 404 : 409 });
    return NextResponse.json({ verification: v, read: r.role, employment: r.read, personaId: r.personaId, recorded: r.recorded, auditId: r.auditId });
  }

  const { hubspotContactId, accountName, name, title } = parsed.data;
  const ctx = await accountEmploymentContext(prisma, accountName);
  const companyDomains = ctx.domains;
  const v = await verifyEmployment({ name, title, company: accountName, companyDomains });
  const rec = await recordHubSpotContactRoleVerification(prisma, { hubspotContactId, accountName, name, storedTitle: title, actor: g.email, now, verification: v, companyDomains });
  const evidence = (await loadHubSpotContactRoleEvidence(prisma, [hubspotContactId])).get(hubspotContactId) ?? [];
  const read = readRole({ accountName, aliases: ctx.aliases, domains: ctx.domains, storedTitle: title, evidence, now });
  return NextResponse.json({ verification: v, read, recorded: rec.recorded, auditId: rec.auditId });
}
