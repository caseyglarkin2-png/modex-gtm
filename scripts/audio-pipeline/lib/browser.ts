import { chromium, type BrowserContext } from 'playwright';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

export interface BrowserOptions {
  /** When true, opens visible browser so casey@freightroll.com can sign in. */
  headed?: boolean;
}

const PROFILE_DIR = resolve(homedir(), '.config/yardflow-audio-pipeline/profile');

/**
 * Persistent Chromium context scoped to the audio pipeline. First run
 * should be `--headed` so Casey can sign in to Google once; subsequent
 * runs reuse the cookie jar headlessly. Profile directory is intentionally
 * outside the repo so committed code never touches Casey's credentials.
 */
export async function openContext(opts: BrowserOptions = {}): Promise<BrowserContext> {
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !opts.headed,
    viewport: { width: 1280, height: 900 },
    // Match a real desktop UA so Google's anti-automation heuristics don't trip.
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Persist downloads (mp3) into a known directory the orchestrator reads from.
    acceptDownloads: true,
  });
}

export async function closeContext(ctx: BrowserContext): Promise<void> {
  await ctx.close();
}
