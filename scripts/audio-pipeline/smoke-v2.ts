#!/usr/bin/env tsx
/**
 * Smoke test for the v2 NotebookLM stage.
 *
 *   npx tsx scripts/audio-pipeline/smoke-v2.ts kroger
 *
 * Reads ~/Downloads/<slug>-notebooklm-source.md and
 * ~/Downloads/<slug>-notebooklm-customize.txt, drives the full
 * audio-generation flow, and writes public/audio/<slug>.m4a.
 *
 * Does not patch the account file or open a PR — that comes after the
 * end-to-end flow is proven on the smoke target.
 */
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { openContext, closeContext } from './lib/browser';
import { runNotebookLMV2 } from './stages/notebook-lm-v2';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: smoke-v2.ts <slug>');
  process.exit(1);
}

const sourcePath = resolve(homedir(), 'Downloads', `${slug}-notebooklm-source.md`);
const customizePath = resolve(homedir(), 'Downloads', `${slug}-notebooklm-customize.txt`);

const source = readFileSync(sourcePath, 'utf8');
const customize = readFileSync(customizePath, 'utf8');

const outputAudio = resolve(process.cwd(), `public/audio/${slug}.m4a`);

async function main() {
  console.log(`[smoke] slug=${slug}`);
  console.log(`[smoke] source=${sourcePath} (${source.length} chars)`);
  console.log(`[smoke] customize=${customizePath} (${customize.length} chars)`);
  console.log(`[smoke] output=${outputAudio}`);

  const ctx = await openContext({ headed: false });
  try {
    const out = await runNotebookLMV2({
      ctx,
      slug,
      source,
      customizePrompt: customize,
      outputAudioPath: outputAudio,
      generationTimeoutMs: 25 * 60 * 1000,
    });
    console.log(`[smoke] SUCCESS audio=${out.audioPath}`);
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error(`[smoke] FAILED: ${e}`);
  process.exit(1);
});
