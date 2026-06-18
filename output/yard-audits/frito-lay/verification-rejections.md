# Frito-Lay (PepsiCo) — Facility Verification Rejections

FOV scrub run 2026-06-18. 30 sites verified against the facility-verification
protocol (`scripts/yard-audit/verify-facility-prompt.md`). Verdicts:
**26 confirmed, 2 probable (caveated), 2 rejected.**

PepsiCo did not go through a major bankruptcy restructuring, so the bankruptcy-era
gauntlet is not applicable (`checkedBankruptcyEra: false` on all sites). The
divestiture/closure gauntlet was run on every site (`checkedDivestiture: true`).

---

## Rejected (do NOT image / geofence / classify)

- **Frito-Lay - Rancho Cucamonga CA (DC)** (Rancho Cucamonga, CA; ~34.080051, -117.591112)
  — REJECTED: named in PepsiCo's Frito-Lay network consolidation. Manufacturing
  ended in 2025 and the co-located Archibald Ave distribution warehouse is closing
  June 6, 2026 per a Feb 2026 WARN notice (~247 workers); operations relocate to a
  new DC elsewhere. The exact facility is being shut down.
  [Tier 2: https://www.supplychaindive.com/news/pepsico-shutter-california-frito-lay-warehouse/813071/ , 2026-02]

- **Frito-Lay - Orlando FL** (Orlando, FL; ~28.5772, -81.4182)
  — REJECTED: the Orlando Frito-Lay plant (Silver Star Road) and its co-located
  Parks Oaks warehouse were permanently closed in the Nov 2025 PepsiCo
  consolidation (~500 layoffs, operations ended Nov 4, 2025). Demolition of the
  plant began January 2026. No operating truck yard remains.
  [Tier 2: https://www.fooddive.com/news/pepsico-closing/804929/ , 2025-11]
  [Tier 2: https://www.clickorlando.com/news/local/2026/01/28/crews-begin-demolition-of-shuttered-frito-lay-plant-in-orlando/ , 2026-01]

---

## Probable (ships caveated + capped — verify before sales use)

- **Frito-Lay - Forest City NC (DC)** (Forest City, NC; ~35.33855, -81.8864)
  — PROBABLE: Frito-Lay/PepsiCo is the named net-lease tenant of the DC at
  277 Lawing Rd, but the only evidence is a commercial real-estate offering
  (net-lease/sale listing), not a company locator, careers req, or PR. No closure
  or WARN found. Confirm Frito-Lay is the active occupier (vs a marketed/sold
  asset) before treating as live.
  [Tier 3 listing: https://www.loopnet.com/Listing/277-Lawing-Rd-Forest-City-NC/37708516/ , 2026-06]

- **Frito-Lay - Burbank WA (DC)** (Burbank, WA — Walla Walla County, NOT Burbank CA; ~46.2065, -119.015)
  — PROBABLE: a newly constructed ~107k SF Frito-Lay DC in Burbank, WA (Tri-Cities)
  offered as a sale-leaseback with Frito-Lay in place. Evidence is the real-estate
  offering only; no company locator/careers confirmation. No closure found. Verify
  the Burbank WA coords (not Burbank CA) and active occupancy before sales use.
  [Tier 3 press/listing: https://news.theregistryps.com/newly-constructed-107000-sqft-frito-lay-distribution-center-in-burbank-listed-for-sale/ , 2026-06]

---

## Confirmed sites carrying flags (re-pin / staleness notes)

These passed (confirmed) but carry a `flag` in their verification block worth a
glance before sales use:

- **Aberdeen MD** — a SEPARATE nearby Frito-Lay *storage warehouse* had a May 2025
  layoff/closure; confirm the audited coords (800 Hickory Dr) are the manufacturing
  center, not the closed warehouse.
- **Topeka KS, San Antonio TX, Arlington TX, Brookhollow/Dallas TX, Canton OH,
  Lynchburg VA, Denver CO, West Valley City UT** — current-operation evidence is
  Tier-3 only (careers postings / industry directories / EDC employer lists); no
  recent Tier-1 (company locator/PR/10-K) located. No negative signal on any.
- **Frankfort IN (2018), Charlotte NC (2015), Vancouver WA (2012),
  Williamsport PA (2013), Fayetteville TN (2017)** — confirmed via legitimate
  press/PR but the most recent dated positive is older than 24 months; no closure
  found, recent corroboration is aggregator-level.

No co-packer or PepsiCo-Beverages mis-attribution was found among the 30 sites.
The Kirkwood/Binghamton NY plant was specifically cleared: the closed PopCorners
site in the consolidation is **Liberty NY**, a different facility.
