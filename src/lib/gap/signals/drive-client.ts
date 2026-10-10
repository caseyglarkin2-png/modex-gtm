/**
 * THE DRIVE READER (the Google Workspace and Gemini extension, 2026-10-10). Server only; read only.
 *
 * Credentials, in order (the first configured wins; none is NOT CONFIGURED, said, never thrown):
 *   GAP_DRIVE_REFRESH_TOKEN with the app's GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (an OAuth refresh token minted
 *     with https://www.googleapis.com/auth/drive.readonly; the Gmail modules mint the same way)
 *   GAP_DRIVE_DWD_SA_JSON with GAP_DRIVE_USER_EMAIL (domain-wide delegation, the pattern of gap-sender.ts and
 *     email/google-delegated.ts, the Drive read-only scope)
 * Operations: resolve folder names to ids under the configured roots; list a folder's files modified after a cursor
 * (id, name, mime type, modified time, owners, link, parents, size, trashed); a folder's complete id set (for the
 * removal diff); one file's metadata (null on 404, trashed said); export a Doc, Sheet or Slides to text; download an
 * uploaded file's bytes under GAP_DRIVE_MAX_BYTES. Text extraction for the binaries is here too and pure: DOCX, XLSX
 * and PPTX are zip files of XML, read with Node's zlib through a minimal central-directory reader (STORE and DEFLATE
 * entries; no new dependency) and cut to text by stripping tags; PDF has no text library in this app, so a PDF is
 * unreadable with that reason and stays on record by its link (named debt). No credential is ever logged or returned.
 */
import { inflateRawSync } from 'node:zlib';
import { mintDelegatedAccessToken } from '@/lib/email/google-delegated';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
export const DRIVE_API = 'https://www.googleapis.com/drive/v3';
export const DRIVE_MAX_BYTES_DEFAULT = 8 * 1024 * 1024;
export const DRIVE_DEFAULT_FOLDERS = ['Meet Recordings', 'Gemini Artifacts', 'Yard Audits'];
/** The variable names health and the ledger name when nothing is configured. */
export const DRIVE_CREDENTIAL_VARS = 'GAP_DRIVE_REFRESH_TOKEN (with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) or the delegation pair GAP_DRIVE_DWD_SA_JSON and GAP_DRIVE_USER_EMAIL';

export const GOOGLE_DOC = 'application/vnd.google-apps.document';
export const GOOGLE_SHEET = 'application/vnd.google-apps.spreadsheet';
export const GOOGLE_SLIDES = 'application/vnd.google-apps.presentation';
export const GOOGLE_FOLDER = 'application/vnd.google-apps.folder';
export const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const MIME_PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const MIME_PDF = 'application/pdf';

export type DriveConfig =
  | { kind: 'refresh_token'; refreshToken: string; clientId: string; clientSecret: string }
  | { kind: 'delegated'; serviceAccountJson: string; userEmail: string };

/** The configuration the environment names, or null (NOT CONFIGURED). The values never leave this object. */
export function driveConfigFromEnv(env: Record<string, string | undefined> = process.env): DriveConfig | null {
  const refreshToken = env.GAP_DRIVE_REFRESH_TOKEN?.trim();
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (refreshToken && clientId && clientSecret) return { kind: 'refresh_token', refreshToken, clientId, clientSecret };
  const sa = env.GAP_DRIVE_DWD_SA_JSON?.trim();
  const userEmail = env.GAP_DRIVE_USER_EMAIL?.trim().toLowerCase();
  if (sa && userEmail) return { kind: 'delegated', serviceAccountJson: sa, userEmail };
  return null;
}

/** The folders to read: GAP_DRIVE_FOLDERS (comma-separated names or ids) or the inventory's defaults. */
export function driveFoldersFromEnv(env: Record<string, string | undefined> = process.env): string[] {
  const raw = env.GAP_DRIVE_FOLDERS?.trim();
  const list = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : DRIVE_DEFAULT_FOLDERS;
  return [...new Set(list)];
}

export function driveMaxBytes(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.GAP_DRIVE_MAX_BYTES);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DRIVE_MAX_BYTES_DEFAULT;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  owners: string[];
  webViewLink: string | null;
  parents: string[];
  size: number | null;
  trashed: boolean;
}

