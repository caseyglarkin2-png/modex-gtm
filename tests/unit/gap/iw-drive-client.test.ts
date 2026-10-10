// @vitest-environment node
/**
 * The Drive reader (the Google Workspace and Gemini extension, 2026-10-10). Pinned: the configuration from the
 * environment (the refresh token first, then the delegation pair, else NOT CONFIGURED as null); the zip reader over
 * Node's zlib on a fixture written here by the same minimal writer (STORE and DEFLATE), and the DOCX, XLSX and PPTX
 * text it yields; a PDF is unreadable with the exact reason; the HTTP client's folder query, listing, export, 404
 * as null, a refused token as an auth error; the credential travels only in the Authorization header.
 */
import { crc32, deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { DRIVE_DEFAULT_FOLDERS, DriveApiError, PDF_UNREADABLE_REASON, createDriveClient, driveConfigFromEnv, driveFoldersFromEnv, driveMaxBytes, extractDriveText, readZipEntries, textOfDocx, textOfPptx, textOfXlsx } from '@/lib/gap/signals/drive-client';

/** A minimal zip writer: local headers, central directory, end record; `deflate` chooses the method per entry. */
function zip(entries: Array<{ name: string; text: string; deflate?: boolean }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const raw = Buffer.from(e.text, 'utf8');
    const data = e.deflate ? deflateRawSync(raw) : raw;
    const name = Buffer.from(e.name, 'utf8');
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(e.deflate ? 8 : 0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(e.deflate ? 8 : 0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const DOCX_XML = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Yard audit</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">The gate was </w:t></w:r><w:r><w:t>unmanned &amp; open</w:t></w:r></w:p><w:p/><w:p><w:r><w:t>Second paragraph.</w:t></w:r></w:p></w:body></w:document>`;
const WORKBOOK = `<workbook><sheets><sheet name="Offer" sheetId="1" r:id="rId1"/><sheet name="Build &amp; Rollout" sheetId="2" r:id="rId2"/></sheets></workbook>`;
const SHARED = `<sst><si><t>Site</t></si><si><r><t>Talley</t></r><r><t>rand</t></r></si><si><t>Pilot</t></si></sst>`;
const SHEET1 = `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Price</t></is></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2"><v>25000</v></c></row><row r="3"/></sheetData></worksheet>`;
const SHEET2 = `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>2</v></c><c r="B1" t="b"><v>1</v></c></row></sheetData></worksheet>`;
const SLIDE = (n: number) => `<p:sld><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide ${n} title</a:t></a:r></a:p><a:p><a:r><a:t>Point </a:t></a:r><a:r><a:t>${n}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;

describe('the Drive reader', () => {
  it('the configuration: the refresh token with the app client first, then the delegation pair, else null (not configured)', () => {
    expect(driveConfigFromEnv({})).toBeNull();
    expect(driveConfigFromEnv({ GAP_DRIVE_REFRESH_TOKEN: 'r' }), 'a refresh token without the client is not a configuration').toBeNull();
    expect(driveConfigFromEnv({ GAP_DRIVE_REFRESH_TOKEN: 'r', GOOGLE_CLIENT_ID: 'c', GOOGLE_CLIENT_SECRET: 's' })).toEqual({ kind: 'refresh_token', refreshToken: 'r', clientId: 'c', clientSecret: 's' });
    expect(driveConfigFromEnv({ GAP_DRIVE_DWD_SA_JSON: '{}', GAP_DRIVE_USER_EMAIL: 'Casey@YardFlow.ai' })).toEqual({ kind: 'delegated', serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai' });
    expect(driveConfigFromEnv({ GAP_DRIVE_DWD_SA_JSON: '{}' })).toBeNull();
    expect(driveFoldersFromEnv({})).toEqual(DRIVE_DEFAULT_FOLDERS);
    expect(driveFoldersFromEnv({ GAP_DRIVE_FOLDERS: 'Meet Recordings, 1AbCdEfGhIjKlMnOpQrStUvWxYz0123 ,Meet Recordings' })).toEqual(['Meet Recordings', '1AbCdEfGhIjKlMnOpQrStUvWxYz0123']);
    expect(driveMaxBytes({})).toBe(8 * 1024 * 1024);
    expect(driveMaxBytes({ GAP_DRIVE_MAX_BYTES: '1024' })).toBe(1024);
  });

  it('the zip reader: STORE and DEFLATE entries, the wanted filter, a malformed buffer refused', () => {
    const buf = zip([{ name: 'a.txt', text: 'stored words' }, { name: 'dir/b.txt', text: 'deflated words '.repeat(50), deflate: true }]);
    const all = readZipEntries(buf);
    expect(all.map((e) => e.name)).toEqual(['a.txt', 'dir/b.txt']);
    expect(all[0].data.toString()).toBe('stored words');
    expect(all[1].data.toString()).toBe('deflated words '.repeat(50));
    expect(readZipEntries(buf, (n) => n === 'a.txt').map((e) => e.name)).toEqual(['a.txt']);
    expect(() => readZipEntries(Buffer.from('not a zip at all, just words'))).toThrow(/not a zip file/);
  });

  it('DOCX, XLSX and PPTX to text: headings kept, shared strings resolved, sheets named, slides separated', () => {
    const docx = zip([{ name: '[Content_Types].xml', text: '<Types/>' }, { name: 'word/document.xml', text: DOCX_XML, deflate: true }]);
    expect(textOfDocx(docx), 'a self-closing empty paragraph carries nothing').toBe('# Yard audit\nThe gate was unmanned & open\nSecond paragraph.');
    const xlsx = zip([{ name: 'xl/workbook.xml', text: WORKBOOK }, { name: 'xl/sharedStrings.xml', text: SHARED, deflate: true }, { name: 'xl/worksheets/sheet2.xml', text: SHEET2 }, { name: 'xl/worksheets/sheet1.xml', text: SHEET1, deflate: true }]);
    expect(textOfXlsx(xlsx)).toBe('## Offer\nSite,Price\nTalleyrand,,25000\n## Build & Rollout\nPilot,TRUE');
    const pptx = zip([{ name: 'ppt/slides/slide10.xml', text: SLIDE(10) }, { name: 'ppt/slides/slide2.xml', text: SLIDE(2), deflate: true }, { name: 'ppt/slides/_rels/slide2.xml.rels', text: '<r/>' }]);
    expect(textOfPptx(pptx)).toBe('Slide 2 title\nPoint 2\n-----\nSlide 10 title\nPoint 10');
    expect(extractDriveText({ name: 'deck.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }, pptx)).toEqual({ text: 'Slide 2 title\nPoint 2\n-----\nSlide 10 title\nPoint 10', unreadableReason: null });
    expect(extractDriveText({ name: 'memo.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, docx).text).toContain('# Yard audit');
    expect(extractDriveText({ name: 'notes.md', mimeType: 'text/markdown' }, Buffer.from('# Hello\n\nwords')).text).toBe('# Hello\n\nwords');
    // An image-only deck has slides without text: the extraction is empty and the parser says unreadable downstream.
    const imageOnly = zip([{ name: 'ppt/slides/slide1.xml', text: '<p:sld><p:cSld><p:spTree><p:pic/></p:spTree></p:cSld></p:sld>' }]);
    expect(extractDriveText({ name: 'Inland26.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }, imageOnly)).toEqual({ text: '', unreadableReason: null });
    expect(extractDriveText({ name: 'deck.pdf', mimeType: 'application/pdf' }, Buffer.from('%PDF-1.4'))).toEqual({ text: null, unreadableReason: PDF_UNREADABLE_REASON });
    expect(extractDriveText({ name: 'broken.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, Buffer.from('nope')).unreadableReason).toMatch(/could not be read as/);
    expect(extractDriveText({ name: 'x.bin', mimeType: 'application/octet-stream' }, Buffer.alloc(3)).unreadableReason).toBe('no text extractor for application/octet-stream');
  });

  it('the HTTP client: the token minted once and sent only in the header; the folder query; the listing; export; 404 as null; a refusal as auth', async () => {
    const calls: Array<{ url: string; auth: string | null; body: string | null }> = [];
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      const headers = (init?.headers ?? {}) as Record<string, string>;
      calls.push({ url: u, auth: headers.Authorization ?? null, body: init?.body ? String(init.body) : null });
      if (u.startsWith('https://oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'at-secret' }), { status: 200 });
      const parsed = new URL(u);
      if (parsed.pathname === '/drive/v3/files' && parsed.searchParams.get('q')?.includes('folder')) return new Response(JSON.stringify({ files: [{ id: 'f-meet', name: 'Meet Recordings' }] }), { status: 200 });
      if (parsed.pathname === '/drive/v3/files') return new Response(JSON.stringify({ files: [{ id: 'd1', name: 'Doc', mimeType: 'application/vnd.google-apps.document', modifiedTime: '2026-07-16T00:00:00.000Z', owners: [{ emailAddress: 'casey@freightroll.com' }], webViewLink: 'https://docs.google.com/document/d/d1', parents: ['f-meet'], size: '12' }], nextPageToken: 'p2' }), { status: 200 });
      if (parsed.pathname === '/drive/v3/files/d1/export') return new Response('Exported words of the document', { status: 200 });
      if (parsed.pathname === '/drive/v3/files/gone') return new Response('{}', { status: 404 });
      if (parsed.pathname === '/drive/v3/files/forbidden') return new Response('{}', { status: 403 });
      return new Response('{}', { status: 500 });
    }) as unknown as typeof fetch;
    const client = createDriveClient({ kind: 'refresh_token', refreshToken: 'rt-secret', clientId: 'c', clientSecret: 's' }, { fetchImpl });
    expect(await client.resolveFolders(['Meet Recordings', 'Missing', '1AbCdEfGhIjKlMnOpQrStUvWxYz0123'])).toEqual([{ id: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123', name: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123' }, { id: 'f-meet', name: 'Meet Recordings' }]);
    const page = await client.listFiles({ folderId: 'f-meet', modifiedAfter: '2026-06-01T00:00:00.000Z', pageSize: 25 });
    expect(page.files[0]).toEqual({ id: 'd1', name: 'Doc', mimeType: 'application/vnd.google-apps.document', modifiedTime: '2026-07-16T00:00:00.000Z', owners: ['casey@freightroll.com'], webViewLink: 'https://docs.google.com/document/d/d1', parents: ['f-meet'], size: 12, trashed: false });
    expect(page.nextPageToken).toBe('p2');
    expect(await client.exportText('d1', 'application/vnd.google-apps.document')).toBe('Exported words of the document');
    expect(await client.getFile('gone')).toBeNull();
    await expect(client.getFile('forbidden')).rejects.toBeInstanceOf(DriveApiError);
    expect(await client.download('big', 10, 11), 'a file past the bound is not downloaded').toBeNull();
    const tokenCalls = calls.filter((c) => c.url.startsWith('https://oauth2.googleapis.com/token'));
    expect(tokenCalls, 'the token is minted once per client').toHaveLength(1);
    expect(tokenCalls[0].body).toContain('grant_type=refresh_token');
    const api = calls.filter((c) => c.url.startsWith('https://www.googleapis.com/'));
    expect(api.every((c) => c.auth === 'Bearer at-secret')).toBe(true);
    expect(api.every((c) => !c.url.includes('at-secret') && !c.url.includes('rt-secret')), 'no credential in any url').toBe(true);
    const list = new URL(api.find((c) => c.url.includes('modifiedTime'))!.url);
    expect(list.searchParams.get('q')).toBe("'f-meet' in parents and trashed = false and modifiedTime > '2026-06-01T00:00:00.000Z'");
    expect(list.searchParams.get('orderBy')).toBe('modifiedTime');
    const folders = new URL(api[0].url);
    expect(folders.searchParams.get('q')).toBe("mimeType = 'application/vnd.google-apps.folder' and trashed = false and (name = 'Meet Recordings' or name = 'Missing')");
    const exp = new URL(api.find((c) => c.url.includes('/export'))!.url);
    expect(exp.searchParams.get('mimeType')).toBe('text/plain');
  });
});
