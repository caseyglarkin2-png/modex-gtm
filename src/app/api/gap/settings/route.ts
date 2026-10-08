/**
 * GET  /api/gap/settings    the seller settings (defaults when none are stored) and the GAP mailbox they refuse
 * POST /api/gap/settings    `{ briefingTo?, briefingHourNy?, commandSenders?, mode?, targets? }`: validate, save, answer
 *                           what was saved. 400 `{ error: <reason>, field }` on a refusal; nothing is written then.
 *
 * X03 (GAP OS sales execution engine, 2026-10-08). Session only, behind the GAP flags (intakeGuard). The store and
 * the rules are src/lib/gap/work/settings.ts. Nothing here sends, drafts, enrolls or writes HubSpot.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { intakeGuard } from '@/lib/gap/intake/route-helpers';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { loadSellerSettings, saveSellerSettings, validateSellerSettings } from '@/lib/gap/work/settings';

export const dynamic = 'force-dynamic';

const gapMailbox = () => gapGmailSender()?.userEmail ?? process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() ?? null;

export async function GET() {
  const guard = await intakeGuard();
  if ('response' in guard) return guard.response;
  const settings = await loadSellerSettings(prisma);
  return NextResponse.json({ settings, gapMailbox: gapMailbox() });
}

export async function POST(request: NextRequest) {
  const guard = await intakeGuard();
  if ('response' in guard) return guard.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const v = validateSellerSettings(body, { gapMailbox: gapMailbox() });
  if (!v.ok) return NextResponse.json({ error: v.reason, field: v.field }, { status: 400 });
  const settings = await saveSellerSettings(prisma, v.value, guard.email);
  return NextResponse.json({ settings, gapMailbox: gapMailbox() });
}
