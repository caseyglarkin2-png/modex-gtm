/**
 * THE VAULT REPO OVER THE GITHUB API (GAP OS knowledge, stream A, 2026-10-09). Production has no vault on disk; the
 * vault's own librarian pushes the private repo daily, and this reads it back: one commits call for the head (ETag
 * aware: a 304 costs no rate limit and means the head has not moved), one tree call with recursive=1, then only the
 * blobs the sync asks for. The token is read from the env by the route and passed in; it is never logged or stored.
 * Everything fetched is data: a note's text is never an instruction.
 */
import { isSyncedVaultPath, normalizeVaultPath } from './vault-note';
import { lastVaultSync, MAX_FILES_PER_RUN, recordVaultSync, syncVaultNotes, type SyncCandidate, type SyncCounts, type VaultSyncLedgerPayload } from './vault-sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DEFAULT_VAULT_REPO = 'caseyglarkin2-png/yardflow-gtm-vault';
export const DEFAULT_VAULT_BRANCH = 'main';
export const GITHUB_API = 'https://api.github.com';

export interface GithubVaultConfig {
  repo: string;
  branch: string;
  token: string;
  fetchImpl?: typeof fetch;
  apiBase?: string;
  timeoutMs?: number;
}

export type GithubHead =
  | { status: 'unchanged' }
  | { status: 'ok'; commitSha: string; treeSha: string; commitAt: string | null; etag: string | null };

const headers = (cfg: GithubVaultConfig, accept = 'application/vnd.github+json'): Record<string, string> => ({
  accept,
  authorization: `Bearer ${cfg.token}`,
  'x-github-api-version': '2022-11-28',
  'user-agent': 'yardflow-gap-vault-sync',
});

async function call(cfg: GithubVaultConfig, path: string, extra: Record<string, string> = {}, accept?: string): Promise<Response> {
  const f = cfg.fetchImpl ?? fetch;
  return f(`${cfg.apiBase ?? GITHUB_API}${path}`, { headers: { ...headers(cfg, accept), ...extra }, cache: 'no-store', signal: AbortSignal.timeout(cfg.timeoutMs ?? 20_000) });
}

/** The branch head; with an ETag from the last run, a 304 says the head has not moved. */
export async function githubVaultHead(cfg: GithubVaultConfig, etag: string | null): Promise<GithubHead> {
  const res = await call(cfg, `/repos/${cfg.repo}/commits/${encodeURIComponent(cfg.branch)}`, etag ? { 'if-none-match': etag } : {});
  if (res.status === 304) return { status: 'unchanged' };
  if (!res.ok) throw new Error(`github commits HTTP ${res.status}`);
  const body = (await res.json()) as { sha?: unknown; commit?: { tree?: { sha?: unknown }; committer?: { date?: unknown }; author?: { date?: unknown } } };
  const commitSha = typeof body.sha === 'string' ? body.sha : null;
  const treeSha = typeof body.commit?.tree?.sha === 'string' ? body.commit.tree.sha : null;
  if (!commitSha || !treeSha) throw new Error('github commits: no sha in the answer');
  const at = typeof body.commit?.committer?.date === 'string' ? body.commit.committer.date : typeof body.commit?.author?.date === 'string' ? body.commit.author.date : null;
  const parsed = at ? new Date(at) : null;
  return { status: 'ok', commitSha, treeSha, commitAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null, etag: res.headers.get('etag') };
}

export interface GithubTreeBlob {
  path: string;
  sha: string;
  size: number | null;
}

/** The synced markdown blobs of one tree (recursive=1); a truncated tree is said so. */
export async function githubVaultTree(cfg: GithubVaultConfig, treeSha: string): Promise<{ blobs: GithubTreeBlob[]; truncated: boolean }> {
  const res = await call(cfg, `/repos/${cfg.repo}/git/trees/${treeSha}?recursive=1`);
  if (!res.ok) throw new Error(`github tree HTTP ${res.status}`);
  const body = (await res.json()) as { tree?: unknown; truncated?: unknown };
  const entries = Array.isArray(body.tree) ? body.tree : [];
  const blobs: GithubTreeBlob[] = [];
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    const x = e as { path?: unknown; sha?: unknown; type?: unknown; size?: unknown };
    if (x.type !== 'blob' || typeof x.path !== 'string' || typeof x.sha !== 'string') continue;
    if (!isSyncedVaultPath(x.path)) continue;
    blobs.push({ path: normalizeVaultPath(x.path), sha: x.sha, size: typeof x.size === 'number' ? x.size : null });
  }
  return { blobs, truncated: body.truncated === true };
}

