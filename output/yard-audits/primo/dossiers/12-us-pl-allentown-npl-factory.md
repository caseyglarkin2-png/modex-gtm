# US PL Allentown NPL Factory — Deep Audit Dossier

**Facility:** US PL Allentown NPL Factory (Primo Brands / BlueTriton — Nestlé Pure Life line, 405 Nestle Way)
**City:** Breinigsville, PA (Upper Macungie Twp, Lehigh Valley)
**Type:** Bottling plant (PL)
**Resolved center:** 40.57300, -75.63140
**Maps:** https://www.google.com/maps/@40.57300,-75.63140,400m/data=!3m1!1e3
**Confidence:** MEDIUM

## Location resolution
The supplied coordinates (40.5280, -75.6350) sat ~5 km too far south. Google geocoding of 405 Nestle Way, Breinigsville PA 18031 returned 40.5732, -75.6315, which lands on a very large white-roof building on the Nestlé/BlueTriton/Primo Lehigh Valley campus. Reporting (nestleusa.com, wfmz.com) confirms there are **two** Primo bottling plants in Breinigsville (≈500 employees combined) producing Nestlé Pure Life (NPL) and Deer Park brands.

## How the NPL building was separated from the main plant
The campus has two distinct structures:
1. A dense **NE production/process complex** (dark roofs, tanks/utilities, a red-roof building, ~40.5745, -75.6300) — the primary "main Allentown plant" (idx 4) process halls.
2. This **distinct stand-alone white-roof building at 405 Nestle Way** (~40.5730, -75.6313) with its own dual dock banks, NW trailer drop yard, and an east-side rail siding.

I audited only the 405-Nestle-Way building footprint and its immediate yards as the NPL line, and treated the NE process complex as the separate main plant. The two are physically separated by an internal road and grass median; the perimeter polygon traces only the 405 building, not the process complex. (As requested, the separation method is recorded here and in fieldNotes.)

## What the key views showed
- **Campus (z15/z16):** A multi-building Nestlé/Primo complex within a larger Lehigh Valley industrial park; many adjacent third-party warehouses required care to isolate the Nestlé building.
- **405 building (z18):** A long rectangle oriented roughly NE-SW, dock banks on both long faces, internal road loops, a NW trailer drop yard, and rail along the east.
- **West face (z19):** A long continuous dock bank, ~20-25 angled bays with trailers backed in; a covered apron structure mid-drive.
- **East face (z19):** A second dock bank plus multiple parallel N-S rail tracks hugging the building with rail cars/trailers staged — a rail siding serving the building.
- **Street View (Nestle Way, 2025-05):** Open driveway, blue monument sign, employee parking — no barrier gate or guard booth at the building approach.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE** (medium confidence). Street View shows an open driveway, no barrier/gate/booth. The building sits inside an open corporate-park road network; a campus-level gate could exist at the public-road entrance off Schantz/Nestle Way, outside captured frames.
- **Guard shack: FALSE.** No staffed booth at the approach.
- **Remote GS: FALSE.** No confirmed truck gate.
- **Docks: 50+.** Banks on both long faces (west ~20-25 bays + east bank along rail). Combined ~50-60, banded 50+. Two opposite-face banks → ship/receive likely separate (medium confidence).

## Yard zones and counts
- **Perimeter:** ~32 acres for the NPL building footprint + west drop yard + east rail apron.
- **Drop yard:** NW trailer rows (~25-40 trailers), dropArea 25-50, dropYard TRUE.
- **Dock aprons:** west face (long) + east face (along rail).
- **Rail:** parallel tracks directly along the east face → railServed TRUE (medium confidence; a pass-by line vs in-dock spur could not be fully distinguished).
- **Metrics:** ~55 dock doors, ~95 trailers visible, ~130 capacity, 1 building, ~32 acres, rail served.

## Web findings
- Primo/BlueTriton Lehigh Valley operation; two Breinigsville plants (NPL + Deer Park brands), ~500 employees, water from seven eastern-PA spring sites; $79M two-year expansion completed 2017.

## Final confidence
MEDIUM. Location and building separation are solid; gate/guard determinations rely on the open-campus Street View (no perimeter barrier seen at the building, but a campus gate elsewhere is possible). Dock count banded conservatively at 50+; rail service confirmed by adjacency.
