import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { dbGetAccounts } from '@/lib/db';
import { slugify } from '@/lib/data';
import { markAgentActionCacheStale } from '@/lib/agent-actions/cache';

export const dynamic = 'force-dynamic';

/**
 * Schema for inline edits to high-context account fields.
 *
 * Each field is optional so the operator can update one or many at once.
 * `null` is accepted to explicitly clear a field; missing keys are no-ops.
 * Max 4000 chars per field — matches what we tolerate downstream in the
 * recommendation pipeline + Activity audit log.
 */
const AccountPatchSchema = z.object({
  why_now: z.string().max(4000).nullable().optional(),
  primo_angle: z.string().max(4000).nullable().optional(),
  best_intro_path: z.string().max(4000).nullable().optional(),
  signal_type: z.string().max(4000).nullable().optional(),
}).strict(); // reject unknown fields explicitly so a typo in the client doesn't silently no-op

const EDITABLE_FIELDS = ['why_now', 'primo_angle', 'best_intro_path', 'signal_type'] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

async function resolveAccountFromSlug(slug: string) {
  const accounts = await dbGetAccounts();
  return accounts.find((account) => slugify(account.name) === slug) ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const actor = session.user.email;

  const { slug } = await params;
  const account = await resolveAccountFromSlug(slug);
  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = AccountPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Build the diff: only include fields the client actually sent.
  const changed: Array<{ field: EditableField; oldValue: string | null; newValue: string | null }> = [];
  for (const field of EDITABLE_FIELDS) {
    if (!(field in parsed.data)) continue;
    const incomingRaw = parsed.data[field];
    const newValue = incomingRaw === undefined ? null : incomingRaw;
    const oldValue = (account[field] ?? null) as string | null;
    if (oldValue === newValue) continue;
    changed.push({ field, oldValue, newValue });
  }

  if (changed.length === 0) {
    return NextResponse.json({ success: true, account, changed: [] });
  }

  // Apply update.
  const updateData: Record<string, string | null> = {};
  for (const { field, newValue } of changed) {
    updateData[field] = newValue;
  }
  const updatedAccount = await prisma.account.update({
    where: { name: account.name },
    data: updateData,
  });

  // Audit each field change as a separate Activity row so the per-card
  // "Edited 2h ago by Casey" badge can render the right surface-specific
  // history without parsing a multi-field summary.
  await prisma.$transaction(
    changed.map((change) => prisma.activity.create({
      data: {
        account_name: account.name,
        activity_type: 'account_field_edit',
        owner: actor,
        outcome: change.field,
        next_step: change.newValue,
        notes: change.oldValue,
      },
    })),
  );

  // Invalidate cached agent context so the next refresh re-runs with the
  // sharpened account state.
  await markAgentActionCacheStale(account.name);

  return NextResponse.json({
    success: true,
    account: updatedAccount,
    changed: changed.map((change) => ({ field: change.field, newValue: change.newValue })),
  });
}
