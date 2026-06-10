# Deep-Audit Dossier — Tractor Supply Distribution Center, Macon GA (idx 03)

**Facility:** Tractor Supply Distribution Center
**Type:** Distribution Center
**Address:** 151 Tractor Dr, Macon, GA 31216
**Resolved center:** 32.72530, -83.73180
**Method:** deep-audit (satellite + Street View metadata + web)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied coordinates (32.725721, -83.731072) landed directly on a large
white-roof distribution building with extensive trailer drop yards — correct
on the first probe. Web search for "151 Tractor Dr, Macon GA" corroborated the
identity (maconchamber.com, TruckMap, driver-review aggregators) as the Tractor
Supply Co. Macon Distribution Center, a 24/7 drop-and-hook DC with on-site CAT
Scale and security staff. The building sits in an I-75-corridor industrial park
south of Macon alongside several other large DCs.

The structure is rotated roughly 30° off north (long axis running WSW–ENE), so
all geofences were traced as oriented polygons rather than north-aligned boxes.

---

## Key views

- **z16/z17 overview:** Single large (L-shaped) DC; dock banks on the NW and SW
  faces with trailers backed in; massive trailer drop-yard lots to the NW and W;
  employee/visitor parking lot to the NE; divided-boulevard guarded entrance off
  Tractor Dr; large graded/grassed expansion parcel and perimeter loop road to
  the E/SE; woods on the S and W.
- **z20/z21 gate (32.7281,-83.7301):** Definitive. A divided boulevard with a
  landscaped median; a small white **guard booth** sits on the median; **gate
  arms / sliding gates** span both the inbound and outbound lanes; perimeter
  fencing continues to grass on either side. Staff vehicles parked on the median
  beside the booth.
- **z20 pre-gate apron (32.7276,-83.7307):** A large paved truck turnaround /
  staging apron outside the gate with a trailer staged on it — pre-gate staging.
- **z19 drop yards (NW/W):** Many long rows of parked trailers in dedicated
  storage lots — classic drop-and-hook capacity, far more than 50 stalls.
- **z18/z19 docks:** Regular bay rhythm with trailers backed in on the NW face
  and a second dock line on the SW face — two physically separate dock banks.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled, gated, divided-boulevard truck entrance with
  barrier arms across both lanes and a continuous perimeter fence. Not an open
  driveway.
- **guardShack = true.** White booth on the median straddling the gate lanes
  (~1–2 vehicle footprint), with staff vehicles parked beside it. Driver reviews
  describe helpful on-site security staff. Therefore **remoteGs = false.**
- **entryExitSeparate = true** (entryExitTogether = false). Divided boulevard:
  gated inbound lane one side of the median, gated outbound lane the other.
  entryLanes 1 / exitLanes 1.
- **drivewayLong = true.** Long divided approach plus deep internal yard easily
  holds 3+ trucks; **backupSensitive = false** (isolated internal industrial
  road, abundant stacking room).
- **fastLaneOpportunity = true.** Wide divided gate apron and a large pre-gate
  turnaround leave physical room to add an express/bypass lane.
- **dockDoors = "50+".** Two large dock banks (NW + SW faces); overhead bay/
  trailer rhythm puts the total well above 50 (estimate ~110, flagged uncertain).
- **shipRcvSeparate = true.** Two distinct dock clusters on different building
  faces.
- **scale = true.** Web/driver sources report an on-site CAT Scale.
- **dropYard = true / dropArea = "50+".** Multiple dedicated trailer-storage lots
  NW and W of the building, hundreds of stalls.
- **multiStep = false.** No discrete second checkpoint confirmed in overhead
  imagery (the in-yard CAT scale is not a confirmed second guard stage).
- **urbanRural = "Rural."** Edge-of-town industrial park on the I-75 corridor,
  surrounded by woods and open fields — small-town-industrial → Rural per rubric.
  **connectivityIssue = false** (busy I-75 corridor with multiple DCs).

---

## Yard zones & counts (oriented polygons)

- **perimeter** — 8-vertex ring around the operational fenced area (building +
  drop yards + parking + gate). **siteAreaAcres ≈ 64.7** (shoelace).
- **truckGate** — rotated quad over the divided-boulevard gate/booth.
- **staging** — pre-gate truck turnaround/staging apron outside the gate.
- **dropYards** — 2 rings over the NW and W trailer-storage lots.
- **dockAprons** — 2 rings, one hugging the NW dock wall, one the SW dock wall,
  each at the building's true ~30° angle.

yardMetrics: dockDoorCount ~110, trailersVisible ~230, trailerParkingCapacity
~320, truckGateCount 1, buildingCount 1, siteAreaAcres 64.7, railServed false.
Door/trailer counts are honest overhead estimates and are flagged in
uncertainFields.

---

## Street View

Both nearest panos resolve to **2012-05 pre-construction** frames (Google has
not re-driven the internal access road since the DC was built), but metadata
status is **OK** within 400 m, so coverage is recorded:
- truckGate: pano `R6Z3cYYaPISRIt_RoDrTKQ`, heading 19°.
- perimeter: pano `470APtXRgYZeHxRS6JXZIg`, heading 212°.
The gate determination rests on high-resolution z20/z21 satellite, not on the
dated panos.

---

## Web findings

- maconchamber.com / TruckMap / driver-review aggregators confirm: 24/7
  operation, strict appointment scheduling, drop-and-hook system, on-site CAT
  Scale, driver amenities (restroom/vending), helpful security staff, and a large
  yard that maneuvers well. All consistent with the imagery.

## Final confidence

**High.** Facility unambiguously identified; gate, guard shack, divided
entry/exit, separate ship/receive dock banks, scale and drop yard are all
clearly evidenced. Only the precise door/trailer counts are estimates (flagged).
