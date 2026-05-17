import type { BrowserContext, Page } from 'playwright';
import { resolve } from 'node:path';
import { mkdir, rename, writeFile } from 'node:fs/promises';

/**
 * Open notebooklm.google.com, ensure the user is signed in (waiting up to
 * 5 minutes for the first run's sign-in step), then drive the
 * "create notebook → paste text source → generate Audio Overview" flow.
 *
 * Saves debug snapshots to tmp/nblm-inspect/{stage}.{png,html,txt} on
 * each step so a selector failure can be diagnosed without re-running.
 */
export interface NotebookLMInput {
  /** Browser context (with the open Gemini thread, or fresh). */
  ctx: BrowserContext;
  /**
   * URL of the Gemini deep-research thread to use the "Open in NotebookLM"
   * handoff. Pass an empty string to skip the handoff and use the
   * `fallbackReport` paste-text path directly.
   */
  geminiThreadUrl: string;
  /** Where to write the downloaded mp3. */
  outputPath: string;
  /** Optional source-text payload (the report) to paste into NotebookLM. */
  fallbackReport?: string;
  /** Optional Audio Overview customization prompt. */
  customizationPrompt?: string;
  /** Slug used to namespace debug snapshots. Defaults to "nb-run". */
  debugLabel?: string;
}

export interface NotebookLMOutput {
  /** Final mp3 path on disk (== input.outputPath when the download succeeds). */
  mp3Path: string;
  /** Audio duration in seconds (read from the playback element after generation). */
  durationSeconds: number;
}

export const NOTEBOOK_SELECTORS = {
  openHandoffLink: 'a[href*="notebooklm.google.com"], button:has-text("Open in NotebookLM")',
  // Signed-in indicator — any of these means we're past the sign-in wall
  // AND on the actual NotebookLM dashboard, not a Google OAuth interstitial.
  // Never include selectors that match generic Google pages (no `main`, no
  // `body`, etc) because the OAuth flow passes through notebooklm.google.com
  // briefly before redirecting back to accounts.google.com for the password
  // step.
  signedInIndicators: [
    'button:has-text("Create new")',
    'button:has-text("New notebook")',
    'a:has-text("New notebook")',
    'div:has-text("Recent notebooks")',
    'div:has-text("My Notebooks")',
    'h1:has-text("Notebooks")',
    // NotebookLM uses a Material-style FAB / Add tile for new notebook
    '[aria-label="Create new notebook"]',
    '[aria-label="New notebook"]',
  ],
  // The "Sign in" / "Sign in with Google" indicator that tells us we
  // still need user action.
  signInForm: 'input[type="email"][aria-label*="Email" i], h1:has-text("Sign in"), input#identifierId',
  // Entry points into the create-notebook flow.
  createNotebookCandidates: [
    'button:has-text("Create new")',
    'button:has-text("New notebook")',
    'button:has-text("New")',
    '[aria-label*="Create new" i]',
    '[aria-label*="New notebook" i]',
  ],
  // After "Create new", the source-type chooser opens. Find the
  // paste-text entry. (Modern NotebookLM 2026 has tile-style choices.)
  pasteTextCandidates: [
    'button:has-text("Paste text")',
    'button:has-text("Copied text")',
    '[role="button"]:has-text("Paste text")',
    'div[role="button"]:has-text("Text")',
    'button:has-text("Text"):not(:has-text("YouTube"))',
  ],
  // The paste textarea.
  pasteTextarea: [
    'textarea[aria-label*="paste" i]',
    'textarea[placeholder*="paste" i]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea',
  ],
  insertSourceCandidates: [
    'button:has-text("Insert")',
    'button:has-text("Add")',
    'button:has-text("Upload")',
  ],
  // Audio Overview tile in the Studio panel — clicking this generates
  // with default settings (no customize). Confirmed from live DOM:
  //   div[role="button"][aria-label="Audio Overview"]
  audioOverviewTile: 'div[role="button"][aria-label="Audio Overview"]',
  // Separate "Customize Audio Overview" button next to the tile. Opens a
  // panel with an instructions textarea + its own Generate button.
  customizeAudioButton: 'button[aria-label="Customize Audio Overview"]',
  // Inside the customize panel — selectors vary; not yet locked.
  customizationTextarea: [
    'textarea[aria-label*="instruction" i]',
    'textarea[aria-label*="focus" i]',
    'textarea[placeholder*="What" i]',
  ],
  generateButton: 'button:has-text("Generate")',
  audioElement: 'audio',
  downloadAudioButton: [
    'button[aria-label*="Download" i]',
    'button[aria-label*="More" i]',
    'a[download]',
  ],
};

