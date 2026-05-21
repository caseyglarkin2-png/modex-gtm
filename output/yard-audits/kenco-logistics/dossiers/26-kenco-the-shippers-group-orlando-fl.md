# Deep-Audit Dossier — idx 26

## Kenco / The Shippers Group — Orlando FL

**Type:** Distribution Center / 3PL Warehouse
**Resolved coordinates:** 28.43655, -81.41865
**Archetype:** #3 — No Gate / No GS
**Confidence:** medium

## Location resolution

The roster coordinates (28.375647, -81.36194, geocode precision APPROXIMATE) pointed
to a residential subdivision in SE Orlando — clearly wrong. Web research on The
Shippers Group locations page identified the Orlando facility as a ~58,000 SF
dedicated retail-distribution suite (Suite 800) inside **Building 600, 2612 Consulate
Drive, Infinity Park, Orlando FL 32819**. Corroborated by CRE listings (LoopNet, APN
33-2329-9463-10-000; CBRE/CommercialCafe Infinity Park building pages). Infinity Park
is a ~1.3 M SF Class A industrial park at John Young Parkway near the Beachline
Expressway (SR-528) / Florida's Turnpike interchange.

Satellite probes (z17/z18/z19/z20) and Street View (Jan 2026 panos) confirmed a row
of large modern rear-load distribution buildings with colored office entry towers and
shared truck courts. The audit is locked on the Building 600 footprint.

## Key views

- **z17/z18 wide:** Multiple large white-roof DC buildings, banks of dock doors and
  trailers along truck-court faces, retention ponds, ample car parking. Open
  landscaped street frontage on Consulate Drive.
- **z19/z20 tight:** Building 600 face has a long continuous bank of dock doors with
  ~18 trailers backed in / parked across the shared truck court. An opposing dock
  bank on the adjacent building shares the same court.
- **Street View (Jan 2026):** Open driveways into the truck courts; no barrier arms,
  no sliding/swing gates, no guard booths. Office frontage is hedged landscaping with
  a colored architectural entry tower. Typical open-access spec-industrial park.

## Gate / guard-shack / dock determinations

- **truckGate = false.** No checkpoint structure anywhere on the Consulate Drive
  frontage or at the truck-court drive aisles. Open-access park.
- **guardShack = false.** No staffed booth.
- **remoteGs = false.** No gate, so no remote check-in.
- **dockDoors = "25-50".** Building 600 rear-load face shows ~44 dock doors in z20
  imagery (low-confidence exact count; banded). The Shippers Group occupies one suite,
  so its share of doors is a subset of the building total.
- **dropArea = "10-25".** ~18 trailers parked in marked stalls in the shared truck
  court.

## Yard zones & counts

- **perimeter:** Building 600 parcel + truck court + car parking, ~11.5 acres.
- **dropYards:** one shared truck-court trailer-parking strip.
- **dockAprons:** one apron along the Building 600 truck-court face.
- **truckGate / staging:** null — no gate, no dedicated staging.
- **yardMetrics:** dockDoorCount ~44, trailersVisible ~18, trailerParkingCapacity
  ~30, truckGateCount 0, buildingCount 1, siteAreaAcres ~11.5, railServed false.

## Web findings

The Shippers Group (acquired by Kenco Jan 2024) lists Orlando as a ~58,000 SF
dedicated retail-distribution operation. Building 600 / 2612 Consulate Dr is a
multi-tenant rear-load building within Infinity Park Phase 1 (other Phase 1 buildings:
100, 200, 500, 700). Other park tenants include Frito-Lay and aviation training firms.

## Final confidence

**Medium.** The facility is positively identified and the building is unambiguous, but
TSG occupies only one suite of a multi-tenant building, so dock-door and trailer
counts for "the facility" are reported at the building level and the share belonging
to this tenant cannot be isolated from imagery. Entry/exit lane structure is open and
unconstrained. Gate/guard determinations are high-confidence (clearly none).
