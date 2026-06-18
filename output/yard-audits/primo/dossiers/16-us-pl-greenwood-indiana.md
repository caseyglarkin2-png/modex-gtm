# US PL Greenwood Indiana — Deep Audit Dossier

**Facility:** US PL Greenwood Indiana (Primo Brands / BlueTriton — 1055 N Graham Rd distribution center)
**City:** Greenwood, IN (Indy South Logistics Park, metro Indianapolis)
**Type:** Bottling plant (PL) — see note (this Graham Rd site is a distribution center)
**Resolved center:** 39.62550, -86.06120
**Maps:** https://www.google.com/maps/@39.62550,-86.06120,400m/data=!3m1!1e3
**Confidence:** MEDIUM

## Location resolution
The supplied coordinates (39.5945, -86.1167) sat ~5.6 km SW — likely pointing at the OTHER Greenwood BlueTriton/Primo facility on Long Ridge Rd / Commerce Pkwy. Google geocoding of 1055 N Graham Rd, Greenwood IN 46143 returned 39.6295, -86.0630 (on N Graham Rd at the road). Web (LoopNet, Primo/BlueTriton listings, Indy South Logistics Park) confirms Primo Brands operates the large red-banded distribution building immediately SE of that point. Center locked ~39.6255, -86.0612.

**Note on type:** The 1055 Graham Rd building is a cross-dock spec distribution center, not an active bottling line; the actual Greenwood bottling plant appears to be the separate 900 Long Ridge Rd facility. I audited the Graham Rd building per the supplied address and kept the type "Bottling plant (PL)" as instructed.

**Building identity:** The brick peaked-roof building with a flag directly on N Graham Rd (front) is a separate fire/EMS station, not part of the DC (confirmed in Street View). The audited building is the large tan/red-banded cross-dock warehouse behind it.

## What the key views showed
- **Area (z16/z17):** A logistics park of big-box DCs; the Primo building is the red-banded cross-dock east of Graham Rd, with retention ponds N/E and farmland beyond.
- **East face (z18):** Dock bank with trailers backed in, paved truck court, retention pond beyond.
- **West face (z18):** Second dock bank with trailers backed in, office/parking front, fire station (separate).
- **Street View (Graham Rd + internal drives, 2025-05):** Open driveways, open office/parking front, open truck courts on both faces, no gate or guard booth, no perimeter fence.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE** (medium confidence). Open spec-DC driveways and truck courts, no barrier/gate/booth, no perimeter fence. A yard gate could be added out of frame.
- **Guard shack: FALSE.** No booth at any entrance.
- **Remote GS: FALSE.** No confirmed truck gate.
- **Docks: 50+.** Cross-dock with banks on both long faces (~30-40 each), combined ~60-70 → banded 50+. Two opposite-face banks → shipRcvSeparate TRUE; the dual-face court layout → entryExitSeparate TRUE (medium confidence).

## Yard zones and counts
- **Perimeter:** ~30 acres (DC building + both truck courts + parking; excludes the separate fire station and the building to the south).
- **Drop yard:** none — this is a live cross-dock; trailers are at doors / modestly staged (10-25). dropYard FALSE, dropArea 10-25.
- **Dock aprons:** east face + west face.
- **Metrics:** ~65 dock doors, ~35 trailers visible, ~60 capacity, 1 building, ~30 acres, no rail.

## Web findings
- Primo Brands (BlueTriton) operates at 1055 N Graham Rd, Greenwood; a separate BlueTriton/Primo facility exists at 900 Long Ridge Rd in Greenwood (likely the bottling/production site).

## Final confidence
MEDIUM. Location and tenant confirmed. Gate/guard FALSE based on the open logistics-park layout. Dock count banded 50+ (cross-dock, both faces); ship/receive and entry/exit separation inferred from the dual-face cross-dock geometry. Type kept as PL per instruction though the site functions as a DC.
