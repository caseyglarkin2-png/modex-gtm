#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import {
  normalizeAccountKey,
  type FacilityFactConfidence,
  type FacilityFactRecord,
  type FacilityFactSource,
  type FacilityFactStatus,
} from '../src/lib/research/facility-counts';

type RawRow = Record<string, string | undefined>;

const ROOT = path.resolve(__dirname, '..');
const FACILITY_FACTS_JSON = path.join(ROOT, 'src/lib/data/facility-facts.json');
const VALID_STATUS = new Set<FacilityFactStatus>(['verified', 'provisional']);
const VALID_CONFIDENCE = new Set<FacilityFactConfidence>(['official', 'public-filing', 'third-party', 'inferred']);

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const rawInput = loadInput(args.filePath);

  if (!rawInput.trim()) {
    throw new Error('No input provided. Pass --file <path> or pipe CSV/TSV rows into stdin.');
  }

  const delimiter = args.delimiter ?? detectDelimiter(rawInput);
  const rows = parse(rawInput, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    delimiter,
  }) as RawRow[];

  if (rows.length === 0) {
    throw new Error('No parsable rows found in input.');
  }

  const existing = loadJson<FacilityFactRecord[]>(FACILITY_FACTS_JSON);
  const nextByKey = new Map(existing.map((record) => [normalizeAccountKey(record.account), record]));

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const record = buildRecord(row);
    const key = normalizeAccountKey(record.account);

    if (nextByKey.has(key)) {
      updated += 1;
    } else {
      created += 1;
    }

    nextByKey.set(key, record);
  }

  const next = Array.from(nextByKey.values()).sort((left, right) => left.account.localeCompare(right.account));

  if (args.dryRun) {
    console.log(JSON.stringify(next, null, 2));
  } else {
    fs.writeFileSync(FACILITY_FACTS_JSON, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
  }

  console.log(`Imported ${rows.length} facility fact row(s): ${created} created, ${updated} updated.`);
  console.log(args.dryRun ? 'Dry run only. No file changes written.' : `Updated ${FACILITY_FACTS_JSON}`);
}

function parseArgs(argv: string[]): {
  filePath?: string;
  delimiter?: string;
  dryRun: boolean;
} {
  let filePath: string | undefined;
  let delimiter: string | undefined;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--file' && argv[index + 1]) {
      filePath = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--delimiter' && argv[index + 1]) {
      delimiter = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--dry-run') {
      dryRun = true;
    }
  }

  return { filePath, delimiter, dryRun };
}

function loadInput(filePath?: string): string {
  if (filePath) {
    return fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf-8');
  }

  return fs.readFileSync(0, 'utf-8');
}

function detectDelimiter(raw: string): string {
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? '';
  return firstLine.includes('\t') ? '\t' : ',';
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function buildRecord(row: RawRow): FacilityFactRecord {
  const account = readRequired(row, 'account');
  const facilityCount = readRequired(row, 'facilityCount');
  const scope = readRequired(row, 'scope');
  const summary = readRequired(row, 'summary');
  const status = readStatus(row.status);
  const confidence = readConfidence(row.confidence);
  const updatedAt = (row.updatedAt ?? '').trim() || currentDate();
  const sources = collectSources(row);

  if (sources.length === 0) {
    throw new Error(`Row for ${account} must include at least one source label.`);
  }

  return {
    account,
    facilityCount,
    scope,
    status,
    confidence,
    summary,
    updatedAt,
    sources,
  };
}

function readRequired(row: RawRow, field: string): string {
  const value = (row[field] ?? '').trim();
  if (!value) {
    throw new Error(`Missing required field: ${field}`);
  }

  return value;
}

function readStatus(value: string | undefined): FacilityFactStatus {
  const normalized = (value ?? 'provisional').trim() as FacilityFactStatus;
  if (!VALID_STATUS.has(normalized)) {
    throw new Error(`Invalid status: ${value}`);
  }

  return normalized;
}

function readConfidence(value: string | undefined): FacilityFactConfidence {
  const normalized = (value ?? 'inferred').trim() as FacilityFactConfidence;
  if (!VALID_CONFIDENCE.has(normalized)) {
    throw new Error(`Invalid confidence: ${value}`);
  }

  return normalized;
}

function collectSources(row: RawRow): FacilityFactSource[] {
  const sources: FacilityFactSource[] = [];

  const sourcesJson = (row.sourcesJson ?? '').trim();
  if (sourcesJson) {
    const parsed = JSON.parse(sourcesJson) as FacilityFactSource[];
    for (const source of parsed) {
      if (source?.label?.trim()) {
        sources.push({ label: source.label.trim(), url: source.url?.trim() || undefined });
      }
    }
  }

  const sourceIndexes = new Set<number>();
  for (const key of Object.keys(row)) {
    const match = key.match(/^source(\d+)Label$/i);
    if (match) {
      sourceIndexes.add(Number.parseInt(match[1], 10));
    }
  }

  for (const index of Array.from(sourceIndexes).sort((left, right) => left - right)) {
    const label = (row[`source${index}Label`] ?? '').trim();
    const url = (row[`source${index}Url`] ?? '').trim();
    if (label) {
      sources.push({ label, url: url || undefined });
    }
  }

  const deduped = new Map<string, FacilityFactSource>();
  for (const source of sources) {
    const key = `${source.label}::${source.url ?? ''}`;
    deduped.set(key, source);
  }

  return Array.from(deduped.values());
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

main();