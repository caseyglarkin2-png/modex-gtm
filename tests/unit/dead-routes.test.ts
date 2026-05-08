import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalNavModules } from '@/lib/navigation';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const APP_ROOT = path.join(REPO_ROOT, 'src', 'app');
const NEXT_CONFIG_PATH = path.join(REPO_ROOT, 'next.config.ts');

// Top-level routes that intentionally exist outside the canonical sidebar
// modules. Adding a new top-level segment outside this list (or canonicalNavModules)
// will fail the orphan-page-file test below.
const ALLOWED_NON_NAV_TOP_LEVEL = new Set([
  'capture',     // global Quick Capture action, surfaced from the sidebar's pinned link
  'for',         // public yardflow.ai landing + host-router; per-account microsites at /for/[account]
  'login',       // NextAuth sign-in page
  'unsubscribe', // public unsubscribe handler for outbound email
  'proposal',    // public proposal microsites at /proposal/[slug]
]);

function getRedirectSources(): Set<string> {
  const content = readFileSync(NEXT_CONFIG_PATH, 'utf8');
  const sources = new Set<string>();
  for (const match of content.matchAll(/source:\s*'([^']+)'/g)) {
    sources.add(match[1]);
  }
  return sources;
}

function hasPageFile(href: string): boolean {
  const pathname = href.split('?')[0];
  if (pathname === '/') {
    return existsSync(path.join(APP_ROOT, 'page.tsx'));
  }
  const segments = pathname.split('/').filter(Boolean);
  return existsSync(path.join(APP_ROOT, ...segments, 'page.tsx'));
}

// Some aliases point at a directory whose only page.tsx is inside a dynamic
// child segment (e.g. /proposal -> /proposal/[slug]/page.tsx). Those are
// real routes, just not at the alias path itself.
function hasDynamicChildPage(href: string): boolean {
  const pathname = href.split('?')[0];
  if (pathname === '/') return false;
  const segments = pathname.split('/').filter(Boolean);
  const dirPath = path.join(APP_ROOT, ...segments);
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return false;
  return readdirSync(dirPath, { withFileTypes: true }).some((entry) =>
    entry.isDirectory()
      && entry.name.startsWith('[')
      && existsSync(path.join(dirPath, entry.name, 'page.tsx')),
  );
}

function topLevelRouteSegments(): string[] {
  const entries = readdirSync(APP_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('_') && !name.startsWith('('))
    .filter((name) => existsSync(path.join(APP_ROOT, name, 'page.tsx')));
}

describe('dead-route detector', () => {
  it('every canonical sidebar href resolves to a page file or a permanent redirect', () => {
    const redirectSources = getRedirectSources();
    const orphans: string[] = [];
    for (const module of canonicalNavModules) {
      const pathname = module.href.split('?')[0];
      if (hasPageFile(module.href)) continue;
      if (redirectSources.has(pathname)) continue;
      orphans.push(`${module.label} -> ${module.href}`);
    }
    expect(orphans).toEqual([]);
  });

  it('every legacy alias path resolves to a page file, a dynamic child route, or a permanent redirect', () => {
    const redirectSources = getRedirectSources();
    const orphans: string[] = [];
    for (const module of canonicalNavModules) {
      for (const alias of module.aliases) {
        if (alias.startsWith('/api/')) continue;
        if (hasPageFile(alias)) continue;
        if (hasDynamicChildPage(alias)) continue;
        if (redirectSources.has(alias)) continue;
        orphans.push(`${module.label} alias -> ${alias}`);
      }
    }
    expect(orphans).toEqual([]);
  });

  it('top-level route segments are either canonical modules, in the explicit allowlist, or a known dynamic detail route', () => {
    const canonicalSegments = new Set<string>();
    for (const module of canonicalNavModules) {
      const pathname = module.href.split('?')[0];
      const segment = pathname.split('/').filter(Boolean)[0];
      if (segment) canonicalSegments.add(segment);
    }

    const orphanSegments: string[] = [];
    for (const segment of topLevelRouteSegments()) {
      if (canonicalSegments.has(segment)) continue;
      if (ALLOWED_NON_NAV_TOP_LEVEL.has(segment)) continue;
      orphanSegments.push(segment);
    }
    expect(orphanSegments).toEqual([]);
  });
});
