# Microsite Design + UX-Copy Audit System

**Date:** 2026-05-11
**Owner:** Casey Larkin
**Surface:** `/for/[account]` per-account memo pages (40 hand-tuned accounts) on yardflow.ai (served via flow-state-site → modex-gtm rewrite)

---

## Goal

Audit all 40 hand-tuned microsites against a structured rubric for visual design and copy, produce a severity-banded punch list with a proposed fix on every row, then ship fixes in PR batches ordered by severity. The audit is the plan; consolidation + sequencing happen in the main session.

## Why now

The first sweep of hand-tuning got 40 accounts to live, but the desktop reading experience has a known immersion gap (empty 14rem aside gutter — `memo-shell.tsx:232` — admitted in inline comment as M8-deferred) and mobile is unverified. The fix work needs to be driven by evidence, not gut feel.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUDIT PHASE (parallel subagents)              │
├──────────────────────────────┬──────────────────────────────────┤
│  design-critique subagent    │   ux-copy subagent               │
│  ─────────────────────────   │   ─────────────────────────      │
│  • Playwright nav 40 sites   │   • Reads account .ts files      │
│  • 1280px + 390px viewports  │   • Cross-refs editorial-style   │
│  • Scores 9 design dimensions│   • Scores 9 copy dimensions     │
│  • Outputs design-audit.md   │   • Outputs copy-audit.md        │
└──────────────────────────────┴──────────────────────────────────┘
                                │
                                ▼
              ┌──────────────────────────────────┐
              │  CONSOLIDATION (main session)    │
              │  • Dedupe overlapping findings   │
              │  • Merge into one master list    │
              │  • Group P0 systemic, P1 per-    │
              │    account, P2 polish            │
              │  • Casey triages                 │
              └──────────────────────────────────┘
                                │
                                ▼
       ┌────────────────────────────────────────────────┐
       │   FIX PHASE (subagent-driven-development)      │
       │   • P0 first (one PR per systemic issue —      │
       │     touches all 40 accounts at once)           │
       │   • P1 next (per-account batches by tier)      │
       │   • P2 last (one cleanup PR)                   │
       └────────────────────────────────────────────────┘
```

## Decisions log

- **Deliverable shape:** Audit-first, fix what surfaces. No standalone system spec; the rubrics + punch lists ARE the system.
- **Audit slice:** Cross-cutting passes (two subagent runs across all 40), not 40 per-account audits. Surfaces systemic patterns.
- **Viewport scope:** Both 1280px (desktop) and 390px (mobile) in each pass.
- **Output shape:** Severity-banded punch list with a proposed fix on every row. The audit IS the mini-plan.
- **Tier 3 deferral:** Tier 3 (Barnes & Noble, FedEx, Honda, Hyundai, John Deere, Kenco) gets the same audit, but P2 polish findings are deferred — these are stub-tier reach accounts.

## Scope

**In scope:**
- All 40 hand-tuned account microsites at `/for/{slug}` on yardflow.ai
- Desktop viewport: 1280px wide
- Mobile viewport: 390px wide
- Memo shell, memo sections, audio brief, soft-action CTA, footnotes, end-mark colophon
- Editorial compliance against `docs/editorial-style.md` and the un-name-able anchor invariant

**Out of scope:**
- The `/for/[account]/[person]` reader-personalization layer (audited only as it appears under default no-`?p=` render)
- Operator pages (`/replies`, etc.) — those live on `modex-gtm.vercel.app`, not yardflow.ai
- Audio brief MP3 quality / NotebookLM output (separate audio pipeline work)
- Microsite tracker analytics + HubSpot integration
- A net-new design system. The audit may surface new primitives (e.g., a marginalia component), but they're proposed as fixes, not pre-specced

## Punch list row schema

Both audit outputs use the same row schema so consolidation is mechanical:

```
SEVERITY  P0 systemic | P1 per-account | P2 polish
SCOPE     "All 40" | "Tier 1 (20)" | "kraft-heinz only"
SURFACE   cover | prose | marginalia | audio-brief | soft-action |
          footnote | colophon | mobile | <component>
