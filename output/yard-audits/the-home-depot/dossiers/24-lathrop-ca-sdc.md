# Deep-Audit Dossier — Home Depot SDC, Lathrop CA (idx 24)

**Facility:** Home Depot Stocking Distribution Center
**Address:** 18300 S Harlan Road, Lathrop, CA 95330 (San Joaquin County)
**DC number:** #5363 (listed on Foursquare as "Home Depot SDC 5363")
**Resolved coordinates:** 37.792762, -121.295676
**Confidence:** High

## Location resolution

Web search (Loc8NearMe, Manta, Superpages, Foursquare) confirms the Home Depot
Distribution Center at 18300 S Harlan Rd, Lathrop, CA 95330 — Foursquare
explicitly tags it "Home Depot SDC 5363," matching the roster DC number. The
roster geocode was ROOFTOP precision (1,553 m move). Satellite probing showed
the roster pin sits squarely on a very large cross-dock distribution building
in the Lathrop / I-5 logistics corridor. Location locked. (Note: one directory
mislabels it an "Import Distribution Center"; DC #5363 is HD's SDC.)

## Key views

- **z16 wide:** The HD SDC is one of several very large distribution buildings
  in the Lathrop industrial corridor at the I-5 interchange; solar arrays and
  retention ponds nearby.
- **z17/z18:** Large cross-dock building (~750 m long, NW-SE axis) with dock
  doors and trailers backed in on BOTH long faces. Heavy trailer activity —
  many rows of detached trailers in drop lots on both truck courts.
- **z19-z21 + Street View (2023):** The truck court is wrapped in a chainlink
  perimeter fence; access roads run between the park's buildings.

## Gate / guard-shack determination

**Truck gate: YES.** The truck court is enclosed by a chainlink perimeter fence
(clearly visible in 2023 Street View behind the building's landscaped frontage).
Truck access is through gate openings in that fence on the NE-side access road
and at the SE end — controlled entry.

**Guard shack: NO (flagged uncertain).** No staffed guard booth was found at
any perimeter access point — Street View and satellite show only open/sliding
gates in the chainlink fence, no gatehouse structure. This reads as a modern
Prologis-style spec distribution building without a manned gate. `remoteGs` is
therefore **true**: a fenced, gated truck court with no booth, implying badge /
kiosk entry. `guardShack` is listed in `uncertainFields` in case a small booth
is obscured by the building.

**Lanes / flow:** The cross-dock layout has truck courts wrapping both long
faces with separate access points → modeled as `entryExitSeparate` (~2 truck
gates). Deep truck courts and long internal roads give a 3+ truck queue
(`drivewayLong`); the very wide open courts leave clear room for an express
lane (`fastLaneOpportunity: true`).

## Yard zones & counts

- **Dock doors:** Cross-dock with dock doors along both ~750 m faces — well into
  the **50+** band. `dockDoorCount` ≈ 200 (estimate).
- **Drop yard:** Heavy — many rows of detached trailers in drop lots on both
  truck courts and adjacent yard areas → **50+**, `dropYard: true`.
- **Ship/receive separate:** Two distinct dock banks on opposite long faces →
  `shipRcvSeparate: true`.
- **Staging:** Wide paved truck courts inside the fence give ample post-gate
  holding; no distinct pre-gate staging apron → `staging: null`, `preGateStaging:
  false`, `postGateStaging: true`.
- **Site area:** ~75 acres for the building plus both wrapping truck courts and
  trailer lots — one of HD's larger California distribution buildings.
- **Rail:** A rail line runs parallel to the building's SW side and crosses the
  NE access road, but no spur enters the dock — **not rail-served**.
- **Buildings:** Single distribution building (neighbouring large warehouses are
  separate facilities in the same corridor).

## Web findings

Foursquare and directory listings confirm DC #5363 as HD's Lathrop SDC, a hub
for home-improvement and construction supplies serving Northern California.
Operating hours reported Mon-Fri 6 AM-11:30 PM. No public mention of a
yard-management system.

## Final confidence

**High** on location and layout (ROOFTOP geocode, Foursquare DC# match, clear
imagery of the dual-face cross-dock and fenced truck courts). The
guard-shack/lane-count details are flagged uncertain because the spec-building
gates are unstaffed and exact gate/door counts are honest overhead estimates.
