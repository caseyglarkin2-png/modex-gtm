# Yard-Audit Run — Status & Resume Point

STATUS: ACTIVE
Last verified: 2026-08-12

Project = top-prospect truck-yard audits for YardFlow by FreightRoll.

> **Do not hand-type counts into this file.** Every number below is generated.
> `INDEX.md` and `YardFlow-Master-Index.csv` are the authority; this file is a
> narrative pointer at them. The 2026-05-19 snapshot said "43 account folders ·
> 867 facilities" and stayed on the page until 2026-08-12 while the real corpus
> was 59 and 1,178 — a hand-maintained count silently disagreeing with the
> generated one for three months. Re-read the generated files, do not edit these.

## Snapshot (regenerate to refresh — `npm run geo:build`, then the builders)
- **59 account folders · 1,178 facilities** — every account has `sites/`,
  `dossiers/`, and a per-account `*-location-breakdown.csv`.
- 1,158 facilities carry a traced perimeter; 20 do not (17 have no `geofences`
  block, 3 have an explicitly null perimeter). None are silently dropped.
- Mondelez expanded 10 → 24, then 2 confirmed duplicates dropped → **22 sites**.
- Tyson Foods added 2026-07-30 (17 facilities) — see
  `tyson-foods/verification-evidence.md` for its evidence state.
- Evidence gating and what actually reaches a buyer: `EVIDENCE-BOUNDARY.md`.
- What each directory in this tree is: `README.md`.

## Phase 4 outputs (`output/yard-audits/`)
- `YardFlow-Master-Audit.xlsx` — 59 account tabs + Index; 1,178 facilities,
  68,090 dock doors, 201,769 trailer-parking capacity, 264 rail-served.
- `YardFlow-Master-Index.csv` — per-account rollup (TOTAL row is authoritative).
- `INDEX.md` — master index of all 59 accounts.
- Per account: `<slug>.geojson`, `<slug>-geofence-links.md`, `<slug>-sales-summary.md`.
- `YardFlow-All-Geofences.geojson` — combined, 4,409 geofence features.
- Every generated geometry file is validated by `npm run geo:validate` and by
  `tests/unit/yard-audit-corpus.test.ts`; the build refuses to write invalid
  geometry rather than warning about it.

## Google Drive (root `1arpvfAFP2Gyj1PmVtPvPgrw7Z_XZ115P`)
- Master Index sheet: https://docs.google.com/spreadsheets/d/133MUua2PCnsAZk03tKyCOPwr3461rJsuCb0K4U1O-FE/edit
- Mondelez per-account sheet — refreshed to the 22-site version.
- Full 43-tab `YardFlow-Master-Audit.xlsx` is local — drop into Drive to open natively in Sheets.

## Round 2 — address re-research + roster cleanup (2026-05-19)

**Dropped — confirmed not separate facilities (idx gaps left intentionally for traceability; not renumbered):**
- mondelez idx 19 Allentown — duplicate of idx 14 (Tatamy DC).
- mondelez idx 23 Atlanta — duplicate of idx 9 (Norcross DC).
- salson-logistics idx 15 "Inland Empire" — a market-area label, no physical site.

**Re-audited from newly-found addresses (stub → full audit, high confidence):**
- mondelez idx 21 → Fort Worth TX, 16200 Three Wide Dr (roster said "Garland").
- mondelez idx 22 → Houston TX, 6903 W Sam Houston Pkwy N.
- mondelez idx 24 → Ontario CA, 5815 Clark St (roster said "Los Angeles").
- universal-logistics idx 17 → Madison AL, 7049 Greenbrier Pkwy NW (Polaris plant).
- universal-logistics idx 21 → Harvey IL, 250 E 167th St (prior audit geocoded the wrong building).
- salson-logistics idx 11 → Conklin NY, 1314 Conklin Rd (roster said "Fishkill").

## Data-quality flags

**Genuinely unresolved — no public address/coordinates; need internal records:**
- unfi idx 23 Lebec CA; idx 24 Twin Falls ID (may not be a UNFI DC at all).
- universal-logistics idx 13 Vance AL, 15 Spring Hill TN, 16 San Antonio TX
  (Universal value-added ops run inside the customer/OEM plants — no separate
  building), 22 Gary IN.
- salson-logistics idx 13 Oakland CA (only a Stockton back-office found).

**Possible duplicates — RECONCILED 2026-06-10:**
- cj-logistics-america idx 21 (Carlisle PA) — confirmed duplicate of idx 3 (Newville); dossier was UNRESOLVED 0-acre stub, no address. **Dropped** (idx gap left). Pack rebuilt: 27 sites.
- crowley idx 3 + idx 4 — both dossiers confirm "same physical Talleyrand terminal as idx 1"; idx 1 already audits the whole ~1km terminal. **Dropped idx 3 + 4, kept idx 1** (idx gaps left). Pack rebuilt: 12 sites.

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
strategy and **deployed to production** (live at yardflow.ai/for/mondelez-international;
reframe commit on `main`). The audio `.m4a` and follow-up `.mp4` still narrate
the old term — they need a re-render (owner: Casey).
