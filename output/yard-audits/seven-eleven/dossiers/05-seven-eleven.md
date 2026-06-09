# 7-Eleven Combined Distribution Center — North Las Vegas, NV (E.A. Sween)

**idx 5** · Combined Distribution Center · 6350 E. Centennial Parkway, North Las Vegas, NV 89115
**Resolved center:** 36.27817, -115.03283
**Method:** deep-audit (satellite z17-z21 + Street View 2026-02) · **Confidence:** high

---

## Step 0 — Location confirmation
The supplied city-level coordinates (36.278044, -115.032883) landed directly on the
building, so no relocation was needed. Web search confirmed 6350 E. Centennial Parkway
is the E.A. Sween-operated 7-Eleven Combined Distribution Center (CDC) in North Las
Vegas. E.A. Sween invented the CDC concept (1993) and runs 7-Eleven's CDC network.
The satellite imagery shows a single triangular/wedge industrial parcel: a warehouse
with the red 7-Eleven branding stripe, refrigeration equipment on the roof, an office
front at the south, employee parking, and trailer-drop rows filling the north yard —
fully consistent with a fresh-food combined distribution center. Street View (Feb 2026)
shows the 7-Eleven logo on the building, confirming identity.

## Site layout
A wedge-shaped fenced parcel, widest at the south (E. Centennial Pkwy frontage) and
tapering to a narrow point at the north against the I-15 frontage/on-ramp. One main
warehouse building runs roughly N-S down the west-center of the lot; the office is at
the south end. Vacant desert lies immediately east and across the highway to the
northwest. Adjacent industrial buildings sit to the east-southeast and south.
Perimeter polygon area ≈ **12.1 acres**.

## Truck gate — TRUE (Gate + Guard Shack)
The single truck entrance is at the **SE corner** off E. Centennial Parkway.
- **z21 satellite** shows a small structure with a barrier line crossing the drive.
- **Street View (pano Ff0KxKbS6oiJbkA0sBUNNw, Feb 2026)** is definitive: a **cantilever
  sliding gate** spans the entry drive, with a fully fenced perimeter on both sides.
- A **manned guard booth** — the small red-and-white 7-Eleven-branded structure with
  windows on multiple sides (≈1-vehicle footprint) — sits in the **median** between the
  inbound lane (left of booth) and outbound lane (right of booth).
- Layout: **entry and exit together** at one property point, split around the median
  booth. 1 inbound lane, 1 outbound lane.

`guardShack: true`, `remoteGs: false` (booth is staffed, not a kiosk).

## Staging & approach
- **Pre-gate staging:** the wide paved apron between the public road and the gate gives
  arriving trucks room to wait outside the gate → `preGateStaging: true`.
- **Post-gate staging / approach:** a deep paved holding area sits inside the gate
  before the dock aprons; the gate→dock approach easily holds 3+ trucks →
  `postGateStaging: true`, `drivewayLong: true`.
- **Fast-lane opportunity:** wide gate apron and a divided in/out drive give physical
  room to add an express/appointment bypass lane → `fastLaneOpportunity: true`.
- **backupSensitive:** false — large internal yard and ample frontage; a queue would
  not spill onto the public road.

## Docks
Two dock banks on different building faces:
- **West face** — a bank of doors along the curved orange apron loop with trailers
  backed in.
- **East face** — a second bank of doors with trailers backed in along the east apron.
Combined estimate ≈ **44 dock doors** → band **25-50** (`dockDoors`). The two separate
clusters on different faces imply split shipping/receiving → `shipRcvSeparate: true`
(inferred from layout, medium confidence).

## Drop yard & trailers
Diagonal trailer-drop rows fill the north yard and run along the east fence line,
separate from the active dock aprons → `dropYard: true`. **~38 trailers visible**
parked without tractors; estimated capacity **~55** → `dropArea` band **25-50**.

## Yard zones traced
- **perimeter** — 5-vertex wedge ring following the real fence line (N tip, NE, SE gate,
  SW, NW), oriented to the parcel, ≈12.1 acres.
- **truckGate** — quad over the SE entrance/booth drive.
- **dropYards** — two rings: the north trailer-row block and the east-fence trailer line.
- **dockAprons** — two rings: the west apron loop and the east dock apron, each parallel
  to its building face.
- **staging** — the post-gate holding area between gate and docks.

## Street View metadata
- **truckGate** — pano `Ff0KxKbS6oiJbkA0sBUNNw` (36.27661, -115.03216, captured 2026-02),
  heading **353°** toward the gate. hasCoverage true.
- **perimeter** — same entrance pano (the only Street View frame on the property
  frontage; interior centroids returned ZERO_RESULTS), heading **339°** toward the
  property centroid. hasCoverage true. This is the frame a driver sees on arrival.

## Setting
`urbanRural: Rural` — edge-of-town desert parcel on the North Las Vegas periphery beside
I-15, vacant desert east and across the highway. Per rubric, edge-of-town industrial =
Rural. `connectivityIssue: false` — still within the Las Vegas metro beside a major
interstate with adjacent industrial development; coverage expected adequate.

## Web findings
- E.A. Sween Company "About" + locations pages confirm operation of 7-Eleven CDCs and
  the CDC concept (invented 1993).
- 6350 E. Centennial Parkway, North Las Vegas, NV 89115 confirmed as the E.A. Sween CDS/CDC.

## Final calls
- **Gate:** TRUE — fenced perimeter with a cantilever sliding gate at the SE entrance.
- **Guard shack:** TRUE — staffed red/white 7-Eleven booth in the entry median.
- **Confidence:** high.

Low-confidence / estimated: exact dock-door count, trailer-parking capacity, and the
ship/receive-separate inference (listed in `uncertainFields`).
