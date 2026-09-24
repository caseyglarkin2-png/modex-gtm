import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  claimById,
  loadClaims,
  normalizeTierText,
  phrasingFor,
  snapshotMeta,
  splitPhrasing,
  validateClaimsUsed,
} from '@/lib/gap/claims/validate-claims';
import { CLAIM_STATUSES, type ClaimStatus } from '@/lib/gap/claims/types';
import { checkParity, extractClaimIds, formatReport } from '@/scripts/gap/claims-parity';

const ROOT = join(__dirname, '../../..');
const LANE = 'C:/Users/casey/yardflow-hubspot/top100';
const laneIt = existsSync(join(LANE, 'CLAIMS.md')) ? it : it.skip;

const NEW_IDS = ['CR-034', 'CR-035', 'CR-036', 'CR-037', 'CR-038', 'CR-039', 'CR-040'];

function firstWithStatus(status: ClaimStatus): string {
  const row = loadClaims().find((r) => r.status === status);
  if (!row) throw new Error(`no row with status ${status}`);
  return row.claim_id;
}

describe('claims snapshot', () => {
  it('loads 66 rows (59 lane rows plus CR-034..CR-040) under the v1 schema', () => {
    expect(snapshotMeta().schema).toBe('gap-claims-snapshot.v1');
    expect(snapshotMeta().verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(loadClaims()).toHaveLength(66);
  });

  it('every status is one of the six and the counts match the lane plus the reconciled rows', () => {
    const counts: Record<string, number> = {};
    for (const row of loadClaims()) {
      expect(CLAIM_STATUSES).toContain(row.status);
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    expect(counts).toEqual({
      APPROVED_EXTERNAL: 33,
      APPROVED_AS_QUESTION: 14,
      DO_NOT_USE: 11,
      INTERNAL_ONLY: 1,
      APPROVED_SALES_EMAIL: 3,
      APPROVED_UNNAMED_ONLY: 4,
    });
  });

  it('ids are unique and well formed', () => {
    const ids = loadClaims().map((r) => r.claim_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^(CR|INF|GAP)-\d{3}$/);
  });

  it('every CR-034..CR-040 row is present with a non-empty claim_text and its tier text kept', () => {
    for (const id of NEW_IDS) {
      const row = claimById(id);
      expect(row, id).toBeDefined();
      expect(row!.claim_text.trim().length, id).toBeGreaterThan(20);
      expect(row!.status_text_in_claims_md, id).toMatch(/^APPROVED/);
      expect(normalizeTierText(row!.status_text_in_claims_md!), id).toBe(row!.status);
      expect(row!.source_path_or_url, id).toContain(`CLAIMS.md#${id}`);
    }
    expect(claimById('CR-034')!.status).toBe('APPROVED_SALES_EMAIL');
    expect(claimById('CR-035')!.status).toBe('APPROVED_UNNAMED_ONLY');
    expect(claimById('CR-039')!.status).toBe('APPROVED_UNNAMED_ONLY');
  });

  it('every row carries a claim_text, scope, source and verified_at', () => {
    for (const row of loadClaims()) {
      expect(row.claim_text.length, row.claim_id).toBeGreaterThan(0);
      expect(row.scope.length, row.claim_id).toBeGreaterThan(0);
      expect(row.source_path_or_url.length, row.claim_id).toBeGreaterThan(0);
      expect(row.verified_at, row.claim_id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('claimById returns undefined for an unknown id', () => {
    expect(claimById('CR-999')).toBeUndefined();
  });
});

describe('normalizeTierText', () => {
  it('maps every tier wording CLAIMS.md uses and refuses anything else', () => {
    expect(normalizeTierText('APPROVED (external)')).toBe('APPROVED_EXTERNAL');
    expect(normalizeTierText('APPROVED (sales email; Casey 2026-09-15)')).toBe('APPROVED_SALES_EMAIL');
    expect(normalizeTierText('APPROVED as UNNAMED innuendo only (Casey 2026-09-17)')).toBe('APPROVED_UNNAMED_ONLY');
    expect(normalizeTierText('APPROVED as unnamed hints only (Casey 2026-09-16)')).toBe('APPROVED_UNNAMED_ONLY');
    expect(normalizeTierText('APPROVED (as question)')).toBe('APPROVED_AS_QUESTION');
    expect(normalizeTierText('INTERNAL ONLY')).toBe('INTERNAL_ONLY');
    expect(normalizeTierText('DO NOT USE')).toBe('DO_NOT_USE');
    expect(normalizeTierText('APPROVED')).toBeUndefined();
    expect(normalizeTierText('PENDING')).toBeUndefined();
  });
});

describe('validateClaimsUsed', () => {
  const email = { stepIsQuestion: false, surface: 'sales_email' as const };

  it('accepts APPROVED_EXTERNAL claims on any surface with an empty unnamedOnly', () => {
    expect(validateClaimsUsed(['CR-001', 'GAP-001'], email)).toEqual({ ok: true, unnamedOnly: [] });
    expect(validateClaimsUsed(['CR-001'], { stepIsQuestion: false, surface: 'web' })).toEqual({ ok: true, unnamedOnly: [] });
    expect(validateClaimsUsed([], email)).toEqual({ ok: true, unnamedOnly: [] });
  });

  it('rejects an unknown id with claim_unknown', () => {
    expect(validateClaimsUsed(['CR-001', 'CR-999'], email)).toEqual({ ok: false, reason: 'claim_unknown:CR-999' });
  });

  it('rejects a DO_NOT_USE claim with claim_forbidden', () => {
    const id = firstWithStatus('DO_NOT_USE');
    expect(validateClaimsUsed([id], email)).toEqual({ ok: false, reason: `claim_forbidden:${id}` });
    expect(validateClaimsUsed([id], { stepIsQuestion: true, surface: 'sales_email' })).toEqual({
      ok: false,
      reason: `claim_forbidden:${id}`,
    });
  });

  it('rejects an INTERNAL_ONLY claim with claim_internal_only', () => {
    const id = firstWithStatus('INTERNAL_ONLY');
    expect(validateClaimsUsed([id], email)).toEqual({ ok: false, reason: `claim_internal_only:${id}` });
  });

  it('rejects APPROVED_AS_QUESTION outside a question step and accepts it inside one', () => {
    const id = firstWithStatus('APPROVED_AS_QUESTION');
    expect(validateClaimsUsed([id], email)).toEqual({ ok: false, reason: `claim_needs_question:${id}` });
    expect(validateClaimsUsed([id], { stepIsQuestion: true, surface: 'sales_email' })).toEqual({ ok: true, unnamedOnly: [] });
  });

  it('surfaces APPROVED_UNNAMED_ONLY ids as unnamedOnly without rejecting', () => {
    expect(validateClaimsUsed(['CR-001', 'CR-035', 'CR-038', 'CR-035'], email)).toEqual({
      ok: true,
      unnamedOnly: ['CR-035', 'CR-038'],
    });
  });

  it('refuses APPROVED_SALES_EMAIL on web and deck with claim_surface, accepts it in sales email', () => {
    expect(validateClaimsUsed(['CR-034'], { stepIsQuestion: false, surface: 'web' })).toEqual({
      ok: false,
      reason: 'claim_surface:CR-034',
    });
    expect(validateClaimsUsed(['CR-036'], { stepIsQuestion: false, surface: 'deck' })).toEqual({
      ok: false,
      reason: 'claim_surface:CR-036',
    });
    expect(validateClaimsUsed(['CR-034', 'CR-036', 'CR-037'], email)).toEqual({ ok: true, unnamedOnly: [] });
  });

  it('reports the first failing id in order', () => {
    const forbidden = firstWithStatus('DO_NOT_USE');
    expect(validateClaimsUsed(['CR-999', forbidden], email)).toEqual({ ok: false, reason: 'claim_unknown:CR-999' });
    expect(validateClaimsUsed([forbidden, 'CR-999'], email)).toEqual({ ok: false, reason: `claim_forbidden:${forbidden}` });
  });
});

describe('phrasingFor', () => {
  it('returns the three phrasing arrays for a lane row', () => {
    const p = phrasingFor('CR-001')!;
    expect(p.permitted).toEqual([
      'Primo Brands cut drop-and-hook turn time from 48 to 24 minutes, measured in a side-by-side pilot, now running network-wide across their live sites.',
    ]);
    expect(p.provocative).toHaveLength(1);
    expect(p.forbidden).toHaveLength(1);
  });

  it('splits a quoted list into its alternatives and leaves prose whole', () => {
    expect(splitPhrasing("'5%+ at every location', '5% everywhere', '5% per site guaranteed'.")).toEqual([
      '5%+ at every location',
      '5% everywhere',
      '5% per site guaranteed',
    ]);
    expect(splitPhrasing('"Three of them are here." / "Two of them are there."')).toEqual([
      'Three of them are here.',
      'Two of them are there.',
    ]);
    expect(splitPhrasing("Do not say '24 sites' when you mean the 260-site committed network.")).toEqual([
      "Do not say '24 sites' when you mean the 260-site committed network.",
    ]);
    expect(splitPhrasing(undefined)).toEqual([]);
    expect(splitPhrasing('   ')).toEqual([]);
  });

  it('a DO_NOT_USE row lists its forbidden phrases and a CLAIMS.md-only row has no permitted column', () => {
    expect(phrasingFor('CR-025')!.forbidden).toEqual(['5%+ at every location', '5% everywhere', '5% per site guaranteed']);
    expect(phrasingFor('CR-039')!.provocative).toHaveLength(2);
    expect(phrasingFor('CR-034')!.permitted).toEqual([]);
    expect(phrasingFor('CR-034')!.provocative).toHaveLength(1);
    expect(phrasingFor('CR-999')).toBeUndefined();
  });
});

describe('claims parity', () => {
  it('extracts distinct registry ids in first-seen order', () => {
    expect(extractClaimIds('see CR-001 and INF-002 (CR-001 again) then GAP-012, not CR-1 or XR-001')).toEqual([
      'CR-001',
      'INF-002',
      'GAP-012',
    ]);
  });

  it('a lane JSON that lacks ids the snapshot and CLAIMS.md carry is a warning, not an error', () => {
    const r = checkParity({
      snapshot: ['CR-001', 'CR-034'],
      laneJson: ['CR-001'],
      claimsMd: ['CR-001', 'CR-034'],
    });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual(['lane JSON lacks CR-034 (present in snapshot and CLAIMS.md)']);
    expect(formatReport(r)).toContain('in parity');
  });

  it('a snapshot missing an id present in CLAIMS.md or the lane JSON is an error', () => {
    const r = checkParity({
      snapshot: ['CR-001'],
      laneJson: ['CR-001', 'CR-002'],
      claimsMd: ['CR-001', 'CR-002', 'CR-041'],
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([
      'snapshot lacks CR-002 (present in lane JSON and CLAIMS.md)',
      'snapshot lacks CR-041 (present in CLAIMS.md)',
    ]);
    expect(formatReport(r)).toContain('NOT in parity');
  });

  it('a snapshot id absent from CLAIMS.md is an error; claim_text drift is a warning', () => {
    const r = checkParity({ snapshot: ['CR-001', 'CR-050'], laneJson: ['CR-001'], claimsMd: ['CR-001'] }, ['CR-001']);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(['CLAIMS.md lacks CR-050 (present in snapshot)']);
    expect(r.warnings).toEqual(['claim_text drift on CR-001: snapshot and lane JSON differ']);
  });

  it('full parity prints "in parity" with no rows', () => {
    const r = checkParity({ snapshot: ['CR-001'], laneJson: ['CR-001'], claimsMd: ['CR-001'] });
    expect(r.ok).toBe(true);
    expect(r.rows).toEqual([]);
    expect(formatReport(r)).toContain('in parity: every id is present in all three surfaces');
  });

  laneIt('the real script exits 0 against the real lane and names CR-034..CR-040 as lane JSON warnings', () => {
    const proc = spawnSync(
      process.execPath,
      [join(ROOT, 'node_modules/tsx/dist/cli.mjs'), join(ROOT, 'scripts/gap/claims-parity.ts'), '--lane', LANE],
      { cwd: ROOT, encoding: 'utf8', timeout: 120_000 },
    );
    const out = `${proc.stdout}\n${proc.stderr}`;
    expect(proc.status, out).toBe(0);
    expect(out).toContain('ERRORS (0');
    for (const id of NEW_IDS) expect(out).toContain(`lane JSON lacks ${id} (present in snapshot and CLAIMS.md)`);
    expect(out).toContain('in parity');
    expect(out).not.toContain('NOT in parity');
  });
});
