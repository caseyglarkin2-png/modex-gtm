import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbGetAccounts } from '@/lib/db';
import { slugify } from '@/lib/data';
import { resolveCanonicalAccountScope } from '@/lib/revops/account-identity';
import { listAccountContactCandidates, upsertAccountContactCandidates } from '@/lib/account-contact-candidates';
import { runAgentAction } from '@/lib/agent-actions/broker';

export const dynamic = 'force-dynamic';

const DiscoverSchema = z.object({
  refresh: z.boolean().optional().default(true),
});

async function resolveAccountNameFromSlug(slug: string) {
  const accounts = await dbGetAccounts();
  const matched = accounts.find((account) => slugify(account.name) === slug);
  return matched?.name ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const accountName = await resolveAccountNameFromSlug(slug);
  if (!accountName) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const scope = await resolveCanonicalAccountScope(accountName);
  const candidates = await listAccountContactCandidates(scope.accountNames);
  return NextResponse.json({
    success: true,
    accountName,
    accountScope: scope.accountNames,
    candidates,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const accountName = await resolveAccountNameFromSlug(slug);
  if (!accountName) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const parsed = DiscoverSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scope = await resolveCanonicalAccountScope(accountName);
  const result = await runAgentAction({
    action: 'company_contacts',
    refresh: parsed.data.refresh,
    depth: 'quick',
    target: {
      accountName,
      accountNames: scope.accountNames,
      company: accountName,
    },
  });

  const candidates = await upsertAccountContactCandidates(accountName, result);
  return NextResponse.json({
    success: true,
    accountName,
    accountScope: scope.accountNames,
    result,
    candidates,
  });
}
