# Crowley Puerto Limon Container Terminal (Moin Container Terminal, Costa Rica) - Deep Audit

## Resolved location and how confirmed

Crowley's containerized service to Puerto Limon calls at the **Moin Container Terminal (Terminal de Contenedores de Moin / TCM)**, operated by **APM Terminals** on a reclaimed artificial island roughly 500 m off Moin Bay, on the Caribbean coast of Limon province, Costa Rica. This is the container terminal Crowley uses; the older Limon city multipurpose berths are a separate, conventional facility and are not where Crowley's containerized loops berth.

Confirmation:
- Web research: Crowley's port terminal page lists Puerto Limon (Carretera Saopin, frente al Servicentro Moin); Crowley runs weekly Florida-Costa Rica and Florida-Costa Rica-Jamaica loops with vessels arriving Tue/Wed at Puerto Limon. Crowley is the liner/vessel customer; APM Terminals is the concessionaire (33-year concession, terminal opened February 2019).
- Published specs cross-checked: artificial island, ~40 ha Phase-1 operational area (up to 80 ha buildout), ~650 m quay (1.5 km planned), ~3,800 reefer plugs, ~1.2M TEU annual capacity. Strong banana/pineapple reefer export hub.
- Imagery: locked center at **10.013017, -83.097563** from z15-z20 Maxar/Airbus crops showing the trapezoidal reclaimed island, ship-to-shore gantry cranes along the south quay, dense RTG container blocks, the breakwater wrapping N/E, and the access causeway from the mainland landing at the SW corner.

## What each key view showed

- **z15-z16 wide:** The whole island in open water, breakwater on the seaward (N/E) edges, gantry cranes on the south quay, and a curving access road/causeway from the mainland connecting to the SW corner. Road-only access; no rail.
- **z17 overview:** Very dense container ground-slot stacking blocks filling the island, RTG/RMG lanes between blocks, orange reefer containers, admin/workshop buildings on the west side, transit shed on the north.
- **z18-z19 stacking yard:** Parallel container blocks with straddling RTG gantries, chassis/truck lanes between rows, reefer racks (elevated structures). Confirms a large container/chassis ground-slot yard, not OTR trailer stalls.
- **z18-z20 SW gate:** Definitive truck gate. A large angled **gate canopy** spans several parallel marked truck lanes; tractor-trailers are queued in the lanes approaching it (one yellow container box visible). Single landward in/out gate where the causeway meets the terminal. Adjacent admin office building with a round blue tank, plus a staging/parking apron.
- **Transit shed (z19, north):** Long pale warehouse/transit shed with only a handful of openings on its landward face. The terminal moves boxes by gantry to chassis, so OTR dock doors are near-zero.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** Multi-lane gate with an OCR-style canopy spanning marked lanes at the SW island corner (~10.0130, -83.1023), trucks queued. Single gate (truckGateCount = 1); entry and exit share the one gate complex (entryExitTogether = true).
- **guardShack = FALSE, remoteGs = TRUE.** The gate reads as a modern automated container-terminal portal (OCR canopy + lane kiosks), not a classic small staffed booth beside the lane. An administrative office sits just inside the gate. Flagged uncertain.
- **dockDoors = 0-10 (~6).** Marine container terminal; the only door-bearing structure is the north transit shed with a few openings. Not an OTR dock-door wall.
- **dropArea / dropYard = 50+ / TRUE.** The entire ~35 ha operational area is RTG container stacking yard.
- **scale = TRUE (inferred)**, **multiStep = TRUE (inferred)** from the standard two-stage container in-gate flow; flagged uncertain. **fastLaneOpportunity = TRUE** given the multi-lane gate apron.

## Yard zones and counts measured

- **perimeter:** operational island inside the breakwater (NW 10.0154,-83.1010; NE 10.0144,-83.0955; SE quay 10.0102,-83.0948; SW gate/causeway 10.0112,-83.1027). Shoelace area = **~35 ha / ~86 acres**, consistent with the published ~40 ha Phase-1 footprint.
- **truckGate:** the canopy/lane complex at the SW corner.
- **staging:** paved holding apron just inside the gate (postGateStaging), with pre-gate queue space on the causeway approach (preGateStaging).
- **dropYards:** the main RTG container stacking field covering most of the island.
- **dockAprons:** the north transit-shed apron (the only door-bearing structure).
- **yardMetrics:** dockDoorCount 6, trailersVisible ~70, **trailerParkingCapacity ~5,500 container/chassis ground slots** (order-of-magnitude estimate from RTG-block density vs ~1.2M TEU throughput), truckGateCount 1, buildingCount ~5, siteAreaAcres ~86, railServed false.

## Web findings

- Moin/TCM: APM Terminals concession, opened Feb 2019, artificial island, ~40 ha (Phase 1), ~650 m quay, 14.5 m draft, ~3,800 reefer plugs, ~1.2M TEU/yr; primary export of bananas and pineapples; operates 24/7.
- Crowley: weekly fixed-day liner service from Florida (Port Everglades / Jacksonville) to Costa Rica calling at Puerto Limon (Moin); also Florida-Costa Rica-Jamaica loop. Crowley Puerto Limon office at Carretera Saopin, frente al Servicentro Moin.

## Street View

No Google Street View coverage at the gate or on the island (ZERO_RESULTS at both gate and perimeter centroid). Nearest pano is a 2016-01 user photosphere ~2.5 km south on the mainland, shot during construction (pipes, excavators, sand, pre-opening), not usable. streetViewMeta hasCoverage = false for both zones; no pano invented.

## Final confidence

**Medium.** Site identity, gate location, layout, and the container-yard nature are confirmed from clear high-resolution satellite imagery and corroborating web sources. Confidence is held at medium because: container ground-slot capacity (~5,500) is an order-of-magnitude estimate; the precise lane split, scale pad, guard/remote-checkin nature, and multi-step gate flow are inferred from layout rather than positively isolated; and there is no ground-level Street View to corroborate the gate hardware.
