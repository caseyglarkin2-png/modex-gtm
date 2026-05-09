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
