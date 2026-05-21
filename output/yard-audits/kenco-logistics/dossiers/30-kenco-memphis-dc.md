# Deep-Audit Dossier — idx 30

## Kenco Memphis DC — Memphis TN

**Type:** Distribution Center / Warehouse
**Resolved coordinates:** 35.07060, -89.95290
**Archetype:** #3 — No Gate / No GS
**Confidence:** low — **identity mismatch, flagged for human review**

## CRITICAL: identity mismatch

The address **3346 Democrat Drive, Memphis TN 38118** belongs to **"KenCo
Distributors Inc"** — an unrelated Nashville-based **building-materials wholesaler**
(drywall, insulation, steel framing, flooring; a small ~7:30am–4:30pm operation).
This is **not** "Kenco Logistics Services" / Kenco Group, the 3PL this roster audits.

Evidence:
- Kenco Group's official warehousing map (kencogroup.com/warehousing-map) lists **no
  Memphis facility** — only Chattanooga, TN (already covered as roster idx 16–18).
- Web listings for 3346 Democrat Drive consistently return "KenCo Distributors Inc,"
  a building-materials company, with BBB category "Building Materials."
- The roster's idx 30 was sourced from a Manta / Yellow Pages "Kenco Logistic Service
  Memphis" listing that conflated the two companies on name similarity.

**Conclusion:** roster idx 30 is most likely a name-collision error; Kenco Logistics
Services probably has no Memphis DC. The classification below describes the physical
building actually at the coordinates (the KenCo Distributors warehouse) so the audit
record is complete, but this should **not** be treated as a Kenco Logistics Services
site. Confidence set to **low** and the site flagged for human review.

## Location resolution

The roster coordinates (35.070065, -89.952907, geocode ROOFTOP) land on a long
multi-tenant warehouse at 3346 Democrat Drive in a dense Memphis industrial district
near Lamar Avenue. The building is a genuine distribution warehouse; its occupant is
KenCo Distributors. Audit locked on the building footprint at 35.07060, -89.95290.

## Key views

- **z16/z17 wide:** Dense Memphis industrial corridor; the target is a long warehouse
  running NW-SE at a major intersection (Democrat Rd).
- **z18/z19 tight:** Long multi-tenant warehouse with a dock-door bank along the SW
  face, a separate large building immediately SW sharing the truck court, and a rail
  line running along the NE side.
- **z20 / Street View (Nov 2025):** The SW dock face has a continuous bank of dock
  doors with canopies/levelers and ~12 trucks/trailers backed in; open paved truck
  court; open driveway connections. No barrier arm, no guard booth.

## Gate / guard-shack / dock determinations

- **truckGate = false.** No barrier arm, gate, or checkpoint structure at any driveway
  or truck-court aisle. Open-access multi-tenant warehouse.
- **guardShack = false.** No staffed booth.
- **remoteGs = false.** No gate.
- **dockDoors = "25-50".** ~40 dock doors along the SW face of the long building;
  banded 25-50. Multi-tenant — KenCo Distributors occupies only a portion.
- **dropArea = "10-25", dropYard = true.** Open SW truck court with ~12 parked
  trailers.
- **railServed = true (uncertain).** A rail line runs immediately along the NE side;
  no clearly visible active spur into the footprint — flagged uncertain.

## Yard zones & counts

- **perimeter:** long warehouse + SW companion building + shared truck court + car
  parking, ~16 acres.
- **truckGate:** null — no gate.
- **dropYards:** the SW shared truck court trailer-parking area.
- **dockAprons:** one — along the SW dock face.
- **staging:** null — postGateStaging true.
- **yardMetrics:** dockDoorCount ~40, trailersVisible ~12, trailerParkingCapacity ~35,
  truckGateCount 0, buildingCount 2, siteAreaAcres ~16, railServed true.

## Web findings

3346 Democrat Drive is KenCo Distributors Inc, a building-materials wholesaler (phone
901-542-0308, BBB "Building Materials"). Kenco Group (the 3PL) is HQ'd in Chattanooga
and its warehousing map shows no Memphis location.

## Final confidence

**Low.** The physical building is identified and audited, but the facility identity
is wrong: 3346 Democrat Drive is KenCo Distributors (building materials), not Kenco
Logistics Services. Roster idx 30 should be flagged for human review and likely
removed as a name-collision artifact.
