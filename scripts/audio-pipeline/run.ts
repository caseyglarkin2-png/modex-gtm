#!/usr/bin/env tsx
/**
 * Audio pipeline orchestrator.
 *
 *   npm run audio:run -- --account dannon
 *   npm run audio:run -- --account dannon --skip-to chapters
 *   npm run audio:run -- --account dannon --headed
 *
 * Stages run in order: compose → gemini → notebook-lm → chapters → patch → git.
 * Each stage's output is checkpointed; --skip-to <stage> resumes from
 * a captured checkpoint without re-running expensive earlier work.
 */
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { writeFile, readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import type { AccountAudioBrief } from '@/lib/microsites/schema';
import { Checkpoint } from './lib/checkpoint';
import { collectDossiers } from './lib/dossiers';
import { openContext, closeContext } from './lib/browser';
import { composeResearchPrompt } from './stages/compose';
import { runGemini } from './stages/gemini';
import { runNotebookLM } from './stages/notebook-lm';
import {
  buildChapterPrompt,
  parseChaptersFromGemini,
  fallbackEvenSplits,
} from './stages/chapters';
import { patchAccountFile } from './stages/patch';

const STAGES = ['compose', 'gemini', 'notebook-lm', 'chapters', 'patch', 'git'] as const;
type Stage = (typeof STAGES)[number];

interface Args {
  account: string;
  skipTo?: Stage;
  headed: boolean;
}

function parseArgs(argv: string[]): Args {
  let account = '';
  let skipTo: Stage | undefined;
  let headed = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--account') account = argv[++i];
    else if (a === '--skip-to') {
      const v = argv[++i];
      if (!STAGES.includes(v as Stage)) {
        throw new Error(`--skip-to must be one of: ${STAGES.join(', ')}`);
      }
      skipTo = v as Stage;
    } else if (a === '--headed') headed = true;
  }
  if (!account) throw new Error('--account <slug> is required');
  return { account, skipTo, headed };
}

