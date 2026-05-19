# Deep-Audit Dossier — Rochelle Foods, Rochelle IL (idx 12)

**Account:** Hormel Foods
**Facility type:** Meat Processing Plant (pork — bacon, deli hams, Hormel Compleats)
**Resolved coordinates:** 41.92050, -89.06980
**Confidence:** Medium

## Location confirmation
The roster geocoded "200 Caron Rd, Rochelle IL" to 41.935628, -89.054638. A z17
probe there showed a large white building with a big *car* parking lot but **no
loading docks, no trailer yard, and no refrigeration plant** — inconsistent with
an 800-employee meat plant. Hormel's own "Our Locations" page lists the plant at
**1001 S Main St, Rochelle IL** and describes a 400,000 sq ft facility "just
outside a two-block downtown."

Tracing S Main St through downtown Rochelle led to an old rail-served industrial
parcel at the Main St rail crossing (~41.9205, -89.0698). Street View there
confirmed a tall industrial smokestack, an elevated water tower, ammonia /
refrigeration tank batteries, rail tank cars, and overhead conveyor/pipe bridges
linking buildings — the unmistakable signature of an older urban meat-packing
plant. Locked center at 41.92050, -89.06980. The roster's Caron Rd coordinate is
treated as a geocoding error.

## Key views
- **Street View (rail crossing, 2022):** Smokestack, water tower, processing
  tanks, rail tankers on a spur — confirms an active meat/processing plant.
- **Satellite z18-z19:** Compact cluster of dark processing buildings, silos and
  tanks tightly packed between two rail lines; modest building footprints.
- **Street View (east side):** Unpaved gravel access lot with an elevated
  conveyor bridge crossing overhead; no gate, booth, or barrier.
- **Surroundings:** Residential blocks on all sides; the plant is wedged between
  the two rail lines.

## Gate / guard-shack determination
- **truckGate: false.** No barrier arm, sliding/swing gate, or checkpoint
  pinch-point at any access. Truck access is over the public rail-crossing road
  and an open/gravel lot on the east side. Confirmed by 2022 Street View.
- **guardShack: false.** No staffed booth structure anywhere on the perimeter.
- **remoteGs: false** (no gate exists).

## Yard zones and counts
- **Perimeter:** ~19 acres — compact old plant bounded by two rail lines and
  residential streets. Captured in `perimeter`.
- **Dock apron:** one small dock area boxed; no large dock-door bank visible.
- **No drop yard / no trailer staging** — this old plant has minimal truck-yard
  infrastructure.
- **dockDoorCount ~8 (0-10), trailersVisible ~2, capacity ~8** — low-confidence
  honest estimates; the dense multi-building layout with conveyor bridges
  obscures door counts.
- **railServed: true** — rail spur and tank cars confirmed.
- **backupSensitive: true** — tightly hemmed by active rail and residential
  streets; almost no stacking room for a truck queue.

## Web findings
Rochelle Foods, LLC (Hormel division), 1001 S Main St, Rochelle IL — a
~400,000 sq ft plant with 800+ employees producing precooked/retail bacon, deli
hams and Hormel Compleats microwaveable meals. Notable COVID-19 outbreaks and
closures in 2020-2021. A $6M expansion was previously reported. The large
footage is consistent with a dense, partly multi-story old urban plant.

## Final assessment
Old, compact, rail-served urban meat-processing plant. No truck gate, no guard
shack, minimal/informal truck yard, tight backup geometry. Confidence is
**Medium** — the plant building was positively identified via Street View
markers, but the dense aged layout makes precise dock/trailer counts uncertain,
and the roster's supplied address/geocode was wrong.
