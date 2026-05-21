# Deep-Audit Dossier — idx 17

## John Deere Power Products — Greeneville, TN

**Type:** Assembly Plant (100 Series lawn tractors, EZTrak/ZTrak zero-turn mowers)
**Roster address:** 1630 Hal Henard Rd, Greeneville, TN 37743
**Resolved center:** 36.15268, -82.88965
**Confidence:** high

## Step 0 — Location confirmation
Despite the roster note flagging a 7,252 m geocode correction, the supplied
coordinate (36.152675, -82.889646, geocoded ROOFTOP) landed directly on a large
multi-building industrial complex. Satellite probes at z15-z18 confirm a major
manufacturing plant surrounded entirely by farmland and woodland. Web research
confirms identity: John Deere Power Products, 1630 Hal Henard Rd, Greeneville TN
- manufacturing home of the 100 Series lawn tractor and residential ZTrak
zero-turn mowers, operating since 1988, 4M+ units built. No correction needed -
the audited site is correct.

## Site layout
A large single-campus assembly plant:
- **Main complex:** several connected large buildings (assembly, warehouse) in
  the center and east, plus a building with a distinctive teal-roofed section.
- **West side:** extensive open-air finished-goods storage racks holding wrapped
  mowers / lawn tractors (NOT trailers).
- **Dock banks:** multiple long building faces with continuous dock-door rhythm;
  z19 imagery shows two long rows of 20+ trailers each backed into doors.
- **NE access drive:** the truck entrance road runs from the Hal Henard Rd
  junction up to a fenced, guarded gate, then into the plant.
- **Employee parking** lots along the SE side.
- A rail line runs along the SW property edge (no spur into the plant).

## Key views
- z15/z16 overview: confirmed full campus surrounded by farmland/woods (rural).
- z18 entrance: traced the NE access road from the Hal Henard Rd junction.
- z19 dock banks: dozens of trailers backed into multiple dock faces.
- z19 west: large finished-goods storage racks (mowers/tractors under wrap).
- z19 drop area: staged finished products and trailers at docks.
- z20 gate: guard booth structure beside the entrance lane.
- Street View (2023-11) at the gate: definitive - guard booth + perimeter
  chain-link fencing + sliding gate sections + entrance pinch-point.
- Street View Hal Henard Rd / junction: open farmland; the public-road junction
  is uncontrolled, but the controlled gate sits ~400 m in along the access drive.

## Gate / guard-shack / dock determinations
- **truckGate: true.** 2023-11 Street View at ~36.1552, -82.8882 clearly shows
  a controlled truck entrance: chain-link perimeter fence runs along the
  property line, with sliding gate sections across the drive and an entrance
  lane pinch-point. Confirmed in z20 satellite.
- **guardShack: true.** A small white guard booth (~1-vehicle footprint, set
  beside the entrance lane) is visible in both Street View and z20 satellite -
  a staffed checkpoint controlling truck access.
- **remoteGs: false.** A physical staffed guard booth is present.
- **dockDoors: 50+.** Multiple long building faces show a continuous dock-door
  rhythm; z19 imagery counts dozens of trailers backed in across at least 3-4
  dock banks. Estimated ~60 doors - a high-volume freight operation.
- **dropArea / dropYard: true, 25-50.** Trailer drop and staging spread across
  several yard areas plus finished-goods staging. The large west-side racks
  store finished mowers/tractors (not trailers) and are excluded.
- **shipRcvSeparate: true.** Physically separate dock banks on different
  building faces.
- **scale: false.** No truck scale in the truck path.
- **multipleFacilities: false.** One integrated campus, connected buildings.
- **urbanRural: Rural.** Surrounded by pasture and forest on the rural edge of
  Greene County.

## Yard metrics
- dockDoorCount ~60 (band 50+; high-volume, multiple dock banks)
- trailersVisible ~55 across captured imagery
- trailerParkingCapacity ~70 trailers
- truckGateCount 1 (single guarded truck entrance on the NE access drive)
- buildingCount ~8 distinct/connected buildings
- siteAreaAcres ~95 (developed/fenced plant area; perimeter box larger due to
  irregular footprint with open-field margins)
- railServed false (rail line passes the SW edge; no spur into the plant)

## Web findings
Greeneville Sun, Greene County Partnership, Yelp, TruckMap: John Deere Power
Products at 1630 Hal Henard Rd, Greeneville TN; operating since 1988
(30th anniversary 2018); manufactures 100 Series lawn tractors and residential
ZTrak zero-turn mowers plus bagging equipment/attachments; 4M+ units built;
multiple TOSHA VPP Star and manufacturing-excellence awards; phone 423-787-6100.
A past expansion (the ProCote groundbreaking) added significant jobs/capacity.

## Final confidence: high
Facility identity, the guarded truck gate, the guard booth, and the high-volume
multi-bank dock operation are all confirmed with clear Street View and
satellite evidence. Exact dock-door count and gate lane split are honest
estimates (flagged uncertain).
