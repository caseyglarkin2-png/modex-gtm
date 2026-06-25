# Account Research Data Package — Manifest
Everything modex has on account-based research, where it lives, and how clawd
gathers it. Pair with HUBSPOT-MAPPING-SPEC.md (the target schema + field map).

All paths are in the **modex-gtm repo** (`C:\Users\casey\modex-gtm`), readable
directly by the clawd session on Casey's box. Items marked LIVE are also HTTP
endpoints clawd-prod can pull.

## THE PACKAGE (start here)
- `output/intel/account-research-package/deduped-accounts.csv` — **the full
  deduped ACCOUNT list: 5,921 unique companies** (collapsed by name from the
  7,848 curated sites), each with the cross-reference keys we already have:
  `domain`, `hubspot_company_id`, `in_hubspot`, composite, tier, site count,
  city/state, nearest Primo. 913 carry a domain, 817 already resolve to a HubSpot
  company. **clawd does the authoritative canonical resolution on the rest** (the
  blank-domain rows). Regenerate: `npx tsx scripts/intel/gen-deduped-accounts.ts`.
- `output/intel/account-research-package/account-research.json` — **56 audited
  accounts, 1,055 sites, 83 committee contacts**, joined: per account = identity
  (slug/name/domain) + scores + yard aggregate + every site (metrics + 22-field
  classification + dossier path + maps url) + contacts. Geofence rings excluded
  for size; each site references its `raw_site_json` for the full geometry.
  Regenerate: `npx tsx scripts/intel/gen-account-research-package.ts`.

## SCORES (the discovery engine output)
- `output/prospect-discovery/scored-prospects-2026-06-04.json` — the FULL scored
  universe: 7,912 sites, every sub-score (verticalMatch, enterpriseScale,
  networkComplexity, primoProximity, corridorDensity), tier, nearestPrimoSite,
  existingAccountSlug. (gitignored; local only.)
- `src/lib/intel/export/proximity-data.json` — per-account composite rollup (committed).
- Scoring code: `src/lib/discovery/scoring.ts` (composite = proximity 0.55 + fit
  0.30 + density 0.15). Reference sites: `src/lib/discovery/reference-sites.ts` (27 live Primo sites).
- LIVE: `GET /api/intel/export/proximity/` (x-queue-secret) — account-keyed composite stream.

## YARD-AUDIT CORPUS (the per-site intelligence + narrative)
- `output/yard-audits/<slug>/sites/*.json` — 1,055 site audits: coords,
  geofences (perimeter/truck-gate/staging rings), yardMetrics, the 22-field
  classification, confidence, fieldNotes.
- `output/yard-audits/<slug>/dossiers/*.md` — 1,038 deep per-facility dossiers (narrative + evidence).
- `output/yard-audits/<slug>/<slug>-sales-summary.md` — 45 account sales summaries (recommended entry).
- `output/yard-audits/<slug>/roster.json` — per-account facility roster (names, addresses, geocodes).
- `output/yard-audits/YardFlow-Master-Index.csv` — 43-account scorecard (facilities, gating, dock doors, trailer cap, archetype).
- `scripts/yard-audit/archetype-key.json` — the #1-#10 archetype taxonomy (labels + flags).
- Also in Google Drive: folder "YardFlow — Prospect Yard Audits" (`1arpvfAFP2Gyj1PmVtPvPgrw7Z_XZ115P`), per-account subfolders + INTEL-MANIFEST doc.

## ABM / MICROSITE RESEARCH (the /for + /demo account content)
- `src/lib/microsites/accounts/*.ts` — 43 accounts: painPoints, recentNews,
  facilities, yardFlowAngle, network (facilityCount, dailyTrailerMoves, types),
  per-persona variants. Generated from `src/lib/data/accounts.json` +
  `personas.json` + `docs/research/*.md` by `scripts/generate-microsite-data.ts`.
- `docs/research/*.md` — standalone deep research dossiers per account.

## CONTACTS (the buying committee)
- `src/lib/data/personas.json` — 83 personas: name, title, function, seniority,
  role_in_deal, email, phone, linkedin_url, account, status. (In the package per account.)
- `Downloads/Allentown-100mi-CONTACTS-*.csv` + the campaign contact CSVs (Allentown waves).

## CANONICAL HUBSPOT INDEX (for resolution + dedup)
- `output/intel/hubspot-companies.json` — 11,711 HubSpot companies (id, name,
  domain, yardflow_tam). 10,687 with domain, 6,910 TAM=in. Regenerate:
  `node scripts/intel/fetch-hubspot-companies.mjs`. Use for domain cross-reference.

## GTM WORKBOOKS (campaign-ready cuts)
- `output/Primo-Proximity-GTM-Campaign.xlsx` — national, 41 accounts × 18 Primo sites, playbook, waves.
- `Downloads/ranked-prospects-by-company-2026-06-14.csv` — 6,013 companies ranked by composite.
- `Downloads/ranked-prospect-SITES-2026-06-14.csv` — 7,848 sites ranked.

## ACCESS
- The clawd SESSION reads all repo paths directly on Casey's box.
- clawd-PROD (Railway) pulls scores via `GET /api/intel/export/proximity/`; for
  the corpus, read from the modex repo or the Drive folder.
- The HubSpot write is clawd's (its resolver + `hubspot_autopush`/`hubspot_push_worker`).
  modex created the Company score properties and stopped hand-writing companies.
