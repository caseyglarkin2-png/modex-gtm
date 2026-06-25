# modex-revops-os

Next.js GTM / RevOps application (deployed to modex-gtm.vercel.app).

---

## The GTM intelligence system (the main thing — read this first)

modex is the **face + the data layer** of a three-node GTM system. Hold the
division of labor or you will rebuild the wrong thing:

- **modex (this repo)** = the **scoring engine**, the **engagement Postgres**, the
  **pounce spine**, and the surfaces (/discovery, /demo, /for, the Outbox). It
  PRODUCES scores and exposes them.
- **clawd** (`C:\Users\casey\clawd-control-plane`, Railway) = the **brain**: the
  canonical entity store, the domain/alias resolver, the synthesis homescreen,
  and the **single canonical HubSpot company write**. clawd owns "one company,
  many sites, no dups."
- **Flow-State-** (`C:\Users\casey\Flow-State-`) = the yardflow.ai surface (/for
  ribbon, booking, intent tracking).

Full context + the seam contracts: memory `project_yardflow_intel_terminal`, and
`docs/superpowers/specs/2026-06-13-*` + `2026-06-14-modex-proximity-export-contract.md`.

### The scoring engine (modex owns)
`src/lib/discovery/scoring.ts` — the discovery composite = **proximity 0.55 + fit
0.30 + density 0.15** (0-100). Reference sites (27 live Primo): `reference-sites.ts`.
Full scored universe: `output/prospect-discovery/scored-prospects-2026-06-04.json`
(7,912 sites, gitignored). Use the REAL pipeline (`loadLatestScored` →
`buildCuratedRows` → `rankWorklist`) — never re-derive.

### Intel export streams (modex → clawd)
`GET /api/intel/export/<stream>/` (TRAILING SLASH; `x-queue-secret`): replies,
email_events, engagements, captures, outcomes (incremental) + **proximity**
(standing snapshot, carries `composite_score`). Code: `src/lib/intel/export/*`.
Proximity is precomputed (`scripts/intel/gen-proximity-export.ts` → committed
`proximity-data.json`) because Vercel doesn't bundle runtime `fs` reads of `output/**`.

### Pounce spine (modex owns; clawd + the rig are producers)
`POST /api/pounce/ingest/` (`x-pounce-token`) owns dedup, the #yardflow-intent
format, and the **single HubSpot trigger-heat write** (`updateCompanyTrigger` in
`src/lib/hubspot/companies.ts`). Do NOT build a parallel news-scan / Slack-post /
HubSpot-stamp anywhere else.

### HubSpot company record = the canonical shared surface
Company properties (created here, populated): the 14 `yardflow_*` discovery-score
props (`scripts/intel/ensure-score-properties.mjs`), the `trigger_*` heat props,
`intent_score`/`last_intent_*`, `yardflow_tam`/`tam_*`, `yardflow_icp_score`.
**modex created the props + did a one-time stamp of 688 canonical companies, then
STOPPED hand-writing companies** — entity resolution + the going-forward company
write is clawd's (it produced site-named dups when done by script here).

### The account-research package (the hand-off to clawd)
`output/intel/account-research-package/` — `deduped-accounts.csv` (5,921 deduped
accounts + domain/hubspot-id cross-ref), `account-research.json` (56 audited
accounts × sites × metrics × classification × contacts), `HUBSPOT-MAPPING-SPEC.md`
(target Company/Facility/Contact records + field map), `DATA-PACKAGE-MANIFEST.md`
(every source path). clawd maps this onto HubSpot.

### Key scripts (`scripts/intel/`)
`gen-proximity-export.ts` (the proximity stream snapshot), `ensure-score-properties.mjs`
(create the 14 props), `fetch-hubspot-companies.mjs` (cache the 11,711-company
index → `output/intel/hubspot-companies.json`), `canonicalize-stamp.ts` (match
sites → canonical HubSpot companies, domain-bearing only), `gen-account-research-package.ts`,
`gen-deduped-accounts.ts`, `export-ranked-list.ts` (ranked CSV/xlsx).

### Daily digest
`src/app/api/cron/daily-digest/route.ts` (8am ET) carries pipeline + replies +
new-SQLs + a **trigger-heat** "what your accounts announced" section.

### Branch hygiene (bit us repeatedly)
The local checkout drifts onto `feat/qualification-engine`, which LACKS the intel
code that's on `origin/main` + prod. Build off `origin/main` in an isolated
worktree (PowerShell junction for node_modules; `Remove-Item -LiteralPath '\\?\<path>'`
to clean). Heavy build (`prisma generate && next build`).

---

## YardFlow prospect yard-audit run (the audit corpus)

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