export interface DriveClient {
  /** Folder names to their ids (a name that is already an id passes through); a name not found is absent. */
  resolveFolders(namesOrIds: string[]): Promise<Array<{ id: string; name: string }>>;
  /** Files in one folder modified after the cursor, oldest first, one page. */
  listFiles(opts: { folderId: string; modifiedAfter: string | null; pageSize: number; pageToken?: string | null }): Promise<{ files: DriveFile[]; nextPageToken: string | null }>;
  /** The folder's live file ids (not trashed), bounded; `complete` says whether the bound was reached. */
  listIds(folderId: string, max: number): Promise<{ ids: string[]; complete: boolean }>;
  /** One file's metadata; null when Drive answers 404 (deleted, or access lost). */
  getFile(id: string): Promise<DriveFile | null>;
  /** A Doc, Sheet or Slides exported as text (text/plain, text/csv, text/plain). */
  exportText(id: string, mimeType: string): Promise<string>;
  /** An uploaded file's bytes; null when it is larger than the bound (nothing downloaded). */
  download(id: string, maxBytes: number, size: number | null): Promise<Buffer | null>;
}

export class DriveApiError extends Error {
  constructor(message: string, readonly status: number, readonly kind: 'auth' | 'not_found' | 'network' | 'shape') {
    super(message);
  }
}

const FILE_FIELDS = 'id,name,mimeType,modifiedTime,owners(emailAddress),webViewLink,parents,size,trashed';
const toFile = (f: Record<string, unknown>): DriveFile => ({
  id: String(f.id ?? ''),
  name: String(f.name ?? ''),
  mimeType: String(f.mimeType ?? ''),
  modifiedTime: String(f.modifiedTime ?? ''),
  owners: Array.isArray(f.owners) ? f.owners.map((o) => String((o as { emailAddress?: unknown })?.emailAddress ?? '')).filter(Boolean) : [],
  webViewLink: typeof f.webViewLink === 'string' ? f.webViewLink : null,
  parents: Array.isArray(f.parents) ? f.parents.map(String) : [],
  size: f.size != null && Number.isFinite(Number(f.size)) ? Number(f.size) : null,
  trashed: f.trashed === true,
});
const q = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const looksLikeId = (s: string) => /^[A-Za-z0-9_-]{20,}$/.test(s);

/** The access token for the configuration: the refresh-token grant (as gmail-inbox.ts) or the delegated JWT grant. */
export async function driveAccessToken(config: DriveConfig, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (config.kind === 'delegated') return mintDelegatedAccessToken(config.serviceAccountJson, config.userEmail, DRIVE_SCOPE, fetchImpl);
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: config.refreshToken, grant_type: 'refresh_token' }),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) throw new DriveApiError(`the Drive token was refused: ${data.error_description || data.error || res.status}`, res.status, 'auth');
  return data.access_token;
}

