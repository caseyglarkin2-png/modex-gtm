# Deep-Audit Dossier — Honda Aircraft Company (HondaJet), Greensboro NC (idx 13)

## Facility
- **Name:** Honda Aircraft Company (HondaJet) — world headquarters & production
- **Type:** Aircraft Assembly Plant
- **Address:** 6430 Ballinger Road, Greensboro, NC 27410 (Piedmont Triad
  International Airport)
- **Resolved coordinates:** 36.102500, -79.923500 (center of the production
  campus on the NE side of the airfield)

## Step 0 — Location confirmation
The roster coordinates (geocoded to the 6430 Ballinger Rd address, movedMeters
462) landed on the PTI passenger terminal — wrong building. Systematic satellite
search across the airport found the real Honda Aircraft Company campus on the NE
side of the airfield at ~36.1025, -79.9235: a large multi-building aircraft
assembly complex with a dedicated aircraft apron opening onto an airfield
taxiway, extensive employee parking, and adjacent office and wing-production
buildings. Confirmed by:
- A HondaJet business jet visible on the apron in z18-z20 satellite (distinctive
  over-the-wing engine mounts).
- 2026 Street View showing HONDA signage on the production building.
- Web research: 133-acre campus, 215,000+ sq ft of R&D/production/admin, the
  HQ since 2007.

## Key views
- **z16 campus:** Full Honda Aircraft campus — production/assembly complex,
  airside apron, SW wing-production building, employee parking, NE office
  buildings.
- **z18-z20 production building:** A HondaJet on the apron; the building's
  landside face has only a few service dock doors; one semi-trailer observed
  parked at the dock.
- **Street View (entrance road, 2026-02):** A small guard-booth structure with
  gate hardware at the campus vehicle entrance off the public road; the campus
  buildings visible across broad landscaped lawns; rural two-lane road.

## Facility nature — important context
This is an aircraft ASSEMBLY plant, not a freight/distribution facility. Truck
traffic is light (inbound parts and supplies). There are no trailer drop yards
and only a handful of service dock doors. The dominant "yard" is the airside
aircraft apron, which is irrelevant to a truck-yard-management engagement. The
classification reflects this — minimal dock/drop infrastructure.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The campus vehicle entrance road has a controlled entry
  with gate hardware — standard for a secured aerospace site.
- **guardShack = true.** A small staffed booth (1-vehicle footprint) sits at the
  campus entrance road, visible in 2026 Street View.
- **remoteGs = false.** A physical guard booth is present.
- **dockDoors = 0-10.** Only a few service/parts dock doors at the production
  building's landside face.
- **dropArea = NONE.** No marked trailer drop stalls; no trailer drop operation.
- **dropYard = false.** No dedicated trailer-storage lot.
- **multipleFacilities = true.** Production complex + wing-production building +
  office buildings.
- **railServed = false.** Served by the airfield, not rail.

## Yard zones and counts
- **Perimeter:** ~133 acres — the Honda Aircraft campus footprint.
- **Drop yards:** none.
- **Dock aprons:** one small box at the production building's landside service
  doors.
- **Staging:** none.
- **Truck gate box:** the guard-booth-controlled campus entrance road.
- **yardMetrics:** ~6 dock doors, ~2 trailers visible, ~8 capacity, 1 truck
  entrance, 3 buildings, 133 acres, not rail-served.

## Web findings
- Honda Aircraft Company HQ since 2007; 133-acre campus; 215,000+ sq ft of
  R&D/production/admin; LEED Gold HQ; 83,100 sq ft wing-production facility
  added 2020; assembles the HondaJet / HondaJet Elite.

## Final confidence
**High.** The facility was positively re-identified after the geocode error, and
imagery is clear. The gate/guard-booth call rests on a 2026 Street View
observation of a booth structure at the entrance. The site is fundamentally an
aircraft plant with negligible truck-yard infrastructure — flagged so a human
reviewer understands this is a low-relevance target for yard management.