const DEBUG_DIR = resolve(process.cwd(), 'tmp/nblm-inspect');

async function snapshot(page: Page, label: string): Promise<void> {
  try {
    await mkdir(DEBUG_DIR, { recursive: true });
    await page.screenshot({ path: resolve(DEBUG_DIR, `${label}.png`), fullPage: true });
    const html = await page.content();
    await writeFile(resolve(DEBUG_DIR, `${label}.html`), html, 'utf8');
    const summary = await page.evaluate(() => {
      const out: string[] = [];
      document
        .querySelectorAll('button, [role="button"], [role="menuitem"], textarea, [contenteditable="true"], input')
        .forEach((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) return;
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role') ?? '';
          const aria = el.getAttribute('aria-label') ?? '';
          const text = (el.textContent ?? '').trim().slice(0, 100);
          out.push(`${tag}[role=${role}] aria="${aria}" text="${text}"`);
        });
      return out.join('\n');
    });
    await writeFile(resolve(DEBUG_DIR, `${label}.txt`), summary, 'utf8');
  } catch {
    // Best-effort.
  }
}

/**
 * Click the first selector in `candidates` that is visible. Returns the
 * selector that matched, or null when none did.
 */
async function clickFirstVisible(page: Page, candidates: string[], timeoutPer = 1500): Promise<string | null> {
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: timeoutPer }).catch(() => false)) {
      await loc.click();
      return sel;
    }
  }
  return null;
}

/**
 * Fill the first visible selector in `candidates` with `value`. Returns
 * the selector that matched, or null.
 */
async function fillFirstVisible(
  page: Page,
  candidates: string[],
  value: string,
  timeoutPer = 1500,
): Promise<string | null> {
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: timeoutPer }).catch(() => false)) {
      await loc.fill(value).catch(() => null);
      return sel;
    }
  }
  return null;
}

/**
 * Wait for the user to complete sign-in. Polls every 2s for up to 5 min,
 * looking for any signed-in indicator. Returns when the user is in,
 * throws on timeout.
 */
async function waitForSignedIn(page: Page, debugLabel: string): Promise<void> {
  const deadline = Date.now() + 8 * 60 * 1000;
  let printedPrompt = false;
  while (Date.now() < deadline) {
    const url = page.url();
    // Hard exclusion: if we're on the Google accounts auth flow, we are
    // NOT signed in — never check indicators here. This page can briefly
    // include URL fragments that point at notebooklm.google.com during
    // redirect, so we rely on the host check.
    const onGoogleAccountsAuth = /^https:\/\/accounts\.google\.com\//.test(url);
    const onNotebookLM = /^https:\/\/notebooklm\.google\.com\//.test(url);
    if (onNotebookLM && !onGoogleAccountsAuth) {
      const signInVisible = await page
        .locator(NOTEBOOK_SELECTORS.signInForm)
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (!signInVisible) {
        for (const sel of NOTEBOOK_SELECTORS.signedInIndicators) {
          if (await page.locator(sel).first().isVisible({ timeout: 500 }).catch(() => false)) {
            await snapshot(page, `${debugLabel}-signed-in`);
            return;
          }
        }
      }
    }

    if (!printedPrompt) {
      console.log(
        '⏳ NotebookLM is showing the Google sign-in flow. Sign in to casey@freightroll.com in the Chromium window now — including the password step. Waiting up to 8 minutes...',
      );
      printedPrompt = true;
    }
    await page.waitForTimeout(2500);
  }
  await snapshot(page, `${debugLabel}-signin-timeout`);
  throw new Error('Sign-in did not complete within 8 minutes. Re-run after signing in.');
}

