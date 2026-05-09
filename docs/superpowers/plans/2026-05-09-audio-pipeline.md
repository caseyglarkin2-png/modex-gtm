# Audio Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright-driven script that produces an account-specific NotebookLM-quality audio brief and patches it into a per-account memo, replacing the canonical placeholder.

**Architecture:** Single Node + tsx driver script (`scripts/audio-pipeline/run.ts`) sequences pure-function stages (compose, chapters, patch) and browser-driven stages (gemini, notebook-lm). Pure stages are unit-tested with vitest; browser stages are integration-only with checkpoint-based resumability. Per-account override flows through a new optional `audioBrief` field on `AccountMicrositeData`; the rendered page already reads `src` / `chapters` / `heading` / `intro` props on `MemoAudioBrief`.

**Tech Stack:** TypeScript, tsx (Node ESM execution), Playwright (chromium with persistent user-data-dir for casey@freightroll.com session), zod (Gemini chapter JSON validation), TypeScript compiler API (account file AST patching), vitest (unit tests).

**Out of scope:** V2 roadmap items (#46 Live Ticker, #45 Detention Clock, #48 Editorial style guide) — each gets its own spec+plan when the audio pipeline ships.

---

## File Structure

**Create:**
- `scripts/audio-pipeline/run.ts` — entry-point orchestration
- `scripts/audio-pipeline/stages/compose.ts` — prompt assembly (pure)
- `scripts/audio-pipeline/stages/gemini.ts` — Playwright deep-research flow (browser)
- `scripts/audio-pipeline/stages/notebook-lm.ts` — Playwright podcast-generation flow (browser)
- `scripts/audio-pipeline/stages/chapters.ts` — segmentation prompt + zod parse (pure logic + browser submission)
- `scripts/audio-pipeline/stages/patch.ts` — TS AST edit of `accounts/<slug>.ts` (pure)
- `scripts/audio-pipeline/lib/dossiers.ts` — glob + slug-fuzzy-match + concat
- `scripts/audio-pipeline/lib/checkpoint.ts` — per-stage state read/write
- `scripts/audio-pipeline/lib/browser.ts` — persistent Playwright context factory
- `scripts/audio-pipeline/README.md` — bootstrap + usage
- `tests/unit/audio-pipeline-compose.test.ts`
- `tests/unit/audio-pipeline-chapters.test.ts`
- `tests/unit/audio-pipeline-patch.test.ts`
- `tests/unit/audio-pipeline-dossiers.test.ts`
- `tests/unit/audio-pipeline-checkpoint.test.ts`

**Modify:**
- `src/lib/microsites/schema.ts` — add `AccountAudioBrief` + `AccountMicrositeData.audioBrief?`
- `src/app/for/[account]/page.tsx` — pass per-account override (3-line change)
- `package.json` — add `playwright` + `zod` if not already present; add `audio:run` script

**Test fixtures:**
- `tests/fixtures/audio-pipeline/account-without-audio.ts`
- `tests/fixtures/audio-pipeline/account-with-audio.ts`
- `tests/fixtures/audio-pipeline/dossier-paul-gallagher-generalmills.md`

---

## Task 1: Add `AccountAudioBrief` to the schema

**Files:**
- Modify: `src/lib/microsites/schema.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/microsite-memo-audio-brief.test.tsx` (the existing test file from PR #50 already imports `AudioChapter`):

```ts
// near the top, after existing imports
import type { AccountMicrositeData, AccountAudioBrief } from '@/lib/microsites/schema';

// new describe block at the bottom
describe('AccountAudioBrief schema', () => {
  it('AccountMicrositeData accepts an audioBrief override', () => {
    const audioBrief: AccountAudioBrief = {
      src: '/audio/dannon.mp3',
      chapters: [
        { id: 'thesis', label: 'The thesis', start: 0 },
        { id: 'beats', label: 'Cold-chain beats', start: 60 },
      ],
      heading: 'Listen, Heiko',
      intro: 'A custom intro for Dannon.',
      generatedAt: '2026-05-10T14:00:00Z',
    };
    // Assignability test — fails to compile if the field isn't on the type.
    const data: Partial<AccountMicrositeData> = { audioBrief };
    expect(data.audioBrief?.src).toBe('/audio/dannon.mp3');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json`
Expected: FAIL — `Module ... has no exported member 'AccountAudioBrief'` and `'audioBrief' does not exist in type 'AccountMicrositeData'`.

- [ ] **Step 3: Add the type and field**

Edit `src/lib/microsites/schema.ts`. At the top of the file, add the import (the type is defined in `memo-audio-brief.tsx`):

```ts
import type { AudioChapter } from '@/components/microsites/memo-audio-brief';
```

Define `AccountAudioBrief` immediately above `AccountMicrositeData` (find the `export interface AccountMicrositeData` line):

```ts
export interface AccountAudioBrief {
  /** mp3 path under /public; if absent, page falls back to canonical AUDIO_BRIEF_SRC. */
  src: string;
  /** Chapter list specific to this account's audio. */
  chapters: AudioChapter[];
  /** Optional account-specific heading override. Falls back to component default. */
  heading?: string;
  /** Optional account-specific intro override. */
  intro?: string;
  /** ISO timestamp when this audio was generated. Used by audit / regen flows. */
  generatedAt: string;
}
```

Add the optional field inside `AccountMicrositeData`:

```ts
  /** When present, replaces the canonical audio brief on this account's memo. */
  audioBrief?: AccountAudioBrief;
```

- [ ] **Step 4: Run typecheck + test to verify pass**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json && npx --no-install vitest run tests/unit/microsite-memo-audio-brief.test.tsx --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: tsc exits clean, vitest reports 10/10 passing (the existing 9 + the new one).

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git checkout -b feat/audio-pipeline
git add src/lib/microsites/schema.ts tests/unit/microsite-memo-audio-brief.test.tsx
git commit -m "feat(schema): add optional AccountAudioBrief override

Adds AccountAudioBrief and AccountMicrositeData.audioBrief? — the
per-account override channel that the audio pipeline writes to. No
runtime change yet; existing accounts (no audioBrief field) keep
serving the canonical mp3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Wire per-account override into the page

**Files:**
- Modify: `src/app/for/[account]/page.tsx`
- Test: covered by an integration check; no unit test added (the page is a server component; testing it requires the full app render harness)

- [ ] **Step 1: Locate the existing `<MemoAudioBrief>` call site**

Run: `grep -n "MemoAudioBrief" /mnt/c/Users/casey/modex-gtm/src/app/for/\[account\]/page.tsx`
Expected: one match showing the JSX element.

- [ ] **Step 2: Replace the static prop pass with per-account resolution**

Find this block in `src/app/for/[account]/page.tsx`:

```tsx
        <MemoAudioBrief
          src={AUDIO_BRIEF_SRC}
          chapters={AUDIO_BRIEF_CHAPTERS}
          accentColor={data.theme?.accentColor}
          expectedDuration={AUDIO_BRIEF_DURATION}
        />
```

Replace with:

```tsx
        <MemoAudioBrief
          src={data.audioBrief?.src ?? AUDIO_BRIEF_SRC}
          chapters={data.audioBrief?.chapters ?? AUDIO_BRIEF_CHAPTERS}
          heading={data.audioBrief?.heading}
          intro={data.audioBrief?.intro}
          accentColor={data.theme?.accentColor}
          expectedDuration={data.audioBrief ? undefined : AUDIO_BRIEF_DURATION}
        />
```

- [ ] **Step 3: Run typecheck**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json`
Expected: clean exit.

- [ ] **Step 4: Run unit tests to confirm no regression**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/microsite-memo-audio-brief.test.tsx tests/unit/microsite-memo-section.test.tsx --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: all tests pass; the page-level resolution doesn't change the canonical-path tests because no account fixture has `audioBrief` set yet.

- [ ] **Step 5: Commit**

```bash
git add src/app/for/\[account\]/page.tsx
git commit -m "feat(memo): per-account audio brief override at the page layer

Page now reads data.audioBrief and falls through to canonical defaults
when absent. expectedDuration only carries when there's no override
(per-account mp3 metadata loads on its own).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Dossier collector library

**Files:**
- Create: `scripts/audio-pipeline/lib/dossiers.ts`
- Test: `tests/unit/audio-pipeline-dossiers.test.ts`
- Fixtures: `tests/fixtures/audio-pipeline/dossiers/` (directory of mock dossier files)

- [ ] **Step 1: Create fixtures directory + 3 mock dossiers**

Create `tests/fixtures/audio-pipeline/dossiers/paul-gallagher-generalmills-dossier.md`:

```markdown
# Sales Intelligence Dossier: Paul Gallagher — General Mills
**Target:** Paul Gallagher, Chief Supply Chain Officer
35+ years supply chain, ex-Diageo, runs 18,000-person team.
```

Create `tests/fixtures/audio-pipeline/dossiers/dan-poland-campbells-dossier.md`:

```markdown
# Sales Intelligence Dossier: Dan Poland — Campbell's
**Target:** Dan Poland, VP Supply Chain
```

Create `tests/fixtures/audio-pipeline/dossiers/somebody-toyota-dossier.md`:

```markdown
# Sales Intelligence Dossier: Somebody — Toyota
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/audio-pipeline-dossiers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { collectDossiers } from '@/scripts/audio-pipeline/lib/dossiers';

const FIXTURES = resolve(__dirname, '../fixtures/audio-pipeline/dossiers');

describe('collectDossiers', () => {
  it('matches dossier filenames to account slugs after hyphen-strip + lowercase normalization', async () => {
    const out = await collectDossiers({ accountSlug: 'general-mills', dossiersDir: FIXTURES });
    expect(out.matches).toHaveLength(1);
    expect(out.matches[0].path).toContain('paul-gallagher-generalmills-dossier.md');
    expect(out.matches[0].body).toContain('Paul Gallagher');
  });

  it('matches "campbell-s" account slug to "campbells" dossier filename', async () => {
    const out = await collectDossiers({ accountSlug: 'campbell-s', dossiersDir: FIXTURES });
    expect(out.matches).toHaveLength(1);
    expect(out.matches[0].path).toContain('dan-poland-campbells-dossier.md');
  });

  it('returns empty matches when no dossier exists for the account', async () => {
    const out = await collectDossiers({ accountSlug: 'dannon', dossiersDir: FIXTURES });
    expect(out.matches).toEqual([]);
    expect(out.fallback).toBe(true);
  });

  it('returns multiple matches when an account has more than one person dossier', async () => {
    // Add a second toyota dossier on the fly
    const fs = await import('node:fs/promises');
    const second = resolve(FIXTURES, 'another-person-toyota-dossier.md');
    await fs.writeFile(second, '# Second Toyota dossier\n', 'utf8');
    try {
      const out = await collectDossiers({ accountSlug: 'toyota', dossiersDir: FIXTURES });
      expect(out.matches).toHaveLength(2);
    } finally {
      await fs.unlink(second);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-dossiers.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the collector**

Create `scripts/audio-pipeline/lib/dossiers.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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
 * Find dossier files whose filename includes the account slug after
 * normalization (hyphen-strip + lowercase). Dossier filenames use loose
 * slugs ("kdp", "abinbev", "campbells", "generalmills") that don't match
 * modex-gtm account slugs verbatim — normalization bridges that.
 */
export async function collectDossiers(opts: CollectDossiersOptions): Promise<CollectDossiersResult> {
  const target = normalize(opts.accountSlug);
  let entries: string[];
  try {
    entries = await readdir(opts.dossiersDir);
  } catch {
    return { matches: [], fallback: true };
  }
  const candidates = entries.filter((name) => name.endsWith('-dossier.md'));
  const matches: DossierMatch[] = [];
  for (const filename of candidates) {
    const filenameNorm = normalize(filename.replace(/-dossier\.md$/, ''));
    if (filenameNorm.includes(target)) {
      const path = resolve(opts.dossiersDir, filename);
      const body = await readFile(path, 'utf8');
      matches.push({ path, filename, body });
    }
  }
  return { matches, fallback: matches.length === 0 };
}

function normalize(slug: string): string {
  return slug.replace(/-/g, '').toLowerCase();
}
```

- [ ] **Step 5: Run test, fix any path-alias issue, then verify pass + commit**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-dossiers.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: 4/4 passing.

If the test imports fail with a path-alias error, check `tsconfig.json` for the `@/scripts/*` path mapping — if absent, add `"@/scripts/*": ["./scripts/*"]` under `compilerOptions.paths`.

```bash
git add scripts/audio-pipeline/lib/dossiers.ts tests/unit/audio-pipeline-dossiers.test.ts tests/fixtures/audio-pipeline/dossiers/
git commit -m "feat(audio-pipeline): dossier collector with fuzzy slug match

Globs docs/research/*-dossier.md, normalizes slugs (hyphen-strip +
lowercase) to bridge dossier filenames (generalmills, kdp, abinbev)
and modex-gtm account slugs (general-mills, keurig-dr-pepper,
ab-inbev). Returns matches + fallback flag for missing-dossier path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Checkpoint library (per-stage state)

**Files:**
- Create: `scripts/audio-pipeline/lib/checkpoint.ts`
- Test: `tests/unit/audio-pipeline-checkpoint.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/audio-pipeline-checkpoint.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Checkpoint } from '@/scripts/audio-pipeline/lib/checkpoint';

let tmp: string;
beforeEach(async () => { tmp = await mkdtemp(resolve(tmpdir(), 'cp-')); });
afterEach(async () => { await rm(tmp, { recursive: true, force: true }); });

describe('Checkpoint', () => {
  it('write + read roundtrips a stage payload', async () => {
    const cp = new Checkpoint({ root: tmp, account: 'dannon' });
    await cp.write('compose', { prompt: 'hello' });
    const read = await cp.read<{ prompt: string }>('compose');
    expect(read).toEqual({ prompt: 'hello' });
  });

  it('returns null when a stage has not been written', async () => {
    const cp = new Checkpoint({ root: tmp, account: 'dannon' });
    expect(await cp.read('compose')).toBeNull();
  });

  it('isolates payloads by account slug', async () => {
    const a = new Checkpoint({ root: tmp, account: 'dannon' });
    const b = new Checkpoint({ root: tmp, account: 'general-mills' });
    await a.write('compose', { prompt: 'A' });
    await b.write('compose', { prompt: 'B' });
    expect(await a.read('compose')).toEqual({ prompt: 'A' });
    expect(await b.read('compose')).toEqual({ prompt: 'B' });
  });

  it('appendLog writes timestamped lines to runs/<account>/run.log', async () => {
    const cp = new Checkpoint({ root: tmp, account: 'dannon' });
    await cp.appendLog('starting');
    await cp.appendLog('done');
    const log = await cp.readLog();
    expect(log).toMatch(/starting/);
    expect(log).toMatch(/done/);
    // Each line prefixed with ISO timestamp
    expect(log.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g)?.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-checkpoint.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Checkpoint**

Create `scripts/audio-pipeline/lib/checkpoint.ts`:

```ts
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface CheckpointOptions {
  /** Root directory for all per-account state, e.g. ~/.config/yardflow-audio-pipeline */
  root: string;
  /** Account slug (used to scope state). */
  account: string;
}

/**
 * Per-stage state store. Each stage of the pipeline writes its output to
 * `<root>/runs/<account>/<stage>.json` so the next stage can read it
 * without re-running expensive work (Gemini deep research, NotebookLM
 * podcast generation). Failures resume from checkpoint via --skip-to.
 */
export class Checkpoint {
  private readonly dir: string;
  constructor(opts: CheckpointOptions) {
    this.dir = resolve(opts.root, 'runs', opts.account);
  }

  async write<T>(stage: string, payload: T): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.path(stage), JSON.stringify(payload, null, 2), 'utf8');
  }

  async read<T = unknown>(stage: string): Promise<T | null> {
    try {
      const raw = await readFile(this.path(stage), 'utf8');
      return JSON.parse(raw) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async appendLog(line: string): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const ts = new Date().toISOString();
    await appendFile(resolve(this.dir, 'run.log'), `${ts} ${line}\n`, 'utf8');
  }

  async readLog(): Promise<string> {
    try {
      return await readFile(resolve(this.dir, 'run.log'), 'utf8');
    } catch {
      return '';
    }
  }

  private path(stage: string): string {
    return resolve(this.dir, `${stage}.json`);
  }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-checkpoint.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: 4/4 passing.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/lib/checkpoint.ts tests/unit/audio-pipeline-checkpoint.test.ts
git commit -m "feat(audio-pipeline): per-stage checkpoint store

Scopes per-account state under <root>/runs/<account>/<stage>.json so
expensive stages (Gemini deep research, NotebookLM podcast) don't
re-run on partial failures. Includes a per-account run.log for
post-mortem.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Compose stage (research prompt assembly)

**Files:**
- Create: `scripts/audio-pipeline/stages/compose.ts`
- Test: `tests/unit/audio-pipeline-compose.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/audio-pipeline-compose.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { composeResearchPrompt } from '@/scripts/audio-pipeline/stages/compose';
import type { AccountMicrositeData } from '@/lib/microsites/schema';

const dannon: Partial<AccountMicrositeData> = {
  slug: 'dannon',
  accountName: 'Dannon',
  vertical: 'CPG / yogurt',
  network: { facilityCount: 13, facilityArchetypes: ['plant', 'dc'] } as AccountMicrositeData['network'],
};

describe('composeResearchPrompt', () => {
  it('returns a prompt that names the account, vertical, and facility footprint', () => {
    const prompt = composeResearchPrompt({ account: dannon as AccountMicrositeData, dossiers: [] });
    expect(prompt).toContain('Dannon');
    expect(prompt).toContain('CPG / yogurt');
    expect(prompt).toContain('13');
  });

  it('embeds dossier bodies under a clearly-marked section when present', () => {
    const prompt = composeResearchPrompt({
      account: dannon as AccountMicrositeData,
      dossiers: [
        { path: '/x', filename: 'a.md', body: 'DOSSIER ONE BODY' },
        { path: '/y', filename: 'b.md', body: 'DOSSIER TWO BODY' },
      ],
    });
    expect(prompt).toContain('DOSSIER ONE BODY');
    expect(prompt).toContain('DOSSIER TWO BODY');
    expect(prompt.toLowerCase()).toContain('research dossier');
  });

  it('flags missing-dossier fallback explicitly so the LLM knows it is doing its own discovery', () => {
    const prompt = composeResearchPrompt({ account: dannon as AccountMicrositeData, dossiers: [] });
    expect(prompt.toLowerCase()).toContain('no internal dossier');
  });

  it('asks for a 7-minute spoken-form output (matches NotebookLM target length)', () => {
    const prompt = composeResearchPrompt({ account: dannon as AccountMicrositeData, dossiers: [] });
    expect(prompt).toMatch(/7[ -]minute|seven[ -]minute/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-compose.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement composeResearchPrompt**

Create `scripts/audio-pipeline/stages/compose.ts`:

```ts
import type { AccountMicrositeData } from '@/lib/microsites/schema';
import type { DossierMatch } from '../lib/dossiers';

export interface ComposeInput {
  account: AccountMicrositeData;
  dossiers: DossierMatch[];
}

/**
 * Build the deep-research prompt that's submitted to Gemini. Layered:
 *
 *   1. Role + framing (analyst, private memo register).
 *   2. Account facts (name, vertical, network shape).
 *   3. Internal dossier bodies, if any — Gemini extends rather than re-derives.
 *   4. Output spec — 7-minute spoken form, anti-sales register, five beats.
 */
export function composeResearchPrompt(input: ComposeInput): string {
  const { account, dossiers } = input;
  const facilityCount = account.network?.facilityCount;
  const archetypes = account.network?.facilityArchetypes?.join(' + ') ?? 'mixed';
  const facilityLine = facilityCount
    ? `${facilityCount}-facility footprint (${archetypes})`
    : `unknown facility count (archetypes: ${archetypes})`;

  const dossierBlock = dossiers.length
    ? [
        '## Internal research dossiers',
        '',
        'These were prepared by our team. Extend rather than re-derive — assume these facts are already known.',
        '',
        ...dossiers.map((d) => `### ${d.filename}\n\n${d.body.trim()}\n`),
      ].join('\n')
    : '## Internal research dossiers\n\n(no internal dossier on file — do your own discovery, no need to flag the gap)';

  return [
    'You are an analyst preparing a private 7-minute spoken brief for an executive at the named account. Match the register of a private memorandum: anti-sales, observational, citation-grounded, willing to be wrong out loud.',
    '',
    '## Account',
    `- Name: ${account.accountName}`,
    `- Vertical: ${account.vertical ?? 'unknown'}`,
    `- Network shape: ${facilityLine}`,
    '',
    dossierBlock,
    '',
    '## Output',
    'Produce a deep-research report covering:',
    '1. Yard execution as a network constraint at this account specifically',
    '2. What the legacy YMS world misses about networks of this archetype',
    '3. The gap between site-level optimization and network-level coordination',
    '4. What 237 comparable facilities have taught about this gap',
    '5. The first concrete step the executive could take tomorrow',
    '',
    'Keep it to ~7 minutes spoken (roughly 1,000–1,200 words). Cite where possible. End with the single most important thing for this executive to internalize.',
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-compose.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: 4/4 passing.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/stages/compose.ts tests/unit/audio-pipeline-compose.test.ts
git commit -m "feat(audio-pipeline): research prompt composer

Builds the Gemini deep-research prompt from account data + internal
dossiers. Embeds dossier bodies verbatim under a marked section so
Gemini extends rather than re-derives. Output spec asks for ~7-min
spoken form matching the canonical brief's length.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Chapters stage (parse + fallback)

**Files:**
- Create: `scripts/audio-pipeline/stages/chapters.ts`
- Test: `tests/unit/audio-pipeline-chapters.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/audio-pipeline-chapters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  parseChaptersFromGemini,
  fallbackEvenSplits,
  buildChapterPrompt,
} from '@/scripts/audio-pipeline/stages/chapters';

describe('parseChaptersFromGemini', () => {
  it('parses a clean JSON array into AudioChapter[]', () => {
    const out = parseChaptersFromGemini(
      JSON.stringify([
        { id: 'thesis', label: 'The thesis', start: 0 },
        { id: 'beats', label: 'Cold-chain beats', start: 60 },
      ]),
      { duration: 432 },
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ id: 'thesis', label: 'The thesis', start: 0 });
  });

  it('strips a leading code-fence wrapper from the model output', () => {
    const wrapped = '```json\n[{"id":"a","label":"A","start":0}]\n```';
    const out = parseChaptersFromGemini(wrapped, { duration: 100 });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('a');
  });

  it('returns null when the JSON is malformed', () => {
    expect(parseChaptersFromGemini('not json at all', { duration: 100 })).toBeNull();
  });

  it('returns null when the first chapter does not start at 0', () => {
    const out = parseChaptersFromGemini(
      JSON.stringify([{ id: 'x', label: 'X', start: 30 }]),
      { duration: 100 },
    );
    expect(out).toBeNull();
  });

  it('returns null when a chapter start exceeds duration', () => {
    const out = parseChaptersFromGemini(
      JSON.stringify([
        { id: 'a', label: 'A', start: 0 },
        { id: 'b', label: 'B', start: 9999 },
      ]),
      { duration: 100 },
    );
    expect(out).toBeNull();
  });
});

describe('fallbackEvenSplits', () => {
  it('produces 5 evenly-spaced chapters covering the full duration', () => {
    const out = fallbackEvenSplits({ duration: 500 });
    expect(out).toHaveLength(5);
    expect(out[0].start).toBe(0);
    expect(out[4].start).toBe(400);
  });

  it('uses generic chapter labels (1–5) when no headings are provided', () => {
    const out = fallbackEvenSplits({ duration: 300 });
    expect(out[0].label).toMatch(/chapter 1/i);
  });

  it('uses provided headings as chapter labels when supplied', () => {
    const out = fallbackEvenSplits({
      duration: 300,
      headings: ['Thesis', 'Beats', 'Network', 'Lessons', 'Tomorrow'],
    });
    expect(out.map((c) => c.label)).toEqual(['Thesis', 'Beats', 'Network', 'Lessons', 'Tomorrow']);
  });
});

describe('buildChapterPrompt', () => {
  it('asks for JSON-only output with the duration embedded', () => {
    const p = buildChapterPrompt({ duration: 432, report: 'A report.' });
    expect(p).toContain('432');
    expect(p.toLowerCase()).toContain('json only');
    expect(p).toContain('A report.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-chapters.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement chapters.ts**

Create `scripts/audio-pipeline/stages/chapters.ts`:

```ts
import { z } from 'zod';
import type { AudioChapter } from '@/components/microsites/memo-audio-brief';

const chapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  start: z.number().int().nonnegative(),
});
const chaptersSchema = z.array(chapterSchema).min(1).max(8);

export interface ParseOptions {
  /** mp3 duration in seconds — used to validate that no chapter starts past the end. */
  duration: number;
}

export interface FallbackOptions {
  duration: number;
  /** Optional section headings to label the splits with. Length should be 5. */
  headings?: string[];
}

export interface ChapterPromptInput {
  duration: number;
  /** The Gemini deep-research report (markdown). */
  report: string;
}

/**
 * Parse the JSON Gemini emits in response to the segmentation prompt.
 * Returns the validated AudioChapter[] or null if anything is off — caller
 * falls back to even-splits and flags the gap in the PR.
 */
export function parseChaptersFromGemini(raw: string, opts: ParseOptions): AudioChapter[] | null {
  const stripped = stripCodeFence(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  const validated = chaptersSchema.safeParse(parsed);
  if (!validated.success) return null;
  const chapters = validated.data;
  if (chapters[0].start !== 0) return null;
  if (chapters.some((c) => c.start > opts.duration)) return null;
  // Ensure starts are monotonically increasing.
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].start <= chapters[i - 1].start) return null;
  }
  return chapters;
}