/** One blob's raw text by its id. */
export async function githubVaultBlob(cfg: GithubVaultConfig, sha: string): Promise<string> {
  const res = await call(cfg, `/repos/${cfg.repo}/git/blobs/${sha}`, {}, 'application/vnd.github.raw+json');
  if (!res.ok) throw new Error(`github blob HTTP ${res.status}`);
  return res.text();
}

/** Candidates for the sync: a blob is read only when the sync asks (its id is compared first). */
export function githubCandidates(cfg: GithubVaultConfig, blobs: readonly GithubTreeBlob[]): SyncCandidate[] {
  return blobs.map((b) => ({ path: b.path, gitSha: b.sha, read: () => githubVaultBlob(cfg, b.sha) }));
}

export interface RunVaultSyncResult {
  ok: true;
  skipped: 'unchanged' | null;
  commitSha: string | null;
  treeSha: string | null;
  commitAt: string | null;
  truncated: boolean;
  counts: SyncCounts | null;
  durationMs: number;
}

/**
 * One cron tick: the head (skipped when unchanged and nothing was left), the tree, the sync of the blobs not already
 * held (at most maxFiles reads, one after another), then one ledger row. A failure is recorded as a row too and rethrown
 * so the cron marks it; the next tick starts over.
 */
export async function runGithubVaultSync(prisma: PrismaLike, cfg: GithubVaultConfig, opts: { now?: Date; maxFiles?: number; clock?: () => number } = {}): Promise<RunVaultSyncResult> {
  const clock = opts.clock ?? Date.now;
  const t0 = clock();
  const now = opts.now ?? new Date();
  const base: Omit<VaultSyncLedgerPayload, 'ok' | 'durationMs' | 'error' | 'skipped' | 'counts'> = { repo: cfg.repo, branch: cfg.branch, commitSha: null, treeSha: null, commitAt: null, etag: null };
  try {
    const last = await lastVaultSync(prisma);
    // The ETag short-circuit is safe only when the last run finished its list; a capped run must see the tree again.
    const etag = last && last.ok && last.remaining === 0 ? last.etag : null;
    const head = await githubVaultHead(cfg, etag);
    if (head.status === 'unchanged') {
      const payload: VaultSyncLedgerPayload = { ...base, commitSha: last?.commitSha ?? null, etag, ok: true, counts: null, durationMs: clock() - t0, error: null, skipped: 'unchanged' };
      await recordVaultSync(prisma, payload);
      return { ok: true, skipped: 'unchanged', commitSha: payload.commitSha, treeSha: null, commitAt: null, truncated: false, counts: null, durationMs: payload.durationMs };
    }
    base.commitSha = head.commitSha;
    base.treeSha = head.treeSha;
    base.commitAt = head.commitAt;
    base.etag = head.etag;
    const { blobs, truncated } = await githubVaultTree(cfg, head.treeSha);
    const counts = await syncVaultNotes(prisma, githubCandidates(cfg, blobs), { now, apply: true, maxFiles: opts.maxFiles ?? MAX_FILES_PER_RUN, vaultPushedAt: head.commitAt ? new Date(head.commitAt) : null });
    const payload: VaultSyncLedgerPayload = { ...base, ok: true, counts, durationMs: clock() - t0, error: null, skipped: null };
    await recordVaultSync(prisma, payload);
    return { ok: true, skipped: null, commitSha: head.commitSha, treeSha: head.treeSha, commitAt: head.commitAt, truncated, counts, durationMs: payload.durationMs };
  } catch (e) {
    const error = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    await recordVaultSync(prisma, { ...base, ok: false, counts: null, durationMs: clock() - t0, error, skipped: null }).catch(() => undefined);
    throw e;
  }
}