DIMENSION <one of the 9 rubric dimensions, by name>
FINDING   1-2 sentence diagnosis (specific, evidence-grounded)
EVIDENCE  file:line OR screenshot path OR copy excerpt
FIX       1-paragraph diff sketch: which file changes, what changes,
          ideally with a before→after snippet for prose findings
```

**P0 systemic** = touches all (or most) accounts; one PR fixes it everywhere. Example: "Empty aside gutter on desktop — add marginalia primitive to memo-section.tsx."
**P1 per-account** = specific to one or a few accounts; fix is per-file. Example: "Kraft Heinz §2 lapses into displacement-pitch language; rewrite to coexistence-wedge."
**P2 polish** = nice-to-have, not blocking compelling-form. Example: "Section eyebrow numerals could use tabular-figures."

## /design-critique rubric (9 dimensions)

Applied to all 40 microsites at 1280px and 390px. Each dimension yields ≥1 row (or "no issue" — explicitly noted) per account so coverage is complete.

| # | Dimension | The question |
|---|-----------|--------------|
| 1 | Gestalt / immersion | Does this read as a bound analyst memo, or a webpage pretending to be one? (Pre-existing gap: empty 14rem aside gutter on desktop — `memo-shell.tsx:232`.) |
| 2 | Typographic hierarchy | Fraunces opsz/SOFT/WONK axes pulling weight at H1, eyebrow, drop cap, end-mark? Body opsz 14 feels like reading, not display set small? |
| 3 | Color budget | Accent appears at: cover pip, italicized phrase in H1, contents-rail active marker, section eyebrow numerals, footnote markers, soft-action link, §∎ end-mark. Anything else is a leak. |
| 4 | Marginalia / gutter | The "second voice." Pull quotes, footnote previews, side-running data. Does the right gutter contribute, or is the reader staring at text in the middle of an empty page? |
| 5 | Motion choreography | Cover stagger (rise-1 → rise-4 over 1.6s), continue-nudge, scrollspy TOC, audio brief player, soft-action hover. Each feels earned, not decorative. Reduced-motion path verified. |
| 6 | Mobile responsive collapse | At 390px: TOC rail hidden (correct), prose column width, drop-cap behavior, audio brief player height, cover spread vertical rhythm, soft-action CTA tap target. Does the memo metaphor survive? |
| 7 | Evidence density | "Receipts > claims" — DESIGN side. Footnote marker density (≥1 per ~150 words body), citation hairlines, source-line typography reads as bibliography. ≥1 redacted-artifact treatment per memo (Module Inspector screenshot, redacted manifest, attribution-free quote block). Zero artifacts + 2 footnotes = FAIL. |
| 8 | Surface-by-surface | Cover spread, audio brief, prose body, section eyebrow + numeral, footnote marker, soft-action, end-mark colophon — each surface judged on whether it does its specific job. |
| 9 | Interaction polish | Focus rings, hover states, scrollspy accuracy, audio brief seek behavior, link border-bottom rendering, ::selection color. |

### Subagent constraints (design-critique)

- **No new components in findings.** The fix column proposes diffs to existing files (`memo-shell.tsx`, `memo-section.tsx`, `memo-shell-chrome.tsx`, etc.) or new files only when a primitive is genuinely missing (e.g., marginalia). Otherwise we get a punch list of "consider building X" wishes.
- **Editorial invariants are guardrails.** Marginalia content cannot leak Kaleris/PINC/Exel or the un-name-able anchor — `docs/editorial-style.md` is constraint, not suggestion.
- **Don't propose redesigns.** Findings must be incremental against the existing memo metaphor; the brief is "enhance into most compelling form," not "rebuild."

## /ux-copy rubric (9 dimensions + hard gate)

Reads each account's `src/lib/microsites/accounts/<slug>.ts` directly. The subagent does not need to render the page to run this audit. Each dimension yields ≥1 row per account.

| # | Dimension | The question |
|---|-----------|--------------|
| 1 | Hook strength | §1 opener earns reader's eye? Cover headline reads as memo title, not marketing tagline? Hook fails if it could be lifted to any other account without edits. |
| 2 | Pitch-shape coherence | Account's chosen pitch shape (coexistence-wedge / partnership / modernization / displacement — usually in JSDoc header). Prose stays in shape end-to-end? Coexistence-wedge memo that pivots to displacement in §3 has a seam. |
| 3 | Specificity ratio | Concrete numbers, facility counts, dates, named comparables vs abstract claims. Target ~3 specifics per section minimum. "237-facility footprint" beats "large CPG network." |
| 4 | Voice register continuity | Cover headline + audio brief intro + section prose + footnotes sound like one writer. Watch for: cover too formal, footnotes too casual, audio intro slipping into marketing. |
| 5 | Editorial-style.md compliance | Anchor un-name-ability; no Primo/anchor conflation; no facility addresses serving as proof for the anchor; Primo comparable framed as hard-freight unlock; journalism register only on Field Reports; attribution-free quote format. |
| 6 | Sales-tell sniff | Anti-sales discipline. Disqualifying: "our solution," "we help," "transform your," "best-in-class," "industry-leading," anything that could be on a competitor's site. Memos observe; they don't pitch. |
| 7 | Scan / skim test | First sentence of each section + section eyebrow + numerals. Reader skimming only those elements gets the thesis in 30 seconds? Or does the thesis only live in §3 paragraph 4? |
| 8 | Microcopy density | Eyebrows ("Private analysis · Working memo · Not for distribution"), document IDs, captions, audio chapter labels, prepared-for lines, soft-action CTA copy, colophon — each is one chance to reinforce the memo metaphor. |
| 9 | Mobile readability | At 390px: sentence length, paragraph density, fragment usage. Lines fine at 36rem may become walls at ~22rem. Drop cap may break. Audio brief intro often too long at mobile width. |

### Hard gate: leak scan (blocking, not scored)

Any of the following blocks finalization of the punch list — the audit subagent must catch and patch, not defer:

- Kaleris, PINC, Exel mentions in renderable text
- The un-name-able anchor customer's actual name in any form
- Primo Brands conflated with the anchor (referring to them as the same entity)
- Facility addresses tied to the anchor used as proof
- Internal methodology source IDs leaking into client-rendered ids/strings (the `'pactiv-pinc-case-study'` style leak caught in PR #70)

### Subagent constraints (ux-copy)

- Pitch shape is read from the account file's JSDoc header (most hand-tuned files declare it explicitly). When ambiguous, infer from §1's opening 2 paragraphs and flag the ambiguity as a finding.
- Findings on copy must propose a rewrite snippet, not a directive ("rewrite to be more X"). Casey can accept, reject, or modify the snippet — but no rewrite = no finding.
- Reader-context preamble (`?p=` personalization) is out of scope for this pass; the default no-reader render is what gets audited.

## Subagent prompt skeletons

The writing-plans phase will turn these into full prompts. Skeleton shape:

### design-critique subagent skeleton

```
ROLE: Senior product designer with editorial typography background
TASK: Audit all 40 microsites at /for/{slug} on
      https://yardflow.ai against the 9-dimension design rubric

