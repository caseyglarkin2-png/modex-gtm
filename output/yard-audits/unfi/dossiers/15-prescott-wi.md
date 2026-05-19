# UNFI — Prescott WI DC (Twin Cities) — Deep-Audit Dossier

**Roster idx:** 15
**Facility:** UNFI Prescott Distribution Center
**Address:** 1000 Eagle Ridge Dr, Prescott, WI 54021
**Resolved center:** 44.76235, -92.78495
**Confidence:** High

---

## Location resolution

The roster coordinate (44.762586, -92.784517) landed directly on the roof of a
large white distribution building in an edge-of-town industrial park on the
northwest side of Prescott, WI. Web search corroborated the address
(TruckMap, Yahoo Local, UNFI locations page) and the facility profile: a LEED
Gold food-distribution warehouse, originally ~300,000 sq ft and expandable to
600,000 sq ft, with dry storage, cold storage, a main office, an Albert's
Organics office, shipping, and a **remote truck-maintenance facility** — all
visible on the site. The DC serves the Minneapolis-St. Paul metro (~24 mi
southeast of St. Paul). Identification is unambiguous; building locked.

## What the imagery showed

- **Wide satellite (z16-z17):** A single large DC building set well back from
  Eagle Ridge Dr behind an open lawn. Truck operations (docks, drop yard) are
  on the **west** face; office and employee parking face Eagle Ridge Dr on the
  south. A second, smaller building sits at the SW corner — the remote truck
  shop.
- **Truck side (z18-z19, NW/north probes):** Docks run nearly the full length
  of the west building face with trailers backed in. A separate long bank of
  drop trailers (parked without tractors) sits in the west yard north of the
  active dock apron. Wide paved truck court between drop yard and docks.
- **Entrance (z19 + Street View):** The internal truck driveway leaves Eagle
  Ridge Dr at the SW of the property and loops back to the west-side docks.

## Gate / guard-shack determination

- **truckGate: FALSE.** The truck driveway meets Eagle Ridge Dr as an open
  paved entrance — no barrier arm, no sliding/swing gate, no checkpoint
  pinch-point. Three Street-View headings along Eagle Ridge Dr and z19
  satellite of the entrance show no gate structure and no perimeter fence
  line. The property is an open campus.
- **guardShack: FALSE.** No staffed booth — no small 1-3-vehicle-footprint
  structure beside the truck lane anywhere in the imagery.
- **remoteGs: FALSE.** Requires a gate to be present; there is none.

## Yard zones and counts

- **Perimeter:** ~36 acres — the building, west drop yard, west dock apron,
  south office parking, and the SW truck shop, bounded by farm fields N/E.
- **Drop yard:** one long west-side bank of parked drop trailers — `dropArea`
  in the 25-50 band; `dropYard: true`.
- **Dock apron:** west face of the main building; ~44 dock doors estimated
  (`dockDoors` 25-50). Single dock cluster — ship and receive not physically
  separated, so `shipRcvSeparate: false`.
- **postGateStaging: true** — wide interior truck court provides holding room
  before the docks. `drivewayLong: true` — the loop approach holds a 3+ truck
  queue easily.
- **yardMetrics:** ~44 dock doors, ~38 trailers visible, ~70-trailer parking
  capacity, 1 truck gate, 2 buildings, ~36 acres, no rail.

## Web findings

UNFI Prescott is a LEED Gold food-distribution warehouse serving the Twin
Cities metro; ESI Group and National Design Build Services list it with dry +
cold storage, main office, Albert's Organics office, shipping, and a remote
truck-maintenance building. Driver reviews note efficient receiving and quick
unload — consistent with an open-access, no-gate yard.

## Final confidence: HIGH

Facility positively identified; imagery clear in all key views. The two
flagged uncertain fields (`dockDoorCount`, `trailerParkingCapacity`) are
honest overhead estimates, partly occluded by backed-in trailers.

**3-line summary:**
Gate: no truck gate — open driveway off Eagle Ridge Dr, no barrier/fence.
Guard shack: none.
Confidence: high.
