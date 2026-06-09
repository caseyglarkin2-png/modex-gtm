# Deep-Audit Dossier — Harris Teeter Distribution Center, Greensboro NC (idx 03)

**Type:** Frozen DC (campus also handles dry grocery + perishable)
**Resolved center:** 36.09312, -79.93022
**Address:** 200 Distribution Dr, Greensboro, NC 27410
**Maps (satellite):** https://www.google.com/maps/@36.09312,-79.93022,400m/data=!3m1!1e3
**Confidence:** high
**Method:** deep-audit (satellite z16–z19 + Street View 2026-02 + web research)

---

## Step 0 — Facility confirmation

The supplied point (36.093784, -79.929764) landed directly on a large white/grey
roofed distribution building inside the Piedmont Triad industrial park, just SE
of Piedmont Triad International Airport (PTI). Geocoding 200 Distribution Dr
returned 36.0931103, -79.9306696, which sits on the same building's west side.
Public records for the address list **Harris Teeter Inc and Ryder System Inc**
(Ryder = the carrier/fleet operator typical of a grocer DC), confirming identity.

Street View along Distribution Dr (2026-02 imagery) shows the **Harris Teeter
logo** on the warehouse wall at the truck entrance — positive identification.
Web research confirms this is Harris Teeter's Greensboro distribution facility
(frozen, dry grocery, perishable) that received a 174,000 sf addition (1996) and
later a 50,000 sf perishable expansion to ~225,000 sf. Locked center at the main
building: **36.09312, -79.93022**.

## Key views

- **Satellite z16/z17 overview:** One dominant rectangular warehouse (two-tone
  roof = original + expansion) oriented with its long axis running NW→SE, rotated
  ~30° off north. A second large warehouse (perishable/grocery) sits NE/E, plus
  an office building to the S — a 3-building campus. Wooded buffer on the SE/S.
- **Satellite z18/z19 of faces:** Long dock-door rows with trailers backed in on
  both long faces of the main building (NE and SW). Extensive trailer drop rows
  in the W/SW and N yards. No rail spur anywhere on the property.
- **Street View (Distribution Dr, 2026-02):** Continuous chain-link perimeter
  fence (green privacy slats on the adjacent neighbor; bare chain-link on the HT
  drop-yard side) runs the length of the road. The HT trailer yards are clearly
  fenced from the public road.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** The main truck drive enters the fenced yard from
  Distribution Dr at the NE (~36.0954, -79.9306). Street View headings 120°/150°/
  180° show the perimeter fence with sliding/swing gate panels flanking the drive
  opening, a tall light pole, and trucks/trailers + dock doors inside. Controlled,
  pinch-point entrance — not an open driveway. Pano `eF5GpytxFciQATf0oIlVrw`.
- **Guard shack — FALSE.** No small staffed booth at the entrance in any heading.
  The entrance is open paved drive bounded by fence; the only roadside structures
  are light poles and a red fire-department standpipe/FDC. No 1–3-stall booth
  footprint on satellite at the gate either.
- **remoteGs — TRUE.** Gate present, no guard shack → access by kiosk / badge /
  call-box (rubric: gate true + guardShack false ⇒ remoteGs true).
- **Dock doors — 50+.** Long regular dock rows with dock levelers and backed-in
  trailers on both long faces of the main building plus the perishable building.
  Rough campus total ~95.
- **Ship/Rcv separate — TRUE (medium conf).** Dock banks on opposite long faces
  of the main building, and the perishable building has its own dock cluster.

## Yard zones and counts

- **Perimeter:** Oriented 9-vertex ring tracing the fenced HT property (main
  building + drop yards + perishable building), ~**33.6 acres** (shoelace).
- **Truck gate:** Small oriented quad on the Distribution Dr entrance.
- **Drop yards:** Three oriented quads over the W/SW and N trailer-storage rows
  (rows run parallel to the building/road at the site angle).
- **Dock aprons:** Two long thin oriented quads hugging the NE and SW dock walls
  of the main building.
- **Metrics:** dockDoorCount ~95, trailersVisible ~240, trailerParkingCapacity
  ~320, truckGateCount 1, buildingCount 3, siteAreaAcres 33.6, railServed false.
  (Trailer/capacity/lane counts are honest overhead estimates — see
  `uncertainFields`.)

## Other classification notes

- **postGateStaging TRUE / drivewayLong TRUE:** large paved inter-building yard
  inside the fence holds well over 3 trucks before docks.
- **fastLaneOpportunity TRUE:** wide gate apron + unused paved width at the
  Distribution Dr entrance leave room for a bypass/express lane.
- **multipleFacilities TRUE / dropYard TRUE / scale FALSE / multiStep FALSE.**
- **urbanRural Urban:** dense PTI industrial park within the Greensboro metro.
- **connectivityIssue FALSE:** metro/airport-adjacent, strong coverage expected.

## Web findings

Harris Teeter's Greensboro DC handles frozens, dry grocery and perishables and
supplies 3,600+ products across the Triad, Outer Banks and up to Delaware.
Documented dock-depth and door additions across both warehouses for cross-docking
corroborate the high door count and multi-building campus read.

## Final confidence: HIGH

Building positively identified (logo + records + geocode), gate/no-guard-shack
read directly confirmed in recent (2026-02) Street View, dock/drop scale clear on
satellite. Lower-confidence items (exact lane counts, trailer capacity, strict
ship/rcv split, exact acreage) are flagged in `uncertainFields`.
