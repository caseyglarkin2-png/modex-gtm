# Deep-Audit Dossier — 7-Eleven Grocery DC, Fredericksburg VA (McLane Mid-Atlantic)

- **Idx:** 12
- **Facility:** 7-Eleven Grocery DC Fredericksburg VA (McLane Mid-Atlantic)
- **Type:** Grocery DC
- **Address:** 56 McLane Drive, Fredericksburg, VA 22406
- **Resolved center:** 38.3493, -77.4963
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** medium

---

## Step 0 — Facility confirmation

The supplied city-level coordinate (38.348274, -77.496559) landed on the right
industrial park but not the exact building — the surrounding park holds several
large warehouses. I positively identified the McLane Mid-Atlantic DC by:

1. **Web research** — McLane Mid-Atlantic is the McLane Company convenience/grocery
   distribution center at 56 McLane Dr., Fredericksburg, VA 22406 (540-374-2000).
   It opened in 1973 as Southland Distribution Center (Southland = the original
   7-Eleven parent), now serves 1,900+ c-stores across VA/MD/DE/WV/DC, and is the
   region's 4th-largest employer (50th anniversary Sept 2023).
2. **Satellite** — the large white-roofed warehouse just NE of the approximate
   point is the only building of DC scale with full dock banks and trailer yards.
3. **Street View ground truth (decisive)** — trailers backed into the docks
   clearly read **"McLane"** with the McLane red-triangle logo (NW dock-road
   frame). This nails the building identity.

Locked center for all measurements: **38.3493, -77.4963**.

---

## Layout overview

A large, older (1973) grocery/c-store DC campus in an industrial park off US-17
(Warrenton Rd) on the Stafford/Fredericksburg fringe. The main DC is a big
roughly-square warehouse **rotated ~30-35° clockwise** from north — its dock
faces run NE-SW and NW-SE, so a north-aligned box misses badly; all geofences
were traced as rotated polygons parallel to the structure.

- **Main DC building** — center of the parcel, flat white roof, ~25-acre
  contiguous fenced property.
- **NE / east face** — angled (sawtooth) dock bank with trailers backed in,
  facing the internal yard road.
- **South face** — long straight dock bank, the heaviest door concentration.
- **West / SW face** — trailer staging rows along the building, buffered from
  US-17 by woods.
- **SE corner** — secondary long buildings / cross-dock structures plus a
  maintenance/shop cluster and the central employee parking lot → a **campus**.
- **Eastern overflow trailer lot** — a large separate paved trailer yard east of
  the building, separated by a wooded buffer and connected by internal drive;
  holds many bobtail trailers in diagonal rows.

---

## Key views and what they showed

- **Wide z16 / z17 building-centered** — confirmed footprint, rotation, the
  multi-building campus, and the surrounding wooded buffer + US-17 to the west.
- **NW dock-road Street View (heading ~120-200°)** — McLane-branded trailers in
  the docks, **continuous chain-link perimeter fence** along the whole road
  frontage, open paved yard, yard equipment (a loader), a fenced
  equipment/container compound. No barrier arm, no booth.
- **East-side Street View (SE)** — wooded buffer separating the dock road from
  the eastern trailer lot; no gate structures.
- **NE-corner / front-yard z19-z21 + Street View (heading ~118°)** — open paved
  front yard with trailers and equipment behind the fence; the "small structure"
  first suspected as a guard shack resolved on max-zoom to dock canopies /
  parked-trailer tops, not a gatehouse.
- **SE-entry z18** — central employee parking lot ringed by the DC, drop-yard
  trailer rows, and the secondary SE buildings (campus circulation hub).

---

## Gate / guard-shack / dock determinations

- **truckGate → false (flagged uncertain).** The property is fully
  perimeter-fenced — chain-link is clearly visible wrapping the dock yard in
  multiple Street View frames. However, **no barrier arm, sliding/swing gate, or
  staffed checkpoint pinch-point** was observed at any drive mouth across full
  perimeter Street View coverage. Entry is via open driveways from the public
  loop road into the fenced yard, consistent with a 1973-era campus. Flagged
  because a few drive mouths sit behind the fence-line tree buffer and are
  partially obscured from the road.
- **guardShack → false.** No standalone booth (1-3 vehicle footprint, multi-side
  windows, set beside a gate lane) anywhere. The only freestanding yard
  structures are an equipment/container compound and dock canopies.
- **remoteGs → false.** No confirmed truck gate, so remote check-in is moot; if a
  controlled point exists at an obscured drive it would more likely be a
  kiosk/call-box than a booth, but that is not confirmed.
- **dockDoors → "50+".** Large grocery DC (~500k+ sqft) with dock banks on the
  NE (angled/sawtooth), east, and south faces, plus a long south dock row.
  Heavy trailer activity. Count approximate from overhead imagery (~70 est.).
- **shipRcvSeparate → true (inferred).** Two distinct dock clusters on different
  building faces (NE/east angled docks vs. the long south bank).

---

## Yard zones & counts (yardMetrics)

- **perimeter** — 7-vertex oriented ring around the contiguous fenced DC parcel
  (building + yards + parking + SE structures); **~25.0 acres** by shoelace.
- **truckGate zone** — front-yard entrance apron off the NE/N loop-road drive.
- **dropYards** — (1) SE drop yard adjacent to the building, (2) eastern overflow
  trailer lot.
- **dockAprons** — three rotated quads hugging the NE/east, south, and west dock
  faces at the building's angle.
- **streetViewMeta** — both zones have coverage:
  - perimeter → pano `5LnyuKg47Pi3P5MPwCaWfg` (2024-11), heading 232°.
  - truckGate → pano `DzFX2ZTKyuCDOigR29qaBg` (2024-11), heading 118° (the
    best driver's-eye arrival frame into the front yard).
- **Metrics:** dockDoorCount ~70, trailersVisible ~95, trailerParkingCapacity
  ~140, truckGateCount 1, buildingCount 4, siteAreaAcres 25.0, railServed false.
  All counts are honest overhead estimates.

---

## Web findings

- McLane Mid-Atlantic, 56 McLane Dr., Fredericksburg VA 22406; opened 1973 as
  Southland Distribution Center; serves 1,900+ customers across VA/MD/DE/WV/DC;
  4th-largest employer in the Fredericksburg region; celebrated 50 years in 2023.
- No public square-footage/acreage figure for the Fredericksburg site was found
  (a 211k-sqft / 13-acre figure in results refers to a different McLane DC in FL).
  Site area here is measured from the traced perimeter (~25 acres).

---

## Final confidence: medium

Building identity is **high** (McLane signage confirmed in Street View). The
medium overall grade reflects the gate/guard call: the parcel is fenced but no
controlled entry was visible, and a few drive mouths are partially screened by
the perimeter tree buffer in Street View — so truckGate/guardShack/remoteGs are
flagged uncertain. Dock-door and trailer counts are overhead estimates.
