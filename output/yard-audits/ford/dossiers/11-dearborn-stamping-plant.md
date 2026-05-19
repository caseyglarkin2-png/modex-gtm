# Deep-Audit Dossier — idx 11
## Ford - Dearborn Stamping Plant, Dearborn MI

**Type:** Stamping Plant
**Resolved center:** 42.30680, -83.16050
**Confidence:** medium

### Location resolution
The roster supplied 42.313554, -83.164654 — identical to idx 1 (Dearborn Truck
Plant) and the generic Rouge Complex address (3001 Miller Rd). Web research
established the Dearborn Stamping Plant (DSP) as a distinct 2.7M-sq-ft, ~35-acre
facility that stamps F-150 doors and hoods, in operation since 1939. A common
geocode for it (42.3083377, -83.1563218) was probed and found to land on the
Rouge Center central road/parking spine — not a building.

Satellite probing of the Rouge interior (z16-z19) identified the actual stamping
plant: the large single flat-roofed press building with characteristic rows of
roof skylights/monitors and flanking rail spurs, centered near 42.3068,-83.1605.
Center locked there.

### Key views
- **z15 wide:** Whole Rouge Center — a 1.5 mi x 1 mi, 93-building dense
  industrial campus on the River Rouge. DSP sits in the western/central cluster.
- **z17-z18 building:** Large monolithic flat-roofed structure consistent with a
  stamping plant; abuts adjacent Rouge buildings, hemmed by internal roads.
- **z19 docks (42.3075,-83.1605):** Confirms a single massive roof; dark linear
  rail features run along the building's east edge — rail-served (steel coil
  inbound).
- **z19 SW gate (42.3017,-83.169):** A canopied checkpoint with a guard booth and
  spreading lane markings — a manned Rouge Center access gate.
- **Street View (Rouge access road, 2018/2023):** Wide industrial road into the
  complex with perimeter fencing and a controlled pinch-point/checkpoint ahead.

### Gate / guard-shack / dock determinations
- **truckGate: true.** The Rouge Center is a fully fenced, guarded campus. The
  stamping plant has no independent street-facing gate; it is served by the
  complex's controlled gate system. Z19 imagery shows a canopied checkpoint with
  lane markings.
- **guardShack: true.** A staffed guard-booth structure with canopy is visible
  at the Rouge gate. Rouge Center operates manned security gates. remoteGs
  therefore false.
- **dockDoors: 0-10 (low confidence).** DSP is interior to the Rouge; outbound
  F-150 stampings move internally to the Dearborn Truck Plant and inbound steel
  arrives largely by rail. Few external truck docks are visible; estimated 0-10
  exterior doors on the SW/W face. Flagged uncertain.
- **dropArea: NONE / dropYard: false.** No dedicated external trailer-storage lot
  for this interior building.

### Yard zones and counts
- **perimeter:** approximates the DSP ~35-acre building footprint within the
  larger Rouge campus.
- **truckGate box:** the SW Rouge Center checkpoint.
- **dockApron:** one strip estimated along the SW building face.
- **dropYards / staging:** none distinctly attributable to DSP.
- dockDoorCount ~8, trailersVisible ~4, trailerParkingCapacity ~15,
  truckGateCount 1, buildingCount 1 (the DSP building itself), siteAreaAcres ~35,
  railServed true. Counts are honest overhead estimates; flagged uncertain.

### Web findings
- Ford Dearborn Stamping Plant, 3001 Miller Rd, Dearborn MI 48120; part of the
  Rouge Center. ~800 employees; stamps all F-150 doors and hoods. Houses a
  ~187-ft Schuler press line. 2.7M sq ft on 35 acres, opened 1939.
- The Rouge Center is a 93-building, ~16M-sq-ft secured campus; Dearborn Truck
  Plant and Dearborn Engine Plant are adjacent on the same fenced campus.

### Final confidence
**medium** — facility positively identified and the Rouge gate/guard system is
clear, but DSP is an interior plant: exterior dock counts and lane counts cannot
be measured precisely from overhead imagery because truck flow is largely
internal to the secured campus. Flagged: dockDoors, entryLanes, exitLanes,
postGateStaging, shipRcvSeparate.
