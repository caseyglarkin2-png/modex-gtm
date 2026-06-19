# Crowley Santo Tomas de Castilla Container Terminal — Guatemala

**idx 23 · slug `crowley-santo-tomas` · method: deep-audit · confidence: medium**

## Resolved location
- **Coords:** 15.6968, -88.6150 (terminal core on Amatique Bay)
- **How confirmed:** Crowley + Empresa Portuaria Nacional Santo Tomas de Castilla pages and multiple port references place the port at ~15.69–15.71 N / ~-88.616 W, administratively part of Puerto Barrios on Guatemala's narrow Caribbean coast, off highway CA-9 (km 298). Satellite at z16 showed an unmistakable container/multipurpose terminal — long quay, dense container stacking rows, transit-shed warehouses — and z18–z20 confirmed ship-to-shore/ship gear at the quay, terminal tractors, and chassis/trailer rows along the apron.

## What the key views showed
- **z16 wide:** Full terminal estate running ~1 km along the bay: berths with vessels at quay, multiple long warehouses/transit sheds, and extensive container ground-slot rows. Town and CA-9 immediately landward.
- **z18:** Quay cranes, break-bulk and containerized cargo, a very large pale-roof warehouse on the east side (the +350,000 sqft Crowley warehouse / transit shed).
- **z19/z20:** Break-bulk vessel with ship gear at berth; chassis and trailers staged in rows along the apron; container ground slots and terminal tractors clearly resolved — good for slot counting.

## Gate / guard / dock determinations
- **truckGate: true (inferred).** A fenced national port estate with a single landward access corridor off CA-9 — the standard secured-gate configuration for a Central American container port. Specific gate hardware not resolved at available resolution → flagged uncertain.
- **guardShack: true (inferred).** Secured national port; specific booth not positively resolved → flagged uncertain.
- **scale: true (inferred).** Crowley publishes Guatemala export weight restrictions enforced at the terminal, implying a gate weighbridge. Not visually confirmed → flagged uncertain.
- **dockDoors: 0-10.** Marine terminal — near-zero OTR docks. The count (~10, low confidence) reflects loading doors on the landward face of the attached +350k sqft warehouse.

## Yard zones & counts
- **perimeter:** oriented 6-vertex ring tracing the fenced terminal along the bay, ≈ 67 acres.
- **dropYards:** one ring over the main container/chassis stacking yard.
- **dockApron:** thin quad hugging the warehouse loading face.
- **trailerParkingCapacity (yard spots): ~2,200 CONTAINER/CHASSIS GROUND SLOTS** (not OTR trailer stalls). `dropArea` 50+. Low-confidence — estimated from z18–z20 stack density.
- **railServed:** false (Guatemala Atlantic rail largely inactive; no spur resolved).

## Web findings
- Crowley runs scheduled liner services to/from Santo Tomas alongside Maersk, Seaboard, King Ocean, CMA CGM, Hapag-Lloyd, X-Press Feeders, NWS, Marfret.
- Crowley operates a **+350,000 sqft warehouse, 24/7** at this terminal.
- Guatemala's dominant Caribbean cargo gateway; on Amatique Bay in Izabal, part of Puerto Barrios municipality.

## Street View
2018-04 user photosphere (pano `CAoSFkNJSE0wb2dLRUlDQWdJQ0UxcmpfRnc.`) on the public access road ~280 m SW of the terminal; no Google car coverage inside the secured port. Camera heading 66° points from the pano toward the terminal. `hasCoverage: true`.

## Final confidence
**Medium.** Terminal identity and footprint are solid; gate/guard/scale are inferred from port-type norms (not visually confirmed), and the container ground-slot count is an honest mid-confidence estimate.

---
3-line summary: Gate verdict — **truckGate true (inferred secured national port gate)**. Guard-shack verdict — **true (inferred)**. Confidence — **medium**.
