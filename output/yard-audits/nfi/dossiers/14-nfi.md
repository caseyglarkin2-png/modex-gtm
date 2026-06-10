# Deep-Audit Dossier — NFI Fulfillment Center, Fairburn GA (idx 14)

- **Facility:** NFI Fulfillment Center Fairburn GA
- **Type:** Fulfillment Center
- **Address:** 2000 Logistics Center Dr, Fairburn, GA 30213
- **Resolved center:** 33.539865, -84.594177
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied coords (33.539632, -84.594265) landed directly on a large
single-story distribution building inside the Fairburn / Atlanta South
logistics corridor. Web research confirms this is **Fairburn Logistics
Center**, a 495,625 SF Class-A warehouse built 2016 (LoopNet, Cushman &
Wakefield listings). Waze lists "NFI Industries Inc - Truck Check-In" at
2000 Logistics Center Dr, and a chamber-of-commerce directory lists the same
NFI truck check-in address — so this building is NFI's operation. Building
identity is unambiguous. Precise center pinned at 33.539865, -84.594177.

## Site layout
A single rectangular cross-dock building, long axis running NW-SE, rotated
roughly 35-40° off north (a north-aligned box would clearly miss the fence
line, so every zone is traced as a rotated quad). Surrounded by a tree-line
buffer that screens the truck yard. Logistics Center Dr runs along the
N/NE side; a divided highway (Oakley Industrial / SR corridor) runs along the
SE. Employee/car parking is a curved-island lot at the NE (front/office) end
plus a second lot across the drive. The truck yard wraps the SW and SE faces.

## Key views and what they showed
- **z16/z17 wide:** Confirms an industrial park with several DCs; the NFI
  building is the centered one with a continuous paved truck apron on its
  SW and SE sides and the office/parking frontage at the NE.
- **z18 centered (33.5396,-84.5942):** Full parallelogram footprint; dock
  rhythm visible on both long faces; wide aprons SW and SE.
- **NE corner z19/z20:** Curved employee parking lot with landscaped islands
  at the building's NE (front/office) end. Painted lane arrows where the entry
  drive meets Logistics Center Dr.
- **SE end z21:** Diagonally-striped trailer-parking stalls and a landscaped
  island — the drop-yard area, screened from the highway by trees.
- **Dock faces (z19):** Continuous concrete dock apron along both NE and SW
  walls (roof itself overexposed white, so door counts are overhead estimates).

## Gate / guard-shack / dock determinations
- **truckGate = false.** Street View on Logistics Center Dr (captured 2025-10
  and 2025-11) and z20 satellite show the entrance is an **open driveway** with
  painted lane arrows but **no barrier arm and no sliding/swing gate** across
  the truck lane. The yard is tree-screened but the entrance is uncontrolled.
- **guardShack = false.** No staffed booth at the entrance. The only small
  structures near the entry throat are utility cabinets / a green transformer
  box (visible in Street View), not a multi-window guard booth.
- **remoteGs = false.** No controlled gate exists, so this is not a
  kiosk/app-check-in remote-guard situation.
- **Docks:** Cross-dock building — door banks on both long faces (NE wall and
  SW wall), which is why **shipRcvSeparate = true** and **dockDoors = 50+**
  (estimated ~80 doors total across both faces; flagged low-confidence).
- **Staging:** Large open paved apron inside the entrance before the docks
  (postGateStaging = true); driveway/apron holds 3+ trucks (drivewayLong).
  Wide entry apron and deep yard => fastLaneOpportunity = true.

## Yard zones traced (oriented polygons)
- **perimeter** — 7-vertex ring tracing the cleared/fenced property inside the
  tree line. Area ≈ 23.6 acres (shoelace on the ring).
- **truckGate** — quad at the NE entry throat / drive off Logistics Center Dr.
- **dockAprons** — two rings: one long thin quad along the NE dock wall, one
  along the SW dock wall, each parallel to the building face.
- **dropYards** — one ring covering the SE-end striped trailer-parking stalls.
- **staging** — quad on the open apron just inside the entrance, before docks.

## Yard metrics (overhead estimates)
- dockDoorCount ≈ 80 (cross-dock, both long faces) — approximate
- trailersVisible ≈ 6 (current imagery)
- trailerParkingCapacity ≈ 40 — approximate
- truckGateCount 1, buildingCount 1
- siteAreaAcres ≈ 23.6 (from perimeter polygon)
- railServed false (no spur into the property)

## Street View metadata
- **truckGate:** pano `9-bPJUW1MLDTBecblaaReg` (2025-10), heading 178° —
  the entry frame a driver sees arriving off Logistics Center Dr.
- **perimeter:** pano `B9R37PNancr7aRHY2PkTKw` (2025-11), heading 324°.

## Web findings
- Fairburn Logistics Center: 495,625 SF, built 2016, single-story Class-A
  (LoopNet 33800631; Cushman & Wakefield; CommercialCafe).
- NFI Industries occupies the site; Waze + chamber directory list it as an
  NFI truck check-in location. NFI runs eCommerce order fulfillment and is
  hiring CDL/non-CDL drivers (26ft box trucks + trailers) out of the area.

## Final confidence: high
Building identity, layout, open-entry (no gate / no guard shack), cross-dock
configuration, and urban setting are all clearly supported. Door and trailer
counts are honest overhead estimates (roof overexposure) and are flagged in
uncertainFields.
