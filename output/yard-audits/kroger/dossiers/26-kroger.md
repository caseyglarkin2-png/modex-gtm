# Deep-Audit Dossier — idx 26 — Westover Dairy (Kroger)

**Facility:** Westover Dairy — Dairy Plant — 2801 Fort Avenue, Lynchburg, VA 24501
**Resolved center:** 37.39740, -79.16560
**Confidence:** high

## Step 0 — Location confirmation
The supplied point (37.398017, -79.165391) landed just N of the true plant
center. Satellite at z17/z18 showed a large industrial complex — a process
building with rooftop tanks/silos plus a trailer-packed yard — directly SW of
the point. Web search confirmed Westover Dairy is a **Kroger-owned dairy
manufacturing plant** (one of Kroger's 15 dairies; milk, water, cottage cheese,
yogurt, sour cream, juices) at 2801 Fort Ave. Locked center at
37.39740, -79.16560. Correct building positively identified.

## Site layout (satellite z18-z20)
- Single large dairy plant building, long axis running **NW-SE, rotated off
  north** (~30-35°). Stainless silos / process tanks along the N/top edge.
- Paved truck yard wraps the **W, SW, and S** of the building, filled with rows
  of parked trailers — a substantial dedicated **drop yard**.
- **Dock apron** along the south building face: trailers backed in at an angle
  to the wall.
- Employee parking lot on the **E** side (Fort Ave frontage), full of cars.
- Vehicle access driveways at the **NE/E** connect the yard to the road; Fort
  Avenue runs along the SE/E. Cemetery across Fort Ave to the SE.

## Gate / guard / fence (Street View, 2021-01 + 2025-08)
- **Perimeter is fully fenced** — chain-link (some with privacy slats) confirmed
  on every side: SE/E along Fort Ave (SV2/SV3/SV6 show continuous fence with
  trailers and employee parking behind it), and the N side (SV5, 2025) shows
  the brick plant + silos behind slatted chain-link.
- **truckGate = true**: controlled, fully fenced/gated property; access is
  through gated openings in the fence at the NE/E driveways.
- **guardShack = false / remoteGs = true**: no staffed booth structure
  (1-3-vehicle footprint with multi-side windows) is visible at any truck
  entrance in any view. A gated fence with no booth implies unstaffed /
  kiosk / call-box check-in. (Listed in uncertainFields — booth could sit
  behind tree cover, but none seen.)
- The SE corner along Fort Ave near "Clean Creek Cleaners" (a separate
  business) is the dairy's fenced trailer-yard back line, not a public gate.

## Docks & yard counts (z19-z20)
- **dockDoorCount ~14** (band 10-25): trailers backed against the south face;
  partial shadow/tree occlusion — estimate.
- **trailersVisible ~38** parked across the W/SW/S yard.
- **trailerParkingCapacity ~60** given the paved yard area.
- **dropArea = 25-50**, **dropYard = true**: dedicated trailer storage wrapping
  the building.
- **truckGateCount 1**, **buildingCount 1**, **railServed false** (no spur),
  **scale false**, **multipleFacilities false**.
- **siteAreaAcres ~9.5** from the traced perimeter ring.

## Setting
**Urban** — dense Lynchburg fabric: residential streets to the N and W, a
city park/ballfield NW, businesses and a cemetery across Fort Ave. Older,
compact urban plant. connectivityIssue = false.

## Geofences
- **perimeter**: 6-vertex ring tracing the fence line at true (rotated)
  orientation — NE access corner, down the E/Fort Ave edge, around the S by the
  laundry, the SW yard, up the W greenway edge, back across the N.
- **truckGate**: rotated quad over the NE/E access drive.
- **dropYards**: two rotated quads over the SW and S trailer rows.
- **dockAprons**: one rotated quad hugging the south dock wall.
- **streetViewMeta.truckGate**: pano CAoSF0NJSE0wb2dLRUlDQWdJRGE4NmEtblFF
  (Fort Ave, 37.39718,-79.16497), heading 334° toward the gate. Perimeter
  centroid returned ZERO_RESULTS (no road pano inside the lot) → no coverage.

## Final confidence
**high** — building and ownership unambiguous, perimeter and fencing confirmed
in multiple Street View captures and high-zoom satellite. The only soft calls
are guard-shack/remote-GS (no booth seen but possible occlusion) and exact dock
count.
