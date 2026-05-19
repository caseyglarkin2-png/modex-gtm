# Deep-Audit Dossier — idx 11

## Kenco MCS Jeffersonville III — Sellersburg, IN

**Facility type:** Multi-Client Distribution Center
**Resolved location:** Silver Creek Logistics Center, Building B — 7803 Highway 31 E, Sellersburg, IN 47172
**Locked center coordinate:** 38.37820, -85.75300 (Building B center)
**Gate verdict:** NO truck gate (open access)
**Guard-shack verdict:** NO guard shack
**Confidence:** High

---

### Step 0 — Locating the facility

The roster coordinate (38.398626, -85.776916, geocode precision `APPROXIMATE`) landed on
open farmland roughly 2 km northwest of any industrial building — confirmed wrong by a
zoom-17 satellite probe.

Web research resolved the facility. Kenco's "MCS — Jeffersonville III" carries 417,270 SF
in the roster. Commercial real estate listings (LoopNet, PropertyShark, Cambridge builder
page) identify **Silver Creek Logistics Center Building B at 7803 Highway 31 E,
Sellersburg, IN 47172** as a **417,270 SF** Class A building (36 ft clear, built 2019,
developed by Clarion Partners) — an exact square-footage match. Silver Creek Logistics
Center is a two-building park on Highway 31 E, ~0.9 mi from I-65. (Rush Group / NAI Fortis
coverage confirms ~420,000 SF Building B leased in the park.)

The two-building campus was positively confirmed on satellite: I-65 with a wooded buffer
to the west, Highway 31 E plus a parallel rail line to the east, residential subdivision
to the north, and the I-65/SR-60 interchange to the south.

### Steps 1–3 — Key views

- **Site overview (z16/z17):** Two large white-roof Class A logistics buildings. The
  **northern/upper-right building is the smaller one (~350 m long) = Building B**, the
  roster facility. The southern building is the larger Building A (~660,450 SF). Both
  front a shared central drive aisle.
- **Truck entrance:** A single access driveway leaves Highway 31 E, crosses the rail
  line, and runs straight into the property toward Building B's office/dock face.
- **Street View (capture 2026-03):** The entrance is a wide, fully open paved access
  drive — **no barrier arm, no sliding/swing gate, no guard booth, no kiosk**. Only a
  ground-level monument sign. The property has no perimeter fence — typical of a modern
  speculative logistics park. The driveway splits inside the property to loop the
  buildings.
- **Docks:** Building B's dock bank runs along its southwest face toward the central
  aisle, with a continuous row of dock doors and many trailers backed in. Building A
  mirrors this on its northeast face. A large paved trailer drop yard fills the central
  aisle between the buildings.

### Step 4 — Web findings

- Silver Creek Logistics Center: best-in-class distribution park, 1,077,060 SF total
  across two Class A buildings on Highway 31 E, ~0.9 mi to I-65, built ~2019.
- Building A ≈ 660,450 SF; Building B ≈ 417,270–417,410 SF, 36 ft clear.
- Rush Group Ltd. announced a ~420,000 SF lease in the park (Dec 2023). Kenco operates
  Building B as "MCS — Jeffersonville III" (Kenco location page confirms the name).

### Step 5 — Classification rationale

- **truckGate / guardShack / remoteGs = false / false / false** — open driveway off
  Highway 31 E with no checkpoint structure of any kind; property unfenced. With no gate,
  remoteGs is false by definition.
- **postGateStaging = true, drivewayLong = true** — the long internal approach drive and
  central aisle hold a 3+ truck queue easily.
- **entryExitTogether = true; entryLanes 1 / exitLanes 1; fastLaneOpportunity = true** —
  one shared entrance; the apron and drive are wide enough to add an express bypass lane.
- **dockDoors = "25-50"** — conservative band from Building B's single visible SW dock
  face (~350 m long building); whole-site count is higher. Flagged uncertain.
- **dropArea = "25-50", dropYard = true** — a large dedicated trailer drop yard fills the
  central aisle between the two buildings.
- **multipleFacilities = true** — two large Class A buildings (A + B) share one property.
- **urbanRural = "Rural"** — edge of Sellersburg, a small town; an adjacent residential
  subdivision sits to the north, but the broader setting is small-town/rural per rubric.
- **railServed = false** — a rail line parallels Highway 31 E at the east property edge
  but no spur enters the site.
- **scale = false, shipRcvSeparate = false, multiStep = false, backupSensitive = false.**

### Yard zones & counts

- **Perimeter:** developed property of both buildings, drives, parking and drop yard —
  ~96 acres.
- **truckGate zone:** the Highway 31 E driveway connection (open, no structure).
- **dropYards:** central trailer drop area between the buildings.
- **dockAprons:** Building B SW dock apron + Building A NE/SW dock aprons.
- **yardMetrics:** ~60 dock doors site-wide (est.), ~55 trailers visible, ~120 trailer
  parking capacity, 1 truck gate, 2 buildings, ~96 acres, not rail-served.

### Final confidence

**High.** Facility positively identified via an exact square-footage match and confirmed
on current satellite and Street View imagery. `dockDoors`, `dockDoorCount`, and
`trailerParkingCapacity` are honest overhead estimates and listed in `uncertainFields`.
