# Deep-Audit Dossier — idx 22

## DHL Supply Chain — DC — Obetz OH
**Type:** Distribution Center
**Resolved location:** 2160 McGaw Road, Obetz OH 43207 (McGaw Rd / Frusta Dr intersection)
**Locked center:** 39.86725, -82.94000
**Confidence:** medium

## Step 0 — Location resolution
The roster entry had no address or coordinates. Web research surfaced the
business listing **"Exel Logistics Columbus Public Warehouse, 2160 McGaw Rd,
Obetz OH 43207"** (Yelp, CMac) — Exel Inc. is DHL Supply Chain's legal entity
and legacy brand, and there is also an active CBRE industrial lease listing for
2160 McGaw Road. The Google Geocoding API would not resolve the McGaw Rd house
number (returned only the 43207 ZIP centroid). The building was located via
OpenStreetMap centerlines for McGaw Road (≈39.8674, -82.9431) and Frusta Drive
(≈39.8680, -82.9410); the CMac listing places 2160 McGaw at the McGaw/Frusta
intersection. Satellite probing at that intersection found a large white-roofed
warehouse, confirmed in Street View. Locked the building center at 39.86725,
-82.94000.

## Key views
- **Wide satellite (z15-17):** An industrial cluster south of Columbus between
  I-270/Alum Creek Drive and McGaw Road, in Obetz. The target is a
  parallelogram-shaped white-roofed warehouse on the NE side of McGaw Rd.
- **z18-19:** Employee parking on the NW side; the NE side has a paved dock
  apron / truck court shared with the building to the north. SW and SE faces
  are windowless metal walls with no docks.
- **Street View (2019-09 + 2025-07):** The NE dock face shows a row of dock
  doors with trailers backed in and a tractor-trailer maneuvering. The dock
  court is open paved area with NO perimeter fence and NO gate.

## Gate / guard-shack / dock determinations
- **Truck gate — FALSE.** No gate, barrier arm, or checkpoint at any approach.
  The NE dock court is open and reached directly from the public service road.
  Confirmed across 2019 and 2025 imagery. (Imagery partly dated — flagged
  uncertain.)
- **Guard shack — FALSE.** No staffed booth anywhere on the site.
- **Remote gate system — FALSE.** No gate, so not applicable.
- **Dock doors — 25-50.** Dock doors line the NE face; 2019 Street View shows
  the door row with trailers backed in. Exact count not resolvable from
  overexposed z20 satellite — banded estimate, flagged uncertain.
- **Drop yard — FALSE.** Only a few trailers in the open dock court; no
  dedicated trailer-storage lot.

## Yard zones and counts
- **Perimeter:** ~20.4 acres — building + NW parking + NE dock court +
  perimeter drives.
- **Truck gate:** none (null).
- **Drop yards:** none.
- **Dock apron:** the paved strip along the NE face.
- **Staging:** none (no gate, so no pre/post-gate staging).
- **Metrics:** ~32 dock doors (banded 25-50), ~9 trailers visible, ~12 trailer
  capacity, 0 truck gates, 1 building, no rail.

## Web findings
- 2160 McGaw Road is documented as the "Exel Logistics Columbus Public
  Warehouse" — a public/contract warehouse operated under the Exel / DHL
  Supply Chain umbrella.
- A CBRE industrial lease listing shows ~125,100 sq ft available for lease at
  the address, suggesting the building is partly vacant or in transition;
  current satellite shows light yard activity, consistent with that.

## Final confidence
**Medium.** The address is well-corroborated and the building is positively
located, but Google geocoding could not pin the house number (resolved via OSM
+ imagery), the dock count is a banded estimate from partly dated imagery, and
the building appears partially vacant. Gate / guard-shack calls (both FALSE)
are firm from open-court imagery.
