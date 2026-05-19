# Deep-Audit Dossier — Pepperidge Farm, Willard OH

**Roster idx:** 5
**Type:** Manufacturing - bakery (primary Goldfish cracker plant)
**Roster address:** 601 Tegtmeyer Road (incorrect)
**Resolved address:** 3320 State Route 103 E, Willard, OH 44890
**Resolved center:** 41.054400, -82.708500
**Confidence:** medium

## Location confirmation
Roster coordinates (APPROXIMATE, moved only 6 m) landed in a residential
neighborhood of Willard — clearly wrong. Web search established the plant
address as 3320 State Route 103 E. Satellite probes east of Willard along
SR-103 located a large industrial bakery complex with silos, extensive trailer
drop yards, and dock banks. Street View at the access drive confirmed a
Pepperidge Farm sign. This is the primary Goldfish cracker bakery.

## Key views
- **z16/z17 wide:** Large bakery plant with silos, attached process buildings,
  a big NE warehouse block, very large trailer drop yard on the east, employee
  parking SW; rail corridor north of the property (no spur in).
- **z19 east:** Drop yard with many rows of parked trailers (100+).
- **z19 north:** Extensive dock banks with trailers backed in.
- **Street View SR-103 / access drive:** Plant set back behind grass buffers;
  single access road with a Pepperidge Farm sign; chain-link fence along the
  access drive.

## Gate / guard-shack determination
- **Truck gate: TRUE.** Single access road off SR-103 E at ~41.0533, -82.7137.
  Chain-link perimeter fencing visible along the access drive; a controlled
  gate is inferred inside the property.
- **Guard shack: FALSE (medium confidence).** No guard booth visible at the
  public-road junction — the plant sits well back behind a grass buffer.
  Classified `remoteGs: true` (likely kiosk / remote check-in), flagged
  uncertain.
- Long access drive and large internal yard -> `drivewayLong`,
  `postGateStaging`, `fastLaneOpportunity`.

## Yard zones and counts
- **Perimeter:** ~580 m N-S x ~770 m E-W -> ~110 acres.
- **Drop yard:** Very large east-side lot with 100+ trailers; capacity ~180.
- **Dock aprons:** Dock banks on the north and around the plant.
- **Dock doors:** ~50 estimated (banded 50+, low confidence).
- **Buildings:** 5+ distinct structures -> `multipleFacilities` true.
- **Rail:** Rail corridor runs north of the property but no spur enters it.

## Web findings
Pepperidge Farm Willard is the company's primary Goldfish cracker bakery, in
operation nearly 50 years, with a $40M 2019 investment (Norwalk Reflector,
Food Business News per roster). Rural setting — edge of the small town of
Willard, surrounded by farmland.

## Final assessment
Medium confidence. Large multi-building Goldfish bakery with a very large
east-side trailer drop yard. Truck gate present (perimeter-fenced); guard-shack
vs remote check-in unresolved from imagery. Location required web research as
roster coordinates were wrong.
