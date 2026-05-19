# UNFI — Racine WI DC (Sturtevant) — Deep-Audit Dossier

**Roster idx:** 16
**Facility:** UNFI Wisconsin Distribution Center
**Address:** 3138 County Highway H, Sturtevant, WI 53177
**Resolved center:** 42.69450, -87.91870
**Confidence:** High

---

## Location resolution

The roster entry was city-level only ("Racine, WI", geocode displaced ~1,264 m).
Web search resolved the actual facility: UNFI's southeast-Wisconsin LEED Gold
DC is **3138 County Highway H, Sturtevant, WI 53177** (Waze, the Village of
Sturtevant business directory, USGBC project page). It is the facility the
roster labels "Racine WI DC" — Sturtevant is in Racine County, adjacent to the
city of Racine. Press describes it as built in 2014, ~425,000-450,000 sq ft,
54 dock doors, "southeast of Durand Avenue and 105th Street."

County Highway H = 105th Street; Durand Avenue = WI-11. The intersection of
those two roads is the NE anchor. Probing south/southwest of it located a
large white-roofed DC on the **west** side of Highway H, with docks facing the
road, drop trailers in a wide truck court, and the on-site storm-water
treatment ponds described in the LEED writeup. Street View along Highway H
(2023-2024 panos) confirmed the operating DC is the west building (the east
building across Highway H is a different tenant). Building locked.

## What the imagery showed

- **Wide satellite (z14-z16):** A long white DC building set in an
  edge-of-town industrial corridor, open farm fields to the west and south.
  Docks and the truck court run along the **east** face, fronting Highway H.
  A separate smaller building sits at the SW corner of the parcel.
- **Truck court (z17-z19):** Docks line nearly the full length of the east
  building face with trailers backed in; a large bank of drop trailers (no
  tractors) is parked in the truck court. Wide paved holding area.
- **Entrance (z20 + Street View):** The truck driveway curves off Highway H
  into the truck court near the NE of the building — an open paved entrance.

## Gate / guard-shack determination

- **truckGate: FALSE.** The truck driveway meets County Highway H as an open
  curved entrance. z20 satellite of the road entrance and three Street-View
  headings along Highway H show no barrier arm, no sliding/swing gate, no
  checkpoint pinch-point, and no perimeter fence at the road. Open-access yard.
- **guardShack: FALSE.** No staffed booth — no small 1-3-vehicle-footprint
  structure beside the truck lane in any imagery.
- **remoteGs: FALSE.** Requires a gate to be present; there is none.

## Yard zones and counts

- **Perimeter:** ~55 acres — the main DC, the east-side truck court / drop
  yard, employee parking, the SW secondary building, and the storm-water
  ponds, bounded by farm fields W/S and Highway H on the east.
- **Drop yard:** large east-side bank of parked drop trailers — `dropArea`
  50+; `dropYard: true`.
- **Dock apron:** east face of the main building; ~54 dock doors (UNFI/USGBC
  figure), single dock cluster — `shipRcvSeparate: false`, `dockDoors` 50+.
- **postGateStaging: true** — very wide interior truck court before the docks.
  `drivewayLong: true` — easily holds a 3+ truck queue.
- **yardMetrics:** ~54 dock doors, ~60 trailers visible, ~110-trailer parking
  capacity, 1 truck gate, 2 buildings, ~55 acres, no rail.

## Web findings

UNFI's Sturtevant DC is a 2014-built LEED Gold food-distribution center —
~425,000-450,000 sq ft, 54 dock doors, LED lighting, rainwater-recovery
cisterns, storm-water ponds doubling as wildlife habitat. It opened as UNFI's
Midwest hub. **In March 2026 UNFI announced the permanent closure of this
facility, eliminating 443 jobs** — part of the documented "Great
Consolidation" cadence (Sturtevant closure was named in the Bushway dossier).
The audit reflects the yard's physical layout from current satellite/SV
imagery; operational status is winding down.

## Final confidence: HIGH

Facility positively resolved from a city-level roster entry; imagery clear in
all key views. Flagged uncertain: `trailerParkingCapacity` (overhead estimate)
and `buildingCount` (the SW secondary building's exact use is unconfirmed).

**3-line summary:**
Gate: no truck gate — open curved driveway off County Highway H, no barrier/fence.
Guard shack: none.
Confidence: high.
