#!/usr/bin/env tsx
/**
 * Dumps the NotebookLM source.md + customize.txt pair for one or all
 * accounts into ~/Downloads/. The pair is exactly what the user pastes
 * into NotebookLM (source + customize panel) to generate the per-account
 * audio + video.
 *
 *   npx tsx scripts/audio-pipeline/dump-notebooklm.ts            # all
 *   npx tsx scripts/audio-pipeline/dump-notebooklm.ts kroger     # one
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { composeFromMemo } from './stages/compose-from-memo';
import {
  getAccountMicrositeData,
  getAllMicrositeSlugs,
} from '@/lib/microsites/accounts';

const downloads = resolve(homedir(), 'Downloads');
mkdirSync(downloads, { recursive: true });

const args = process.argv.slice(2);
const slugs = args.length > 0 ? args : getAllMicrositeSlugs();

let ok = 0;
for (const slug of slugs) {
  const data = getAccountMicrositeData(slug);
  if (!data) {
    process.stderr.write(`skip: unknown slug ${slug}\n`);
    continue;
  }
  const { source, customizationPrompt } = composeFromMemo(data);
  const srcPath = resolve(downloads, `${slug}-notebooklm-source.md`);
  const cstPath = resolve(downloads, `${slug}-notebooklm-customize.txt`);
  writeFileSync(srcPath, source, 'utf8');
  writeFileSync(cstPath, customizationPrompt, 'utf8');
  process.stdout.write(`${slug}: ${srcPath} + ${cstPath}\n`);
  ok++;
}
process.stdout.write(`\ndone: ${ok}/${slugs.length} accounts dumped to ${downloads}\n`);
