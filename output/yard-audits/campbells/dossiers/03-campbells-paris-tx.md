# Deep-Audit Dossier — Campbell's, Paris TX

**Roster idx:** 3
**Type:** Manufacturing - sauces (flagship sauce facility; soup production ceased July 2024)
**Address:** 500 NW Loop 286, Paris, TX 75460
**Resolved center:** 33.690500, -95.561000
**Confidence:** medium

## Location confirmation
Roster coordinates (GEOMETRIC_CENTER, ~1800 m offset) landed inside the plant
footprint. Satellite probes z16-18 revealed a large industrial manufacturing
campus with a main plant building, large NW warehouse blocks, extensive trailer
drop yards, big employee parking lots, and an active rail line on the east
side. NW Loop 286 runs along the south. This is the Campbell's Paris plant,
now the company's flagship sauce facility (soup production ended July 2024).

## Key views
- **z16/z17 wide:** Full campus — plant building center/east, trailer drop
  yards NW, employee parking SW/center, rail line on the east edge.
- **z18 east:** Rail spur with rail cars along the plant's east side.
- **z19 NW:** Drop yard with many rows of parked trailers (100+).
- **z19 NW gate:** Trailers backed into a dock bank.
- **Street View NW Loop 286:** Plant set well back behind grass buffer and
  perimeter fence; main entrance road with a Campbell's sign at ~33.6865.

## Gate / guard-shack determination
- **Truck gate: TRUE.** Main entrance road off NW Loop 286 at ~33.6865,
  -95.5622 with Campbell's branding. The plant is perimeter-fenced; a controlled
  gate sits inside, set back from the public road.
- **Guard shack: FALSE (medium confidence).** The plant sits too far back from
  NW Loop 286 to see any gate booth on Street View. Classified `remoteGs: true`
  (likely kiosk / remote check-in) but flagged uncertain.
- Long entrance approach and large internal yard -> `drivewayLong`,
  `postGateStaging`, `fastLaneOpportunity`.

## Yard zones and counts
- **Perimeter:** ~1170 m N-S x ~510 m E-W -> ~110 acres.
- **Drop yard:** Large NW lot with 100+ trailers; capacity ~170.
- **Dock aprons:** Dock banks on the NW warehouse and main plant face.
- **Dock doors:** ~50 estimated (banded 50+, low confidence).
- **Buildings:** 6+ distinct structures -> `multipleFacilities` true.
- **Rail: SERVED.** Active rail line / spur along the east edge with rail cars.

## Web findings
Campbell's converted the Paris plant from soup to its flagship sauce facility
in 2024 (Food Business News). Setting is edge-of-town / rural — Paris is a
small Texas city, plant ringed by open land and the rail corridor.

## Final assessment
Medium confidence. Large multi-building sauce manufacturing campus, rail-served,
with a very large trailer drop yard and a controlled but set-back truck gate.
Guard-shack vs remote check-in unresolved from imagery. Dock count and
entry/exit lanes also uncertain.
