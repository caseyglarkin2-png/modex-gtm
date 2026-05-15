/**
 * NotebookLM driver — rewrite (May 2026).
 *
 * Walks: dashboard → Create notebook → Copied text → paste source →
 * Insert → Studio panel → Customize Audio Overview → fill customize →
 * Generate → poll Studio panel until audio is ready → download mp3.
 *
 * Aggressive snap+log on every step so a single-selector regression can
 * be diagnosed from `tmp/nblm-runs/<slug>/` without re-running the full
 * 15-min generation.
 */
import type { BrowserContext, Page, Download } from 'playwright';
import { resolve } from 'node:path';
import { mkdir, writeFile, rename } from 'node:fs/promises';

export interface NotebookLMV2Input {
  ctx: BrowserContext;
  slug: string;
  source: string;
  customizePrompt: string;
  outputAudioPath: string;
  /** Polling cap. Default: 30 minutes. */
  generationTimeoutMs?: number;
}

export interface NotebookLMV2Output {
  audioPath: string;
  durationSeconds: number | null;
}

const SELECTORS = {
  signInForm: 'input[type="email"][aria-label*="Email" i], h1:has-text("Sign in"), input#identifierId',
  // Dashboard
  dashboardCreate: 'button[aria-label="Create notebook"]',
  dashboardCreateAlt: 'button:has-text("Create new")',
  // Source-type chooser modal
  pasteTextOption: 'button:has-text("Copied text")',
  pasteTextOptionAlt: 'button:has-text("Paste text")',
  // Paste panel
  pasteTextarea: 'textarea[aria-label*="paste" i]',
  pasteTextareaAlt: 'textarea',
  insertButton: 'button:has-text("Insert")',
  // Studio panel
  audioOverviewCard: 'div[role="button"][aria-label="Audio Overview"]',
  audioCustomizeChevron: 'button[aria-label="Customize Audio Overview"]',
  // Audio customize modal — confirmed live selectors:
  audioCustomizeTextarea: 'textarea[aria-label*="AI hosts focus" i]',
  audioCustomizeTextareaAlt: 'textarea[aria-label*="hosts" i]',
  audioCustomizeTextareaFallback: 'textarea[placeholder*="yard" i]',
  audioLengthLong: 'button[role="radio"]:has-text("Long")',
  generateButton: 'button:has-text("Generate")',
  // Post-generation
  audioGeneratingIndicator: 'text=/Generating Audio Overview/i',
  audioReadyPlayer: 'audio[src], button[aria-label*="Play" i]',
  // The audio-level More button is the LAST More on the page (after Play +
  // Interactive mode). The notebook-level More appears first in the DOM.
  audioMoreMenu: 'button[aria-label="More"]',
  audioDownloadMenuItem: '[role="menuitem"]:has-text("Download")',
};

async function snap(page: Page, slug: string, label: string): Promise<void> {
  const outDir = resolve(process.cwd(), `tmp/nblm-runs/${slug}`);
  await mkdir(outDir, { recursive: true });
  await page.screenshot({ path: resolve(outDir, `${label}.png`), fullPage: false }).catch(() => {});
  await writeFile(resolve(outDir, `${label}.html`), await page.content(), 'utf8').catch(() => {});
  const summary = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, [role="button"], textarea, [contenteditable="true"], audio, video, a[href*="notebook"]').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') ?? '';
      const aria = el.getAttribute('aria-label') ?? '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100);
      out.push(`${tag} role="${role}" aria="${aria}" text="${text}"`);
    });
    return out.join('\n');
  });
  await writeFile(resolve(outDir, `${label}.txt`), summary, 'utf8').catch(() => {});
  console.log(`[snap] ${slug}/${label}`);
}

async function tryClick(page: Page, selectors: string[], label: string, timeoutMs = 8000): Promise<boolean> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: timeoutMs }).catch(() => false)) {
      console.log(`[click ${label}] ${sel}`);
      await loc.click().catch((e) => console.log(`  click error: ${e}`));
      return true;
    }
  }
  console.log(`[click ${label}] NO MATCH among ${selectors.length} selectors`);
  return false;
}

