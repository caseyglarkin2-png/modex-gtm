# Deep-Audit Dossier — idx 57

**Kroger Michigan Fresh Distribution Center, Romulus MI**
Type: Distribution Center · 15520 Wayne Rd, Romulus, MI 48174
Resolved center: **42.18845, -83.37720** · Confidence: **high**

## Step 0 — Facility confirmation
The supplied coords (42.188526, -83.377667) land directly on a single very large
white-roofed industrial building. Web research (Penske Logistics / Crain's / DC
Velocity, June 2019) confirms this is the build-to-suit **606,000 sq ft fresh
(freezer/cooler) distribution center**, ~47-acre parcel, **105 loading docks**,
operated for The Kroger Co. of Michigan (Penske until 2022, then KLS Logistics).
This is distinct from the nearby Ocado CFC on Wahrman Rd — that is a different,
separate building. The smaller building to the WEST of the Kroger DC (with its
own parking, seen in the wide z16 frames) is a separate parcel/tenant, not part
of this audit. The Kroger FRESH DC is the large center building; locked.

## Layout (satellite z16-z21)
- One large rectangular building, long axis roughly E-W with a slight clockwise
  tilt (east end runs marginally north). Adjacent to DTW airport land (aircraft
  visible on Wayne Rd Street View).
- **North long face**: continuous dock bank with trailers backed in + a head-to-tail
  trailer drop row running the length of the lot.
- **South long face**: a second continuous dock bank with trailers backed in + a
  south drop row. Two opposed dock banks => ship/receive on separate faces.
- **East end**: large employee car park; the NE turnaround is the truck staging /
  post-gate area where trailers and yard trucks (red tractors) are staged.
- **West end**: round process tank/silo at the NW building corner; retention pond
  off the NW lot corner; wooded/wetland buffer wraps N, S, and W.

## Access control — gate / guard
- The only public-road access is a **single open driveway off Wayne Rd** at the NE.
- Street View (Wayne Rd, 2024-07) shows a monument sign and a wide open commercial
  drive — no barrier arm, no guard booth. The property sits well back behind reeds/
  trees so SV does not enter it.
- Max-zoom satellite (z21) over the driveway throat shows open pavement with one
  sign/light pole and its shadow, **no gate arm and no fence-line gate**.
- The structures near the NE turnaround are a fuel/maintenance canopy and staged
  trailers, **not** a guard shack.
- Verdict: **truckGate=false, guardShack=false, remoteGs=false.** Open driveway;
  control is at the building/dock, not the perimeter.

## Yard zones & counts
- **Perimeter**: 5-vertex ring tracing the paved truck lot at true orientation
  (pond corner NW -> NE entrance -> E lot -> SE -> SW). Area **30.1 acres** (paved
  yard; full deeded parcel ~47 acres incl wooded buffer).
- **truckGate** zone: small quad over the NE entrance throat / turnaround.
- **dropYards**: two long thin quads — the north and the south trailer rows.
- **dockAprons**: two long thin quads hugging the north and south dock walls.
- **staging**: null (post-gate staging captured implicitly in the NE turnaround).
- **dockDoorCount 105** (press release, corroborated by both dock banks) -> 50+ band.
- **dropArea 50+** (long N+S trailer rows + NE staged trailers).
- **trailersVisible ~120**, capacity ~160 (estimate; flagged uncertain).
- **buildingCount 1**, **truckGateCount 1**, **railServed false**.

## Other classification calls
- **drivewayLong=true** — long entrance approach holds 3+ trucks.
- **postGateStaging=true** — paved NE turnaround stages trailers before docks.
- **entryExitTogether=true** — in/out share the one NE driveway (small center island).
- **fastLaneOpportunity=true** — wide open apron/turnaround, room for a bypass lane.
- **shipRcvSeparate=true** — opposed dock banks on N and S faces.
- **dropYard=true** — dedicated on-site trailer storage rows.
- **urbanRural=Rural** — edge-of-town parcel ringed by woods/wetland; airport-adjacent.
- backupSensitive / scale / multiStep / multipleFacilities / connectivityIssue = false.

## Street View
Public coverage on Wayne Rd only. truckGate pano `z0Uzd9yeEOXhLY9bpbISFQ`
(@42.1905,-83.3736, 2024-07, heading 245° toward the gate). perimeter pano
`nIa9jcGvynuBhi__b4vPOw` (heading 247°). No interior coverage.

## Web findings
- Penske Logistics opened the 606,000 sqft fresh DC June 2019; $98.5M, 47 acres,
  105 docks, 250k sqft refrigerated + 100k sqft freezer at -15°F; serves ~120
  Kroger Michigan stores. Penske exited 2022; contract to KLS Logistics Group.

## Confidence
**High.** Building identity certain (matches press-release spec); gate/guard
determinations backed by z21 satellite + Wayne Rd Street View. Lane counts and
exact trailer capacity are estimates (flagged in uncertainFields).
