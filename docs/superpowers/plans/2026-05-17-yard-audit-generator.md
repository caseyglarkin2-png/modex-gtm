# Vision-Assisted Yard Audit Generator — Implementation Plan

> Durable copy saved 2026-05-17 after a mid-session computer crash. The original
> plan was produced in a prior session and existed only in chat; this file is
> the recovery copy so it can't be lost again.

---

## RESUME STATE (2026-05-17)

**Branch:** `feat/yard-audit-generator` (off `main`)

**Phase 0 — Infrastructure: COMPLETE (verified 2026-05-17).**
- [x] 0.1 `archetype-key.json` — 10 archetypes; precedence recalibrated (#6
      campus ahead of #4 backup-sensitive) to fit Jake's Kraft labels
- [x] 0.2 `schema.json` — 42-column Kraft CSV schema (two header rows + columns)
- [x] 0.3 `classify-prompt.md` — satellite vision-classification rubric
- [x] 0.4 `lib.ts` (`assignArchetype()`) + `generate-csv.ts` — archetype
      assignment reproduces 26/27 of Jake's Kraft labels (96%); lone miss is
      Davenport #5 (multi-step check-in not visible from one overhead frame)
- [x] 0.5 `extract-facilities.ts` — dossier + accounts.json facility extractor
      (verified on Dannon: 8 named plants + HQ flagged)
- [x] (support) `parse-kraft-baseline.ts` + `kraft-baseline.csv` → `kraft-heinz/baseline.json`

**Maps imagery:** Working. `GOOGLE_MAPS_STATIC_API_KEY` set in `.env.local`,
billing live. `fetch-satellite.ts` (z17/18/19 + Street View) and `probe.ts`
(on-demand satellite/Street View for the deep-audit agent) built.

**Phase 4.1 Kraft calibration — DONE. Verdict: reframe.**
- Fast pass (satellite + 1 Street View frame, subagent classify): ~78% on
  archetype-driving fields, ~33% exact-archetype — too brittle (archetype is a
  conjunction of ~9 noisy fields).
- Tier-2 deep-audit agent (`probe.ts` multi-angle imagery + web research)
  tested on 5 fast-pass failures: correct on all 5 — matched Jake on 3,
  *corrected* Jake on 2 (Avon, Massillon), confirmed by independent re-check.
- Conclusion: Jake's Kraft sheet has real errors — a rough prior, not ground
  truth. The deep-audit agent is the quality classifier.

**DECISION: deep-audit every site** (~45 accounts, ~1,000 sites). Per-facility
pipeline = deep-audit agent (resolve location + probe imagery + web research +
classify). Fast pass retired from the run.

**Execution status (2026-05-17):**
- Pipeline PROVEN end-to-end. Dannon (14 sites) + Diageo (10) fully deep-audited;
  CSVs generated in Jake's 42-column format at
  `output/yard-audits/<slug>/<slug>-location-breakdown.csv`.
- 15 accounts rostered (~305 facilities): dannon, diageo (audited) +
  general-mills, hormel-foods, jm-smucker, frito-lay, georgia-pacific, ab-inbev,
  coca-cola, the-home-depot, h-e-b, john-deere, mondelez, nestle-usa, ford.
- Deep-audit agents reliably self-correct bad roster coordinates (Step 0).
- ~28 accounts still need discovery; ~975 deep audits remain.
- Per-facility dispatch: a subagent reads `scripts/yard-audit/deep-audit-prompt.md`
  + its `roster.json` entry; writes `sites/<NN-slug>.json` + `dossiers/<NN-slug>.md`.
  Per-account CSV via `generate-csv.ts <slug>`.
- OPEN DECISION: run the remaining ~975 audits via a scripted Anthropic-API
  runner (unattended, needs `ANTHROPIC_API_KEY`) vs. continuing in-session
  subagent batches.

**Scripts built (`scripts/yard-audit/`):** archetype-key.json, schema.json,
classify-prompt.md, lib.ts, generate-csv.ts, extract-facilities.ts,
parse-kraft-baseline.ts, fetch-satellite.ts, diff-calibration.ts, probe.ts,
deep-audit-prompt.md, discovery-prompt.md.

**Decisions made on resume:**
- **Scope expanded** from 16 → all dossier accounts (~42, minus Kraft, already done)
  **+ Niagara Bottling + Crowley + GXO** ≈ ~45 accounts. Cap 30 U.S. sites/account.
- **Imagery source:** Google Maps Static API. Key expected at
  `GOOGLE_MAPS_STATIC_API_KEY` in `.env.local` (pending — user provisioning).
- **Classification engine:** done in-session by Claude Code (covered by user's
  Max plan, $0 per-call). Anthropic API batch run reconsidered for the bulk
  *after* Kraft calibration proves accuracy; not committed.
- **Execution cadence:** Phase 0 → Phase 4.1 Kraft calibration → review accuracy
  with user → then bulk account processing. NOT a blind autonomous marathon.
- "12–15h single run" estimate is obsolete at ~45 accounts / ~800–1000 sites;
  treat as a multi-batch effort.

---

## THE PLAN: Vision-Assisted Yard Audit Generator

### Scope

Accounts: full dossier set in `docs/research/*-dossier.md` (excluding Kraft Heinz,
which Jake completed and which serves as the calibration baseline), plus Niagara
Bottling, Crowley, GXO.

**Scoping rule:** For accounts with 30+ facilities, scope to U.S.
manufacturing/distribution sites only. Cap at 30 sites per account (matching
Jake's Kraft approach). Prioritize sites with known yard complexity.

### Phase 0: Infrastructure (Build Once, Use For All)

- **0.1** Extract archetype taxonomy from Kraft CSV → `scripts/yard-audit/archetype-key.json`
  (10 archetypes #1–#10, classification criteria, assignment precedence).
- **0.2** Define CSV schema — exact column order matching Jake's Kraft sheet
  (42 columns), data types per column, summary stats block template →
  `scripts/yard-audit/schema.json`.
- **0.3** Build classification prompt template — structured prompt taking a
  satellite screenshot, returning the classification object (gate, guardShack,
  remoteGs, preGateStaging, postGateLong/Short, backupSensitive, entry/exitLanes,
  fastLaneOpportunity, dockDoors band, dropArea band, shipRcvSeparate, urbanRural,
  connectivityIssue, multipleFacilities, scale, dropYard). Include reference
  examples from Kraft data → `scripts/yard-audit/classify-prompt.md`.
- **0.4** Build CSV generator — input account name + classified site objects,
  output CSV matching Jake's layout, auto-computes archetype assignment +
  summary stats block → `scripts/yard-audit/lib.ts` + `generate-csv.ts`.
- **0.5** Build facility discovery extractor — reads dossier .md, accounts.json,
  facility-facts.json; extracts facility names/cities/states/types; generates
  Google Maps search URLs → `scripts/yard-audit/extract-facilities.ts`.

### Phase 1: Facility Discovery (Per Account)

Read dossier + accounts.json + facility-facts.json (and existing
`docs/research/facility-count-workbench.{csv,md}`); web-search U.S. plants and
DCs; compile master facility list (name, city, state, type, Maps satellite URL);
cap at 30, prioritizing manufacturing > DC > warehouse, named-in-dossier, largest
footprint, geographic diversity → `output/yard-audits/{account}/facilities.json`.

### Phase 2: Vision Classification (Per Facility)

Fetch satellite imagery (Google Maps Static API) at facility + gate + dock +
drop-yard framing; classify against the archetype key using visual evidence;
assign archetype number; record confidence (high/medium/low) →
`output/yard-audits/{account}/sites/{facility-slug}.json`.

### Phase 3: CSV Generation (Per Account)

Load all site JSONs; generate CSV (Kraft header schema, one row per facility,
Maps URL in final column, blank cells for non-satellite-visible operational
data); compute + append summary stats block →
`output/yard-audits/{account}/{account}-location-breakdown.csv`; generate
`confidence-report.md` (high-confidence, needs-review, URL-not-found).

### Phase 4: Validation & Packaging

- **4.1** Calibration: run the pipeline on Kraft facilities using their Maps URLs,
  diff against Jake's classifications (`baseline.json`), measure field-match
  accuracy (target >80%), adjust heuristics if below.
- **4.2** Generate `output/yard-audits/INDEX.md` — all accounts, totals,
  confidence breakdown.
- **4.3** Generate sales-ready summary per account — key stats (% guarded,
  % rural, fast-lane opportunities), archetype distribution, recommended
  YardFlow entry point.

### Execution Order

`0.1 → 0.2 → 0.3 → 0.4 → 0.5` → `4.1 (Kraft calibration)` → per-account
`1.x → 2.x → 3.x` → `4.2 → 4.3`.

### Output Structure

```
output/yard-audits/
├── INDEX.md
├── kraft-heinz/            (validation baseline — baseline.json done)
├── {account}/
│   ├── facilities.json
│   ├── sites/{facility-slug}.json
│   ├── {account}-location-breakdown.csv
│   └── confidence-report.md
└── ...
```
