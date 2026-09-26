import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `next build` type-checks every app route module against the route contract:
 * a route file may export only its HTTP handlers and route segment config.
 * A helper exported from one (refresh-intel shouldNag, the enroll route's
 * SENDING_IDENTITIES, the signals route's host list, all fixed 2026-09-26)
 * passes vitest and tsc but fails the production build. Helpers live in lib.
 */
const ALLOWED = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'dynamic', 'dynamicParams', 'revalidate', 'fetchCache', 'runtime', 'preferredRegion', 'maxDuration', 'generateStaticParams']);

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return /^route\.tsx?$/.test(name) ? [full] : [];
  });
}

describe('app route modules', () => {
  it('export only handlers and route segment config', () => {
    const offenders: string[] = [];
    for (const file of routeFiles(path.join(process.cwd(), 'src', 'app'))) {
      const src = readFileSync(file, 'utf8');
      const names = [
        ...[...src.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/gm)].map((m) => m[1]),
        ...[...src.matchAll(/^export\s*\{([^}]*)\}/gm)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()!.replace(/^type\s+/, ''))),
      ].filter(Boolean);
      for (const n of names) if (!ALLOWED.has(n)) offenders.push(`${path.relative(process.cwd(), file)}: ${n}`);
    }
    expect(offenders).toEqual([]);
  });
});
