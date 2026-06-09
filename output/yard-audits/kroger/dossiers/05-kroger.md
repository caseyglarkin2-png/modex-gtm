# Deep-Audit Dossier — Kroger Grocery Distribution Center, Keller TX (idx 05)

**Facility:** Kroger Grocery Distribution Center Keller TX
**Type:** Grocery Distribution Center
**Address:** 5801 Kroger Dr, Keller, TX 76244
**Resolved center:** 32.91320, -97.26340
**Confidence:** High
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Location confirmation

The supplied approximate coordinates (32.913615, -97.264612) landed directly on
the target building. Web search confirmed 5801 Kroger Dr, Keller TX 76244 is the
Kroger Distribution Center / Penske Logistics supply-chain warehouse (TruckMap,
Yelp "TEXAS KROGER 5801", Facebook "Kroger Distribution Center - Keller TX").
Street View at the south entrance shows a street sign reading **"Kroger Dr"** at a
signalized intersection feeding the property, plus a two-story Kroger corporate
office (US + Texas flags) on the south frontage. Identity is unambiguous.

The facility is a very large grocery DC: a single enormous warehouse (tan/white
roof) with an attached two-story office on the south side, a separate
maintenance/fuel building inside the west yard, a south dock face, and a huge
trailer drop yard wrapping the north and west.

---

## Key views

- **z16/z17 overview** — One dominant warehouse filling the site center; dense
  residential subdivisions abut the north and west behind a tree/fence buffer; a
  public E-W arterial forms the south edge; open scrub buffer to the east.
- **West/NW drop yard (z17/z18)** — Hundreds of trailers parked in long rows
  across the entire north and northwest. Dedicated trailer storage, separate from
  active dock staging. A long maintenance/fuel/wash building sits within it
  (~32.9128, -97.2674).
- **South dock face (z20)** — Trailers backed into a continuous bank of dock
  doors along the building's south wall, with a wide dock apron in front. Building
  south wall runs ~650 m; door count clearly 50+.
- **East end (z18)** — Eastern warehouse section (dark/tan roof) is enormous; SE
  corner has an additional dock apron with trailers. East property edge is open
  scrubland buffer, no rail.
- **Guardhouse / truck gate** — see below.

---

## Gate / guard-shack / dock determinations

### Truck gate — TRUE
Trucks enter from the public arterial via Kroger Dr at the southwest corner
(signalized intersection, ~32.9114, -97.2657) and funnel north into the yard. A
**staffed check-in guardhouse with a drive-through canopy** sits ~150 m inside the
entrance, in the median between inbound/outbound truck lanes (~32.9119,-97.2661).
Confirmed in Street View (captured 2024-12) and z20/z21 satellite: trucks queue
in lanes on either side of the canopy. This is a clear controlled checkpoint
pinch-point. (The entrance off the road itself is open; control is at the
guardhouse set-back, which is the standard layout for a large DC.)

### Guard shack — TRUE
The canopy-roofed booth in the lane median is a small (~1-2 vehicle footprint)
structure with windows on multiple sides and a drive-through canopy over the truck
lane — a classic staffed guard/check-in shack, distinct from the two-story office
on the south frontage. `remoteGs` = false because the shack is present.

### Docks — 50+
Continuous dock bank along the ~650 m south wall (trailers backed in across the
full length) plus a separate dock cluster at the SE corner and along the west
building face. Far more than 50 doors. `shipRcvSeparate` set true (medium
confidence) on the basis of physically separate dock banks on different faces.

---

## Yard zones & counts

- **perimeter** — 6-vertex ring traced inside the tree/fence buffer on north and
  west, the south arterial, and the east scrub buffer. ~98.1 acres.
- **truckGate** — quad around the guardhouse and its inbound/outbound lanes.
- **dropYards** (2) — (1) the large north/northwest trailer drop yard; (2) the
  west bobtail/tractor-and-trailer staging strip near the maintenance building.
- **dockAprons** (1) — long thin quad hugging the south dock wall at the building
  angle.
- **staging** — paved holding/queue area between the entrance road and the
  guardhouse (pre/post gate staging room).

**yardMetrics (overhead estimates):** dockDoorCount ~120, trailersVisible ~260,
trailerParkingCapacity ~350, truckGateCount 1, buildingCount 3 (warehouse +
office + maintenance), siteAreaAcres 98.1, railServed false.

**Street View coverage:** truckGate centroid pano `rDgwO4hHMhRZ7I5EtCZXDg`
(heading 26°, toward the guardhouse); perimeter centroid pano
`Kcq5JcP7UF86HrSZkcOoSA` (heading 0°, looking north into the site). Both OK.

---

## Web findings

- Confirmed Kroger supply-chain DC at 5801 Kroger Dr, Keller/Fort Worth TX 76244;
  also operated/associated with Penske Logistics (Waze entry "Penske logistics,
  5801 Kroger Dr"). Phone (817) 337-xxxx. Listed across TruckMap, Yelp,
  Foursquare, Facebook as a grocery distribution center / warehouse.

---

## Classification highlights

- `truckGate: true`, `guardShack: true`, `remoteGs: false`
- `preGateStaging: true`, `postGateStaging: true`
- `drivewayLong: true`, `backupSensitive: false` (huge on-site stacking room)
- `entryExitTogether: true`, `entryLanes: 2`, `exitLanes: 2`
- `fastLaneOpportunity: true` (wide gate apron, unused paved width)
- `dockDoors: "50+"`, `dropArea: "50+"`, `dropYard: true`
- `shipRcvSeparate: true` (medium confidence)
- `urbanRural: "Urban"`, `connectivityIssue: false`
- `multipleFacilities: false`, `scale: false`, `multiStep: false`

**Uncertain fields:** shipRcvSeparate, entryLanes, exitLanes, dockDoorCount,
trailerParkingCapacity (all overhead estimates).

## Final confidence: High
Facility positively identified; gate, guard shack, drop yard, and dock face all
confirmed in both satellite and Street View. Only door/lane/trailer counts are
approximate.
