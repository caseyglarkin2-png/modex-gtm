'use server';

import { revalidatePath } from 'next/cache';
import { runReenrichContactsCron } from '@/lib/cron/reenrich-contacts';

export async function runReenrichContactsNowAction() {
  await runReenrichContactsCron();
  revalidatePath('/admin/crons');
}
