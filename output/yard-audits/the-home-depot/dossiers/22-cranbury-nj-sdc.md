# Deep-Audit Dossier — Home Depot SDC, Cranbury NJ (idx 22)

**Facility:** Home Depot Stocking Distribution Center
**Address:** 61 Cranbury Station Road, Cranbury, NJ 08512 (Middlesex County)
**DC numbers:** #5960 / #5965 / #5966 (Northeast SDC campus per SupplierWiki HD DC list)
**Resolved coordinates:** 40.307257, -74.498028
**Confidence:** High

## Location resolution

Web search (chamberofcommerce, BusinessYab, Manta, Waze) confirms "Home Depot
Distribution Center, 61 Station Rd / 61 Cranbury Station Road, Cranbury, NJ
08512," a General Warehousing & Storage operation running 24 hours on weekdays
(Dun & Bradstreet lists ~400 employees). Satellite probing at the roster
coordinate showed a single very large cross-dock distribution building inside
the Cranbury / Exit 8A logistics corridor along the NJ Turnpike. Location
locked at the roster lat/lng (geocode move was only 1,434 m).

## Key views

- **z16 wide:** The HD DC sits in a continuous belt of large distribution
  buildings — Cranbury's Exit 8A logistics cluster — bounded by the NJ Turnpike
  to the east. Dense industrial fabric.
- **z17/z18:** Large cross-dock building (~600 m long, E-W axis) with dock doors
  and trailers backed in on BOTH long faces (N and S), each fronted by an orange/
  tan dock-canopy strip. Very high trailer density — multiple full rows of
  detached trailers in drop lots on both the N and S courts.
- **z19-z21 gate views:** The truck driveway curves north off Cranbury Station
  Road and reaches a guarded checkpoint ~150 m in.

## Gate / guard-shack determination

**Truck gate: YES.** At ~40.3063, -74.5001 the truck driveway passes through a
clear checkpoint: barrier arms span the inbound and outbound lanes (visible as
thin horizontal lines crossing the pavement in z20/z21 imagery), with a guard
booth in the median island between them. This is a controlled, guarded
entrance — not an open driveway.

**Guard shack: YES.** A small booth with a distinctive pyramidal roof sits in
the center median island between the two truck lanes, directly beside the
barrier arms. Booth-sized footprint, distinct from the main DC building.
`remoteGs` is therefore false.

**Lanes:** 1 inbound and 1 outbound lane through the gate (single barrier arm
each side), the booth between them → `entryExitTogether`. Standard
single-lane-each-way geometry, no extra paved width → `fastLaneOpportunity:
false`. The driveway runs ~150 m from the public road with room to stack a
3+ truck queue → `drivewayLong`.

## Yard zones & counts

- **Dock doors:** Cross-dock building with dock doors along both ~600 m faces;
  well into the **50+** band. `dockDoorCount` ≈ 175 (estimate).
- **Drop yard:** Dense rows of detached trailers (no tractor) in drop lots on
  both the N and S truck courts — one of the highest trailer densities seen in
  this run → **50+** drop area, `dropYard: true`.
- **Ship/receive separate:** Two distinct dock banks on opposite long faces →
  `shipRcvSeparate: true`.
- **Staging:** Modest paved apron outside the gate (pre-gate) and paved yard
  inside the gate before the dock aprons (post-gate).
- **Site area:** ~56 acres for the fenced/developed footprint (building + both
  truck courts + drop lots).
- **Rail:** No rail spur into the property.
- **Buildings:** Single distribution building (neighboring large warehouses are
  separate facilities in the same corridor).

## Web findings

SupplierWiki's HD DC list catalogs this as a multi-number SDC campus
(#5960/5965/5966). Its location in the Exit 8A corridor — one of the densest
distribution clusters in the Northeast — fits the SDC role of conveyable
inventory holding feeding regional RDCs/stores. No public mention of a
yard-management system.

## Final confidence

**High.** Location unambiguously confirmed; the guard booth, barrier arms,
dual dock faces and heavy drop lots are clearly visible in current Maxar
imagery. Exact dock-door and trailer-capacity counts are honest estimates
from overhead imagery (flagged in `uncertainFields`).
