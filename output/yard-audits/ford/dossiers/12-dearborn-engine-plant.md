# Deep-Audit Dossier — idx 12
## Ford - Dearborn Engine Plant, Dearborn MI

**Type:** Engine Plant
**Resolved center:** 42.31280, -83.15880
**Confidence:** medium

### Location resolution
The roster supplied 42.314553, -83.162142 (GEOMETRIC_CENTER, Rouge Complex
address). Probing showed that point lands on the north edge of the green-roofed
Dearborn Truck Plant, not the engine plant. Web research confirmed the Dearborn
Engine Plant (also the Dearborn Engine and Fuel Tank Plant) as a distinct Rouge
Center building. Satellite probing (z16-z19) of the Truck Plant's neighbors
identified the engine plant as the long large building running NW-SE
immediately east of the Truck Plant, flanked on its NE face by multiple rail
spurs. Center locked at ~42.3128,-83.1588.

### Key views
- **z16 cluster:** Green-roofed Dearborn Truck Plant at left; the long
  lighter-roofed building to its east, with rail spurs alongside, is the engine
  plant. Rail yards beyond to the NE.
- **z18 building:** Long large structure with an internal access road on its SW
  side, a landscaped buffer and stormwater pond; rail spurs run tight along the
  NE wall.
- **z19 NE end:** Confirmed rail yards (multiple parallel spurs) hard against
  the building.
- **Street View (internal access road, 2018 & 2023):** The long blue/grey-clad
  engine plant building; chain-link perimeter fence with privacy slats; an
  internal Rouge artery road approaches the building.

### Gate / guard-shack / dock determinations
- **truckGate: true.** The Rouge Center is a fully fenced, guarded campus.
  Street View shows perimeter fencing around the engine plant; the plant is
  served by the Rouge gate/guard system, not an independent street gate.
- **guardShack: true.** Rouge Center operates manned security gates with guard
  booths (confirmed at the SW Rouge gate during the idx-11 audit). The engine
  plant shares that system. remoteGs therefore false.
- **dockDoors: 0-10 (low confidence).** Interior plant; material flow is largely
  internal and rail-borne. Few external truck docks visible — estimated 0-10 on
  the SW face. Flagged uncertain.
- **dropArea: NONE / dropYard: false.** No dedicated trailer-storage lot for
  this interior building; nearby vehicle-staging lots belong to the Truck Plant.

### Yard zones and counts
- **perimeter:** approximates the engine plant ~31-acre footprint within the
  larger Rouge campus.
- **truckGate box:** the Rouge access point south of the building.
- **dockApron:** one strip estimated on the SW building face.
- **dropYards / staging:** none distinctly attributable to the engine plant.
- dockDoorCount ~7, trailersVisible ~3, trailerParkingCapacity ~12,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~31, railServed true.
  Counts are honest overhead estimates; flagged uncertain.

### Web findings
- Ford Dearborn Engine Plant (Dearborn Engine and Fuel Tank Plant) is part of
  the Rouge Center, 3001 Miller Rd, Dearborn MI. The Rouge Center is a ~600-acre,
  ~93-building, ~16M-sq-ft secured campus. The Rouge Electric Vehicle Center sits
  between the Truck Plant body shop and assembly building on the same campus.

### Final confidence
**medium** — facility positively identified and the Rouge gate/guard system is
clear, but DEP is an interior plant: exterior dock and lane counts cannot be
measured precisely from overhead imagery because truck flow is largely internal
to the secured campus. Flagged: dockDoors, entryLanes, exitLanes,
postGateStaging, shipRcvSeparate.
