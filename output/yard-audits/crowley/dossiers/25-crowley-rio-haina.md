# Crowley Rio Haina Container Terminal (HIT Margen Oriental) — Dominican Republic

**idx 25 · slug `crowley-rio-haina` · method: deep-audit · confidence: medium**

## Resolved location
- **Coords:** 18.4228, -70.0155 (HIT east-bank container yard)
- **How confirmed:** Crowley's published Rio Haina address is "Haina International Terminals, Carretera Sanchez Km 13.5, Edificio Naviero, 3er Puerto Rio Haina Margen Oriental." Official port position 18°25.018′ N / 70°01.190′ W (~18.417, -70.020). The port spans both banks of the Haina river (Oriental/Occidental); Crowley + HIT operate **Margen Oriental** (east bank). Satellite at z16–z17 showed container vessels at berth, multiple ship-to-shore gantry cranes, and a very dense container stacking yard filling the east bank, with a seaward tank farm — unambiguous HIT container terminal.

## What the key views showed
- **z16 wide:** Container port on both river banks; the east bank (right) carries the gantry cranes, dense container stacks, warehouses, and a tank farm at the seaward edge.
- **z17 (18.4225, -70.0175):** Container vessels alongside, multiple STS gantry cranes on the east berth, and continuous high-density container stacks — the core HIT Oriental yard.
- **z19 (18.4235, -70.0150):** Rows upon rows of stacked containers with RTG/reach-stacker lanes — the densest, largest container ground-slot operation of the three sites.

## Gate / guard / dock determinations
- **truckGate: true (inferred).** Secured terminal off Carretera Sanchez on the landward (west) edge. Crowley publishes the terminal operates with **5 lanes**, supporting truckGate + multi-lane entry/exit + fast-lane room. Gate hardware not resolved at this resolution.
- **guardShack: true (inferred).** Secured international container terminal; not positively resolved → flagged uncertain.
- **scale: true (inferred).** Weighbridge standard at this scale of terminal.
- **multiStep: true (medium).** Bonded-warehouse + on-site Customs clearance typically runs gate → separate Customs/scale checkpoint before the docks → flagged uncertain.
- **dockDoors: 0-10.** Marine terminal — near-zero OTR docks. The ~4 count reflects loading doors on the landward bonded-warehouse sheds.

## Yard zones & counts
- **perimeter:** oriented 6-vertex ring over the east-bank terminal, ≈ 98 acres.
- **dropYards:** one ring over the main high-density container stacking yard.
- **dockApron:** thin quad over the landward shed loading face.
- **trailerParkingCapacity (yard spots): ~3,000 CONTAINER/CHASSIS GROUND SLOTS** (not OTR stalls) — the largest of the three. `dropArea` 50+.
- **railServed:** false.

## Web findings
- Crowley | Locations + dominicanrepublic.crowley.com confirm the Rio Haina terminal; **5 lanes**, warehouse services, Mon–Fri 0800–1600, Sat 0800–1200, export ops 0800–2000.
- Crowley operates the **Haina Bonded Warehouse (HBW)** / Deposito Aduanero Rio Haina — warehousing, Customs clearance, trucking on site.
- HIT operates the facility; ~13 km west of Santo Domingo (metropolitan setting → Urban).

## Street View
2023-10 user photosphere (pano `CAoSFkNJSE0wb2dLRUlDQWdJQ0ZzZnVyRFE.`) on Carretera Sanchez ~270 m W of the yard centroid; no Google car coverage inside the secured terminal. Camera heading 94° points from the pano east toward the yard. `hasCoverage: true`.

## Final confidence
**Medium.** Terminal identity, footprint, and the 5-lane gate are well supported (Crowley publishes the lane count); guard/scale/multi-step are inferred from operating norms; the container ground-slot count is an honest mid-confidence estimate from dense stack imagery.

---
3-line summary: Gate verdict — **truckGate true (Crowley publishes 5-lane gate)**. Guard-shack verdict — **true (inferred)**. Confidence — **medium**.
