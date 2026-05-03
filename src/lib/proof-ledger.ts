import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type LatestProofSummary = {
  sprintHeading: string;
  deploymentUrl: string | null;
  deploymentId: string | null;
  testedRoutes: string[];
};

function parseTestedRoutes(section: string): string[] {
  const routes = new Set<string>();
  const lines = section.split('\n');
  let inRoutesBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === 'Routes tested:' || line === '- Routes tested:') {
      inRoutesBlock = true;
      continue;
    }
    if (inRoutesBlock && (line === 'Routes changed:' || line === '- Routes changed:')) break;
    if (!inRoutesBlock) continue;

    const routeMatch = line.match(/-\s*(\/[A-Za-z0-9\-_/?.=&]+)/);
    if (routeMatch?.[1]) {
      routes.add(routeMatch[1].replace(/[;,]$/, ''));
    }
  }

  return [...routes];
}

export function extractLatestProofSummary(markdown: string): LatestProofSummary | null {
  const sprintMatches = [...markdown.matchAll(/^##\s+(Sprint\s+\d+\s+Entry:[^\n]+)$/gm)];
  if (sprintMatches.length === 0) return null;

  const latestMatch = sprintMatches.at(-1);
  if (!latestMatch || latestMatch.index === undefined) return null;

  const sectionStart = latestMatch.index;
  const nextHeadingStart = markdown.indexOf('\n## ', sectionStart + 1);
  const section = markdown.slice(sectionStart, nextHeadingStart === -1 ? undefined : nextHeadingStart);

  const deploymentUrl = section.match(/-\s+Deployment URL:\s+(.+)/)?.[1]?.trim() ?? null;
  const deploymentId = section.match(/-\s+Deployment ID:\s+(.+)/)?.[1]?.trim() ?? null;

  return {
    sprintHeading: latestMatch[1].trim(),
    deploymentUrl,
    deploymentId,
    testedRoutes: parseTestedRoutes(section),
  };
}

export async function getLatestProofSummaryFromLedger(): Promise<LatestProofSummary | null> {
  const ledgerPath = path.join(process.cwd(), 'docs', 'roadmaps', 'revops-os-proof-ledger.md');

  try {
    const markdown = await readFile(ledgerPath, 'utf8');
    return extractLatestProofSummary(markdown);
  } catch {
    return null;
  }
}
