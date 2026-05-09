import type { BrowserContext, Page } from 'playwright';
import { resolve } from 'node:path';
import { mkdir, rename } from 'node:fs/promises';

export interface NotebookLMInput {
  /** Browser context (with the open Gemini thread). */
  ctx: BrowserContext;
  /** URL of the Gemini deep-research thread (used to click "Open in NotebookLM"). */
  geminiThreadUrl: string;
  /** Where to write the downloaded mp3. */
  outputPath: string;
  /** Optional source-text payload (the report) to paste into NotebookLM directly
   *  if the "Open in NotebookLM" handoff is missing. */
  fallbackReport?: string;
}

export interface NotebookLMOutput {
  /** Final mp3 path on disk (== input.outputPath when the download succeeds). */
  mp3Path: string;
  /** Audio duration in seconds (read from the playback element after generation). */
  durationSeconds: number;
}

/**
 * Selectors are exported so a Google UI change is a one-line fix rather
 * than a stage rewrite. Update the relevant entry in this object first
 * if a smoke run trips an unexpected timeout.
 */
export const NOTEBOOK_SELECTORS = {
  openHandoffLink: 'a[href*="notebooklm.google.com"], button:has-text("Open in NotebookLM")',
  generateAudioButton: 'button:has-text("Generate")',
  audioElement: 'audio',
  downloadAudioButton: 'button[aria-label*="Download" i], a[download]',
  pasteSourceTextarea: 'textarea[aria-label*="Add source" i], div[contenteditable="true"]',
};

/**
 * Open NotebookLM with the Gemini report as the source, kick off podcast
 * generation, poll up to 30 minutes for the audio element to render, then
 * download the mp3 and re-route it to `input.outputPath`.
 *
 * Hand-off path:
 *   - Preferred: click "Open in NotebookLM" from the Gemini thread (this is
 *     a popup; we wait for the new page event).
 *   - Fallback: if the hand-off link isn't visible (UI change or account
 *     tier without integration), open notebooklm.google.com directly and
 *     paste the `fallbackReport` text into a new source. Throws cleanly
 *     when no fallbackReport is provided so the caller can run --skip-to.
 */
export async function runNotebookLM(input: NotebookLMInput): Promise<NotebookLMOutput> {
  const pages = input.ctx.pages();
  const geminiPage =
    pages.find((p) => p.url() === input.geminiThreadUrl) ?? (await input.ctx.newPage());
  if (geminiPage.url() !== input.geminiThreadUrl) {
    await geminiPage.goto(input.geminiThreadUrl, { waitUntil: 'domcontentloaded' });
  }

  let nbPage: Page;
  const handoff = geminiPage.locator(NOTEBOOK_SELECTORS.openHandoffLink).first();
  if (await handoff.isVisible().catch(() => false)) {
    const [popup] = await Promise.all([
      input.ctx.waitForEvent('page'),
      handoff.click(),
    ]);
    nbPage = popup;
  } else {
    if (!input.fallbackReport) {
      throw new Error(
        'NotebookLM handoff missing and no fallbackReport provided — pipeline cannot continue. ' +
          'Re-run with --skip-to <stage> after manually completing this step.',
      );
    }
    nbPage = await input.ctx.newPage();
    await nbPage.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    const paste = nbPage.locator(NOTEBOOK_SELECTORS.pasteSourceTextarea).first();
    await paste.waitFor({ state: 'visible', timeout: 15_000 });
    await paste.fill(input.fallbackReport);
  }

  // Kick off podcast generation and wait up to 30 minutes for the audio
  // element to attach to the DOM.
  await nbPage.locator(NOTEBOOK_SELECTORS.generateAudioButton).first().click();
  const audio = nbPage.locator(NOTEBOOK_SELECTORS.audioElement).first();
  await audio.waitFor({ state: 'attached', timeout: 30 * 60 * 1_000 });

  // Read duration via in-page evaluation (audio.duration in seconds).
  const durationSeconds = await audio.evaluate((el) =>
    Math.round((el as HTMLAudioElement).duration),
  );

  // Trigger download and re-route the file to outputPath. Playwright's
  // page.waitForEvent('download') captures the next download from the
  // page; pairing it with the click in Promise.all avoids a race where
  // the click's download event fires before the listener attaches.
  await mkdir(resolve(input.outputPath, '..'), { recursive: true });
  const [download] = await Promise.all([
    nbPage.waitForEvent('download', { timeout: 60_000 }),
    nbPage.locator(NOTEBOOK_SELECTORS.downloadAudioButton).first().click(),
  ]);
  const tmp = await download.path();
  if (!tmp) throw new Error('NotebookLM download produced no local path');
  await rename(tmp, input.outputPath);

  return { mp3Path: input.outputPath, durationSeconds };
}
