# Deep-Audit Dossier — Fry's Southwest Grocery Distribution Center, Tolleson AZ

**Account:** Kroger (Fry's Food Stores banner) · **idx 10**
**Type:** Grocery Distribution Center
**Address:** 500 S 99th Ave, Tolleson, AZ 85353
**Resolved center:** 33.4404, -112.2775
**Maps (satellite):** https://www.google.com/maps/@33.4404,-112.2775,400m/data=!3m1!1e3
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

---

## Step 0 — Facility confirmation

The supplied approximate coordinates (33.439553, -112.277894) landed directly on
the correct building. Satellite at z16-z17 shows a very large grocery
distribution campus: a long white-roofed main building with a continuous dock
face, a second large building to the east, an SE office/utility (fuel + tank)
cluster, and a yard packed with several hundred trailers — consistent with a
major regional grocery DC, not an office or unrelated property.

Web search confirms the address and ownership: this is the Fry's Food Stores of
Arizona distribution center / headquarters at 500 S 99th Ave, Tolleson, AZ
85353 (phone 623-936-2100). Fry's is a banner of The Kroger Co.; the site also
returns under "Kroger Distribution Center, 500 S 99th Ave, Tolleson" on Waze and
Foursquare. Identity is unambiguous.

Center locked at 33.4404, -112.2775 (yard/building centroid).

## Steps 1-3 — Layout from satellite

- **Setting / boundaries:** The fenced operation is bounded on the NW by a
  multi-track rail corridor (running diagonally NW-SE), on the N by a perimeter
  road north of the main building, on the E by the east building's wall and a
  treed buffer to S 99th Ave, and on the S by a fenceline where the paved yard
  meets a large dirt overflow lot (the dirt lot, and W Lower Buckeye Rd beyond
  it, are outside the operational perimeter).
- **Buildings (3):** main DC (largest), a second large DC building to the east,
  and an SE office/utility cluster (admin + fuel/round tanks). Campus →
  `multipleFacilities: true`.
- **Docks:** continuous dock banks line the south wall of the main building and
  the east building, with trailers backed in along their length. Door count
  clearly exceeds the 50+ band (overhead estimate ~120 doors). Distinct dock
  banks on different building faces support `shipRcvSeparate: true`
  (medium confidence from overhead alone).
- **Drop yards:** three large trailer areas — an angled-stall lot in the NW next
  to the rail, a big central block of straight rows, and lower central/south
  rows. Several hundred trailers parked → `dropArea: 50+`, `dropYard: true`.
- **Rail:** the rail line is a corridor buffering the NW edge; no spur enters the
  fenced property, so `railServed: false`.

## Step 2 — Gate / guard-shack determination (Street View + z21 satellite)

- **Truck entrance:** a single controlled entrance off S 99th Ave at the SE
  corner. A long private two-lane drive (with a center median planter strip)
  runs west from 99th Ave to the checkpoint. Street View (pano
  `mYDLsIpXZXt9UVLVM2C_eQ`, captured 2022-03, looking W down the drive) shows
  4+ trucks queued on the approach — a deep, divided drive with a red/white
  check-in sign at the gate ahead. → `truckGate: true`, `drivewayLong: true`,
  `entryExitTogether: true`, `entryLanes: 1`, `exitLanes: 1`.
- **Guard shack:** z21 satellite at 33.43795, -112.2739 shows a small white
  booth with a dark canopy roof sitting on a yellow-curbed island that splits
  the inbound/outbound lanes mid-drive — a ~1-vehicle-footprint staffed booth,
  not the main building. → `guardShack: true`, `remoteGs: false`.
- **Fast lane:** the divided entrance apron has separate in/out lanes and ample
  paved width to add a bypass/express lane → `fastLaneOpportunity: true`.
- **Staging:** the deep entrance drive and the wide paved yard inside the gate
  give plenty of holding room → `postGateStaging: true`. No dedicated marked
  truck-stalls outside the gate were visible → `preGateStaging: false`.
- **No truck scale** visible in the truck path → `scale: false`. No clear second
  checkpoint after the gate → `multiStep: false`.
- **Backup-sensitive:** the entrance drive is long and set well back from 99th
  Ave with farm field on the inbound side, so a queue would not spill onto the
  public road → `backupSensitive: false`.

## Geofences & yard metrics

- **perimeter** — 8-vertex oriented ring tracing the fenced operation along the
  rail (NW), perimeter road (N), east wall (E), and south fenceline (S).
  Area ≈ **89.6 acres** (excludes the southern dirt overflow lot).
- **truckGate** — quad over the SE entrance drive / guard-booth island.
- **staging** — thin quad along the deep entrance drive (post-gate queue room).
- **dropYards (3)** — NW angled lot, central rows, lower central/south rows.
- **dockAprons (2)** — main building south dock strip and the central/east dock
  strip, each a long thin quad hugging its dock wall.
- **streetViewMeta** — truckGate pano `mYDLsIpXZXt9UVLVM2C_eQ` @ heading 271°
  (camera aimed W toward the gate, the driver's arrival frame); perimeter pano
  `2cO7FVRHY92ATrhH2ebJ5g` @ heading 233°.

yardMetrics: dockDoorCount ≈120, trailersVisible ≈400, trailerParkingCapacity
≈500, truckGateCount 1, buildingCount 3, siteAreaAcres 89.6, railServed false.
Door/trailer counts are honest overhead estimates (flagged in uncertainFields).

## Web findings

Fry's Food Stores of Arizona (a Kroger Co. banner) has operated from Tolleson
since 1960; the company runs 127 stores and 100 fuel centers statewide with
21,000+ associates, and this 99th Ave site serves as the AZ distribution center
and HQ. Confirms scale and the DC function.

Sources: Yelp, Greater Phoenix Chamber, BBB, Waze, Foursquare listings for
"500 S 99th Ave, Tolleson, AZ 85353."

## Final confidence

**High.** Facility identity is unambiguous, the guarded truck entrance and guard
booth are confirmed by both z21 satellite and ground Street View, and the layout
is clear. Lower-confidence items (raw door/trailer counts and the ship/receive
separation) are flagged in `uncertainFields`; they do not affect the core gate /
guard-shack / classification calls.
