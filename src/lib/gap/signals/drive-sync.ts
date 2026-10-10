/**
 * THE DRIVE SYNC (the Google Workspace and Gemini extension, 2026-10-10). Server only.
 *
 * Incremental by the ledger: the newest `intelligence.imported` row for producer `google_drive` that carries a
 * `drive` state holds, per folder, the newest modified time imported and the file ids known there. Each run reads
 * one bounded page of files modified after that time (the first run bounded to GAP_DRIVE_FIRST_RUN_DAYS of modified
 * time), oldest first so the cursor advances monotonically; each file is skipped by type or name (images, videos,
 * receipts; said), read (export or download under the byte bound), parsed and mapped; the readable ones become
 * records through `importIntelligenceBatch` (producer google_drive or gemini_notes); the unreadable ones are named on
 * the ledger row with their reason and make NO record. A file known from the last run that is no longer listed is
 * `removed` on the ledger row (trashed, deleted or access lost, when one metadata read can tell); nothing is deleted
 * in GAP. NOT CONFIGURED is a ledger row with status `not_configured` naming the variables (once per state, never
 * silent); a client failure is a `failed` row (health shows it) and the cursor stays. Nothing here sends mail,
 * writes HubSpot, enrolls anything, calls Slack or changes Drive; a document's words are data, never instructions.
 */
import { DRIVE_CREDENTIAL_VARS, GOOGLE_DOC, GOOGLE_SHEET, GOOGLE_SLIDES, MIME_PDF, extractDriveText, type DriveClient, type DriveFile } from './drive-client';
import { parseDriveText } from './drive-parsers';
import { DRIVE_PRODUCER, GEMINI_PRODUCER, driveRecordsOf, type DriveFileMeta } from './drive-records';
import { importIntelligenceBatch } from './intelligence-import';
import { INTEL_IMPORTED_EVENT, type IntelligenceRecordInput } from './intelligence-record';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DRIVE_FILES_PER_RUN = 25;
export const DRIVE_FIRST_RUN_DAYS_DEFAULT = 120;
/** Known ids kept per folder on the ledger (the removal diff's set); beyond it the oldest are forgotten, said. */
export const DRIVE_KNOWN_IDS_MAX = 2_000;
/** Removed files whose fate (trashed, deleted or access lost) is read with one metadata call each. */
export const DRIVE_REMOVAL_LOOKUPS = 10;
export const NOT_CONFIGURED_STATUS = 'not_configured';

const SKIP_BY_TYPE: Array<{ test: (f: DriveFile) => boolean; reason: string }> = [
  { test: (f) => f.mimeType.startsWith('image/'), reason: 'an image' },
  { test: (f) => f.mimeType.startsWith('video/') || f.mimeType.startsWith('audio/'), reason: 'a recording (video or audio)' },
  { test: (f) => f.mimeType === 'application/vnd.google-apps.folder', reason: 'a folder' },
  { test: (f) => f.mimeType === 'application/vnd.google-apps.shortcut', reason: 'a shortcut' },
  { test: (f) => /^application\/vnd\.google-apps\.(form|map|site|jam|drawing|script|fusiontable)$/.test(f.mimeType), reason: 'a Google app type without a text export' },
  { test: (f) => /^application\/(zip|x-zip-compressed|gzip|x-tar|x-7z-compressed)$/.test(f.mimeType), reason: 'an archive' },
  { test: (f) => /\b(receipt|invoice|statement|order confirmation)\b/i.test(f.name), reason: 'a receipt by its name' },
  { test: (f) => f.mimeType === 'application/vnd.google-apps.unknown' || /gemini.*canvas|canvas.*gemini/i.test(f.name), reason: 'a Gemini canvas (needs one export step: Share, Export to Docs)' },
];

export interface DriveFolderState { name: string; newest: string | null; ids: string[] }
export interface DriveState { folders: Record<string, DriveFolderState> }

export interface DriveSyncInput {
  now: Date;
  /** null means NOT CONFIGURED: the ledger says so and nothing is read. */
  client: DriveClient | null;
  /** Folder names or ids; defaults to the inventory's folders. */
  folders: string[];
  limit?: number;
  firstRunDays?: number;
  maxBytes?: number;
  actor?: string;
  /** A dry run parses and reports; it imports nothing and writes no ledger row. */
  dryRun?: boolean;
  /** Tests override the stored state; the default reads the ledger. */
  state?: DriveState | null;
}

