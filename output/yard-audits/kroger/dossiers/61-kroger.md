# Deep-Audit Dossier — idx 61: Fred Meyer Distribution Center, Chehalis WA

**Type:** Distribution Center
**Address:** 222 Maurin Rd, Chehalis, WA 98532
**Resolved center:** 46.62475, -122.91380
**Method:** deep-audit · **Confidence:** high

## Step 0 — Facility confirmation
The supplied coords (46.624995, -122.916588) landed on the west half of a very
large white/cream-roofed distribution building. Web search confirmed "Fred
Meyer Inc Distribution Center, 222 Maurin Rd, Chehalis WA" (Kroger retail
distribution, 24/7, phone 360-740-6600). Satellite z16-18 shows a single ~700m
E-W building with continuous dock banks on the north and south faces and
trailer yards wrapping it — consistent with a regional retail DC. The supplied
lng was ~250m west of true building center; recentered to -122.9138.

Two adjacent parcels are NOT part of the DC and were excluded: a gray-roof
**JR Furniture** warehouse to the west (its own sign + drive at the far west of
Maurin Rd), and a tank/clarifier **wastewater/processing plant** to the south.
An electrical substation sits SW of the lot.

## Step 1-3 — Layout, gate, docks
- **Truck entrance:** one wide curb-cut driveway off Maurin Rd at ~46.6266,
  -122.9135, split by a small landscaped median island (light pole on it).
  Satellite z20 and Street View (panos captured 2026-03) show the lane is OPEN:
  no barrier arm, no sliding/swing gate across the truck lane, no checkpoint.
  Chain-link perimeter fence runs along Maurin Rd but the truck lane is an open
  gap. **truckGate: false.**
- **Guard shack:** none. Only the median island + light pole; no 1-3-space
  booth beside the lane in any view. **guardShack: false** (and remoteGs false,
  since there is no gate at all).
- **Docks:** long continuous door banks on BOTH the north face (FedEx/retail
  trailers backed in, visible in SV + z18/z19) and the south face. Across a
  ~700m building this is well into the **50+** band (≈140 doors estimated).
  Two distinct dock faces → **shipRcvSeparate: true.**
- **Drop yard:** dedicated trailer storage — a large reefer/dry trailer yard
  NORTH across Maurin Rd, plus long drop lanes along the south and west of the
  building and an east-end turnaround. **dropYard: true, dropArea: 50+.**
- **Driveway depth:** entrance opens into a very deep yard; easily holds a 3+
  truck queue before docks → **drivewayLong: true.**
- **Backup-sensitive:** no — huge internal yard, low-traffic rural road, ample
  stacking. **false.**
- No truck scale in the path (**scale: false**); single building
  (**multipleFacilities: false**); no rail spur (**railServed: false**);
  no second checkpoint (**multiStep: false**).

## Step 4 — Web findings
Kroger/Fred Meyer retail distribution center, operates 24/7, located at the
Nalley Rd / Maurin Rd / Pemerl Way area on the edge of Chehalis. Serves Fred
Meyer retail. No driver reviews contradicting the open-entry read.

## Step 6 — Geofence & metrics
- **perimeter:** 6-vertex ring around the fenced operational parcel south of
  Maurin Rd (building + N/S aprons + drop lanes + east turnaround). Long axis
  runs nearly E-W, very slightly rotated. Shoelace area ≈ 50.5 acres.
- **truckGate:** small quad over the open entrance drive at Maurin Rd.
- **dropYards:** (1) the across-road north reefer/trailer yard, (2) the long
  south drop-lane band.
- **dockAprons:** north apron and south apron, long thin quads hugging the
  building wall at its true (near-E-W) angle.
- **streetViewMeta:** truckGate pano `d6-a1n2AFCr4QiZsKLya8g` heading 178°
  (driver's arrival view into the open entrance); perimeter pano
  `M1iZCLpTGdNzNXtoFyrPDw` heading 180° (north dock face). Both 2026-03.
- **Metrics:** dockDoorCount ≈140, trailersVisible ≈180, capacity ≈260,
  truckGateCount 1, buildingCount 1, 50.5 acres, railServed false. Door and
  capacity counts flagged as honest overhead estimates.

## Final
**Urban/Rural:** Rural (farmland-surrounded edge of Chehalis).
**Gate:** none (open entry). **Guard shack:** none. **Confidence:** high —
clear recent imagery, facility unambiguous, entrance verified from the road.
