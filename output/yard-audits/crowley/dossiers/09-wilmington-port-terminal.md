# Deep-Audit Dossier — Crowley Wilmington Port Terminal, Wilmington NC

**Roster idx:** 9
**Type:** Marine terminal / cargo yard
**Address:** 2202 Burnett Boulevard, Wilmington, NC 28401
**Resolved center:** 34.19300, -77.95200

## Location resolution
Roster coordinates (34.196262, -77.948378) landed at the port's
administrative/office cluster on Burnett Boulevard. Web research established
that 2202 Burnett Boulevard is the address of the **Port of Wilmington (NC
State Ports Authority)** — the container terminal from which Crowley operates
its Wilmington marine service. The operational container terminal lies SW of
the office cluster; the locked center is ~34.1930, -77.9520. Street View near
the access road shows a "NORTH CAROLINA PORTS" sign, gantry cranes, and
container stacks — positively identified.

## Key views
- **Wide satellite (z16-17):** Large marine container terminal on the Cape
  Fear River — extensive container stacks (multicolor), chassis rows, gantry
  cranes, warehouses, rail lines.
- **Truck gate (sv2/sv3, z19-20 sat):** Divided multi-lane port access road
  leading to a controlled gate. Z20 satellite shows a gate booth structure
  with lane markings and a barrier arm, and a tractor-trailer passing through.
- **Terminal interior (z18-19):** Massive container marshalling yard with
  stacked containers and chassis; on-dock/adjacent rail lines.
- **Access road (sv1-sv4):** Divided road with a railroad crossing; gantry
  cranes and the NC Ports terminal in the background.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Confirmed — divided port access road leading to a
  controlled gate; z20 satellite shows a gate booth, lane markings, and a
  barrier arm with a truck passing through.
- **guardShack = true.** A gate booth structure sits at the gate lanes
  (visible in z19-20 satellite). Marine terminal under MTSA/port security.
  `remoteGs = false`.
- **entryExitSeparate = true.** Divided multi-lane access road with separate
  inbound/outbound lanes through the gate.
- **dockDoors = "0-10".** Marine container terminal — cargo handling is
  vessel-side via gantry cranes, not building dock doors. Few warehouse dock
  positions; low confidence.
- **dropArea = "50+".** Very large container/chassis marshalling yard with
  extensive stacks and chassis rows.
- **railServed = true.** Rail line runs into and along the terminal; a rail
  crossing is visible on the access road in Street View.
- **multipleFacilities = true.** Port campus: container yard, multiple
  warehouse/admin buildings, berths, gantry cranes.
- **fastLaneOpportunity = true.** Wide divided gate apron with multiple lanes.
- **scale = false** (none clearly visible; flagged uncertain).

## Yard zones & counts
- **Perimeter:** ~182 acres operational container terminal (~1,225 m N-S ×
  ~645 m E-W).
- **truckGate zone:** the controlled gate on the port access road.
- **dropYard:** the large central container/chassis marshalling yard.
- **dockApron:** the river-side berths / gantry-crane apron.
- **staging:** paved area just inside the gate.
- **yardMetrics:** ~8 dock doors, ~60 trailers visible, ~400 capacity, 1 truck
  gate, ~8 buildings, ~182 acres, rail-served.

## Web findings
2202 Burnett Boulevard = Port of Wilmington, NC State Ports Authority — a
container marine terminal. Crowley operates Wilmington as a port terminal in
its liner network. The port handles containerized and breakbulk cargo and has
on-dock rail.

## Final confidence: HIGH
Facility positively identified; truck gate confirmed by satellite (gate booth,
barrier arm, lane markings) and corroborated by Street View of the divided
access road. Dock-door count and lane counts flagged lower confidence
(vessel-side handling dominates at a container terminal).
