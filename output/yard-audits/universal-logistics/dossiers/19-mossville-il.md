# Universal Logistics — Mossville Contract Logistics Warehouse (idx 19)

**Account:** Universal Logistics Holdings
**Facility:** Universal Logistics - Mossville Contract Logistics Warehouse
**Address:** No street address in roster — resolved to the Caterpillar Mossville plant complex, Old Galena Road / IL-29, Mossville IL 61552
**Type:** Contract Logistics / Value-Added Warehouse
**Resolved center:** 40.84100, -89.55600
**Confidence:** Medium

## Location resolution
The roster supplied no address and no coordinates — only "Universal Logistics
Mossville IL facility supporting Caterpillar engine/manufacturing complex." Web
research established the **Caterpillar Mossville plant at 1900 E Old Galena
Road** (corroborated by EPA Superfund records for the Caterpillar Mossville
Plant). Satellite probing of the Old Galena Road / IL-29 corridor located the
vast contiguous Caterpillar manufacturing complex on the bluff above the
Illinois River. Universal Logistics' Mossville operation provides value-added,
sequencing and contract-logistics support embedded in this Caterpillar
engine/manufacturing complex.

Medium confidence: the roster gave no address; the Universal-operated sub-area
within the very large Caterpillar Mossville campus cannot be isolated from
overhead imagery.

## Key views
- **Satellite z14-z15 (wide):** A large industrial complex sits along the
  IL-29 / Old Galena Road corridor between farmland (west/north) and the
  Illinois River (east). Mossville and Chillicothe form a near-continuous
  Caterpillar campus along this corridor.
- **Satellite z16-z17 (tight):** A vast contiguous plant building with
  extensive employee parking lots on the south and west; dock banks along
  multiple building faces; trailer staging along internal roads; a power-plant
  / utility area to the north.
- **Satellite (SE corner):** Large employee parking lots, internal entrance
  roads off Old Galena Road, IL-29 highway and the Illinois River with a small
  residential strip beyond.

## Gate / guard-shack determination
- **truckGate = true (low-medium confidence).** A Caterpillar manufacturing
  plant of this scale operates controlled truck-side access; internal entrance
  roads run into the plant from Old Galena Road. No barrier arm was directly
  resolved in available imagery — classed truckGate true. Flagged uncertain.
- **guardShack = false / remoteGs = true.** No staffed guard booth was
  positively resolved. Caterpillar campuses typically gate-control the truck
  side; classed remoteGs true pending direct confirmation. Flagged uncertain.
- **multiStep = false.** No clear second checkpoint stage resolved.

## Docks & yard
- **dockDoors = 50+** (~60 estimated across the multi-building complex). An
  overhead estimate, flagged for review.
- **dropArea = 25-50 / dropYard = true.** Trailer staging rows along the
  plant's internal roads and aprons.
- **shipRcvSeparate = true (inferred).** A complex of this size runs inbound
  parts receiving and outbound shipping from physically distinct dock clusters
  on different building faces. Flagged uncertain.
- **postGateStaging = true, drivewayLong = true.** Generous internal paved area
  inside the complex gives 3+ truck queue depth.
- **fastLaneOpportunity = true.** Wide internal aprons leave room for an
  express lane.
- **multipleFacilities = true.** Multi-building Caterpillar plant campus.

## Geofence & metrics
- **Perimeter:** S 40.83550 / W -89.56350 / N 40.84600 / E -89.54850 — the
  Caterpillar Mossville plant complex and parking, ~180 acres.
- **Drop yard:** trailer staging along internal roads.
- **Dock apron:** along the central building faces.
- **truckGateCount = 2** (internal entrance roads off Old Galena Road);
  **buildingCount ≈ 4**; **railServed = false** — no active rail spur clearly
  resolved entering the audited footprint.

## Web findings
Universal Logistics' Mossville IL operation supports Caterpillar's
engine/manufacturing complex with contract-logistics and value-added services.
The Caterpillar Mossville plant (1900 E Old Galena Road) is a long-standing
Caterpillar manufacturing and technical-center site; Caterpillar Electronics
and global mining-technologies R&D are also located at Mossville.

## Final confidence: Medium
The Caterpillar Mossville manufacturing complex is positively identified.
Medium because the roster gave no address/coordinates, the Universal-operated
sub-area cannot be isolated within the large Caterpillar campus, and the
gate / guard-shack determination is inferred from plant scale rather than
directly observed. Several fields flagged uncertain.
