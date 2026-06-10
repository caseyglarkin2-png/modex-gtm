# Deep-Audit Dossier — Tractor Supply Distribution Center, Hagerstown MD

- **Facility:** Tractor Supply Distribution Center Hagerstown MD
- **Type:** Distribution Center
- **Address:** 11935 Hopewell Rd, Hagerstown, MD 21740
- **Resolved center:** 39.639765, -77.767044
- **Maps (satellite):** https://www.google.com/maps/@39.639765,-77.767044,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite probe.ts + Street View + web)
- **Confidence:** high

## Step 0 — Facility confirmation
The supplied coordinates landed exactly on the target. Satellite at z16-z17 shows a
single large rectangular distribution building (flat gray roof, ~280 m × ~120 m)
ringed by trailer parking on all four sides, bounded by I-81 on the SE and Hopewell
Rd looping along the W/SW. Web search corroborates the Tractor Supply Hagerstown DC
at 11935 Hopewell Rd (TruckMap, Yelp, Manta), nav coordinates 39.639835, -77.767017,
which agree to within a building length. Building positively identified — no relocation
needed.

## Key views
- **Wide (z16/z17):** Whole property — rotated rectangle, long axis NW→SE parallel to
  I-81; trailer rows on every face; perimeter loop road; entrance drive off Hopewell Rd
  on the SW; employee parking at the N/NE corner.
- **Both long dock faces (z19):** Trailers backed in densely along the NW/SW face AND the
  SE face (the one fronting I-81). Two distinct dock banks on opposite faces.
- **SW entrance (z18/z19) + Street View (pano e_YUFCIQxiVUzC6xiPUoGA, 2024-10):** Wide
  open paved entrance with a monument sign and flagpole; a separate red/blue-roofed
  Firestone tire / retail building sits beside it. No barrier arm, no gate, no guard
  booth on the truck lane.
- **SW yard (z20/z21):** Outdoor product storage — long rows of stacked totes / tanks /
  farm goods on the apron, plus drop-parked trailers.
- **W drop yard (z20, c-w):** Dozens of trailers parked nose-to-tail against the
  perimeter fence — a dedicated drop yard.
- **N edge (z20, c-n):** Perimeter fence line with grass berm buffer outside the paved
  yard.

## Gate / guard-shack / dock determinations
- **truckGate = false.** The truck entrance is an uncontrolled, very wide paved mouth off
  Hopewell Rd. Street View (heading 120° from the entrance pano) and z18-z19 satellite
  show no barrier arm, sliding/swing gate, or checkpoint pinch-point at the property line.
- **guardShack = false.** No staffed 1-3-stall booth on the truck lane. The structure
  beside the entrance is a separate Firestone/retail outlet (signage legible in Street
  View), not a guard shack. **remoteGs = false** because there is no controlled gate to
  begin with.
- **dockDoors = "50+".** Trailers are backed in along the full length of both long building
  faces; estimated ~120 doors total (flagged approximate).
- **shipRcvSeparate = true.** Two physically separate dock banks on opposite building faces.
- **postGateStaging = true / drivewayLong = true.** Large internal paved apron holds a 3+
  truck queue before the docks.
- **fastLaneOpportunity = true.** The entrance apron is very wide with unused paved width
  to add an express/bypass lane.

## Yard zones and counts
- **perimeter:** 7-vertex oriented ring tracing the inside-fence property; ≈ 44.7 acres.
- **truckGate:** rotated quad over the open entrance drive off Hopewell Rd.
- **dropYards (2):** SW/W trailer drop block and a second NW drop block.
- **dockAprons (2):** thin quads hugging the NW/SW dock wall and the SE (I-81-side) dock wall.
- **staging:** post-gate paved holding area just inside the entrance.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~220, capacity ~260, truckGateCount 1,
  buildingCount 2 (DC + Firestone/retail), siteAreaAcres 44.7, railServed false (no spur).

## Street View
- **truckGate** — pano `e_YUFCIQxiVUzC6xiPUoGA` (2024-10), heading 120°: the driver's-eye
  arrival frame showing the open entrance, sign, flagpole and DC behind. Highest-value image.
- **perimeter** — pano `kojRZMu68Y0ShRZuW6DNrA` (2024-09), heading 311°: SE Hopewell Rd
  frame toward the property (partly screened by the embankment/treeline).

## Web findings
TruckMap, Yelp, Manta and Birdeye list the Hagerstown DC at 11935 Hopewell Rd, 21740,
phone (240) 527-6000, with some sources noting 24-hour operation — consistent with a
high-throughput regional DC feeding Tractor Supply's rural-lifestyle retail stores.

## Setting & connectivity
- **urbanRural = Rural** — edge-of-town industrial off I-81, surrounded by open fields/farmland.
- **connectivityIssue = false** (medium confidence) — major-highway corridor with adjacent
  development; cellular coverage likely adequate.

## Final confidence
**High.** Building unambiguous, imagery clear at all zooms, Street View confirms the open
entrance. Approximate fields (door count, lane counts, trailer capacity, connectivity)
are flagged in `uncertainFields`.

### 3-line summary
- Gate: NO controlled truck gate — wide open uncontrolled entrance off Hopewell Rd.
- Guard shack: NONE on the truck lane (adjacent red-roof building is a separate Firestone/retail outlet).
- Confidence: high.
