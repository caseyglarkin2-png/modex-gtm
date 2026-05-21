# Deep-Audit Dossier — Crowley Gulfport Terminal, Gulfport MS

**Roster idx:** 10
**Type:** Marine terminal / port facility
**Address:** 692 30th Avenue, Gulfport, MS 39501
**Resolved center:** 30.36000, -89.09500

## Location resolution
Roster coordinates (30.363167, -89.096963) carried a RANGE_INTERPOLATED
geocode and landed near the Gulfport small-craft harbor / port edge. Web
research established that Crowley's Gulfport facility is at **692 West Pier**
— the West Pier Terminal of the Port of Gulfport (Mississippi State Port
Authority), where Crowley leases warehouse/yard space alongside Dole and
Chiquita. The operational marine terminal is the pier complex extending into
the Gulf of Mexico; the locked center is ~30.3600, -89.0950. CROWLEY-branded
containers are visible at the port entrance in Street View — confirmed.

## Key views
- **Wide satellite (z15-16):** Port of Gulfport — a large pier complex on the
  Gulf with the West Pier Terminal (container/chassis storage, warehouses),
  the main port terminal, gantry cranes, and extensive paved laydown yards.
- **West Pier Terminal (z16-17):** Container stacks (dry + reefer), chassis
  rows, the West Pier Terminal Warehouse / Shed 16, gantry cranes along the
  pier edge.
- **Port perimeter (sv2/sv3/sv5):** Tall ornamental steel security fence rings
  the entire port; "Ports America" signage; warehouses behind the fence.
- **Port entrance (sv7/sv10):** Secured access road into the terminal; a
  "GULFPORT" port-entrance sign; CROWLEY-branded containers and gantry cranes
  at the gate. Street View coverage ends at the gate checkpoint.
- **Rail (z19-20 sat):** Multiple rail lines run into and along the terminal.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Confirmed — the entire Port of Gulfport is enclosed by
  a tall ornamental steel security fence (visible in multiple Street View
  frames). The truck access road runs into the secured terminal through a
  controlled checkpoint; a port-entrance sign and CROWLEY containers mark the
  entrance. MTSA-regulated marine terminal.
- **guardShack = true (uncertain).** Inferred from the MTSA-regulated secured
  port and the controlled entrance road. Street View coverage ended at the
  gate, so the gate booth itself was not directly imaged — flagged uncertain.
  `remoteGs = false`.
- **dockDoors = "0-10".** Marine terminal — cargo handled vessel-side via
  gantry cranes; the warehouses (Shed 16, West Pier Terminal Warehouse) carry
  limited dock doors. Low confidence.
- **dropArea = "50+".** Extensive container/chassis marshalling across the
  West Pier and adjacent laydown yards — large stacks and chassis rows.
- **railServed = true.** Multiple rail lines run into and along the terminal.
- **multipleFacilities = true.** Port campus: West Pier Terminal, warehouses,
  container yard, berths/gantry cranes, plus the Port of Gulfport marine
  building.
- **fastLaneOpportunity = true.** Wide port entrance road and apron.
- **scale = false** (none clearly visible; flagged uncertain).

## Yard zones & counts
- **Perimeter:** ~163 acres secured marine terminal (~1,060 m N-S × ~625 m
  E-W).
- **truckGate zone:** the controlled entrance on the port access road (north).
- **dropYards:** the West Pier container/chassis yard and the northern laydown
  storage area.
- **dockApron:** the pier-side berths / gantry-crane apron.
- **staging:** the paved area along the entrance road just inside the gate.
- **yardMetrics:** ~10 dock doors, ~90 trailers/chassis visible, ~450
  capacity, 1 truck gate, ~6 buildings, ~163 acres, rail-served.

## Web findings
692 West Pier = West Pier Terminal of the Port of Gulfport (MS State Port
Authority). Crowley leases there alongside Dole and Chiquita. Crowley launched
its Mexico Gulf Express weekly container service to Gulfport — the first new
weekly container service to the port in 25 years. Terminal operated under
Ports America. On-dock rail.

## Final confidence: MEDIUM
Facility positively identified (West Pier Terminal, Port of Gulfport;
confirmed by CROWLEY-branded containers at the entrance). The port is
unambiguously fully fenced and gated, so `truckGate` is confirmed; however
Street View coverage ended at the gate checkpoint, so the guard-booth
structure could not be directly imaged and `guardShack` is inferred from the
MTSA-regulated secured-port access regime. Lane counts and truck-scale
presence are flagged lower confidence.
