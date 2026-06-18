# Target — Facility Verification Rejections

FOV scrub run 2026-06-18. 24 of 24 sites verified.

## Rejections: NONE

All 24 audited Target facilities are **confirmed** as currently operated by Target
(operator: self). Each carries at least one Tier-1 positive: an active Target
careers requisition on a Target-owned domain (`corporate.target.com`,
`jobs.target.com`, or `target.wd5.myworkdayjobs.com`) tagged to the exact street
address and, in most cases, the exact internal facility T-code. Target has no
bankruptcy-era restructuring, so the bankruptcy gauntlet is N/A
(`checkedBankruptcyEra: false` on all). The divestiture/closure/WARN gauntlet was
run on every site (`checkedDivestiture: true`); the two real layoff signals found
(below) are partial/role-level cuts at still-operating facilities, not closures.

## Watch-flags (verdict unchanged — confirmed — but worth knowing)

- **Site 01 — Savannah Import Warehouse (T3684)**: An Aug-2025 WARN cut 62 jobs at
  the Savannah import operation. Trade press (WWD / Sourcing Journal, 2025-08-13)
  quotes a Target spokesperson that the 2M-sqft import warehouse stays open and
  keeps receiving Port of Savannah cargo; only one fulfillment service moved out.
  Not a closure. Address corrected in fieldNotes from roster's "110" to the real
  211 Little Hearst Pkwy.

- **Site 10 — Indianapolis RDC (T0559)**: An Aug-2025 WARN / Sep-2025 closure
  (201 jobs) hits the **co-located Fulfillment Operation T-9335**, NOT the audited
  Regional Replenishment Operation T-559. Target states T-559 is unaffected and
  fully operational; an active T0559 careers req remains posted at 7551 W Morris St.
  Source: supplychaindive.com/news/target-fulfillment-operations-closure-200-indianapolis-employees/757910/

- **Site 05 — Logan Township RDC (T3857)**: A May-2026 NJ "107 jobs" cut surfaced,
  but it is corporate/regional roles spread across four counties, not a closure of
  this DC (T3857 reqs remain active). Not a negative against the facility.

## Data-quality notes (re-pin / T-code flags for the audit owner)

These do not change any verdict but should be reconciled in the roster/Step-0 re-pin:

- **Site 17 — Albany, OR (T0558)**: Target careers lists ZIP 97321 vs roster 97322.
  Same facility (875 Beta Dr SW); no conflict.
- **Site 21 — Cedar Falls Food DC**: internal food-DC code is **T3895**, not the
  roster's T0590. Real address per careers ≈ 2115 Technology Pkwy (roster: 3400
  Cedar Heights Dr). Re-pin recommended (roster geocode was RANGE_INTERPOLATED).
- **Site 22 — West Jefferson Food DC**: audited building is the food DC **T3880**;
  the roster title's T3804 is the adjacent RDC. (JSON fieldNotes already flagged this.)
- **Site 23 — Lake City Food DC**: internal code **T3892**; confirmed operating at
  3049 N US-441 (roster geocode was GEOMETRIC_CENTER — re-pin to the careers
  address). NOT under construction.
- **Site 24 — Denton Food DC**: partial roster address "Airport Rd" resolves to
  **3255 Airport Rd**; facility opened 2013, currently operating (roster geocode
  was GEOMETRIC_CENTER — re-pin recommended). NOT under construction.

## Under-construction / announced sites: NONE found

The two highest-risk food DCs (Lake City FL, Denton TX), both carrying imprecise
GEOMETRIC_CENTER geocodes, were checked hardest for being announced/not-yet-open
and both proved to be current, operating facilities (Lake City confirmed via an
active Workday Ops Manager req at the exact address; Denton via 2013 opening press
plus current-operation signals).
