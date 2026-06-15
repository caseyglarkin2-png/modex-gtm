import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildSnapshot } from './snapshot';
import { buildHeroMap } from './hero-map';
import { authorOverride } from './author-override';
import { latestForAccount } from '@/lib/pounce/ranked';
import type { ForPageRow } from './store';

/** Load a committed demo pack off disk, or null if the slug has none yet. */
export async function loadDemoPack(slug: string): Promise<any | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch { return null; }
}

/**
 * Turn an audited demo pack into a complete, ready-to-serve ForPageRow:
 * the modeled snapshot (same engine as /demo), the hero geo, and the
 * LLM-authored spear (with the latest Pounce trigger as the news gate).
 * Pass `pack` to skip the disk read (the Slack flow already has it).
 */
export async function generatePageRow(slug: string, pack?: any): Promise<ForPageRow> {
  const demoPack = pack ?? (await loadDemoPack(slug));
  if (!demoPack) throw new Error(`generatePageRow: no demo pack for "${slug}" — build the audit first`);

  const snap = buildSnapshot(demoPack);
  const geo = buildHeroMap(demoPack);
  const latest = await latestForAccount(slug);
  const override = await authorOverride(demoPack, snap, latest ? { title: latest.title, url: latest.url, source: latest.source } : null);

  // The Flow-State render only needs the lean account fields from the pack
  // (buildForContent reads pack.account.*). Strip the heavy network to keep
  // the row small; the full pack rides along as demoPack for /demo.
  const leanPack = { account: demoPack.account };

  return { slug, status: 'live', pack: leanPack, snap, override, geo, demoPack };
}
