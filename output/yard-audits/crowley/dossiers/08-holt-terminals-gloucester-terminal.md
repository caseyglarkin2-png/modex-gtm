# Deep-Audit Dossier — Crowley Holt Terminals (Gloucester Terminal), Gloucester City NJ

**Roster idx:** 8
**Type:** Marine terminal / breakbulk yard
**Address:** 160 Essex Street, Gloucester City, NJ 08030
**Resolved center:** 39.90350, -75.12550

## Location resolution
Roster coordinates (39.903121, -75.122743) land at the terminal — confirmed
correct. Web research established that 160 Essex Street is the **Pier 8 & 9
Warehouse**: a solar-powered, 25-million-cubic-foot refrigerated facility with
100+ dock doors, part of the Holt-operated Gloucester Marine Terminal in the
Port of Philadelphia. Satellite imagery shows a complex of large solar-roofed
warehouses on piers extending into the Delaware River, with a breakbulk/
container yard. Street View at the east entrance shows a posted "TRUCK
ENTRANCE" sign and a "GATE" sign — positively identified.

## Key views
- **Wide satellite (z16-17):** Multiple large solar-roofed warehouses on
  Delaware River piers; breakbulk/equipment yard; gantry cranes; the facility
  sits against the dense residential fabric of Gloucester City.
- **Truck gate (sv2/sv4, z19-20 sat):** Posted "TRUCK ENTRANCE" and "GATE"
  signage at the east entrance. A gate building and cone-managed gate lanes are
  visible; z20 satellite shows a gate booth structure and a gate barrier arm
  across the lane. Gantry cranes and breakbulk warehouse behind.
- **Terminal interior (z19-20):** Open paved breakbulk yard with parked
  trailers, rows of chassis/equipment, and cargo; warehouse dock faces.
- **Surroundings (sv1, sv5):** Residential streets and the bridge overpass
  abut the terminal — urban setting.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Unambiguous — posted "TRUCK ENTRANCE" / "GATE" signage,
  a gate building, cone-managed gate lanes, and a barrier arm visible in z20
  satellite. Controlled marine-terminal entrance.
- **guardShack = true.** A small staffed gate building sits at the truck-
  entrance lanes (visible in z20 satellite and Street View). Marine terminal
  under MTSA security. `remoteGs = false`.
- **dockDoors = "50+".** The Pier 8 & 9 refrigerated warehouse alone carries
  100+ dock doors per Holt documentation; the whole complex is well over 50.
- **dropArea = "25-50".** Open paved yard holds breakbulk cargo, parked
  trailers, and chassis rows — estimated 25-50 drop trailers.
- **railServed = true.** Rail tracks serve the terminal complex (the rail/road
  bridge crosses the property; rail access into the Port of Philadelphia).
- **multipleFacilities = true.** Campus of multiple large solar-roofed
  warehouses, breakbulk yard, and piers.
- **backupSensitive = true.** The gate fronts a street with adjacent
  residential development; limited stacking can push a queue toward the road.
- **fastLaneOpportunity = true.** Wide paved gate apron with multiple lanes.
- **scale = false** (none clearly visible; flagged uncertain).

## Yard zones & counts
- **Perimeter:** ~137 acres operational marine terminal (~720 m N-S × ~770 m
  E-W).
- **truckGate zone:** the east entrance off Essex/King Street.
- **dropYards:** the central breakbulk/trailer yard and the northern
  warehouse-block yard.
- **dockApron:** the river-side / pier-side warehouse faces.
- **staging:** the paved area just inside the gate.
- **yardMetrics:** ~90 dock doors, ~110 trailers visible, ~350 capacity, 1
  truck gate, ~7 buildings, ~137 acres, rail-served.

## Web findings
Gloucester Marine Terminal operated by Gloucester Terminals LLC / Holt
Logistics — stevedoring, breakbulk, and warehousing in the Port of
Philadelphia. 160 Essex St = Pier 8 & 9 Warehouse: 25M cu ft refrigerated
storage, solar-powered, 100+ dock doors, 650 reefer plugs.

## Final confidence: HIGH
Facility positively identified; truck gate confirmed by explicit "TRUCK
ENTRANCE" / "GATE" signage and gate structures visible in both Street View and
satellite. Lane counts and the presence of a truck scale are flagged as lower
confidence.
