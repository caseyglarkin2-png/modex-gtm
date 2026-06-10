# Deep-Audit Dossier — Tractor Supply Distribution Center, Waverly NE (idx 08)

- **Facility:** Tractor Supply Distribution Center Waverly NE
- **Type:** Distribution Center
- **Address:** 12851 Dovers St, Waverly, NE 68462
- **Resolved center:** 40.90155, -96.54755
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation

Supplied approximate coords (40.901501, -96.547517) landed directly on a large
distribution building, only slightly south of true building center. Web search
on the address ("12851 Dovers St, Waverly NE") returned multiple listings for
the **Tractor Supply Co. Waverly Distribution Center**, confirming the address
and facility. Satellite at z16-z18 shows a single very large rectangular
warehouse (long axis nearly N-S, a few degrees clockwise of north) consistent
with a regional DC — not an office or retail box. Center locked at
40.90155, -96.54755. (Note: a separate Tractor Supply **retail store** sits at
the corner across the public road to the NE — the red-roofed building visible
in Street View — and is NOT the DC.)

## Setting

Rural. The DC sits at the edge of a developing industrial park off the I-80
corridor near Waverly. Open farmland wraps the south and west; a borrow
pit/undeveloped land is immediately west; other industrial buildings (different
companies) sit to the east. Street View east/north along the public road shows
open country. Per the rubric's "torn between small-town industrial and Urban,
choose Rural," this is clearly Rural.

## Key views

- **z18/z17 overview:** Large rectangle, dock doors lined with trailers along
  the FULL length of both the east and west long walls (cross-dock). North end
  holds two large banks of trailer drop-yard rows plus an employee parking lot
  and a smaller secondary building at the NW.
- **West dock face (z19):** Continuous dock doors with trailers backed in, plus
  a second outboard row of parked/drop trailers.
- **East dock face (z19):** Continuous dock doors with trailers backed in along
  the entire wall.
- **South end (z19):** Building end wall backs directly onto plowed farmland —
  no docks on the short walls.
- **North drop yard (z19):** Two banks of marked trailer rows, mostly full of
  bobtail (no-tractor) trailers.

## Gate / guard-shack determination

- **Truck gate: TRUE.** The site is fully fenced — 2025-05 Street View frames
  from the perimeter road (40.9045, -96.5462) clearly show a continuous
  chain-link perimeter fence enclosing the trailer yard with trailers (blue,
  CFI, green, white) parked inside. Trucks enter via a single divided entry
  boulevard off the public road (pano at 40.90623, -96.54759). The driveway
  pinches at an interior checkpoint between the employee parking lot and the
  secured yard.
- **Guard shack: TRUE.** Satellite z20 at 40.9035, -96.5476 shows a small
  (~1-2 vehicle-footprint) gatehouse structure sitting on a median island in
  the middle of the driveway, splitting inbound/outbound lanes, positioned
  exactly between the parking lot (cars) and the trailer drop yard (trailers).
  This is a classic staffed entry booth. (No usable interior Street View — the
  only nearby interior pano is 2007-08, predating construction.)
- **remoteGs: FALSE** — a guard shack is present.

## Yard zones traced

- **perimeter** — 8-vertex ring tracing the fenced property: north drop-yard
  edge (~40.9043) down to the south building end (~40.8995), west fence
  (~-96.5490) to east fence (~-96.5461). ~78 acres.
- **truckGate** — small quad over the interior gatehouse/checkpoint
  (~40.9035, -96.5476).
- **dropYards** — two rings over the two northern trailer-row banks.
- **dockAprons** — two long thin rings hugging the east and west dock walls at
  the building's true (slightly rotated) orientation.
- **staging** — interior apron between the inner gate and the dock faces
  (post-gate holding/queue space).

## Yard metrics (overhead estimates)

- **dockDoorCount ~110** — roughly 50-60 doors per long face, both walls fully
  docked (50+ band).
- **trailersVisible ~230** — dense trailer presence across both dock rows and
  the north drop banks.
- **trailerParkingCapacity ~180** — marked drop-row capacity north + west row.
- **truckGateCount 1** — single controlled entry boulevard.
- **buildingCount 2** — main DC + smaller NW secondary building.
- **siteAreaAcres ~78** — from perimeter polygon.
- **railServed FALSE** — a through rail line runs ~300m+ south through farmland
  but no spur enters the property.

## Classification highlights

- truckGate TRUE, guardShack TRUE, remoteGs FALSE
- postGateStaging TRUE, drivewayLong TRUE (deep divided approach holds 3+ trucks)
- entryExitTogether TRUE (single entry boulevard), entryLanes ~1 / exitLanes ~1
- fastLaneOpportunity TRUE (wide median boulevard + apron, room for a bypass)
- dockDoors 50+, dropArea 50+, shipRcvSeparate TRUE (east + west dock banks)
- dropYard TRUE, scale FALSE, multiStep FALSE, multipleFacilities FALSE
- urbanRural Rural, connectivityIssue FALSE (developed park near I-80)

## Web findings

Listings (Waze, Yelp, n49, Loc8NearMe, Nextdoor) confirm "Tractor Supply Co.
Waverly Distribution Center" at 12851 Dovers St, Waverly NE 68462, phone
(402) 786-6100, described as a warehousing/distribution operation serving
Tractor Supply, with driver-facing notes (parking, restrooms, some limited
overnight parking). Corroborates the DC identity and truck-traffic profile.

## Final confidence: HIGH

Building identity unambiguous, imagery clear, gate + guard shack + dock/drop
layout all confirmed from multiple frames. Uncertain: exact dock-door count
(banded), precise entry/exit lane count, scale (none seen), and connectivity
(inferred).