INPUTS:
- docs/superpowers/specs/2026-05-11-microsite-design-copy-audit-system-design.md
  (this spec — the rubric is in §design-critique rubric)
- docs/editorial-style.md (editorial invariants — guardrails)
- src/components/microsites/memo-shell.tsx, memo-section.tsx,
  memo-shell-chrome.tsx, memo-audio-brief.tsx, memo-soft-action.tsx
- Account list: <40 slugs> at /for/{slug}

TOOLS: Playwright (browser-navigate, browser-take-screenshot,
       browser-resize, browser-evaluate), Read, Grep
VIEWPORTS: 1280x900 (desktop), 390x844 (mobile)

OUTPUT: docs/audits/2026-05-11-design-critique-punch-list.md
        Punch list rows in the schema defined in §Punch list row schema

CONSTRAINTS:
- No new components in findings (diffs against existing files)
- Editorial invariants are guardrails
- Incremental against existing memo metaphor — no redesigns
- Each of the 9 dimensions yields ≥1 row per account (or "no issue")
- Screenshots saved to docs/audits/screenshots/ and referenced in
  Evidence column
```

### ux-copy subagent skeleton

```
ROLE: Senior editorial copywriter; strategy/brand voice background
TASK: Audit copy for all 40 microsites against the 9-dimension
      ux-copy rubric + leak-scan gate