export interface DriveSyncFileReport { id: string; name: string; folder: string; mimeType: string; modifiedTime: string }
export type DriveSyncResult =
  | {
      ok: true;
      status: 'ok' | 'partial';
      runId: string;
      folders: Array<{ id: string; name: string; newest: string | null; known: number; more: boolean }>;
      foldersMissing: string[];
      listed: number;
      imported: { accepted: number; duplicates: number; revised: number; invalid: number };
      records: number;
      readable: DriveSyncFileReport[];
      unreadable: Array<DriveSyncFileReport & { reason: string }>;
      skipped: Array<DriveSyncFileReport & { reason: string }>;
      removed: Array<{ id: string; folder: string; fate: 'trashed' | 'deleted_or_access_lost' | 'unknown' }>;
      more: boolean;
      ledgerId: string | null;
      /** A dry run: the records that would be imported, for the script to print. */
      plan?: IntelligenceRecordInput[];
    }
  | { ok: false; status: 'not_configured'; detail: string; ledgerId: string | null }
  | { ok: false; status: 'failed'; error: string; ledgerId: string | null };

const dayStart = (d: Date) => new Date(d.getTime()).toISOString();

/** The stored state from the newest google_drive ledger row that carries one; empty for the first run. */
export async function storedDriveState(prisma: PrismaLike): Promise<DriveState> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return { folders: {} };
  const rows: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT, subject_type: 'producer', subject_id: DRIVE_PRODUCER }, orderBy: [{ created_at: 'desc' }], take: 20, select: { payload: true } }).catch(() => []);
  for (const r of rows) {
    const p = r.payload && typeof r.payload === 'object' ? (r.payload as Record<string, unknown>) : null;
    const drive = p?.drive && typeof p.drive === 'object' ? (p.drive as DriveState) : null;
    if (drive && drive.folders && typeof drive.folders === 'object') return { folders: drive.folders };
  }
  return { folders: {} };
}

/** The newest not-configured row, so the state is said once and the ledger does not fill with the same sentence. */
async function lastRowWasNotConfigured(prisma: PrismaLike): Promise<boolean> {
  if (typeof prisma?.gapAuditEvent?.findFirst !== 'function') return false;
  const row: { payload: unknown } | null = await prisma.gapAuditEvent.findFirst({ where: { kind: INTEL_IMPORTED_EVENT, subject_type: 'producer', subject_id: DRIVE_PRODUCER }, orderBy: [{ created_at: 'desc' }], select: { payload: true } }).catch(() => null);
  const ps = (row?.payload as { producerState?: { status?: unknown } } | null)?.producerState;
  return ps?.status === NOT_CONFIGURED_STATUS;
}

async function ledger(prisma: PrismaLike, actor: string, payload: Record<string, unknown>): Promise<string | null> {
  if (typeof prisma?.gapAuditEvent?.create !== 'function') return null;
  const row: { id: string } | null = await prisma.gapAuditEvent.create({ data: { kind: INTEL_IMPORTED_EVENT, actor, subject_type: 'producer', subject_id: DRIVE_PRODUCER, payload }, select: { id: true } }).catch(() => null);
  return row?.id ?? null;
}

/** The file's text: a Google type is exported, an uploaded file is downloaded and cut; the reason when neither can be. */
async function readText(client: DriveClient, file: DriveFile, maxBytes: number): Promise<{ text: string | null; unreadableReason: string | null }> {
  if (file.mimeType === GOOGLE_DOC || file.mimeType === GOOGLE_SHEET || file.mimeType === GOOGLE_SLIDES) return { text: await client.exportText(file.id, file.mimeType), unreadableReason: null };
  if (file.mimeType === MIME_PDF) return extractDriveText(file, Buffer.alloc(0));
  const bytes = await client.download(file.id, maxBytes, file.size);
  if (!bytes) return { text: null, unreadableReason: `larger than the ${Math.round(maxBytes / (1024 * 1024))} MB bound (${file.size ?? 'unknown'} bytes); not downloaded` };
  return extractDriveText(file, bytes);
}

