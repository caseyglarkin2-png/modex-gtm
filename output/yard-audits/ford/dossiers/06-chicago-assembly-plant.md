# Deep-Audit Dossier — Ford Chicago Assembly Plant (idx 6)

**Facility:** Ford - Chicago Assembly Plant, Chicago IL
**Type:** Vehicle Assembly Plant (Explorer, Aviator, Police Interceptor Utility)
**Address:** 12600 S Torrence Ave, Chicago, IL 60633
**Resolved coordinates:** 41.66662, -87.559702
**Confidence:** high

## Step 0 — Location confirmation

Roster coordinates (geocode ROOFTOP, moved 26 m) landed directly on the main
plant building. Wide satellite (z15-16) shows a large industrial complex with a
distinctive multi-bay sawtooth assembly building along the Calumet River, with
Torrence Ave running NE-SW along the east side and dense residential
neighbourhoods east of the road. Street View on the west side of Torrence Ave
(2024) shows the building wall lettered "CHICAGO ASSEMBLY PLANT" with the Ford
oval — positively the right facility. The Hegewisch-neighbourhood / Calumet
River / Torrence Ave context matches all web sources.

## Key views

- **z15-17 satellite:** Long sawtooth assembly building running NW-SE; body/paint
  shops; a LEAR seat-supplier building and JIT sequencing buildings on the south;
  a water-treatment plant; a river-side finished-vehicle marshalling lot west of
  the Calumet River. Multi-building campus.
- **z18-20 south end:** A large trailer drop yard packed with 60-80 parked
  trailers in rows, plus container/material lay-down. Dock banks with trailers
  backed in along the supplier buildings.
- **Torrence Ave Street View (2019 + 2024):** Located the truck gate mid-property
  at ~41.6615, -87.5593.
- **z17 SW edge:** Multiple rail tracks along the property line with spurs into
  the plant.

## Gate / guard-shack determination

**Truck gate: YES.** A controlled truck entrance on the west side of Torrence
Ave. Street View shows a wide paved gate apron with bollards and lane-control
structures, directional signage ("ALL INBOUND TRAFFIC" with arrow, "VISITOR
PARKING"), continuous chain-link perimeter fence with jersey-barrier sections,
and tractor-trailers staged in/at the apron.

**Guard shack: YES.** A small single-story guard house (1-2 vehicle footprint,
windows on multiple sides, Ford-branded, tan/cream walls) sits at the perimeter
fence line beside the gate lane — clearly distinct from the main plant building.
2024 Street View shows it intact and in service.

**Remote GS: NO** — a staffed booth is present, so this is a manned gate.

## Yard zones & counts

- **Perimeter:** Whole campus from the river/rail line on the west to Torrence
  Ave on the east, north personnel entrance to the south trailer yard —
  ~130 acres (core; the full historic site is ~165 acres).
- **Truck gate:** Guarded apron mid-Torrence frontage.
- **Drop yards:** South trailer-storage yard (50+ trailers) and a second
  SW staging strip; dedicated trailer storage = `dropYard: true`.
- **Dock aprons:** Supplier/JIT dock bank on the south building face with
  trailers backed in.
- **Staging:** Wide deep gate apron supports pre- and post-gate truck staging;
  driveway long enough for a 3+ truck queue.
- **dockDoorCount ~45** (low confidence — many internal/perimeter docks are not
  all visible from overhead). **trailersVisible ~70**, capacity ~110.
- **railServed: true** — rail spurs into the plant from the SW.
- **multipleFacilities: true** — interconnected assembly/body/paint campus plus
  supplier building and river-side marshalling lot.
- **shipRcvSeparate: true** — inbound supplier docks vs. separate outbound
  (rail / river / marshalling lot).
- **fastLaneOpportunity: true** — very wide gate apron with unused paved width.

## Web findings

Wikipedia, Ford Authority and the Chicago Sun-Times confirm the plant at
E. 130th St & Torrence Ave in Hegewisch, opened 1924 (100-year milestone in
2024), builds the Explorer/Aviator/Police Interceptor Utility, and has historic
rail and Calumet River freight access. No source contradicted the imagery.

## Final confidence

**High.** Facility unambiguously identified; truck gate and guard shack
confirmed in recent (2024) Street View. Dock-door count is the main estimate
(flagged). Archetype: Gate + GS + Fast Lane.
