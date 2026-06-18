# US PL Zephyrhills Factory — Deep Audit Dossier

**Facility:** US PL Zephyrhills Factory (Primo Brands / BlueTriton — Zephyrhills Natural Spring Water bottling plant)
**City:** Zephyrhills, FL
**Type:** Bottling plant (PL)
**Resolved center:** 28.22150, -82.16880
**Maps:** https://www.google.com/maps/@28.22150,-82.16880,400m/data=!3m1!1e3
**Confidence:** HIGH

## Location resolution
The supplied coordinates (28.2461, -82.1811) landed in a residential grid roughly 2.7 km NNW of the actual plant. Web reporting (lakerlutznews, Tampa Bay Times) places the Nestlé/BlueTriton/Primo plant "off 20th Street and Alston Avenue." Google geocoding of the listed address (4330 20th St, Zephyrhills, FL 33542) returned 28.2220, -82.1693, which sits squarely on a very large white-roof industrial building. Satellite confirmed a bottling/warehouse complex with a full dock bank and large trailer yard — consistent with the ~250-employee Zephyrhills spring-water factory. Center locked at 28.2215, -82.1688.

## What the key views showed
- **Wide (z16/z17):** A single very large building (center-west) with a continuous dock bank on the east face, an enormous east trailer yard packed with rows of parked trailers, a second drop block on the south side, employee parking at the NW, and active construction/grading at the north end (expansion).
- **West access drive (z18/z19):** The only public-road frontage is 20th St on the west, with a tree buffer. A single gated driveway feeds both the north car lot and a truck loop that wraps the south of the building to reach the east docks and drop yards.
- **East dock bank (z19):** A long continuous bank of dock doors running nearly the full building length, ~30+ visible bays with trailers backed in across one frame, continuing beyond it. A second dock bank on a south/SW face.
- **Trailer yard (z19):** Many parallel striped rows of trailers parked without tractors — 100+ trailers visible east of the docks plus a south drop block.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** Street View on the west access drive (pano `6r_ZKBZhREH3Pr_x9xbLOQ`, captured 2025-05) clearly shows a black sliding/ornamental metal gate across the entrance driveway, with a card-reader/kiosk pedestal post on the right of the lane. The entire property is wrapped in continuous black metal perimeter fencing (visible in multiple SV frames along 20th St).
- **Guard shack: FALSE.** No staffed booth-sized structure at the gate. Access is via the sliding gate + a pedestal call-box/card-reader.
- **Remote GS: TRUE.** Gate present, no staffed booth → kiosk/card/app check-in implied (medium confidence on reading the pedestal).
- **Docks: 50+.** Long east-face bank (~30+ bays in one frame, continues) plus a south/SW-face bank. Honest total ~55-60 → banded 50+. Two distinct dock clusters on different faces → ship/receive likely separate (medium confidence).

## Yard zones and counts
- **Perimeter:** ~68 acres of fenced, paved/built footprint (large building + east/south trailer yards).
- **Truck gate:** west driveway off 20th St, single in/out lane pair, entry/exit together.
- **Drop yards:** large east trailer-storage lot (multiple rows) + a south drop block. dropYard TRUE, dropArea 50+.
- **Dock aprons:** east face (long) + south/SW face.
- **Metrics:** ~58 dock doors, ~130 trailers visible, ~180 trailer capacity, 1 truck gate, 1 building complex, ~68 acres, no rail.
- **Rail:** a rail corridor runs west of 20th St through the residential area but does not enter the property → railServed FALSE.

## Web findings
- Primo Brands / BlueTriton subsidiary; one of Zephyrhills' three Florida water factories (Zephyrhills, Madison, High Springs). ~250 employees. Water piped ~3 mi from Crystal Springs.

## Final confidence
HIGH on location, gate, fencing, and the large-scale dock/drop classification. Uncertain on the exact dock-door count (banded conservatively at 50+), the remote-GS pedestal read, and ship/receive separation (function not confirmable from overhead).
