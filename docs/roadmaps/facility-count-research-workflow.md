# Facility Count Research Workflow

Status: Ready to execute
Created: 2026-04-07
Primary repo: modex-gtm
Reference patterns: clawd-control-plane search adapter, dossier ledger, and swarm audit architecture

## Goal

Replace guessed facility counts with source-backed counts that can be trusted in microsites, ROI models, and outreach narratives.

## Why This Exists

The current microsite factory still has a bad fallback path: if a dossier and `accounts.json` do not provide a count, `scripts/generate-microsite-data.ts` drops to an ICP-based guess. That was acceptable for broad scaffolding. It is not acceptable for ROI-backed flagship pages.

## Deliverables

1. A dedicated facility fact source of truth in `src/lib/data/facility-facts.json`.
2. A repeatable Google query workbench in `docs/research/facility-count-workbench.md` and `.csv`.
3. CLI coverage visibility through `npm run research:facility-report`.
4. Microsite generation that prefers facility facts before dossier, `accounts.json`, or heuristic fallback.

## Source Hierarchy

1. `src/lib/data/facility-facts.json`
2. Standalone or top-10 research dossier count
3. `src/lib/data/accounts.json` count
4. Heuristic fallback based on ICP fit

The rule is simple: every flagship account should move to tier 1 in this hierarchy.

## Execution Workflow

1. Generate the workbench.
   Command: `npm run research:facility-pack`
   Outcome: per-account Google queries, current repo count, and evidence placeholders.
2. Research the account.
   Query order:
   1. Official footprint / locations page
   2. Annual report / investor relations
   3. SEC filings
   4. North America footprint
   5. Expansion / opening history
   6. Operations / supply-chain interviews
3. Reconcile the count.
   Capture:
   1. Exact count string
   2. Scope
   3. Confidence
   4. Summary
   5. Two best sources
4. Update `src/lib/data/facility-facts.json`.
5. Run `npm run research:facility-report`.
6. If the count changes a generated microsite, re-run `tsx scripts/generate-microsite-data.ts`.
7. If the account has a hand-authored ROI model, update that account config explicitly so the model and source notes stay aligned.

## Importing Evidence Rows

1. Prepare CSV or TSV rows with these headers:
   `account`, `facilityCount`, `scope`, `status`, `confidence`, `summary`, `source1Label`, `source1Url`, `source2Label`, `source2Url`.
2. Pipe the rows into `npm run research:facility-import` or pass `--file <path>`.
3. Use `--dry-run` when you want to inspect the merged JSON before writing it.
4. Re-run `npm run research:facility-report --flagships --strict` after import.

## Atomic Sprint Tasks

### Sprint slice A: Fact plumbing

1. Add a typed facility fact schema and account-key normalization.
2. Add facility-count resolution helpers so every consumer uses the same precedence rules.
3. Wire the microsite generator to the new fact source.

### Sprint slice B: Research operator workflow

1. Generate a Google query pack for the top target accounts.
2. Export the same pack as CSV for spreadsheet or browser-tab workflows.
3. Add a coverage report so Casey can see which accounts are still running on guesses.

### Sprint slice C: Research execution

1. Backfill verified counts for the five flagship accounts first.
2. Backfill the remaining 15 target accounts.
3. Mark ambiguous counts as `provisional` instead of faking certainty.

### Sprint slice D: ROI alignment

1. Update flagship `roiModel` facility mix inputs after verified counts land.
2. Add source notes in ROI configs that point back to the facility-fact evidence.
3. Stop using `+` counts in flagship ROI scenarios unless the evidence itself is only a lower bound.

## Quality Gates

1. Flagship accounts should not rely on heuristic facility counts.
2. Every fact entry should include scope and at least one named source.
3. `research:facility-report --flagships --strict` should pass before scaling ROI claims across new flagship pages.
4. Generated microsites should inherit the researched count automatically.

## Future Upgrade Path

The current workflow is intentionally lightweight and operator-friendly. The next step, if needed, is to lift three proven patterns from clawd-control-plane:

1. Provider-agnostic web search routing.
2. Evidence-ledger completeness tracking.
3. Parallel research swarm execution for multi-source footprint discovery.

That can happen without changing the fact schema or the microsite generator contract.