# Deep-Audit Dossier — Frito-Lay Charlotte NC (idx 17)

## Location resolution
- Roster supplied `2911 Nevada Blvd, Charlotte, NC 28273` at `35.115626, -80.941746` (geocode moved 5764 m, so verification was essential).
- Address confirmed via Hub.biz, Yellowpages, PotatoPro, Foursquare — all list Frito-Lay's Charlotte manufacturing plant at 2911 Nevada Blvd.
- Satellite probe at the roster coords landed directly on a large manufacturing building with process silos, tanks, water-treatment clarifiers and dock activity. Street View along Nevada Blvd shows the **red Frito-Lay logo** on the building wall — positive ID.
- **Locked center: 35.115626, -80.941746.**

## Key views
- z17/z18 overview: central manufacturing plant with rooftop process equipment, silos at the southwest, water-treatment tanks at the south, an office building at the southeast, and trailer drop rows to the northwest and south.
- z19 northwest: long angled trailer drop rows along the woods edge.
- z19 west face: trailers backed against the building west/southwest dock bank.
- z20 + Street View (Oct 2025): the truck entrance off Nevada Blvd.

## Gate / guard-shack / dock determinations
- **truckGate: true.** A continuous chain-link perimeter fence runs along the Nevada Blvd frontage. The truck driveway pierces the fence at a single controlled gated opening — visible in Street View and z20 satellite.
- **guardShack: true.** A small white booth structure sits just inside the fenced truck entrance, confirmed across multiple Street View headings and the z20 crop. Staffed guard shack at the gate.
- **remoteGs: false** — guard shack present.
- **dockDoors: 25-50.** Trailers backed against the building west/southwest face; ~35 doors estimated. Smoke plumes and process clutter obscure an exact count (flagged uncertain).
- **dropArea: 50+ / dropYard: true.** Two large drop-trailer fields — long angled rows along the northwest woods edge plus a southern lot.
- **shipRcvSeparate: false** (uncertain) — one dominant dock bank; no clearly separate second cluster confirmed.

## Yard zones & counts
- `perimeter`: full fenced plant property, ~42 acres.
- `truckGate` zone: fenced/gated entrance with guard booth off Nevada Blvd.
- `dropYards`: northwest angled rows + southern lot.
- `dockAprons`: west building dock apron.
- `staging`: postGate holding apron just inside the gate.
- Metrics: ~35 dock doors, ~80 trailers visible, ~110 capacity, 1 truck gate, 2 buildings, ~42 acres, not rail-served.

## Web findings
- Frito-Lay North America manufacturing/distribution plant, ~500-550 employees, snack foods / potato chips. EPA TRI facility ID 28210FRTLY2911N confirms a registered manufacturing site. No public detail on gate procedures, but Street View directly shows the fence + booth.

## Confidence
**High.** Facility positively identified by on-building logo; gate and guard shack confirmed in current Street View and z20 satellite. `dockDoorCount` and `shipRcvSeparate` flagged uncertain due to process-equipment clutter at the dock face.
