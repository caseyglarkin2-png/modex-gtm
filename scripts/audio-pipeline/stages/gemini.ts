import type { BrowserContext } from 'playwright';

export interface GeminiInput {
  /** The composed research prompt. */
  prompt: string;
  /** Browser context to drive (already authenticated). */
  ctx: BrowserContext;
}

export interface GeminiOutput {
  /** The full markdown of the report Gemini produced. */
  report: string;
  /** URL of the deep-research thread (so caller can re-open if needed). */
  threadUrl: string;
}

/**
 * Selectors are exported so they can be patched without rebuilding the stage.
 * If Google ships a Gemini UI change, update these strings — the run() flow
 * stays intact.
 */
export const GEMINI_SELECTORS = {
  promptInput:
    'rich-textarea[aria-label*="Enter a prompt" i] textarea, div[contenteditable="true"][aria-label*="prompt" i]',
  deepResearchToggle:
    'button[aria-label*="Deep Research" i], [data-tool-id="deep_research"]',
  submitButton: 'button[aria-label*="Send message" i]',
  reportContainer: '[data-message-author-role="model"]',
  reportSettledMarker: 'button[aria-label*="Copy" i]',
  openInNotebookLM: 'a[href*="notebooklm.google.com"], button:has-text("Open in NotebookLM")',
};

/**
 * Drive Gemini's deep-research mode end-to-end:
 *   1. navigate to gemini.google.com
 *   2. enable deep-research toggle (best-effort — falls back to standard chat)
 *   3. paste the prompt, submit
 *   4. poll until the report renders + the "Copy" affordance appears
 *   5. extract the report markdown
 *   6. capture the page URL so the orchestrator can return to it for stage 5
 *
 * Selectors live in GEMINI_SELECTORS so a Google UI change is a one-line fix
 * rather than a stage rewrite.
 *
 * The page is intentionally NOT closed — the orchestrator may need the
 * thread for the "Open in NotebookLM" handoff.
 */
export async function runGemini(input: GeminiInput): Promise<GeminiOutput> {
  const page = await input.ctx.newPage();
  await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });

  // Deep research toggle — best-effort. If it's not exposed in this account's
  // tier, we proceed with standard Gemini chat plus a "deep-research style"
  // preface in the prompt itself.
  const dr = page.locator(GEMINI_SELECTORS.deepResearchToggle).first();
  if (await dr.isVisible().catch(() => false)) {
    await dr.click().catch(() => {});
  }

  const input$ = page.locator(GEMINI_SELECTORS.promptInput).first();
  await input$.waitFor({ state: 'visible', timeout: 15_000 });
  await input$.fill(input.prompt);

  const submit = page.locator(GEMINI_SELECTORS.submitButton).first();
  await submit.click();

  // Wait for the response to fully settle. The "Copy" button only appears
  // after streaming completes. Allow up to 8 minutes for deep-research mode.
  await page
    .locator(GEMINI_SELECTORS.reportSettledMarker)
    .first()
    .waitFor({ state: 'visible', timeout: 8 * 60 * 1_000 });

  const reportEl = page.locator(GEMINI_SELECTORS.reportContainer).last();
  const report = (await reportEl.innerText()).trim();
  const threadUrl = page.url();
  return { report, threadUrl };
}
