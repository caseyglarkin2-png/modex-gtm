# Deep-Audit Dossier — Crowley Isla Grande Terminal, San Juan PR

**Roster idx:** 6
**Type:** Marine terminal / container port (LNG-fueled microgrid, ConRo)
**Address:** Calle Lindbergh, Isla Grande, San Juan, PR 00907
**Resolved center:** 18.45400, -66.10050

## Location resolution
The roster coordinates (18.45679, -66.093211) fell on the **Isla Grande airport
runway**, roughly 1 km NE of the actual terminal. Web research confirmed the
terminal is "across from Isla Grande Airport" on Calle Lindbergh. Wide z16
satellite revealed the container terminal southwest of the runway: distinctive
red/blue container stacks, a ConRo pier with a container barge berthed, and
chassis/trailer marshalling rows. Street View along the perimeter road shows
Crowley-branded trailers, tractors, and gantry cranes — positively identified.

## Key views
- **Wide satellite (z16-17):** Large marine container terminal SW of the
  airport. Container stacks, ConRo pier (south), warehouse + maintenance
  buildings (NW), chassis rows, employee parking.
- **Truck gate (sv11/sv12/sv14, z20 sat):** A multi-lane gate complex with a
  long overhead steel canopy spanning inbound/outbound lanes, a gate building,
  gate booths under the canopy, plus a red/pink kiosk-style booth. Traffic cones
  manage lanes. Located ~18.4546, -66.1015 on Calle Lindbergh.
- **Perimeter road (sv1/sv7/sv8/sv13):** Continuous chain-link perimeter
  fencing; Crowley trailers staged along the public road; gantry cranes in
  background.
- **Pier (z18):** ConRo pier with container ship/barge alongside — vessel-side
  cargo operations.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Unambiguous controlled marine-terminal gate: canopy
  over multiple lanes, gate building, booths. Visible in multiple Street View
  headings.
- **guardShack = true.** Gate booths sit beneath the canopy at the lanes; an
  additional kiosk booth is present. Staffed gate consistent with marine
  terminal access control. `remoteGs = false`.
- **entryExitSeparate = true.** Multiple parallel lanes under the canopy with
  inbound/outbound separation; `entryLanes ≈ 3`, `exitLanes ≈ 2` (exit count
  lower confidence).
- **dockDoors = "10-25".** This is a marine terminal — primary cargo handling
  is vessel-side at the ConRo pier, not building dock doors. ~12 warehouse and
  maintenance-building dock positions counted; low confidence.
- **dropArea = "50+".** Extensive chassis/trailer/container marshalling yard;
  hundreds of trailers visible in tight imagery.
- **backupSensitive = true.** Gate fronts directly onto Calle Lindbergh and
  trailers already line the road — a gate queue can spill onto public road.
- **multipleFacilities = true.** Campus: ConRo pier, multiple warehouse and
  maintenance buildings, large open yard.
- **scale = false** (none clearly visible; flagged uncertain).
- **railServed = false** — no rail spur into the property.

## Yard zones & counts
- **Perimeter:** ~160 acres, fenced operational marine terminal (~900 m E-W ×
  ~720 m N-S).
- **truckGate zone:** the canopy gate complex on Calle Lindbergh.
- **dropYards:** two large marshalling areas (central chassis/trailer rows and
  the southern container/chassis stacks toward the pier).
- **dockApron:** the warehouse cluster on the NW side.
- **staging:** trailer staging strip along the access road north of the gate.
- **yardMetrics:** ~12 dock doors, ~220 trailers visible, ~600 capacity, 1
  truck gate, ~9 buildings, ~160 acres, no rail.

## Web findings
Crowley's flagship Puerto Rico ConRo terminal. Rebuilt with new gantry cranes
and a 900-foot concrete pier to service LNG-powered Commitment-class ships;
LNG-fueled microgrid. Operations office "Across Isla Grande Airport."

## Final confidence: HIGH
Facility positively identified; gate and guard determinations backed by clear
Street View. Dock-door count and exit-lane count flagged as lower confidence
(marine terminal, vessel-side handling dominates).
