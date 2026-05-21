# Deep-Audit Dossier — Home Depot RDC, McCalla AL (idx 11)

**Facility:** Home Depot Rapid Deployment Center (DC #5086)
**Address:** 6400 Jefferson Metro Pkwy, McCalla, AL 35111
**Resolved center:** 33.322267, -87.025569
**Type:** Rapid Deployment Center (store replenishment)
**Confidence:** High

## Location confirmation
The roster geocode was flagged GEOMETRIC_CENTER with a 2790 m offset, so the
coordinate needed verification. Probing wide (zoom 15) showed two large
white-roofed distribution buildings in the Jefferson Metropolitan Park
industrial area SW of Birmingham, with a rail line running NE–SW between them.
The pin lands on the larger upper building — a cross-dock with loading docks on
both long faces and extensive trailer yards. Web search confirms "Home Depot
Distribution Center / RDC 5086, 6400 Jefferson Metro Pkwy, McCalla AL 35111",
24/7 operations. The pin building is positively identified as the HD RDC.

## Key views
- **Zoom 15/17 overview** — large rectangular cross-dock building, long axis
  NE–SW, docks on both long (NW and SE) faces, trailers backed in, large
  trailer parking yards wrapping the building. Surrounded by woodland; rail
  line along the SE.
- **SW corner (zoom 19)** — employee parking and the access road; the truck
  entrance complex visible at the south end.
- **NE corner (zoom 19)** — NE long face full of dock doors and trailers; a
  large drop-trailer yard beyond.
- **Truck gate (zoom 20/21)** — a small square guard-booth building with a
  flagpole and an attached canopy/awning sits on a triangular island where the
  access road narrows and splits. An orange/yellow barrier-arm/gate object is
  visible on the lane in zoom-21 imagery.
- **Street View (Jefferson Metro Pkwy, 2023-01)** — perimeter fencing along the
  property line; an 'ATTENTION' sign and a '10 mph' speed-limit sign at the
  entrance; the gatehouse visible in the distance.

## Gate / guard-shack determination
- **truckGate: true.** A controlled truck entrance is confirmed: a guard-booth
  island, lane narrowing/split, a visible barrier-arm/gate object, perimeter
  fencing, and entrance signage. A web driver review explicitly references
  "security and receiving personnel," corroborating a staffed gate.
- **guardShack: true.** A small square staffed booth (~1-2 vehicle footprint)
  with flagpole and canopy sits beside the truck lane — a classic gatehouse,
  distinct from the main building.
- **remoteGs: false.** A staffed guard shack is present.

## Yard zones and counts
- **Perimeter:** ~70 acres covering the building and surrounding trailer yards.
- **Truck gate:** SW-end gatehouse island.
- **Staging:** wide paved apron inside the gate, before the dock banks.
- **Dock aprons:** two — one along each long building face.
- **Drop yards:** large dedicated trailer-storage rows on the NE side and along
  the SE face.
- **dockDoorCount ≈ 150** across both long faces (overhead estimate).
- **trailersVisible ≈ 280; trailerParkingCapacity ≈ 360.**
- **buildingCount: 1.**
- **railServed: false** — the rail line runs alongside the property but no spur
  enters the truck yard.

## Web findings
RDC #5086; open 24/7. Driver reviews describe security and receiving personnel
as pleasant and efficient, prompt unloading, plenty of maneuvering room — a
well-run guarded RDC. Part of the ~19 RDC network. No public mention of a
yard-management system.

## Final confidence
**High.** Building positively identified despite the roster geocode-offset
flag. Gate/guard verdict is firm — multiple independent signals (booth
structure, barrier object, fencing, signage, driver review) all confirm a
staffed controlled truck gate. Lane counts approximate (no painted lane
control) and flagged uncertain.
