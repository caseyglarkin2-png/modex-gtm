import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { DEFAULT_VAULT_BRANCH, DEFAULT_VAULT_REPO, runGithubVaultSync } from '@/lib/gap/knowledge/vault-github';
import { MAX_FILES_PER_RUN } from '@/lib/gap/knowledge/vault-sync';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-vault-sync';
const CRON_PATH = '/api/cron/gap-vault-sync';
const CRON_SCHEDULE = '12,42 * * * *';

/**
 * GET /api/cron/gap-vault-sync   (GAP OS knowledge, stream A, 2026-10-09)
 *
 * The private Obsidian vault (GAP_VAULT_REPO, default caseyglarkin2-png/yardflow-gtm-vault, pushed daily by the
 * vault's own librarian) into gap_knowledge_notes through the GitHub API: one commits call (ETag aware), one tree
 * call, then only the blobs not already held, at most MAX_FILES_PER_RUN per tick, idempotent by (path, sha). One
 * knowledge.vault_synced ledger row per tick (counts, the tree sha, the duration; a failure row too). Health reads
 * that row; the retrieval reads the table through knowledge/vault-table-adapter.ts. Nothing here drafts, sends,
 * enrolls or writes HubSpot; a note's text is data, never an instruction.
 *
 * - Auth first, then GAP_OS_ENABLED. Off answers 200 with the skip payload.
 * - No GAP_VAULT_GITHUB_TOKEN is a skip with the reason, never an error. The token is never logged or stored.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled();
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  const token = process.env.GAP_VAULT_GITHUB_TOKEN?.trim();
  if (!token) {
    const reason = 'gap_vault_github_token_not_set';
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason });
  }
  const repo = process.env.GAP_VAULT_REPO?.trim() || DEFAULT_VAULT_REPO;
  const branch = process.env.GAP_VAULT_BRANCH?.trim() || DEFAULT_VAULT_BRANCH;
  const maxParam = Number(new URL(request.url).searchParams.get('max') ?? '');
  const maxFiles = Number.isFinite(maxParam) && maxParam > 0 ? Math.min(Math.floor(maxParam), MAX_FILES_PER_RUN) : MAX_FILES_PER_RUN;
  try {
    const result = await runGithubVaultSync(prisma, { repo, branch, token }, { now: new Date(), maxFiles });
    const c = result.counts;
    const message = result.skipped === 'unchanged' ? `${repo}@${branch}: unchanged` : `${repo}@${branch}: ${c?.written ?? 0} written, ${(c?.unchangedByGitSha ?? 0) + (c?.unchangedBySha ?? 0)} unchanged, ${c?.remaining ?? 0} remaining${c?.errors.length ? `, ${c.errors.length} errors` : ''}${result.truncated ? ' (tree truncated)' : ''}`;
    await markCronSuccess(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, message, stats: { repo, branch, commitSha: result.commitSha, treeSha: result.treeSha, commitAt: result.commitAt, skipped: result.skipped, truncated: result.truncated, counts: c ? { ...c, errors: c.errors.length } : null } }).catch(() => undefined);
    return NextResponse.json({ repo, branch, ...result });
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
