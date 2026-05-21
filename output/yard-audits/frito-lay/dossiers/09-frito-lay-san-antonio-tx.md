# Deep-Audit Dossier — Frito-Lay San Antonio TX (idx 09)

## Resolved location
- **Address:** 4855 Greatland Dr, San Antonio, TX 78218
- **Locked center:** 29.472769, -98.396782 (rooftop process-equipment cluster)
- **Confirmation:** Web search corroborated the address and a published coordinate
  (29.472769, -98.396782) matching the roster point. Satellite shows a large
  multi-building manufacturing campus with rooftop silos, ducting and exhaust
  stacks — unmistakable food-manufacturing plant, not an office. The roster
  point landed on the NE building corner; center re-locked on the process core.

## Key views
- **z17/z18 overview:** Central building cluster of ~4 interconnected large
  buildings in the dense Northeast San Antonio / Tri-County industrial park,
  immediately west of I-35. Employee parking to the north, dock banks on the
  south and east faces, trailer drop yard on the east/southeast.
- **z19 south/east docks:** Continuous dock bank along the south building face
  with orange-cab Frito-Lay tractors backed in; a second dock run on the east
  face with many trailers backed in. Rows of parked trailers fill the east and
  southeast yard.
- **z20-21 detail:** Modular office trailers staged inside the yard; landscaped
  office entrance with blue canopy on the north (employee) side.
- **Street View (2024-11):** Greatland Drive is a public industrial street lined
  with parked trailers. The plant frontage is chain-link fenced; the process
  tower and a controlled fenced entrance opening are visible mid-block, with a
  small structure beside the entrance consistent with a guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The plant is fully chain-link fenced (confirmed in 2024
  Street View along the west/Greatland frontage and NW side). Truck access
  passes through a controlled fenced opening off the internal driveway.
- **guardShack = true (medium confidence, flagged).** Street View shows a small
  booth-scale structure beside the entrance fence opening near the plant
  facade. Partly obscured by parked trailers and viewing distance, so flagged
  in uncertainFields. remoteGs = false accordingly.
- **dockDoors = 50+.** Dock banks on the south face (Frito-Lay tractors backed
  in) and the east face (trailers backed in) aggregate well past 50 doors.
- **dropArea = 50+ / dropYard = true.** 60-75+ trailers parked in rows across
  the east and southeast yard — a dedicated drop yard.
- **shipRcvSeparate = true.** Two distinct dock clusters on different building
  faces (south and east).

## Yard zones and counts
- **Perimeter:** ~360 m N-S x ~400 m E-W campus, ~33 acres.
- **Drop yards:** east yard (largest) plus a north-side trailer area.
- **Dock aprons:** south face apron and a southwest face apron.
- **Staging:** an interior paved area between the gate and the dock cores.
- **yardMetrics:** dockDoorCount ~60, trailersVisible ~75, capacity ~110,
  truckGateCount 1, buildingCount 4, siteAreaAcres ~33, railServed false (rail
  runs in the adjacent SE corridor but no spur enters the property).

## Web findings
- Frito-Lay Manufacturing Plant, 4855 Greatland Dr, San Antonio, TX 78218;
  (210) 662-2100; 24/7 operation; ~250-499 employees; processes 150M+ lbs of
  potatoes annually (Yelp, Foodstuffs, PotatoPro, TruckMap).

## Final confidence: medium
Location and overall layout are unambiguous. Guard-shack call and exact lane
counts are limited by Street View distance/obstruction and are flagged.