export async function runDriveSync(prisma: PrismaLike, input: DriveSyncInput): Promise<DriveSyncResult> {
  const actor = input.actor ?? 'cron:gap-drive-sync';
  const now = input.now;
  const runId = `drive-sync:${now.toISOString()}`;
  if (!input.client) {
    const detail = `not configured: set ${DRIVE_CREDENTIAL_VARS}`;
    if (input.dryRun) return { ok: false, status: 'not_configured', detail, ledgerId: null };
    const already = await lastRowWasNotConfigured(prisma);
    const ledgerId = already ? null : await ledger(prisma, actor, { runId, runIds: [runId], cursor: null, accepted: 0, duplicates: 0, revised: 0, invalid: 0, reportedOnFrom: null, reportedOnTo: null, producerState: { status: NOT_CONFIGURED_STATUS, detail }, at: now.toISOString() });
    return { ok: false, status: 'not_configured', detail, ledgerId };
  }
  const client = input.client;
  const limit = Math.max(1, input.limit ?? DRIVE_FILES_PER_RUN);
  const maxBytes = input.maxBytes ?? 8 * 1024 * 1024;
  const firstRunAfter = dayStart(new Date(now.getTime() - (input.firstRunDays ?? DRIVE_FIRST_RUN_DAYS_DEFAULT) * 86_400_000));
  const state: DriveState = input.state ?? (await storedDriveState(prisma));
  const counts = { accepted: 0, duplicates: 0, revised: 0, invalid: 0 };
  const readable: DriveSyncFileReport[] = [];
  const unreadable: Array<DriveSyncFileReport & { reason: string }> = [];
  const skipped: Array<DriveSyncFileReport & { reason: string }> = [];
  const removed: Array<{ id: string; folder: string; fate: 'trashed' | 'deleted_or_access_lost' | 'unknown' }> = [];
  const folderReports: Array<{ id: string; name: string; newest: string | null; known: number; more: boolean }> = [];
  const nextState: DriveState = { folders: {} };
  let listed = 0;
  let more = false;
  const extractedAt = now.toISOString();
  try {
    const resolved = await client.resolveFolders(input.folders);
    const foldersMissing = input.folders.filter((f) => !resolved.some((r) => r.id === f || r.name === f));
    let budget = limit;
    const byProducer: Record<string, IntelligenceRecordInput[]> = { [DRIVE_PRODUCER]: [], [GEMINI_PRODUCER]: [] };
    for (const folder of resolved) {
      const prev = state.folders[folder.id] ?? { name: folder.name, newest: null, ids: [] };
      const known = new Set(prev.ids);
      let newest = prev.newest;
      let folderMore = false;
      if (budget > 0) {
        const page = await client.listFiles({ folderId: folder.id, modifiedAfter: prev.newest ?? firstRunAfter, pageSize: budget });
        folderMore = !!page.nextPageToken;
        for (const file of page.files) {
          listed += 1;
          budget -= 1;
          const report: DriveSyncFileReport = { id: file.id, name: file.name, folder: folder.name, mimeType: file.mimeType, modifiedTime: file.modifiedTime };
          known.add(file.id);
          if (!newest || file.modifiedTime > newest) newest = file.modifiedTime;
          const skip = SKIP_BY_TYPE.find((s) => s.test(file));
          if (skip) { skipped.push({ ...report, reason: skip.reason }); continue; }
          let text: { text: string | null; unreadableReason: string | null };
          try {
            text = await readText(client, file, maxBytes);
          } catch (e) {
            unreadable.push({ ...report, reason: `the file could not be read: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}` });
            continue;
          }
          const parse = parseDriveText({ mimeType: file.mimeType, name: file.name, text: text.text, unreadableReason: text.unreadableReason });
          if (!parse.readable) { unreadable.push({ ...report, reason: parse.unreadableReason ?? 'unreadable' }); continue; }
          const meta: DriveFileMeta = { id: file.id, name: file.name, mimeType: file.mimeType, modifiedTime: file.modifiedTime, owners: file.owners, webViewLink: file.webViewLink, folderName: folder.name, size: file.size };
          const records = driveRecordsOf(meta, parse, { extractedAt, runId });
          if (!records.length) { unreadable.push({ ...report, reason: 'the parse yielded no passage' }); continue; }
          readable.push(report);
          for (const r of records) (byProducer[r.producer] ??= []).push(r);
        }
      } else folderMore = true;
      // The removal diff: a file known from before that the folder's live listing no longer holds.
      if (prev.ids.length) {
        const live = await client.listIds(folder.id, DRIVE_KNOWN_IDS_MAX);
        if (live.complete) {
          const liveSet = new Set(live.ids);
          let lookups = 0;
          for (const id of prev.ids) {
            if (liveSet.has(id)) continue;
            known.delete(id);
            let fate: 'trashed' | 'deleted_or_access_lost' | 'unknown' = 'unknown';
            if (lookups < DRIVE_REMOVAL_LOOKUPS) {
              lookups += 1;
              const f = await client.getFile(id).catch(() => undefined);
              fate = f === null ? 'deleted_or_access_lost' : f?.trashed ? 'trashed' : f === undefined ? 'unknown' : 'deleted_or_access_lost';
            }
            removed.push({ id, folder: folder.name, fate });
          }
        }
      }
      const ids = [...known].slice(-DRIVE_KNOWN_IDS_MAX);
      nextState.folders[folder.id] = { name: folder.name, newest, ids };
      folderReports.push({ id: folder.id, name: folder.name, newest, known: ids.length, more: folderMore });
      more = more || folderMore;
    }
    const cursor = folderReports.map((f) => `${f.name}=${f.newest ?? 'start'}`).join('; ') || null;
    const all = [...byProducer[DRIVE_PRODUCER], ...byProducer[GEMINI_PRODUCER]];
    if (input.dryRun) {
      return { ok: true, status: unreadable.length ? 'partial' : 'ok', runId, folders: folderReports, foldersMissing, listed, imported: counts, records: all.length, readable, unreadable, skipped, removed, more, ledgerId: null, plan: all };
    }
    for (const producer of [DRIVE_PRODUCER, GEMINI_PRODUCER]) {
      const records = byProducer[producer];
      if (!records.length) continue;
      const r = await importIntelligenceBatch(prisma, { records, actor, now, producer, runId, cursor, producerState: { status: 'ok' } });
      counts.accepted += r.accepted;
      counts.duplicates += r.duplicates;
      counts.revised += r.revised;
      counts.invalid += r.invalid;
    }
    const status: 'ok' | 'partial' = unreadable.length || foldersMissing.length ? 'partial' : 'ok';
    const detail = [
      unreadable.length ? `${unreadable.length} unreadable: ${unreadable.slice(0, 5).map((u) => `${u.name} (${u.reason})`).join('; ')}` : null,
      foldersMissing.length ? `folders not found: ${foldersMissing.join(', ')}` : null,
    ].filter(Boolean).join('. ') || null;
    const reportedOn = all.map((r) => r.reportedOn).sort();
    const ledgerId = await ledger(prisma, actor, {
      runId, runIds: [runId], cursor, accepted: counts.accepted, duplicates: counts.duplicates, revised: counts.revised, invalid: counts.invalid,
      reportedOnFrom: reportedOn[0] ?? null, reportedOnTo: reportedOn[reportedOn.length - 1] ?? null,
      producerState: { status, detail }, at: now.toISOString(),
      drive: nextState,
      files: { listed, readable: readable.length, unreadable: unreadable.map((u) => ({ id: u.id, name: u.name, reason: u.reason })), skipped: skipped.map((s) => ({ id: s.id, name: s.name, reason: s.reason })), removed, more },
    });
    return { ok: true, status, runId, folders: folderReports, foldersMissing, listed, imported: counts, records: all.length, readable, unreadable, skipped, removed, more, ledgerId };
  } catch (e) {
    const error = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    const ledgerId = input.dryRun ? null : await ledger(prisma, actor, { runId, runIds: [runId], cursor: null, accepted: counts.accepted, duplicates: counts.duplicates, revised: counts.revised, invalid: counts.invalid, reportedOnFrom: null, reportedOnTo: null, producerState: { status: 'failed', detail: error }, at: now.toISOString(), drive: state });
    return { ok: false, status: 'failed', error, ledgerId };
  }
}
