/**
 * The production build (2026-10-07): the Work list is read by a client component (components/gap/work-list.tsx), so
 * the module and what it imports must never reach the server path (work/outcome.ts records outcomes and imports the
 * commitments ledger, which hashes sequence steps with node:crypto). The build failed on exactly that chain; the
 * client-safe outcome model lives in work/outcome-model.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const imports = (p: string) => [...src(p).matchAll(/from '([^']+)'/g)].map((m) => m[1]);

describe('the Work list stays client-safe', () => {
  it('work/list.ts imports the outcome MODEL, never the server outcome module, the commitments ledger or node built-ins', () => {
    const list = imports('src/lib/gap/work/list.ts');
    expect(list).toContain('./outcome-model');
    expect(list).not.toContain('./outcome');
    expect(list).not.toContain('./commitments');
    expect(list.filter((m) => m.startsWith('node:'))).toEqual([]);
    expect(imports('src/lib/gap/work/outcome-model.ts')).toEqual([]);
  });
});
