# Deep-Audit Dossier — idx 13
## Ford - Cleveland Engine Plant, Brook Park OH

**Type:** Engine Plant
**Resolved center:** 41.41645, -81.82190
**Confidence:** medium

### Location resolution
The roster supplied 41.416738, -81.821992 (ROOFTOP, 17601 Brookpark Rd). The
z16 probe placed that point directly on the large multi-roof Ford Cleveland
Engine Plant building — confirmed correct, no relocation needed. Web research
confirmed the active Cleveland Engine Plant No. 1: 1.6M sq ft, ~2,055 employees,
producing 2.0/2.3L EcoBoost I4 and 3.5L EcoBoost V6 engines. The former
Cleveland Engine Plant No. 2 immediately SW has been demolished — cleared land
is visible in imagery (that parcel sold for ~$31.5M).

### Key views
- **z16 overview:** Large multi-roof plant building, employee parking lots W and
  SW, rail spurs along the NW edge, freeway interchanges (I-71/I-480) to the NE,
  demolished Plant No. 2 land to the SW.
- **z17/z19 south:** South-side truck yard with rows of parked trailers, a paved
  apron, and a water tank; a curving driveway descends toward the public road.
- **z20 truck yard:** Confirmed parked trailers and a fence line bounding the
  paved south yard.
- **NW z18:** Multiple rail spurs run NW-SE alongside the plant — rail-served.
- **Street View (2016 & 2025):** Chain-link perimeter fence around the property,
  the long grey plant building behind it, gated openings in the fence line.

### Gate / guard-shack / dock determinations
- **truckGate: true.** The property is enclosed by a chain-link perimeter fence
  with gated entry points (Street View). The south truck/drop yard reaches the
  public road through a controlled driveway.
- **guardShack: true (medium confidence).** A fenced, ~2,000-employee active
  Ford engine plant of this scale conventionally runs a staffed gatehouse and
  the perimeter is clearly secured. A booth structure could not be positively
  resolved in available imagery (some panos date to 2016) — flagged uncertain.
  remoteGs therefore false.
- **dockDoors: 10-25.** Estimated dock doors along the south building face
  serving the truck yard; exact count obscured by roof angle — flagged.
- **dropArea: 10-25 / dropYard: true.** The south truck yard holds an estimated
  15-20 parked trailers in rows against a paved apron.

### Yard zones and counts
- **perimeter:** the full ~95-acre fenced engine-plant property (the broader
  365-acre historic site included now-demolished Plant No. 2).
- **truckGate:** the south driveway connecting yard to public road.
- **dropYards:** one — the south trailer yard.
- **dockAprons:** one — the south building face apron.
- **staging:** a pre/post-gate paved strip near the south entrance.
- dockDoorCount ~18, trailersVisible ~19, trailerParkingCapacity ~35,
  truckGateCount 1, buildingCount 2 (main plant + NW office), siteAreaAcres ~95,
  railServed true. Counts are honest overhead estimates.

### Web findings
- Ford Cleveland Engine Plant No. 1, Brook Park OH — active; 2.0/2.3L EcoBoost
  I4 and 3.5L EcoBoost V6; ~2,055 employees (~1,825 hourly); 1.6M sq ft. The
  original 1951 plant sat on a ~204-acre site; the broader complex spanned ~365
  acres. Former Plant No. 2 was sold and demolished.

### Final confidence
**medium** — facility positively identified, perimeter fencing and truck yard
clearly visible, rail service confirmed. The guard-shack call relies on
plant-scale convention rather than a directly observed booth, and dock-door /
lane counts are overhead estimates. Flagged: guardShack, entryLanes, exitLanes,
dockDoors, multipleFacilities.
