# Deep-Audit Dossier — idx 16

## Facility
**Glovis America Port Vehicle Processing - Jacksonville FL**
Type: Port / Vehicle Import Processing Center
Roster address: 2064 E 11th St, Jacksonville, FL 32206

## Location confirmation
The roster coordinate (30.349676, -81.626996) lands on a small commercial
building in a residential block on E 11th St — clearly an office address, not
the operational yard. Web research (Glovis America locations page; JAXPORT
Talleyrand Marine Terminal page) places Glovis's Jacksonville auto-import
processing at the JAXPORT Talleyrand Marine Terminal, ~0.4 mi south. Satellite
imagery there shows a large finished-vehicle processing complex: thousands of
cars in marked storage rows, processing/PDI buildings, a guarded entrance, and
marine warehouses on the St. Johns River. Locked the audited yard center at
~30.3460, -81.6250. Note Talleyrand hosts multiple auto-import processors;
gate signage references "Southeast Toyota" / "Talleyrand."

## Key views
- **Wide context (z15):** port-side industrial corridor along the St. Johns
  River; several vehicle-storage yards and marine warehouses.
- **Yard probes (z16-19):** large vehicle processing yard — cars in striped
  rows, elongated processing/PDI buildings with rows of roll-up service doors,
  port container cranes beyond.
- **Gate (z19-21):** a guarded entrance on the yard's SW road frontage — a
  dark-roofed guard booth flanked by sliding gate segments; STOP markings.
- **Street View (2022-01 and 2025-02):** definitive — a white/red multi-window
  **guard booth** sits in the entry lane beside a **sliding chain-link gate**,
  with a check-in lane, STOP sign and an overhead electronic message board.
  Yard behind a continuous perimeter chain-link fence.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Sliding chain-link gate across the truck lane,
  confirmed in Street View from two capture years.
- **guardShack = true.** Classic single-vehicle-footprint guard booth with
  windows on multiple sides, set in the entry lane beside the gate. remoteGs
  false.
- **dockDoors = 10-25 (low confidence).** The central elongated processing
  buildings show a regular rhythm of roll-up service-bay doors — these are
  vehicle processing / wash / PDI bays rather than classic freight docks.
- **postGateStaging = true.** Paved apron / queue area just inside the gate.
- **multiStep = false** (single checkpoint visible).

## Yard zones and counts
- **perimeter:** ~70 acres for the audited yard cluster.
- **dropYards:** one large box — the interior is overwhelmingly finished-vehicle
  storage plus car-carrier staging.
- **staging:** paved area just inside the gate.
- **yardMetrics:** dockDoorCount ~16 (processing-bay doors); trailersVisible
  ~25; vehicle-storage capacity ~6,000 cars (reported as
  trailerParkingCapacity); truckGateCount 1; buildingCount ~6;
  railServed false (broader Talleyrand terminal is rail-served via the ICTF,
  but no spur visibly enters the vehicle yard).

## Web findings
Glovis America lists a Jacksonville location at 2064 E 11th St. JAXPORT's
Talleyrand Marine Terminal handles auto imports, breakbulk, liquid bulk and
containers; Hyundai Glovis is among the RO/RO carriers calling Jacksonville.
Sources note Jacksonville auto-import volume has been partly consolidated to
Brunswick GA — the Jacksonville operation may be a smaller / legacy node.

## Confidence
**Medium.** The gate and guard-shack are unambiguous from Street View. The
office-vs-yard split required research, and Talleyrand's shared multi-operator
layout plus processing-bay door counts and rail status are estimates flagged in
uncertainFields.
