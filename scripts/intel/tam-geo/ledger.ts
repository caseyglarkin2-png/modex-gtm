// scripts/intel/tam-geo/ledger.ts
import fs from 'node:fs';
import path from 'node:path';

export type Status = 'pending' | 'roster' | 'geocoded' | 'scored' | 'stamped' | 'error';
export interface LedgerRow {
  slug: string; name: string; domain: string | null; tier: string;
  fit: number | null; status: Status; facilities?: number; error?: string; at: string;
}
const DIR = path.join(process.cwd(), 'output', 'intel', 'tam-geo');
const FILE = path.join(DIR, 'ledger.jsonl');

export function load(): Map<string, LedgerRow> {
  const m = new Map<string, LedgerRow>();
  if (!fs.existsSync(FILE)) return m;
  for (const line of fs.readFileSync(FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line) as LedgerRow; m.set(r.slug, r); } catch { /* skip */ }
  }
  return m;
}
export function append(row: Omit<LedgerRow, 'at'>): void {
  fs.mkdirSync(DIR, { recursive: true });
  fs.appendFileSync(FILE, `${JSON.stringify({ ...row, at: new Date().toISOString() })}\n`);
}
export function byStatus(status: Status): LedgerRow[] {
  return [...load().values()].filter((r) => r.status === status);
}
