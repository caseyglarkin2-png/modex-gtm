# Deep-Audit Dossier — idx 06

## Detroit Diesel Corporation Engine Plant — Redford, MI

- **Account:** Daimler Truck North America
- **Type:** Engine / powertrain plant
- **Roster address:** 13400 West Outer Drive, Redford, MI 48239
- **Resolved center:** 42.37745, -83.2675
- **Method:** deep-audit | **Confidence:** high

## Step 0 — Location confirmation

The roster coordinate (42.377655, -83.26273; GEOMETRIC_CENTER, moved 1434 m)
landed in an east-side staging/parking lot. Probing satellite z15-z16 around
the point revealed a massive blue/gray-roofed industrial plant complex to the
west — the Detroit Diesel engine plant, one of DTNA's largest North American
facilities and the Detroit Diesel / Demand Detroit world headquarters. The
plant fronts Telegraph Road / West Outer Drive on the west and is bounded by an
active rail line on the north. Street View along the west frontage carries a
"TRUCK ENTRANCE -> 12200 TELEGRAPH" sign and a DAIMLER TRUCK-branded building,
positively confirming the site. The locked plant-center coordinate is
42.37745, -83.2675.

## Key views

- **Wide z15-z16:** Single very large engine-plant building complex dominating
  the frame, with employee parking lots and trailer-storage rows to the east
  and a truck yard along the west face.
- **West face z18-z19:** Multiple trailers, dock aprons and a covered
  conveyor/bridge crossing; the west yard is the primary truck working area.
- **North face z17-z18:** Dock doors with trailers backed in; an active rail
  line runs immediately along the north property edge with spurs/sidings
  fanning into the building.
- **East side z16:** Large parking lots, NE trailer-storage rows, and a
  separate DAIMLER-branded office/ancillary building — a true campus.

## Gate / guard-shack determination

- **Truck gate: YES.** SW corner off Telegraph Road. Street View (captured
  2025-09) shows a dedicated "TRUCK ENTRANCE" sign, a wide gated opening in
  tall chain-link perimeter fencing with dark privacy screening, and a deep
  paved checkpoint apron set back from the multi-lane arterial.
- **Guard shack: YES (flagged uncertain).** A wide blue/gray flat canopy spans
  the inbound truck lane just inside the gate, visible in both Street View and
  satellite. It serves as the manned vehicle-check point. A discrete
  free-standing booth is not separately resolvable in imagery, but a world-HQ
  engine plant of this scale runs staffed security — recorded guardShack=true,
  remoteGs=false.
- **Staging:** Diagonally-striped truck stalls on the gate apron (pre-gate);
  marked stalls and a wide truck artery inside the gate (post-gate).
- **Fast-lane opportunity: YES.** Very wide gate apron plus multi-lane road
  frontage offer clear room for an express/bypass lane.

## Yard zones and counts

- **Perimeter geofence:** S 42.3735, W -83.2753, N 42.3787, E -83.2635 —
  ~138 acres, capturing the plant complex, west truck yard, NE trailer rows,
  and east support lots/buildings.
- **Drop yards:** West truck yard (trailers + dock aprons) and the NE
  trailer-storage rows.
- **Dock aprons:** North building face and west building face.
- **dockDoorCount ~40** (band 25-50) — doors with trailers backed in along the
  north and west faces; approximate from overhead imagery.
- **trailersVisible ~120**, **trailerParkingCapacity ~180** — dropArea 50+.
- **truckGateCount 1**, **buildingCount 4**, **railServed true.**

## Web findings

DTNA / Demand Detroit lists this as the Detroit Diesel Corporation facility at
13400 Outer Drive West, Detroit/Redford MI 48239 — builds heavy-duty engines,
axles and transmissions for Freightliner trucks; it is the Detroit Diesel world
headquarters. MI EGLE and Yelp corroborate the address. No public detail on the
gate layout; gate determinations rest on imagery.

## Final confidence

**High.** Facility unambiguously identified; truck gate, perimeter fence,
campus layout, rail service and dock/trailer counts all read clearly from
satellite + Street View. Guard-shack form, exit-lane count, scale presence and
ship/receive separation are imagery-inferred and listed in uncertainFields.
