# Deep-Audit Dossier — Publix Grocery Distribution Center, McLeansville NC (Greensboro)

- **Facility (idx 11):** Publix Grocery Distribution Center McLeansville NC (Greensboro)
- **Type:** Grocery Distribution Center (multi-building DC campus)
- **Stated address:** 5544 Burlington Rd, McLeansville, NC 27301
- **Resolved center:** 36.0814, -79.6612
- **Maps (satellite):** https://www.google.com/maps/@36.0814,-79.6612,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation
The supplied coordinates (36.083007, -79.664543) landed on the NW edge of a large
industrial campus. A zoom-15/16 sweep showed two very large distribution buildings
plus ancillary structures on a fenced parcel ringed by woods, fed by a single access
boulevard off Burlington Rd — consistent with the facility type and address. Web
research confirmed it: the Publix Greensboro-area distribution campus on the 5500
block of Burlington Rd (addresses 5544 / 5566), a ~$400M, ~1,000-job project. It was
built as an ~1M sq ft refrigerated warehouse and expanded with an ~1.2M sq ft dry
grocery warehouse (≈2.1–2.2M sq ft total), with a return center, fleet-maintenance
building, dispatch, and a **security post** on campus. Right building, locked center.

## Key views and what they showed
- **Wide (z15):** Two main cross-dock buildings (north refrigerated, south/larger dry
  grocery) running roughly E-W with a slight tilt, surrounded by trailer aprons; the
  whole parcel bermed and fenced; single road connection from Burlington Rd at the NW.
- **NW entrance (z17–18):** The access road comes off Burlington Rd, curves past a
  stormwater pond, and enters as a divided boulevard. An employee car lot sits west of
  the north building.
- **Entry throat (z19–21):** A small 1–2-vehicle-footprint structure with rooftop HVAC
  and a landscaped island sits at the junction of the entry boulevard, the employee lot,
  and the secure truck yard (~36.0826, -79.6643) — the checkpoint position.
- **Central courtyard (z18):** Cross-dock apron between the two buildings — north
  building docks face south, south building docks face north — full of backed-in
  trailers, plus a small yard-control structure mid-yard.
- **South face (z18):** South building also has a long dock row on its south face with
  trailers backed in along the perimeter drive.
- **East end (z17–18):** Fleet-maintenance building and return-center/dispatch building,
  plus large marked trailer-storage lots packed with dropped trailers.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View along the Burlington Rd frontage shows a continuous
  chain-link perimeter fence on a graded berm; the single divided access boulevard is
  fenced on both sides and is the only ingress. Street View coverage stops at the
  property line (panos snap back to Burlington Rd), confirming a private, controlled
  drive. The inner checkpoint structure sits where the boulevard meets the secure yard.
- **guardShack = true (flagged uncertain).** Publix/Gray/Procon project pages
  explicitly list a dedicated **security post** on the campus, and overhead imagery shows
  a small booth-scale structure with a landscaped island at the checkpoint throat. Window
  pattern isn't resolvable at this satellite resolution, hence the uncertainty flag, but
  documentation + the structure strongly support a staffed shack. remoteGs = false.
- **Docks = 50+.** Two ~1M+ sq ft cross-docks with long dock rows on multiple faces;
  estimated ~200+ doors campus-wide. shipRcvSeparate = true (distinct dock clusters /
  buildings: refrigerated vs dry grocery vs return center).
- **dropArea / dropYard = 50+ / true.** Dedicated marked trailer-storage lots on the east
  end and north drive, full of dropped trailers, separate from active dock staging.

## Yard zones and counts (overhead estimates)
- **Perimeter:** 5-vertex oriented ring tracing the fenced parcel ≈ **98.8 acres**.
- **truckGate:** quad along the inner entry drive at the checkpoint.
- **staging:** pre-/inner-gate apron on the entry boulevard (preGateStaging +
  postGateStaging both true — wide boulevard outside, large courtyard inside).
- **dropYards:** east trailer-storage lot + north-drive trailer rows.
- **dockAprons:** central courtyard apron + south building south-face apron, traced as thin
  rotated quads parallel to the dock walls.
- **yardMetrics:** dockDoorCount ~210, trailersVisible ~140, trailerParkingCapacity ~320,
  truckGateCount 1, buildingCount 5, siteAreaAcres 98.8, railServed false (no spur).
- **Street View:** perimeter pano `VQFdCteLBS0VAstfzxrZHw` (Burlington Rd frontage, 2026-01,
  heading 125°); truckGate pano `OwYE7-23FR9mJ9aXo5Rn3Q` (entry-drive throat, 2026-01,
  heading 119°).

## Other classification calls
- **urbanRural = Rural** — edge-of-town McLeansville surrounded by woods, farmland, and
  scattered homes, outside the dense Greensboro fabric. connectivityIssue = false
  (large modern campus on a major arterial, coverage fine).
- **multipleFacilities = true** — 5 buildings (refrigerated, dry grocery, fleet
  maintenance, return/dispatch, security post).
- **drivewayLong = true**, **fastLaneOpportunity = true** (wide divided boulevard with
  spare paved width), **entryExitTogether = true** (single entry point).
- **scale = false** (none seen; flagged uncertain — inner checkpoint partly obscured),
  **multiStep = false**.

## Web findings
- WFMY News 2 — Publix groundbreaking, ~$42K starting salaries, McLeansville DC.
- Gray / Procon project pages — campus scope: refrigerated warehouse, dry-goods
  warehouse, return center, fleet maintenance, dispatch, **security post**.
- Commercial Property Executive / corporate.publix.com — ~$400M investment, ~1,000 jobs,
  ~1M sq ft refrigerated + ~1.2M sq ft dry-grocery expansion, completion ~Q4 2022.

## Final confidence
**High.** Facility unambiguously identified and corroborated by multiple sources; layout,
perimeter, docks, and drop yards clearly read from imagery. guardShack, exact entry/exit
lane counts, and scale are the only lower-confidence calls (overhead resolution limits at
the inner checkpoint), flagged in `uncertainFields`.
