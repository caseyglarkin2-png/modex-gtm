/**
 * Stream A (GAP OS knowledge, 2026-10-09): the vault sync cron route and the GitHub reader. Pinned: 401 without the
 * cron secret; GAP_OS_ENABLED off answers the skip payload and reads nothing; no token is a skip in words, never an
 * error; a tick reads the head, the tree and only the blobs not already held, writes the rows and one
 * knowledge.vault_synced ledger row; a 304 on the head (with the last run's ETag) is a skipped tick with its own
 * ledger row; a GitHub failure is a failure ledger row and a 500. The token goes only in the authorization header.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ledgerDb } from './fixtures/ledger-db';
import { gitBlobSha } from '@/lib/gap/knowledge/vault-note';
import { normalizeCompanyName } from '@/lib/gap/identity/normalize';

const FIX = path.resolve(__dirname, 'fixtures/vault');
const FILES = ['02_Accounts/Kenco Logistics.md', '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', '05_Meetings/2026-07-16 Kenco Logistics.md'];
const text = (rel: string) => readFileSync(path.join(FIX, rel), 'utf8').replace(/\r\n/g, '\n');

const h = vi.hoisted(() => ({
  db: null as null | ReturnType<typeof import('./fixtures/ledger-db').ledgerDb>,
  started: vi.fn(async () => undefined),
  success: vi.fn(async () => undefined),
  skipped: vi.fn(async () => undefined),
  failure: vi.fn(async () => undefined),
  fetch: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db!.client(); } }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: h.started, markCronSuccess: h.success, markCronSkipped: h.skipped, markCronFailure: h.failure }));

const { GET } = await import('@/app/api/cron/gap-vault-sync/route');
const req = (auth = true, qs = '') => new Request(`http://localhost/api/cron/gap-vault-sync${qs}`, { headers: auth ? { authorization: 'Bearer s' } : {} });
const json = (body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json', ...(init.headers ?? {}) } });

/** A fake GitHub: the head, the tree of the three fixtures (plus a skipped folder and a png) and the blobs by id. */
function github(opts: { head304?: boolean; commitSha?: string; failTree?: boolean } = {}) {
  const blobs = new Map(FILES.map((p) => [gitBlobSha(text(p)), text(p)]));
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  h.fetch.mockImplementation(async (url: string, init: RequestInit) => {
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>));
    calls.push({ url, headers });
    if (/\/commits\/main$/.test(url)) {
      if (opts.head304 && headers['if-none-match'] === 'W/"etag-1"') return new Response(null, { status: 304 });
      return json({ sha: opts.commitSha ?? 'c-1', commit: { tree: { sha: 't-1' }, committer: { date: '2026-10-09T13:10:00Z' } } }, { headers: { etag: 'W/"etag-1"' } });
    }
    if (/\/git\/trees\/t-1\?recursive=1$/.test(url)) {
      if (opts.failTree) return json({ message: 'rate limited' }, { status: 403 });
      return json({ sha: 't-1', truncated: false, tree: [...FILES.map((p) => ({ path: p, type: 'blob', sha: gitBlobSha(text(p)), size: 10 })), { path: '99_Archive/02_Accounts/Old.md', type: 'blob', sha: 'x' }, { path: '02_Accounts/logo.png', type: 'blob', sha: 'y' }, { path: '02_Accounts', type: 'tree', sha: 'z' }] });
    }
    const blob = /\/git\/blobs\/([0-9a-f]{40})$/.exec(url)?.[1];
    if (blob && blobs.has(blob)) return new Response(blobs.get(blob)!, { status: 200 });
    return json({ message: 'not found' }, { status: 404 });
  });
  return calls;
}

