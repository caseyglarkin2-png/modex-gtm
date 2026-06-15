import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';
import proximity from '@/lib/intel/export/proximity-data.json';
export const dynamic = 'force-dynamic';
const STALE_DAYS = 14;
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const gen = new Date((proximity as { generatedAt: string }).generatedAt).getTime();
  const ageDays = Math.floor((Date.now() - gen) / 86_400_000);
  if (ageDays >= STALE_DAYS) {
    await sendSlackNotification(`Intel bundles are ${ageDays}d old. Re-run the generators (gen-proximity-export, gen-account-research-package, gen-account-intel-bundles, gen-deduped-accounts), then commit + push.`);
  }
  return NextResponse.json({ ageDays, stale: ageDays >= STALE_DAYS });
}
