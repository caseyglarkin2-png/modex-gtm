import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { createDriveClient, driveConfigFromEnv, driveFoldersFromEnv, driveMaxBytes } from '@/lib/gap/signals/drive-client';
import { DRIVE_FILES_PER_RUN, DRIVE_FIRST_RUN_DAYS_DEFAULT, runDriveSync } from '@/lib/gap/signals/drive-sync';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-drive-sync';
const CRON_PATH = '/api/cron/gap-drive-sync';
const CRON_SCHEDULE = '45 */6 * * *';

/**
 * GET /api/cron/gap-drive-sync   (the Google Workspace and Gemini extension, 2026-10-10)
 *
 * The agreed Drive folders (GAP_DRIVE_FOLDERS, default Meet Recordings, Gemini Artifacts and the yard-audit root, each
 * read one level down into its subfolders, names matched normalized; drive-client.ts DRIVE_DEFAULT_FOLDERS)
 * into GAP's intelligence records every six hours: one page of DRIVE_FILES_PER_RUN files modified after the cursor
 * the last run recorded (the first run bounded to GAP_DRIVE_FIRST_RUN_DAYS), each exported or downloaded under
 * GAP_DRIVE_MAX_BYTES, parsed and imported (producer google_drive or gemini_notes); the unreadable files named on
 * the ledger row, never recorded as extracted; removals said; a failure as a failed ledger row (health shows it).
 * The credential is GAP_DRIVE_REFRESH_TOKEN (with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) or the delegation
 * pair GAP_DRIVE_DWD_SA_JSON and GAP_DRIVE_USER_EMAIL, or, needing no new secret, GAP_DRIVE_DELEGATION=gmail (the GAP
 * sender's delegation asked for drive.readonly, once the Workspace admin adds that scope; a refusal is a failed ledger
 * row in Google's words); none is a NOT CONFIGURED ledger row and a skip in words,
 * never an error. No credential is logged. Nothing here sends, writes HubSpot, enrolls, calls Slack or changes Drive.
 *
 * - Auth first, then GAP_OS_ENABLED. Off answers 200 with the skip payload.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled();
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  const config = driveConfigFromEnv();
  const firstRunDays = Number(process.env.GAP_DRIVE_FIRST_RUN_DAYS);
  try {
    const result = await runDriveSync(prisma, {
      now: new Date(),
      client: config ? createDriveClient(config) : null,
      folders: driveFoldersFromEnv(),
      limit: DRIVE_FILES_PER_RUN,
      firstRunDays: Number.isFinite(firstRunDays) && firstRunDays > 0 ? firstRunDays : DRIVE_FIRST_RUN_DAYS_DEFAULT,
      maxBytes: driveMaxBytes(),
    });
    if (!result.ok && result.status === 'not_configured') {
      const reason = 'gap_drive_not_configured';
      await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
      return NextResponse.json({ skipped: true, reason, detail: result.detail, ledgerId: result.ledgerId });
    }
    if (!result.ok) {
      await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error: new Error(result.error) }).catch(() => undefined);
      return NextResponse.json(result, { status: 502 });
    }
    const message = `${result.listed} listed: ${result.readable.length} readable (${result.imported.accepted} accepted, ${result.imported.duplicates} duplicates, ${result.imported.revised} revised, ${result.imported.invalid} invalid), ${result.unreadable.length} unreadable, ${result.skipped.length} skipped, ${result.removed.length} removed${result.more ? '; more waits for the next run' : ''}`;
    await markCronSuccess(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, message, stats: { listed: result.listed, readable: result.readable.length, unreadable: result.unreadable.length, skipped: result.skipped.length, removed: result.removed.length, ...result.imported, more: result.more } }).catch(() => undefined);
    return NextResponse.json(result);
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
