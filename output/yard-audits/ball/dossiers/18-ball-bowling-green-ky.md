# Ball - Bowling Green KY (idx 18)

**Type:** Can End Plant (beverage can ends)
**Resolved location:** Kentucky Transpark, ~1333 Production Ave, Bowling Green, KY 42101 (Warren County)
**Coordinates (building center):** 37.039050, -86.297900
**Confidence:** medium

## Step -1 — Verification: CONFIRMED (operator self, owned)
Ball built its ~500,000 sqft aluminum end plant as the first tenant of the Kentucky Transpark 300-acre expansion ($305M, announced Jan 2021, production early 2022). Current 2026-03 Street View shows the plant operating with Ball's blue on-building branding. No divestiture/closure signal.
- Tier 1: Ball company PR, "Ball Announces New Aluminum End Manufacturing Facility in Bowling Green, Kentucky," 2021-01-07 (prnewswire 301202652).
- Tier 3 corroboration: Street View pano `ik6C6ciN5SkaeXb88oFeAA`, captured 2026-03 — active branded plant.

## Step 0 — Building lock
The naive geocode of the plant name landed on a small peaked-roof office near the Transpark entrance intersection — **not** the plant. Re-geocoding "Ball ... Bowling Green KY 42101" returned 1333 Production Ave (37.0392, -86.2981), which put the pin on a large modern manufacturing building. I then drove Street View along Production Ave (2026-03) and confirmed the long low industrial building carries a blue Ball logo panel and a row of dock doors on its south face. Locked to that building center.

## What the imagery showed
- **Full site (z17):** One large ~square manufacturing building (~260m x 240m), rotated ~28° (walls run WNW-ESE / NNE-SSW). Employee parking on the west/SW. Perimeter fire-lane on all sides. Vacant grass to the N and E (expansion room). Detention ponds NW.
- **South face:** the primary dock bank + a paved truck apron with marked trailer stalls (the south drop-yard). Street View shows a run of dock doors here.
- **NW corner:** a second, smaller loading area with ~2 trailers backed in — the basis for a possible ship/receive split.

## Gate / guard-shack / dock determinations
- **Truck gate:** the entrance off Production Ave is an **open** industrial driveway with a monument sign; **no barrier arm or booth** visible in 2026-03 Street View → **truckGate = false** (flagged uncertain).
- **Guard shack:** none → **false**. remoteGs **false** (no gate).
- **Docks:** south wall bank + NW corner bank. Band **10-25** (~18 est.); white roof obscures an exact count. shipRcvSeparate **true** (two distinct dock zones), medium confidence.
- **Drop yard:** **true** — marked trailer stalls along the south apron.

## Yard zones & counts
- Perimeter (oriented ~28°): ~65 acres fenced. dockDoorCount ~18 · trailersVisible ~3 · trailerParkingCapacity ~35 · truckGateCount 1 · buildingCount 1.
- **railServed false** — the Transpark has CSX service at its south end but no spur is visible entering the Ball parcel.

## Setting
Rural — the Transpark sits on the NE edge of Bowling Green amid farmland; other tenant buildings are separate parcels. urbanRural = Rural. connectivityIssue false (5 mi from I-65, town adjacent).

## Final confidence: medium
Identity is confirmed (branded, current imagery). Gate/guard, exact dock count and ship/receive split are the soft calls.
