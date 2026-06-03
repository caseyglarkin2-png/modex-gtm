# Yard Audit Dossier — Walmart Regional DC 4020, Conklin NY

**Type:** General Merchandise Distribution Center (Walmart GM Regional DC)
**Address:** 170 Broome Corporate Parkway, Conklin NY 13748
**Resolved center:** 42.043, -75.8113
**Method:** deep-audit (satellite + Street View)
**Confidence:** high

---

## Location confirmation

The supplied coordinates (42.041849, -75.815077) and address ("101 Broome
Corporate Pkwy") landed in the Broome Corporate Park, but Step 0 research
corrected both:

- Web search showed **101 Broome Corporate Parkway is a Lineage public cold-
  storage warehouse**, not Walmart. The **Walmart DC is at 170 Broome Corporate
  Parkway** (confirmed via multiple business listings).
- Satellite at z16 around the supplied point showed two large industrial
  buildings: a smaller one to the SW (the neighbor) and a very large
  ~600m-long white building to the NE running NW-SE with a massive striped
  trailer drop yard. The large building's scale, dual-face dock banks, and
  hundreds of drop-yard trailer stalls are consistent with a Walmart GM
  Regional DC (~1.2M sq ft class). That is the audited building.

Locked center: **42.043, -75.8113**, building long axis running NW (≈42.0456,
-75.8133) to SE (≈42.0408, -75.8098), beside the Susquehanna River.

## What the key views showed

- **z16/z17 overview** — single large white building, NW-SE diagonal. Dock
  banks with backed-in trailers along BOTH long faces. Huge striped trailer
  drop yard on the NE side (toward the river) plus drop rows at the NW corner.
  Employee auto parking at the SE end. Stormwater pond and a N-S rail line off
  the NE edge.
- **SW face (z18 + Street View, pano `xQBhsppiQK1K3xvOllWOcg`, 2019-09)** —
  Street View up Broome Corporate Parkway gives a clean head-on driver's view
  of the SW dock face: a long continuous bank of dock doors, dock levelers and
  backed-in trailers behind a grass berm and guardrail. No gate, fence break or
  guard booth on this stretch — the dock face has no public-road access.
- **NE face (z18)** — second continuous dock-door bank facing the drop yard;
  service road between the wall and the trailer rows. Bounded by a creek/pond.
- **NW corner (z18)** — the **single truck entrance**: one driveway off the
  parkway (~42.0446, -75.8141) curving into the trailer drop yard. This is the
  only point where the secured yard meets a public road.
- **SE / E / NE edges** — bounded by undeveloped land, a creek and a stormwater
  pond; no truck road exits there. The southern driveway serves only employee
  auto parking, an office plaza and an amenity area (basketball court), not
  trucks.

## Gate / guard-shack / dock determinations

- **truckGate: true** — A single controlled truck driveway off Broome Corporate
  Parkway at the NW corner feeds the secured trailer yard. The SW dock face sits
  behind a continuous berm/guardrail (no access), and the remaining edges are
  bounded by water and woods, so this one driveway is the truck gate.
- **guardShack: false (uncertain)** — No guard booth could be positively
  resolved. The z19/z20 tiles over the NW gate throat are roof-shifted, and the
  2019 parkway Street View coverage stops short of the NW entrance
  (ZERO_RESULTS north of ~42.0420). Walmart RDCs are normally guarded, but
  without visual confirmation the call is left false and flagged.
- **remoteGs: true (uncertain)** — Set because a gate exists with no confirmed
  guard shack (implying kiosk/call-box/app check-in). Paired with the
  guardShack uncertainty above.
- **dockDoors: 50+** — Continuous dock-door banks with levelers and backed-in
  trailers confirmed on BOTH long faces over a ~600m building; estimate ~200
  doors total.
- **dropArea / dropYard: 50+ / true** — Large striped trailer drop yard on the
  NE side plus drop rows at the NW corner, hundreds of tractor-less trailers.
- **shipRcvSeparate: true** — Two distinct dock banks on different building
  faces (NE and SW), the cross-dock pattern of a Walmart GM RDC.

## Yard zones and counts

- **perimeter** — traced fence line around the building, both dock berms, the
  NE drop yard and the NW drop rows. ~68 acres (shoelace on the traced ring).
- **truckGate** — small rotated quad over the NW driveway throat.
- **dropYards** — (1) the large NE drop yard, (2) the NW-corner drop rows.
- **dockAprons** — two long thin rotated quads, one hugging the NE dock wall and
  one hugging the SW dock wall, both at the building's NW-SE angle.
- **yardMetrics** — dockDoorCount ≈ 200; trailersVisible ≈ 320; trailer
  parking capacity ≈ 450; truckGateCount 1; buildingCount 1; siteAreaAcres ≈ 68;
  railServed false (rail runs along the NE edge but no spur enters the yard).

## Street View

Only the SW/south stretch of Broome Corporate Parkway has Street View (2019-09).
Pano `xQBhsppiQK1K3xvOllWOcg` (42.04073, -75.81248) gives a confirmed driver's
view of the SW dock face and is recorded for the **perimeter** zone, heading
~30° toward the building. No pano reaches the NW truck gate, so truckGate is
omitted from streetViewMeta (no real pano).

## Web findings

- Walmart occupies 170 Broome Corporate Parkway, Conklin NY (business
  listings). 101 Broome Corporate Parkway is a separate Lineage public
  warehouse. The park hosts several distribution tenants; the audited parcel is
  a single Walmart building cluster (multipleFacilities false for this site).

## Final confidence

**high** for location, gate existence, dock and drop-yard scale, cross-dock
ship/receive separation, and rural setting. Lower-confidence, flagged items:
guardShack / remoteGs (no booth resolvable, no SV at the gate), exact
entry/exit lane counts, and absence of a truck scale.
