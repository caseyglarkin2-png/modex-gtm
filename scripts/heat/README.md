# Account Heat Score — ops runbook

The engine (`src/lib/revops/heat/heat-score.ts`) is pure math (tests: `tests/unit/heat-score.test.ts`). Nothing on main invokes it on a schedule; the two scripts here are manual.

## Dry run (read-only, safe)

```bash
HUBSPOT_ACCESS_TOKEN=... npx tsx scripts/heat/heat-dry-run.ts
```

Zero HubSpot writes (search endpoints only; `hubspotWrites:0` stamped in the output). Produces the ranked report (`scratchpad/heat-score-ranked.{md,json}`).

## Writer — NOT production-complete. Two gates + three known gaps

Runs only with BOTH `HEAT_WRITE_ENABLED=1` env AND `--apply` argv; otherwise a no-op that touches nothing (not even property creation). It writes exactly two company properties it owns: `yardflow_heat` (number) and `yardflow_heat_tier` (enum 1-4). It never touches the pounce trigger properties, the intent properties, or deals (verified by adversarial review 2026-07-08).

Before first real use, a successor must close (from the same review):
1. `rows` is a deliberately-empty stub — implement the ranked-row -> HubSpot company-id join over the FULL TAM-in set (not the top-60 report file).
2. Add 429 retry/backoff to `writeHeat()` (mirror `hsPost()` in heat-dry-run.ts).
3. Surface partial batch failures (non-zero exit + per-batch report), don't just log-and-continue.
