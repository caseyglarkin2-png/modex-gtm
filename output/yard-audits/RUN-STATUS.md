# Yard-Audit Run — Status & Resume Point

**Updated:** 2026-05-18 (evening) — **run COMPLETE.**
Project = top-prospect truck-yard audits for YardFlow by FreightRoll.

## Snapshot — COMPLETE
- **43 account folders · 870 facilities** — every account has `sites/`,
  `dossiers/`, and a per-account `*-location-breakdown.csv`.
- Mondelez expanded 10 → **24 sites** (full U.S. footprint across all brands —
  Nabisco bakeries, Clif Bar, Tate's, flour mill, DCs, HQ/R&D).
- Phase 4 packaging done (see below).

## Phase 4 outputs (`output/yard-audits/`)
- `YardFlow-Master-Audit.xlsx` — 43 account tabs + Index; 870 facilities,
  43,149 dock doors, 119,350 trailer-parking capacity, 214 rail-served.
- `YardFlow-Master-Index.csv` — per-account rollup.
- `INDEX.md` — master index of all 43 accounts.
- Per account: `<slug>.geojson`, `<slug>-geofence-links.md`,
  `<slug>-sales-summary.md`.
- `YardFlow-All-Geofences.geojson` — combined, 3,890 geofence features.

## Google Drive (root `1arpvfAFP2Gyj1PmVtPvPgrw7Z_XZ115P`)
- Master Index sheet: https://docs.google.com/spreadsheets/d/133MUua2PCnsAZk03tKyCOPwr3461rJsuCb0K4U1O-FE/edit
- Mondelez per-account sheet (24 sites) — uploaded to the project folder.
- The 43-tab `YardFlow-Master-Audit.xlsx` is local (317 KB binary, too large to
  stream through the Drive tool reliably) — drop it into Drive to open natively
  in Google Sheets, or upload per-account sheets on request.

## Pipeline scripts (`scripts/yard-audit/`)
`probe.ts` (fixed — resolves `.env.local` from repo root), `generate-csv.ts`,
`build-master-workbook.ts`, `build-master-index.ts`, `build-geojson.ts`,
`build-geofence-links.ts`, `build-sales-summary.ts`, `deep-audit-prompt.md`,
`classify-prompt.md`.

## Data-quality flags — sites needing a human address / review

**Unresolved (low confidence, no public address — re-audit when an address is supplied):**
- unfi idx 23 Lebec CA, idx 24 Twin Falls ID.
- universal-logistics idx 13 Vance AL, 15 Spring Hill TN, 16 San Antonio TX
  (Universal value-added ops embedded inside customer/OEM plants — no
  independent street identity), 21 Harvey IL, 22 Gary IN.
- salson-logistics idx 11 Fishkill NY, 13 Oakland CA, 15 Inland Empire CA.
- mondelez idx 19 Allentown PA, 21 Garland TX, 22 Houston TX, 23 Atlanta GA,
  24 Los Angeles CA (Nabisco merchandiser sales depots — not publicly addressed).

**Possible duplicates — reconcile:**
- mondelez idx 19 (Allentown) likely == idx 14 (Tatamy DC).
- mondelez idx 23 (Atlanta) may overlap idx 9 (Norcross DC).
- salson-logistics idx 15 (Inland Empire) may == idx 4 (Compton).
- cj-logistics-america idx 21 (Carlisle PA) ≈ idx 3 (Newville).
- crowley idx 1/3/4 — three roster addresses for one Talleyrand terminal.

**Roster coordinate/address corrections applied in the site JSONs (roster.json not updated):**
- pactiv-evergreen idx 27 Kinston NC, idx 30 Plattsburgh NY.
- performance-food-group idx 19 Morristown TN; sc-johnson idx 4.
- unfi idx 4 Allentown→Schnecksville, idx 10 York, idx 16 Racine→Sturtevant.
- toyota idx 1/2/3 (5–14 km geocode errors corrected from imagery).

**Other notes:**
- toyota idx 7 Liberty NC battery plant — construction-era imagery, low confidence.
- the-home-depot idx 1 Dallas FDC (low confidence), idx 30 Baltimore BDC
  (Tradepoint Atlantic campus — exact HD building not isolable).
- mondelez idx 13 Toledo flour mill — sold to Mennel Milling Nov 2025.
- universal-logistics idx 8 Maryville TN — operator may not be a ULH subsidiary.
- sc-johnson idx 10 Ontario CA — now Smart Warehousing 3PL-branded; SCJ tenancy doubtful.
- Carried from earlier: campbells idx 12 divested to Shearer's (2014);
  constellation-brands idx 7 sold to Gallo (2021); ab-inbev idx 10/11/12
  breweries closing in AB's 2025-26 realignment (audited pre-closure).

## Related — Mondelez microsite reframe
The `mondelez-international` ABM microsite + assets were reframed from the
(unverified) "Master Plan 2030" to Mondelez's real **Vision 2030** growth
strategy: `src/lib/microsites/accounts/mondelez-international.ts`, the
coverage-map SVG, the Parrotta dossier, and the batch-distribution plan doc.
**Deploy pending review.** The audio `.m4a` and follow-up `.mp4` still narrate
the old term — they need a re-render.
