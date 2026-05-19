# Deep-Audit Dossier — idx 24: Jennie-O Turkey Store (Willmar, MN)

## Facility
- **Name:** Jennie-O Turkey Store — Willmar Plant (Hormel subsidiary; Jennie-O HQ)
- **Type:** Meat Processing Plant (turkey slaughter + processing)
- **Roster address:** 2505 Willmar Ave SE — actual: **2505 Willmar Ave SW**,
  Willmar, MN 56201

## Step 0 — Location resolution
Roster coordinates (45.110536, -95.008269, RANGE_INTERPOLATED) landed in open
farmland ~5.5 km east of the plant; the roster's "SE" street suffix is wrong —
the address is Willmar Ave SW. Web search returned the plant at ~45.1107,
-95.0771. Satellite confirmed a large multi-building turkey-processing campus on
the SW edge of Willmar with extensive trailer drop yards and an active rail line
on the SE edge. **Locked center: 45.10870, -95.07950.**

## Key views
- **Wide (z16-17):** Sprawling ~8-building processing campus, extensive employee
  parking and large trailer drop yards in the SW; rail line along the SE.
- **Roof / docks (z19-20):** Large processing buildings; dock banks with
  trailers backed in on multiple faces.
- **Trailer yard (z18):** Many rows of untethered trailers (100+) in the SW
  drop yards.
- **StreetView (2025):** Plant fully enclosed by a continuous white privacy-slat
  chain-link fence. A posted sign at the north visitor gate reads "ALL TRUCKS
  MUST USE SOUTH ENTRANCE" — confirming a function-separated controlled truck
  gate. Green Jennie-O signage at the north entrance and SW trailer-yard
  entrance.

## Gate / Guard / Dock determinations
- **truckGate = true.** Continuous perimeter fence with controlled gates; the
  "ALL TRUCKS MUST USE SOUTH ENTRANCE" sign establishes a dedicated, controlled
  truck entrance.
- **guardShack = false (uncertain).** No guard-booth structure could be
  positively confirmed at the truck gate — the gate is obscured by privacy
  fencing and trees in StreetView. Flagged as uncertain.
- **remoteGs = true (uncertain).** Gate present, no confirmed booth; flagged.
- **entryExitSeparate = true.** Visitors use the north gate; trucks use the
  separate south entrance.
- **dockDoors = 25-50.** ~45 doors across multiple building faces (low-conf).
- **dropArea = 50+.** 100+ trailers parked in the SW drop yards.
- **shipRcvSeparate = true.** Slaughter+processing plant with separate raw-
  receiving and finished-shipping dock banks.
- **railServed = true.** Active rail line on the SE property edge.

## Yard zones and counts
- **Perimeter:** ~75-acre fenced processing campus + drop yards.
- **Truck gate:** dedicated south truck entrance.
- **Drop yards:** large SW trailer-storage area.
- **Dock apron:** dock banks on the E/SE faces of the processing buildings.
- **Metrics:** ~45 dock doors, ~110 trailers visible, ~200 capacity, 2 gates
  (visitor + truck), ~8 buildings, rail-served.

## Web findings
Jennie-O Turkey Store is a wholly-owned Hormel subsidiary and an industry-
leading turkey processor; Willmar is its headquarters. Classified by USDA FSIS
as a large meat/poultry slaughter + processing operation in Kandiyohi County.

## Confidence
**Medium.** Location and the fenced gated layout are well confirmed, but the
guard-shack determination could not be visually verified (gate obscured) and
several counts are honest overhead estimates — all flagged in uncertainFields.
