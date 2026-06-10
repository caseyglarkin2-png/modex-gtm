# NFI Distribution Center — McDonough, GA (idx 15)

**Address:** 165 Greenwood Industrial Pkwy, McDonough, GA 30253
**Type:** Distribution Center
**Resolved center:** 33.39195, -84.1644
**Maps (satellite):** https://www.google.com/maps/@33.39195,-84.1644,400m/data=!3m1!1e3
**Confidence:** High
**Method:** deep-audit (satellite z16-19 + Street View, Feb-2025 panos)

---

## Step 0 — Facility confirmation

The supplied coordinate (33.392022, -84.1644) lands directly on a large bright-white-roofed
distribution building in the McDonough / I-75 Greenwood Industrial Pkwy logistics park. Web
research confirms this is the **Greenwood Distribution Center** occupied by NFI: a 561,140 SF
building, 32' clear, **98 dock doors**, 4 drive-in doors, **86 trailer parks**, ~2 mi from I-75
(Colliers Atlanta listing; ChamberofCommerce "NFI - McDonough"; TruckMap). The building footprint,
dual-face dock banks, and west trailer drop yard all match a high-throughput DC consistent with the
facility type. Center refined slightly north to the roof centroid (33.39195). Right building locked.

## Key views

- **Wide z16:** Building sits mid-frame in a dense cluster of big-box DCs (typical Atlanta-metro
  logistics fabric). Neighboring buildings are separate owners, not an NFI campus.
- **z17 / z18 overview:** Single rectangular building, long axis nearly N-S with a slight clockwise
  rotation. Loading docks line BOTH long faces (east and west) with trailers backed in. Auto/employee
  parking at the north and south ends. A full perimeter loop road encircles the building.
- **North end z18:** Employee auto lot at the north (office) face.
- **South end / frontage z18-z19:** Auto parking lot at the south face; public road (Greenwood
  Industrial Pkwy) runs E-W along the south boundary. A Greenwood **monument sign** marks the
  south-central visitor/auto driveway — no gate arm, no booth.
- **East face z19 (NE):** Dense bank of dock doors, wide apron, trailers backed in at angle; loop
  road then tree buffer to the property edge.
- **West face z19 (NW):** Building west dock wall plus a separate dense **trailer drop yard** of
  parked trailers between the building and the west property edge.
- **SW / SE corners z19:** Perimeter loop road wraps both south corners and connects to the public
  road via open curving drives. No gate or booth at either junction.

## Gate / guard-shack / dock determinations

- **Truck gate — FALSE.** No barrier arm or sliding/swing gate across any truck drive. South-central
  drive has only a monument sign; SW and SE loop connections are open. Street View (Feb 2025, pano
  `enukeumPm4kp9kmXgmgdsw`) shows a Jack Rabbit Transport tractor-trailer **staged on the public road
  shoulder**, consistent with an uncontrolled, open entrance.
- **Guard shack — FALSE.** No staffed booth (1-3-space footprint, multi-side windows) at any entrance
  in satellite or Street View. The fenced structure visible to the west/SW belongs to the neighboring
  facility, not NFI.
- **Remote GS — FALSE.** No gate exists, so no kiosk/call-box check-in implied.
- **Dock doors — 50+.** Listing states 98 doors; satellite confirms a dense regular door rhythm on
  both long faces.
- **Ship/Rcv separate — TRUE.** Two physically distinct dock banks on the east and west building faces.
- **Scale / multi-step — FALSE.** No truck scale pad or second checkpoint visible.

## Yard zones & counts measured

- **Perimeter:** oriented quad tracing the property inside the tree/loop line, ~**22.4 acres**.
- **Truck gate zone:** south-central entrance / monument-sign drive (open, no control).
- **Drop yards:** one ring — the west-side trailer storage lot.
- **Dock aprons:** two rings — the west dock apron and the east dock apron, each a long thin quad
  hugging the building wall at its true orientation.
- **Street View:** coverage on Greenwood Industrial Pkwy along the south frontage. Perimeter pano
  `PGqZa3fJ6vf1CBTcs4Q9NA` (heading 2°, looking north at the building); truck-gate pano
  `enukeumPm4kp9kmXgmgdsw` (heading 358°, looking north up the entrance drive).
- **yardMetrics:** dockDoorCount 98, trailersVisible ~130 (overhead estimate), trailerParkingCapacity
  86, truckGateCount 0, buildingCount 1, siteAreaAcres 22.4, railServed false.

## Web findings

- Colliers Atlanta "Greenwood Distribution Center" marketing: 561,140 SF available, 32' clear,
  **98 dock doors**, 4 drive-in doors, **86 trailer parks**, 108 auto parks, ~2 mi from I-75.
- ChamberofCommerce.com "NFI - McDonough" at 165 Greenwood Industrial Pkwy, Mon-Fri 8:00-16:00.
- TruckMap / Levelset list the same address as an active DC project.

## Final confidence

**High.** Building positively identified and corroborated by a published spec sheet; gate/guard/dock
calls supported by both overhead and ground-level (Feb 2025) imagery. Only the exact live trailer
count is an estimate (flagged in `uncertainFields`).
