# Modex Proximity + Yard-Audit Export Contract (2026-06-14)

The sixth export stream, the seam that fuses modex's legit corridor
intelligence into the brain's homescreen rank. Companion to the engagement
export contract (`2026-06-13-modex-intel-export-contract.md`); same auth,
same envelope, same fail-soft posture.

## Why

modex computes a high-quality proximity score (exhaustive corridor audits
around the facilities we are already live in: `src/lib/discovery/scoring.ts`,
`compositeScore` = proximity-led blend of `proximityComponent(nearestPrimoDistance)`,
`fitComponent`, `densityComponent`) plus per-account yard audits (facilities,
gating, dock doors, trailer capacity, archetype, dossier). This is a second
legit intelligence axis, not a divergent copy of intent. The brain ingests it
as a `proximity` signal and **fuses it into the homescreen rank beside intent
and trigger heat**: a hot account that is also in a live corridor is the best
account in the building, and today neither surface can see both numbers.

clawd-prod runs on Railway and cannot read modex's disk, so this must be a
pull, not a file ingest. The local `output/yard-audits/` tree and the Drive
folder are the *initial batch* used to ground this contract; modex holds the
current, complete set and is the source of truth.

## Stream

`GET /api/intel/export/proximity/` (trailing slash; modex `trailingSlash:true`).

- Auth: `x-queue-secret: $QUEUE_AGENT_SECRET` (and `Authorization: Bearer` for
  parity with the engagement bridge).
- Pagination: keyset cursor on `(updated_at, id)`, `?limit=` (default 300),
  `?cursor=`. `since` is accepted but ignored: proximity is standing state, so
  the brain pulls the full current snapshot each run (dedup makes unchanged
  scores no-ops).
- Envelope: `{ "items": [ ... ], "nextCursor": "<opaque|null>" }`.

## Item shape

```json
{
  "account_domain": "bostonbeer.com",
  "account_name": "The Boston Beer Company",
  "composite_score": 0-100,
  "proximity_score": 0-100,
  "nearest_distance_mi": 12.4,
  "corridor_density": 3,
  "fit_score": 0-100,
  "yard_audit": {
    "facilities": 5,
    "truck_gated_pct": 20,
    "dock_doors": 71,
    "trailer_cap": 300,
    "top_archetype": "#3 (No Gate / No GS)",
    "recommended_entry": "Lead with offline-tolerant check-in ..."
  },
  "dossier_url": "https://.../boston-beer-company",
  "updated_at": "2026-06-14T00:00:00Z",
  "idempotency_key": "bostonbeer.com:2026-06-14T00:00:00Z"
}
```

- `composite_score` is the COMPLETE discovery score (`compositeScore` =
  proximity 0.55 + fit 0.30 + density 0.15, scaled to 0-100). **This is the
  number the brain fuses into the homescreen** when present. `proximity_score`,
  `fit_score`, `corridor_density` are the component breakdown, surfaced for
  display/explainability.
- **v1 / v2:** v1 may send `proximity_score` only (pure proximity axis) with
  `composite_score`/`fit_score`/`corridor_density` null, because the full
  scored set is not bundled on Vercel. The brain falls back to `proximity_score`
  when `composite_score` is null, and **upgrades to the complete score with no
  redeploy the moment `composite_score` is populated** (commit the scored set).
- At least one of `composite_score`/`proximity_score` is required besides the
  account keys; everything else is nullable (a scored account with no yard audit
  yet still flows).
- `yard_audit` mirrors the master-index fields (`output/yard-audits/
  YardFlow-Master-Index.csv`).
- `idempotency_key` should encode the score version (`<domain>:<updated_at>`)
  so a recompute writes a NEW ledger row (proximity history over time) while a
  re-pull of an unchanged score is a no-op.

## clawd side (this repo, built against the contract, fail-soft until live)

- `intel_export_pull.map_proximity(rec) -> value|None` (pure): builds the
  `proximity` signal value, drops nulls, guarantees `idem`.
- `intel_export_pull.pull_proximity()` + `ingest_modex_proximity()`:
  account-scoped, no person, no `sent_only`, full-snapshot pull. Registered in
  `intel_ingest._CONNECTORS`. No-ops with 0 until the endpoint returns data.
- `intel_project._snapshot_for`: folds the latest `proximity` signal into
  `snap["proximity"]` (score, distance_mi, top_archetype, dossier_url,
  facilities, recommended_entry), beside `snap["trigger"]`.
- `intel_projections_routes.rank_homescreen`: adds
  `prox_bonus = 25 * (score/100)` ON TOP of the engagement base. **Engagement-
  gated**: proximity amplifies and re-orders accounts that already have a
  pulse/strong signal; it never injects a cold account onto the homescreen
  (cold-but-close lives in modex discovery). The item carries a `proximity`
  block and a `dossier` link so the rep sees "hot AND in a live corridor."

## Open product question (not a blocker)

Should a cold account with elite proximity (zero engagement) ever surface on
the homescreen, or stay exclusively in modex discovery? v1 keeps the homescreen
engagement-gated. Flip the gate later if Casey wants corridor-cold accounts in
the hot feed.
