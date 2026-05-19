# Deep-Audit Dossier — Caterpillar Winston-Salem NC Axle Plant (idx 17)

## Resolved location
- Roster gave 4770 Axle Dr, Winston-Salem, NC 27107, lat/lng 36.062052,-80.117703
  (geocode ROOFTOP, movedMeters 63). The point landed directly on the plant
  building — accurate.
- Confirmed via Gray Construction and Dun & Bradstreet listings and Caterpillar's
  own description: an 850,000 sq ft axle manufacturing facility (machining,
  assembly, test, painting) on a 102-acre site, opened Nov 2011, $426M investment,
  ~500 workers. Produces axle assemblies for the largest Cat mining trucks.
- **Locked center:** 36.06030, -80.11800 (main plant building).

## Key views
- z16-z17 probes: a single large rectangular plant building running roughly NW-SE,
  employee parking on the S side, retention ponds NW and E, woods buffer all around.
- z18-z19 N face: extensive outdoor laydown of axle components (pallets/stacks) plus
  dock doors with trailers backed in; an electrical substation NW of the building.
- z19 E face: process equipment (cylindrical test/paint tanks) and a secondary dock
  area with a few trailers.
- z19-z21 of the entrance: a private access road from Axle Dr leads past a
  CATERPILLAR monument sign to a gatehouse/booth where the road forks into the
  operational yard.
- Street View (2026-03): the plant sits behind a grassy buffer; the entrance has a
  Caterpillar monument sign and a small gatehouse building at the road fork.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A controlled private access road runs from the public road
  past the monument sign to a gatehouse checkpoint at the property entrance.
- **guardShack = true.** A small gatehouse building sits at the entrance road fork
  (36.0618,-80.1178), functioning as the security checkpoint. (A separate larger
  building to its W is the electrical substation, not the booth.)
- **dockDoors = "10-25".** This is a manufacturing plant, not a DC, so a modest dock
  count. Dock doors with trailers backed in are visible on the N and NE building
  faces; estimated ~14 doors — flagged as an overhead estimate.
- **postGateStaging / drivewayLong = true.** The access road is long with ample
  paved width inside the gate for 3+ truck stacking.
- **fastLaneOpportunity = true.** Wide entrance road with room to add a bypass lane.

## Yard zones and counts
- **Perimeter:** ~96 acres from the box (36.0575-36.0635 N, -80.1210 to -80.1145 W);
  the parcel is reported as 102 acres.
- **Drop yards:** trailers + heavy component laydown on the N apron; a secondary
  trailer area on the W face.
- **Dock apron:** N/NE building face, ~14 doors.
- **buildingCount = 1** (single main plant building → multipleFacilities = false).
- **railServed = false** — no spur into the property.

## Web findings
- Caterpillar Winston-Salem axle plant: 850,000 sq ft, 102-acre site, opened
  Nov 16 2011, $426M investment; machining/assembly/test/paint of axle assemblies
  for the largest Cat mining trucks; LEED-pursued. Address 4770 Axle Dr.

## Final confidence: high
Facility positively identified and located on accurate ROOFTOP coordinates; gate,
gatehouse, docks, and site structure clearly imaged. Dock-door and trailer-capacity
counts are honest overhead estimates and flagged.
