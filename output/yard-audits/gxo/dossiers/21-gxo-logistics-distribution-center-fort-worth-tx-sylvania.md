# Deep-Audit Dossier — GXO Logistics Distribution Center, Fort Worth TX (Sylvania)

**Roster idx:** 21
**Address:** 4320 N Sylvania Ave, Ste 100, Fort Worth, TX 76137
**Type:** Distribution Center (multi-tenant flex/industrial suite)
**Locked coordinates:** 32.81880, -97.30715
**Method:** deep-audit
**Confidence:** high

## Location confirmation
The geocoded point (32.819094, -97.307487, ROOFTOP, moved 39 m) lands on a large
warehouse in the North Fort Worth industrial park along N Sylvania Ave. Web
research (Dun & Bradstreet, Waze) confirms GXO Logistics Supply Chain, Inc.
operates from 4320 N Sylvania Ave Ste 100 — a suite within a multi-tenant
building (XPO Logistics also historically listed at the same address).

Street View positively confirms the site: a GXO-branded straight box truck
("GXO — Logistics at full potential") is parked at the curb directly outside the
building, and GXO signage is visible on the building face. The pin building is
the northern of the park's warehouses; the building runs roughly NW–SE with
office frontage on the west (N Sylvania Ave) side and the dock/truck court on
the east side.

## Key views
- **Wide satellite (z16–18):** Multi-building industrial park; warehouses
  separated by shared, open paved truck courts. Open landscaped buffers along
  N Sylvania Ave.
- **Street View, west frontage (90°):** Office face with glass entrances, low
  (~4 ft) ornamental black metal fence and trimmed hedge along the road — purely
  decorative, no security function.
- **Street View, north (90°/130°):** Open driveway entrance from N Sylvania Ave
  into the truck court; GXO box truck parked at curb. No gate, arm, or booth.
- **Tight satellite (z19–21):** East building face has recessed dock courts
  (dark canopies, hatched no-park striping) transitioning to marked auto/
  employee parking. No trailer-drop stalls.

## Gate / guard-shack / dock determinations
- **truckGate: false** — Entry to the shared truck court is a fully open
  driveway off N Sylvania Ave. No barrier arm, no sliding/swing gate, no
  checkpoint pinch-point. The only fence is a low ornamental fence along the
  road frontage with no gate across the truck lane.
- **guardShack: false** — No booth structure anywhere near the entrance.
- **remoteGs: false** — No gate exists, so no remote check-in implied.
- **dockDoors: 10-25** — Recessed dock courts along the east building face;
  multi-tenant building, GXO uses a portion. ~24 doors estimated for the whole
  building face (low confidence on exact count).
- **dropArea: NONE** — No marked trailer-parking stalls. East apron is mostly
  marked car parking plus a recessed dock court.

## Yard zones and counts
- **perimeter:** the GXO building parcel — ~15.2 acres derived from the box.
- **truckGate:** the open driveway access point off N Sylvania Ave (no physical
  gate; box drawn for the access location).
- **dockAprons:** recessed dock court along the east building face.
- **dropYards / staging:** none — open shared truck court, no dedicated drop lot.
- **dockDoorCount:** ~24 (estimate). **trailersVisible:** 0 in captured imagery.
  **trailerParkingCapacity:** ~12 if apron used for staging. **buildingCount:** 1
  (GXO building; park has several). **railServed:** false.

## Web findings
- D&B / Waze: GXO Logistics Supply Chain, Inc., 4320 N Sylvania Ave Ste 100,
  Fort Worth, TX 76137-4231 — Freight Transportation Arrangement.
- Same address historically associated with XPO Logistics (GXO's predecessor),
  consistent with a long-standing GXO/XPO operation here.

## Final confidence
**High.** Building positively identified by GXO truck and signage in Street
View; layout (open ungated truck court, recessed dock courts, multi-tenant flex
building) is clear from satellite. Exact dock-door count and trailer capacity
are honest estimates and flagged uncertain — they do not affect the gate /
guard-shack determinations, which are unambiguous.
