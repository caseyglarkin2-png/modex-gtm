/**
 * sync-reference-sites.ts — validate the canonical reference-sites list against
 * Casey's site spreadsheet (S5-T3).
 *
 * The xlsx (`table (1).xlsx`, sheet "All solutions") is the authority for WHICH
 * Primo sites are live and WHICH YardFlow solutions run at each. It has no
 * coordinates — those are geocoded and live only in
 * src/lib/discovery/reference-sites.ts (the single source of truth). This script
 * reads the spreadsheet and reports drift vs the canonical:
 *   - sites in the xlsx but missing from REFERENCE_SITES (need geocoding + add)
 *   - sites in REFERENCE_SITES but not in the xlsx (stale; consider removing)
 *   - the per-site solutions map from the xlsx (paste target for
 *     scripts/primo-proximity-gtm.ts SOLUTIONS_BY_SITE)
 *
 * Read-only by design: it never overwrites the canonical (coords would be lost).
 *
 * Usage:
 *   npx tsx scripts/sync-reference-sites.ts
 *   npx tsx scripts/sync-reference-sites.ts --xlsx "C:/Users/casey/Downloads/table (1).xlsx"
 *   npx tsx scripts/sync-reference-sites.ts --emit-solutions   # print the SOLUTIONS_BY_SITE map
 */

import ExcelJS from 'exceljs';
import { REFERENCE_SITES } from '../src/lib/discovery/reference-sites';

const argv = process.argv.slice(2);
const xlsxArg = argv.indexOf('--xlsx');
const XLSX_PATH = xlsxArg >= 0 ? argv[xlsxArg + 1] : 'C:/Users/casey/Downloads/table (1).xlsx';
const EMIT = argv.includes('--emit-solutions');

const SHEET = 'All solutions';
// Column index (1-based; A=1) -> solution label, per the sheet's header row.
// Col A = site name, Col B = a count, Cols C-F = the four solutions.
const SOLUTION_COLS: Record<number, string> = {
  3: 'Driver Journey',
  4: 'YMS',
  5: 'RTLS',
  6: 'Machine Vision Gate',
};
const NAME_COL = 1;

function cellMarked(v: ExcelJS.CellValue): boolean {
  if (v == null) return false;
  const s = String(typeof v === 'object' && 'text' in (v as object) ? (v as { text: string }).text : v).trim();
  return s.length > 0 && s !== '0' && s.toLowerCase() !== 'false';
}

async function main(): Promise<number> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(XLSX_PATH);
  } catch (e) {
    console.error(`Could not read xlsx at ${XLSX_PATH}: ${(e as Error).message}`);
    console.error('Pass --xlsx "<path>" if the spreadsheet lives elsewhere.');
    return 2;
  }
  const ws = wb.getWorksheet(SHEET);
  if (!ws) {
    console.error(`Sheet "${SHEET}" not found. Sheets: ${wb.worksheets.map((w) => w.name).join(', ')}`);
    return 2;
  }

  const xlsxSolutions: Record<string, string[]> = {};
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const name = String(row.getCell(NAME_COL).value ?? '').trim();
    if (!name || /primo brands/i.test(name)) return;
    const sols: string[] = [];
    for (const [col, label] of Object.entries(SOLUTION_COLS)) {
      if (cellMarked(row.getCell(Number(col)).value)) sols.push(label);
    }
    xlsxSolutions[name] = sols.length ? sols : ['Driver Journey'];
  });

  const xlsxNames = new Set(Object.keys(xlsxSolutions).map((n) => n.toLowerCase()));
  const canonNames = new Set(REFERENCE_SITES.map((s) => s.name.toLowerCase()));

  const missingFromCanon = Object.keys(xlsxSolutions).filter((n) => !canonNames.has(n.toLowerCase()));
  const staleInCanon = REFERENCE_SITES.filter((s) => !xlsxNames.has(s.name.toLowerCase())).map((s) => s.name);

  console.log(`xlsx "${SHEET}" sites:        ${Object.keys(xlsxSolutions).length}`);
  console.log(`canonical REFERENCE_SITES:   ${REFERENCE_SITES.length}`);
  console.log();
  if (missingFromCanon.length) {
    console.log(`⚠️  in xlsx but NOT in REFERENCE_SITES (${missingFromCanon.length}) — need coords + add:`);
    missingFromCanon.forEach((n) => console.log(`   - ${n}  solutions=${JSON.stringify(xlsxSolutions[n])}`));
  } else {
    console.log('✅ every xlsx site is present in REFERENCE_SITES (coords covered)');
  }
  console.log();
  if (staleInCanon.length) {
    console.log(`⚠️  in REFERENCE_SITES but NOT in xlsx (${staleInCanon.length}) — possibly stale:`);
    staleInCanon.forEach((n) => console.log(`   - ${n}`));
  } else {
    console.log('✅ no stale sites in REFERENCE_SITES');
  }

  if (EMIT) {
    console.log('\n// SOLUTIONS_BY_SITE (paste into scripts/primo-proximity-gtm.ts; Driver-Journey-only omitted):');
    console.log('const SOLUTIONS_BY_SITE: Record<string, string[]> = {');
    for (const [name, sols] of Object.entries(xlsxSolutions)) {
      if (sols.length === 1 && sols[0] === 'Driver Journey') continue;
      console.log(`  ${JSON.stringify(name)}: ${JSON.stringify(sols)},`);
    }
    console.log('};');
  }

  const drift = missingFromCanon.length + staleInCanon.length;
  console.log(`\n${drift === 0 ? '✅ canonical is in sync with the spreadsheet' : `⚠️  ${drift} drift item(s) — reconcile above`}`);
  return drift === 0 ? 0 : 1;
}

main().then((c) => process.exit(c));
