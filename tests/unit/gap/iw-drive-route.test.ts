/**
 * The Drive sync cron route (the Google Workspace and Gemini extension, 2026-10-10). Pinned: 401 without the cron
 * secret; GAP_OS_ENABLED off answers the skip payload and reads nothing; no credential is a skip in words with a
 * not-configured ledger row, never an error; with a credential the client is built from it and one bounded run
 * answers 200 with its counts; a failed run is a 502 with the failure row. No credential value appears in any
 * response or ledger row.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import type { DriveClient } from '@/lib/gap/signals/drive-client';

const h = vi.hoisted(() => ({
  db: null as null | ReturnType<typeof import('./fixtures/ledger-db').ledgerDb>,
  started: vi.fn(async () => undefined),
  success: vi.fn(async () => undefined),
  skipped: vi.fn(async () => undefined),
  failure: vi.fn(async () => undefined),
  create: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db!.client(); } }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: h.started, markCronSuccess: h.success, markCronSkipped: h.skipped, markCronFailure: h.failure }));
vi.mock('@/lib/gap/signals/drive-client', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/gap/signals/drive-client')>()), createDriveClient: h.create }));

const { GET } = await import('@/app/api/cron/gap-drive-sync/route');
const req = (auth = true) => new Request('http://localhost/api/cron/gap-drive-sync', { headers: auth ? { authorization: 'Bearer s' } : {} });

function client(opts: { fail?: boolean } = {}): DriveClient {
  return {
    async resolveFolders(names) { return names.map((n) => ({ id: `id-${n}`, name: n })); },
    async listFolders() { return { folders: [], complete: true }; },
    async listFiles() { if (opts.fail) throw new Error('network: socket hang up'); return { files: [{ id: 'd1', name: 'Kenco x YardFlow - Discovery', mimeType: 'application/vnd.google-apps.document', modifiedTime: '2026-09-01T00:00:00.000Z', owners: ['casey@freightroll.com'], webViewLink: 'https://docs.google.com/document/d/d1', parents: [], size: null, trashed: false }], nextPageToken: null }; },
    async listIds() { return { ids: ['d1'], complete: true }; },
    async getFile() { return null; },
    async exportText() { return '# Kenco notes\n\nThe gate at the Chattanooga yard runs on paper and a radio; the team wants a pilot in 2027.'; },
    async download() { return null; },
  };
}

describe('the Drive sync cron route', () => {
  beforeEach(() => {
    h.db = ledgerDb({ accounts: ['Kenco'], aliases: [] });
    process.env.CRON_SECRET = 's';
    process.env.GAP_OS_ENABLED = 'true';
    delete process.env.GAP_DRIVE_REFRESH_TOKEN;
    delete process.env.GAP_DRIVE_DWD_SA_JSON;
    delete process.env.GAP_DRIVE_USER_EMAIL;
    h.create.mockReset();
    h.skipped.mockClear();
    h.success.mockClear();
    h.failure.mockClear();
  });
  afterEach(() => {
    delete process.env.GAP_OS_ENABLED;
    delete process.env.CRON_SECRET;
    delete process.env.GAP_DRIVE_REFRESH_TOKEN;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it('401 without the secret; the master flag off skips and builds no client; no credential is a skip in words with one not-configured ledger row', async () => {
    expect((await GET(req(false))).status).toBe(401);
    process.env.GAP_OS_ENABLED = 'false';
    expect(await (await GET(req())).json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(h.create).not.toHaveBeenCalled();
    process.env.GAP_OS_ENABLED = 'true';
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ skipped: true, reason: 'gap_drive_not_configured', detail: expect.stringContaining('set GAP_DRIVE_REFRESH_TOKEN') });
    expect(body.ledgerId).toBeTruthy();
    expect(h.skipped).toHaveBeenCalledWith('gap-drive-sync', expect.objectContaining({ reason: 'gap_drive_not_configured' }));
    expect(h.create, 'no client without a credential').not.toHaveBeenCalled();
    expect(h.db!.store.gapAuditEvent).toHaveLength(1);
    expect(h.db!.store.gapAuditEvent[0]).toMatchObject({ subject_id: 'google_drive', payload: { producerState: { status: 'not_configured' } } });
  });

  it('with a credential the client is built from it, one run answers 200 with its counts, and no credential value leaks; a failed run is a 502', async () => {
    process.env.GAP_DRIVE_REFRESH_TOKEN = 'rt-secret-value';
    process.env.GOOGLE_CLIENT_ID = 'cid';
    process.env.GOOGLE_CLIENT_SECRET = 'cs-secret-value';
    h.create.mockImplementation(() => client());
    const res = await GET(req());
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(h.create).toHaveBeenCalledWith({ kind: 'refresh_token', refreshToken: 'rt-secret-value', clientId: 'cid', clientSecret: 'cs-secret-value' });
    // The fake lists the same document under each of the three default folders: one record, then two duplicates, never copies.
    expect(body).toMatchObject({ ok: true, status: 'ok', listed: 3, imported: { accepted: 1, duplicates: 2 }, foldersMissing: [] });
    expect(body.folders.map((f: { name: string }) => f.name), 'the defaults name the real yard-audit root (2026-10-10)').toEqual(['Meet Recordings', 'Gemini Artifacts', 'YardFlow \u2014 Prospect Yard Audits']);
    expect(JSON.stringify(body)).not.toContain('secret-value');
    expect(JSON.stringify(h.db!.store.gapAuditEvent)).not.toContain('secret-value');
    expect(h.db!.store.gapSignal).toHaveLength(1);
    expect(h.db!.store.gapSignal[0]).toMatchObject({ account_name: 'Kenco', submitted_by: 'import:google_drive' });
    expect(h.success).toHaveBeenCalledWith('gap-drive-sync', expect.objectContaining({ message: expect.stringContaining('3 listed: 3 readable (1 accepted, 2 duplicates') }));
    h.create.mockImplementation(() => client({ fail: true }));
    const failed = await GET(req());
    expect(failed.status).toBe(502);
    expect(await failed.json()).toMatchObject({ ok: false, status: 'failed', error: 'network: socket hang up' });
    expect(h.failure).toHaveBeenCalledTimes(1);
  });
});
