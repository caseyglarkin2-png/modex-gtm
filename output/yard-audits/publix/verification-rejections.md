# Publix — Facility Verification Rejections

FOV scrub run 2026-06-18 (agent). 11 sites verified against the verify-facility
protocol (Tier-1 self-attested + divestiture/closure gauntlet + freight sanity).

## Rejections

**None.** Zero sites rejected. All 11 mapped facilities are current,
Publix-self-operated distribution centers or manufacturing/distribution
complexes.

## How verified (anti-trap checks)

- **Canonical network**: Publix's own jobs site names all 10 distribution
  centers (Boynton Beach, Dacula GA, Deerfield Beach, Greensboro NC, Jacksonville,
  Lakeland, McCalla AL, Miami, Orlando, Sarasota) plus its manufacturing
  facilities (Lakeland bakery/dairy/deli/fresh, Orlando produce snacks, Dacula
  dairy, Deerfield Beach dairy, Atlanta bakery). Every roster site maps to a
  named Publix-operated location. Publix self-distributes (no 3PL operator).
  Source: https://jobs.publix.com/2025/05/06/behind-the-scenes-publix-distribution-and-logistics/ (2025-05)
- **Under-construction trap (McLeansville/Greensboro NC, site 11)**: this was the
  ~$400M build (groundbreaking Feb 2020). CLEARED — it completed ~Q4 2022 and is
  OPERATING now (active Publix distribution job reqs at McLeansville NC). Not
  mapped as a phantom.
- **Jacksonville freezer trap (site 07)**: a SEPARATE Publix freezer warehouse at
  the W Beaver St site is under construction and opens late 2027. The roster site
  is the EXISTING operating Jacksonville DC (9786 W Beaver St), which runs today
  and is mid an active ~$145M on-site expansion. The under-construction freezer
  is NOT what is mapped — correct site chosen.
  Source: https://www.jaxdailyrecord.com/news/2025/oct/06/more-permits-boost-publix-warehouse-to-almost-145-million/
- **No retail-store-as-DC**: all 11 are warehouse/DC/plant types, not Publix
  retail stores.
- **Closure / divestiture gauntlet**: ran "closed / sold / divested / WARN /
  ceased production" queries across the FL DCs, McCalla AL, and Dacula GA. No
  credible negative found for any operating DC. Publix has not divested its
  distribution network (it self-distributes as core strategy); no bankruptcy-era
  history (privately/employee-owned, never restructured).

## Low-confidence / flagged (shipped caveated, NOT rejected)

- **03 — Publix Produce DC Lakeland FL (Fresh/Deli)** — verdict: **probable**
  (COORD-PRECISION flag). The Publix Produce/Fresh/Deli operation is real and
  self-operated in Lakeland (Fresh Kitchen, Deli Kitchen, fresh-cut produce), but
  the mapped coordinates (28.0421, -82.0078, NE Lakeland) do not clearly match
  the known Fresh/Deli/Produce/dairy complex address at 3045 New Tampa Hwy
  (W Lakeland, 33815). Facility existence + operator confirmed; the exact pin
  should be re-checked before audit so the geofence lands on the right building.

## Other notes

- **02 — Frozen DC Lakeland (28.007, -82.042)**: confirmed. Coords sit in the SW
  Lakeland / Drane Field–County Line DC corridor where Publix's frozen and HV/LV
  warehousing operates; Publix Frozen Foods Warehouse is a real self-operated
  Lakeland facility.
- **09 — Dacula GA**: corporate count sometimes labels this the
  "Lawrenceville GA" facility; it is the same Atlanta-area campus at 445 Hurricane
  Trl, Dacula (DC + dairy plant). Confirmed current.
