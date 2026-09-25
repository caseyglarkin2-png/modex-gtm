/**
 * Regression for the /gap/preview production crash (2026-09-25): a Server
 * Component (the action pack page) CALLED `asStringList`, a plain function
 * exported from the 'use client' module hypothesis-drawer.tsx. Under React
 * Server Components that import is a client reference and calling it throws,
 * so Joey Maggard's action pack answered "Something went wrong". Plain SSR
 * (and every unit test) calls the real function, which is why nothing caught it.
 *
 * The invariant, checked statically over every server file in the GAP
 * surfaces: a value imported from a 'use client' module must be a component
 * (PascalCase) or a type. Anything else is a function or constant the server
 * cannot use.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['src/app/gap', 'src/components/gap'];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

const isClient = (src: string) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*\s*['"]use client['"]/.test(src);

function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith('@/') ? resolve('src', spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

export function boundaryViolations(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  if (isClient(src)) return [];
  const out: string[] = [];
  for (const m of src.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const target = resolveImport(file, m[3]);
    if (!target || !isClient(readFileSync(target, 'utf8'))) continue;
    for (const raw of m[2].split(',')) {
      const name = raw.trim();
      if (!name || name.startsWith('type ')) continue;
      const local = name.split(/\s+as\s+/)[0].trim();
      if (!/^[A-Z]/.test(local)) out.push(`${file}: imports "${local}" from client module ${m[3]}`);
    }
  }
  return out;
}

describe('server/client boundary in GAP surfaces', () => {
  it('no server file imports a non-component value from a "use client" module', () => {
    const violations = ROOTS.flatMap((r) => walk(r)).flatMap(boundaryViolations);
    expect(violations).toEqual([]);
  });

  it('the action pack page is a server component and takes asStringList from the plain module', () => {
    const page = readFileSync('src/app/gap/preview/[hypothesisId]/page.tsx', 'utf8');
    expect(isClient(page)).toBe(false);
    expect(page).toMatch(/import \{ asStringList \} from '@\/lib\/gap\/ui\/format'/);
  });
});
