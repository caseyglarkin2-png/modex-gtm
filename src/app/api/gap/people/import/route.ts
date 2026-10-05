/**
 * POST /api/gap/people/import   `{ accountName, hubspotContactId }`   ADD TO GAP (owner resolution, 2026-10-05)
 *
 * Casey's click links ONE existing HubSpot contact into ONE named GAP account (people/account-import.ts): the
 * contact must be associated with the account's HubSpot company; the account is never created; an existing persona
 * is linked, never duplicated; HubSpot is never written; Apollo is never called. Session only.
 * 201 created / re-homed, 200 linked / already, 409 refused with the reason, 404 unknown account or contact.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { importHubSpotContactToAccount } from '@/lib/gap/people/account-import';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z.object({ accountName: z.string().trim().min(1).max(200), hubspotContactId: z.string().trim().min(1).max(40) }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await importHubSpotContactToAccount(prisma, { ...parsed.data, actor: g.email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'account_not_found' || r.reason === 'contact_not_found' ? 404 : 409 });
  return NextResponse.json(r, { status: r.status === 'created' || r.status === 'rehomed' ? 201 : 200 });
}