INPUTS:
- docs/superpowers/specs/2026-05-11-microsite-design-copy-audit-system-design.md
  (this spec — rubric in §ux-copy rubric)
- docs/editorial-style.md (compliance source of truth)
- src/lib/microsites/accounts/*.ts (40 files — prose lives here)
- src/components/microsites/memo-audio-brief.tsx (audio chapter labels)
- src/components/microsites/memo-soft-action.tsx (CTA copy)

TOOLS: Read, Grep, Glob (no browser needed — prose lives in source)

OUTPUT: docs/audits/2026-05-11-ux-copy-punch-list.md
        Punch list rows in the schema defined in §Punch list row schema

CONSTRAINTS:
- Pitch shape read from JSDoc header; ambiguity = a finding
- Every finding includes a rewrite snippet (no directives)
- Leak scan is a HARD GATE — patch in-line, don't defer
- Reader-context (?p=) layer out of scope; default render only
- Each of the 9 dimensions yields ≥1 row per account (or "no issue")
```

## Consolidation flow

When both punch lists are produced (or one returns while the other is still running — they're independent):

1. **Dedupe** — design + copy will overlap on a few rows (e.g., a finding "section §3 hook is weak" may show up in both lenses with different fix-shapes; merge).
2. **Group by severity** — P0 / P1 / P2 buckets.
3. **Within P0:** rank by user-visible impact (gestalt > hierarchy > polish).
4. **Within P1:** group by tier (Tier 1 first, Tier 2 second, Tier 3 deferred-to-P2).
5. **Within P2:** rank by ratio of effort-to-impact.
6. **Present to Casey** — single master list at `docs/audits/2026-05-11-microsite-master-punch-list.md`.

## Fix phase sequencing

Fixes ship via `superpowers:subagent-driven-development` once Casey signs off on the master punch list.

```
PR batch 1: All P0 systemic findings (one PR per finding,
            each touching memo-shell.tsx / memo-section.tsx /
            shared primitives — these are the highest-leverage
            because each PR fixes the issue across all 40 accounts)

PR batch 2: P1 per-account findings, batched by tier
            (Tier 1 batch → Tier 2 batch → Tier 3 deferred)

PR batch 3: One P2 polish cleanup PR
```

Each PR is reviewed against the originating finding (spec compliance) before being reviewed for code quality, per the subagent-driven-development two-stage review.

## Success criteria

- Both punch lists produced and consolidated
- Casey has triaged P0 / P1 / P2 buckets
- No leak-scan failures present in the consolidated list
- A working PR batch order exists with clear stop-points for Casey review
- The audit artifacts (`docs/audits/2026-05-11-*.md` + screenshots) are durable references — future content additions get audited against the same rubric

## Risks + mitigations

- **Subagent overconfidence on visual judgment.** Design-critique is taste-sensitive; a subagent may flag things Casey would accept, or miss things he wouldn't. Mitigation: every P0 finding requires Casey's explicit triage before it becomes a PR. Subagent never auto-promotes findings to fixes.
- **Editorial-style drift during fixes.** Rewrite snippets in the punch list may quietly violate editorial-style.md. Mitigation: the leak-scan gate runs against the rewrite snippets too, not just the existing prose.
- **40-account Playwright run takes a long time.** ~40 accounts × 2 viewports = 80 page loads + ~80 screenshots. Mitigation: subagent saves a checkpoint file (`docs/audits/screenshots/.progress.json`) so the run can resume if interrupted.
- **Tier 3 audit-cost vs return-value.** Tier 3 P2 polish findings will inflate the list. Mitigation: those rows are explicitly tagged `[deferred]` in the master list — present-but-quiet.

## Next step after this spec is approved

Invoke `superpowers:writing-plans` to convert this spec into a bite-sized implementation plan with concrete tasks for:

1. Author the design-critique subagent prompt + dispatch + collect output
2. Author the ux-copy subagent prompt + dispatch + collect output
3. Consolidate into master punch list
4. Present to Casey for triage
5. (Fix-phase tasks emerge from the punch list, not from this plan)
