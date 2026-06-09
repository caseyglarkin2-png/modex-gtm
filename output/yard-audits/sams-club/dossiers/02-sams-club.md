# Deep-Audit Dossier — Sam's Club Distribution Center, Searcy AR (idx 02)

**Type:** Distribution Center
**Resolved center:** 35.24130, -91.70080
**Address:** 3301 E Park Ave, Searcy, AR 72143
**Confidence:** medium
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Location resolution

The roster coordinates (35.243754, -91.736442, geocode precision **APPROXIMATE**)
were flagged as weak and proved wrong: a z16 satellite crop at that point landed
in **downtown Searcy**, ~3.5 km too far west — a grid of small-town commercial
blocks, no DC.

Web search resolved the true DC address (3301 E Park Ave) to **35.2419,
-91.6976** (warehouserating.com / opengovny place listing). A z16 crop there
immediately showed a textbook distribution center: a single very large
white-roof building, fenced gravel drop yards full of trailers to the west, a
long dock apron with trailers backed in along the south wall, two retention
ponds on the south, employee parking on the east, and a rail spur along the
north edge beside US-67/167. Locked the working center at 35.24130, -91.70080.

Corroborating web detail: Searcy Chamber + Yelp/Manta list it as a Sam's Club
DC; a freight directory notes "warehouse with a gate, entrance security, strict
appointment requirements, no overnight parking."

---

## Site layout (what each view showed)

- **Building** (z18 whole-building): one large rectangular DC, long axis ~E-W
  with a slight (~3-4°) clockwise rotation (NE corner sits a touch south of NW).
  Solid roof; the building is ~600 m long.
- **Dock face** (z18/z19 dock center): the **south wall** is one continuous dock
  line — a regular rhythm of doors with trailers backed in across the full
  length. No docks on the north (solid wall) or visible on north/east.
- **Drop yards:** (1) a large **gravel NW drop yard** with long rows of parked
  trailers (z18-nwjunction, z19-nwgate2); (2) an **angled-stall paved drop yard**
  south of the dock apron, heavily occupied with mixed-color trailers
  (z19-secorner, z20-segate).
- **Retention ponds:** two ponds bound the south side (z17-center2).
- **Employee parking:** NE corner, full car lot accessed off the north road
  (z18-east, z19-necorner).
- **Rail:** a double-track **rail spur runs along the north edge, inside the
  fence, directly beside the building** (Street View facing south clearly shows
  the tracks and chain-link fence). A **J.B. Hunt Intermodal** container was
  parked in the yard — corroborates intermodal/rail-served operations.
- **In-yard structure:** a small dark-roof building among the south trailers
  reads as a yard/dispatch office, not a gate booth.

---

## Gate / guard-shack / dock determinations

- **truckGate = true (medium confidence).** The perimeter is **fully chain-link
  fenced** (confirmed in two Street View frames). The single controlled access is
  a gravel/paved **crossing over the rail spur** from the north access road into
  the drop/truck yard (~35.2426, -91.7020) — a clear pinch-point. No barrier arm
  is resolvable from overhead, but the full fence + single crossing + the freight
  directory's "gate, entrance security, appointment-only" note support a
  controlled gate.
- **guardShack = false.** No small staffed multi-window booth is visible at the
  crossing in z20/z21 satellite or in Street View. The only small object near the
  crossing reads as a rail/utility cabinet.
- **remoteGs = true.** Gate present, no guard shack → inferred kiosk /
  appointment / app driver check-in (standard for Sam's Club / Walmart DCs).
- **dockDoors = "50+".** Continuous ~600 m south dock face; estimate ~120 doors
  (low precision from overhead).
- **dropArea = "50+".** Two large, heavily-occupied drop areas.

Street View has **no coverage on the private interior/entrance drive** — the only
nearby panos sit on the north public access road (captured 2025-04). The most
useful frame (pano `h1lVYMvnaD0FAfXlbuO5jQ`, heading ~192°) looks from that road
south across the rail into the fenced yard.

---

## Yard zones & counts measured

- **perimeter** — 8-vertex oriented polygon tracing the fenced property
  (rail/north road on the north, employee lot on the east, pond/highway buffer on
  the south, drop-yard fence on the west). ~664 m × ~395 m envelope → **~58 acres**.
- **truckGate** — quad over the north rail-crossing entrance, aligned to the
  N-S access drive.
- **dropYards** — (1) NW gravel trailer rows; (2) south angled-stall drop yard;
  both rings oriented to the trailer rows.
- **dockApron** — long thin quad hugging the south dock wall at the building's
  ~3-4° angle.
- **staging** — central paved maneuvering/queue strip between dock apron and the
  south drop stalls (post-gate staging).
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~240, capacity ~320,
  truckGateCount 1, buildingCount 2 (DC + in-yard office), siteAreaAcres ~58,
  railServed **true**.

Street View metadata: perimeter pano `tptvfohUgfw72ZkD88gqOg` (heading 194°),
truckGate pano `h1lVYMvnaD0FAfXlbuO5jQ` (heading 192°), both status OK,
captured 2025-04.

---

## Web findings

- Searcy Regional Chamber + Yelp/Manta/Birdeye: confirmed Sam's Club
  Distribution Center, 3301 E Park Ave, Searcy AR 72143; phone 501-268-3244.
- Freight directory: gate + entrance security + strict appointment requirements,
  no overnight parking — supports controlled, appointment-based truck entry.
- J.B. Hunt Intermodal equipment on site (Street View) supports rail/intermodal
  flow alongside the on-property spur.

---

## Confidence

**Medium.** Location, building footprint, dock face, drop yards, ponds, rail and
the fenced perimeter are all visually unambiguous. The gate/guard-shack calls are
the soft spot: the entrance is a fenced rail-crossing pinch-point with no
visible barrier arm or staffed booth from overhead, and Street View cannot reach
the interior drive — so truckGate/guardShack/remoteGs and the lane counts are
flagged in `uncertainFields`.
