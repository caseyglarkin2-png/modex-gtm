# Deep-Audit Dossier — Amazon FTW1 Fulfillment Center, Dallas TX

**Site index:** 06 (Amazon roster)
**Type:** Fulfillment Center
**Resolved center:** 32.66185, -96.7363
**Address:** 33333 LBJ Freeway, Dallas, TX 75241
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

---

## Step 0 — Facility confirmation

The supplied approximate coordinates (32.661003, -96.736098) landed directly on
a large industrial building. Web search confirmed Amazon Fulfillment Center FTW1
at 33333 LBJ Freeway, Dallas TX 75241 (~500,000 sq ft, on the Lyndon B. Johnson
Freeway / I-635 / US-175 corridor in southern Dallas). Satellite at z16-z18
(06-step0-z16, 06-full-z17, 06-overview-z18) showed a single large rectangular
distribution building with multi-face dock walls, a trailer drop yard on the
north, a retention pond on the SW, and employee parking on the south/east —
fully consistent with an Amazon FC.

Street View along the access boulevard and north road positively identified the
site: the building behind a black palisade security fence with blue/yellow
Amazon trailers in the yard (06-sv-nwentry, 06-sv-gate-sw). A neighboring
building to the SE was confirmed by signage to be **American Textile Co**
(06-sv-boulevard2) — a separate company on its own perimeter loop, so it is
excluded from the Amazon parcel. Center locked at 32.66185, -96.7363.

---

## Key views

- **06-full-z17 / 06-perimeter-z17** — whole parcel. Building sits slightly
  rotated off cardinal (long axis ~NW-SE). Docks on N, W and SE faces; drop yard
  N; pond SW; employee lots S and E.
- **06-northdocks-z19** — north face: a long dock wall with ~100+ trailers
  backed in, plus an outer trailer drop row, plus the public road and two
  separate driveways (in/out) across the top.
- **06-westdocks-z19** — west dock wall against the retention pond, more trailers
  backed in and a drop row to the north.
- **06-southdocks-z19** — SE dock wall with trailers backed in; large employee
  parking lot beyond, bounded by the LBJ frontage road.
- **06-nwcorner-entry-z20 / 06-wcorner-z20 / 06-boothtight-z21** — the NW/SW
  entry: a controlled driveway off the north road, channelizing barrels, a small
  guard booth, and a staged tractor-trailer at the checkpoint.

---

## Gate / guard-shack / dock determinations

**Truck gate — TRUE.** The entire trailer yard is enclosed by a continuous black
palisade security fence (06-sv-nwentry, 06-sv-gate-s, 06-sv-gate-sw). The main
truck entrance is a controlled driveway off the north public road at the NW
corner, with orange traffic barrels/cones funneling trucks through a single
checkpoint lane group (06-sv-mainentry, 06-sv-mainentry2). A second curb cut
further east on the north road serves as the separate exit, so entry/exit are
physically separate (entryExitSeparate = true).

**Guard shack — TRUE.** A small tan booth (≈1-2 parking-space footprint) sits
beside the entry lane at the gate, clearly visible in Street View
(06-sv-mainentry2) and in satellite at the SW pinch of the entry driveway
(06-wcorner-z20, 06-boothtight-z21), accompanied by channelizing barrels and a
staged tractor-trailer. Because a staffed booth is present, remoteGs = false.

**Docks — 50+.** Loading docks run along the north, west and SE building faces
with a regular dock-door rhythm and well over 100 trailers backed in across the
faces. dockDoorCount estimated ~130 (band 50+ firm). shipRcvSeparate = true:
distinct dock banks on physically different faces.

**Drop yard — TRUE / dropArea 50+.** Dedicated trailer drop rows north of the
north dock wall and along the west yard, with dozens of parked trailers separate
from active dock staging.

---

## Yard zones traced (oriented polygons)

- **perimeter** — 8-vertex ring around the Amazon parcel (building + fenced yard
  + drop rows + south employee parking), traced to the lot's true angle.
- **truckGate** — quad over the NW controlled entry driveway / guard-booth apron.
- **dropYards** (array, 2) — north drop row (aligned to the north dock wall
  angle) and west drop row (aligned to the west wall).
- **dockAprons** (array, 3) — long thin quads hugging the north, west and SE
  dock walls at the building's orientation.
- **staging** — pre/post-gate holding apron between the gate and the drop rows
  along the north.

### streetViewMeta
- **perimeter** — pano `b2htTSym2Jjb268EC7fjNQ` (north road, 2024-08),
  heading 177° toward the building.
- **truckGate** — pano `TZ9CQadRcX6Z838b4kfBZw` (NW entry, 2024-08),
  heading 172° toward the gate apron — the driver's-eye arrival frame.

### yardMetrics
- dockDoorCount: ~130 (band 50+ firm; exact count uncertain)
- trailersVisible: ~140
- trailerParkingCapacity: ~220
- truckGateCount: 1
- buildingCount: 1 (American Textile Co excluded as separate parcel)
- siteAreaAcres: 36.8 (from traced perimeter)
- railServed: false

---

## Web findings

Amazon Fulfillment Center FTW1, 33333 LBJ Freeway, Dallas TX 75241-7203;
~500,000 sq ft; brought ~1,500 jobs to southern Dallas; warehousing /
distribution / order fulfillment for Amazon and third-party sellers; positioned
on LBJ Freeway with fast links into the Dallas interstate network
(I-20 / I-35E / I-45 / I-635 corridors).

Sources: TruckMap FTW1 listing, FLEX Fulfillment FTW1, Dallas City News Hub
(Amazon FC 1,500 jobs), Amazon hiring page (33333 LBJ).

---

## Final confidence: HIGH

Facility unambiguous, imagery clear (recent 2026 + 2024 Street View),
gate and guard shack both directly visible. Uncertain fields: entryLanes /
exitLanes (estimated ~2/2, barrels obscure exact count), dockDoorCount (overhead
estimate; band firm), multiStep (no evidence of a second checkpoint — left
false).
