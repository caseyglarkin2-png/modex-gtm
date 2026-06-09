# Deep-Audit Dossier — Kroger Customer Fulfillment Center, Groveland FL (idx 16)

- **Facility:** Kroger Customer Fulfillment Center Groveland FL (Ocado-automated CFC, FC-04)
- **Address:** 7925 American Way, Groveland, FL 34736
- **Resolved center:** 28.64018, -81.82035
- **Method:** deep-audit (satellite probe + Street View, April 2025 coverage)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate point (28.639673, -81.820847) landed inside the
Christopher C. Ford Commerce Park near US-27 and American Way. Satellite at
z16-z18 showed a cluster of industrial buildings; web research
(Kroger/Ocado press releases, CoStar, REBusinessOnline) confirmed the CFC is a
~338-375k sq ft, four-story automated grid building on a ~102.3-acre parcel at
US-27 and American Way. The large monolithic windowless box in the center of
the park — with a 1,400-employee-scale parking lot, a fleet of blue Kroger
delivery vans, and a continuous dock bank with trailers — matches that profile
exactly. Adjacent buildings (the dock-loaded warehouse to the NE, others to the
W/S) are separate tenants and were ruled out. Center locked at
28.64018, -81.82035.

> Status note: Kroger publicly announced (2025) it was closing this Groveland
> CFC along with two others as it wound down the Ocado network. Current imagery
> still shows the building, the van fleet, and trailers in place, so the
> physical yard audit is valid.

## Key views
- **z16/z17 overview:** CFC building center-left of the commerce park, lake to
  the east, building long axis roughly N-S, tilted ~8° clockwise from north.
- **z18 building footprint:** continuous dock bank with trailers backed in along
  the **east face**; employee parking lot on the south; turnaround/control area
  at the SE throat.
- **z19/z20 dock + yard:** dock doors with trailers along the east apron; trailer
  drop rows along the east/SE; dense rows of **small blue delivery vans** in the
  south lot (fleet parking, NOT 53' trailers — excluded from trailer counts).
- **z20 SE control structure:** a small white building with a row of ~6 canopy
  bays and a teardrop turnaround at the throat between the south parking and the
  dock yard — an internal control/turnaround point, not the road checkpoint.
- **Street View (Apr 2025, American Way frontage):** the money shot. The yard
  entrance off American Way has a **sliding/cantilever gate** across the
  driveway, **perimeter chain-link fence with green slats**, a posted sign at the
  gate, and a Kroger-branded sign at the entrance. Blue Kroger/Ocado vans and
  trailers visible inside the fence.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View pano `NMgF_yqXrF21JG5vIG3SJA` (heading 350°)
  clearly shows a sliding gate across the secured-yard driveway, fenced
  perimeter, and signage — a controlled truck entrance, not an open driveway.
- **guardShack = false.** No staffed booth footprint at the public-road gate.
  The only booth-scale structure (with canopy bays) sits deep inside near the
  dock-yard throat, not at the road checkpoint.
- **remoteGs = true.** Gate present, no manned booth at the road → call-box /
  kiosk / app check-in implied.
- **postGateStaging = true.** Wide paved apron / teardrop turnaround inside the
  gate before the docks gives queue room.
- **drivewayLong = true.** Long divided entry drive from American Way to the yard
  holds 3+ trucks.
- **entryExitTogether = true; entryLanes 2 / exitLanes 2.** Divided in/out
  driveway at one frontage point (lane arrows visible in Street View).
- **fastLaneOpportunity = true.** Divided multi-lane entry with large unused
  paved apron width — room for an express/bypass lane.
- **dockDoors = "25-50".** Continuous dock bank with trailers backed in along the
  east face; ~25-40 positions counted from z18/z20 imagery (count flagged
  low-confidence).
- **dropArea = "25-50" / dropYard = true.** Dedicated trailer drop rows along the
  east apron and SE yard, separate from active dock staging.
- **shipRcvSeparate = false.** Single primary dock bank (east face).
- **scale = false; multiStep = false.** No truck scale or clear second
  checkpoint stage visible.
- **urbanRural = "Rural".** Edge-of-town industrial park on the rural fringe of
  Groveland by US-27, surrounded by open land, woods, and a lake.
- **railServed = false.** No rail spur enters the property.
- **multipleFacilities = false.** Single building on its parcel.

## Yard zones & counts
- **perimeter:** 8-vertex ring tracing the fenced operational area (oriented to
  the building's ~8° CW tilt); ~58 ac. Full recorded parcel ~102.3 ac per CoStar.
- **truckGate:** quad over the gated road entrance off American Way (SV heading
  350°, pano `NMgF_yqXrF21JG5vIG3SJA`).
- **dockApron:** long thin quad hugging the east dock wall at the building angle.
- **dropYards:** two rings over the east/SE trailer-parking rows.
- **staging:** post-gate turnaround/holding apron at the SE throat.
- **streetViewMeta:** perimeter pano `AMIqIc9BmCY5k7DHpbqTCw` (heading 359°),
  truckGate pano `NMgF_yqXrF21JG5vIG3SJA` (heading 350°), both Apr 2025, both OK.

## yardMetrics
- dockDoorCount 32 (est, low-confidence), trailersVisible 38,
  trailerParkingCapacity ~60, truckGateCount 1, buildingCount 1,
  siteAreaAcres ~58, railServed false.

## Web findings
- Kroger + Ocado broke ground July 2019; ~$55M, up to 375k sq ft (one source
  338k sq ft), ~400-1,400 jobs, US-27 & American Way, four-story automated
  property with mezzanine, office, break room.
- 2025: Kroger announced closure of the Groveland CFC (and two others) as it
  shifted e-commerce fulfillment to retail locations and Instacart/DoorDash/Uber
  Eats partnerships.

## Final confidence: high
Location unambiguous; gate, fence, and dock evidence clear in both satellite and
April-2025 Street View. Dock-door and trailer-capacity counts are honest
overhead estimates (flagged in uncertainFields).
