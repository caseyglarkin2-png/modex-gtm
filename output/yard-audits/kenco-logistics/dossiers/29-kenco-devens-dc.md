# Deep-Audit Dossier — idx 29

## Kenco Devens DC — Devens MA

**Type:** Distribution Center / Northeast Warehouse
**Resolved coordinates:** 42.54620, -71.59450
**Archetype:** #3 — No Gate / No GS
**Confidence:** medium

## Location resolution

The roster coordinates (42.546746, -71.594485, geocode precision ROOFTOP) landed
directly on a long warehouse building at **50 Independence Drive, Devens MA 01434** —
confirmed correct. Business listings show the facility is also branded **"Kenco's USG
Boston"** — a Kenco distribution operation handling USG (United States Gypsum)
building products. The audit is locked on the building footprint at
42.54620, -71.59450.

## Key views

- **z16 wide:** A redeveloped former-army-base commerce park (Devens) with multiple
  warehouse buildings and a major rail line / rail yard running NW-SE through the
  district.
- **z17/z18 tight:** The target is a long warehouse running NW-SE. The SW face carries
  a continuous bank of dock doors with trailers backed in; the office and car parking
  are at the SW end; a wide truck apron sits at the SE end adjacent to the rail yard.
- **z19/z20 detail:** ~22 dock doors counted along the SW face with ~14 trailers; the
  SE-end apron holds additional parked trailers. Rail tracks and rail cars run
  immediately along the building's NE/E side.
- **Street View (Aug 2023):** A chain-link perimeter fence rings the property; the
  building sits back behind a landscaped lawn with trees along Independence Drive. A
  yard tractor is visible. No barrier arm or guard booth observed at the entrance.

## Gate / guard-shack / dock determinations

- **truckGate = false (uncertain).** A chain-link perimeter fence rings the property,
  but no barrier arm or sliding/swing gate structure was observed at the driveway off
  Independence Drive. Devens commerce-park roads are open public roads. Flagged
  uncertain because frontage trees partly obscure the exact entrance.
- **guardShack = false (uncertain).** No staffed booth visible.
- **remoteGs = false.** No confirmed gate.
- **dockDoors = "10-25".** ~22 dock doors along the SW face with ~14 trailers backed
  in; additional loading positions at the SE-end apron.
- **dropArea = "10-25", dropYard = true.** Trailers along the SW dock face plus the
  SE-end paved apron.
- **railServed = true (uncertain).** A rail line and rail yard run immediately along
  the building's NE/E side with rail cars and an apparent spur near the SE-end apron.
  USG building-products distribution is a heavy rail user, supporting a rail-served
  call — flagged uncertain since a spur directly entering the footprint is not
  unambiguously confirmable from overhead imagery.

## Yard zones & counts

- **perimeter:** building + SW dock court + SE apron + car parking, ~13.5 acres.
- **truckGate:** null — no gate structure.
- **dropYards:** the SE-end truck apron / trailer-parking area.
- **dockAprons:** one — along the SW dock face.
- **staging:** null — postGateStaging true (open courts before docks).
- **yardMetrics:** dockDoorCount ~22, trailersVisible ~14, trailerParkingCapacity ~25,
  truckGateCount 0, buildingCount 1, siteAreaAcres ~13.5, railServed true.

## Web findings

Kenco operates the Devens facility (50 Independence Drive) as a Northeast distribution
warehouse, branded "Kenco's USG Boston" for United States Gypsum building products.
Devens is a redeveloped former Fort Devens army base, now a commerce park in
north-central Massachusetts, served by rail.

## Final confidence

**Medium.** The facility is positively confirmed (ROOFTOP geocode on the correct
building, "Kenco's USG Boston" branding). Dock counts are solid mid-range estimates.
The gate/guard-shack calls are flagged uncertain — a chain-link fence is present but
no checkpoint structure was confirmable and frontage trees obscure the entrance. Rail
service is inferred true from the adjacent rail yard and USG's rail-heavy product line
but is flagged uncertain.
