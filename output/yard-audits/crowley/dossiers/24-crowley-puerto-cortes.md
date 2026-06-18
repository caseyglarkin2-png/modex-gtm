# Crowley Puerto Cortes Container Terminal — Honduras

**idx 24 · slug `crowley-puerto-cortes` · method: deep-audit · confidence: low**

## Resolved location
- **Coords:** 15.8395, -87.9405 (container yard + gantry berth, Puerto Cortes)
- **How confirmed:** Puerto Cortes is Honduras' principal Caribbean port. Crowley's published terminal address is "Barrio La Roca, frente a gasolinera DIPSA, antes del peaje, Puerto Cortes" — the landward access corridor to the public container terminal (TEC). Crowley operates as a liner/terminal partner at the gantry-crane berths with a landward container storage depot. Several wide probes around the published *city* coordinates (15.833, -87.95) fell over open water — the city centroid sits inland of the berths — so the terminal was located by walking the probe NE to the gantry-crane berth and the adjacent container yard.

## What the key views showed
- **z16 wide:** Long port peninsula NW–SE with tank farm, grain silos, break-bulk berths, and container yards. The main container terminal sits on the eastern berths.
- **z17 (15.838, -87.943):** Orange/yellow ship-to-shore gantry cranes at the berth with a container vessel alongside; container stacks behind to the NE — the TEC container terminal.
- **z18 (15.840, -87.939):** A large multi-row container storage yard — hundreds of containers in organized rows across a gravel/paved depot. This is the countable yard.

## Gate / guard / dock determinations
- **truckGate: true (inferred).** Secured port; Crowley's own address cites the toll booth (peaje) and DIPSA gas station on the access road. Gate hardware not resolved → flagged uncertain.
- **guardShack: true (inferred).** National secured port; not positively resolved → flagged uncertain.
- **scale: true (inferred).** Weighbridge standard at a container terminal; not visually confirmed.
- **dockDoors: 0-10.** Marine terminal — near-zero OTR docks. Crowley's **+97,000 sqft warehouse** footprint here is realized as three Choloma free-zone warehouses (~113k sqft combined), which are **off-terminal**, not on the quay. The ~6 dock-door count is a conservative placeholder for those warehouse doors → flagged uncertain.

## Yard zones & counts
- **perimeter:** oriented 6-vertex ring over the container yard + berth Crowley uses, ≈ 95 acres. Exact lease boundary within the shared public port could not be isolated → low confidence.
- **dropYards:** one ring over the container storage depot.
- **dockAprons:** none traced (no warehouse on-terminal).
- **trailerParkingCapacity (yard spots): ~1,100 CONTAINER/CHASSIS GROUND SLOTS** (not OTR stalls). `dropArea` 50+.
- **railServed:** false (no spur resolved).

## Web findings
- Crowley | Locations confirms a Puerto Cortes terminal; Crowley's new Honduras office supports logistics growth.
- Crowley warehousing: three warehouses in Choloma, Cortes, **>113,000 sqft combined**; the Choloma (Inhdelva Free Zone, Nave 33) warehouse is 34,600 sqft with a trailer-height dock — convenient to Puerto Cortes but not on the quay.
- Puerto Cortes is the principal Honduran port (container, LASH, liquid/break bulk).

## Street View
**No coverage** — ZERO_RESULTS within 400 m of the terminal. `hasCoverage: false` for all zones; no pano invented.

## Final confidence
**Low.** Terminal and yard positively located and imaged, but Crowley operates inside a shared public terminal whose exact lease boundary isn't resolvable from imagery, the +97k sqft warehouse is off-terminal, and gate/guard/scale are inferred. Counts are conservative ranges by design.

---
3-line summary: Gate verdict — **truckGate true (inferred secured port gate, peaje + DIPSA landmark)**. Guard-shack verdict — **true (inferred)**. Confidence — **low**.
