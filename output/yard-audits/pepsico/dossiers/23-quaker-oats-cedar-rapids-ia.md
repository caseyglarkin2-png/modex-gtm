# Quaker Oats - Cedar Rapids IA — Deep-Audit Dossier

**Facility:** Quaker Oats cereal mill (world's largest), 418 2nd Street NE, Cedar Rapids IA 52401
**Locked center:** 41.98220, -91.67100 (mid-complex; roster geocode was on-site)
**Audited:** 2026-06-12 · method: deep-audit (satellite z16-z18 + Street View 2021-09)

## Location confirmation
Unmistakable: the dense legacy mill complex on the east bank of the Cedar River,
downtown Cedar Rapids. Street View from the south street shows PEPSICO and QUAKER
signage on the brick mill block. Identity certain.

## Entrance / gate / guard shack
- The visible truck access is the **SE dock apron curb cut off the public street**:
  an open apron — trucks back into the angled dock bank essentially from the street.
  **No barrier, gate, or booth** visible (SV 2021-09). → `truckGate: false`,
  `guardShack: false`, `remoteGs: false` — flagged uncertain because the north
  trailer yard's access is interior with no SV coverage; a control point there
  cannot be ruled out.
- Approach is dock-direct (`drivewayShort: true`) and the maneuvering interacts with
  the public street in a downtown block → `backupSensitive: true`. No room for added
  lanes (`fastLaneOpportunity: false`).

## Docks and yard
- **South dock building**: angled bank, ~10-14 trailers docked; **east-face bank**
  ~8 positions. ~22 truck doors total → band **10-25** (truck-side only; much of the
  mill's volume moves by rail and internal bays).
- **North trailer yard** between the elevator/silo block and the rail corridor:
  ~20-25 drop trailers in rows, plus scattered south positions (~40 visible total)
  → `dropArea: 25-50`, `dropYard: true`.
- **Rail-served: true** — mainline plus multiple spurs with hopper-car strings along
  the entire east side; the north elevator loads cars directly. An overhead conveyor
  links the north warehouse cluster to the mill (`multipleFacilities: true`).
- Employee parking fills the riverfront lots south of the E Ave bridge.

## Geofences
- **Perimeter**: 11-vertex ring (~26.5 acres) following the river bank (west), the
  north elevator yard, the rail corridor (east), and the downtown street (south).
  NE rail-zone boundary is operational, not parcel-exact (flagged in notes).
- Truck-gate quad placed on the SE dock-apron curb cut (the de facto truck entrance);
  one north drop-yard ring; two dock aprons — the SE bank traced as a rotated quad
  parallel to the angled dock line, plus the east-face bank.
- Street View: pano `eaS0R8qNXbpCQG_L1UbZaQ` (south street) covers perimeter,
  entrance (heading 20), and the SE dock apron (heading 337). No coverage at the
  interior north yard.

## Web corroboration
Wikipedia/Iowa DNR/Cedar Rapids Metro Economic Alliance (roster sources): operational,
~740 employees, PepsiCo/Quaker Foods, world's largest cereal mill. The 2008 flood
history explains the riverfront layout. Heavy rail dependence is well documented.

## Verdict
Open urban mill: no visible truck gate or guard shack, dock-direct street access,
split truck/rail operation across two linked clusters. A yard-management fit is real
(drop yard + multi-cluster flows) but the site washes toward "open/no-gate" archetypes.
**Confidence: medium** — interior north-yard access and parcel edges unverified.
