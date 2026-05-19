# Deep-Audit Dossier — idx 20

## Coca-Cola UNITED — Baton Rouge Production Plant, LA

**Facility type:** Bottling / Manufacturing Plant
**Resolved location:** ~30.53650, -91.13500 — 9696 Plank Rd, Baton Rouge, LA 70811
**Confidence:** Medium

## Location resolution
The roster supplied address "8484 Airline Hwy" with coordinates
(30.45576, -91.09914). Web research showed 8484 (and 10170) Airline Hwy are
**obsolete historical Coca-Cola locations** in Baton Rouge. The current
Coca-Cola UNITED Baton Rouge production plant is at **9696 Plank Rd, Baton Rouge,
LA 70811** — confirmed by the Coca-Cola UNITED Baton Rouge location page and a
Waze listing for "Baton Rouge Coca-Cola Bottling Company." The roster coords
were roughly 10 km southeast of the real plant. Satellite probing of 9696 Plank
Rd revealed a very large white-roofed bottling/distribution complex immediately
east of Baton Rouge Metropolitan Airport, with red Coca-Cola fleet trucks
backed into the docks — an unambiguous match.

## Key views
- **Wide satellite (z15-16):** Large white-roofed bottling building in the
  center of a wooded campus, airport runways to the west, residential
  subdivision to the east. A long winding access road links the campus to Plank
  Rd on the southeast.
- **Tight satellite (z19-20):** South/east building faces are long dock banks
  with trailers backed in (~60 doors estimated). North side has a trailer drop
  yard with ~55 trailers. A separate fleet-maintenance building sits southwest
  of the bottling plant; a corporate-office wing adjoins; a small pump/utility
  structure stands in the lawn island.
- **Street View (Plank Rd & access road, 2022):** The SV car drove freely down
  the campus access road with no gate encountered; coverage ends at the inner
  road before reaching the building checkpoint.

## Gate / guard-shack / dock determinations
- **Truck gate — FALSE (flagged uncertain):** No barrier arm or sliding gate
  confirmed. The campus is reached by a long access road off Plank Rd; the 2022
  Street View car drove in unobstructed, and satellite shows no clear barrier.
  A 112-acre corporate campus of this scale would typically have a controlled
  entrance, but none is visible in available imagery — called FALSE on visible
  evidence and flagged uncertain.
- **Guard shack — FALSE (flagged uncertain):** No standalone booth confirmed at
  the entrance.
- **Remote GS — FALSE:** No confirmed gate.
- **Docks — 50+ band:** ~60 dock doors estimated across the south and east
  building faces.

## Yard zones & counts
- **Perimeter:** 112-acre LEED-certified campus (per Coca-Cola UNITED / Louisiana
  Economic Development). Geofence captures the developed footprint plus the
  access-road corridor.
- **Drop yard:** North-side trailer-parking area, ~55 trailers visible,
  estimated ~90-trailer capacity — dropYard true, dropArea 50+.
- **Dock apron:** South/east building faces where trailers back in.
- **Staging:** Trucks observed staged in a long line on a wide internal paved
  area between the fleet building and the bottling plant — postGateStaging true,
  drivewayLong true, fastLaneOpportunity true (ample paved width).
- **Buildings:** Bottling plant (~750k sq ft) + corporate office (~56k sq ft) +
  fleet-maintenance building (~50k sq ft) + pump/utility structure —
  multipleFacilities true.
- **Rail:** No rail spur into the property — railServed false.

## Web findings
- Coca-Cola UNITED Baton Rouge: 9696 Plank Rd; 112-acre campus; 750,000 sq ft
  LEED-certified bottling facility, 56,000 sq ft office, 50,000 sq ft fleet
  maintenance, plus support buildings.
- $42M expansion broke ground December 2021 (Coca-Cola UNITED / Office of the
  Governor of Louisiana / Louisiana Economic Development).

## Final confidence
**Medium.** Identity, scale, dock count, and drop yard are confidently
established. The truck-gate and guard-shack calls are FALSE on visible evidence
but flagged uncertain because Street View coverage stops short of the building
checkpoint and satellite resolution can't rule out a barrier on a campus this
large.
