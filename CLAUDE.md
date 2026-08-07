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

**Updated 2026-07-30:** run COMPLETE. 44 accounts (43 original + Tyson Foods added
2026-07-30) · 867+ facilities · all accounts have `sites/`, `dossiers/`,
per-account CSVs, and Phase 4 packaging (Master workbook, GeoJSON, geofence
links, sales summaries). See `output/yard-audits/RUN-STATUS.md` for full
summary and per-account rollups.

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

---

## 🎯 THE PROSPECT-FACING STANDARD — /demo, /for, microsites (2026-07-09)

Everything this app serves under **yardflow.ai** (the `/demo` subtree, `/for`
packs, microsites) holds the same bar as the native site. The canon lives in
`Flow-State-/flow-state-site/CLAUDE.md` + `docs/DESIGN-SYSTEM.md`; the parts
enforced HERE:

- **Voice:** no em dashes, no "throughput" (say production capacity), yards
  plural, measured-vs-modeled labeled. `npm run validate:packs` is the gate —
  it runs VOICE CI over all 57 demo packs and must pass before any pack ships.
  The AI copy context (`src/lib/ai/yardflow-context.ts`) carries the canon
  positioning; generated copy inherits whatever it says, so keep it current.
- **Number canon:** 48→24 measured · 24 sites live · ~5% measured · $1M+/site
  MODELED · 260 sites committed (100% of Primo, owner-confirmed 2026-07-09,
  Primo-specific). Never hand-type a variant.
- **Chrome:** `src/components/demo/demo-chrome.tsx` mirrors the canonical top
  bar (Product, Solutions, Demo, ROI, Research→/resources) and the canonical
  CTA "Book a Yard Network Audit". If Flow-State- changes
  `config/navigation.ts`, mirror it here.
- **SEO:** microsites are noindexed by design (sales weapons, not search
  bait); canonical/OG URLs are absolute yardflow.ai WITH trailing slash
  (`buildMicrositeAbsoluteUrl` enforces it). The title template is
  "%s | YardFlow by FreightRoll" — no em dash.
- **Deploy:** push main → Vercel; verify the LIVE yardflow.ai/demo/* pages
  after (the proxy adds failure modes the preview doesn't show).