/** The HTTP Drive client; `fetchImpl` and `token` are injectable so no test touches the network. */
export function createDriveClient(config: DriveConfig, opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}): DriveClient {
  const f = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  let token: string | null = null;
  const auth = async () => (token ??= await driveAccessToken(config, f));
  const call = async (path: string, params: Record<string, string>, accept: 'json' | 'text' | 'bytes', maxBytes?: number): Promise<unknown> => {
    const url = new URL(`${DRIVE_API}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('supportsAllDrives', 'true');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await f(url.toString(), { headers: { Authorization: `Bearer ${await auth()}`, Accept: accept === 'json' ? 'application/json' : '*/*' }, signal: controller.signal });
    } catch (e) {
      throw new DriveApiError(`network: ${e instanceof Error ? e.message : String(e)}`, 0, 'network');
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 401 || res.status === 403) throw new DriveApiError(`Drive refused the request (${res.status})`, res.status, 'auth');
    if (res.status === 404) throw new DriveApiError('Drive answered 404', 404, 'not_found');
    if (!res.ok) throw new DriveApiError(`Drive answered ${res.status}`, res.status, 'network');
    if (accept === 'json') return res.json().catch(() => { throw new DriveApiError('Drive answered without JSON', res.status, 'shape'); });
    if (accept === 'text') return res.text();
    const bytes = Buffer.from(await res.arrayBuffer());
    if (maxBytes != null && bytes.length > maxBytes) return null;
    return bytes;
  };
  return {
    async resolveFolders(namesOrIds) {
      const out: Array<{ id: string; name: string }> = [];
      const names = namesOrIds.filter((n) => !looksLikeId(n));
      for (const id of namesOrIds.filter(looksLikeId)) out.push({ id, name: id });
      if (names.length) {
        const query = `mimeType = '${GOOGLE_FOLDER}' and trashed = false and (${names.map((n) => `name = '${q(n)}'`).join(' or ')})`;
        const body = (await call('/files', { q: query, fields: 'files(id,name)', pageSize: '50', includeItemsFromAllDrives: 'true' }, 'json')) as { files?: Array<{ id: string; name: string }> };
        for (const name of names) {
          const hit = (body.files ?? []).find((x) => x.name === name);
          if (hit) out.push({ id: hit.id, name: hit.name });
        }
      }
      return out;
    },
    async listFiles({ folderId, modifiedAfter, pageSize, pageToken }) {
      const query = `'${q(folderId)}' in parents and trashed = false${modifiedAfter ? ` and modifiedTime > '${modifiedAfter}'` : ''}`;
      const params: Record<string, string> = { q: query, fields: `nextPageToken,files(${FILE_FIELDS})`, orderBy: 'modifiedTime', pageSize: String(pageSize), includeItemsFromAllDrives: 'true' };
      if (pageToken) params.pageToken = pageToken;
      const body = (await call('/files', params, 'json')) as { files?: Array<Record<string, unknown>>; nextPageToken?: string };
      return { files: (body.files ?? []).map(toFile), nextPageToken: body.nextPageToken ?? null };
    },
    async listIds(folderId, max) {
      const ids: string[] = [];
      let pageToken: string | null = null;
      do {
        const params: Record<string, string> = { q: `'${q(folderId)}' in parents and trashed = false`, fields: 'nextPageToken,files(id)', pageSize: String(Math.min(1000, max)), includeItemsFromAllDrives: 'true' };
        if (pageToken) params.pageToken = pageToken;
        const body = (await call('/files', params, 'json')) as { files?: Array<{ id: string }>; nextPageToken?: string };
        for (const x of body.files ?? []) ids.push(x.id);
        pageToken = body.nextPageToken ?? null;
      } while (pageToken && ids.length < max);
      return { ids: ids.slice(0, max), complete: !pageToken && ids.length <= max };
    },
    async getFile(id) {
      try {
        return toFile((await call(`/files/${encodeURIComponent(id)}`, { fields: FILE_FIELDS }, 'json')) as Record<string, unknown>);
      } catch (e) {
        if (e instanceof DriveApiError && e.kind === 'not_found') return null;
        throw e;
      }
    },
    async exportText(id, mimeType) {
      const target = mimeType === GOOGLE_SHEET ? 'text/csv' : 'text/plain';
      return (await call(`/files/${encodeURIComponent(id)}/export`, { mimeType: target }, 'text')) as string;
    },
    async download(id, maxBytes, size) {
      if (size != null && size > maxBytes) return null;
      return (await call(`/files/${encodeURIComponent(id)}`, { alt: 'media' }, 'bytes', maxBytes)) as Buffer | null;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the zip reader

export interface ZipEntry {
  name: string;
  data: Buffer;
}

/**
 * A minimal zip reader over Node's zlib: the end-of-central-directory record, the central directory, each entry's
 * local header; STORE (0) and DEFLATE (8) only; any other method or a malformed structure throws. Enough for the
 * Office formats, which are plain zips of XML.
 */
export function readZipEntries(buf: Buffer, wanted?: (name: string) => boolean): ZipEntry[] {
  const SIG_EOCD = 0x06054b50;
  const SIG_CEN = 0x02014b50;
  const SIG_LOC = 0x04034b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_535); i -= 1) {
    if (buf.readUInt32LE(i) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file (no end of central directory)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out: ZipEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== SIG_CEN) throw new Error('malformed zip (central directory)');
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
    if (wanted && !wanted(name)) continue;
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== SIG_LOC) throw new Error(`malformed zip (local header of ${name})`);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + compressed);
    if (method === 0) out.push({ name, data: Buffer.from(raw) });
    else if (method === 8) out.push({ name, data: inflateRawSync(raw) });
    else throw new Error(`zip entry ${name} uses compression method ${method}, which this reader does not support`);
  }
  return out;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeXml = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
  if (e[0] === '#') { const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(code) ? String.fromCodePoint(code) : m; }
  return ENTITIES[e.toLowerCase()] ?? m;
});
const innerText = (xml: string, tag: string): string[] => [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1]);
const stripTags = (xml: string) => decodeXml(xml.replace(/<[^>]+>/g, ''));

/** word/document.xml: one line per paragraph; a heading style becomes a markdown heading so the document parser sees sections. */
export function textOfDocx(buf: Buffer): string {
  const doc = readZipEntries(buf, (n) => n === 'word/document.xml')[0];
  if (!doc) throw new Error('DOCX without word/document.xml');
  const xml = doc.data.toString('utf8');
  const lines: string[] = [];
  for (const p of innerText(xml, 'w:p')) {
    const text = innerText(p, 'w:t').map(stripTags).join('').trim();
    if (!text) { lines.push(''); continue; }
    const style = /<w:pStyle\s+w:val="([^"]+)"/.exec(p)?.[1] ?? '';
    const level = /^heading(\d)$/i.exec(style)?.[1] ?? (/^title$/i.test(style) ? '1' : null);
    lines.push(level ? `${'#'.repeat(Math.min(6, Number(level)))} ${text}` : text);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** xl/workbook.xml, xl/sharedStrings.xml, xl/worksheets/sheetN.xml: one "## <sheet name>" block per sheet, CSV rows. */
export function textOfXlsx(buf: Buffer): string {
  const entries = readZipEntries(buf, (n) => n === 'xl/workbook.xml' || n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const shared = (() => {
    const e = entries.find((x) => x.name === 'xl/sharedStrings.xml');
    return e ? innerText(e.data.toString('utf8'), 'si').map((si) => innerText(si, 't').map(stripTags).join('')) : [];
  })();
  const names = (() => {
    const e = entries.find((x) => x.name === 'xl/workbook.xml');
    return e ? [...e.data.toString('utf8').matchAll(/<sheet\s[^>]*name="([^"]*)"/g)].map((m) => decodeXml(m[1])) : [];
  })();
  const sheets = entries.filter((x) => /^xl\/worksheets\/sheet\d+\.xml$/.test(x.name)).sort((a, b) => Number(/sheet(\d+)/.exec(a.name)![1]) - Number(/sheet(\d+)/.exec(b.name)![1]));
  const csv = (cell: string) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
  const blocks: string[] = [];
  sheets.forEach((s, i) => {
    const xml = s.data.toString('utf8');
    const rows: string[] = [];
    for (const row of innerText(xml, 'row')) {
      const cells: string[] = [];
      for (const m of row.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = m[1];
        const body = m[2] ?? '';
        const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? '';
        const col = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1];
        const v = innerText(body, 'v')[0];
        let value = '';
        if (type === 's') value = shared[Number(v)] ?? '';
        else if (type === 'inlineStr') value = innerText(body, 't').map(stripTags).join('');
        else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
        else value = v != null ? stripTags(v) : '';
        if (col) { const idx = col.split('').reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1; while (cells.length < idx) cells.push(''); cells[idx] = value; }
        else cells.push(value);
      }
      if (cells.some((c) => c)) rows.push(cells.map(csv).join(','));
    }
    if (rows.length) blocks.push(`## ${names[i] ?? `Sheet ${i + 1}`}\n${rows.join('\n')}`);
  });
  return blocks.join('\n');
}

