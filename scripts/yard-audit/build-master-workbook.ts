/**
 * build-master-workbook.ts — assemble every completed per-account CSV into one
 * multi-tab Excel workbook: an Index tab + one tab per account.
 *
 *   npx tsx scripts/yard-audit/build-master-workbook.ts
 *
 * Uploading the resulting .xlsx to Google Drive converts it to a native
 * multi-tab Google Sheet. Output: output/yard-audits/YardFlow-Master-Audit.xlsx
 *
 * Interim-safe: it simply includes whatever accounts currently have a
 * <slug>-location-breakdown.csv, so it can be re-run as more accounts finish.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';

const ROOT = process.cwd();
const AUDITS = join(ROOT, 'output', 'yard-audits');
const OUT = join(AUDITS, 'YardFlow-Master-Audit.xlsx');

/** Minimal RFC-4180-ish CSV parser — handles quoted fields with embedded commas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Excel-safe worksheet name: <=31 chars, none of []:*?/\ or apostrophe; unique. */
function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/&/g, 'and').replace(/['[\]:*?/\\]/g, '').trim().slice(0, 31);
  let n = base, i = 2;
  while (used.has(n)) n = `${base.slice(0, 28)} ${i++}`;
  used.add(n);
  return n;
}

interface Metrics { facilities: number; dockDoors: number; trailerCap: number; rail: number; }

function accountMetrics(slug: string): Metrics {
  const dir = join(AUDITS, slug, 'sites');
  const m: Metrics = { facilities: 0, dockDoors: 0, trailerCap: 0, rail: 0 };
  if (!existsSync(dir)) return m;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    let j: { yardMetrics?: Record<string, unknown> };
    try {
      j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    } catch (e) {
      // This used to `catch { /* skip unreadable json */ }`. That is the exact
      // failure this whole pipeline exists to prevent: facilities is a COUNT
      // that a human reads off the workbook, so a corrupt record silently
      // lowered the total and the workbook still looked authoritative. A
      // facility we cannot read is not a facility we can count.
      throw new Error(
        `${slug}/sites/${f} is unreadable, so the facility count would be wrong: ${(e as Error).message}`,
      );
    }
    const ym = j.yardMetrics ?? {};
    m.facilities++;
    m.dockDoors += Number(ym.dockDoorCount) || 0;
    m.trailerCap += Number(ym.trailerParkingCapacity) || 0;
    if (ym.railServed === true) m.rail++;
  }
  return m;
}

async function main(): Promise<void> {
  const accounts = readdirSync(AUDITS)
    .filter((d) => existsSync(join(AUDITS, d, `${d}-location-breakdown.csv`)))
    .sort();
  if (accounts.length === 0) throw new Error('No per-account CSVs found.');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'YardFlow Yard-Audit Pipeline';
  wb.created = new Date();

  const index = wb.addWorksheet('Index', { views: [{ state: 'frozen', ySplit: 2 }] });
  [34, 12, 14, 18, 12].forEach((w, i) => (index.getColumn(i + 1).width = w));
  const title = index.addRow([
    `YardFlow — Prospect Yard Audit  (interim, ${new Date().toISOString().slice(0, 10)})`,
  ]);
  title.font = { bold: true, size: 14 };
  const hdr = index.addRow(['Account', 'Facilities', 'Dock Doors', 'Trailer Capacity', 'Rail Sites']);
  hdr.font = { bold: true };

  const used = new Set<string>(['Index']);
  let totF = 0, totD = 0, totT = 0, totR = 0;

  for (const slug of accounts) {
    let display = slug;
    const rosterP = join(AUDITS, slug, 'roster.json');
    if (existsSync(rosterP)) {
      try { display = JSON.parse(readFileSync(rosterP, 'utf8')).account || slug; } catch { /* keep slug */ }
    }
    const sn = sheetName(display, used);
    const m = accountMetrics(slug);
    totF += m.facilities; totD += m.dockDoors; totT += m.trailerCap; totR += m.rail;

    const row = index.addRow([display, m.facilities, m.dockDoors, m.trailerCap, m.rail]);
    row.getCell(1).value = { text: display, hyperlink: `#'${sn}'!A1` };
    row.getCell(1).font = { color: { argb: 'FF1155CC' }, underline: true };

    const ws = wb.addWorksheet(sn);
    ws.getColumn(1).width = 44;
    ws.getColumn(2).width = 30;
    const csv = parseCsv(readFileSync(join(AUDITS, slug, `${slug}-location-breakdown.csv`), 'utf8'));
    csv.forEach((r, i) => {
      const wr = ws.addRow(r);
      if (i < 2) wr.font = { bold: true };
    });
  }

  const totRow = index.addRow(['TOTAL', totF, totD, totT, totR]);
  totRow.font = { bold: true };

  await wb.xlsx.writeFile(OUT);
  console.log(`Wrote ${OUT}`);
  console.log(`  ${accounts.length} account tabs + Index — ${totF} facilities, ` +
    `${totD} dock doors, ${totT} trailer-parking capacity, ${totR} rail-served.`);
}

main();
