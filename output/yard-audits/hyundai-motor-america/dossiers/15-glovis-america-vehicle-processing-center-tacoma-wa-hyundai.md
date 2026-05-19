# Deep-Audit Dossier — idx 15

## Facility
**Glovis America Vehicle Processing Center - Tacoma WA (Hyundai)**
Type: Port / Vehicle Import Processing Center
Address: 3400 Taylor Way, Tacoma, WA 98421

## Location confirmation
The roster coordinate (47.261326, -122.368374) lands inside a very large
finished-vehicle marshalling yard on the Port of Tacoma tideflats. Web research
(Glovis America locations page; Northwest Seaport Alliance press release)
confirms 3400 Taylor Way as the Glovis/Wallenius Wilhelmsen vehicle processing
center handling Hyundai and Kia auto imports — GLOVIS accounts for 60%+ of the
gateway's auto imports. Satellite imagery is consistent: thousands of cars in
striped storage rows with painted lane markings ("STOP", "15 MPH", "SLOW"), a
white PDI/processing building, RoRo berths and rail. Locked center of the core
yard at ~47.2613, -122.3700.

## Key views
- **Wide satellite (z15-17):** sprawling vehicle-storage yard bounded by the
  Blair Waterway / Sitcum Waterway, with Taylor Way and a rail corridor running
  NW-SE along the west side. Adjacent container terminals to the SW.
- **Main building (z19):** white PDI/processing building in the NW of the yard;
  vehicle rows everywhere with painted traffic markings.
- **Gate area (z18-21):** gravel driveway entering the NW corner of the vehicle
  yard; a covered canopy structure with crosswalk markings sits inside (vehicle
  inspection / check point).
- **Street View (2024-04):** two headings at the NW driveway clearly show a
  double-leaf chain-link **swing gate** across the entrance, with a rail
  crossing immediately in front. A small white booth/kiosk is visible just
  inside the gate to the left.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Chain-link double-leaf swing gate across the truck/
  car-carrier driveway, confirmed in Street View from two headings.
- **guardShack = true (medium confidence).** A small white booth/kiosk sits
  just inside the gate. Footprint is small; it may operate as a remote/kiosk
  check-in rather than a continuously staffed shack — flagged uncertain.
  remoteGs left false because a physical booth is present.
- **dockDoors = NONE.** No freight loading docks. This is a vehicle processing
  center: cars drive on/off car-carriers and RoRo ships. The processing
  building has roll-up service doors but no dock bank.
- **multiStep = false** (not clearly two checkpoint stages, though the internal
  inspection canopy hints at a second stage — left false per rubric default).

## Yard zones and counts
- **perimeter:** ~110 acres covering the core marshalling yard.
- **dropYards:** the entire interior is finished-vehicle storage plus
  car-carrier trailer staging — one large box.
- **staging:** paved "KEEP CLEAR" queue area just inside the gate.
- **yardMetrics:** dockDoorCount 0; trailersVisible ~30 (car-carriers and yard
  trucks); vehicle-storage capacity ~8,000 cars (reported as
  trailerParkingCapacity); truckGateCount 1; buildingCount ~4; railServed true.

## Web findings
GLOVIS America selected Port of Tacoma / NWSA as its Pacific Northwest gateway
in 2022, consolidating Hyundai and Kia auto imports. The facility provides
storage, PIO (port-installed options), PDI, body shop and mechanical repair;
~205 direct jobs.

## Confidence
**Medium.** Facility and gate are unambiguous. Guard-shack character and exact
counts (vehicle capacity, site acreage, lane counts) are honest estimates from
overhead imagery; the site was partly under reconfiguration in recent imagery.
