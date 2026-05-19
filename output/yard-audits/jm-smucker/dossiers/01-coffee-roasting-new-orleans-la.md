# Deep-Audit Dossier — Coffee Roasting, New Orleans LA (idx 01)

**Account:** J.M. Smucker
**Facility:** Coffee Roasting plant (Folgers / Café Bustelo / Dunkin' bulk coffee)
**Type:** Manufacturing — Coffee roasting/packaging (bulk)
**Address:** 14601 Old Gentilly Rd, New Orleans, LA 70129
**Resolved coordinates:** 30.0335, -89.9112

## Location confirmation

The roster pin (30.034172, -89.911159, ROOFTOP) landed on the north edge of a
large industrial complex. Satellite probes (z16–z19) revealed a massive
single-roof industrial building with attached processing equipment, silos and a
rail spur along the north edge — consistent with a bulk coffee roasting plant,
not an office. Street View (captured Nov 2025) from the south frontage road
confirmed the Folgers/Smucker coffee roasting building, with its tall processing
tower and a continuous chain-link perimeter fence backed by a hedge.

Web research confirms this is the Old Gentilly Rd plant — opened 1960, acquired
by J.M. Smucker with Folgers in 2008, described as the largest bulk coffee
facility of its kind in the world; it shares the New Orleans operation (>700
employees, 300+ products) with the separate Coffee Silo Operations site.

Locked center moved slightly south of the roster pin to the centroid of the main
building cluster.

## Key views

- **Wide satellite (z16–17):** Large industrial complex bounded by Old Gentilly
  Rd / a frontage road to the south, a rail line to the north, employee parking
  to the SW, and large vehicle-storage lots to the SE (a separate auto-storage
  property, not part of the plant).
- **Main building (z18):** One very large roofed manufacturing/packaging
  building with processing/silo structures to the NE — a multi-building campus.
- **South frontage Street View (heading 320°):** Roasting building with
  processing tower; full perimeter fence + hedge along the road.
- **Gate Street View (heading 290°–310°, ~30.0316,-89.9135):** Wide gated
  driveway through the fence with an overhead gantry sign structure and
  sliding/swing gate panels set back from the road.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Wide controlled truck entrance on the SW frontage road.
  Street View shows a fence opening with gate panels and an overhead gantry
  spanning the truck driveway — a clear checkpoint pinch point. The driveway is
  long and deep (3+ truck queue capacity, `drivewayLong`).
- **Guard shack — FALSE (uncertain).** No clearly staffed booth resolved at the
  gate in Street View or satellite imagery. A small structure sits near the gate
  apron but its function could not be confirmed. Treated as remote check-in.
- **Remote check-in — TRUE.** Gate present, no confirmed guard booth → implies
  kiosk / call-box / app check-in. Flagged uncertain.
- **Docks — "25-50" band (~30 doors est.).** Dock aprons with trailers backed in
  on the south building face (~30.0328,-89.9116) and a separate dock band on the
  SE face (~30.0331,-89.9109). Counts partially obscured by shadow and tree
  cover; flagged low confidence.
- **Ship/Rcv separate — TRUE.** Dock activity is split across more than one
  building face; green-coffee receiving and finished-goods shipping run as
  physically distinct operations.

## Yard zones and counts

- **Perimeter:** ~534 m N-S × ~559 m E-W → ~73.8 acres for the full fenced
  manufacturing complex (building cluster + rail-served processing yard + dock
  aprons). Historical 1960 footprint was ~20 acres; expanded since.
- **Truck gate zone:** SW frontage road entrance.
- **Drop yard:** trailer parking adjacent to the south dock apron (~11 trailers
  visible; capacity ~30).
- **Dock aprons:** two boxed — south face and SE face.
- **Rail-served:** TRUE — rail spur along the north property edge; finished
  coffee historically shipped by rail, truck and water.
- **Buildings:** ~3 distinct clusters (main building + processing/silo block +
  ancillary structures).

## Web findings

- Old Gentilly Rd plant opened 1960; J.M. Smucker acquired Folgers 2008.
- New Orleans operation: >700 employees across two sites, 300+ products
  (Folgers, Dunkin', Café Bustelo, Café Pilon).
- Green coffee trucked directly from docked ships; finished product shipped by
  rail, truck and water.

## Final confidence

**High** overall — facility positively identified, gate and layout clear.
Uncertain fields: `guardShack` / `remoteGs` (no confirmed booth), `scale`,
`dockDoorCount` (count obscured).

**3-line summary**
- Gate: TRUE — wide gated truck entrance with overhead gantry on SW frontage road.
- Guard shack: FALSE / uncertain — no confirmed booth; treated as remote check-in.
- Confidence: high.
