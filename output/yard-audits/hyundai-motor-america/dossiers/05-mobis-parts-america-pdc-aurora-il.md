# Deep-Audit Dossier — Mobis Parts America PDC, Aurora IL (idx 05)

**Facility:** Mobis Parts America PDC - Aurora IL
**Type:** Parts Distribution Center
**Address:** 1705 Sequoia Dr, Aurora, IL 60506
**Resolved center:** 41.793500, -88.357300
**Confidence:** High

## Step 0 — Location confirmation
Roster coords (41.793528, -88.357668, ROOFTOP, moved 1385 m) landed on a large
warehouse building. Confirmation was needed because of the 1385 m geocode
move. Street View shows a "MOBIS" sign on the building face, and web research
(Yellow Pages, Loc8NearMe, Chamber of Commerce) confirms 1705 Sequoia Dr,
Aurora IL 60506 as the Mobis Parts America Central Region PDC. Identity
positively re-confirmed; center placed on the Mobis building roof.

## Key views
- **z16 wide:** Suburban Chicago-metro business park along I-88 — mix of
  warehouses and office buildings.
- **z17-18 building:** Standalone warehouse; dock-door bank with trailers
  backed in along the east face; freeway buffer of trees on the NE; office
  building and retention pond to the west.
- **z19-20 dock / yard:** ~34 dock doors estimated on the east face; trailers
  parked in the east dock yard; employee parking on the south (Sequoia Dr)
  front.
- **Street View (2024-04):** "MOBIS" signage on the building; the property is
  entered from Sequoia Dr via an open, ungated driveway that wraps around to
  the east dock yard.

## Gate / guard-shack / dock determinations
- **truckGate = false.** The property is entered from Sequoia Dr through an
  open, unobstructed driveway. Street View shows no barrier arm, no sliding
  gate, and no checkpoint pinch-point. The dock yard wraps to the east face via
  this open drive.
- **guardShack = false.** No staffed booth at the entrance or anywhere in the
  yard.
- **remoteGs = false.** No gate exists, so no kiosk/remote check-in implied.
- **dockDoors = 25-50.** East face carries a dock-door bank with trailers
  backed in — counted ~34.
- **dropArea = 10-25 / dropYard = false.** Trailers parked along the east dock
  yard — modest drop activity, but no dedicated separate drop-yard lot.

## Yard zones and counts
- **Perimeter:** the Mobis building, its east dock yard and front parking
  (~11.5 acres).
- **Drop yard / dock apron:** the east dock face and adjacent yard.
- **Truck gate:** the open driveway off Sequoia Dr (no control).
- **Metrics:** ~34 dock doors, ~24 trailers visible, ~38 trailer capacity, 1
  truck entrance, 1 building, no rail spur.

## Web findings
- Yellow Pages / Loc8NearMe / Chamber of Commerce: Hyundai MOBIS Parts America,
  1705 Sequoia Dr, Aurora IL 60506 — Central Region parts distribution center
  and regional training center; open Mon-Fri 8:30am-5pm; 2024 reviews note
  fast turnaround (~40 min deliveries) and a clean, efficient operation.

## Final confidence
**High.** Facility positively re-confirmed (MOBIS signage + address research),
current Street View available, layout clear. Only door count and trailer
capacity are honest overhead estimates, flagged in `uncertainFields`.
