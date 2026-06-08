# GM - Saginaw Metal Casting Operations, Saginaw MI (idx 22)

**Address:** 1629 N Washington Ave, Saginaw, MI 48601
**Type:** Metal Casting Plant (aluminum foundry)
**Resolved center:** 43.4489, -83.9190
**Confidence:** medium
**Confirmed:** yes — correct GM industrial building positively identified

## Location confirmation

Wikipedia gives the SMCO coordinates as 43.4529, -83.9159; the GM/American
Auto Worker listings confirm 1629 N Washington Ave. The roster address point
sits near the river frontage. Satellite probing (z15 -> z19) around the
Wikipedia point revealed a large multi-building foundry mass on the **east
bank of the Saginaw River** with a rail spur running along its west face — the
unmistakable signature of a metal casting plant. The plant core was pinned to
43.4489, -83.9190 (the connected foundry-building cluster center-right of the
parcel). This is the correct GM building, not an office.

Web research: aluminum foundry running precision-sand and semi-permanent-mold
casting of 3.6L High Feature V6 engine blocks, cylinder heads, and light-duty
4WD front-axle castings, plus pre/final machining. ~1.9M sq ft; historically a
~490-acre parcel but the active fenced footprint is much smaller (~110 ac); as
of 2024 ~300+ employees (heavily downsized from its mid-century peak).

## Key views

- **Wide (z15/z16):** Plant sits on the river's east bank with a large rail
  yard to the south and a diagonal rail spur on the west. Much of the parcel
  east/southeast of the core is now **vacant cracked-concrete former-building
  footprint** (demolition scars) and open laydown yard.
- **Plant mass (z16):** Dense cluster of connected foundry buildings (6+ roof
  sections), oriented roughly NW-SE, with material-handling/silo structures and
  an electrical substation at the NW corner.
- **South frontage (z18 + Street View, 2023/2024):** Employee parking, a small
  office, a landscaped divided-boulevard main entrance off N Washington Ave at
  ~43.4466,-83.9180, and a continuous **chain-link perimeter fence** (fence +
  employee picnic pavilion visible inside the line).
- **NW (z18):** Rail spur alongside the west face confirming rail service;
  substation and bulk material handling.
- **NE / east (z18/z19):** Outdoor material/equipment laydown, covered storage
  bays, scrap, and a few trailers/containers parked in the open yard.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Fenced, controlled campus accessed via the divided
  boulevard drive off N Washington Ave. No open public truck driveway; access
  is through the secured campus entry.
- **guardShack = false / remoteGs = true (uncertain).** No staffed booth was
  positively resolved at the entrance in available imagery. Treated as a gate
  without a clearly visible manned shack (kiosk/badge/app check-in implied);
  flagged for human review.
- **dockDoors = 10-25 (~14, low confidence).** Foundry docks are modest and
  distributed on interior building faces; most bulk material moves by **rail**,
  so the exterior truck-dock count is low for a plant of this size.
- **dropArea = 10-25 / dropYard = true.** ~8 trailers/containers visible in the
  north/northeast laydown yard, room for ~40.
- **postGateStaging = true / drivewayLong = true.** Large interior paved yards
  (open former footprints + central apron) and a long internal approach hold a
  3+ truck queue inside the fence.

## Yard zones & counts

- **perimeter:** ~110 ac oriented ring tracing the active fenced footprint
  (river edge on the NW, N Washington frontage on the SW/S).
- **truckGate:** quad over the Washington Ave boulevard entry.
- **dropYards[1]:** north/northeast laydown/trailer yard.
- **dockAprons[1]:** interior dock apron strip on the central building face.
- **yardMetrics:** dockDoorCount 14, trailersVisible 8, capacity 40,
  truckGateCount 1, buildingCount 6, siteAreaAcres 110, railServed true.

## Street View

Pano `uLQq0M9x0QJFyrcATSzZWQ` @ 43.44622,-83.91826 (captured 2023-05) on the
N Washington Ave SW frontage shows the perimeter fence. No pano exists inside
the secured campus, so both zone panos use this frontage pano (perimeter
heading 348°, truckGate heading 14°).

## Final confidence

**Medium.** Building positively identified; rail service, fenced perimeter,
controlled boulevard entry, drop yard, and modest dock count are all
well-supported. Guard-shack presence, exact dock-door count, and entry/exit
lane counts could not be resolved from imagery and are flagged uncertain.

**3-line summary**
- Gate: TRUE — fenced controlled campus, divided boulevard entry off N Washington Ave.
- Guard shack: FALSE (uncertain) — no staffed booth resolved; remoteGs=true, flagged for review.
- Confidence: medium.
