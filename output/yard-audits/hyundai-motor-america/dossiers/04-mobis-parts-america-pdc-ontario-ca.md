# Deep-Audit Dossier — Mobis Parts America PDC, Ontario CA (idx 04)

**Facility:** Mobis Parts America PDC - Ontario CA
**Type:** Parts Distribution Center
**Address:** 1900 S Rochester Ave, Ontario, CA 91761
**Resolved center:** 34.040200, -117.553100
**Confidence:** High

## Step 0 — Location confirmation
Roster coords (34.040044, -117.552921, ROOFTOP, moved only 219 m) landed on a
large warehouse building. Web research (BBB, D&B, Panjiva, US Port Examiner)
confirms 1900 S Rochester Ave, Ontario CA 91761 as the Mobis Parts America
West Coast PDC — the Hyundai/Kia/Genesis after-sales parts distribution arm.
Center placed on the Mobis building roof.

## Key views
- **z16 wide:** Dense Inland Empire logistics corridor — wall-to-wall
  warehouses, a freeway on the east edge.
- **z17-18 building:** Large single warehouse; long dock-door bank with
  colored trailers backed in along the south face; truck court between the
  Mobis building and a separate warehouse to the south.
- **z19-20 dock / yard:** ~46 dock doors estimated on the south face; a row of
  parked trailers in the truck court; employee/visitor parking on the east
  (Rochester Ave) front.
- **Street View (2021-02 & 2025-01):** The truck court is entered via an open
  driveway off S Rochester Ave; the building shows multi-tenant signage
  ("Spartan").

## Gate / guard-shack / dock determinations
- **truckGate = false.** The dock yard / truck court opens directly off S
  Rochester Ave through an unobstructed driveway. Street View from two epochs
  shows no barrier arm, no sliding/swing gate, and no checkpoint pinch-point at
  the road — standard open multi-tenant business-park access.
- **guardShack = false.** No staffed booth at the entrance. A small structure
  mid-yard reads as an office/storage cabin, not a gate guard booth.
- **remoteGs = false.** No gate exists, so no kiosk/remote check-in implied.
- **dockDoors = 25-50.** South face carries a long regular dock-door bank with
  trailers backed in — counted ~46.
- **dropArea = 10-25 / dropYard = false.** A row of parked trailers sits in the
  shared truck court — modest drop activity, but not a dedicated drop-yard lot.

## Yard zones and counts
- **Perimeter:** the Mobis building and its shared south truck court (~14.5
  acres).
- **Drop yard / dock apron:** the south dock face and truck court.
- **Truck gate:** the open driveway off Rochester Ave (no control).
- **Metrics:** ~46 dock doors, ~38 trailers visible, ~55 trailer capacity, 1
  truck entrance, 1 building, no rail spur.

## Web findings
- BBB / D&B / Panjiva: Mobis Parts America, 1900 S Rochester Ave, Ontario CA
  91761 — West Coast PDC, after-sales service parts for Hyundai/Kia/Genesis;
  also home to the MPA Accessories division.

## Final confidence
**High.** Facility unambiguous, multi-epoch Street View available, layout
clear. Only door count and trailer capacity are honest overhead estimates,
flagged in `uncertainFields`.
