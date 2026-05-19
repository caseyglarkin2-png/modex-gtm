# Deep-Audit Dossier — K-C Owensboro Plant, Owensboro KY (idx 6)

## Resolved location
- **Confirmed:** 601 Innovative Way, Owensboro, KY 42301
- **Locked center:** 37.819400, -87.303200
- The roster geocode flagged `movedMeters: 21762`, which looked alarming, but
  this only reflects the geocoder starting from the Owensboro city centroid.
  The supplied roster coordinates (37.819139, -87.302856) land squarely on a
  large industrial complex, and an independent public-records coordinate
  (37.8188, -87.3031) is essentially identical — so the roster point is
  correct.
- Web search confirms K-C operates a diaper / personal-care manufacturing
  plant at 601 Innovative Way (also building a steam-production facility there
  per local press). Satellite shows a large multi-building manufacturing +
  distribution complex on a peninsula bounded by the Green River, with
  extensive trailer parking — consistent with the facility type.

## Key views
- **Overview (z15-16):** Sprawling rural campus — manufacturing building
  cluster, a large separate warehouse/DC, on-site wastewater treatment plant
  (clarifiers + water tank, SW), steam/utility plant, and an office front.
  Single retention lake on the north side. Surrounded by farm fields and the
  Green River — clearly rural.
- **Entrance (Street View 2019):** Innovative Way reaches the property at an
  open, campus-style entrance with a Kimberly-Clark monument sign and a
  manicured-lawn approach drive. No barrier arm or gate at the public road.
- **Office front (z19):** A landscaped roundabout / fountain drive serves the
  office and employee parking — open, no checkpoint.
- **Truck route (z19-20):** A separate truck route runs NW into the drop yard.
  At ~37.8211,-87.3053 the route pinches and there is fencing plus a small
  structure with parked vehicles beside the lane — an internal truck-yard
  checkpoint.
- **Drop yard (z19-20):** Very large trailer parking field NW of the main
  building — 100+ trailers in long rows.
- **Dock face (z20):** Long bank of trailers backed against the NW edge of the
  main warehouse/DC building — the primary dock apron.

## Gate / guard-shack / dock determinations
- **truckGate = true (low-medium confidence):** No barrier at the public-road
  entrance (open campus). An internal pinch-point with fencing controls the
  truck drop yard — classed as the truck gate. Listed in `uncertainFields`.
- **guardShack = false / remoteGs = true:** No staffed booth could be resolved
  at z20-21 either at the public entrance or the internal checkpoint. A small
  structure sits beside the internal truck lane but cannot be confirmed as a
  guard booth. Best estimate is remote / kiosk-style check-in.
- **dockDoors = 50+:** ~55 doors estimated from the long dock face with many
  trailers docked.
- **dropArea = 50+ / dropYard = true:** 100+ trailers parked in dedicated rows
  — a major drop yard.

## Yard zones and counts
- **Perimeter:** ~230 acres (large rural campus including buffer land).
- **Drop yards:** Two — the main NW trailer field and a secondary apron lot.
- **Dock apron:** One long apron on the NW building face.
- **dockDoorCount ~55, trailersVisible ~160, trailerParkingCapacity ~220,
  buildingCount ~6, railServed false.** All counts are honest overhead
  estimates.

## Web findings
- K-C Owensboro: diaper / personal-care manufacturing plant; local press
  (messenger-inquirer, 14news, 2020) confirms a steam-production facility
  build-out on site. Greater Owensboro Chamber and Kentucky manufacturers
  association list K-C Corp at this address.

## Final confidence
**Medium.** Location is certain and the macro layout is unambiguous (large
manufacturing + DC campus, big drop yard, long dock face). The gate / guard
determinations are the weak point: the public entrance is open, and the
internal truck checkpoint structure cannot be positively confirmed as a
staffed booth from available imagery (Street View does not reach inside the
property).
