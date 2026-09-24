/**
 * R3-5 (part): the preview page's GapCompile queries. The hypothesis report
 * reads rows for THIS hypothesis only; template-level rows (hypothesis_id
 * null) are a separate, labelled query and never reach the enroll gate.
 * Before this fix the page admitted `OR: [{hypothesis_id}, {hypothesis_id:
 * null}]` into the report and into `compileIds`.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { hypothesisCompileWhere, templateCompileWhere } from '@/lib/gap/compiler/preview-rows';

describe('preview compile-row queries (R3-5)', () => {
  it('hypothesisCompileWhere pins the version AND the hypothesis, with no null branch', () => {
    const where = hypothesisCompileWhere('ver_1', 'hyp_1');
    expect(where).toEqual({ sequence_version_id: 'ver_1', hypothesis_id: 'hyp_1' });
    expect(JSON.stringify(where)).not.toContain('null');
    expect(where).not.toHaveProperty('OR');
  });

  it('templateCompileWhere pins the version and hypothesis_id null only', () => {
    expect(templateCompileWhere('ver_1')).toEqual({ sequence_version_id: 'ver_1', hypothesis_id: null });
  });

  it('a template row never satisfies the hypothesis query (the shape is exact-match on both keys)', () => {
    const where = hypothesisCompileWhere('ver_1', 'hyp_1');
    const templateRow = { sequence_version_id: 'ver_1', hypothesis_id: null };
    const otherHypothesisRow = { sequence_version_id: 'ver_1', hypothesis_id: 'hyp_2' };
    const ownRow = { sequence_version_id: 'ver_1', hypothesis_id: 'hyp_1' };
    const matches = (row: Record<string, unknown>) => Object.entries(where).every(([k, v]) => row[k] === v);
    expect(matches(templateRow)).toBe(false);
    expect(matches(otherHypothesisRow)).toBe(false);
    expect(matches(ownRow)).toBe(true);
  });

  it('the page uses both helpers and passes only hypothesis rows to the enroll button', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'src/app/gap/preview/[hypothesisId]/page.tsx'), 'utf8');
    expect(source).toMatch(/hypothesisCompileWhere\(version\.id, hypothesis\.id\)/);
    expect(source).toMatch(/templateCompileWhere\(version\.id\)/);
    expect(source).not.toMatch(/hypothesis_id: null \}/);
    expect(source).not.toMatch(/OR: \[/);
    expect(source).toContain('template compile (shadow only)');
  });
});
