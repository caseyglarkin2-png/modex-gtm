# Quaker Oats - Bridgeview IL — Deep-Audit Dossier

**Facility:** Quaker Foods plant (Rice-A-Roni, Pasta Roni, Near East, Cheetos Mac 'N Cheese), 7700 W 71st St, Bridgeview IL 60455
**Locked center:** 41.763445, -87.812487 (roster ROOFTOP geocode confirmed on the plant)
**Audited:** 2026-06-12 · method: deep-audit (satellite z17-z20 + Street View 2025-04)

## Location confirmation
Roster pin sat directly on the large mixed dark/white-roof production complex filling
the block north of W 71st St, west of the rail embankment (71st dips under the rail
just east of the plant). Brick office fronting 71st, dock canopies, and a rail spur
into the yard all match a legacy Quaker production plant. Identity confirmed.

## Entrance / gate / guard shack
- **West truck drive off 71st St** (~41.7625, -87.8139): open at the street — SV
  2025-04 shows a semi heading straight into the SW dock pocket, no barrier, no
  booth. The drive is shared with the neighboring DC to the west.
- **East drive**: office/employee entrance (brick office, car lots).
- **NE corner is rail, not trucks**: a spur curves off the mainline into the yard
  (covered-hopper string on the main, pneumatic bulk trailers at the transfer).
- Verdict: `truckGate: false`, `guardShack: false`, `remoteGs: false` — flagged,
  since an interior checkpoint deeper in the yard is possible (no SV inside).
- Long absorbing drives (`drivewayLong: true`), spare paved width
  (`fastLaneOpportunity: true`), queue would not reach 71st (`backupSensitive: false`).

## Docks and yard
- **South canopy bank** (~8-12 doors), **NE dock court** on the north building
  (~6-10), **SW dock pocket** off the west drive (~6). ~24 doors → band **10-25**
  (boundary case, flagged). South vs NE clusters → `shipRcvSeparate: true` (medium).
- **Sparse drop activity**: only ~12 trailers visible (incl. bulk pneumatics at the
  rail spur). The big internal concrete yard between the plant and its north building
  is open maneuvering/staging space, not trailer storage → `dropArea: 0-10`,
  `dropYard: false`.
- **Rail-served: true** — inbound grain/ingredients clearly move by rail.

## Geofences
- **Perimeter**: 6-vertex ring (~15.6 acres): fence/green strip at ~41.7646 (north —
  the big white DC beyond it is a separate facility), the rail mainline (east, with
  the spur protrusion at the NE), 71st St (south), and the shared west drive edge.
- Truck-gate quad on the west drive curb cut (the de facto truck entrance); two
  dock-apron quads (south canopies, NE court); the internal concrete yard traced as
  the `staging` zone. No drop-yard rings (none exist).
- Street View: pano `QNs50FDMiTBz2ycYsHxrKQ` on 71st covers perimeter + truck
  entrance (headings 45/20); pano `1vqOsrMhx29F1AG5lV1a4g` views the south dock
  apron (heading 344). No coverage of the interior staging yard.

## Web corroboration
D&B + Food Business News (Oct 2021 production-line expansion) confirm the active
Quaker Foods plant at this address (roster sources). Rail dependence and the modest
truck-side dock count fit a dry-goods production plant shipping finished pallets.

## Verdict
Open truck access (no gate/booth visible at any curb cut), modest dock count, no
drop yard, heavily rail-served. Yard pain here is dock scheduling more than gate
control. **Confidence: medium** — interior controls and exact door counts unverified.
