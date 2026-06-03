# Yard Audit Dossier — Costco Van Buren Depot, Belleville MI

- **Facility:** Costco Van Buren Distribution Depot (Dry Depot — Great Lakes regional cross-dock)
- **Address:** 5860 Belleville Rd, Belleville (Van Buren Township), MI 48111
- **Resolved center:** 42.262550, -83.493000
- **Method:** deep-audit (satellite + Street View)
- **Confidence:** high
- **Maps:** https://www.google.com/maps/@42.262550,-83.493000,400m/data=!3m1!1e3

## Location confirmation

The roster coordinates (42.261743, -83.493681) landed on the south edge of the
correct building. Web search confirmed 5860 Belleville Rd as the "Costco Van
Buren Distribution Depot," a Costco truck distribution depot with an organized
driver check-in process, overnight parking and a dog run. Satellite at z15–z17
shows the matching signature: one very large light-gray cross-dock warehouse
with dock doors on both long faces and extensive trailer drop yards north and
south. Center locked to the warehouse footprint at 42.26255, -83.4930.

Context (z15): the depot sits in an edge-of-town industrial corridor in Van
Buren Township — a wastewater treatment plant to the NW, a public softball
complex directly north, farmland/wetland to the south, a residential
subdivision to the southeast, and a rail line passing east-west along the south
edge. Belleville Rd runs north-south along the east side of the property.

## Key views

- **z17/z16 overview:** Single dominant warehouse, long axis roughly E-W with a
  slight rotation. Dock doors with trailers backed in on BOTH the north and
  south long faces — classic cross-dock. Drop-yard trailer rows wrap the
  building north and south.
- **East end (z18/z19):** An office / driver check-in structure with a circular
  drive and a large employee car lot sits at the NE. A long divided entrance
  boulevard runs east from here to Belleville Rd.
- **Entrance boulevard (z19/z20 + Street View):** A ~300 m divided boulevard
  with a landscaped median connects Belleville Rd to the secured yard. Chain-link
  perimeter fence runs along it (Street View, 2024 and 2018 panos). Trailers are
  staged along the boulevard apron.
- **Gate (z18 NE-junction, z20 canopy):** A peaked-roof check-in canopy / booth
  spans the inbound truck lane at ~42.2636, -83.4924 where the boulevard meets
  the operational yard — separate from both the main warehouse and the office.
- **North drop yard (z18):** Massive paved lot packed with rows of parked
  trailers; northern boundary is the line where the softball park's green ends.
- **SW / SE (z18):** West fence line and retention pond at the SW; south face
  dock doors and a south drop row, then a treed buffer and the rail corridor.

## Gate / guard-shack / dock determinations

- **truckGate = true.** A controlled truck entrance: long divided approach off
  Belleville Rd, full chain-link perimeter fence (seen in Street View), and a
  canopy/booth pinch-point over the inbound lane at the yard entrance. Driver
  reviews describe a structured check-in and dock-assignment process.
- **guardShack = true.** A distinct small peaked-canopy structure sits over the
  truck lane at the gate, separate from the office building — consistent with a
  staffed check-in point. (remoteGs = false accordingly.)
- **dockDoors = 50+.** Dock doors run along both long faces of the building;
  well over 100 bays counted across both faces.
- **dropArea = 50+ / dropYard = true.** Dedicated trailer-storage rows north
  (largest) and south of the building hold hundreds of unhitched trailers,
  separate from the active dock aprons.
- **shipRcvSeparate = true.** Two physically separate dock banks on opposite
  building faces (north and south).
- **drivewayLong = true, pre/postGateStaging = true, fastLaneOpportunity =
  true.** The deep divided boulevard and wide aprons hold a long truck queue and
  leave ample paved width to add an express lane.
- **scale = false.** No distinct weigh pad identified in the truck path.
- **railServed = false.** Rail passes south of the site but no spur enters the
  fenced property.

## Yard zones and counts

- **Perimeter:** 9-vertex ring tracing the fenced property (warehouse + north
  and south drop yards + the eastern entrance-boulevard panhandle to Belleville
  Rd). Area ≈ 57.6 acres.
- **truckGate:** rotated quad over the gate canopy / inbound lane at the yard
  entrance.
- **dropYards:** two rings — the large north trailer-storage lot and the south
  trailer row.
- **dockAprons:** two long thin quads hugging the north and south dock faces at
  the building's angle.
- **staging:** the divided entrance-boulevard apron where trailers stage before
  the inner yard.
- **yardMetrics:** dockDoorCount ≈ 180 (estimate, both faces), trailersVisible ≈
  240, trailerParkingCapacity ≈ 400, truckGateCount 1, buildingCount 2
  (warehouse + NE office/check-in), siteAreaAcres 57.6, railServed false.

## Street View

- **Perimeter / entrance:** pano `o3UOmKrq0scZqXkknXzx7w` at the Belleville Rd
  boulevard mouth (heading ≈ 254° toward the facility) — the frame a driver sees
  on arrival, showing the divided entrance and perimeter landscaping/fence.
- **Truck gate:** pano `D-eDcN9QinBp-WBKjZSCWw`, the deepest public pano on the
  boulevard (heading ≈ 268° west toward the gate canopy), with the chain-link
  perimeter fence and gate complex visible down-road. Street View coverage ends
  at the gate (private beyond), confirming a controlled entrance.

## Web findings

Listed as "Costco Van Buren Distribution Depot," a Costco truck depot. Driver
reviews note an organized check-in process, spacious maneuvering, overnight
parking, a dog run and restrooms; typical timings ~10 min check-in, ~5 min dock
assignment, ~2 hr load/unload. Consistent with a guarded, structured cross-dock
operation.

## Uncertain fields

- **urbanRural:** judged Rural (edge-of-town township, adjacent farmland and
  treatment plant) but it is on Detroit metro's outer fabric — borderline.
- **buildingCount / exitLanes / scale:** approximate from overhead imagery.

## Final confidence: high
Facility positively identified; gate, guard structure, fencing, dock layout and
drop yards all corroborated across satellite, Street View and web. The
urban/rural call is the main soft point.
