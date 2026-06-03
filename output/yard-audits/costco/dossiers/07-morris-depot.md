# Yard Audit Dossier — Costco Dry Depot, Morris IL (#07)

- **Facility:** Costco Wholesale Distribution Center (Dry Depot — Chicago/Midwest regional cross-dock)
- **Address:** 3800 N Division St, Morris, IL 60450
- **Resolved center:** 41.39400, -88.42850
- **Type:** Dry Depot / cross-dock distribution center
- **Method:** deep-audit (satellite + Street View)
- **Confidence:** high

## Location confirmation

The roster coordinates (41.394241, -88.42706) landed squarely inside the truck
yard of a very large distribution complex on the north edge of Morris, IL,
west of N Division St. Web research confirmed the identity: this is Costco's
1.1-million-square-foot Morris distribution center at 3800 N Division St, with
482 trailer-parking stalls, 229 employee spaces, two detention ponds, and 100
overhead doors with 53 precast loading positions (facility/construction
records). Street View at the Division St frontage shows a "3800 N. DIVISION"
address monument and a "Costco Dr" street sign at the entrance corner —
positive confirmation. Center refined to the centroid of the fenced property
(41.39400, -88.42850); the supplied coordinates were good (~200 m off, inside
the yard).

A separate large distribution building sits immediately west across a drive,
and another building sits south across the detention ponds — neither is part of
this Costco parcel and both were excluded from the geofence.

## Key views

- **z16 overview** — One integrated mega cross-dock building with rooftop solar,
  flanked by extensive paved trailer yards on the north and center. Farm fields
  to the north and west; commercial strip (IHOP, Comfort Inn, dispensary) across
  Division St to the east.
- **z17/z18 detail** — Dock doors with trailers backed in along multiple
  building faces; long rows of parked trailers and colored intermodal-style
  containers in dedicated drop yards.
- **Frontage Street View (2025-05)** — Continuous chain-link perimeter fence
  along the Division St frontage with a landscaped stormwater-detention buffer
  inside the fence; building and lots visible beyond. Confirms a fully fenced
  property.
- **Entrance Street View (2025-05)** — The Division St / Costco Dr intersection
  with the "Costco Dr" street sign and "3800 N. Division" monument. Google did
  NOT drive the private road, so the gate booth is not seen at ground level.
- **z20/z21 on Costco Dr** — Multi-lane truck approach with directional lane
  arrows and multiple semis queued; a gate-island booth in the median between
  inbound and outbound lanes, with a security/admin building beside the gate.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Trucks enter on a dedicated private road (Costco Dr)
  off N Division St. The approach is a wide multi-lane truck drive with painted
  directional arrows; the whole property is fenced (Street View). Semis are
  visibly staged on the approach in overhead imagery. This is a controlled,
  single guarded truck entrance (entry/exit together at one point).
- **Guard shack — TRUE.** A booth island sits in the median between the inbound
  and outbound truck lanes at the gate throat (z20 gatecheck frame), with a
  detached security/admin building set beside the gate. Consistent with Costco
  corporate gate standard and with the gated overnight-truck-parking the site is
  known for. Read from overhead at z20; not visible at ground level because
  Street View does not enter the private road — but the median structure plus
  the inbound/outbound lane split is unambiguous. `remoteGs` is therefore false.
- **Post-gate staging — TRUE.** Wide multi-lane paved staging on Costco Dr just
  inside the gate where semis stack before proceeding to the docks.
- **Driveway long — TRUE.** The gate→dock approach easily holds 3+ trucks.
- **Fast-lane opportunity — TRUE.** 4+ paved truck lanes through the gate apron
  leave room for a dedicated express/bypass lane.
- **Dock doors — 50+.** 100 overhead doors / 53 precast loading positions per
  records; banks of dock doors with trailers backed in on multiple faces.
- **Drop area / drop yard — 50+ / TRUE.** 482 marked trailer stalls; multiple
  long rows of parked trailers and containers in dedicated drop yards.
- **Scale — uncertain (left false).** No weigh platform positively identified.
- **Ship/rcv separate — uncertain (left false).** Cross-dock with docks on
  multiple faces, but no clearly separated ship-vs-receive bank confirmed.
- **Rail — FALSE.** No spur runs into the property.

## Yard zones & counts

- **Perimeter** — 8-vertex fence-line ring tracing the whole fenced parcel
  (farm-field/ditch on the north, Division St / Costco Dr frontage on the east,
  detention ponds on the south, drainage channel on the west, including the SW
  grading/expansion pad). Area ≈ **195 acres** (shoelace).
- **Truck gate** — oriented quad over the Costco Dr gate throat (booth island +
  multi-lane checkpoint).
- **Drop yards** — two long oriented quads over the north and central trailer
  drop rows (the most prominent of the site's 482-stall capacity).
- **Dock apron** — oriented strip hugging the main dock face where trailers back
  in.
- **Staging** — post-gate multi-lane truck staging strip on Costco Dr.
- **Metrics:** dockDoorCount 100, trailersVisible ~220 (overhead estimate),
  trailerParkingCapacity 482, truckGateCount 1, buildingCount 2,
  siteAreaAcres ~195, railServed false.

## Street View coverage

- **Truck gate** — pano `9h23R-qxOHD85go7Zha6Hw` (captured 2025-05) at the
  Division St / Costco Dr corner, heading 280° (looks west toward the gate).
  hasCoverage: true.
- **Perimeter** — pano `Sgenh7hQAg6nIKXjmhL46g` (captured 2025-05) on the
  Division St frontage, heading 251° (looks across the fenced detention buffer
  toward the building). hasCoverage: true.
- Costco Dr itself has no Street View (private road), so the gate booth is
  documented from satellite (z20) rather than ground level.

## Web findings

- 1.1M sq ft Costco distribution center; 482 trailer stalls; 229 employee
  spaces; two detention ponds; 100 overhead doors / 53 precast loading positions.
- Operating hours Mon–Fri 05:00–14:00, Sat 05:00–12:00; ample overnight truck
  parking; typical unload ~1 hour once docked (driver reviews).

## Final confidence

**High.** Facility identity is certain (address monument + Costco Dr sign +
records). Gate and guard-shack calls are well supported by the multi-lane
fenced entrance, queued semis, and the median booth island, though the booth is
read from overhead only (no ground-level pano on the private road). Scale and
ship/rcv-separate are the only genuinely uncertain fields.