export async function runNotebookLMV2(input: NotebookLMV2Input): Promise<NotebookLMV2Output> {
  const { ctx, slug, source, customizePrompt, outputAudioPath } = input;
  const timeoutMs = input.generationTimeoutMs ?? 30 * 60 * 1000;

  const page = await ctx.newPage();
  console.log(`[run ${slug}] start`);
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await snap(page, slug, '01-landing');

  // Sign-in detection
  if (await page.locator(SELECTORS.signInForm).first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await snap(page, slug, '01b-signin-required');
    throw new Error('SIGN_IN_REQUIRED: re-run with --headed to authenticate.');
  }

  // 1. Create notebook
  if (!(await tryClick(page, [SELECTORS.dashboardCreate, SELECTORS.dashboardCreateAlt], 'create-notebook'))) {
    await snap(page, slug, 'err-no-create-button');
    throw new Error('No create-notebook button found on dashboard');
  }
  await page.waitForTimeout(3000);
  await snap(page, slug, '02-create-modal');

  // 2. Paste-text option
  if (!(await tryClick(page, [SELECTORS.pasteTextOption, SELECTORS.pasteTextOptionAlt], 'paste-text'))) {
    await snap(page, slug, 'err-no-paste-option');
    throw new Error('No paste-text option in source chooser');
  }
  await page.waitForTimeout(2500);
  await snap(page, slug, '03-paste-panel');

  // 3. Fill paste textarea
  const pasteLoc = page.locator(SELECTORS.pasteTextarea).first();
  let pasteOK = false;
  if (await pasteLoc.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pasteLoc.fill(source);
    pasteOK = true;
  } else {
    // Fallback to any textarea
    const fallback = page.locator('textarea').first();
    if (await fallback.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fallback.fill(source);
      pasteOK = true;
    }
  }
  if (!pasteOK) {
    await snap(page, slug, 'err-no-paste-textarea');
    throw new Error('No paste textarea found');
  }
  await page.waitForTimeout(1500);
  await snap(page, slug, '04-paste-filled');

  // 4. Click Insert
  if (!(await tryClick(page, [SELECTORS.insertButton], 'insert'))) {
    await snap(page, slug, 'err-no-insert');
    throw new Error('No Insert button found');
  }

  // 5. Wait for studio panel (Audio Overview tile must appear)
  await page.locator(SELECTORS.audioOverviewCard).first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(5000);
  await snap(page, slug, '05-studio-ready');

  // 6. Click Customize Audio Overview chevron (NOT the main tile — that immediately generates without customize)
  if (!(await tryClick(page, [SELECTORS.audioCustomizeChevron], 'audio-customize-chevron'))) {
    await snap(page, slug, 'err-no-customize-chevron');
    throw new Error('No Customize Audio Overview chevron found');
  }
  await page.waitForTimeout(3000);
  await snap(page, slug, '06-audio-customize-modal');

  // 7a. Set length to Long for a 15-20 min episode (Default is shorter).
  const longClicked = await tryClick(page, [SELECTORS.audioLengthLong], 'length-long', 3000);
  if (longClicked) await page.waitForTimeout(500);

  // 7b. Fill the customize textarea inside the modal.
  let customizeOK = false;
  for (const sel of [
    SELECTORS.audioCustomizeTextarea,
    SELECTORS.audioCustomizeTextareaAlt,
    SELECTORS.audioCustomizeTextareaFallback,
    'div[role="dialog"] textarea',
    '[aria-modal="true"] textarea',
  ]) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loc.fill(customizePrompt);
      console.log(`[fill customize] ${sel}`);
      customizeOK = true;
      break;
    }
  }
  if (!customizeOK) {
    await snap(page, slug, 'err-no-customize-textarea');
    throw new Error('No audio customize textarea found in modal');
  }
  await page.waitForTimeout(1500);
  await snap(page, slug, '07-customize-filled');

  // 8. Click Generate
  if (!(await tryClick(page, [SELECTORS.generateButton], 'generate-audio'))) {
    await snap(page, slug, 'err-no-generate');
    throw new Error('No Generate button found in customize modal');
  }
  await page.waitForTimeout(5000);
  await snap(page, slug, '08-after-generate');

  // 9. Poll for audio completion. Audio takes 5-15 minutes typically.
  const start = Date.now();
  let done = false;
  while (Date.now() - start < timeoutMs) {
    const elapsedMin = Math.floor((Date.now() - start) / 60000);

    // Check for a play button or an <audio> element appearing in the Studio panel.
    const hasAudioPlayer = await page.locator('audio[src]').first().isVisible({ timeout: 1000 }).catch(() => false);
    const hasPlayButton = await page.locator('button[aria-label*="Play" i]').first().isVisible({ timeout: 1000 }).catch(() => false);
    const hasMoreButton = await page.locator('button[aria-label*="More options" i]').first().isVisible({ timeout: 1000 }).catch(() => false);

    if (hasAudioPlayer || hasPlayButton) {
      console.log(`[poll ${slug}] audio ready after ${elapsedMin} min`);
      done = true;
      break;
    }

    // Heartbeat snap every 2 minutes for diagnostics.
    if (elapsedMin > 0 && elapsedMin % 2 === 0) {
      await snap(page, slug, `09-poll-${elapsedMin}m`);
    }

    console.log(`[poll ${slug}] elapsed=${elapsedMin}m, no audio yet (player=${hasAudioPlayer} play=${hasPlayButton} more=${hasMoreButton})`);
    await page.waitForTimeout(30000);
  }
  if (!done) {
    await snap(page, slug, 'err-poll-timeout');
    throw new Error(`Audio generation did not complete within ${timeoutMs / 60000} min`);
  }
  await snap(page, slug, '10-audio-ready');

  // 10. Download. Try multiple paths to trigger the download.
  let download: Download | null = null;
  try {
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    // Audio-level More is the LAST More button on the page (after Play +
    // Interactive mode controls). Notebook-level More is first.
    await page.locator(SELECTORS.audioMoreMenu).last().click();
    await page.waitForTimeout(1500);
    await snap(page, slug, '11-more-menu');
    await page.locator(SELECTORS.audioDownloadMenuItem).first().click();
    download = await downloadPromise;
  } catch (e) {
    console.log(`[download ${slug}] capture failed: ${e}`);
    await snap(page, slug, 'err-download-capture');
    throw new Error('Could not capture audio download');
  }

  if (!download) {
    throw new Error('Download event fired but no Download object received');
  }
  await mkdir(resolve(outputAudioPath, '..'), { recursive: true });
  const tmp = await download.path();
  if (!tmp) throw new Error('Download path empty');
  await rename(tmp, outputAudioPath);
  console.log(`[download ${slug}] saved to ${outputAudioPath}`);

  await snap(page, slug, '12-done');
  return { audioPath: outputAudioPath, durationSeconds: null };
}
