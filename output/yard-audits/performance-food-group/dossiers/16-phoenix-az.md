# Deep-Audit Dossier — idx 16

## Performance Foodservice — Arizona (Phoenix, AZ)

**Facility type:** Broadline Foodservice Distribution Center
**Address:** 455 S 75th Avenue, Phoenix, AZ 85043
**Resolved coordinates:** 33.44260, -112.21950
**Confidence:** High

---

### Location resolution

The roster geocode (33.442346, -112.219523, ROOFTOP, moved 678 m) lands on the
PFG-occupied DC building. Street View along S 75th Ave (2023-02 and 2025-12)
shows the building's west wall carrying a blue "FOODSERVICE / SUPPLY" sign,
and a pole sign at the curb — positively identifying the Performance
Foodservice — Arizona branch. Performance Foodservice's location page lists 455
S 75th Avenue as the Arizona broadline DC; phone (480) 705-3000.

The facility sits in the Phoenix west-side industrial district along S 75th
Avenue, surrounded by large distribution warehouses (Target import center and
others nearby) — clearly an urban metro industrial setting.

### Key views

- **Satellite z17-z20:** Main DC building with dock doors on its south face,
  trailers backed in. A large graded/dirt trailer drop lot lies directly south,
  packed with dozens of trailers in diagonal rows. A curving paved driveway
  loops from the SW into the dock yard. A secondary smaller building sits to
  the west/north.
- **Street View (heading W / S):** The dock yard is enclosed by a CMU block
  wall topped/extended with chain-link fence; orange construction mesh along
  the road frontage. Trailers visible backed into docks behind the wall.
- **Street View (heading 130 / 30):** The curving entrance driveway passes
  through a gated opening in the perimeter wall; no staffed booth seen at the
  gate.

### Gate / guard-shack / dock determinations

- **truckGate = true** — The dock/truck yard is fully enclosed by a block-wall
  + chain-link perimeter; the curving entrance driveway enters through a
  controlled gated opening at the SW corner.
- **guardShack = false** — No staffed guard booth observed at the gate; entry
  appears gate-only. Flagged uncertain (the driveway corner is tree-shaded).
- **remoteGs = true** — Gate present, no booth → kiosk/call-box-style remote
  check-in implied.
- **dockDoors = "10-25"** — Dock bank on the south face; ~24 doors estimated.
- **dropArea = "50+"** — Large graded trailer drop lot south of the building
  holds many dozens of parked trailers.
- **drivewayLong = true** — Wide curving gate apron and deep yard give long
  internal stacking depth.
- **fastLaneOpportunity = true** — Generous paved width at the curving gate
  apron leaves room to add an express/bypass lane.
- **postGateStaging = true** — Paved area inside the gate before the docks.

### Yard zones and counts

- **Perimeter:** ~12.5 acres covering the DC, dock yard, drop lot and
  secondary building.
- **Drop yard:** Large graded lot south of the building, 50+ trailers.
- **Dock apron:** Strip along the south dock face.
- **Truck gate:** Gated opening at the SW curving driveway.
- **Staging:** Paved apron just inside the gate.
- **Dock doors:** ~24 (medium confidence).
- **Trailers visible:** ~40+ across dock yard and drop lot.
- **Rail-served:** No spur into the property.

### Web findings

- Performance Foodservice — Arizona, 455 S 75th Avenue, Phoenix, AZ 85043;
  phone (480) 705-3000. Southwest broadline DC.

### Final confidence: HIGH

Building positively identified by the wall and pole signage in Street View.
Gated perimeter confirmed. Guard-shack call is "false / remoteGs true" with the
caveat that the tree-shaded gate corner could hide a small booth — flagged in
uncertainFields. Dock count is an overhead estimate.
