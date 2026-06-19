# 7-Eleven — Facility Verification Rejections & Flags

FOV scrub run 2026-06-18 (agent). Protocol: `scripts/yard-audit/verify-facility-prompt.md`.
Verified all 11 sites in `output/yard-audits/seven-eleven/sites/*.json` for current operation
as part of the 7-Eleven distribution network. 7-Eleven distribution is largely
PARTNER-OPERATED (E.A. Sween fresh-food CDCs/commissaries; McLane grocery DCs); operator
was tagged accordingly (`operator: "3PL"` for partner-run sites).

## Result: 0 REJECTED, 9 confirmed, 2 probable (capped, flagged below).

No site was found closed, divested, demolished, re-signed for a different company, or
mapped as a 7-Eleven retail store. No WARN notices, closure press, or for-lease/vacant
signals surfaced against any of the 11 facility addresses. Every non-rejected site carries
>=1 real Tier-1 citation in its `verification` block.

---

## Low-confidence / PROBABLE flags (shipped, capped)

- **Site 02 — 7-Eleven Distribution Co Cold Storage DC, 12330 Lakeland Road, Santa Fe Springs, CA 90670**
  PROBABLE (operator: self). Real 7-Eleven cold-storage/distribution facility; tenant of
  record is 7-Eleven itself. Only clean Tier-1 is the 2015 lease (146,326 sq ft, +35k cooler,
  +10k freezer; 7-year term, lapsed ~2022). No post-2022 Tier-1 confirming continued occupancy,
  but NO closure / WARN / for-lease negative either — the Yelp "CLOSED" tag is a misgeocoded
  7-Eleven retail-store listing at the address, not the DC. Capped pending a recent positive.
  [Tier 1: https://rebusinessonline.com/7-eleven-leases-warehouse-space-in-santa-fe-springs/ , 2015-02]

- **Site 06 — 7-Eleven CDC Commerce City CO (E.A. Sween Denver-VAS), 5700 E. 56th Avenue, Unit D, Commerce City, CO 80022**
  PROBABLE (operator: 3PL, E.A. Sween). Small unit in a multi-tenant flex park. Listed on
  E.A. Sween's own locations page (Denver-VAS), no closure/vacancy negative found, but no
  suite-level Tier-1 careers req confirms Unit D specifically is still active. Capped.
  [Tier 1: https://easween.com/careers-v1/locations/ , 2026-06]

---

## How each site was checked
For every site: (1) resolved the operating legal entity (E.A. Sween / McLane / Constance Food
Group d/b/a Norris Food Services / 7-Eleven), (2) ran a positive current-operation search for
the exact address (company locator, careers reqs, press, USDA FSIS grants, econ-dev),
(3) ran the closure/divestiture gauntlet (sold/closed/relocated/WARN/for-lease/vacant), and
(4) ran a freight-yard sanity check (CDC/commissary/grocery-DC with truck docks, not a retail
store). `checkedBankruptcyEra: false` across the board — 7-Eleven (Seven & i / SEI) did not go
through a U.S. operating-company bankruptcy restructuring of the GM/Chrysler kind, so the
bankruptcy-era query was not applicable.

## Operator (partner) tags applied
- **E.A. Sween (3PL, fresh-food CDC/commissary):** 01 (Constance Food Group d/b/a Norris Food
  Services — affiliated commissary operator), 03 Austin, 04 Salt Lake City, 05 North Las Vegas,
  06 Commerce City (Denver-VAS), 07 Lewisville, 09 Woodridge, 11 Eden Prairie (E.A. Sween HQ +
  production).
- **McLane (3PL, grocery DC):** 12 Fredericksburg VA (McLane Mid-Atlantic), 13 Fort Worth TX
  (McLane North Texas). McLane is 7-Eleven's primary US grocery/foodservice wholesaler (since
  1975); these DCs serve other customers too but are part of the 7-Eleven distribution network.
- **Self (7-Eleven Distribution Co):** 02 Santa Fe Springs (tenant of record is 7-Eleven).
