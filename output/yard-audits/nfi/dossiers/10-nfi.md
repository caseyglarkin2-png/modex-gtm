# Deep-Audit Dossier — NFI Port Logistics, Port Wentworth GA (idx 10)

**Facility:** NFI Port Logistics Port Wentworth GA
**Type:** Port Logistics (import/export container transload)
**Address:** 120 Crossgate Road, Port Wentworth, GA 31407
**Resolved center:** 32.150300, -81.150400
**Method:** deep-audit (satellite probe + Street View metadata + web research)
**Confidence:** medium

---

## Step 0 — Location confirmation

The supplied coordinates (32.15001, -81.151175) landed squarely on the site. I
probed satellite at z15–z19 around the point and cross-checked the street
address and NFI's published material. The cross/T-shaped warehouse footprint in
the imagery matches NFI's Savannah transload building, and web research
confirms the address and specs. **Positively identified.**

The site sits on a peninsula formed by a bend in the **Savannah River** (bounding
it on the north and east), with a **residential neighborhood (Crossgate)** and a
rail/utility corridor to the west, and **Crossgate Road** along the south/SE.
NFI states the facility is **less than 1 mile from the GPA Garden City Terminal**
— consistent with the location.

---

## Imagery limitation (important)

The static Maxar satellite imagery returned by `probe.ts` captures the site
**mid-construction**: bare graded dirt, partially-erected steel/precast
warehouse roofs, stacked construction materials, and no final pavement striping
or trailers. NFI's transload facility **opened December 5, 2023**, so the
available overhead imagery predates completion. Street View nearest the entrance
is dated **2019-05** and shows raw, fenced vacant land — no operational
coverage exists. Street View metadata returned `ZERO_RESULTS` at the perimeter
centroid, the truck-gate centroid, and along the access road.

Consequence: **location, building footprint and the graded property boundary are
firmly confirmed and traced from imagery; gate-detail fields are inferred from
facility type plus NFI's published specs and are flagged in `uncertainFields`.**

---

## Key views

- **z15/z16 (wide):** Full property on the river peninsula. Graded footprint
  ~77 acres. Cross/T-shaped building in the center; large open graded areas to
  the N and NE destined for trailer/container storage; access funnels from the
  SE corner off Crossgate Road.
- **z17/z18 (building):** Long main bar running roughly E-ESE with a
  perpendicular wing dropping S. Regular dock-door tooth-rhythm forming along the
  building's south face and the wing — two distinct dock banks on different
  faces.
- **z19 (gate / dock):** Gate area still raw dirt with construction staging; dock
  bays being formed (gray strip with bay markings). No barrier arm or finished
  booth resolvable.
- **SW access (z17):** Paved truck court at the foot of the wing with a small
  structure cluster on its SE edge (candidate gatehouse/check-in). Rail line and
  treeline separate the site from the neighborhood; access road curves up from
  Crossgate Road on the SE.
- **Street View 2019:** Raw land behind chain-link perimeter fence — confirms the
  site is fully fenced but is pre-construction.

---

## Web findings (authoritative specs)

NFI's published material for this "first-of-its-kind" Savannah transload
facility:

- **283,240 sq ft** building
- **308 shipping/dock doors**
- **876 trailer spots**
- **9,500 TEU** container stacking capacity
- Up to **200,000 transloads annually**
- **< 1 mile** from GPA Garden City Terminal; ribbon-cutting **Dec 5, 2023**

Sources: NFI Savannah Tour Handout (go.nfiindustries.com), NFI Port Wentworth
Location Spotlight PDF (nfiindustries.com), NFI LinkedIn (283,240 sq ft), Fox28
Savannah coverage of the ribbon-cutting.

---

## Determinations with evidence

- **Truck gate — TRUE (flagged).** Secured bonded port container yard
  (9,500 TEU) is fully fenced (2019 SV) with a single controlled access from the
  SE off Crossgate Road; small structures cluster at the SE corner of the truck
  court. A barrier arm is not directly visible in the construction imagery, so
  this is inferred from facility type + perimeter fencing + entry geometry.
- **Guard shack — TRUE (flagged).** Small structure cluster at the SE corner of
  the truck court (~32.1483, -81.1518) is consistent with a gatehouse/check-in;
  a manned booth is near-certain for a secured/bonded port container yard. Not
  directly confirmable in mid-construction imagery.
- **Remote GS — FALSE.** guardShack inferred true.
- **Docks — 50+** (`dockDoors: "50+"`). 308 published doors across two dock banks
  on different building faces -> `shipRcvSeparate: true`.
- **Drop area — 50+** and **dropYard: true.** 876 trailer spots plus 9,500-TEU
  container stacking; large graded drop-yard areas flank the building N and NE.
- **Staging — pre & post gate true (flagged).** Wide SE apron outside the gate
  and large internal yard inside it; sizes inferred.
- **Driveway long — TRUE.** Deep approach from the SE entrance through the truck
  court to the dock faces holds well over 3 trucks.
- **Entry/exit together — TRUE**, ~2 in / 1 out (`entryLanes: 2`,
  `exitLanes: 1`, flagged). `fastLaneOpportunity: true` — wide apron and huge
  yard leave ample room for an express bypass.
- **Urban/Rural — Rural.** Edge-of-town industrial peninsula beside a small
  neighborhood and the port; not dense metro fabric.
- **Rail served — FALSE.** A rail line runs NW-SE along the western edge but
  reads as a through-line, not a spur into the property; transload is truck
  drayage from the terminal.
- **Scale — FALSE / multiStep — FALSE** (flagged; no scale pad or second
  checkpoint resolvable in construction imagery).
- **connectivityIssue — FALSE** (port-adjacent, well-developed corridor).
- **multipleFacilities — FALSE** (single building).

---

## Yard zones & metrics (traced)

Oriented polygons traced via deterministic `px2ll.mjs` from the z16 frame
(center 32.1505, -81.1512):

- **perimeter** — 8-vertex ring around the graded property inside the
  fence/treeline/riverbank. **siteAreaAcres = 77.2** (computed from the ring).
- **dockAprons** — two rotated quads: one hugging the main bar's south dock face,
  one along the N-S wing.
- **dropYards** — two rings over the large graded trailer/container storage areas
  N and NE of the building.
- **truckGate** — quad over the SE entrance/truck court.
- **staging** — quad over the pre-gate apron off Crossgate Road.
- **streetViewMeta** — `hasCoverage: false` for both perimeter and truckGate
  (no operational pano exists; nearest is 2019 raw-land).

Metrics: dockDoorCount **308**, trailerParkingCapacity **876**,
trailersVisible **0** (pre-operations imagery), truckGateCount **1**,
buildingCount **1**, siteAreaAcres **77.2**, railServed **false**.

---

## Final confidence

**Medium.** Location, building footprint, dock counts and yard capacity are
strongly supported (imagery footprint + NFI published specs). The downgrade from
high is entirely the imagery-timing problem: overhead imagery is
mid-construction and Street View is pre-construction, so the gate arm, guard
booth, lane counts, scale and staging extents are inferred rather than directly
observed. These are listed in `uncertainFields`.
