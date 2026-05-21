# Deep-Audit Dossier — Pepperidge Farm, Richmond UT

**Roster idx:** 6
**Type:** Manufacturing - bakery (Goldfish crackers, +50% capacity 2024)
**Roster address:** 350 South 200 West (imprecise)
**Resolved address:** 901 N 200 W / 901 US-91, Richmond, UT 84333
**Resolved center:** 41.939600, -111.816300
**Confidence:** medium

## Location confirmation
Roster coordinates (RANGE_INTERPOLATED) landed in the central/south part of the
small town of Richmond, in residential/farmland — no plant there. Web search
established the plant address as 901 N 200 W. Satellite probes north of the
roster point located a large industrial bakery on the west side of 200 West:
a long N-S building with silos, dock banks, a rail spur, and yard areas. This
is Pepperidge Farm's Richmond plant — its only manufacturing facility west of
the Rocky Mountains, a Goldfish/Milano bakery (+50% Goldfish capacity 2024).

## Key views
- **z16/z17 wide:** Large N-S bakery building on the west side of 200 West,
  with a rail spur along the west edge, dock banks on the south face, process
  equipment in the north yard, and employee parking on the east.
- **z18/z19 south:** Dock banks with trailers backed in along the south
  building face plus a drop-yard apron.
- **z19 north:** Rail spur with rail cars/tankers; process equipment.
- **Street View 200 West:** Plant set back behind grass buffers; employee
  parking lots fronting the road; no gate or booth visible.

## Gate / guard-shack determination
- **Truck gate: TRUE (low-medium confidence).** Plant set back from 200 West;
  truck access via an access road off 200 West into the south/north yard. No
  barrier arm or booth was visible on Street View; a controlled gate is
  inferred but flagged uncertain.
- **Guard shack: FALSE (low-medium confidence).** No guard booth visible from
  the public-road frontage. Classified `remoteGs: true`, flagged uncertain.
- Short internal approach -> `drivewayShort`; paved yard inside ->
  `postGateStaging`.

## Yard zones and counts
- **Perimeter:** ~755 m N-S x ~370 m E-W -> ~80 acres.
- **Drop yard:** Trailer drop yard / dock apron along the south building face;
  ~25 trailers visible, capacity ~50.
- **Dock doors:** ~35 estimated along the south face (banded 25-50, low
  confidence).
- **Buildings:** Single large bakery building with attached process
  structures -> `multipleFacilities` false.
- **Rail: SERVED.** Rail spur along the west side with rail cars/tankers.

## Web findings
Pepperidge Farm Richmond is the company's only plant west of the Rockies, a
Goldfish/Milano bakery operating since 1974, with a $45M expansion in 2013 and
a +50% Goldfish capacity expansion (new line) in 2024 (Utah GOEO, Food Business
News, hjnews per roster). Rural setting — edge of the small town of Richmond,
surrounded by farmland.

## Final assessment
Medium confidence. Single large Goldfish/Milano bakery, rail-served, with a
modest south-side drop yard. Set well back from 200 West; gate/guard-shack
could not be confirmed from imagery and are flagged uncertain. Location
required web research as roster coordinates were imprecise.
