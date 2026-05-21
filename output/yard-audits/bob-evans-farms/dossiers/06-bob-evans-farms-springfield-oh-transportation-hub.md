# Deep-Audit Dossier — Bob Evans Farms, Springfield OH Transportation Hub

**Facility:** Bob Evans Farms - Springfield OH Transportation Hub
**Type:** Distribution / transportation hub — private fleet terminal (Bob Evans
Transportation Company LLC, USDOT 911163; ~100+ tractor-trailers)
**Address:** 6088 Green-Field Dr, Springfield, OH 45502
**Resolved coordinates:** 39.838000, -83.857200
**Confidence:** Medium (snow-cover imagery limits detail)
**Archetype:** Gate + Remote GS (probable) — fleet trailer terminal / drop yard

## Location confirmation (Step 0)

The supplied geocode (39.837963, -83.857367, ROOFTOP) landed on a fleet
terminal — a central dispatch/maintenance building flanked by extensive rows
of parked trailers. Web research confirms 6088 Green-Field Dr is the Bob Evans
Transportation Company LLC terminal (USDOT 911163): ~150 employees including
~100 drivers, ~126 tractors, 100+ tractor-trailers, ~20,000 deliveries/yr,
~10M miles/yr. The satellite layout — a terminal building with trailer-storage
rows on both sides — is exactly consistent with a private fleet hub. Positive
ID.

## Imagery limitation

The only available satellite imagery of this site is heavy snow-cover imagery.
It clearly shows the building footprints and trailer rows but obscures
fine-grained ground detail — gate hardware, guard booths, lane markings.
There is no Street View coverage reaching the property (nearest panos are
500m+ away on residential roads). Overall site confidence is therefore set to
**medium**, and gate-related fields are flagged uncertain.

## Key views

- **Wide satellite (z16-z17):** A campus on the edge of Springfield surrounded
  by farm fields; the fleet terminal occupies the central portion, with a
  larger building to the SW that is part of the broader distribution-center
  campus. Internal roads connect to Green-Field Dr on the east.
- **Tight satellite (z18-z20):** Central dispatch/maintenance building with a
  long roof (probable drive-through service bays); dense rows of parked
  trailers on both the west and east sides of the building.
- **Entrance:** Reached via an internal campus road off Green-Field Dr. Gate
  hardware not resolvable in the snow imagery.

## Gate / guard-shack / dock determinations

- **Truck gate: TRUE (uncertain).** A private fleet terminal of this scale
  almost always has a controlled entrance. The gate hardware cannot be
  positively confirmed in the snow imagery — flagged uncertain.
- **Guard shack: FALSE (uncertain).** No booth could be resolved in the snow
  imagery; set false with the call flagged.
- **Remote GS: TRUE (uncertain).** Probable gate, no visible booth → remote
  check-in is the best inference; flagged.
- **Docks: 0-10 band.** This is a fleet terminal, not a DC dock building —
  only a few service/maintenance bays on the central dispatch/shop building
  (~4). Not a loading-dock operation.
- **Drop area: 50+ band.** Extensive trailer-parking rows on both sides of the
  terminal building; well over 50 trailers — the dominant feature of the site.
- **Drop yard: TRUE.** The whole site functions as a fleet trailer yard.

## Yard zones and counts

- **Perimeter:** ~26 acres enclosing the central terminal building and the
  trailer-storage rows on both sides.
- **Truck gate:** approximate box at the campus access road off Green-Field Dr.
- **Drop yards:** two — the west trailer-row block and the east trailer-row
  block flanking the terminal building.
- **Dock aprons:** none (fleet terminal, not a dock operation).
- **Staging:** the forecourt between the trailer rows in front of the terminal
  building.
- **yardMetrics:** dockDoorCount ~4 (service bays); trailersVisible ~120;
  trailerParkingCapacity ~160; truckGateCount 1; buildingCount ~2;
  siteAreaAcres ~26; railServed false.

## Web findings

- 6088 Green-Field Dr = Bob Evans Transportation Company LLC (USDOT 911163,
  MC394396); operating status Authorized For Property.
- ~150 employees (~100 drivers); ~126 tractors; 100+ tractor-trailers; ~20,000
  deliveries/yr; ~10M miles/yr. Vans, reefer, dry-bulk trailers.
- Named on the Bob Evans Grocery About Us page as the company's main
  transportation facility.

## Final confidence

**Medium.** Facility positively identified by address-matched FMCSA registration
and the unmistakable fleet-terminal layout. Confidence is held at medium
because the only imagery is snow-covered: trailer rows and buildings are clear,
but gate / guard-booth hardware cannot be confirmed. Gate-related fields and
counts are flagged uncertain. The site clearly functions as a large private
fleet trailer yard.
