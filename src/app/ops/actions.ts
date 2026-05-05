'use server';

import { revalidatePath } from 'next/cache';
import { runCanonicalBackfill } from '@/lib/revops/account-identity-backfill';

export async function runCanonicalBackfillAction() {
  await runCanonicalBackfill();
  revalidatePath('/ops');
}
