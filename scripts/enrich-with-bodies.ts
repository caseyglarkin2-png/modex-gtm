/**
 * enrich-with-bodies.ts
 * Fetches plain text bodies from Resend for each unique subject line,
 * maps them back to all contacts, adds text columns to hitlist-enriched.csv
 * Output: docs/hitlist-enriched.csv (updated in place)
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();
const RESEND_KEY = process.env.RESEND_API_KEY || '';

async function fetchText(id: string): Promise<string> {
  try {
    const r = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: { Authorization: `Bearer ${RESEND_KEY}` },
    });
    const d: any = await r.json();
    return (d.text || '').replace(/\n+/g, ' ').trim();
  } catch {
    return '';
  }
}

async function main() {
  // 1. Get one representative provider_message_id per unique subject
  const uniqueSubjects = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (subject)
      subject,
      provider_message_id
    FROM email_logs
    WHERE provider_message_id IS NOT NULL
      AND to_email NOT IN ('casey@freightroll.com','caseyglarkin2@gmail.com')
    ORDER BY subject, sent_at ASC
  `) as { subject: string; provider_message_id: string }[];

  console.log(`Unique subject lines: ${uniqueSubjects.length}`);

  // 2. Fetch text for each unique subject
  const subjectToText: Record<string, string> = {};
  for (const row of uniqueSubjects) {
    process.stdout.write(`  Fetching: "${row.subject.slice(0, 60)}"... `);
    const text = await fetchText(row.provider_message_id);
    subjectToText[row.subject] = text;
    console.log(text ? `✅ (${text.length} chars)` : '❌ empty');
    await new Promise(r => setTimeout(r, 600)); // stay under rate limit
  }

  await prisma.$disconnect();

  // 3. Read existing CSV and add text columns
  const csvPath = path.join(process.cwd(), 'docs', 'hitlist-enriched.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
  const headers = parseCSVLine(lines[0]);

  // Add new columns
  const newCols = [
    'touch_1_body',
    'touch_2_body',
    'touch_3_body',
    'touch_4_body',
    'touch_5_body',
  ];
  const allCols = [...headers, ...newCols];

  const subjectIdx = (n: number) => headers.indexOf(`touch_${n}_subject`);

  const outLines = [allCols.map(c => `"${c}"`).join(',')];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    const extra = [1,2,3,4,5].map(n => {
      const subj = fields[subjectIdx(n)] || '';
      const text = subjectToText[subj] || '';
      return `"${text.replace(/"/g, '""')}"`;
    });
    outLines.push(line + ',' + extra.join(','));
  }

  fs.writeFileSync(csvPath, outLines.join('\n'));
  console.log(`\n✅ Updated ${csvPath} with body text columns`);
  console.log(`   Rows: ${outLines.length - 1}`);
  console.log(`   Columns: ${allCols.length}`);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

main().catch(e => { console.error(e.message); process.exit(1); });
