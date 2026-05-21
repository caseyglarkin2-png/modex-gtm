# Deep-Audit Dossier — Coca-Cola Consolidated, Indianapolis Production Facility, IN

**Roster idx:** 8
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** High

## Location resolution
Roster address (5000 W 25th St, Indianapolis IN) with ROOFTOP geocode (moved
1523m) landed directly on the facility. Web research confirms: Coca-Cola
Consolidated's Indianapolis manufacturing plant, operating since 1968, with
four production lines (two PET/rPET bottle lines, two can lines) plus a
production warehouse. A $35M investment to add a glass-bottle line was
announced May 2026 (one of only three glass-bottling sites in the Coke
system).

Locked center: **39.80390, -86.24550** — the large white-roofed plant.

## Key views
- **Wide satellite (z17/z18):** One large rectangular plant/warehouse (~280m
  long). West side has a solar-canopy employee lot and a large herringbone
  trailer drop yard. Surrounded by open green space, with residential
  subdivisions to the south and the Indianapolis Motor Speedway to the
  southeast.
- **Main entrance (z20/z21, Street View 2024-07):** A single driveway runs
  from W 25th St north through a front lawn into the car parking lot and on to
  the trailer yard. Wide and open with a Coca-Cola entrance sign.
- **North face (z20):** Dock-door row with trailers backed in.
- **East face (z19/z20):** Dock-door row with trailers backed in plus stacked
  pallet/crate storage; a small white annex/canopy structure at the NE corner.
- **Trailer yard (z21):** Dense herringbone parking of trailers and tankers
  on the west side.

## Gate / guard-shack / dock determinations
- **truckGate: false.** No barrier arm, sliding/swing gate, or checkpoint at
  the W 25th St driveway entrance. Street View shows an open, signed driveway
  with no control structure.
- **guardShack: false.** No staffed booth at the property line. A small
  canopy structure sits inside the yard near the parking/yard boundary but is
  not a gate booth. Listed uncertain.
- **remoteGs: false** — no truck gate, so false by rule.
- **Docks:** Dock rows on the north and east building faces, each with
  multiple trailers backed in → estimated ~50 doors. The two banks on separate
  faces support shipRcvSeparate: true. Door count flagged uncertain.
- **postGateStaging: true / drivewayLong: true** — deep open paved yard
  between the entrance and the docks gives ample truck stacking.

## Yard zones and counts
- **Perimeter:** ~38 acres (S 39.80240 / W -86.24970 / N 39.80500 / E
  -86.24340).
- **Drop yard:** large west-side herringbone trailer yard.
- **Dock aprons:** north-face apron and east-face apron.
- **yardMetrics:** ~50 dock doors, ~65 trailers visible, ~90-trailer capacity,
  1 truck gate, 2 buildings (plant + attached office wing), ~38 acres, no rail
  spur (railServed false).

## Web findings
Coca-Cola Consolidated Indianapolis plant — operating since 1968; four
production lines; $35M glass-bottle line expansion announced May 2026
(construction late 2026, +15-20 jobs).

## Final confidence
**High** for facility identity, location, gate verdict, and overall layout.
Uncertain: exact dock-door count (banded 50+ but possibly 25-50), entry/exit
lane counts (estimated), and guard-shack call (no booth — confident it is
false, flagged because of the ambiguous yard-interior structure).
