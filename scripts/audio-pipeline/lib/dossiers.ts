import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Canonical-to-dossier-side slug aliases. Account slugs in modex-gtm don't always
 * match the loose slugs used in dossier filenames; we look both up at match time.
 *
 * - "keurig-dr-pepper" account ↔ dossiers using "kdp"
 * - "mondelez-international" account ↔ dossiers using "mondelez"
 *
 * Add new aliases here when a new dossier convention shows up that doesn't
 * normalize cleanly to the canonical account slug.
 */
export const ACCOUNT_SLUG_ALIASES: Record<string, string[]> = {
  'keurig-dr-pepper': ['kdp'],
  'mondelez-international': ['mondelez'],
};

export interface DossierMatch {
  /** Absolute path to the dossier file. */
  path: string;
  /** Filename relative to the dossiers directory. */
  filename: string;
  /** Markdown body. */
  body: string;
}

export interface CollectDossiersResult {
  matches: DossierMatch[];
  /** True when no dossier matched the account — caller falls back to account-data-only prompt. */
  fallback: boolean;
}

interface CollectDossiersOptions {
  accountSlug: string;
  /** Absolute path to the directory holding `*-dossier.md` files. */
  dossiersDir: string;
}

/**
 * Find dossier files whose trailing component(s) match the account slug
 * after normalization (hyphen-strip + lowercase).
 *
 * Dossier filenames follow `<person-tokens>-<account-tokens>-dossier.md`.
 * Matching only considers the trailing tokens so accounts whose slug is a
 * substring of a person token (e.g. account `ford` vs. dossier
 * `someone-stafford-dossier.md`) don't false-positive.
 *
 * Loose dossier slugs ("kdp", "abinbev", "campbells", "generalmills")
 * still bridge to canonical modex-gtm slugs ("keurig-dr-pepper",
 * "ab-inbev", "campbell-s", "general-mills") because both sides are
 * normalized (lowercase + hyphen-strip) before comparison.
 */
export async function collectDossiers(opts: CollectDossiersOptions): Promise<CollectDossiersResult> {
  const targets = targetCandidates(opts.accountSlug);
  let entries: string[];
  try {
    entries = await readdir(opts.dossiersDir);
  } catch {
    return { matches: [], fallback: true };
  }
  const candidates = entries.filter((name) => name.endsWith('-dossier.md'));
  const matches: DossierMatch[] = [];
  for (const filename of candidates) {
    if (!matchesAccount(filename, targets)) continue;
    const path = resolve(opts.dossiersDir, filename);
    try {
      const body = await readFile(path, 'utf8');
      matches.push({ path, filename, body });
    } catch {
      // Single bad file shouldn't kill the collector. Skip and keep going;
      // caller can still get a partial set of matches.
      continue;
    }
  }
  return { matches, fallback: matches.length === 0 };
}

function targetCandidates(accountSlug: string): string[] {
  const canonical = normalize(accountSlug);
  const aliases = (ACCOUNT_SLUG_ALIASES[accountSlug] ?? []).map(normalize);
  return [canonical, ...aliases];
}

function matchesAccount(filename: string, normalizedTargets: string[]): boolean {
  const stem = filename.replace(/-dossier\.md$/, '');
  const parts = stem.split('-').filter(Boolean);
  // Try every trailing slice from length 1 to length N.
  for (let k = 1; k <= parts.length; k++) {
    const tail = normalize(parts.slice(parts.length - k).join(''));
    if (normalizedTargets.includes(tail)) return true;
  }
  return false;
}

function normalize(slug: string): string {
  return slug.replace(/-/g, '').toLowerCase();
}
