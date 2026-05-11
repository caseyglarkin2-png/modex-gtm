# Microsite Design + UX-Copy Audit Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run two cross-cutting audits (design-critique + ux-copy) across all 40 hand-tuned microsites at 1280px and 390px, producing a consolidated severity-banded punch list with proposed fixes that drives the next sprint of microsite work.

**Architecture:** Two audit subagents dispatched from the main session (in parallel — they're independent). Each reads a shared rubric file + account list + punch-list-row schema. Each writes its output to a structured markdown file at `docs/audits/`. The main session consolidates both into a master list, dedupes, re-runs the leak-scan, and presents to Casey for triage.

**Tech Stack:** Markdown for prompts/schemas/outputs. The design-critique subagent uses Playwright MCP (`mcp__plugin_playwright_playwright__browser_*` tools). The ux-copy subagent reads source files directly (no browser). Consolidation is a main-session Read/Edit pass.

**Spec:** `docs/superpowers/specs/2026-05-11-microsite-design-copy-audit-system-design.md` (commit `0f7a48d`)

---

## File structure

**Created by this plan (committed to repo):**

| Path | Purpose |
|---|---|
| `docs/audits/2026-05-11-account-list.md` | Single source of truth: 40 slugs grouped by tier with URLs |
| `docs/audits/2026-05-11-punch-list-schema.md` | Row format both subagents must produce |
| `docs/audits/2026-05-11-design-critique-prompt.md` | Full self-contained prompt for the design subagent |
| `docs/audits/2026-05-11-ux-copy-prompt.md` | Full self-contained prompt for the ux-copy subagent |

**Created by subagents (committed once produced):**

| Path | Purpose |
|---|---|
| `docs/audits/2026-05-11-design-critique-punch-list.md` | Design subagent output |
| `docs/audits/2026-05-11-ux-copy-punch-list.md` | UX-copy subagent output |
| `docs/audits/screenshots/{slug}-desktop.png` | Design subagent — 40 files |
| `docs/audits/screenshots/{slug}-mobile.png` | Design subagent — 40 files |
| `docs/audits/screenshots/.progress.json` | Checkpoint file (gitignored) |

**Created in main session (committed):**

| Path | Purpose |
|---|---|
| `docs/audits/2026-05-11-microsite-master-punch-list.md` | Consolidated, deduped, severity-banded list |

---

## Task 1: Account list

Single source of truth for the 40 audit targets. Both subagents read this file rather than receiving the list in the prompt.

**Files:**
- Create: `docs/audits/2026-05-11-account-list.md`

- [ ] **Step 1: Write the account list**

```markdown
# Microsite audit — account list

Live at `https://yardflow.ai/for/{slug}` (served via flow-state-site → modex-gtm rewrite).

Source files are at `src/lib/microsites/accounts/{slug}.ts` in this repo.

## Tier 1 (20)

| Slug | Account name | URL |
|---|---|---|
| `ab-inbev` | AB InBev | https://yardflow.ai/for/ab-inbev |
| `bob-evans-farms` | Bob Evans Farms | https://yardflow.ai/for/bob-evans-farms |
| `boston-beer-company` | Boston Beer Company | https://yardflow.ai/for/boston-beer-company |
| `cj-logistics-america` | CJ Logistics America | https://yardflow.ai/for/cj-logistics-america |
| `coca-cola` | Coca-Cola | https://yardflow.ai/for/coca-cola |
| `cost-plus-world-market` | Cost Plus World Market | https://yardflow.ai/for/cost-plus-world-market |
| `daimler-truck-north-america` | Daimler Truck North America | https://yardflow.ai/for/daimler-truck-north-america |
| `dannon` | Dannon | https://yardflow.ai/for/dannon |
| `dhl-supply-chain` | DHL Supply Chain | https://yardflow.ai/for/dhl-supply-chain |
| `frito-lay` | Frito-Lay | https://yardflow.ai/for/frito-lay |
| `general-mills` | General Mills | https://yardflow.ai/for/general-mills |
| `kimberly-clark` | Kimberly-Clark | https://yardflow.ai/for/kimberly-clark |
| `kraft-heinz` | Kraft Heinz | https://yardflow.ai/for/kraft-heinz |
| `nestle-usa` | Nestlé USA | https://yardflow.ai/for/nestle-usa |
| `pactiv-evergreen` | Pactiv Evergreen | https://yardflow.ai/for/pactiv-evergreen |
| `salson-logistics` | Salson Logistics | https://yardflow.ai/for/salson-logistics |
| `sc-johnson` | SC Johnson | https://yardflow.ai/for/sc-johnson |
| `unfi` | UNFI | https://yardflow.ai/for/unfi |
| `universal-logistics-holdings` | Universal Logistics Holdings | https://yardflow.ai/for/universal-logistics-holdings |
| `westrock-coffee` | Westrock Coffee | https://yardflow.ai/for/westrock-coffee |

## Tier 2 (14)

| Slug | Account name | URL |
|---|---|---|
| `campbell-s` | Campbell's | https://yardflow.ai/for/campbell-s |
| `caterpillar` | Caterpillar | https://yardflow.ai/for/caterpillar |
| `constellation-brands` | Constellation Brands | https://yardflow.ai/for/constellation-brands |
| `diageo` | Diageo | https://yardflow.ai/for/diageo |
| `ford` | Ford | https://yardflow.ai/for/ford |
| `georgia-pacific` | Georgia-Pacific | https://yardflow.ai/for/georgia-pacific |
| `h-e-b` | H-E-B | https://yardflow.ai/for/h-e-b |
| `hormel-foods` | Hormel Foods | https://yardflow.ai/for/hormel-foods |
| `jm-smucker` | J.M. Smucker | https://yardflow.ai/for/jm-smucker |
| `keurig-dr-pepper` | Keurig Dr Pepper | https://yardflow.ai/for/keurig-dr-pepper |
| `mondelez-international` | Mondelez International | https://yardflow.ai/for/mondelez-international |
| `performance-food-group` | Performance Food Group | https://yardflow.ai/for/performance-food-group |
| `the-home-depot` | The Home Depot | https://yardflow.ai/for/the-home-depot |
| `toyota` | Toyota | https://yardflow.ai/for/toyota |

## Tier 3 (6) — P2 polish findings deferred

| Slug | Account name | URL |
|---|---|---|
| `barnes-noble` | Barnes & Noble | https://yardflow.ai/for/barnes-noble |
| `fedex` | FedEx | https://yardflow.ai/for/fedex |
| `honda` | Honda | https://yardflow.ai/for/honda |
| `hyundai-motor-america` | Hyundai Motor America | https://yardflow.ai/for/hyundai-motor-america |
| `john-deere` | John Deere | https://yardflow.ai/for/john-deere |
| `kenco-logistics-services` | Kenco Logistics Services | https://yardflow.ai/for/kenco-logistics-services |
```

- [ ] **Step 2: Verify the count**

Run: `grep -c '^| \`' docs/audits/2026-05-11-account-list.md`
Expected: `40`

- [ ] **Step 3: Verify slugs match repo**

Run: `diff <(ls src/lib/microsites/accounts/*.ts | xargs -n1 basename | sed 's/\.ts$//' | grep -v '^index$' | sort) <(grep -oE '\`[a-z-]+\`' docs/audits/2026-05-11-account-list.md | tr -d '\`' | sort -u)`
Expected: (no output — sets are equal)

---

## Task 2: Punch list row schema

The format both subagents produce. Shared file so the consolidation step can rely on uniform structure.

**Files:**
- Create: `docs/audits/2026-05-11-punch-list-schema.md`

- [ ] **Step 1: Write the schema**

```markdown
# Punch list row schema

Both audit subagents produce a Markdown table with **exactly** these columns, in this order:

| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|

## Column definitions

- **Severity** — one of: `P0 systemic` · `P1 per-account` · `P2 polish`
- **Scope** — one of: `All 40` · `Tier 1 (20)` · `Tier 1+2 (34)` · or a single slug like `kraft-heinz` (or comma-separated slugs for 2–4 accounts)
- **Surface** — one of: `cover` · `prose` · `marginalia` · `audio-brief` · `soft-action` · `footnote` · `colophon` · `mobile` · or a component path like `memo-shell.tsx`
- **Dimension** — exactly one of the 9 rubric dimension names (see prompts for the lists)
- **Finding** — 1–2 sentences. Specific. Evidence-grounded. No "could be improved" — say what's wrong and why it matters.
- **Evidence** — one of:
  - `file:line` (e.g., `memo-shell.tsx:232`)
  - `screenshot:{slug}-{viewport}.png` (e.g., `screenshot:kraft-heinz-desktop.png`)
  - `copy: "..."` (a verbatim excerpt, ≤140 chars)
- **Fix** — 1 paragraph. For code/design findings: which file changes, what changes, ideally with before→after snippet. For copy findings: the actual rewrite snippet (not a directive like "rewrite to be more X").

## File structure

Each output file is:

```
# {Audit name} punch list — 2026-05-11

**Auditor:** {subagent name}
**Run date:** 2026-05-11
**Accounts covered:** 40 of 40
**Leak-scan status:** CLEAN | ISSUES PATCHED IN-LINE (see notes)

## Notes

(Any leak-scan patches made during the audit, plus any per-tier observations
the auditor wants to call out before the table.)

## Findings

| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |
```

## Coverage rule

Each of the 9 rubric dimensions must yield **at least one row** per account, OR the account must appear once with `Finding = "No issue"` for that dimension. Total minimum rows: 40 accounts × 9 dimensions = 360 rows per audit. Realistically expect 500–800 once systemic + per-account issues are tagged.

## Sorting

Within the table, sort rows by: Severity (P0 first), then Dimension number (1→9), then Scope (All 40 → Tier-grouped → single-account).
```

- [ ] **Step 2: Commit the account list + schema together**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add docs/audits/2026-05-11-account-list.md docs/audits/2026-05-11-punch-list-schema.md
git commit -m "docs(audits): account list + punch list row schema

Shared scaffolding for the design + ux-copy audit subagents.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Design-critique subagent prompt

Full self-contained prompt. The subagent reads this file as its briefing. No need to fetch the spec separately.

**Files:**
- Create: `docs/audits/2026-05-11-design-critique-prompt.md`

- [ ] **Step 1: Write the prompt**

```markdown
# Design-critique audit subagent — full prompt

## Your role

You are a senior product designer with editorial-typography background. You're auditing 40 live B2B microsites that share a memo-style design system (Fraunces serif body, Mona Sans display, JetBrains Mono technical, cream + ink color budget with one accent per account). The brief is "enhance into most compelling form" — you're looking for what blocks that, not redesigning from scratch.

## What you produce

A single Markdown file at `docs/audits/2026-05-11-design-critique-punch-list.md` matching the schema in `docs/audits/2026-05-11-punch-list-schema.md`. Each row is a finding with a proposed fix.

## Inputs to read before you start

1. `docs/superpowers/specs/2026-05-11-microsite-design-copy-audit-system-design.md` — full spec
2. `docs/editorial-style.md` — editorial invariants (guardrails)
3. `docs/audits/2026-05-11-punch-list-schema.md` — output format
4. `docs/audits/2026-05-11-account-list.md` — the 40 audit targets
5. `src/components/microsites/memo-shell.tsx`
6. `src/components/microsites/memo-section.tsx`
7. `src/components/microsites/memo-shell-chrome.tsx`
8. `src/components/microsites/memo-audio-brief.tsx`
9. `src/components/microsites/memo-soft-action.tsx`

## The rubric — 9 dimensions

For each account, score against ALL 9 dimensions at BOTH viewports (1280×900 and 390×844). Each dimension yields ≥1 row per account, or one explicit "No issue" row.

1. **Gestalt / immersion** — Does this read as a bound analyst memo, or a webpage pretending to be one? (Known pre-existing gap: empty 14rem aside gutter on desktop — `memo-shell.tsx:232`.)
2. **Typographic hierarchy** — Fraunces opsz/SOFT/WONK axes pulling weight at H1, eyebrow, drop cap, end-mark? Body opsz 14 feels like reading, not display set small?
3. **Color budget** — Accent appears only at: cover pip, italicized phrase in H1, contents-rail active marker, section eyebrow numerals, footnote markers, soft-action link, §∎ end-mark. Anything else is a leak.
4. **Marginalia / gutter** — The "second voice." Does the right gutter contribute, or is the reader staring at text in the middle of an empty page?
5. **Motion choreography** — Cover stagger (rise-1 → rise-4 over 1.6s), continue-nudge, scrollspy TOC, audio brief player, soft-action hover. Each feels earned, not decorative. Reduced-motion path verified.
6. **Mobile responsive collapse** — At 390px: TOC rail hidden, prose column width, drop-cap behavior, audio brief player height, cover spread vertical rhythm, soft-action CTA tap target. Does the memo metaphor survive?
7. **Evidence density** — Footnote marker density (≥1 per ~150 words body), citation hairlines, source-line typography reads as bibliography. ≥1 redacted-artifact treatment per memo. Zero artifacts + 2 footnotes = FAIL.
8. **Surface-by-surface** — Cover, audio brief, prose, eyebrow + numeral, footnote, soft-action, colophon — each judged on whether it does its specific job.
9. **Interaction polish** — Focus rings, hover states, scrollspy accuracy, audio brief seek, link border-bottom rendering, ::selection color.

## Hard gate: leak scan

Before finalizing the output, search every rendered page for these strings. ANY match must be patched in-line (do not leave them as a finding — fix them in this audit run, fail loudly if you can't):

- `Kaleris`, `PINC`, `Exel` in rendered text
- The actual name of the unnamed Tier-1 CPG anchor customer
- Primo conflated with the anchor (referring to them as the same entity)
- Internal methodology source IDs leaking into client-rendered ids/strings

## Audit pattern (efficient version)

Don't audit all 40 accounts identically. Layer the work:

1. **Systemic pass first** — pick 5 representative accounts (suggested: dannon, kraft-heinz, dhl-supply-chain, frito-lay, kimberly-clark). For each, capture screenshots at both viewports and inspect against all 9 dimensions. Identify the systemic issues (the same finding will apply to most/all accounts).
2. **Systemic validation** — quickly screenshot the remaining 35 accounts at both viewports and confirm the systemic findings hold. Note any accounts where they don't.
3. **Per-account pass** — for each of the 40, look for findings that are specific to that account (typography of a long account name in the cover headline, color budget violation if accent rendered somewhere unexpected, marginalia content that's specifically wrong for that account, mobile collapse oddity due to long copy block).

## Playwright workflow

For each account:

1. `mcp__plugin_playwright_playwright__browser_resize` to 1280×900
2. `mcp__plugin_playwright_playwright__browser_navigate` to `https://yardflow.ai/for/{slug}`
3. `mcp__plugin_playwright_playwright__browser_wait_for` cover-stagger to complete (~2s)
4. `mcp__plugin_playwright_playwright__browser_take_screenshot` → save to `docs/audits/screenshots/{slug}-desktop.png` (fullPage: true)
5. `mcp__plugin_playwright_playwright__browser_resize` to 390×844
6. (page auto-reflows; wait 500ms for any reflow animations)
7. `mcp__plugin_playwright_playwright__browser_take_screenshot` → save to `docs/audits/screenshots/{slug}-mobile.png` (fullPage: true)
8. Append a checkpoint entry to `docs/audits/screenshots/.progress.json` with `{"slug": "...", "desktop": true, "mobile": true, "ts": ...}` so resumption is possible.

## Output constraints

- **No new components in findings.** Fix column proposes diffs to existing files. New file ONLY when a primitive is genuinely missing (e.g., a marginalia component — for that case, the fix says exactly what file to create and what interface).
- **Incremental, not redesigns.** "Enhance into most compelling form," not "rebuild."
- **Evidence required.** Every finding cites a screenshot path or file:line.
- **Sort the final table** per the schema doc.
- **Coverage check** — before declaring done, run: `grep -c '^|' docs/audits/2026-05-11-design-critique-punch-list.md` and confirm at least 360 data rows (40 × 9), realistically 500+.

## Begin

Read all input files, then start with the systemic pass. Write findings to the output file as you go (don't accumulate in memory). When the systemic pass is done, write a "Notes" preamble summarizing what you found. Then proceed to systemic validation, then per-account.
```

- [ ] **Step 2: Commit the design-critique prompt**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add docs/audits/2026-05-11-design-critique-prompt.md
git commit -m "docs(audits): design-critique subagent prompt

Self-contained briefing for the design audit subagent. Rubric inline,
Playwright workflow specified, leak-scan as hard gate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: UX-copy subagent prompt

Mirror of the design prompt for the copy lens. No browser — reads source files directly.

**Files:**
- Create: `docs/audits/2026-05-11-ux-copy-prompt.md`

- [ ] **Step 1: Write the prompt**

```markdown
# UX-copy audit subagent — full prompt

## Your role

You are a senior editorial copywriter with brand-voice strategy background. You're auditing the prose, microcopy, and editorial coherence of 40 hand-tuned B2B microsites. The voice is anti-sales, observational, citation-grounded — bond-research memo, not marketing landing page. Your audit identifies where each microsite drifts from that voice and what to change.

## What you produce

A single Markdown file at `docs/audits/2026-05-11-ux-copy-punch-list.md` matching the schema in `docs/audits/2026-05-11-punch-list-schema.md`. Each row is a finding with a rewrite snippet (not a directive).

## Inputs to read before you start

1. `docs/superpowers/specs/2026-05-11-microsite-design-copy-audit-system-design.md` — full spec
2. `docs/editorial-style.md` — editorial invariants (the source of truth for voice rules)
3. `docs/audits/2026-05-11-punch-list-schema.md` — output format
4. `docs/audits/2026-05-11-account-list.md` — the 40 audit targets
5. `src/lib/microsites/accounts/{slug}.ts` for each of the 40 accounts — this is where the prose lives
6. `src/components/microsites/memo-audio-brief.tsx` — for audio chapter labels
7. `src/components/microsites/memo-soft-action.tsx` — for soft-action CTA copy
8. `src/components/microsites/memo-shell.tsx` — for cover/eyebrow/colophon microcopy

## The rubric — 9 dimensions

For each account, score against ALL 9 dimensions. Each dimension yields ≥1 row per account, or one explicit "No issue" row. Mobile readability (dim 9) requires you to mentally simulate the prose at ~22rem column width.

1. **Hook strength** — §1 opener earns reader's eye? Cover headline reads as memo title, not marketing tagline? Hook fails if it could be lifted to any other account without edits.
2. **Pitch-shape coherence** — Account's chosen pitch shape (coexistence-wedge / partnership / modernization / displacement, usually declared in the file's JSDoc header). Prose stays in shape end-to-end?
3. **Specificity ratio** — Concrete numbers, facility counts, dates, named comparables vs abstract claims. Target ~3 specifics per section minimum.
4. **Voice register continuity** — Cover headline + audio brief intro + section prose + footnotes sound like one writer. Watch: cover too formal, footnotes too casual, audio intro slipping into marketing.
5. **Editorial-style.md compliance** — Anchor un-name-ability; no Primo/anchor conflation; no facility addresses serving as proof for the anchor; Primo comparable framed as hard-freight unlock; journalism register only on Field Reports; attribution-free quote format.
6. **Sales-tell sniff** — Disqualifying: "our solution," "we help," "transform your," "best-in-class," "industry-leading," anything that could be on a competitor's site. Memos observe; they don't pitch.
7. **Scan / skim test** — First sentence of each section + section eyebrow + numerals. Reader skimming only those elements gets the thesis in 30 seconds?
8. **Microcopy density** — Eyebrows, document IDs, captions, audio chapter labels, prepared-for lines, soft-action CTA copy, colophon — each is one chance to reinforce the memo metaphor.
9. **Mobile readability** — At ~22rem column width: sentence length, paragraph density, fragment usage. Lines fine at 36rem may become walls.

## Hard gate: leak scan

Before finalizing, grep the rendered text strings (memo sections, audio brief intros, soft-action CTA copy, eyebrows, footnote bodies) for:

- `Kaleris`, `PINC`, `Exel`
- The actual name of the unnamed Tier-1 CPG anchor customer
- Primo conflated with the anchor (referring to them as the same entity)
- Facility addresses serving as proof for the anchor
- Internal methodology source IDs leaking into client-rendered ids/strings (e.g., `pactiv-pinc-case-study`-style ids)

Any hit: patch in-line. The fix-snippet column gets the patched version; the Notes section at the top of your output records what was patched.

## Pitch-shape detection

For each account, identify the pitch shape from the JSDoc header at the top of the account file. Most hand-tuned files declare it explicitly. If a file doesn't declare one, infer from §1's opening 2 paragraphs:

- **Coexistence-wedge** — acknowledges site-level success of incumbent yard tools, positions YardFlow at the network/orchestration tier
- **Partnership** — frames YardFlow as a productization opportunity, not a replacement
- **Modernization** — frames the incumbent stack as legacy infrastructure that needs the next layer
- **Displacement** — direct case for replacing what's there

If the shape is genuinely ambiguous in the file, flag the ambiguity as a finding (dimension 2: pitch-shape coherence).

## Output constraints

- **Every finding has a rewrite snippet.** No directives ("rewrite to be more specific"). Show the actual before → after.
- **Editorial-style.md is constraint, not suggestion.** Rewrite snippets that violate the style guide are themselves findings.
- **Sort the final table** per the schema doc.
- **Coverage check** — before declaring done, run: `grep -c '^|' docs/audits/2026-05-11-ux-copy-punch-list.md` and confirm at least 360 data rows.

## Begin

Read all input files. Then process accounts in batches of 5–10 (write findings to the output file as you go — don't accumulate in memory). At the end, do the leak-scan pass across all 40 source files and patch any hits before declaring done.
```

- [ ] **Step 2: Commit the ux-copy prompt**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add docs/audits/2026-05-11-ux-copy-prompt.md
git commit -m "docs(audits): ux-copy subagent prompt

Self-contained briefing for the ux-copy audit subagent. Rubric inline,
pitch-shape detection rules, leak-scan as hard gate. No browser required.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Add screenshots checkpoint to .gitignore

The progress.json checkpoint file should not be tracked. Screenshots themselves are tracked because they're the audit evidence.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Append checkpoint pattern**

Edit `.gitignore` to add this line at the end:

```
docs/audits/screenshots/.progress.json
```

- [ ] **Step 2: Commit the .gitignore change**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add .gitignore
git commit -m "chore(gitignore): ignore audit checkpoint progress file

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Dispatch design-critique subagent

Run the audit. The implementer subagent for this task IS the design auditor.

**Files:**
- Read (subagent): the 9 input files listed in the design-critique prompt
- Create (subagent): `docs/audits/2026-05-11-design-critique-punch-list.md`
- Create (subagent): `docs/audits/screenshots/{slug}-desktop.png` × 40
- Create (subagent): `docs/audits/screenshots/{slug}-mobile.png` × 40

- [ ] **Step 1: Dispatch the subagent**

Use the `Agent` tool with `subagent_type: general-purpose`. The prompt body is:

```
Execute the design-critique audit defined at:
docs/audits/2026-05-11-design-critique-prompt.md

That file is your full briefing. Read it first, then read the other
input files it lists, then run the audit and produce the output file.

Working directory: /mnt/c/Users/casey/modex-gtm

When you finish, report:
- Path to the output file
- Total row count
- Leak-scan status (CLEAN or what was patched)
- Number of accounts where Playwright captured both viewports
- Any accounts that failed to load (so we can retry)
```

Run in background (`run_in_background: true`) — the audit will take 30–60 minutes.

- [ ] **Step 2: Wait for completion**

The harness notifies when the agent completes. Do not poll. Continue with Task 7 in parallel while this runs.

- [ ] **Step 3: Verify output exists**

```bash
ls -la /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-design-critique-punch-list.md
ls /mnt/c/Users/casey/modex-gtm/docs/audits/screenshots/*.png | wc -l
```
Expected:
- Punch list file exists, ≥360 data rows
- 80 screenshots (40 desktop + 40 mobile)

- [ ] **Step 4: Verify schema compliance**

Run a quick header check:

```bash
head -20 /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-design-critique-punch-list.md
```
Expected: matches the schema's required header (Auditor / Run date / Accounts covered / Leak-scan status / Notes / Findings).

```bash
grep -E '^\| (P0 systemic|P1 per-account|P2 polish) \|' \
  /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-design-critique-punch-list.md | wc -l
```
Expected: ≥360.

- [ ] **Step 5: Re-run leak-scan on output**

```bash
grep -iE 'Kaleris|PINC|Exel|BlueTriton|Primo Brands.*anchor|pactiv-pinc' \
  /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-design-critique-punch-list.md
```
Expected: no matches (the subagent should have caught these). If matches exist, escalate.

---

## Task 7: Dispatch ux-copy subagent

Run in parallel with Task 6 — they're independent.

**Files:**
- Read (subagent): the 8 input files listed in the ux-copy prompt
- Create (subagent): `docs/audits/2026-05-11-ux-copy-punch-list.md`

- [ ] **Step 1: Dispatch the subagent**

Use the `Agent` tool with `subagent_type: general-purpose`. The prompt body is:

```
Execute the ux-copy audit defined at:
docs/audits/2026-05-11-ux-copy-prompt.md

That file is your full briefing. Read it first, then read the other
input files it lists, then run the audit and produce the output file.

Working directory: /mnt/c/Users/casey/modex-gtm

When you finish, report:
- Path to the output file
- Total row count
- Leak-scan status (CLEAN or what was patched)
- Any pitch-shape ambiguities you flagged
```

Run in background (`run_in_background: true`).

- [ ] **Step 2: Wait for completion**

Harness notifies on completion.

- [ ] **Step 3: Verify output exists + row count**

```bash
ls -la /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-ux-copy-punch-list.md
grep -E '^\| (P0 systemic|P1 per-account|P2 polish) \|' \
  /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-ux-copy-punch-list.md | wc -l
```
Expected: file exists, ≥360 data rows.

- [ ] **Step 4: Re-run leak-scan on output**

```bash
grep -iE 'Kaleris|PINC|Exel|BlueTriton|Primo Brands.*anchor|pactiv-pinc' \
  /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-ux-copy-punch-list.md
```
Expected: no matches.

---

## Task 8: Commit audit outputs

Once both subagents are done and verified, commit the artifacts before consolidation. Two reasons: (1) audit outputs are reference material even if consolidation isn't ready; (2) consolidation might surface re-audit requests, easier to compare against committed state.

**Files:**
- Add: `docs/audits/2026-05-11-design-critique-punch-list.md`
- Add: `docs/audits/2026-05-11-ux-copy-punch-list.md`
- Add: `docs/audits/screenshots/` (80 PNG files)

- [ ] **Step 1: Commit both punch lists + screenshots**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add docs/audits/2026-05-11-design-critique-punch-list.md \
        docs/audits/2026-05-11-ux-copy-punch-list.md \
        docs/audits/screenshots/
git commit -m "docs(audits): design-critique + ux-copy punch lists (40 microsites)

Cross-cutting audits across all 40 hand-tuned microsites at 1280px
and 390px. Output drives the next sprint of microsite work.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Consolidate into master punch list

Main-session work. Read both punch lists, merge, dedupe, group by severity, write the master.

**Files:**
- Read: `docs/audits/2026-05-11-design-critique-punch-list.md`
- Read: `docs/audits/2026-05-11-ux-copy-punch-list.md`
- Create: `docs/audits/2026-05-11-microsite-master-punch-list.md`

- [ ] **Step 1: Read both punch lists in full**

Use the Read tool on both files. Do not delegate this to a subagent — Casey wants the consolidator to be the same person doing triage so the master list reflects judgment.

- [ ] **Step 2: Identify and merge overlapping rows**

Two rows overlap when they describe the same underlying issue from different angles. Example:
- Design row: "Soft-action CTA visually de-emphasized; reads as footer link"
- Copy row: "Soft-action CTA microcopy too passive — 'Read the analysis' doesn't earn a click"

These get merged into one master row with `Surface: soft-action`, `Dimension: surface-by-surface + microcopy density`, and a combined fix that touches both the component and the CTA copy.

- [ ] **Step 3: Group by severity**

Write the master file with this structure:

```markdown
# Microsite master punch list — 2026-05-11

**Inputs:**
- docs/audits/2026-05-11-design-critique-punch-list.md ({N} rows)
- docs/audits/2026-05-11-ux-copy-punch-list.md ({M} rows)

**Total findings after dedupe:** {K}
**Leak-scan status:** CLEAN

## Section 1 — P0 systemic ({count})

Touches all (or most) accounts; one PR per finding fixes the issue
everywhere. Ranked by user-visible impact (gestalt > hierarchy > polish).

| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|
| P0 systemic | All 40 | ... | ... | ... | ... | ... |

## Section 2 — P1 per-account ({count})

Specific to one or a few accounts. Grouped by tier — Tier 1 first.

### Tier 1 (20 accounts)
| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|

### Tier 2 (14 accounts)
| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|

### Tier 3 (6 accounts) — deferred to P2 in fix sequencing
| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|

## Section 3 — P2 polish ({count})

Nice-to-have. One cleanup PR after P0+P1.

| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|

## Fix sequencing recommendation

PR batch 1 (P0 systemic): {N} PRs, one per finding, each touching shared
components — highest leverage.

PR batch 2 (P1 per-account): {M} PRs grouped by tier — Tier 1 → Tier 2.

PR batch 3 (P2 polish): 1 cleanup PR rolling up everything.

## Casey triage questions

(Use this section to flag specific decisions you want Casey to make
before fix-work starts. E.g., "P0 finding X proposes building a
marginalia component — confirm scope before implementing?")
```

- [ ] **Step 4: Re-run leak-scan on the master**

```bash
grep -iE 'Kaleris|PINC|Exel|BlueTriton|Primo Brands.*anchor|pactiv-pinc' \
  /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-microsite-master-punch-list.md
```
Expected: no matches.

- [ ] **Step 5: Commit master + present to Casey**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add docs/audits/2026-05-11-microsite-master-punch-list.md
git commit -m "docs(audits): consolidated microsite master punch list

P0 systemic / P1 per-account / P2 polish. {K} findings after dedupe
across the two cross-cutting audits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Then in the main session, report to Casey:

```
Master punch list at docs/audits/2026-05-11-microsite-master-punch-list.md.

- {N} P0 systemic findings (recommend tackling first — each PR fixes
  the issue across all 40 accounts)
- {M} P1 per-account findings (Tier 1 first)
- {K} P2 polish findings (one cleanup PR at the end)

Triage questions at the bottom of the master. Once you've decided
which P0s ship and any scope changes, the fix-phase plan can be
generated.
```

---

## Self-review

Reviewed against the spec at commit `0f7a48d`:

**Spec coverage:**
- ✅ Two parallel subagent passes — Tasks 6, 7 (with parallelism noted)
- ✅ Both viewports (1280, 390) — design-critique prompt + workflow specifies both
- ✅ Severity-banded punch list with fix per row — schema in Task 2, enforced in prompts
- ✅ Consolidation flow — Task 9 dedup + grouping + sequencing
- ✅ Leak scan as hard gate — embedded in both prompts AND re-run in Tasks 6.5, 7.4, 9.4
- ✅ Tier 3 P2 deferral — account list (Task 1) marks tier 3, master template (Task 9) groups by tier
- ✅ Coverage rule (360 minimum rows) — schema (Task 2) + verification (Tasks 6.4, 7.3)
- ✅ Account list as single source of truth — Task 1

**Out of scope (per spec):**
- ✅ Fix-phase tasks not in this plan — final step (Task 9.5) hands off; no Task 10 for fixes
- ✅ Reader-context layer not audited — design prompt audits default render; ux-copy prompt explicitly excludes `?p=`

**No placeholders detected.** Account list (Task 1) shows real slugs; prompts (Tasks 3, 4) are full self-contained content; schema (Task 2) is the actual format.

**Path consistency:** All paths use `docs/audits/2026-05-11-*` naming. Screenshot directory consistent (`docs/audits/screenshots/`). Component paths verified against `src/components/microsites/`.
