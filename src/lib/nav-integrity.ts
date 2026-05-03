import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { canonicalNavModules, commandRoutes } from '@/lib/navigation';

export type AppRouteIndex = {
  pageRoutes: string[];
  apiRoutes: string[];
};

export type NavIntegrityReport = {
  navHrefCount: number;
  knownRouteCount: number;
  deadNavHrefs: string[];
  ownerlessCommandRoutes: string[];
  obsoleteTopLevelModules: string[];
  scorecard: {
    keepTopLevel: number;
    hiddenCore: number;
    duplicate: number;
    shouldBeTab: number;
    legacyArtifact: number;
  };
};

const OBSOLETE_TOP_LEVEL_LABELS = [
  'Dashboard',
  'Personas',
  'Outreach Waves',
  'Campaign HQ',
  'Generation Queue',
  'Generated Content',
  'Meeting Briefs',
  'Search Strings',
  'Actionable Intel',
  'Mobile Capture',
  'Jake Queue',
  'Audit Routes',
  'QR Assets',
  'Pipeline Board',
  'Activities',
  'Meetings',
  'Quarterly Review',
  'Cron Health',
  'Creative Studio',
];

function toRouteFromAppFile(filePath: string): string | null {
  const normalized = filePath.replaceAll('\\', '/');
  const isPage = normalized.endsWith('/page.tsx');
  const isRoute = normalized.endsWith('/route.ts');
  if (!isPage && !isRoute) return null;

  let route = normalized
    .replace(/^.*\/src\/app\//, '/')
    .replace(/\/(page|route)\.tsx?$/, '');

  route = route
    .split('/')
    .filter((segment) => segment && !segment.startsWith('('))
    .join('/');

  if (!route) return '/';
  return `/${route}`;
}

function hrefWithoutQuery(href: string): string {
  const [pathOnly] = href.split(/[?#]/, 1);
  return pathOnly || '/';
}

function routePatternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\[\\\.\\\.\\.([^[\]]+)\\\]/g, '.+')
    .replace(/\\\[([^[\]]+)\\\]/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

function isCoveredByKnownRoutes(href: string, knownRoutes: string[]): boolean {
  const pathOnly = hrefWithoutQuery(href);
  if (knownRoutes.includes(pathOnly)) return true;

  const dynamicMatch = knownRoutes.some((known) => {
    if (!known.includes('[')) return false;
    return routePatternToRegex(known).test(pathOnly);
  });
  if (dynamicMatch) return true;

  return knownRoutes.some((known) => known.startsWith(`${pathOnly}/`));
}

async function collectAppFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectAppFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

export async function buildAppRouteIndex(rootDir = process.cwd()): Promise<AppRouteIndex> {
  const appDir = path.join(rootDir, 'src', 'app');
  const files = await collectAppFiles(appDir);
  const routes = files
    .map((file) => toRouteFromAppFile(file))
    .filter((route): route is string => Boolean(route));

  const uniqueRoutes = [...new Set(routes)];
  const apiRoutes = uniqueRoutes.filter((route) => route.startsWith('/api/'));
  const pageRoutes = uniqueRoutes.filter((route) => !route.startsWith('/api/'));

  return { pageRoutes, apiRoutes };
}

export function detectNavIntegrity(routeIndex: AppRouteIndex): NavIntegrityReport {
  const knownRoutes = [...routeIndex.pageRoutes, ...routeIndex.apiRoutes];
  const commandOwners = new Set(canonicalNavModules.map((module) => module.label));
  const navHrefs = new Set<string>();

  for (const navModule of canonicalNavModules) {
    navHrefs.add(navModule.href);
    for (const alias of navModule.aliases) navHrefs.add(alias);
  }
  for (const route of commandRoutes) navHrefs.add(route.href);

  const deadNavHrefs = [...navHrefs]
    .filter((href) => !isCoveredByKnownRoutes(href, knownRoutes))
    .sort();

  const ownerlessCommandRoutes = commandRoutes
    .filter((route) => !commandOwners.has(route.canonicalOwner))
    .map((route) => `${route.label} -> ${route.canonicalOwner}`)
    .sort();

  const canonicalLabels = new Set(canonicalNavModules.map((module) => module.label));
  const obsoleteTopLevelModules = OBSOLETE_TOP_LEVEL_LABELS.filter((label) => canonicalLabels.has(label)).sort();

  return {
    navHrefCount: navHrefs.size,
    knownRouteCount: knownRoutes.length,
    deadNavHrefs,
    ownerlessCommandRoutes,
    obsoleteTopLevelModules,
    scorecard: {
      keepTopLevel: canonicalNavModules.length,
      hiddenCore: 0,
      duplicate: 0,
      shouldBeTab: 0,
      legacyArtifact: 0,
    },
  };
}