/** ppt/slides/slideN.xml in order: each slide's paragraphs, slides separated by a `-----` line (the slides parser's separator). */
export function textOfPptx(buf: Buffer): string {
  const slides = readZipEntries(buf, (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(/slide(\d+)/.exec(a.name)![1]) - Number(/slide(\d+)/.exec(b.name)![1]));
  const out: string[] = [];
  for (const s of slides) {
    const xml = s.data.toString('utf8');
    const paragraphs = innerText(xml, 'a:p').map((p) => innerText(p, 'a:t').map(stripTags).join('').trim()).filter(Boolean);
    out.push(paragraphs.join('\n'));
  }
  return out.join('\n-----\n');
}

export const PDF_UNREADABLE_REASON = 'PDF text extraction is not installed; the file is on record by its link';

export interface Extraction {
  text: string | null;
  unreadableReason: string | null;
}

/** An uploaded file's bytes to text by its mime type and name; a format this app cannot read says so. */
export function extractDriveText(file: Pick<DriveFile, 'name' | 'mimeType'>, bytes: Buffer): Extraction {
  const lower = file.name.toLowerCase();
  try {
    if (file.mimeType === MIME_PDF || lower.endsWith('.pdf')) return { text: null, unreadableReason: PDF_UNREADABLE_REASON };
    if (file.mimeType === MIME_DOCX || lower.endsWith('.docx')) return { text: textOfDocx(bytes), unreadableReason: null };
    if (file.mimeType === MIME_XLSX || lower.endsWith('.xlsx')) return { text: textOfXlsx(bytes), unreadableReason: null };
    if (file.mimeType === MIME_PPTX || lower.endsWith('.pptx')) return { text: textOfPptx(bytes), unreadableReason: null };
    if (file.mimeType.startsWith('text/') || /\.(md|markdown|txt|csv)$/.test(lower)) return { text: bytes.toString('utf8'), unreadableReason: null };
    return { text: null, unreadableReason: `no text extractor for ${file.mimeType}` };
  } catch (e) {
    return { text: null, unreadableReason: `the file could not be read as ${file.mimeType}: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}` };
  }
}
