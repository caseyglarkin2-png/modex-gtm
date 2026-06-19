# NFI — Verification Rejections & Low-Confidence Flags

FOV scrub run 2026-06-18. Account: **NFI Industries** (contract-logistics 3PL,
Camden/Cherry Hill NJ HQ). Operator tag for all sites: **3PL**, almost always
**leased**. 3PL contracts churn hard, so every site ran the closure /
contract-loss / re-lease / wrong-address gauntlet.

Result of 16 sites: **13 confirmed, 1 probable (downgraded), 2 rejected.**

---

## REJECTED (2)

- **NFI Distribution Center Florence NJ** (Florence, 1 Crossings Blvd / 2020 US-130 N, 08518)
  — REJECTED: address is **NFI Park at Florence Crossings**, a 1.7M sf park that
  **NFI Real Estate DEVELOPED and owns** — NFI is the landlord, not the operating
  3PL. The building at 2020 US-130 N is **Subaru of America's own parts
  distribution + training center** (526,050 sf, operational since June 2013);
  other park tenants are Express Scripts, QPSI, and Burlington. The audit target
  ("NFI Distribution Center") conflates NFI-the-developer with NFI-the-operator.
  Address resolves to a different operating company.
  [Tier 1: https://www.nfiindustries.com/about-nfi/news/subaru-america-selects-nfi-parts-distribution/ , 2013-06]
  [Tier 3: https://www.commercialcafe.com/commercial-property/us/nj/burlington/nfi-park-at-florence-crossings-2020-us-route-130-north/ , 2025]

- **NFI Fulfillment Center Fairburn GA** (Fairburn, 2000 Logistics Center Dr, 30213)
  — REJECTED: **NFI exited this building.** NFI's subsidiary National Distribution
  Centers filed a **WARN mass-layoff notice** to GA DOL on 2025-03-11 for the
  Fairburn facility, and the **entire 495,625 sf building is now actively for
  lease** (Cushman & Wakefield + LoopNet, marketed as "Fairburn Logistics Center,"
  no tenant named). Textbook 3PL contract churn — building re-marketed after NFI left.
  [Tier 2: https://straussborrelli.com/2025/03/24/national-distribution-centers-warn-act-investigation/ , 2025-03]
  [Tier 2: https://www.cushmanwakefield.com/en/united-states/properties/for-lease/warehousedistribution/ga/fairburn/2000-logistics-center-drive/s118006125s121760390-l , 2026-06]

---

## PROBABLE / LOW CONFIDENCE — re-scope before audit (1)

- **NFI Distribution Center Perris CA (Indian Ave)** (Perris, 3700 Indian Ave, 92571)
  — PROBABLE (downgraded): NFI **still operates part** of this building (active NFI
  Perris warehouse reqs, May 2026), BUT the building is now **multi-tenant** —
  **303,435 sf of the 1,309,754 sf** building is actively for-lease via Colliers
  after **Hanesbrands' 2024 supply-chain restructuring gave back space** (LoopNet
  still titles it "Hanesbrands Distribution Center"). The original record's model
  of a dedicated ~1.3M sf NFI DC is wrong; **dock/yard/trailer counts are almost
  certainly overstated** and should be re-scoped to NFI's actual partial footprint.
  Hanesbrands is exiting West Coast distribution, so further NFI contraction here
  is a live risk. Ships caveated and capped.
  [Tier 1: https://www.ziprecruiter.com/co/Nfi/Jobs/-in-Perris,CA , 2026-05]
  [Tier 2: https://www.loopnet.com/Listing/3700-Indian-Ave-Perris-CA/33272468/ , 2026]

---

## Lower-confidence notes on otherwise-confirmed sites (do not block, but flag)

- **NFI Distribution Center Lancaster TX** (1901 Danieldale Rd) — CONFIRMED via live
  NFI careers reqs (May 2026) + no for-lease signal, but the building is the
  **NFI/Rent-A-Center DC** and **Rent-A-Center (the client) has had financial
  trouble** — tenancy is client-dependent. Re-verify before any hard claim.
- **NFI Port Logistics Port Wentworth GA** (120 Crossgate Rd) — CONFIRMED, but the
  audited **satellite imagery is from 2019-05 (stale)**. Building is still NFI's
  (self-attested + 2026 hiring); **re-image** if updating the audit.
- **NFI Cross-Dock Bethlehem PA** (3051 Commerce Center Blvd) — CONFIRMED but on
  **Tier-3 evidence** (Waze "NFI - Cal Cartage" + PropertyShark) rather than an
  NFI self-published sheet; a CRE listing exists for Majestic Bldg 1B. Solid but
  not Tier-1.
- **NFI Distribution Center Savannah GA** (#12) — the source address was vague
  ("Old Augusta Commerce Center, Logistics Pkwy, Rincon"); resolved to **1200
  Logistics Pkwy, Rincon**, leased to NFI subsidiary National Distribution Centers
  LLC (July-2025 sale). Confirmed; note the corrected street address.
- **NFI Distribution Center Ontario CA** (#8) — source address "1450 E Mission Blvd"
  was a **misgeocode to Pomona**; the real NFI-operated building is **1990/1991 S
  Cucamonga Ave, Ontario** (a Target DC). Confirmed at corrected address.
- **NFI Distribution Center Lancaster TX** (#13) and **Import Warehouse Pooler GA**
  (#11) — correct NFI building is **Building I / 1030 S H Morgan Pkwy** (Building II
  / 1240 is a different tenant). Confirmed; mind the building number.
