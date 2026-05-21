# Deep-Audit Dossier — GXO Logistics Distribution Center, Houston TX (West Greens)

**Roster idx:** 24
**Address:** 4800 W Greens Rd, Houston, TX 77066
**Type:** Distribution Center (large bulk distribution warehouse)
**Locked coordinates:** 29.94470, -95.49050
**Method:** deep-audit
**Confidence:** medium

## Location confirmation
The geocoded point (29.944117, -95.490924, ROOFTOP) lands on a very large
bulk-distribution warehouse in northwest Houston. Web research (Evopra, Racklify,
AWCO warehouse directories) confirms GXO Logistics operates a 3PL warehouse at
4800 W Greens Rd, 77066.

The building is a single very large warehouse oriented NW–SE, set back from
W Greens Rd behind a fenced grass buffer, with truck courts on the NE long face
and the SW face.

## Key views
- **Wide satellite (z16–17):** Large warehouse in an industrial park; truck
  court on the NE side, car parking and office at the SW corner, a stormwater
  retention pond to the SW.
- **Street View, W Greens Rd:** The property is enclosed by a black ornamental
  metal fence along the road frontage and chain-link along the side property
  lines; the building sits well back behind a fenced lawn.
- **Tight satellite (z18–20):** NE dock face with a working dock apron holding
  staged industrial materials (pipe/conduit bundles) and a few trailers; SW dock
  face with car parking in front. No guard booth at any entrance.

## Gate / guard-shack / dock determinations
- **truckGate: false** — The property has a perimeter fence (ornamental metal at
  the W Greens Rd frontage, chain-link on side lines), but no guard booth and no
  barrier arm or sliding/swing gate across any truck lane was found. Truck
  courts on the NE and SW faces are entered via open driveways. The frontage
  fence is a property-line/decorative fence around the office and lawn, not a
  controlled truck checkpoint.
- **guardShack: false** — No booth structure observed in satellite or Street
  View at any entrance.
- **remoteGs: false** — No controlled gate exists, so no remote check-in.
- **dockDoors: 50+** — very large warehouse with continuous dock banks on the NE
  long face (main truck court) and the SW face; ~90 doors estimated (low
  confidence on exact count).
- **dropArea: 0-10** — the NE truck court holds mostly staged industrial
  materials rather than parked trailers; only a handful of trailers seen.
- **dropYard: false** — no dedicated trailer-storage lot.
- **shipRcvSeparate: true** — dock banks on opposite (NE/SW) faces.

## Yard zones and counts
- **perimeter:** the GXO warehouse parcel — ~50.3 acres from the box.
- **truckGate:** open driveway access on the east side (no physical gate).
- **dropYards:** none.
- **dockAprons:** NE long-face apron and SW-face apron.
- **staging:** none distinct beyond the wide NE truck court (postGateStaging).
- **dockDoorCount:** ~90 (estimate). **trailersVisible:** ~8 in captured
  imagery. **trailerParkingCapacity:** ~25. **truckGateCount:** ~2 open
  accesses. **buildingCount:** 1. **railServed:** false.

## Web findings
- Evopra, Racklify and AWCO warehouse directories list GXO Logistics as a 3PL
  warehouse operator at 4800 W Greens Rd, Houston, TX 77066.

## Final confidence
**Medium.** Building positively located and corroborated by directories.
Satellite imagery clearly shows an ungated layout (perimeter property-line fence
but no guard booth or truck-lane barrier). Street View does not cover the
interior truck courts, and dock-door / trailer counts are honest overhead
estimates — hence medium overall. The gate / guard-shack determination (none)
is confident.
