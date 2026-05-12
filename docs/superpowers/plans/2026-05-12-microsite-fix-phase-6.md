# Microsite Fix Phase 6 — A+ Top 5 + Tier-1 Baseline Sweep

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extend the Kraft-Heinz A+ treatment across the rest of the Tier-1 portfolio in two tracks. Track A applies the full 12-task overhaul to the 5 highest-priority accounts that don't have it yet. Track B applies a 4-task baseline upgrade pack to the remaining 14 Tier-1 accounts so they read consistently dense without the per-account artifact authoring lift.

**Why now:** The KH A+ pass (PRs #80 + #81) proved out the systemic moves — `marginaliaItems` schema field, `pullQuote` field, `<MemoPullQuote>` component, denser `extractMarginaliaItems` default. Those structural pieces ship the same lift for every account. The per-account hand-tuning is what differentiates an A+ page from a baseline one. This plan amortizes the structural work and concentrates hand-tuning where prospect priority is highest.

**Architecture:**
- Track A (Phase 6A): five custom artifact SVGs + deep per-account content rewrites. Each account gets the full KH treatment.
- Track B (Phase 6B): four tasks per account, no artifact, no deep personVariant rewrite. Dispatched as parallel implementer subagents.

**Master punch list:** `docs/audits/2026-05-11-microsite-master-punch-list.md`
**Reference:** `docs/superpowers/plans/2026-05-12-microsite-kraft-heinz-a-plus.md` (KH pass — quality bar for this phase)

**Tier-3 reach accounts (john-deere, hyundai-motor-america, honda, kenco-logistics-services, barnes-noble, fedex) are explicitly OUT of scope** — they just got their bodies in Phase 3 Cohort E and are low-priority. Phase 7 can revisit if needed.

---

## Roster

### Phase 6A — Top 5 A+ overhaul (12 tasks per account)

Selected by priorityScore + likely prospect-visit volume + depth of available decision-maker intel:

| # | Slug | Priority | Vertical | Hook anchor (the "Lighthouse equivalent") |
|---|---|---|---|---|
| 1 | `dannon` | 95 | beverage / dairy | Danone / Manifesto operating programs · already maximalist (608 lines) — verify it's at A+ density, add missing pieces |
| 2 | `frito-lay` | 93 | cpg | PepsiCo PEP+ / Smart Network / autonomous yard at PepsiCo White River MO |
| 3 | `ab-inbev` | 91 | beverage | BEES (B2B platform) / Voyager (digital) / Connect 2.0 |
| 4 | `coca-cola` | 84 | beverage | Coca-Cola System refranchising / Operating Network / SAP transformation |
| 5 | `kimberly-clark` | 78 | cpg | Powering Care productivity program (Tamera Fenske's signature, board-visible) |

### Phase 6B — Tier-1 baseline sweep (4 tasks per account)

14 accounts — every remaining Tier-1 microsite. Each gets the 4-task pack: cover hook + marginalia + hypothesis pull-quote + audio intro override.

| # | Slug | Priority |
|---|---|---|
| 1 | `general-mills` | 88 |
| 2 | `westrock-coffee` | 84 |
| 3 | `bob-evans-farms` | 84 |
| 4 | `cj-logistics-america` | 83 |
| 5 | `nestle-usa` | 82 |
| 6 | `unfi` | 80 |
| 7 | `daimler-truck-north-america` | 80 |
| 8 | `boston-beer-company` | 80 |
| 9 | `dhl-supply-chain` | 79 |
| 10 | `pactiv-evergreen` | 76 |
| 11 | `cost-plus-world-market` | 73 |
| 12 | `salson-logistics` | 72 |
| 13 | `universal-logistics-holdings` | 70 |
| 14 | `sc-johnson` | 70 |

---

## Phase 6A — A+ template (12 tasks per account)

Mirrors the KH plan exactly. Each account is one implementer-subagent task end-to-end.

### Per-account checklist

- [ ] **Task A1 — Cover hook**: set `coverHeadline` + `titleEmphasis`. Name the company's signature initiative in the H1.
- [ ] **Task A2 — Hypothesis paragraph break**: split `observation.hypothesis` into 3 paragraphs with `\n\n` separators.
- [ ] **Task A3 — Pull-quote**: set `observation.pullQuote` to the punchline sentence from paragraph 1.
- [ ] **Task A4 — Composition rows**: replace generic rows with named-program specifics (analogous to KH's "Lighthouse coverage seam" + "Forecast adoption" rows).
- [ ] **Task A5 — Comparable tightening**: trim weight-pulling-twice phrases; add a closing sentence that names the signature initiative ("X runs the operating layer Y is shaped to host…").
- [ ] **Task A6 — Methodology**: sharpen unknown #1 with a specific operator-knowledge hook; add 1–2 unknowns that invite pushback; add tenure source for the named decision-maker.
- [ ] **Task A7 — About + signOff**: rewrite `about.authorBio` last sentence + `about.signOff` to address the decision-maker by first name with their career-history hook.
- [ ] **Task A8 — personVariant rewrite**: rewrite `framingNarrative` + `openingHook` + `stakeStatement` for the top decision-maker (use a public quote of theirs back at them if available).
- [ ] **Task A9 — Marginalia** (`marginaliaItems`): 5–6 hand-tuned items spanning industry baseline / named programs / decision-maker quote / network rollout.
- [ ] **Task A10 — Audio brief override** (`audioBrief`): per-account intro hooks the decision-maker; 5 account-specific chapter titles replace the canonical chapters. Reuse canonical `/audio/yard-network-brief.mp3` as `src`.
- [ ] **Task A11 — Artifact section**: SVG asset at `public/artifacts/{slug}-{visual}.svg`. Use the KH Lighthouse-tile pattern as the template — adapt the labels to the account's signature operating-system surface. New section added between `observation` and `comparable`.
- [ ] **Task A12 — Verification + commit**: vitest + tsc + leak scans; per-task commits.

### Implementer subagent prompt (per Phase-6A account)

Each subagent gets:

```
You are upgrading the {ACCOUNT_SLUG} microsite to A+ — matching the
Kraft-Heinz reference at src/lib/microsites/accounts/kraft-heinz.ts
(post-PR #80 + #81). Read kraft-heinz.ts in full as the quality bar.

Then read your account file:
  src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts

Pull intel from (in order):
1. Legacy JSDoc comments in the account file
2. clawd dossier: /mnt/c/Users/casey/clawd-control-plane/artifacts/signal_dossiers/{ACCOUNT_SLUG_UNDERSCORES}.json (if exists)
3. Google Drive MCP: title contains '{ACCOUNT_NAME}' and (title contains 'FREIGHTROLL' or 'PILOT' or 'BUSINESS CASE')
4. WebSearch: '{ACCOUNT_NAME} {SIGNATURE_PROGRAM}', '{ACCOUNT_NAME} supply chain transformation', '{DECISION_MAKER_NAME} public statements'

Apply the 12-task A+ template (see docs/superpowers/plans/2026-05-12-microsite-fix-phase-6.md
§ Phase 6A § Per-account checklist).

For Task A11 (artifact SVG), follow the Kraft-Heinz Lighthouse-tile pattern
at public/artifacts/kraft-heinz-lighthouse-tile.svg. Adapt the 6-tile
coverage map to the account's operating-system surface (the 5–6 named
programs that already cover the company's planning/visibility/orchestration
domains, plus the 1 unfilled "Yard Network Ops" tile). Save as
public/artifacts/{ACCOUNT_SLUG}-coverage-map.svg.

Hard rules:
- 237-facility CPG anchor is un-name-able. Primo Brands is fair game.
- No sales-tell, no event names, no anchor-name leak.
- Audio brief: src stays /audio/yard-network-brief.mp3 (canonical 5:24 file).
  Only intro + chapters get personalized.

Verification:
  npx vitest run tests/unit/microsites/ tests/unit/microsite-memo-shell.test.tsx
  npx tsc --noEmit
  grep -iE "BlueTriton|Niagara|Pure Life|Poland Spring|Stanwood|Cabazon|
    Breinigsville|book a call|schedule.*audit|annual savings|we eliminate|
    our solution|MODEX|ProMat|CSCMP EDGE|RILA LINK" \
    src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts
  → all clean

Commit per-task or batched per the KH PR #80 pattern (two commits:
schema/component changes if any, then KH-style data commit).

REPORT STATUS:
- DONE (with commit SHAs)
- DONE_WITH_CONCERNS (state them)
- NEEDS_CONTEXT (what's missing)
- BLOCKED (why)
```

Five subagents dispatched in parallel after each other if context allows; otherwise serially.

---

## Phase 6B — Baseline upgrade pack (4 tasks per account)

Faster pattern. Same systemic infrastructure (`marginaliaItems`, `pullQuote`, audio override) but no artifact section, no deep personVariant rewrite.

### Per-account checklist

- [ ] **Task B1 — Cover hook**: set `coverHeadline` + `titleEmphasis`. Name the company's signature initiative or core operating fact in the H1. Keep ≤ 60 characters.
- [ ] **Task B2 — Marginalia** (`marginaliaItems`): 5–6 hand-tuned items pulled from the account's existing composition rows + 1–2 punch facts about the network or named programs.
- [ ] **Task B3 — Hypothesis pull-quote**: set `observation.pullQuote` to one strong sentence from `observation.hypothesis` (the punchline of the lead paragraph). If hypothesis is a single dense paragraph, additionally split into 2+ paragraphs with `\n\n`.
- [ ] **Task B4 — Audio brief intro** (`audioBrief.intro`): per-account intro that hooks the named decision-maker or company-specific operating context. Keep `src` = `/audio/yard-network-brief.mp3` and `chapters` = canonical (no chapter changes). 1–2 sentences max.

### Implementer subagent prompt (per Phase-6B account)

```
You are running the Phase-6B baseline upgrade on the {ACCOUNT_SLUG}
microsite. Read kraft-heinz.ts as the A+ reference — but DO NOT apply
the full 12-task treatment. Apply only the 4 tasks in
docs/superpowers/plans/2026-05-12-microsite-fix-phase-6.md § Phase 6B.

Read {ACCOUNT_SLUG}.ts, light intel pass (legacy JSDoc + 1 quick WebSearch
to confirm the signature initiative). No clawd dossier read required
unless the WebSearch turns up gaps.

For Task B4 (audio intro), construct an AccountAudioBrief with src =
canonical, chapters = canonical (import AUDIO_BRIEF_CHAPTERS from
src/lib/microsites/audio-brief.ts), and intro = per-account 1–2
sentences. generatedAt = current ISO timestamp.

Verification: same as Phase 6A but skipping the artifact-asset check.
Commit as one per-account commit (no per-task split).

REPORT STATUS as in Phase 6A.
```

14 subagents → dispatch in two parallel waves of 7 (or in 3 waves of 5 if rate-limited).

---

## Branch + PR strategy

| Phase | Branch | PR scope | Per-account commits |
|---|---|---|---|
| 6A | `feat/microsite-phase-6a-top5-a-plus` | 5 accounts, 1 PR | Yes (per account or per task) |
| 6B | `feat/microsite-phase-6b-tier1-baseline` | 14 accounts, 1 PR | Yes (one commit per account) |

Each PR opened against `main`, awaits CI green, merges via merge commit (preserves per-account commits in history). Vercel production deploy verified on merge.

---

## Verification (whole phase)

```
cd C:\Users\casey\modex-gtm
npx vitest run tests/unit/microsites/ tests/unit/microsite-memo-shell.test.tsx tests/unit/microsite-memo-audio-brief.test.tsx
npx tsc --noEmit
grep -h "accentColor:" src/lib/microsites/accounts/*.ts | sort | uniq -d
```

All three must pass / return zero output.

Spot-check on Vercel preview:
- [ ] All 5 Phase 6A accounts render their artifact SVG between observation and comparable
- [ ] All 19 accounts touched in Phase 6 render their `coverHeadline` (no fallback to template) with italic-accent on `titleEmphasis`
- [ ] All 19 accounts render 5–6 marginalia items in the right gutter (mobile collapses gutter; that's expected)
- [ ] All 19 accounts render a pull-quote between hypothesis ¶1 and ¶2
- [ ] All 19 accounts render a per-account audio intro

---

## Out of scope

- **Tier-2 cosmetic sweep**: deferred — accounts just got their bodies in Phase 3, polish premature.
- **Tier-3 reach accounts**: stay as-is (Phase 3 Cohort E migrated them; no upgrade planned).
- **Per-account audio recordings**: every microsite plays the canonical `/audio/yard-network-brief.mp3` (5:24). Recording per-account audio is a separate Phase 7+ effort that needs voice + studio time.
- **Per-account artifact rollout to 14 Tier-1 baseline accounts**: explicitly cut from 6B to keep scope tight. Re-evaluate after 6A ships and we know how much time per artifact SVG actually costs.

---

## Self-review checklist

- [x] Phase 6A roster of 5 selected by priorityScore + decision-maker depth
- [x] Phase 6B roster of 14 covers all remaining Tier-1
- [x] Implementer prompts are self-contained (a subagent can execute without further context)
- [x] Artifact treatment scoped to top 5 only (the right cut between depth and breadth)
- [x] Tier-3 explicitly out of scope
- [x] Verification commands are exact and copy-paste-ready
