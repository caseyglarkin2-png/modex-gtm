# Deep-Audit Dossier — idx 28

## Kenco / The Shippers Group — Grand Prairie TX

**Type:** Distribution Center / 3PL Warehouse
**Resolved coordinates:** 32.79050, -97.01300
**Archetype:** #3 — No Gate / No GS
**Confidence:** medium

## Location resolution

The roster coordinates (32.781145, -97.017588, geocode precision APPROXIMATE) pointed
to undeveloped/under-construction land. Initial web research returned "3845 Grand
Lakes Way" — but Dallas County tax records (city-data) show 3845 is the Inmar Rx
Solutions building, while **"WAREHOUSE SHIPPERS" (Shippers Warehouse / TSG) is a
tenant at 3953 Grand Lakes Way**. TruckMap and Waze both list "Shippers Warehouse,
3953 Grand Lakes Way, Grand Prairie TX 75050", confirming the correction.

**3953 Grand Lakes Way** is a ~1,060,075 SF Duke Realty / Prologis distribution
building in the Grand Lakes Industrial Park, on I-30 between Dallas and Fort Worth.
TSG occupies a ~281,206 SF dedicated suite within it (co-tenants include Ferrara
Candy, Tennant Sales, Prinova). A Street View pano shows a "TENNANT" tenant sign on
the building, corroborating the building identity. Audit locked on the building
footprint at 32.79050, -97.01300.

## Key views

- **z16/z17 wide:** A very large warehouse building with dock-door banks and trailers
  along both long faces, plus a large trailer drop yard on the east side. Adjacent
  warehouses in the same Duke Realty park.
- **z18/z19 tight:** Continuous dock doors with many trailers backed in on both the
  west and east faces; a deep paved truck court on each side; the east drop yard
  holds rows of parked trailers.
- **Street View (Dec 2024):** Long modern warehouse set back behind landscaped lawn
  along Grand Lakes Way. Open driveway connections; no barrier arms, no guard booths.
  "TENNANT" tenant signage visible on the building.

## Gate / guard-shack / dock determinations

- **truckGate = false.** No barrier arm, sliding/swing gate, or checkpoint structure
  at any Grand Lakes Way driveway or truck-court drive aisle. Open-access Class A
  Duke Realty spec building.
- **guardShack = false.** No staffed booth.
- **remoteGs = false.** No gate.
- **dockDoors = "50+".** A ~1.06M SF building with continuous dock-door banks along
  both long (west and east) faces — counted ~130 doors total; banded 50+.
- **dropArea = "50+", dropYard = true.** The east-side drop yard is packed with rows
  of parked trailers (~90 trailers visible across both courts).
- **shipRcvSeparate = true (uncertain).** Dock doors run along two opposite building
  faces, each with its own truck court — consistent with separate shipping/receiving
  operations at this scale; flagged uncertain (could be a single tenant using both
  sides).

## Yard zones & counts

- **perimeter:** building + west dock court + east drop yard, ~42 acres.
- **truckGate:** null — no gate.
- **dropYards:** the large east-side trailer-storage yard.
- **dockAprons:** two — one along the west dock face, one along the east dock face.
- **staging:** null — postGateStaging true (deep open truck courts before docks).
- **yardMetrics:** dockDoorCount ~130, trailersVisible ~90, trailerParkingCapacity
  ~160, truckGateCount 0, buildingCount 1, siteAreaAcres ~42, railServed false.

## Web findings

The Shippers Group (acquired by Kenco Jan 2024) operates a ~281,206 SF dedicated
distribution suite. The host building, 3953 Grand Lakes Way, is a ~1,060,075 SF Duke
Realty / Prologis Class A distribution building in Grand Lakes Industrial Park, with
excellent I-30 / I-20 access midway between Dallas and Fort Worth.

## Final confidence

**Medium.** The facility is positively confirmed (3953 Grand Lakes Way, corrected from
the erroneous 3845 address; building identity backed by tax records and tenant
signage). Gate and guard-shack calls are high-confidence (clearly open-access). The
yardMetrics are honest building-level estimates — TSG's 281k SF suite is a fraction
of the 1.06M SF building, so per-tenant counts cannot be isolated from imagery;
shipRcvSeparate and exact dock count are flagged uncertain.
