import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';
import { markCronStarted, markCronSuccess, markCronFailure } from '@/lib/cron-monitor';
import { prisma } from '@/lib/prisma';
import proximity from '@/lib/intel/export/proximity-data.json';

export const dynamic = 'force-dynamic';

const CRON_NAME = 'refresh-intel';
const CRON_PATH = '/api/cron/refresh-intel';
const CRON_SCHEDULE = '0 13 * * 1';
const STALE_DAYS = 14;

/**
 * How long to stay quiet after nagging, and how much older the bundles must get
 * before the nag is allowed to repeat sooner than that.
 *
 * Before 2026-07-30 this route held no state whatsoever. `generatedAt` comes from
 * a checked-in JSON file, so once it aged past 14 days the route posted the same
 * message to Slack EVERY MONDAY, forever, and the only way to stop it was a code
 * commit plus a deploy. That is a guaranteed permanent weekly nag, and it was a
 * large share of the recurring traffic that made #yardflow-intent unreadable.
 *
 * A staleness reminder is worth sending once. Sending it 40 times teaches the
 * reader that the channel repeats itself, which costs more than the reminder is
 * worth.
 */
const RENAG_AFTER_DAYS = 28;
const RENAG_ON_WORSENING_DAYS = 30;

const NAG_STATE_KEY = 'refresh-intel:last-nag';

interface NagState {
  nagAgeDays: number;
  nagAt: string;
}

async function readNagState(): Promise<NagState | null> {
  const row = await prisma.systemConfig.findUnique({ where: { key: NAG_STATE_KEY } });
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as Partial<NagState>;
    if (typeof parsed.nagAgeDays !== 'number' || typeof parsed.nagAt !== 'string') return null;
    return { nagAgeDays: parsed.nagAgeDays, nagAt: parsed.nagAt };
  } catch {
    // Unparseable state means we cannot prove we already nagged. Treat it as
    // "never nagged" so a real staleness problem is still surfaced once.
    return null;
  }
}

async function writeNagState(next: NagState) {
  await prisma.systemConfig.upsert({
    where: { key: NAG_STATE_KEY },
    create: { key: NAG_STATE_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
}

async function clearNagState() {
  await prisma.systemConfig.deleteMany({ where: { key: NAG_STATE_KEY } });
}

/** Pure so the policy can be tested without a database or a Slack webhook. */
export function shouldNag(
  ageDays: number,
  prev: NagState | null,
  nowMs: number,
): { nag: boolean; reason: string } {
  if (ageDays < STALE_DAYS) return { nag: false, reason: 'fresh' };
  if (!prev) return { nag: true, reason: 'first-nag' };

  const daysSinceNag = Math.floor((nowMs - new Date(prev.nagAt).getTime()) / 86_400_000);
  if (Number.isNaN(daysSinceNag)) return { nag: true, reason: 'unreadable-timestamp' };
  if (daysSinceNag >= RENAG_AFTER_DAYS) {
    return { nag: true, reason: `quiet-for-${daysSinceNag}d` };
  }
  if (ageDays - prev.nagAgeDays >= RENAG_ON_WORSENING_DAYS) {
    return { nag: true, reason: `worsened-by-${ageDays - prev.nagAgeDays}d` };
  }
  return { nag: false, reason: `already-nagged-${daysSinceNag}d-ago` };
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // This route was registered in KNOWN_CRONS but never instrumented, so /ops
  // listed it and could never show a run for it. Fixed here.
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(
    () => undefined,
  );

  try {
    const gen = new Date((proximity as { generatedAt: string }).generatedAt).getTime();
    const ageDays = Math.floor((Date.now() - gen) / 86_400_000);
    const stale = ageDays >= STALE_DAYS;

    const prev = await readNagState().catch(() => null);
    const { nag, reason } = shouldNag(ageDays, prev, Date.now());

    let posted = false;
    if (nag) {
      posted = await sendSlackNotification(
        `Intel bundles are ${ageDays}d old. Re-run the generators (gen-proximity-export, gen-account-research-package, gen-account-intel-bundles, gen-deduped-accounts), then commit + push.`,
        // Ops, not intent: this is the system asking to be maintained. Nothing
        // here is a prospect signal.
        'ops',
      );
      // Only record the nag if Slack actually accepted it, otherwise a webhook
      // outage would silently consume the one message we were going to send.
      if (posted) {
        await writeNagState({ nagAgeDays: ageDays, nagAt: new Date().toISOString() }).catch(
          () => undefined,
        );
      }
    } else if (!stale && prev) {
      // Bundles were regenerated. Drop the state so the nag re-arms for next time.
      await clearNagState().catch(() => undefined);
    }

    const stats = { ageDays, stale, nagged: posted, nagReason: reason };
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: stale ? `Intel ${ageDays}d old (${reason})` : `Intel fresh (${ageDays}d)`,
      stats,
    }).catch(() => undefined);

    return NextResponse.json(stats);
  } catch (error) {
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);
    throw error;
  }
}
