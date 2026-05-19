# modex-revops-os

Next.js GTM / RevOps application (deployed to modex-gtm.vercel.app).

---

## 🚧 ACTIVE WORK — YardFlow prospect yard-audit run

**Read `output/yard-audits/RUN-STATUS.md` first.** It is the live source of
truth for this project — per-account progress and the exact resume procedure.

**What it is:** deep satellite + Street-View audits and yard modeling for the
truck yards of the **top-42 prospect accounts for YardFlow by FreightRoll**.
Each facility gets a geofence, `yardMetrics` (docks, trailers, gates, acreage,
rail), and a 22-field gate/dock/yard classification, plus a written dossier.

**Status as of 2026-05-18:** 33 of 43 account folders complete (sites +
dossiers + CSV), 4 partial, 6 not started. The run is being resumed in waves —
RUN-STATUS.md has the current breakdown.

### Pipeline (`scripts/yard-audit/`)
- `deep-audit-prompt.md` — per-facility audit-agent instructions + JSON schema
- `classify-prompt.md` — field rubric (definitions, visual evidence, bands)
- `probe.ts` — satellite + Street View imagery fetch
  (needs `GOOGLE_MAPS_STATIC_API_KEY` in `.env.local` — present and working)
- `generate-csv.ts <slug>` — per-account location-breakdown CSV
- `build-master-workbook.ts` — master multi-tab `YardFlow-Master-Audit.xlsx`
- Per-account output: `output/yard-audits/<slug>/{roster.json, sites/, dossiers/, *-breakdown.csv}`

### To resume the run
1. Read `output/yard-audits/RUN-STATUS.md`.
2. Dispatch deep-audit agents over the idx ranges of each unfinished account's
   `roster.json` (template: each agent reads `deep-audit-prompt.md`, audits an
   idx range, writes `sites/<NN>-<slug>.json` + `dossiers/<NN>-<slug>.md`).
3. After an account is fully audited: `npx tsx scripts/yard-audit/generate-csv.ts <slug>`.
4. Phase 4: rebuild the master workbook, per-account GeoJSON, geofence map
   links, sales summaries; upload to Drive (root `1arpvfAFP2Gyj1PmVtPvPgrw7Z_XZ115P`).

> Imagery note: `probe.ts` resolves `.env.local` from the repo root, so it runs
> from any cwd. Give it a **forward-slash absolute path** for the output file
> (e.g. `/c/Users/casey/modex-gtm/tmp/probe.png`) — the Bash tool strips the
> backslashes from a `C:\...` path passed as an argument and mangles it.
