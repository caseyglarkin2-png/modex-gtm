import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deferAccountContactCandidate, listAccountContactCandidates, promoteAccountContactCandidate, restageAccountContactCandidate } from '@/lib/account-contact-candidates';
import { dbGetAccounts } from '@/lib/db';
import { slugify } from '@/lib/data';
import { resolveCanonicalAccountScope } from '@/lib/revops/account-identity';

export const dynamic = 'force-dynamic';

const MutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('defer'),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal('promote'),
  }),
  z.object({
    action: z.literal('replace'),
    replacedPersonaId: z.number().int().positive(),
  }),
  z.object({
    action: z.literal('restage'),
  }),
]);

async function resolveAccountNameFromSlug(slug: string) {
  const accounts = await dbGetAccounts();
  const matched = accounts.find((account) => slugify(account.name) === slug);
  return matched?.name ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; candidateId: string }> },
) {
  const { slug, candidateId } = await params;
  const accountName = await resolveAccountNameFromSlug(slug);
  if (!accountName) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const parsedCandidateId = Number(candidateId);
  if (!Number.isInteger(parsedCandidateId) || parsedCandidateId <= 0) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 });
  }

  const parsed = MutationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    let mutationResult: unknown;
    if (parsed.data.action === 'defer') {
      mutationResult = await deferAccountContactCandidate(parsedCandidateId, parsed.data.reason);
    } else if (parsed.data.action === 'restage') {
      mutationResult = await restageAccountContactCandidate(parsedCandidateId);
    } else {
      mutationResult = await promoteAccountContactCandidate(
        parsedCandidateId,
        parsed.data.action === 'replace' ? parsed.data.replacedPersonaId : null,
      );
    }

    const scope = await resolveCanonicalAccountScope(accountName);
    const candidates = await listAccountContactCandidates(scope.accountNames);
    return NextResponse.json({
      success: true,
      mutationResult,
      candidates,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to mutate candidate.',
    }, { status: 400 });
  }
}
