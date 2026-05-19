# Deep-Audit Dossier — Nestlé Beverage, Anderson IN (idx 8)

## Facility
- **Name:** Nestlé Beverage - Anderson IN
- **Type:** Beverage manufacturing plant + distribution center
  (aseptic RTD: Coffee mate liquid, Nesquik RTD, Boost)
- **Address:** 4301 W 450 S (a.k.a. 4301 W 73rd St), Anderson, IN 46011/46013
- **Locked center:** 40.03820, -85.74400

## Step 0 — Location confirmation (significant correction)
The roster coordinate (40.171509, -85.766582, RANGE_INTERPOLATED) landed in
open farmland roughly 15 km NW of the plant. Web research established that the
Nestlé Anderson factory + beverage distribution centre sits **south of
Anderson along I-69** (Roadside America: "I-69/Hwy 38 west of exit 222, north
side"; the landmark 50-ft Nesquik Bunny sign marks it). The correct building —
a ~1.1M sq ft multi-section plant with milk/liquid aseptic storage tanks on the
NE and very large trailer drop yards on the W — was located at ~40.0382,
-85.7440. Locked center 40.03820, -85.74400.

## Key views
- **z15-z17 overview:** Massive multi-section plant on a private campus inside
  an edge-of-Anderson industrial area; I-69 runs along the SE; buffer land,
  ponds, and farmland surround the campus; perimeter road loop.
- **z17-z18 W/SW:** Loading-dock banks with many trailers backed in; very large
  trailer drop yards (multiple long rows).
- **z19-z20 SW dock face:** Dock doors with trailers/trucks backed in.
- **z18 NE:** Aseptic process / liquid storage tanks (no rail spur).
- **z20 SW:** Large employee parking lot full of cars.
- **Street View (2024-25):** Public roads pass well south/west of the campus
  across buffer fields; the plant building is visible in the distance but no
  pano reaches the truck entrance.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (medium confidence).** A modern (2008-built, $359M)
  Nestlé beverage factory + distribution center on a fully private campus with
  a perimeter road loop. A controlled, guarded truck gate is near-certain for a
  food-grade beverage plant + DC of this scale; truck flow enters from the W.
  The exact barrier arm could not be isolated in satellite imagery and no
  public Street View reaches the entrance — flagged uncertain.
- **Guard shack — FALSE / uncertain.** No guard booth positively confirmed in
  overhead imagery. Classified guardShack false, remoteGs true as the
  conservative read; low confidence on the pair.
- **Docks — 50+ band.** Large dock banks on the W and SW building faces with
  many trailers backed in; estimated 50+ doors.
- **Drop yard — 50+ band, dropYard true.** Very large trailer drop yards on the
  W and SW — multiple long rows, well over 150 trailers visible.
- **Ship/receive separate — TRUE (medium).** Distinct dock clusters on the W
  (distribution) and SW (factory) faces.
- **Fast-lane opportunity — TRUE.** Wide paved aprons and a private road loop
  give clear room for an express/bypass lane.
- **Rail-served — FALSE.** No rail spur enters the property; truck-served only.

## Yard zones & counts
- **Perimeter:** ~850 m N-S x ~800 m E-W, ~80 acres campus footprint.
- **Truck gate zone:** W side where the access road enters the truck yard.
- **Drop yards:** two large lots (W and SW).
- **Dock aprons:** W face apron and SW face apron.
- **Staging:** paved area at the W truck-yard mouth.
- **dockDoorCount ~70, trailersVisible ~180, capacity ~260, buildings 2.**

## Web findings
- Nestlé invested ~$359M (2006-2008) to build its largest aseptic RTD factory
  + beverage distribution centre in Anderson; ~1.1M sq ft; ~600 employees;
  produces 3-4M bottles/day of Nesquik RTD, Coffee mate liquid, and Boost.
  Later $200M expansion announced. (Nestlé Global, Food Ingredients First,
  Reliable Plant, IBJ.)

## Final confidence: MEDIUM
The plant was positively located and is well-imaged from satellite, and the
yard layout / dock + drop-yard scale are clear. The roster coordinates were
badly off and had to be corrected. The guard-shack and exact gate details
could not be resolved (no Street View access, no clear satellite booth), so
those fields are flagged uncertain.
