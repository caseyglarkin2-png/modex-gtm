'use server';

import { revalidatePath } from 'next/cache';
import { runCanonicalBackfill } from '@/lib/revops/account-identity-backfill';
import { requireAdminAction } from '@/lib/require-admin';

export async function runCanonicalBackfillAction() {
  await requireAdminAction();
  await runCanonicalBackfill();
  revalidatePath('/ops');
}
