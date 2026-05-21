# Deep-Audit Dossier — Kenco MCS Jeffersonville II (Jeffersonville, IN)

**Roster idx:** 10
**Facility:** Kenco MCS Jeffersonville II — Multi-Client Distribution Center
**Resolved coords:** 38.39105, -85.67900
**Confidence:** medium

## Location resolution

The roster supplies "River Ridge Commerce Center, Jeffersonville IN 47130" with a
ROOFTOP geocode at 38.356949, -85.66387. **Step 0 probing** showed that point
lands on an unrelated corporate visitor building with a landscaped pond several
km south — not a 468,635 SF distribution center. The geocode is wrong.

Web research confirms Kenco operates **two logistics buildings** on the
Jeffersonville side of River Ridge Commerce Center. idx 1 (Jeffersonville I) is
documented at **201 River Ridge Parkway, 664,800 SF**, with AutoStore robotics —
the central NE-SW-oriented building that the idx 1 roster geocode
(38.387587, -85.676299) lands on. idx 10 (Jeffersonville II, 468,635 SF, food
grade) was therefore audited as the **adjacent large warehouse to the NW** —
Kenco's second River Ridge building — centered at ~38.3911, -85.6790.

## Key views

- **Wide satellite (z15-z16):** River Ridge Commerce Center — a large modern
  industrial park with many big-box DCs amid open farmland.
- **NW building (z17-z18):** large single-load warehouse, ~456 m long NE-SW;
  office and auto parking at the SW end; loading docks along the SE face.
- **SE dock face (z19):** continuous dock wall with a wide dock apron and a
  moderate number of trailers backed in; truck driveways connect directly to
  River Ridge Parkway.
- **NW / NE sides (z18-z19):** no docks; the building backs onto open
  agricultural fields.
- **Street View (River Ridge Parkway, 2026-03):** the SE dock face and truck
  yard are open to the parkway with only a grassed setback — no perimeter fence,
  no barrier arm, no sliding gate, no guard booth. A monument sign sits at the
  parking entrance.

## Gate / guard-shack / dock determinations

- **truckGate = false.** No controlled truck entrance. The truck yard along the
  SE dock face is fully open to River Ridge Parkway. No perimeter fencing,
  barrier arm, sliding gate or checkpoint pinch-point is visible in any Street
  View — a typical open-layout River Ridge spec building.
- **guardShack = false; remoteGs = false.** Open site, no gate, no booth.
- **dockDoors = "50+".** Docks on the SE face only (single-load, not cross-dock).
  The ~456 m dock wall yields an estimated ~90 dock doors. Count is approximate
  from overhead imagery and is flagged.
- **shipRcvSeparate = false.** Single dock bank on one building face.
- **dropArea = "10-25".** Some trailers parked without tractors on the wide SE
  apron.
- **drivewayLong = true.** The deep SE-face apron easily holds a 3+ truck queue.

## Yard zones and counts

- **Perimeter:** ~456 m x 349 m, ~39.4 acres — building plus the SE truck yard.
- **Truck gate:** none (open). `truckGate` geofence left null.
- **Drop yards:** none dedicated; trailers stage on the SE dock apron.
- **Dock apron:** the SE-face apron strip.
- **yardMetrics:** ~90 dock doors, ~22 trailers visible, ~35 trailer-parking
  capacity, 1 (uncontrolled) truck entrance, 1 building, ~39.4 acres, not
  rail-served.

## Web findings

- Kenco opened at River Ridge with two logistics buildings on the Jeffersonville
  side (newsandtribune, 1SI, Lane Report).
- Jeffersonville I at 201 River Ridge Parkway — 664,800 SF, e-commerce
  fulfillment, AutoStore robotics; Kenco installed new sorting technology there
  (Sept 2024 coverage).
- Jeffersonville II — 468,635 SF, food grade, bulk space per Kenco's warehousing
  map; no separately published street number.

## Final confidence

**Medium.** The River Ridge campus and the two-building Kenco footprint are
confirmed, and the audited NW building's open layout, single-load dock face and
ungated truck yard are clearly visible. Confidence is held at medium because the
specific Jeffersonville I vs II assignment between the two adjacent Kenco
buildings is an inference (no separately published address for building II), and
the dock-door count is an overhead estimate.