/**
 * Open a new NotebookLM notebook and add the supplied text as a
 * paste-text source. Saves a debug snapshot after every step.
 */
async function openNotebookWithPastedSource(ctx: BrowserContext, source: string, debugLabel: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });

  await waitForSignedIn(page, debugLabel);
  await snapshot(page, `${debugLabel}-01-landing`);

  // Click into the create-new-notebook entry.
  const created = await clickFirstVisible(page, NOTEBOOK_SELECTORS.createNotebookCandidates, 3000);
  console.log(`create-notebook click: ${created ?? 'NONE'}`);
  await page.waitForTimeout(2500);
  await snapshot(page, `${debugLabel}-02-after-create`);

  // Click "Paste text" in the source-type chooser.
  const pasteClicked = await clickFirstVisible(page, NOTEBOOK_SELECTORS.pasteTextCandidates, 5000);
  console.log(`paste-text click: ${pasteClicked ?? 'NONE'}`);
  await page.waitForTimeout(1500);
  await snapshot(page, `${debugLabel}-03-after-paste-click`);

  if (!pasteClicked) {
    throw new Error(
      'NotebookLM paste-text entry not found. See tmp/nblm-inspect/*.txt for visible button list — update NOTEBOOK_SELECTORS.pasteTextCandidates.',
    );
  }

  // Fill the textarea.
  const filled = await fillFirstVisible(page, NOTEBOOK_SELECTORS.pasteTextarea, source, 5000);
  console.log(`paste-text fill: ${filled ?? 'NONE'}`);
  if (!filled) {
    await snapshot(page, `${debugLabel}-04-no-textarea`);
    throw new Error('NotebookLM paste textarea not found. See tmp/nblm-inspect/.');
  }
  await snapshot(page, `${debugLabel}-04-after-fill`);

  // Click Insert / Add to commit.
  const inserted = await clickFirstVisible(page, NOTEBOOK_SELECTORS.insertSourceCandidates, 3000);
  console.log(`insert click: ${inserted ?? 'NONE'}`);
  await page.waitForTimeout(3000);
  await snapshot(page, `${debugLabel}-05-after-insert`);

  return page;
}

/**
 * Drive the Gemini → NotebookLM handoff path (un-tuned accounts only).
 * For hand-tuned accounts the caller passes geminiThreadUrl: '' to skip.
 */
