# Deep-Audit Dossier — idx 19

## John Deere North American Parts Distribution Center — Milan, IL

**Type:** Parts Distribution Center
**Roster address:** 1600 1st Ave E, Milan, IL 61264
**Resolved center:** 41.44750, -90.54550
**Confidence:** medium

## Step 0 — Location confirmation
The roster coordinate (41.451196, -90.544568, geocoded ROOFTOP, only 6 m
correction) landed on the NE area of an enormous single warehouse structure.
Satellite probes at z15-z17 confirm a vast distribution center building with
extensive trailer drop yards and dock activity. Web research confirms identity:
John Deere North American Parts Distribution Center, 1600 1st Ave E, Milan IL -
the primary parts DC for Deere & Company in North America, 2,800,000 sq ft, one
of the largest DCs in the nation, operating since 1973, 800K+ SKUs, up to
~450K orders/week. Audited site is correct. Center coordinate adjusted slightly
SW to the building's true centroid.

## Site layout
A single-building mega-DC operation:
- **Main building:** the 2.8M sq ft warehouse - a continuous dark roof covering
  the great majority of the site. An office wing is attached at the NE corner
  (glass-fronted, with a circular visitor drive and flagpole).
- **East face:** the primary dock bank - a continuous line of trailers backed
  into dock doors running the full length of the building's east wall.
- **Drop yards:** very large trailer-storage yards along the east and south
  sides of the building - hundreds of trailers parked in long rows, plus
  intermodal containers. One of the largest trailer-staging operations seen.
- **NE:** employee parking and a landscaped retention pond.
- **Surroundings:** farmland to the south, residential to the east, a highway
  interchange (I-280 area) to the NW.

## Key views
- z15/z16 overview: confirmed the full DC building + drop yards.
- z16/z17 building: dock activity along the east face; vast trailer yards.
- z18/z19 docks: continuous dock bank, trailers backed into the building wall.
- z20 east dock: trailers perpendicular to the building, backed into dock doors.
- z19 drop yards: hundreds of trailers in long rows + intermodal containers.
- z18 north entrance / z20 entrance drive: a wide open private entrance drive
  off the north arterial road - no barrier arm, gate, or booth visible.
- Street View office entrance (2019): glass-fronted office wing, circular drive,
  flagpole - the visitor/office entrance, uncontrolled.
- Street View arterial road (2019/2023/2025): DC frontage landscaped with the
  retention pond; no controlled gate at the street.

## Gate / guard-shack / dock determinations
- **truckGate: false.** No barrier arm, sliding gate, or controlled checkpoint
  was observed at the property-line entrance. The DC is accessed via a wide
  open private entrance drive off the north arterial road. The office entrance
  is an uncontrolled circular drive. A facility this large very likely has
  internal gate stations (driver tips reference numbered "gates"), but no
  street-level controlled gate was confirmed in imagery - classified false on
  visible evidence. Flagged uncertain.
- **guardShack: false.** No guard booth observed at the property-line entrance
  or the office entrance. Internal gate stations may exist but none was
  confirmed as a staffed booth at a property-line truck entrance.
- **remoteGs: false.** Precondition (a confirmed controlled truck gate) not met.
- **dockDoors: 50+.** The 2.8M sq ft building has a continuous dock bank running
  the full length of its east face, with trailers backed in along its entire
  length. Estimated ~90 doors - confident band, lower-confidence exact count.
- **dropArea / dropYard: true, 50+.** Enormous trailer drop yards along the east
  and south sides - hundreds of parked trailers in long rows plus intermodal
  containers.
- **fastLaneOpportunity: true.** The open entrance drive has ample paved width
  and a wide apron - physical room for express/bypass lanes.
- **shipRcvSeparate: false.** Dock activity is concentrated on the east face;
  no clearly separate shipping vs. receiving clusters on different faces.
- **scale: false.** No truck scale in the truck path.
- **multipleFacilities: false.** One DC building with an attached office wing.
- **urbanRural: Rural.** Milan is a small town on the Quad Cities metro edge;
  the DC is surrounded by farmland, residential, and a highway interchange.

## Yard metrics
- dockDoorCount ~90 (band 50+; continuous east-face dock bank)
- trailersVisible ~350 across the captured drop-yard imagery (estimate)
- trailerParkingCapacity ~500 (very extensive drop yards)
- truckGateCount 1 (single main entrance drive; internal gates not counted)
- buildingCount 2 (the warehouse plus the attached office wing)
- siteAreaAcres ~215 (2.8M sq ft footprint ~64 ac + drop yards, parking, grounds)
- railServed false (no rail spur into the property)

## Web findings
BBB, CLUI, Chamber of Commerce, Waze, Deere.com: John Deere North American
Parts Distribution Center, 1600 1st Ave E, Milan IL - 2,800,000 sq ft, the
primary North American parts DC for Deere & Company, one of the largest DCs in
the nation, operating since 1973, 800K+ SKUs, handling up to ~450K orders/week.
Driver tips reference numbered gates (e.g. "Gate 4"), implying multiple internal
gate/check-in points.

## Final confidence: medium
Facility identity and the scale of the dock and trailer-yard operation are
certain. The gate/guard determinations are medium-confidence: no controlled
gate or guard booth was visible at the property-line entrance, but a DC of this
size likely has internal gate stations that overhead imagery and roadside
Street View cannot fully resolve - the gate-related fields are flagged
uncertain. Dock-door and trailer counts are honest estimates over a very large
site.
