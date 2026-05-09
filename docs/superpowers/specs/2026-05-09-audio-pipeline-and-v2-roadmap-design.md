# Audio pipeline + V2 roadmap — design

**Date:** 2026-05-09
**Author:** Casey Larkin (with Claude Opus 4.7)
**Status:** approved by Casey, ready for implementation plan
**Related:** modex-gtm PR #50 (Audio Brief player), issues #45 / #46 / #48

## Goals

1. Stand up a per-account audio pipeline so the canonical 7-min "yard network as constraint" mp3 can be replaced with an account-specific NotebookLM-quality podcast on demand. Default behavior — agnostic placeholder for every account — stays as-is.
2. Sequence the remaining V2 microsite work (#46 Live Ticker, #45 Detention Clock, #48 Editorial style) so the audio pipeline lands first and the rest follows without overlapping redesigns.

## Non-goals

- **Per-account audio for every account up-front.** Audio is generated on-demand when a deal heats up; the canonical mp3 keeps serving until then.
- **A NotebookLM API integration.** No public API exists. The pipeline drives the user-facing NotebookLM web app via Playwright.
- **#44 Module Inspector or #47 PDF Generator.** Both deferred per Casey's 2026-05-09 direction.
- **Replacing the canonical mp3 with TTS.** TTS-based generation was considered and rejected — quality gap from NotebookLM's two-host conversational format is too large.

## Architecture

### Pipeline (one driver script, one account at a time)

```
[--account <slug>] →
  1. compose research prompt (account data + Drive dossier)
  2. Playwright opens gemini.google.com (persistent casey@freightroll.com session)
  3. submit deep-research prompt, poll until report renders
  4. capture report markdown
  5. click "Open in NotebookLM"
  6. wait for podcast generation, download mp3
  7. write public/audio/<slug>.mp3
  8. submit follow-up Gemini prompt to segment the report into 5 chapters with timestamps
  9. patch src/lib/microsites/accounts/<slug>.ts to add audioBrief field
  10. git checkout -b audio/<slug>; git add + commit
  11. open PR for human listen-and-merge
```

**Driver:** `scripts/audio-pipeline/run.ts` — Node + tsx. Takes `--account <slug>` (required), `--skip-to <stage>` (optional, for resuming on failure).

**Browser session:** persistent Playwright user-data-dir at `~/.config/yardflow-audio-pipeline/profile/`. First run is `--headed` so Casey can sign in to Google once; subsequent runs default to headless and reuse the cookie jar.

**Anti-automation hygiene:**
- Single account per invocation (no batch loops). Casey runs 1-3/day max, on natural cadence.
- Random pause (5-15s) between stages so the request pattern doesn't look bot-like.
- If Gemini's deep-research mode is gated (Workspace tier), the prompt re-targets to standard Gemini chat with a "deep research style" preface so the pipeline degrades gracefully.

**Resumability:** each stage writes `~/.config/yardflow-audio-pipeline/runs/<slug>/<stage>.json` with stage outputs. If stage 5 fails after stage 4 succeeded, `run.ts --account <slug> --skip-to 5` picks up from the captured Gemini report without re-running the deep research.

### Per-account override (component integration)

The `MemoAudioBrief` component already accepts `src`, `chapters`, `heading`, `intro` as props. Override flows through the existing account data record.

**Schema change** (`src/lib/microsites/schema.ts`):

```ts
export interface AccountAudioBrief {
  /** Path under /public; if absent, page falls back to canonical AUDIO_BRIEF_SRC. */
  src: string;
  /** Chapter list specific to this account's audio. */
  chapters: AudioChapter[];
  /** Optional account-specific heading override. Defaults to component default. */
  heading?: string;
  /** Optional account-specific intro override. */
  intro?: string;
  /** ISO timestamp when this audio was generated. Used by audit/regen flows. */
  generatedAt: string;
}

export interface AccountMicrositeData {
  // ... existing fields
  audioBrief?: AccountAudioBrief;
}
```

**Resolution in `src/app/for/[account]/page.tsx`:**

```tsx
<MemoAudioBrief
  src={data.audioBrief?.src ?? AUDIO_BRIEF_SRC}
  chapters={data.audioBrief?.chapters ?? AUDIO_BRIEF_CHAPTERS}
  heading={data.audioBrief?.heading}
  intro={data.audioBrief?.intro}
  expectedDuration={data.audioBrief ? undefined : AUDIO_BRIEF_DURATION}
  accentColor={data.theme?.accentColor}
/>
```

**Pipeline writes back** by editing the account file directly. Each `src/lib/microsites/accounts/<slug>.ts` exports a typed `AccountMicrositeData` constant; the pipeline parses with TypeScript's compiler API (`ts.createSourceFile`), inserts/replaces the `audioBrief` property, and writes back. No regex-on-source hacks.

### Chapter extraction (option A — Gemini self-segments)

After step 6 (mp3 downloaded, duration known), the pipeline opens a fresh Gemini chat (not the deep-research one — deep-research mode doesn't reliably support follow-ups) and submits:

> "Below is the deep-research report you produced and the duration of a podcast version of that report ({duration} seconds). Propose 5 chapter boundaries that match the report's narrative arc. Output JSON only, with no prose: `[{id: kebab-case-slug, label: human-readable, start: seconds-integer}]`. The first chapter must start at 0."

Pipeline parses the JSON, validates against the `AudioChapter[]` zod schema, falls back to even-length splits with section-heading labels if validation fails. Either way, the per-account PR exists for Casey to listen and tune timestamps before merge.

### Failure modes + handling

| Stage | Failure | Recovery |
|-------|---------|----------|
| 2 (Gemini login) | session expired | re-run `--headed` once, re-auth |
| 3 (deep research) | rate-limited / queue full | retry with 2-min backoff, max 3 attempts |
| 5 (NotebookLM) | "open in NotebookLM" button missing (Gemini UI change) | save the report to checkpoint, exit with a "manual handoff" message that gives Casey the report + a one-line copy-paste prompt for NotebookLM. Pipeline can be resumed at stage 7 once mp3 is downloaded by hand. |
| 6 (mp3 download) | podcast generation takes >15min | poll every 30s up to 30min; then fall back to the same manual-handoff path as stage 5 |
| 8 (chapter JSON) | malformed output | fall back to even-length splits, flag in PR description |
| 9 (file patch) | ts.createSourceFile parse error | exit; never write malformed account file |
| 10 (git) | branch already exists | append `-N` suffix |

Every stage logs to a single per-run log at `~/.config/yardflow-audio-pipeline/runs/<slug>/run.log` for post-mortem.

## Components

```
modex-gtm/
├── scripts/audio-pipeline/
│   ├── run.ts              # entry point, stage orchestration
│   ├── stages/
│   │   ├── compose.ts      # prompt assembly from account data + Drive dossier
│   │   ├── gemini.ts       # Playwright flow for Gemini deep research
│   │   ├── notebook-lm.ts  # Playwright flow for podcast generation
│   │   ├── chapters.ts     # Gemini segmentation prompt (fresh chat)
│   │   └── patch.ts        # TS AST edit of accounts/<slug>.ts
│   ├── lib/
│   │   ├── browser.ts      # persistent context factory
│   │   ├── drive.ts        # Drive dossier fetch — drives the same Playwright session
│   │   │                   #   to drive.google.com, searches "<account> dossier",
│   │   │                   #   opens the top match, captures the body text. No
│   │   │                   #   service-account or gcloud setup needed.
│   │   └── checkpoint.ts   # per-stage state read/write
│   └── README.md           # how to bootstrap session + run
├── src/lib/microsites/
│   ├── schema.ts           # +AccountAudioBrief, +AudioChapter import
│   └── audio-brief.ts      # canonical defaults (already exists from PR #50)
├── src/app/for/[account]/page.tsx   # resolution merge (3-line change)
└── public/audio/
    ├── yard-network-brief.mp3       # canonical (already exists)
    └── <slug>.mp3                   # per-account, written by pipeline
```

## Data flow

1. Casey: `npx tsx scripts/audio-pipeline/run.ts --account dannon`
2. Script reads `accounts/dannon.ts` for `accountName`, `vertical`, `network.facilityCount`
3. Script attempts to fetch Drive dossier matching `Dannon dossier` (Drive search via authenticated session); if found, includes the body in the prompt
4. Script composes prompt; opens persistent Playwright; runs Gemini deep research
5. Script saves the report markdown to checkpoint, then drives NotebookLM to create the podcast
6. Mp3 lands in `public/audio/dannon.mp3`; chapter JSON lands in checkpoint
7. Script TS-AST-patches `accounts/dannon.ts` to add `audioBrief: {...}`
8. Script branches `audio/dannon`, commits, pushes, opens PR
9. Casey opens PR, listens to mp3 in browser preview, tunes chapter timestamps if needed, merges

## Testing

Unit testable today:
- `compose.ts`: prompt assembly given an `AccountMicrositeData` + dossier text
- `chapters.ts`: zod parse + fallback-split logic on malformed Gemini output
- `patch.ts`: AST edit produces the expected TypeScript output for representative input files

Integration-testable on demand only (real Google):
- `gemini.ts` and `notebook-lm.ts` have to run against the live UI. Add a `--dry-run` flag that captures expected selectors and screenshots so we have a record when Google ships UI changes.

## V2 roadmap (appendix)

| Order | Item | Status | Open questions for kickoff | Rough cost |
|-------|------|--------|--------------------------|-----------|
| 1 | #43 Audio Brief player | PR #50 in CI | — | shipped |
| 2 | Audio pipeline (this spec) | designed | — | 1-2 days build |
| 3 | #46 Live Ticker | next | dynamic feed vs canned rotation; placement (top band vs sidebar); does it tail real ops events or curated narrative beats? | 2-3 days canned, 1+ week live |
| 4 | #45 Detention Clock | stretch | industry-wide $/sec ticker vs account-specific; ambient vs scroll-revealed; mobile policy | 1 day |
| 5 | #48 Editorial style guide | stretch | docs only or with lint checks; lives at /docs/editorial-style.md or as section in CLAUDE.md | half-day |
| — | #44 Module Inspector | deferred | needs Casey's screenshots first | n/a |
| — | #47 PDF Generator | deferred | not worth React-PDF lift right now | n/a |

**Sequencing rationale:** Audio pipeline before Live Ticker because (a) it unblocks per-account audio for active deals and (b) the pipeline is independent of the rest of the memo chrome — no UI dependency conflicts. Live Ticker is heavier and edits the document layout, so it lands after audio so we're not coordinating two redesigns at once. #45 and #48 are both small; either slots in between if a deal pause opens space.

**Per-account audio backfill alongside V2 work:** Once the pipeline is built, generating audio for active deals runs in parallel with development on #46. They don't compete for context.

## Decisions made

- **Quality bar:** NotebookLM-equivalent (two-host conversational). Forced semi-automated path; ruled out pure-API TTS.
- **Automation tier:** Semi-automated via Playwright + Casey's Google session. Not full manual, not API-only.
- **Wave 1 scope:** Canonical mp3 placeholder for every account today; per-account override on demand when a deal warrants. No batch backfill.
- **Research seed:** Gemini deep research is seeded with existing Drive dossier + account data record. Gemini extends rather than re-derives.
- **Chapter extraction:** Gemini self-segments its own report. PR gate lets Casey hand-tune before merge.
- **Override mechanism:** `audioBrief?: AccountAudioBrief` field on `AccountMicrositeData`. No parallel directory; one source of truth per account.
- **PINC/Kaleris is not in scope.** They're competition, not a prospect.
