// @vitest-environment node
/**
 * The Drive sync (the Google Workspace and Gemini extension, 2026-10-10), against a fake client. Pinned: the
 * incremental cursor per folder on the ledger (one bounded page per run, oldest first, the next run continues);
 * a second run over the same files imports nothing new, and the same records again are duplicates, never copies;
 * an UNREADABLE file (an image-only deck, a PDF without an extractor) is named on the ledger row with its reason
 * and NEVER becomes a record; images and receipts are skipped by type and name, said; a file known from the last
 * run that the folder no longer lists is `removed` with its fate and nothing is deleted in GAP; NOT CONFIGURED is a
 * ledger row naming the variables, once, and producer status says it in words; a thrown client error is a failed
 * ledger row and the cursor stays; a dry run writes nothing.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import type { DriveClient, DriveFile } from '@/lib/gap/signals/drive-client';
import { NOT_CONFIGURED_STATUS, runDriveSync, storedDriveState } from '@/lib/gap/signals/drive-sync';
import { INTEL_IMPORTED_EVENT } from '@/lib/gap/signals/intelligence-record';
import { loadProducerStatus, producerStatusLine } from '@/lib/gap/signals/producer-status';

const fx = (name: string) => readFileSync(path.join(process.cwd(), 'tests/fixtures/gap/drive', name), 'utf8');
const NOW = new Date('2026-10-10T03:00:00Z');
const DOC = 'application/vnd.google-apps.document';
const SLIDES = 'application/vnd.google-apps.presentation';
const file = (over: Partial<DriveFile> & { id: string; name: string; mimeType: string; modifiedTime: string }): DriveFile => ({ owners: ['casey@freightroll.com'], webViewLink: `https://drive.google.com/file/d/${over.id}/view`, parents: [], size: null, trashed: false, ...over });

const GEMINI_AUG = fx('kenco-discovery-2026-07-16.gemini.md').replace(/Jul 16, 2026/g, 'Aug 29, 2026').replace(/Discovery/g, 'Case studies');

interface Fake { client: DriveClient; calls: string[] }
function fakeClient(opts: { folders: Record<string, string>; files: Record<string, DriveFile[]>; texts?: Record<string, string>; bytes?: Record<string, Buffer>; fail?: 'list' | 'folders'; byId?: Record<string, DriveFile | null> }): Fake {
  const calls: string[] = [];
  const client: DriveClient = {
    async resolveFolders(names) {
      calls.push(`folders:${names.join(',')}`);
      if (opts.fail === 'folders') throw new Error('Drive refused the request (403)');
      return names.filter((n) => opts.folders[n]).map((n) => ({ id: opts.folders[n], name: n }));
    },
    async listFiles({ folderId, modifiedAfter, pageSize }) {
      calls.push(`list:${folderId}:${modifiedAfter ?? 'none'}:${pageSize}`);
      if (opts.fail === 'list') throw new Error('network: socket hang up');
      const all = (opts.files[folderId] ?? []).filter((f) => !modifiedAfter || f.modifiedTime > modifiedAfter).sort((a, b) => a.modifiedTime.localeCompare(b.modifiedTime));
      return { files: all.slice(0, pageSize), nextPageToken: all.length > pageSize ? 'more' : null };
    },
    async listIds(folderId) {
      calls.push(`ids:${folderId}`);
      return { ids: (opts.files[folderId] ?? []).map((f) => f.id), complete: true };
    },
    async getFile(id) {
      calls.push(`get:${id}`);
      if (opts.byId && id in opts.byId) return opts.byId[id];
      return Object.values(opts.files).flat().find((f) => f.id === id) ?? null;
    },
    async exportText(id) {
      calls.push(`export:${id}`);
      return opts.texts?.[id] ?? '';
    },
    async download(id, maxBytes, size) {
      calls.push(`download:${id}`);
      if (size != null && size > maxBytes) return null;
      return opts.bytes?.[id] ?? Buffer.alloc(0);
    },
  };
  return { client, calls };
}

const MEET = 'f-meet';
const base = () => ({
  folders: { 'Meet Recordings': MEET },
  files: {
    [MEET]: [
      file({ id: 'g-jul', name: 'Kenco x YardFlow - Discovery (Notes by Gemini)', mimeType: DOC, modifiedTime: '2026-07-16T19:05:00.000Z' }),
      file({ id: 'img', name: 'Screenshot.png', mimeType: 'image/png', modifiedTime: '2026-07-20T00:00:00.000Z' }),
      file({ id: 'rcpt', name: 'Receipt - Uber 2026-07-21.pdf', mimeType: 'application/pdf', modifiedTime: '2026-07-21T00:00:00.000Z' }),
      file({ id: 'deck', name: 'Inland26_Tactical_Dossier (image-only export)', mimeType: SLIDES, modifiedTime: '2026-07-22T00:00:00.000Z' }),
      file({ id: 'pdf', name: 'YardFlow_One_Pager.pdf', mimeType: 'application/pdf', modifiedTime: '2026-07-23T00:00:00.000Z', size: 1000 }),
      file({ id: 'g-aug', name: 'Kenco x YardFlow - Case studies (Notes by Gemini)', mimeType: DOC, modifiedTime: '2026-08-29T20:00:00.000Z' }),
    ],
  },
  texts: { 'g-jul': fx('kenco-discovery-2026-07-16.gemini.md'), deck: fx('inland26-tactical-dossier.pptx.txt'), 'g-aug': GEMINI_AUG },
});

describe('the Drive sync', () => {
  it('reads one bounded page from the first-run window, imports the readable files, names the unreadable and the skipped on the ledger; the unreadable file is NEVER a record; the cursor advances per folder and the next run continues', async () => {
    const db = ledgerDb({ accounts: ['Kenco'], aliases: [] });
    const fake = fakeClient(base());
    const r1 = await runDriveSync(db.client(), { now: NOW, client: fake.client, folders: ['Meet Recordings', 'Gemini Artifacts'], limit: 5, firstRunDays: 120 });
    expect(r1.ok, JSON.stringify(r1)).toBe(true);
    if (!r1.ok) return;
    expect(r1).toMatchObject({ status: 'partial', listed: 5, foldersMissing: ['Gemini Artifacts'], imported: { accepted: 2, duplicates: 0, revised: 0, invalid: 0 }, records: 2, more: true });
    expect(r1.readable.map((f) => f.id)).toEqual(['g-jul']);
    expect(r1.skipped.map((f) => [f.id, f.reason])).toEqual([['img', 'an image'], ['rcpt', 'a receipt by its name']]);
    expect(r1.unreadable.map((f) => [f.id, f.reason])).toEqual([
      ['deck', 'the document yields 11 characters of text, fewer than 40: image-only or empty; nothing usable was extracted'],
      ['pdf', 'PDF text extraction is not installed; the file is on record by its link'],
    ]);
    expect(fake.calls.filter((c) => c.startsWith('list:'))).toEqual([`list:${MEET}:2026-06-12T03:00:00.000Z:5`]);
    expect(fake.calls.some((c) => c === 'download:pdf'), 'a PDF is not downloaded when nothing can read it').toBe(false);
    // The rows: the Gemini note's two records and nothing for the deck or the PDF.
    const rows = db.store.gapSignal;
    expect(rows).toHaveLength(2);
    expect(rows.map((x) => x.metadata.import.producerItemId).sort()).toEqual(['g-jul', 'g-jul#transcript']);
    expect(rows.every((x) => x.metadata.import.producer === 'gemini_notes' && x.submitted_by === 'import:gemini_notes' && x.origin === 'report_import')).toBe(true);
    expect(rows.some((x) => /Inland26|One_Pager/.test(String(x.title)) || JSON.stringify(x.metadata).includes('"deck"')), 'an unreadable file is never recorded as extracted').toBe(false);
    expect(rows[0]).toMatchObject({ account_name: 'Kenco', account_hint: 'Kenco' });
    expect(rows[0].metadata.import.evidenceGroup).toBe('kenco|2026-07-16|discovery');
    // The ledger: the importer's gemini_notes row, then the sync's google_drive row with the state, the files and the cursor.
    const ledger = db.store.gapAuditEvent.filter((e) => e.kind === INTEL_IMPORTED_EVENT);
    expect(ledger.map((e) => e.subject_id)).toEqual(['gemini_notes', 'google_drive']);
    const sync = ledger[1].payload;
    expect(sync).toMatchObject({ cursor: 'Meet Recordings=2026-07-23T00:00:00.000Z', accepted: 2, producerState: { status: 'partial' }, files: { listed: 5, readable: 1, more: true } });
    expect(sync.producerState.detail).toContain('2 unreadable: Inland26_Tactical_Dossier (image-only export) (the document yields 11 characters');
    expect(sync.producerState.detail).toContain('folders not found: Gemini Artifacts');
    expect(sync.files.unreadable).toEqual([{ id: 'deck', name: 'Inland26_Tactical_Dossier (image-only export)', reason: expect.stringMatching(/image-only/) }, { id: 'pdf', name: 'YardFlow_One_Pager.pdf', reason: expect.stringMatching(/PDF text extraction is not installed/) }]);
    expect(sync.drive.folders[MEET]).toEqual({ name: 'Meet Recordings', newest: '2026-07-23T00:00:00.000Z', ids: ['g-jul', 'img', 'rcpt', 'deck', 'pdf'] });
    expect(ledger[0].payload.cursor, 'the importer row carries the same cursor').toBe('Meet Recordings=2026-07-23T00:00:00.000Z');
    expect(await storedDriveState(db.client())).toEqual({ folders: { [MEET]: { name: 'Meet Recordings', newest: '2026-07-23T00:00:00.000Z', ids: ['g-jul', 'img', 'rcpt', 'deck', 'pdf'] } } });

    // The next run continues after the cursor: the August note only.
    const fake2 = fakeClient(base());
    const r2 = await runDriveSync(db.client(), { now: new Date(NOW.getTime() + 6 * 3_600_000), client: fake2.client, folders: ['Meet Recordings'], limit: 5 });
    expect(r2.ok && r2).toMatchObject({ listed: 1, imported: { accepted: 2 }, more: false, removed: [] });
    expect(fake2.calls.filter((c) => c.startsWith('list:'))).toEqual([`list:${MEET}:2026-07-23T00:00:00.000Z:5`]);
    expect(db.store.gapSignal).toHaveLength(4);
    expect((await storedDriveState(db.client())).folders[MEET].newest).toBe('2026-08-29T20:00:00.000Z');

    // A third run finds nothing new; the same files forced through again (the state reset) are duplicates, never copies.
    const r3 = await runDriveSync(db.client(), { now: new Date(NOW.getTime() + 12 * 3_600_000), client: fakeClient(base()).client, folders: ['Meet Recordings'], limit: 5 });
    expect(r3.ok && r3).toMatchObject({ listed: 0, imported: { accepted: 0, duplicates: 0 } });
    const again = await runDriveSync(db.client(), { now: new Date(NOW.getTime() + 13 * 3_600_000), client: fakeClient(base()).client, folders: ['Meet Recordings'], limit: 10, state: { folders: {} }, firstRunDays: 120 });
    expect(again.ok && again).toMatchObject({ listed: 6, imported: { accepted: 0, duplicates: 4, revised: 0 } });
    expect(db.store.gapSignal, 'no copies').toHaveLength(4);
  });

  it('a file known from the last run that the folder no longer lists is removed with its fate; nothing is deleted in GAP', async () => {
    const db = ledgerDb({ accounts: ['Kenco'], aliases: [] });
    const data = base();
    const fake = fakeClient({ ...data, byId: { 'old-trashed': file({ id: 'old-trashed', name: 'Old', mimeType: DOC, modifiedTime: '2026-05-01T00:00:00.000Z', trashed: true }), 'old-gone': null } });
    const prior = { folders: { [MEET]: { name: 'Meet Recordings', newest: '2026-09-01T00:00:00.000Z', ids: ['g-jul', 'old-trashed', 'old-gone'] } } };
    const r = await runDriveSync(db.client(), { now: NOW, client: fake.client, folders: ['Meet Recordings'], limit: 5, state: prior });
    expect(r.ok && r).toMatchObject({ listed: 0, removed: [{ id: 'old-trashed', folder: 'Meet Recordings', fate: 'trashed' }, { id: 'old-gone', folder: 'Meet Recordings', fate: 'deleted_or_access_lost' }] });
    expect(fake.calls).toContain('get:old-trashed');
    const state = await storedDriveState(db.client());
    expect(state.folders[MEET].ids).toEqual(['g-jul']);
    expect(db.store.gapAuditEvent[0].payload.files.removed).toHaveLength(2);
    expect(typeof (db.client().gapSignal as { delete?: unknown }).delete, 'the sync has no delete to call').not.toBe('function');
  });

  it('NOT CONFIGURED is one ledger row naming the variables, said by producer status in words; a dry run writes nothing', async () => {
    const db = ledgerDb({ accounts: [], aliases: [] });
    const r = await runDriveSync(db.client(), { now: NOW, client: null, folders: ['Meet Recordings'] });
    expect(r).toMatchObject({ ok: false, status: 'not_configured', detail: 'not configured: set GAP_DRIVE_REFRESH_TOKEN (with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) or the delegation pair GAP_DRIVE_DWD_SA_JSON and GAP_DRIVE_USER_EMAIL' });
    expect(r.ledgerId).toBeTruthy();
    expect(db.store.gapAuditEvent[0]).toMatchObject({ kind: INTEL_IMPORTED_EVENT, subject_type: 'producer', subject_id: 'google_drive', payload: { producerState: { status: NOT_CONFIGURED_STATUS } } });
    const again = await runDriveSync(db.client(), { now: new Date(NOW.getTime() + 6 * 3_600_000), client: null, folders: ['Meet Recordings'] });
    expect(again.ledgerId, 'the state is said once, not every six hours').toBeNull();
    expect(db.store.gapAuditEvent).toHaveLength(1);
    const statuses = await loadProducerStatus(db.client(), new Date(NOW.getTime() + 86_400_000 * 30), { env: {} });
    const drive = statuses.find((s) => s.producer === 'google_drive')!;
    expect(drive.state).toBe('not_configured');
    expect(drive.line).toBe('Google Drive document: not configured: set GAP_DRIVE_REFRESH_TOKEN (or the delegation pair).');
    expect(producerStatusLine(statuses)).toContain('Google Drive document: not configured: set GAP_DRIVE_REFRESH_TOKEN (or the delegation pair)');
    expect(statuses.find((s) => s.producer === 'gemini_notes')!.state).toBe('never');
    const dry = await runDriveSync(db.client(), { now: NOW, client: fakeClient(base()).client, folders: ['Meet Recordings'], limit: 5, dryRun: true, state: { folders: {} }, firstRunDays: 120 });
    expect(dry.ok && dry).toMatchObject({ listed: 5, records: 2, ledgerId: null, imported: { accepted: 0 } });
    expect(dry.ok && dry.plan?.map((p) => p.producerItemId)).toEqual(['g-jul', 'g-jul#transcript']);
    expect(db.store.gapSignal).toHaveLength(0);
    expect(db.store.gapAuditEvent, 'a dry run adds no ledger row').toHaveLength(1);
  });

  it('a thrown client error is a failed ledger row that health reads; the cursor stays', async () => {
    const db = ledgerDb({ accounts: ['Kenco'], aliases: [] });
    const ok = await runDriveSync(db.client(), { now: NOW, client: fakeClient(base()).client, folders: ['Meet Recordings'], limit: 1, firstRunDays: 120 });
    expect(ok.ok && ok.imported.accepted).toBe(2);
    const before = await storedDriveState(db.client());
    expect(before.folders[MEET].newest).toBe('2026-07-16T19:05:00.000Z');
    const r = await runDriveSync(db.client(), { now: new Date(NOW.getTime() + 3_600_000), client: fakeClient({ ...base(), fail: 'list' }).client, folders: ['Meet Recordings'], limit: 5 });
    expect(r).toMatchObject({ ok: false, status: 'failed', error: 'network: socket hang up' });
    const last = db.store.gapAuditEvent[db.store.gapAuditEvent.length - 1];
    expect(last).toMatchObject({ subject_id: 'google_drive', payload: { producerState: { status: 'failed', detail: 'network: socket hang up' }, drive: before } });
    expect(await storedDriveState(db.client())).toEqual(before);
    const statuses = await loadProducerStatus(db.client(), new Date(NOW.getTime() + 2 * 3_600_000), { env: {} });
    expect(statuses.find((s) => s.producer === 'google_drive')).toMatchObject({ state: 'failed' });
    expect(statuses.find((s) => s.producer === 'google_drive')!.line).toContain('the last run failed (network: socket hang up)');
    const refused = await runDriveSync(db.client(), { now: new Date(NOW.getTime() + 2 * 3_600_000), client: fakeClient({ ...base(), fail: 'folders' }).client, folders: ['Meet Recordings'] });
    expect(refused).toMatchObject({ ok: false, status: 'failed', error: 'Drive refused the request (403)' });
  });
});