/**
 * Even-length 5-chapter fallback. Used when Gemini's segmentation output
 * fails validation. Caller should flag the fallback in the PR description.
 */
export function fallbackEvenSplits(opts: FallbackOptions): AudioChapter[] {
  const slices = 5;
  const step = Math.floor(opts.duration / slices);
  return Array.from({ length: slices }, (_, i) => ({
    id: `chapter-${i + 1}`,
    label: opts.headings?.[i] ?? `Chapter ${i + 1}`,
    start: i * step,
  }));
}

export function buildChapterPrompt(input: ChapterPromptInput): string {
  return [
    'Below is a deep-research report and the duration in seconds of a podcast version of that report.',
    '',
    `Podcast duration: ${input.duration} seconds.`,
    '',
    "Propose 5 chapter boundaries that match the report's narrative arc. Output JSON only — no prose, no code-fence wrappers — with the shape:",
    '',
    '[{"id": "kebab-case-slug", "label": "Human readable", "start": <integer seconds>}]',
    '',
    'The first chapter must start at 0. Starts must be strictly increasing. No start may exceed the duration.',
    '',
    '## Report',
    '',
    input.report,
  ].join('\n');
}

function stripCodeFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '');
}
```

- [ ] **Step 4: Run test to verify pass + run typecheck**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json && npx --no-install vitest run tests/unit/audio-pipeline-chapters.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: tsc clean, 9/9 passing.

If `zod` is not installed, run `npm install zod` first; commit the `package.json` + `package-lock.json` change in step 5.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/stages/chapters.ts tests/unit/audio-pipeline-chapters.test.ts package.json package-lock.json
git commit -m "feat(audio-pipeline): chapter parser + fallback splits

zod-validated parse of Gemini's segmentation JSON (handles bare JSON
or code-fenced output, rejects monotonicity violations, rejects
out-of-range starts). Falls back to 5 even-length splits with optional
heading-derived labels when validation fails.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Patch stage (TS AST edit of `accounts/<slug>.ts`)

**Files:**
- Create: `scripts/audio-pipeline/stages/patch.ts`
- Test: `tests/unit/audio-pipeline-patch.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/audio-pipeline-patch.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { patchAccountFile } from '@/scripts/audio-pipeline/stages/patch';
import type { AccountAudioBrief } from '@/lib/microsites/schema';

