#!/usr/bin/env tsx
/**
 * D1.3 — Merge clawd-control-plane account research into a demo pack.
 *
 * Reads:
 *   <clawdRoot>/artifacts/yardflow/account_research.json    (per-account caveats + confidence)
 *   <clawdRoot>/artifacts/yardflow/company_freight_value.json   (freight spend, sparse)
 *
 * Writes the merged result back into:
 *   public/demo-packs/<micrositeSlug>.json   (`research` field)
 *
 * Slug resolution is fuzzy — clawd keys vary (smashed lower, domain).
 *
 * Usage:
 *   npx tsx scripts/yard-audit/merge-clawd-research.ts <auditSlug>
 *
 * Env:
 *   CLAWD_ROOT — defaults to ../../clawd-control-plane (sibling repo).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DemoPackSchema, type AccountResearch, type DemoPack } from '../../src/lib/demo/pack-schema';
import { resolveByAuditSlug } from './slug-map';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLAWD_ROOT = process.env.CLAWD_ROOT ?? join(ROOT, '..', 'clawd-control-plane');
const PACK_ROOT = join(ROOT, 'public', 'demo-packs');

interface ClawdAccountRecord {
  facility_count?: number;
  audited_facilities?: number;
  source?: string;
  confidence?: string;
  yard_metrics?: Record<string, unknown>;
  caveats?: string[];
}

function smash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Lookup an account in clawd's account_research.json by trying every
 * plausible key form. Clawd keys range from `mondelez` to `mondelezinternational`
 * to `mondelezinternational.com` — fuzzy match is cheaper than maintaining
 * a parallel mapping table.
 */
/**
 * `key` and `record` for each candidate that matches. Clawd often has
 * multiple records for the same company under different keys (e.g.
 * `mondelez` is the full yard-audit-derived record, `mondelezinternational`
 * is a sparse size_heuristic stub). We pick the richest by field count
 * — preferring records with `caveats` over stubs.
 */
function lookupAccount(
  research: Record<string, ClawdAccountRecord>,
  micrositeSlug: string,
  auditSlug: string,
  displayName: string,
): { key: string; record: ClawdAccountRecord } | null {
  const candidates = new Set<string>();
  for (const s of [micrositeSlug, auditSlug, displayName]) {
    candidates.add(s.toLowerCase());
    candidates.add(smash(s));
  }
  for (const c of [...candidates]) candidates.add(`${c}.com`);

  const hits: { key: string; record: ClawdAccountRecord }[] = [];
  for (const c of candidates) {
    if (research[c]) hits.push({ key: c, record: research[c]! });
  }

  // Substring scan if direct lookups missed
  if (hits.length === 0) {
    const smashed = smash(displayName);
    if (smashed.length >= 5) {
      for (const k of Object.keys(research)) {
        if (smash(k).includes(smashed)) hits.push({ key: k, record: research[k]! });
      }
    }
  }
  if (hits.length === 0) return null;

  // Pick the richest record: prefer ones with caveats[], then highest key count,
  // breaking ties by audited_facilities (verified data over heuristics).
  hits.sort((a, b) => {
    const aCav = a.record.caveats?.length ?? 0;
    const bCav = b.record.caveats?.length ?? 0;
    if (aCav !== bCav) return bCav - aCav;
    const aKeys = Object.keys(a.record).length;
    const bKeys = Object.keys(b.record).length;
    if (aKeys !== bKeys) return bKeys - aKeys;
    return (b.record.audited_facilities ?? 0) - (a.record.audited_facilities ?? 0);
  });
  return hits[0]!;
}

function loadFreightValue(displayName: string): unknown {
  const path = join(CLAWD_ROOT, 'artifacts', 'yardflow', 'company_freight_value.json');
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const want = displayName.toLowerCase();
  for (const k of Object.keys(raw)) {
    if (k.toLowerCase() === want || k.toLowerCase().includes(smash(displayName).slice(0, 6))) {
      return raw[k];
    }
  }
  return null;
}

async function main() {
  const auditSlug = process.argv[2];
  if (!auditSlug) {
    console.error('usage: npx tsx scripts/yard-audit/merge-clawd-research.ts <auditSlug>');
    process.exit(1);
  }
  const { micrositeSlug, displayName } = resolveByAuditSlug(auditSlug);

  const packPath = join(PACK_ROOT, `${micrositeSlug}.json`);
  if (!existsSync(packPath)) {
    throw new Error(`Pack not found: ${packPath} — run build-demo-pack.ts first`);
  }

  const researchPath = join(CLAWD_ROOT, 'artifacts', 'yardflow', 'account_research.json');
  if (!existsSync(researchPath)) {
    console.warn(`No clawd research file at ${researchPath} — leaving pack.research = null`);
    process.exit(0);
  }

  const allResearch = JSON.parse(readFileSync(researchPath, 'utf8')) as Record<string, ClawdAccountRecord>;
  const hit = lookupAccount(allResearch, micrositeSlug, auditSlug, displayName);

  const freight = loadFreightValue(displayName);

  let merged: AccountResearch = null;
  if (hit) {
    console.log(`✓ clawd hit: ${displayName} → key="${hit.key}"`);
    // Strip the circular yard_metrics — we have the same data from the audit.
    // Keep caveats + confidence + facility_count; pass any other clawd-specific
    // fields through via the schema's .passthrough(). Promote freight_value
    // into the same blob so downstream consumers see one research object.
    const { yard_metrics: _drop, ...rest } = hit.record;
    merged = {
      ...rest,
      ...(freight ? { freightValue: freight } : {}),
    } as AccountResearch;
  } else {
    console.log(`✗ no clawd research for ${displayName} (tried micrositeSlug, auditSlug, displayName variants)`);
    if (freight) {
      console.log(`✓ freight value found — attaching standalone`);
      merged = { freightValue: freight } as AccountResearch;
    }
  }

  const pack: DemoPack = JSON.parse(readFileSync(packPath, 'utf8'));
  pack.research = merged;

  // Re-validate before writing — the schema is the contract.
  const validated = DemoPackSchema.parse(pack);
  writeFileSync(packPath, JSON.stringify(validated, null, 2));
  console.log(`✓ wrote merged research to ${packPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
