# Deep-Audit Dossier — idx 08

## Detroit Reman East — Byesville, OH

- **Account:** Daimler Truck North America
- **Type:** Remanufacturing plant (engines/components)
- **Roster address:** 60703 Country Club Road, Byesville, OH 43723
- **Resolved center:** 39.97815, -81.56675
- **Method:** deep-audit | **Confidence:** medium

## Step 0 — Location confirmation

The roster coordinate (39.978736, -81.56699; ROOFTOP, moved 2417 m) landed on a
large modern blue/dark-roofed industrial building in the Southgate industrial
park near Byesville, OH, immediately west of the Cambridge Country Club golf
course — consistent with the "Country Club Road" address. The blue building is
the largest and most modern facility on the parcel and is identified as Detroit
Reman East. A separate, lighter-roofed building sits just to the west; it is a
different occupant and not part of this facility. DTNA careers, Yelp and Dun &
Bradstreet confirm Detroit Diesel Remanufacturing at 60703 Country Club Road,
Byesville (founded 1993, ~442 employees, reman of on/off-highway power systems,
electronics, fuel systems and aftertreatment).

Note: Street View cannot get close enough to resolve fine building signage, and
the 2025 satellite shows active construction on the building's east side, so
the building identity is a reasoned best-fit — hence medium confidence.

## Key views

- **Wide z16:** A small industrial park with several large buildings; the blue
  building plus a lighter building to the west share a parking lot.
- **Main building z18-z19:** Large blue/dark-roofed plant; north face carries a
  bank of dock doors with covered dock canopies; east side under active
  construction at imagery date; south side fronts woods.
- **North z20:** Dock doors with dock canopies and a paved truck apron;
  perimeter chain-link fence separates the lot from a grassy field.
- **Street View (2025-05, 2021, 2019):** Open industrial-park roads; no barrier
  arm or guard booth at any approach.

## Gate / guard-shack determination

- **Truck gate: NO (flagged uncertain).** The facility sits on an open
  industrial-park road network. Access roads and the shared parking lot connect
  directly to public roads with no barrier arm, sliding gate or checkpoint at
  the truck approach. Some perimeter chain-link fencing exists but the truck
  entrance itself is uncontrolled.
- **Guard shack: NO.** No booth visible at any entrance.
- **Staging:** No pre- or post-gate truck staging; short direct approach to the
  dock apron.
- **Fast-lane opportunity: NO.** No gate, so not applicable.

## Yard zones and counts

- **Perimeter geofence:** S 39.9768, W -81.5680, N 39.9796, E -81.5656 —
  ~17 acres for the Detroit Reman East building parcel.
- **Dock apron:** North face of the blue building.
- **dockDoorCount ~14** (band 10-25) — one dock bank with covered dock canopies
  on the north face; approximate, east face obscured by construction.
- **trailersVisible ~8**, **trailerParkingCapacity ~20** — dropArea 0-10; no
  dedicated drop yard.
- **truckGateCount 0**, **buildingCount 1**, **railServed false.**

## Web findings

DTNA, Yelp and D&B confirm Detroit Diesel Remanufacturing-East at 60703 Country
Club Road, Byesville (founded 1993, ~442 employees). A search clarified that the
recent (2024) Detroit Reman expansion was the Hibbing, MN plant — not Byesville
— so the construction visible in 2025 Byesville imagery is a separate project.
No public detail on the gate layout.

## Final confidence

**Medium.** The facility is located in the correct industrial park and the blue
building is a well-reasoned best-fit for Detroit Reman East, but Street View
cannot resolve building signage and active construction obscures part of the
site. Gate, dock and yard determinations are imagery-based; truckGate,
guardShack, dock/drop bands, building count and ship/receive separation are
listed in uncertainFields.
