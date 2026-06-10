# Deep-Audit Dossier — NFI Distribution Center Perris CA (Indian Ave)

- **Roster idx:** 7
- **Account:** NFI Industries
- **Facility type:** Distribution Center
- **Address:** 3700 Indian Ave, Perris, CA 92571
- **Resolved center:** 33.838887, -117.2294
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View + web)

## Location confirmation (Step 0)

The supplied coordinates landed directly on a single, very large gray-roofed
distribution building, which web research positively identifies as the
**HanesBrands West Coast Distribution Center**, operated by NFI (the 3PL).
Corroborating sources: a LoopNet listing ("3700 Indian Ave — Hanesbrands
Distribution Center"), the NFI Industries grand-opening press release, and the
City of Perris news archive. The NFI release gives hard dimensions: the
building is **over 2,152 ft long, 654 ft wide, with a ~1-mile interior
perimeter (~1.3M sq ft)**, opened January 2009, built to LEED standard. Yelp /
directory listings also label it "NFI-Hanes, 3700 Indian Ave."

The building sits between **Indian Ave** (north-south, the east property line)
and **Morgan St** (east-west, the south property line) in the Perris industrial
park.

### Duplicate check vs idx 6 (657 Nance St)

**Not a duplicate.** Idx 6 (657 Nance St, 33.854552, -117.240935) is a separate
building cluster roughly 1.8 km north, near a roundabout, with its own footprint
and yards. Satellite confirms two distinct campuses. Both are legitimate
separate roster entries — keep both.

## Key views

- **z16/z17 overview:** Single dominant DC, dock faces on the north and south
  long walls, employee parking on the west and east ends, open scrubland to the
  south/east — edge-of-development setting.
- **North face (NW + NE overviews):** Long continuous dock row with trailers
  backed in, fronted by a **deep multi-row trailer drop yard** (rows of parked
  trailers, no tractors).
- **South face:** A second, separate dock row with trailers, fronting a paved
  apron, then a landscaped strip and Morgan St.
- **West / east edges (z19):** West wall ~ -117.2334 (employee parking beyond);
  east wall ~ -117.2270 with Indian Ave at ~ -117.2266 as the east property
  line.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** The single truck driveway is on the **south side off
  Morgan St** (≈ 33.8374, -117.2310). Dec-2025 Street View shows a **black
  sliding/swing metal gate** spanning the full lane throat, with perimeter
  fencing continuing along the property line. Wide paved apron in front.
- **Guard shack — FALSE.** No staffed booth exists beside the lane in any
  Street View heading (N, NNW, NNE). The only structures at the entrance are the
  building wall and the fence.
- **Remote check-in (remoteGs) — TRUE.** A **bank of self-service check-in
  kiosks / pedestals** is mounted just inside the gate, clearly visible in the
  N/NNW/NNE frames — driver self-check-in / app-kiosk model rather than a guard.
- **Docks — "50+".** Near-continuous dock rows run along both the 2,152-ft north
  and south walls; ~200 doors estimated (band is firm even if the exact count is
  approximate).
- **Ship/receive separate — TRUE.** Two physically distinct dock banks on
  opposite building faces.
- **Fast-lane opportunity — TRUE.** The single gate apron is very wide with
  ample unused paved width to stripe an express/bypass lane.

## Yard zones and counts

- **perimeter:** whole fenced property — Indian Ave (E), Morgan St (S), employee
  parking (W), north drop-yard edge (N). **≈ 59.6 acres** (shoelace from ring).
- **truckGate:** the south driveway throat off Morgan St (sliding gate + kiosks).
- **dropYards (array, 1):** deep north trailer-storage yard along the north wall.
- **dockAprons (array, 2):** the strip in front of the north dock doors and the
  strip in front of the south dock doors.
- **staging:** the broad paved interior yard between the north and south dock
  aprons (post-gate holding/circulation).

### yardMetrics (overhead estimates)

| Metric | Value |
|---|---|
| dockDoorCount | ~200 (band 50+) |
| trailersVisible | ~250 |
| trailerParkingCapacity | ~350 |
| truckGateCount | 1 |
| buildingCount | 1 |
| siteAreaAcres | 59.6 |
| railServed | false (no spur) |

Low-confidence counts (dockDoorCount, trailersVisible,
trailerParkingCapacity, entry/exit lanes) are flagged in `uncertainFields`.

## Web findings

- HanesBrands West Coast DC, ~1.3M sq ft, opened Jan 2009, LEED-built by Ridge
  Construction; **NFI is the operating 3PL.** (NFI press release, LoopNet,
  City of Perris archive, Hanesbrands IR release.)
- Comparable nearby NFI Perris facility (657 Nance St, idx 6) is reported at
  112 docks / 224 trailer spots — used to sanity-check this larger site's
  capacity estimate upward.

## Final confidence

**high.** The building is unambiguously identified, the south gate / kiosk /
no-booth determination is from clear recent (Dec 2025) Street View, and the
overall layout (dual dock faces, north drop yard, single gated south entrance)
is consistent across all imagery. Only the exact door/trailer counts are
approximate, as expected from overhead imagery.

### Street View
- truckGate pano `Rnef4CsRjQalQndj73Zxfg`, heading 350° (toward the gate).
- perimeter pano `iXuuomuvtIyvU46FHs2BoQ`, heading 359° (north into the yard).