function shouldRun(stage: Stage, skipTo?: Stage): boolean {
  if (!skipTo) return true;
  return STAGES.indexOf(stage) >= STAGES.indexOf(skipTo);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const data = getAccountMicrositeData(args.account);
  if (!data) throw new Error(`unknown account slug: ${args.account}`);

  const root = resolve(homedir(), '.config/yardflow-audio-pipeline');
  const cp = new Checkpoint({ root, account: args.account });
  const repo = process.cwd();

  await cp.appendLog(`run start: account=${args.account} skipTo=${args.skipTo ?? '(none)'}`);

  // 1. Compose
  let prompt: string;
  if (shouldRun('compose', args.skipTo)) {
    const { matches, fallback } = await collectDossiers({
      accountSlug: args.account,
      dossiersDir: resolve(repo, 'docs/research'),
    });
    prompt = composeResearchPrompt({ account: data, dossiers: matches });
    await cp.write('compose', {
      prompt,
      dossierFallback: fallback,
      dossierFiles: matches.map((m) => m.filename),
    });
    await cp.appendLog(`compose: ${matches.length} dossier(s) used, fallback=${fallback}`);
  } else {
    const cached = await cp.read<{ prompt: string }>('compose');
    if (!cached) throw new Error('--skip-to past compose but no compose checkpoint exists');
    prompt = cached.prompt;
  }

  // 2 + 3. Gemini + NotebookLM (browser stages)
  const ctx = await openContext({ headed: args.headed });
  let report: string;
  let threadUrl: string;
  let mp3Path: string;
  let durationSeconds: number;
  try {
    if (shouldRun('gemini', args.skipTo)) {
      const out = await runGemini({ prompt, ctx });
      report = out.report;
      threadUrl = out.threadUrl;
      await cp.write('gemini', out);
      await cp.appendLog('gemini: report captured');
    } else {
      const cached = await cp.read<{ report: string; threadUrl: string }>('gemini');
      if (!cached) throw new Error('--skip-to past gemini but no gemini checkpoint exists');
      report = cached.report;
      threadUrl = cached.threadUrl;
    }

    if (shouldRun('notebook-lm', args.skipTo)) {
      const outputPath = resolve(repo, `public/audio/${args.account}.mp3`);
      const out = await runNotebookLM({
        ctx,
        geminiThreadUrl: threadUrl,
        outputPath,
        fallbackReport: report,
      });
      mp3Path = out.mp3Path;
      durationSeconds = out.durationSeconds;
      await cp.write('notebook-lm', out);
      await cp.appendLog(`notebook-lm: mp3=${mp3Path} duration=${durationSeconds}s`);
    } else {
      const cached = await cp.read<{ mp3Path: string; durationSeconds: number }>('notebook-lm');
      if (!cached) throw new Error('--skip-to past notebook-lm but no notebook-lm checkpoint exists');
      mp3Path = cached.mp3Path;
      durationSeconds = cached.durationSeconds;
    }
  } finally {
    await closeContext(ctx);
  }

  // 4. Chapters
  let chapters: AccountAudioBrief['chapters'];
  let chapterFallbackUsed = false;
  if (shouldRun('chapters', args.skipTo)) {
    // Open a fresh Gemini chat for segmentation (deep-research mode doesn't reliably support follow-ups).
    const ctx2 = await openContext({ headed: args.headed });
    try {
      const out = await runGemini({
        prompt: buildChapterPrompt({ duration: durationSeconds, report }),
        ctx: ctx2,
      });
      const parsed = parseChaptersFromGemini(out.report, { duration: durationSeconds });
      if (parsed) {
        chapters = parsed;
      } else {
        chapters = fallbackEvenSplits({ duration: durationSeconds });
        chapterFallbackUsed = true;
      }
      await cp.write('chapters', { chapters, fallbackUsed: chapterFallbackUsed, raw: out.report });
      await cp.appendLog(`chapters: count=${chapters.length} fallback=${chapterFallbackUsed}`);
    } finally {
      await closeContext(ctx2);
    }
  } else {
    const cached = await cp.read<{ chapters: typeof chapters; fallbackUsed: boolean }>('chapters');
    if (!cached) throw new Error('--skip-to past chapters but no chapters checkpoint exists');
    chapters = cached.chapters;
    chapterFallbackUsed = cached.fallbackUsed;
  }

  // 5. Patch the account file
  if (shouldRun('patch', args.skipTo)) {
    const accountFile = resolve(repo, `src/lib/microsites/accounts/${args.account}.ts`);
    const source = await readFile(accountFile, 'utf8');
    const brief: AccountAudioBrief = {
      src: `/audio/${args.account}.mp3`,
      chapters,
      generatedAt: new Date().toISOString(),
    };
    const next = patchAccountFile({ source, brief });
    await writeFile(accountFile, next, 'utf8');
    await cp.write('patch', { accountFile, brief });
    await cp.appendLog(`patch: ${accountFile} updated`);
  }

  // 6. Git: branch + commit + push + open PR
  if (shouldRun('git', args.skipTo)) {
    const branch = `audio/${args.account}`;
    execSync(`git checkout -b ${branch}`, { cwd: repo, stdio: 'inherit' });
    execSync(
      `git add public/audio/${args.account}.mp3 src/lib/microsites/accounts/${args.account}.ts`,
      { cwd: repo, stdio: 'inherit' },
    );
    const fallbackNote = chapterFallbackUsed
      ? '\n\nNote: chapter timestamps fell back to even splits — please retune by ear before merge.'
      : '';
    execSync(
      `git commit -m "feat(audio): per-account brief for ${data.accountName}${fallbackNote}"`,
      { cwd: repo, stdio: 'inherit' },
    );
    execSync(`git push -u origin ${branch}`, { cwd: repo, stdio: 'inherit' });
    execSync(
      `gh pr create --title "feat(audio): per-account brief for ${data.accountName}" --body "Generated by audio-pipeline. Listen, retune chapter timestamps if needed, then merge."`,
      { cwd: repo, stdio: 'inherit' },
    );
    await cp.appendLog(`git: branch=${branch} pushed + PR opened`);
  }

  await cp.appendLog('run complete');
  console.log(`✓ audio pipeline complete for ${args.account}`);
}

main().catch((err) => {
  console.error('audio pipeline failed:', err);
  process.exit(1);
});
