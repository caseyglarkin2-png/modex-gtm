# SC Johnson — FOV verification rejections / low-confidence flags

Run date: 2026-06-18. Protocol: `scripts/yard-audit/verify-facility-prompt.md`.
SC Johnson is family-owned and never went through a public bankruptcy, so the
bankruptcy-era check is N/A on every site (`checkedBankruptcyEra: false`).

10 sites verified. 4 confirmed, 2 probable (flagged), 4 rejected.

## Rejected (do NOT image / geofence / classify; pull from the audit corpus)

- **Sturtevant Regional Distribution Center** (Sturtevant WI, 2600 Enterprise Dr)
  — REJECTED: building is Prologis-owned "Prologis Sturtevant 1" (432k SF, not the
  audit's 552k SF SCJ-owned LEED-Gold spec), last run by 3PL DHL Supply Chain, which
  filed a WI WARN (32 layoffs, first separation Feb 28 2025) and closed it; the empty
  building is now being repurposed by Amazon (May 2026). No current source places SCJ
  here. [Tier 2: https://dwd.wisconsin.gov/dislocatedworker/warn/2024/2024083001.pdf, 2024-08-30;
  https://www.prologis.com/industrial-properties/building/chi04801-prologis-sturtevant-1, 2026-06;
  https://hoodline.com/2026/05/amazon-moves-in-on-empty-sturtevant-warehouse-with-pill-processing-push/, 2026-05]

- **Fairburn Regional Distribution Center** (Fairburn GA, 1555 Oakley Industrial Blvd)
  — REJECTED: the Exel/DHL-operated SCJ aerosol RDC at this address was shut by a DHL
  Supply Chain WARN (211 employees, effective Aug 31 2024) and the building has since
  been re-leased to a different tenant. All positive SCJ signals predate the closure.
  [Tier 2: https://www.warntracker.com/company/dhl, 2024-06-19;
  https://www.costar.com/article/992072433, 2024]

- **Woodland Regional Distribution Center** (Woodland CA, 2030 Hanson Way)
  — REJECTED: the only SCJ-specific positive is a ~2017 EPA RMP (well outside the
  24-month window, deep link dead). Current evidence is negative — the entire ~399k SF
  building is marketed for lease (whole-building vacancy) and 3PL Updike Distribution
  Logistics markets 2030 Hanson Way as its own "Woodland Warehouse" with no SCJ tie.
  [Tier 2: https://www.loopnet.com/Listing/2030-Hanson-Way-Woodland-CA/30723567/, 2026-06;
  https://updikedl.com/locations/, 2026-06]

- **Ontario Distribution Center** (Ontario CA, 1545 E Locust St Bldg 7)
  — REJECTED: the address is now operated by 3PL Smart Warehousing as "Warehouse 26"
  (its own directory lists the exact 268,830 SF with named SW management) serving its
  own clients; the only SCJ link is a ~20-yr-stale EPA RMP whose operator of record was
  "Excel Logistics" (folded into DHL c.2006). No current SCJ presence. This confirms the
  prior audit's tenancy doubt (Street View 2025 showed a Smart Warehousing sign).
  [Tier 1: https://www.smartwarehousing.com/warehouses-contacts, 2026-06;
  Tier 3: https://lonestarcandlesupply.com/local-pick-up-instructions/, 2026-06]

## Probable (low confidence — ship caveated and capped, not as hard-confirmed)

- **Fort Worth Regional Distribution Center** (Haslet/Fort Worth TX, 850 Transport Dr)
  — PROBABLE (operator 3PL Exel/DHL): the City of Haslet business directory lists
  "S C Johnson (Exel)" at 850 Transport Drive and no closure/WARN signal was found, but
  the SCJ-client tie rests on an undated municipal directory (a prior tenant, Shippers
  Warehouse, once shared the address). Moderate confidence. [Tier 1:
  https://www.haslet.org/BusinessDirectoryii.aspx, 2026-06]

- **Carlisle Regional Distribution Center** (Carlisle PA, 5 True Temper Dr)
  — PROBABLE (operator 3PL Exel/DHL): the building is an unambiguously active DHL/Exel
  cross-dock (DHL hiring Oct-2025 to Jun-2026, no WARN/closure), and an architecture
  project page documents SCJ's 500k SF NE cross-dock here, but the SCJ-as-current-client
  tie rests on that page plus a legacy FCC "EXEL SC JOHNSON" license rather than a fresh
  dated source. Moderate confidence. [Tier 1:
  https://www.margulieshoelzli.com/projects/sc-johnson/, 2026-06; Tier 3:
  https://wireless2.fcc.gov/UlsApp/UlsSearch/license.jsp?licKey=2929379, 2026-06]

## Confirmed (current + SCJ-operated; proceed)

- Waxdale Plant — Mt. Pleasant WI (manufacturing, self/owned)
- Bay City Plant (Ziploc) — Bay City MI (manufacturing, self/owned) — searched the
  rumored Ziploc/Home-Storage divestiture hard; no sale found, SCJ still operates it
- South Side Soapbox (method/Ecover) — Pullman, Chicago IL (manufacturing, self/owned)
  — 2025 office relocation to WI only; the plant stays open
- SC Johnson Professional Plant — Stanley NC (manufacturing, self/owned; ex-Deb USA)
