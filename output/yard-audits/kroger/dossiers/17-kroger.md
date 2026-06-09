# Deep-Audit Dossier — Kroger Customer Fulfillment Center, Romulus MI (idx 17)

**Facility:** Kroger Customer Fulfillment Center (Ocado-automated)
**Address:** 15675 Wahrman Rd, Romulus, MI 48174
**Resolved center:** 42.18820, -83.38120
**Method:** deep-audit (Google satellite + Street View probe.ts, web research)
**Confidence:** high

---

## Step 0 — Facility confirmation (and a correction)

The supplied coordinates (42.188051, -83.381811) land between two large
industrial buildings on the Wahrman Rd corridor. Web research disambiguated
them:

- **15675 Wahrman = the Kroger/Ocado CFC** — reported at **135,000 sq ft**,
  Kroger's "smallest and faster" Ocado spoke facility, ~$95M, ~250 jobs,
  housing the automated "Hive" of 1,000+ bots (PR Newswire / Kroger IR /
  Supermarket News / Progressive Grocer, Sept 2020).
- **~16005 Wahrman = a separate, much larger Kroger fresh distribution
  building** (formerly Penske, later KLS Logistics) immediately to the east.

The huge white building with dock doors and trailer rows wrapping every face
is the **DC, not the CFC** — far too big to be 135k sq ft. The CFC is the
**compact west building** with a tall automated-hive roofline (long shadows
confirm height), a large 250-stall employee lot on its north/west, and a
small dock bank on its south face. I locked the audit to that building. The
"KLS" sign at the shared park entrance corroborates that the east building is
the separately-operated DC.

## Steps 1-3 — What the imagery showed

- **Wide / overview (z16-z18):** Compact rectangular CFC, long axis roughly
  E-W with a slight (~5-10°) rotation. North side = employee parking + a small
  annex building + a stormwater pond. South side = dock face and an open paved
  truck yard. East side = van/employee parking stalls and a grass buffer
  before the DC's private road.
- **Truck entrance:** The truck driveway leaves Wahrman Rd as a **wide,
  multi-lane open apron** (no barrier or booth at the public road — it is a
  shared park entrance). Trucks run east along the south perimeter road into
  the CFC yard.
- **Internal truck gate / guard shack (key find):** At the mouth of the south
  dock yard sits a **small white guard booth inside a fenced island**
  (~42.18758, -83.38137), ~1-2 vehicle footprint, with a vehicle parked
  beside it. A fence line and the booth pinch the truck path between the south
  drop/staging lot and the dock apron — a clear staffed checkpoint
  (z20/z21 confirm the booth + fence + light poles flanking the lane).
- **Docks (z20):** South face shows roughly **8-10 dock positions**, several
  with trailers backed in. Single dock bank (no separate ship/receive faces).
- **Drop / staging:** Trailers parked without tractors along the south
  perimeter strip (~16 visible, ~24 capacity) = a real drop yard; a deep paved
  apron between the gate and the docks serves as post-gate staging, and the
  south lot before the booth as pre-gate staging.
- **Rail:** none — no spur enters the property.

## Street View

Public Street View covers only **Wahrman Rd** (the internal park roads are
private), captured 2024-08. Walking the road north located the **entrance
driveway** (wide paved apron, directory + "KLS" signage). The internal guard
booth is not reachable from public panos, but is unambiguous in satellite.

- `truckGate` pano `2onzkvUC-Pcp9yu11M9cGQ` @ 42.18703,-83.38405, heading 75°
  → looks from the Wahrman entrance toward the gate/booth (driver's arrival frame).
- `perimeter` pano `sgX8pqz1jq_xVFW3GlG3ag` @ 42.18725,-83.38406, heading 51°
  → looks from Wahrman toward the property/CFC.

## Yard zones & counts

- **perimeter** — 7-vertex oriented ring around the whole CFC parcel inside
  the fence (parking + pond + building + south yard). **~14.6 acres** (shoelace
  from the ring).
- **truckGate** — quad around the fenced guard-booth island.
- **dockAprons** — one long thin quad hugging the south dock wall at the
  building's angle.
- **dropYards** — one ring over the south-perimeter trailer-parking strip.
- **staging** — pre-gate paved holding area between the south lot and the booth.
- **yardMetrics:** dockDoorCount 10, trailersVisible 16, trailerParkingCapacity
  24, truckGateCount 1, buildingCount 2 (CFC + annex), siteAreaAcres 14.6,
  railServed false.

## Classification determinations

- **truckGate: true** — staffed internal checkpoint at the dock-yard mouth.
- **guardShack: true** — small fenced booth with attendant vehicle. **remoteGs: false.**
- **preGateStaging / postGateStaging: true** — paved waiting both before and
  after the booth.
- **drivewayLong: true** — long approach from Wahrman + deep yard hold 3+ trucks.
- **backupSensitive: false** — huge open yard, no public-road spillover risk.
- **entryExitTogether: true**, entryLanes/exitLanes ~1/1 (inferred, flagged).
- **fastLaneOpportunity: true** — very wide entrance apron + open yard.
- **dockDoors: "0-10"**; **dropArea: "10-25"** (medium confidence).
- **shipRcvSeparate: false** — single dock bank.
- **urbanRural: "Rural"** — edge-of-town industrial near the airport, woods/open
  land around; per rubric chose Rural when borderline. **connectivityIssue: false**
  (near DTW / I-275, good coverage).
- **multipleFacilities: false** (CFC + small annex, one operation; DC excluded).
- **scale: false**, **dropYard: true**, **multiStep: false**.

## Web findings

PR Newswire / Kroger IR (Sept 2020): 135,000 sq ft Ocado-automated CFC,
~$95M, ~250 jobs, "Hive" of 1,000+ bots, serving Michigan / N. Ohio / Indiana.
Supermarket News & Progressive Grocer describe it as Kroger's "smaller and
faster" spoke format — consistent with the compact tall footprint observed.

## Final confidence

**High.** Facility identity is positively resolved (and corrected away from the
neighboring DC); the guard booth, gate pinch-point, dock bank, drop yard, and
perimeter are all clearly visible. Only lane counts and the exact drop-area
band are lower-confidence (flagged in `uncertainFields`).
