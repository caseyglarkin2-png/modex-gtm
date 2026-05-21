# Deep-Audit Dossier — idx 04

## Facility
DHL Supply Chain - East Coast Center of Excellence - Annville PA
Life Sciences & Healthcare Distribution Center (Foreign Trade Zone) —
700 Killinger Road, Clear Springs Logistics Park, Annville, PA 17003

## Location resolved
Roster coords (40.319835, -76.534502; geocode moved 2037 m) landed near, but
slightly north of, the actual building. Satellite probing found a large
completed warehouse shell at ≈ 40.3185, -76.5360, with a second large building
under construction immediately NW — consistent with Clear Springs Logistics
Park (approved for three warehouses, ~3M sq ft). Web search confirms DHL's
1,000,000 sq ft East Coast Center of Excellence at 700 Killinger Rd within
this park, opening 2026. Locked center ≈ 40.3185, -76.5360.

## Key views
- **z16 context** — Large E-W warehouse (white roof, shell complete) plus a
  second building under construction to the NW. Farmland surrounds.
- **z17/z18** — Cross-dock building: dock-door banks on both the north and
  south long faces, with paved dock aprons.
- **South yard, SE corner (z18/z19)** — Entirely graded dirt: the truck yard
  and 230-stall trailer lot were not yet paved when imagery was captured.
- **NE corner** — Employee car parking complete; perimeter road in place.
- **Street View** — No coverage (newly built area).

## Construction-stage caveat
The available satellite imagery predates facility opening — the building
exists but the surrounding truck yard, trailer-stall lot, perimeter fence and
gate were still under construction (graded dirt). Gate / guard-shack / yard
determinations below are INFERRED from the facility type and industry norms,
not directly observed. Confidence is **medium**; the gate-related fields are
listed in uncertainFields.

## Gate / guard-shack / dock determinations
- **truckGate = true (inferred).** A new FDA/GMP-compliant pharmaceutical DC
  operating as a Foreign Trade Zone is, by industry norm, fully fenced and
  gated for customs and security control. Not confirmed in imagery.
- **guardShack = false / remoteGs = true (inferred).** No booth seen; modern
  DCs of this class typically use kiosk/app check-in. Low confidence.
- **dockDoors = 50+.** DHL press release: 100 dock doors. Building is a
  cross-dock with door banks on both long faces.
- **dropArea = NONE in imagery / dropYard = true (planned).** Press release
  cites 230 trailer parking stalls; the lot was unpaved and empty in the
  imagery, so 0 trailers were actually visible.
- **shipRcvSeparate = true.** Cross-dock, two opposite dock banks.
- **multipleFacilities = true.** Multi-building logistics park; second
  warehouse under construction adjacent.

## Yard zones & counts
- Perimeter: ~70-acre parcel within Clear Springs Logistics Park.
- truckGate: not locatable in construction-stage imagery (null).
- dropYards: planned south-side trailer lot (230 stalls per press release).
- dockAprons: two — north face and south face.
- dockDoorCount 100 (per DHL); trailersVisible 0 (imagery predates operations);
  trailerParkingCapacity 230 (planned); truckGateCount 1; buildingCount 1;
  rail not served.

## Web findings
DHL Supply Chain East Coast Center of Excellence, 700 Killinger Rd, Annville
PA — 1,000,000 sq ft, FDA/GMP-compliant, Foreign Trade Zone, 100 dock doors,
230 trailer stalls, 250 employee spots, EV charging, freezer-to-ULT
temperature-controlled storage; up to 400 associates; first of three
warehouses in the ~3M sq ft Clear Springs Logistics Park; opens 2026
(LebTown, Pharmaceutical Commerce, FreightWaves, Commercial Property
Executive).

## Confidence
**medium** — building positively identified and cross-dock layout clear, and
hard specs (100 doors, 230 stalls) come from DHL's own press release. But the
imagery predates operations: gate, guard, fence and yard paving could not be
directly observed, so all gate-related fields are inferred and flagged.