describe('the vault sync cron route', () => {
  beforeEach(() => {
    // The identity tables are present (seeded) and one alias maps the vault's spelling to the GAP account.
    h.db = ledgerDb({ accounts: ['Kenco'], companies: [], links: [], aliases: [{ alias: 'Kenco Logistics', normalized_alias: normalizeCompanyName('Kenco Logistics'), account_name: 'Kenco', source: 'manual', created_by: 'test' }] });
    process.env.CRON_SECRET = 's';
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_VAULT_GITHUB_TOKEN = 'ghp_test_only';
    delete process.env.GAP_VAULT_REPO;
    vi.stubGlobal('fetch', h.fetch);
    h.fetch.mockReset();
    h.skipped.mockClear();
    h.success.mockClear();
    h.failure.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GAP_VAULT_GITHUB_TOKEN;
    delete process.env.GAP_OS_ENABLED;
    delete process.env.CRON_SECRET;
  });

  it('401 without the secret; the master flag off skips and calls nothing; no token is a skip in words', async () => {
    expect((await GET(req(false))).status).toBe(401);
    process.env.GAP_OS_ENABLED = 'false';
    expect(await (await GET(req())).json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    process.env.GAP_OS_ENABLED = 'true';
    delete process.env.GAP_VAULT_GITHUB_TOKEN;
    expect(await (await GET(req())).json()).toEqual({ skipped: true, reason: 'gap_vault_github_token_not_set' });
    expect(h.skipped).toHaveBeenCalledWith('gap-vault-sync', expect.objectContaining({ reason: 'gap_vault_github_token_not_set' }));
    expect(h.fetch, 'nothing reached GitHub').not.toHaveBeenCalled();
    expect(h.db!.store.gapAuditEvent, 'no ledger row for a skip before the read').toHaveLength(0);
  });

  it('a tick reads the head, the tree and the blobs, writes the rows and one ledger row; the next tick with the ETag is unchanged and reads no blob', async () => {
    const calls = github();
    const res = await GET(req());
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({ ok: true, repo: 'caseyglarkin2-png/yardflow-gtm-vault', branch: 'main', commitSha: 'c-1', treeSha: 't-1', commitAt: '2026-10-09T13:10:00.000Z', skipped: null, counts: { seen: 3, read: 3, written: 3, remaining: 0 } });
    expect(calls.map((c) => c.url.replace('https://api.github.com', ''))).toEqual(['/repos/caseyglarkin2-png/yardflow-gtm-vault/commits/main', '/repos/caseyglarkin2-png/yardflow-gtm-vault/git/trees/t-1?recursive=1', ...FILES.map((p) => `/repos/caseyglarkin2-png/yardflow-gtm-vault/git/blobs/${gitBlobSha(text(p))}`)]);
    expect(calls[0].headers.authorization).toBe('Bearer ghp_test_only');
    expect(calls[0].headers['if-none-match'], 'no ETag on the first run').toBeUndefined();
    expect(calls[2].headers.accept).toBe('application/vnd.github.raw+json');
    const rows = h.db!.store.gapKnowledgeNote;
    expect(rows.map((r) => r.kind).sort()).toEqual(['account', 'meeting', 'raw']);
    expect(rows.every((r) => r.vault_pushed_at instanceof Date && r.vault_pushed_at.toISOString() === '2026-10-09T13:10:00.000Z'), 'the commit time is the push time').toBe(true);
    expect(rows.find((r) => r.kind === 'account')!.account_name, 'resolved through identity (the alias maps the vault spelling to the GAP account)').toBe('Kenco');
    const ledger = h.db!.store.gapAuditEvent;
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ kind: 'knowledge.vault_synced', actor: 'cron:gap-vault-sync', subject_type: 'vault', subject_id: 'caseyglarkin2-png/yardflow-gtm-vault', payload: { ok: true, commitSha: 'c-1', treeSha: 't-1', etag: 'W/"etag-1"', counts: { written: 3, remaining: 0 } } });
    expect(JSON.stringify(ledger[0].payload), 'the token is never in the ledger').not.toContain('ghp_test_only');
    expect(h.success).toHaveBeenCalledWith('gap-vault-sync', expect.objectContaining({ message: 'caseyglarkin2-png/yardflow-gtm-vault@main: 3 written, 0 unchanged, 0 remaining' }));

    const second = github({ head304: true });
    const again = await (await GET(req())).json();
    expect(again).toMatchObject({ ok: true, skipped: 'unchanged', commitSha: 'c-1' });
    expect(second.map((c) => c.url.split('/repos/')[1])).toEqual(['caseyglarkin2-png/yardflow-gtm-vault/commits/main']);
    expect(second[0].headers['if-none-match']).toBe('W/"etag-1"');
    expect(h.db!.store.gapAuditEvent).toHaveLength(2);
    expect(h.db!.store.gapAuditEvent[1].payload).toMatchObject({ ok: true, skipped: 'unchanged' });

    const third = github({ commitSha: 'c-2' });
    const moved = await (await GET(req())).json();
    expect(moved, 'the head moved but every blob is held: nothing read').toMatchObject({ ok: true, skipped: null, commitSha: 'c-2', counts: { seen: 3, unchangedByGitSha: 3, read: 0, written: 0 } });
    expect(third.filter((c) => c.url.includes('/git/blobs/'))).toHaveLength(0);
  });

  it('a GitHub failure is a failure ledger row and a 500; ?max caps the reads and the rest is remaining', async () => {
    github({ failTree: true });
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'github tree HTTP 403' });
    expect(h.failure).toHaveBeenCalledTimes(1);
    expect(h.db!.store.gapAuditEvent[0]).toMatchObject({ kind: 'knowledge.vault_synced', payload: { ok: false, error: 'github tree HTTP 403', commitSha: 'c-1' } });
    github();
    const capped = await (await GET(req(true, '?max=2'))).json();
    expect(capped.counts).toMatchObject({ read: 2, written: 2, remaining: 1 });
    const second = github({ head304: true });
    const next = await (await GET(req())).json();
    expect(next.counts, 'a capped run never short-circuits on the ETag: the tree is read again and the last file lands').toMatchObject({ unchangedByGitSha: 2, read: 1, written: 1, remaining: 0 });
    expect(second[0].headers['if-none-match']).toBeUndefined();
  });
});
