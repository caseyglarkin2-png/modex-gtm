/**
 * R63-A N1: our words off seller screens where the fix is local: "GAP, clawd and the account history: nothing found",
 * the "Wedge" slot, a thesis choice "hidden capacity (approved)", and "email · 2026-10-07 · 0 candidates waiting".
 * ("thesis" and "send gate" stay by the R60 decision; "remit" and "Next operator" are recorded debt.)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { thesisOption } from '@/components/gap/capture-flow';

const src = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('R63-A N1: words a seller reads', () => {
  it('a thesis choice says its family and state in words', () => {
    expect(thesisOption({ problem_family: 'hidden_capacity', status: 'approved' })).toBe('Hidden capacity (approved, not in use)');
    expect(thesisOption({ problem_family: 'gate_congestion', status: 'active' })).toBe('Gate congestion (in use)');
  });

  it('no seller-visible string says clawd, Wedge or candidates waiting', () => {
    expect(src('src/lib/gap/story/story.ts')).not.toMatch(/basis: '[^']*clawd/);
    expect(src('src/components/gap/account-now.tsx')).not.toMatch(/label="Wedge"/);
    expect(src('src/app/gap/capture/page.tsx')).not.toMatch(/candidate\{[^}]*\} waiting/);
  });
});
