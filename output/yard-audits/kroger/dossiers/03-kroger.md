# Deep-Audit Dossier — Kroger Grocery Distribution Center, Shelbyville IN

- **Roster idx:** 3
- **Facility:** Kroger Grocery Distribution Center Shelbyville IN
- **Type:** Grocery Distribution Center
- **Address:** 4301 N County Rd 125 W, Shelbyville, IN 46176
- **Resolved center:** 39.5888, -85.8092
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation

The supplied approximate coordinates (39.591457, -85.806213) landed on a farm
field between the facility and the **Shelbyville Municipal Airport** runway
(visible to the east in every wide frame). Probing satellite to the southwest
immediately revealed a very large distribution building with extensive trailer
parking. Web search confirmed the address **4301 County Rd 125 W, Shelbyville,
IN 46176** — a Kroger refrigerated grocery DC (built 1998, ~600,000 sq ft,
cited as a ~100-acre campus, now operated by Penske Logistics). The Street View
monument sign at the entrance reads "Kroger," positively confirming the
building. Resolved operating center locked at **39.5888, -85.8092**.

Sources: truckmap.com place listing; shelbyville-indiana.uscompanies.net;
indianachamber.com (Kroger Central Division Shelbyville supply-chain facility);
gopenske.com (Penske wins Kroger Indiana DC business).

## Steps 1-3 — What the imagery showed

**Building / layout (z16-18):** One very large main DC building, long axis
running roughly E-W with a slight clockwise tilt (east end dips a few degrees
south). A separate **annex building** with its own dock doors, parking lot, and
trailer lot sits to the north; a small ancillary structure sits to the east.
This is a campus = `multipleFacilities: true`. Employee parking and the office
face are on the SE/E side. Farm fields surround the site on all sides; the
airport runway lies immediately east.

**Docks (z18-19, north face):** A long, continuous loading-dock bank runs the
full length of the main building's **north** wall with trailers backed in
across nearly its entire length, plus a second dock bank on the annex. Counted
well over 50 doors; estimated **~110** total → `dockDoors: "50+"`. The dock
apron is a long thin strip hugging the north wall at the building's angle —
traced as one rotated quad in `dockAprons`.

**Drop yard / trailer parking (z18-20, west + north):** The west end of the
property is a large paved lot packed with **dozens of drop trailers** parked in
organized rows with no tractors. The annex has its own trailer lot. Clearly
50+ → `dropArea: "50+"`, `dropYard: true`. Two drop-yard rings traced (west
lot + annex lot), each aligned to its trailer rows.

**Pre-gate staging:** A separate elongated oval staging/parking loop with a
small structure sits south of the yard (~39.5843, -85.8110), where arriving
trucks can wait off the main approach → `preGateStaging: true` (traced as
`staging`). The wide internal paved yard between the dock apron and the annex
serves as inside-property queueing → `postGateStaging: true`.

## Step 2 — Gate / guard-shack determination (Street View, Aug 2024)

The truck entrance is the drive off **County Road 125 W** at the southwest. The
public road effectively dead-ends at the property; Street View coverage runs up
to the property line (panos around 39.5840, -85.8128 / -85.8120).

- **Heading toward the entrance (NE/E):** the road runs **straight into the
  property** past a blue **Kroger monument sign** and flagpole on open lawn.
- **No barrier arm, no sliding/swing gate, no checkpoint pinch-point** is
  present where the property meets the public road.
- **No guard booth** — the only small structures near the truck path are the
  office/break facilities attached to the main building, not a gate booth.

Therefore: **`truckGate: false`** (open access), **`guardShack: false`**,
**`remoteGs: false`** (remoteGs requires a gate). This matches the classic
"open driveway to the docks" archetype seen at other Kroger/Kraft DCs.

Entry/exit share the single open approach → `entryExitTogether: true`,
`entryLanes: 1`, `exitLanes: 1`. The approach is a long, deep paved drive that
easily holds 3+ trucks → `drivewayLong: true`. The gate is far from any busy
road with plenty of stacking room → `backupSensitive: false`.

## Geofences & yard metrics

- **perimeter** — 8-vertex ring tracing the developed/paved footprint (main DC
  + west drop yard + annex + parking), excluding the surrounding farm fields.
  Polygon-derived area **~60.5 acres** (public sources cite ~100 acres of owned
  land including buffer).
- **truckGate** — small rotated quad over the open entrance drive off CR 125 W.
- **dropYards** — `[west drop lot, annex trailer lot]`.
- **dockAprons** — `[north-wall apron]`, long thin quad at the building's angle.
- **staging** — the southern oval staging loop.

Counts (honest overhead estimates from z18-20):
- dockDoorCount ≈ **110**, trailersVisible ≈ **140**,
  trailerParkingCapacity ≈ **220**, truckGateCount **1**,
  buildingCount **3**, siteAreaAcres **60.5**, railServed **false**.

**Street View metadata:**
- truckGate → pano `K5evSTQ4ZAhonQqEbiNukg` (39.58402, -85.81198), heading **0°**
  (looking north into the yard from the entrance) — the driver's-eye arrival frame.
- perimeter → pano `G3Gw9fpzJTeTVLO8QcASzA` (39.58866, -85.80649), heading
  **274°** (looking west toward the building from the east-side road).

## Web findings

- 4301 County Rd 125 W, Shelbyville IN 46176; ~600,000 sq ft refrigerated
  grocery DC, built 1998, expanded twice; cited ~100-acre campus.
- Distributes meat, cheese, produce at controlled temperatures across the
  Kroger network; operates 24h.
- Operated/managed by **Penske Logistics**.

## Uncertain fields

- `connectivityIssue` — rural farmland but adjacent to Shelbyville + a municipal
  airport, so cellular is likely fine; left false.
- `scale` — no clearly identifiable truck scale pad in the truck path; left false.
- `shipRcvSeparate` — docks read as one north-face cluster (annex looks like
  overflow, not a distinct ship/rcv split); left false, low confidence.

## Final confidence: HIGH
Building positively identified; clear modern satellite + Aug-2024 Street View at
the entrance gave an unambiguous open-gate / no-guard-shack read and a confident
campus / dock / drop-yard classification.