export async function runNotebookLM(input: NotebookLMInput): Promise<NotebookLMOutput> {
  const debugLabel = input.debugLabel ?? 'nb-run';
  let nbPage: Page;
  const useHandoff = input.geminiThreadUrl.length > 0;

  if (useHandoff) {
    const pages = input.ctx.pages();
    const geminiPage =
      pages.find((p) => p.url() === input.geminiThreadUrl) ?? (await input.ctx.newPage());
    if (geminiPage.url() !== input.geminiThreadUrl) {
      await geminiPage.goto(input.geminiThreadUrl, { waitUntil: 'domcontentloaded' });
    }
    const handoff = geminiPage.locator(NOTEBOOK_SELECTORS.openHandoffLink).first();
    if (await handoff.isVisible().catch(() => false)) {
      const [popup] = await Promise.all([
        input.ctx.waitForEvent('page'),
        handoff.click(),
      ]);
      nbPage = popup;
      await waitForSignedIn(nbPage, debugLabel);
    } else {
      if (!input.fallbackReport) {
        throw new Error(
          'NotebookLM handoff missing and no fallbackReport provided — pipeline cannot continue.',
        );
      }
      nbPage = await openNotebookWithPastedSource(input.ctx, input.fallbackReport, debugLabel);
    }
  } else {
    if (!input.fallbackReport) {
      throw new Error('runNotebookLM: empty geminiThreadUrl requires fallbackReport.');
    }
    nbPage = await openNotebookWithPastedSource(input.ctx, input.fallbackReport, debugLabel);
  }

  // Wait for the source to finish ingesting; then trigger Audio Overview.
  await nbPage.waitForTimeout(4000);
  await snapshot(nbPage, `${debugLabel}-06-source-loaded`);

  // Audio Overview generation. Two paths:
  //
  //   1. With customization: click "Customize Audio Overview", fill the
  //      instructions textarea, click Generate inside the panel.
  //   2. Without customization: click the Audio Overview tile directly,
  //      which generates with defaults.
  //
  // The source IS the memo, so even without customization the audio
  // tracks the document. Path 2 is the smoke-test default; path 1 is
  // an opt-in for accounts where we want explicit voice/length steering.
  if (input.customizationPrompt) {
    const customizeBtn = nbPage.locator(NOTEBOOK_SELECTORS.customizeAudioButton).first();
    if (await customizeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await customizeBtn.click();
      await nbPage.waitForTimeout(1500);
      const filled = await fillFirstVisible(
        nbPage,
        NOTEBOOK_SELECTORS.customizationTextarea,
        input.customizationPrompt,
        5_000,
      );
      console.log(`customization fill: ${filled ?? 'NONE'}`);
      await snapshot(nbPage, `${debugLabel}-07-after-customize`);
      // The customize panel has its own Generate. Look within it.
      const genInPanel = await clickFirstVisible(
        nbPage,
        ['button:has-text("Generate")'],
        10_000,
      );
      console.log(`customize-panel generate: ${genInPanel ?? 'NONE'}`);
      if (!genInPanel) {
        await snapshot(nbPage, `${debugLabel}-08-no-generate-in-panel`);
        throw new Error('Customize panel Generate button not found.');
      }
    } else {
      console.log('Customize Audio Overview button not visible; falling back to direct generation.');
      await clickFirstVisible(nbPage, [NOTEBOOK_SELECTORS.audioOverviewTile], 10_000);
    }
  } else {
    // Direct generation — click the Audio Overview tile.
    const clicked = await clickFirstVisible(
      nbPage,
      [NOTEBOOK_SELECTORS.audioOverviewTile],
      15_000,
    );
    console.log(`audio-overview tile click: ${clicked ?? 'NONE'}`);
    if (!clicked) {
      await snapshot(nbPage, `${debugLabel}-08-no-tile`);
      throw new Error('Audio Overview tile not found. See tmp/nblm-inspect/.');
    }
  }
  await snapshot(nbPage, `${debugLabel}-08-after-generate`);

  // Wait up to 30 min for the audio element to attach.
  const audio = nbPage.locator(NOTEBOOK_SELECTORS.audioElement).first();
  await audio.waitFor({ state: 'attached', timeout: 30 * 60 * 1_000 });
  await snapshot(nbPage, `${debugLabel}-09-audio-attached`);

  const durationSeconds = await audio.evaluate((el) =>
    Math.round((el as HTMLAudioElement).duration),
  );

  await mkdir(resolve(input.outputPath, '..'), { recursive: true });
  const [download] = await Promise.all([
    nbPage.waitForEvent('download', { timeout: 60_000 }),
    (async () => {
      const sel = await clickFirstVisible(nbPage, NOTEBOOK_SELECTORS.downloadAudioButton, 5_000);
      if (!sel) throw new Error('Download button not found.');
    })(),
  ]);
  const tmp = await download.path();
  if (!tmp) throw new Error('NotebookLM download produced no local path');
  await rename(tmp, input.outputPath);

  return { mp3Path: input.outputPath, durationSeconds };
}
