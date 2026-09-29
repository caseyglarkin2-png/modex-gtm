/**
 * POST /api/gap/accounts/separate-motion   `{ accountName, relatedAccounts, reason, days? }`
 * Casey's audited decision that this account is a SEPARATE buying motion from named related accounts in its
 * corporate family (actor, reason, time, the related accounts, an expiry of at most 180 days). It lifts only the
 * RELATED ACCOUNT ACTIVITY hold for those accounts; every other send gate still runs. Nothing is sent.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hubspotFamily, loadCorporateFamily, loadRelatedActivity, recordSeparateMotion } from '@/lib/gap/family/family';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z.object({ accountName: z.string().trim().min(1).max(300), relatedAccounts: z.array(z.string().trim().min(1).max(300)).min(1).max(20), reason: z.string().trim().min(10).max(600), days: z.number().int().min(1).max(180).optional() }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  const family = await loadCorporateFamily(prisma, b.accountName, { hubspot: hubspotFamily });
  const known = new Set(family.members.map((m) => m.accountName));
  const stray = b.relatedAccounts.filter((a) => !known.has(a));
  if (!family.members.length || stray.length) return NextResponse.json({ error: 'not_in_family', reason: stray.length ? `Not in this account's corporate family: ${stray.join(', ')}.` : 'This account has no related accounts in GAP.' }, { status: 409 });
  // A duplicate record of the same company is not a separate buying motion.
  const same = family.members.filter((m) => m.relation === 'same_company' && b.relatedAccounts.includes(m.accountName)).map((m) => m.accountName);
  if (same.length) return NextResponse.json({ error: 'same_company', reason: `${same.join(', ')} is another record of the same company, not a separate buying motion.` }, { status: 409 });
  // What is live at the named accounts now: only that is covered; anything new there holds again.
  const now = new Date();
  const named = { ...family, members: family.members.filter((m) => b.relatedAccounts.includes(m.accountName)) };
  const activity = await loadRelatedActivity(prisma, named, now).catch(() => null);
  if (!activity || activity.some((a) => a.unknown)) return NextResponse.json({ error: 'activity_unreadable', reason: 'Could not read what is live at the related accounts; nothing was recorded. Try again.' }, { status: 503 });
  const snapshot = Object.fromEntries(activity.map((a) => [a.accountName, a.activity]));
  const r = await recordSeparateMotion(prisma, { accountName: family.accountName, relatedAccounts: b.relatedAccounts, reason: b.reason, actor: g.email, now, days: b.days, snapshot });
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.reason }, { status: 400 });
}