const ACCOUNT_WITHOUT_AUDIO = `
import type { AccountMicrositeData } from '../schema';

export const dannon: AccountMicrositeData = {
  slug: 'dannon',
  accountName: 'Dannon',
  vertical: 'CPG / yogurt',
};
`.trim();

const ACCOUNT_WITH_AUDIO = `
import type { AccountMicrositeData } from '../schema';

export const dannon: AccountMicrositeData = {
  slug: 'dannon',
  accountName: 'Dannon',
  vertical: 'CPG / yogurt',
  audioBrief: {
    src: '/audio/dannon-old.mp3',
    chapters: [{ id: 'old', label: 'Old', start: 0 }],
    generatedAt: '2026-04-01T00:00:00Z',
  },
};
`.trim();

const newBrief: AccountAudioBrief = {
  src: '/audio/dannon.mp3',
  chapters: [
    { id: 'thesis', label: 'The thesis', start: 0 },
    { id: 'beats', label: 'Cold-chain beats', start: 75 },
  ],
  generatedAt: '2026-05-10T14:00:00Z',
};

describe('patchAccountFile', () => {
  it('inserts an audioBrief property when none is present', () => {
    const out = patchAccountFile({ source: ACCOUNT_WITHOUT_AUDIO, brief: newBrief });
    expect(out).toContain("audioBrief:");
    expect(out).toContain("src: '/audio/dannon.mp3'");
    expect(out).toContain("'2026-05-10T14:00:00Z'");
    // Existing fields preserved
    expect(out).toContain("accountName: 'Dannon'");
    expect(out).toContain("vertical: 'CPG / yogurt'");
  });

  it('replaces an existing audioBrief in place', () => {
    const out = patchAccountFile({ source: ACCOUNT_WITH_AUDIO, brief: newBrief });
    expect(out).not.toContain("'/audio/dannon-old.mp3'");
    expect(out).toContain("'/audio/dannon.mp3'");
    expect(out).toContain("'2026-05-10T14:00:00Z'");
    // Old chapter id should be gone
    expect(out).not.toContain("id: 'old'");
  });

  it('throws when the source has no exported account constant', () => {
    expect(() =>
      patchAccountFile({ source: 'export const wrong = 1;', brief: newBrief }),
    ).toThrow(/no exported AccountMicrositeData constant/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-patch.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement patchAccountFile**

Create `scripts/audio-pipeline/stages/patch.ts`:

```ts
import ts from 'typescript';
import type { AccountAudioBrief } from '@/lib/microsites/schema';

export interface PatchInput {
  /** Full TypeScript source of the accounts/<slug>.ts file. */
  source: string;
  /** New brief to write. */
  brief: AccountAudioBrief;
}

/**
 * Edit an account file's exported constant to add or replace its
 * audioBrief property. Uses the TS compiler API so we never produce
 * malformed TypeScript — fails loudly if the file shape isn't what we
 * expect (no exported AccountMicrositeData constant) instead of trying
 * a regex hack.
 */
export function patchAccountFile(input: PatchInput): string {
  const sf = ts.createSourceFile('account.ts', input.source, ts.ScriptTarget.Latest, true);

  // Find: `export const <name>: AccountMicrositeData = { ... };`
  const accountConst = sf.statements.find(
    (s): s is ts.VariableStatement =>
      ts.isVariableStatement(s) &&
      !!s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      s.declarationList.declarations.length === 1 &&
      isAccountTyped(s.declarationList.declarations[0]),
  );
  if (!accountConst) {
    throw new Error('patchAccountFile: no exported AccountMicrositeData constant found');
  }

  const decl = accountConst.declarationList.declarations[0];
  const init = decl.initializer;
  if (!init || !ts.isObjectLiteralExpression(init)) {
    throw new Error('patchAccountFile: account constant initializer is not an object literal');
  }

  const newProperty = buildAudioBriefProperty(input.brief);
  const filtered = init.properties.filter(
    (p) => !(ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'audioBrief'),
  );
  const updatedInit = ts.factory.updateObjectLiteralExpression(init, [
    ...filtered,
    newProperty,
  ]);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const updatedSf = ts.transform(sf, [
    () => (root) =>
      ts.visitNode(root, function visit(node): ts.Node {
        if (node === init) return updatedInit;
        return ts.visitEachChild(node, visit, undefined);
      }) as ts.SourceFile,
  ]).transformed[0] as ts.SourceFile;

  return printer.printFile(updatedSf);
}

function isAccountTyped(d: ts.VariableDeclaration): boolean {
  if (!d.type || !ts.isTypeReferenceNode(d.type)) return false;
  return ts.isIdentifier(d.type.typeName) && d.type.typeName.text === 'AccountMicrositeData';
}

function buildAudioBriefProperty(brief: AccountAudioBrief): ts.PropertyAssignment {
  const f = ts.factory;
  const props: ts.PropertyAssignment[] = [
    f.createPropertyAssignment('src', f.createStringLiteral(brief.src)),
    f.createPropertyAssignment(
      'chapters',
      f.createArrayLiteralExpression(
        brief.chapters.map((c) =>
          f.createObjectLiteralExpression([
            f.createPropertyAssignment('id', f.createStringLiteral(c.id)),
            f.createPropertyAssignment('label', f.createStringLiteral(c.label)),
            f.createPropertyAssignment('start', f.createNumericLiteral(c.start)),
          ]),
        ),
        true,
      ),
    ),
  ];
  if (brief.heading !== undefined) {
    props.push(f.createPropertyAssignment('heading', f.createStringLiteral(brief.heading)));
  }
  if (brief.intro !== undefined) {
    props.push(f.createPropertyAssignment('intro', f.createStringLiteral(brief.intro)));
  }
  props.push(
    f.createPropertyAssignment('generatedAt', f.createStringLiteral(brief.generatedAt)),
  );
  return f.createPropertyAssignment('audioBrief', f.createObjectLiteralExpression(props, true));
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/audio-pipeline-patch.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: 3/3 passing.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/stages/patch.ts tests/unit/audio-pipeline-patch.test.ts
git commit -m "feat(audio-pipeline): TS-AST patcher for account files

Adds or replaces the audioBrief property on the exported
AccountMicrositeData constant in src/lib/microsites/accounts/<slug>.ts.
Uses ts.factory + ts.transform + ts.createPrinter so output is always
syntactically valid; throws cleanly when the file shape is off rather
than corrupting the source.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Browser context factory (Playwright)

**Files:**
- Create: `scripts/audio-pipeline/lib/browser.ts`

- [ ] **Step 1: Verify Playwright is available**

Run: `cd /mnt/c/Users/casey/modex-gtm && cat package.json | grep -E '"playwright"|"@playwright/test"'`

If absent, install it:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

- [ ] **Step 2: Implement the browser factory**

Create `scripts/audio-pipeline/lib/browser.ts`:

```ts
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
```

- [ ] **Step 3: Smoke-test that a context opens and reaches a known page**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx tsx -e "
import { openContext, closeContext } from './scripts/audio-pipeline/lib/browser.ts';
const ctx = await openContext({ headed: false });
const page = await ctx.newPage();
await page.goto('https://example.com');
const title = await page.title();
console.log('title:', title);
await closeContext(ctx);
"`
Expected: prints `title: Example Domain`.

- [ ] **Step 4: No automated test for this — Playwright contexts are integration-only**

Document the smoke-test command in the upcoming README (Task 12). The factory is small enough that the smoke test in Step 3 is sufficient verification.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/lib/browser.ts package.json package-lock.json
git commit -m "feat(audio-pipeline): persistent Playwright context factory

User-data-dir at ~/.config/yardflow-audio-pipeline/profile/ outside the
repo so credentials never touch git. First --headed run is for sign-in;
subsequent runs go headless and reuse the cookie jar.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Gemini deep-research stage (browser flow)

**Files:**
- Create: `scripts/audio-pipeline/stages/gemini.ts`

- [ ] **Step 1: Define the stage interface**

Create `scripts/audio-pipeline/stages/gemini.ts` with the public surface area only:

```ts
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

/** Selectors are exported so they can be patched without rebuilding the stage. */
export const GEMINI_SELECTORS = {
  promptInput: 'rich-textarea[aria-label*="Enter a prompt" i] textarea, div[contenteditable="true"][aria-label*="prompt" i]',
  deepResearchToggle: 'button[aria-label*="Deep Research" i], [data-tool-id="deep_research"]',
  submitButton: 'button[aria-label*="Send message" i]',
  reportContainer: '[data-message-author-role="model"]',
  reportSettledMarker: 'button[aria-label*="Copy" i]',
  openInNotebookLM: 'a[href*="notebooklm.google.com"], button:has-text("Open in NotebookLM")',
};
```

- [ ] **Step 2: Implement the flow**

Append to `scripts/audio-pipeline/stages/gemini.ts`:

```ts
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
 */
export async function runGemini(input: GeminiInput): Promise<GeminiOutput> {
  const page = await input.ctx.newPage();
  try {
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
    // after streaming completes.
    await page
      .locator(GEMINI_SELECTORS.reportSettledMarker)
      .first()
      .waitFor({ state: 'visible', timeout: 8 * 60 * 1_000 });

    const reportEl = page.locator(GEMINI_SELECTORS.reportContainer).last();
    const report = (await reportEl.innerText()).trim();
    const threadUrl = page.url();
    return { report, threadUrl };
  } finally {
    // Don't close — the orchestrator may need the thread for the
    // "Open in NotebookLM" handoff.
  }
}
```

- [ ] **Step 3: Manual smoke test (interactive)**

This stage cannot be unit-tested. Smoke test in headed mode the first time you run it end-to-end (Task 11). Until then, verify the file compiles:

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 4: Document the manual smoke step**

Add to the README (will be authored in Task 12) that the first run of `runGemini` should be observed in headed mode and selectors verified by inspecting the DOM if anything trips.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/stages/gemini.ts
git commit -m "feat(audio-pipeline): Gemini deep-research browser flow

Drives gemini.google.com end-to-end (auth via persistent context):
toggle deep-research → paste prompt → submit → wait for streaming
to settle → capture report markdown. Selectors centralized in
GEMINI_SELECTORS so Google UI changes are a one-line fix.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: NotebookLM podcast stage (browser flow)

**Files:**
- Create: `scripts/audio-pipeline/stages/notebook-lm.ts`

- [ ] **Step 1: Define the stage interface**

Create `scripts/audio-pipeline/stages/notebook-lm.ts`:

```ts
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
   *  if the "Open in Gemini" handoff is missing. */
  fallbackReport?: string;
}

export interface NotebookLMOutput {
  /** Final mp3 path on disk (== input.outputPath when the download succeeds). */
  mp3Path: string;
  /** Audio duration in seconds (read from the playback element after generation). */
  durationSeconds: number;
}

export const NOTEBOOK_SELECTORS = {
  openHandoffLink: 'a[href*="notebooklm.google.com"], button:has-text("Open in NotebookLM")',
  generateAudioButton: 'button:has-text("Generate")',
  audioElement: 'audio',
  downloadAudioButton: 'button[aria-label*="Download" i], a[download]',
  pasteSourceTextarea: 'textarea[aria-label*="Add source" i], div[contenteditable="true"]',
};
```

- [ ] **Step 2: Implement the flow**

Append:

```ts
/**
 * Open NotebookLM with the Gemini report as the source, kick off the
 * podcast generation, poll until it lands, then download the mp3.
 *
 * The download path: we listen for the next `download` event from the
 * page (Playwright's `page.waitForEvent("download")`) and resolve it
 * to the configured `outputPath` so the caller doesn't have to chase
 * an arbitrary downloads folder.
 */
export async function runNotebookLM(input: NotebookLMInput): Promise<NotebookLMOutput> {
  // Navigate from the Gemini thread to NotebookLM via the official handoff
  // link. If absent (UI change, account tier), fall back to manually opening
  // notebooklm.google.com and pasting fallbackReport as the source.
  const pages = input.ctx.pages();
  const geminiPage = pages.find((p) => p.url() === input.geminiThreadUrl) ?? (await input.ctx.newPage());
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

  // Kick off generation and wait up to 30 minutes for the audio element.
  await nbPage.locator(NOTEBOOK_SELECTORS.generateAudioButton).first().click();
  const audio = nbPage.locator(NOTEBOOK_SELECTORS.audioElement).first();
  await audio.waitFor({ state: 'attached', timeout: 30 * 60 * 1_000 });

  // Read duration via in-page evaluation (audio.duration in seconds).
  const durationSeconds = await audio.evaluate((el) => Math.round((el as HTMLAudioElement).duration));

  // Trigger download and re-route the file to outputPath.
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
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 4: Document the manual smoke**

Same as Task 9 — first end-to-end run is the smoke test (Task 11). The README in Task 12 captures this.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/stages/notebook-lm.ts
git commit -m "feat(audio-pipeline): NotebookLM podcast browser flow

Receives the Gemini handoff (or falls back to manual paste of the
report), kicks off podcast generation, polls up to 30 min for the
audio element, reads duration, and re-routes the download into
public/audio/<slug>.mp3 instead of letting it land in a random
downloads folder.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Orchestrator (`run.ts`)

**Files:**
- Create: `scripts/audio-pipeline/run.ts`
- Modify: `package.json` (add `audio:run` script)

- [ ] **Step 1: Add the npm script entry**

Edit `package.json`. Find the `"scripts"` block and add:

```json
"audio:run": "tsx scripts/audio-pipeline/run.ts"
```

- [ ] **Step 2: Implement the orchestrator**

Create `scripts/audio-pipeline/run.ts`:

```ts
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
    await cp.write('compose', { prompt, dossierFallback: fallback, dossierFiles: matches.map((m) => m.filename) });
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
      const out = await runNotebookLM({ ctx, geminiThreadUrl: threadUrl, outputPath, fallbackReport: report });
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
    execSync(`git add public/audio/${args.account}.mp3 src/lib/microsites/accounts/${args.account}.ts`, { cwd: repo, stdio: 'inherit' });
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
```

- [ ] **Step 3: Run typecheck**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 4: Manual end-to-end smoke (the real first test)**

Pick an account that has a dossier (e.g. `general-mills`):

```bash
cd /mnt/c/Users/casey/modex-gtm
npm run audio:run -- --account general-mills --headed
```

Watch the headed browser. Sign in to Google when prompted. Verify:
- Gemini thread renders the deep-research output
- NotebookLM hand-off opens, podcast generates
- mp3 lands at `public/audio/general-mills.mp3`
- Chapter timestamps land in the account file
- A new branch `audio/general-mills` is pushed and a PR is opened

If any selector trips, edit `GEMINI_SELECTORS` or `NOTEBOOK_SELECTORS` and re-run with `--skip-to <stage>` from the failed step.

- [ ] **Step 5: Commit**

```bash
git add scripts/audio-pipeline/run.ts package.json
git commit -m "feat(audio-pipeline): orchestrator + npm run audio:run

Sequences compose → gemini → notebook-lm → chapters → patch → git
with per-stage checkpointing. --skip-to resumes from any stage after
a partial-failure restart. Fresh Gemini chat for chapter segmentation
(deep-research mode doesn't reliably support follow-ups).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: README + open PR

**Files:**
- Create: `scripts/audio-pipeline/README.md`

- [ ] **Step 1: Write the README**

Create `scripts/audio-pipeline/README.md`:

```markdown
# Audio pipeline

Drives Gemini deep research → NotebookLM podcast → mp3 + chapter timestamps,
then patches the result into a per-account memo. One account per run; fail-soft
checkpoints between stages.

## Bootstrap (once)

1. Install Playwright Chromium:
   ```
   npx playwright install chromium
   ```
2. First run is headed so you can sign in to casey@freightroll.com:
   ```
   npm run audio:run -- --account general-mills --headed
   ```
   Sign in when prompted. The cookie jar lives at
   `~/.config/yardflow-audio-pipeline/profile/` and survives across runs.

## Subsequent runs

Headless by default:
```
npm run audio:run -- --account dannon
```

If anything breaks mid-pipeline, resume from the failed stage:
```
npm run audio:run -- --account dannon --skip-to chapters
```

Stages: `compose | gemini | notebook-lm | chapters | patch | git`.

## Output

- `public/audio/<slug>.mp3` — per-account mp3
- `src/lib/microsites/accounts/<slug>.ts` — patched with `audioBrief: {...}`
- New branch `audio/<slug>` pushed, PR opened — listen + retune chapters before merge

## Failure recovery

| Failure | Where to look | Fix |
|---|---|---|
| `--account` rejected | `getAccountMicrositeData` lookup | check spelling against `src/lib/microsites/accounts/index.ts` |
| Gemini selector misses | `GEMINI_SELECTORS` in `stages/gemini.ts` | update DOM query, re-run `--skip-to gemini` |
| NotebookLM hand-off missing | `NOTEBOOK_SELECTORS.openHandoffLink` | update query OR finish the NotebookLM step manually then `--skip-to chapters` |
| Mp3 download routes wrong | downloads folder mismatch in `runNotebookLM` | inspect `~/.config/yardflow-audio-pipeline/runs/<slug>/run.log` |
| Chapter JSON malformed | Gemini output drift | inspect `~/.config/yardflow-audio-pipeline/runs/<slug>/chapters.json`, retry with `--skip-to chapters` |

## Dossier coverage

8 of 25 accounts have local dossiers under `docs/research/`:
toyota, mondelez-international, campbell-s, ab-inbev, ford,
constellation-brands, keurig-dr-pepper, general-mills.

The other 17 fall back to account-data-only prompts (Gemini does its own
discovery). To improve fidelity, generate a dossier first via
`clawd-control-plane/scripts/dossier_pipeline.py` and re-run.

## Per-account audio is opt-in

Without `audioBrief` on the account record, every memo continues serving the
canonical `/audio/yard-network-brief.mp3`. The pipeline is the only thing that
sets `audioBrief`; nothing else touches the field.
```

- [ ] **Step 2: Commit the README**

```bash
git add scripts/audio-pipeline/README.md
git commit -m "docs(audio-pipeline): bootstrap + usage + failure recovery

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Push the branch and open the PR**

```bash
git push -u origin feat/audio-pipeline
gh pr create --title "feat: per-account audio pipeline" --body "$(cat <<'EOF'
Implements the design at \`docs/superpowers/specs/2026-05-09-audio-pipeline-and-v2-roadmap-design.md\` (PR #51).

## What ships
- \`AccountMicrositeData.audioBrief?\` — optional per-account override on the schema
- Page resolves override and falls through to canonical defaults when absent
- \`scripts/audio-pipeline/\` — orchestrator + 5 stages + 3 lib modules
- 5 unit-test files covering pure stages (compose, chapters, patch, dossiers, checkpoint)
- npm script \`audio:run -- --account <slug>\` + \`--headed\` + \`--skip-to <stage>\`
- README at \`scripts/audio-pipeline/README.md\`

## Per-account audio is opt-in
No account fixture has \`audioBrief\` set yet, so every memo keeps serving the canonical mp3 until the pipeline is run for that account.

## Test plan
- [ ] CI green on typecheck + unit tests
- [ ] Manual smoke: \`npm run audio:run -- --account general-mills --headed\` produces an mp3 + chapter timestamps + a new \`audio/general-mills\` PR
- [ ] After merge: \`yardflow.ai/for/general-mills\` plays the per-account mp3 instead of the canonical
EOF
)"
```

- [ ] **Step 4: Verify CI green**

Watch `gh pr checks <number>` until typecheck + unit-tests are green.

- [ ] **Step 5: Hand-off**

Pipeline ready. Casey runs `--account <slug>` for a real deal when one heats up; until then every memo serves the canonical placeholder.

---

## Self-Review

**Spec coverage check:**
- ✓ Pipeline (11 stages described in spec) → Tasks 5, 6, 7, 8, 9, 10, 11 cover compose, chapters, patch, browser, gemini, notebook-lm, orchestrator
- ✓ `AccountAudioBrief` schema → Task 1
- ✓ Page resolution merge → Task 2
- ✓ Dossier collector with slug-fuzzy match → Task 3
- ✓ Checkpoint store → Task 4
- ✓ README + bootstrap → Task 12
- ✓ Failure modes table from spec → distributed across stage error handling + README recovery table
- ✓ Out of scope items (V2 roadmap) — explicitly excluded

**Placeholder scan:** No "TBD"/"TODO"/"implement later" remained. Each step contains either exact code or an exact command + expected output.

**Type consistency:** `AudioChapter` shape (id/label/start) is consistent across schema, compose tests, chapter parser, patch builder, fallback splits, and orchestrator. `AccountAudioBrief` shape (src/chapters/heading?/intro?/generatedAt) is consistent.

---

## How to use after merge

When a deal heats up and you want a custom audio for that account:

```
cd /mnt/c/Users/casey/modex-gtm
npm run audio:run -- --account <slug>
```

Listen to the resulting mp3 in the Vercel preview of the auto-opened PR. Retune chapter starts if any feel off (just edit `accounts/<slug>.ts`). Merge. Done.
