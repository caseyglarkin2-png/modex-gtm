# Deep-Audit Dossier — idx 11

## SalSon Logistics — Dick's Sporting Goods Conklin DC (Dedicated Fleet) — Conklin, NY

**Status: RESOLVED — confidence HIGH** (re-audit of an earlier low-confidence stub)

### Step 0 — Location
Confirmed address: **1314 Conklin Road, Conklin NY 13748** — the **Dick's
Sporting Goods Conklin e-commerce distribution center**, a large single-tenant
DC in the Susquehanna River valley south of Binghamton. SalSon Logistics runs
a **dedicated-fleet** transportation operation out of this DC (SalSon is the
carrier / transport partner, not the DC operator). Google geocode returned a
ROOFTOP match at `42.0411656, -75.8098423`; the locked center is moved onto the
building footprint at `42.04280, -75.81000`. Web search confirmed 1314 Conklin
Rd as the Dick's Sporting Goods Conklin Distribution Center.

> The earlier stub mislabeled this site "Fishkill, NY" and could not resolve
> it. It is in Conklin, NY — corrected here.

### Steps 1-5 — Audit

**Building & layout.** A very large modern e-commerce DC running roughly
NW-SE, with an extensive trailer drop yard along its NE/east side. Docks face
**east** into the truck court / drop yard; employee car-parking and the office
are at the SE corner.

**Docks.** A long continuous dock bank along the building's east face —
estimated ~120 doors for an e-commerce DC of this footprint (`dockDoors: 50+`;
count flagged uncertain). One continuous bank — `shipRcvSeparate: false`.

**Drop yard.** Massive — many hundreds of parked trailers in long rows along
the NE/east side (`dropArea: 50+`, `dropYard: true`).

**Truck gate.** The truck court / drop yard is enclosed; the truck access road
from Conklin Road runs along the building's SE end and into the truck court
through a defined entrance pinch-point. `truckGate: true`.

**Guard shack.** A small structure sits at the building's SE corner beside the
truck-court entrance pinch-point, but from satellite it reads as attached to
the building rather than a standalone median guard booth, and no barrier arm
is clearly visible. Classed `remoteGs: true` (kiosk / gatehouse-window
check-in); `guardShack` flagged uncertain — a manned gatehouse window is
plausible at a DC of this scale but could not be confirmed as a separate booth
in imagery.

**Fast lane.** Large truck court with wide aisles and abundant paved width —
room for an express/bypass lane (`fastLaneOpportunity: true`).

**Rail.** A rail line runs through the valley near the DC but does not spur
into the property — `railServed: false`.

**Setting.** Conklin NY is a small rural town in a wooded river valley; the DC
sits among fields, the Susquehanna River, and a parallel rail line, well
outside any dense metro fabric — **Rural**.

**Geofence.** Perimeter captures the DC building plus the east drop yard and
the SE car-parking apron: ~668 m N-S x ~414 m E-W ≈ **68 acres**.

### Verdicts
- **Gate verdict:** truck gate present — defined truck-court entrance
  pinch-point off the Conklin Road access road.
- **Guard-shack verdict:** no standalone guard shack confirmed — remote /
  gatehouse-window check-in inferred; flagged uncertain.
- **Confidence:** high.
