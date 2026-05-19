# Deep-Audit Dossier — idx 24

## GP Madison Plywood Plant — Madison, GA

**Type:** Plywood Plant
**Resolved coordinates:** 33.61650, -83.42200 (plant building centroid)
**Confidence:** High

### Location resolution
The roster's geocoded point (33.577493, -83.476782, RANGE_INTERPOLATED of
"1310 Eatonton Rd") landed in downtown Madison — ~5 km SW of the real plant,
wrong. Web research established the plant address as **1400 Woodkraft Rd**
(off Hwy 278 NE of Madison). Coordinates were cross-checked against ejmap.org
and the Forest Products Locator (both ~33.611,-83.431, adjacent to the
plant). Satellite probing located the large plywood plant with its log yard
at ~33.6165,-83.4220, where the building centroid is locked.

### Key views
- **Wide z16/z17:** A single very large plant building, a big log yard
  (stacked logs) on the NE/E side, plywood-bundle storage and a rail
  load-out on the W/SW side, employee parking at the SW, all surrounded by
  woods and farmland — very rural.
- **Entrance (Street View 2013-04):** The Woodkraft Rd entrance has a clear
  red-and-white barrier arm across the truck lane and a small staffed guard
  booth beside it, with "Welcome to Georgia-Pacific Madison / All visitors
  report to security" and safety signage.
- **Rail (z18/z19):** An active rail siding runs along the NW side of the
  plant with railcars (gondolas/boxcars) present.
- **Log yard (z18):** Extensive log stacks on the NE/E side — receiving.
- **Shipping (z19):** Plywood bundles stacked on the W/SW side, flatbeds
  loaded by forklift — shipping; physically separate from receiving.

### Gate / guard-shack / dock determinations
- **truckGate: true** — Barrier arm + controlled checkpoint confirmed in
  Street View at the Woodkraft Rd entrance.
- **guardShack: true** — A small staffed booth (multi-side windows, ~1-vehicle
  footprint) beside the entrance lane, confirmed in Street View.
- **remoteGs: false** — A staffed guard booth is present.
- **dockDoors: 0-10** — Plywood plants load panels by forklift from open
  shipping bays rather than truck-height dock doors; banded 0-10, low
  confidence.
- **dropArea: NONE** — Yards hold logs and plywood bundles, not parked
  trailers.
- **scale: false (uncertain)** — A truck scale is operationally expected for
  a log-receiving plant but a distinct scale pad could not be confirmed in
  imagery; flagged uncertain.

### Yard zones & counts
- **Perimeter:** ~239 acres (835 m x 1159 m) enclosing the plant, log yard,
  plywood storage/rail load-out, and parking.
- **Truck gate zone:** the guarded barrier-arm entrance off Woodkraft Rd.
- **Staging:** the wide paved truck approach inside the gate.
- **Drop yard zone:** the NE log yard and W plywood-bundle storage.
- **Metrics:** ~6 shipping bays, 12 trailers visible, ~40 trailer capacity,
  1 truck entrance, ~4 buildings, rail-served.

### Web findings
GP Madison Plywood — a plywood manufacturing facility; GP announced ~$65M in
recent/planned investments at the Madison operation. Building Products
division. Located on Woodkraft Rd, Madison GA.

### Final confidence
**High** — facility positively identified, gate and guard-shack calls
definitively confirmed in Street View, rail service confirmed. Dock-door
count, trailer capacity, and the scale call are flagged uncertain as honest
estimates.

### 3-line summary
- Gate verdict: YES truck gate — barrier arm + controlled checkpoint at the
  Woodkraft Rd entrance.
- Guard-shack verdict: YES — small staffed guard booth beside the entrance
  lane.
- Confidence: High.
