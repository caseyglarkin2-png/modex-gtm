# US PL Kingfield Factory — Deep Audit Dossier

**Facility:** US PL Kingfield Factory (Poland Spring — Nestlé Waters / Primo / BlueTriton bottling plant)
**City:** Kingfield, ME (rural western Maine)
**Type:** Bottling plant (PL)
**Resolved center:** 44.94470, -70.15770
**Maps:** https://www.google.com/maps/@44.94470,-70.15770,400m/data=!3m1!1e3
**Confidence:** MEDIUM

## Location resolution
The supplied coordinates (44.9580, -70.1530) sat ~1.5 km NNE. Google geocoding of 120 Poland Spring Dr, Kingfield ME 04947 returned 44.9448, -70.1577, landing on a single large industrial building in a forest clearing. Web sources (Daily Bulldog, USGBC, Yelp/TruckMap) confirm this is the Poland Spring Kingfield bottling plant, one of Poland Spring's Maine plants with two production lines. Center locked ~44.9447, -70.1577.

## What the key views showed
- **Geo (z16):** A single large building in a forest clearing, dock bank on the SW face, long access road from the NE, completely surrounded by forest.
- **Building (z18):** One large rectangle; employee parking at the north; a round water-storage tank at the SE; dock bank running the SW/south face with trailers backed in.
- **SW docks (z19):** A continuous dock bank (~25-30 positions) plus a large drop yard immediately SW with 3-4 parallel rows of parked trailers (50+).
- **Entrance (z18) and road-out (z17):** A single private road winding ~0.6 km through forest from the NE; no gate or booth visible; rural surroundings with only scattered development near the public road.
- **Street View:** No coverage anywhere near the site (rural).

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE** (low-medium confidence). No barrier/gate/booth visible at the yard or along the access road. A gate could exist further up the private drive; no SV to confirm.
- **Guard shack: FALSE.** No booth-sized structure at the entrance.
- **Remote GS: FALSE.** No confirmed truck gate.
- **Docks: 25-50.** Single long SW-face bank, ~25-30 positions. No distinct second ship/receive bank → shipRcvSeparate FALSE.

## Yard zones and counts
- **Perimeter:** ~22 acres of cleared/paved footprint inside the treeline.
- **Drop yard:** large multi-row lot SW of the docks (50+ trailers), dropArea 50+, dropYard TRUE.
- **Dock apron:** SW face (long), with a deep internal paved holding area → postGateStaging TRUE, drivewayLong TRUE.
- **Metrics:** ~28 dock doors, ~70 trailers visible, ~90 capacity, 1 building, ~22 acres, no rail.
- **Connectivity:** isolated forest-clearing site → connectivityIssue TRUE (inferred).

## Web findings
- Poland Spring (Nestlé Waters / now Primo Brands / BlueTriton); one of three Maine plants (Poland Spring, Hollis, Kingfield); ~500,000 bottles per shift when both lines run.

## Final confidence
MEDIUM. Location and plant identity are solid. Gate/guard FALSE based on imagery but unconfirmable (no SV, possible gate up the private road). Dock count banded 25-50; drop yard clearly 50+. Rural isolation → connectivity flagged.
