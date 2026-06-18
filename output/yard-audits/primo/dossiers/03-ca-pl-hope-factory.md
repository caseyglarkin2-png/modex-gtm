# Deep-Audit Dossier — Site 3: CA PL Hope Factory

- **Facility:** CA PL Hope Factory (Primo Brands / BlueTriton / formerly Nestlé Waters Canada bottling plant)
- **Type:** Bottling plant (PL)
- **Address:** 66700 Othello Rd, Hope, BC V0X 1L1, Canada
- **Resolved center:** 49.38515, -121.38215
- **Method:** deep-audit (satellite; no Street View coverage)
- **Final confidence:** medium

---

## 1. Location resolution & how confirmed

The supplied coordinates (49.3827, -121.4414) landed in **downtown residential Hope**, roughly 5 km too far west (a z16 crop showed a town grid of houses and a river, no industry).

Web search established the plant is at **66700 Othello Rd**, operated since 2021 by **BlueTriton Brands** (now Primo Brands), formerly **Nestlé Waters North America**, and multiple sources describe it as bottling aquifer water **"just east of Kawkawa Lake."** Kawkawa Lake sits ~2.5 km east of Hope at ~49.383, -121.40.

A Nominatim geocode of the street address returned **49.3851694, -121.3822070**. A z17 satellite probe at that point revealed a **large industrial building in a forest clearing**, fed by a single winding private drive — exactly consistent with the "spring water plant east of Kawkawa Lake, surrounded by forest" profile. An earlier candidate east of the lake (49.382, -121.394) turned out to be a **gravel pit / aggregate operation** (excavators, gravel piles), ruled out. Center locked at ~49.38515, -121.38215.

## 2. What each key view showed

- **z17 / z18 overview (p03-final-z17, p03-plant-z18):** One large connected industrial complex, long axis running roughly **NW→SE** (not north-aligned). Paved yard wraps the W and N sides; employee/visitor parking and a tractor-trailer on the SW; a round water-storage tank on the SE; a minor tank/utility structure up a separate dirt spur to the NE. The whole operational footprint is hemmed by dense forest on every side. A single private access drive enters from the SW and winds ~300 m down to the public road. A separate cleared dirt area to the SE is a quarry/borrow pit, not part of the plant.
- **NW dock row (z19 p03-nw-trailers):** ~8-12 trailers backed perpendicular against the warehouse NW wall — the main dock-door bank — plus a parallel storage row of ~5-6 trailers/containers parked nose-out (the drop yard).
- **South/SE corner (z20 p03-south):** Closed building wall, a round water tank, a drive looping the E side, and a small dock/load point at the S corner.
- **SW corner (z20 p03-sw-dock):** Marked employee parking lot (~30+ cars) and one red-cab tractor-trailer along the access road — the office/parking side, no docks.
- **Yard entry (z20 p03-yard-entry):** The private drive curves up and opens **directly** into the paved yard/parking — no barrier, gate, or booth at the threshold.

## 3. Gate / guard-shack / dock determinations

- **truckGate = FALSE (medium-low confidence).** No barrier arm, sliding/swing gate, or checkpoint pinch-point is visible where the access drive meets the yard. The drive opens straight into the parking/yard apron. Caveat: the lower ~300 m of the private drive runs through forest and is not fully captured; a gate could conceivably sit there. There is **no Street View** of the drive or yard to confirm — flagged uncertain.
- **guardShack = FALSE.** No booth-sized structure (1-3 vehicle footprint, multi-side windows) anywhere at the entry or along the visible drive.
- **remoteGs = FALSE.** No truck gate confirmed, so no remote check-in inference.
- **dockDoors = "10-25".** ~8-12 trailers backed at the NW warehouse wall imply a continuous door bank; a smaller S-corner dock adds a few. Honest total ~16.
- **dropArea = "10-25" / dropYard = TRUE.** Distinct NW trailer/container storage row, separate from the active dock line.

## 4. Yard zones & counts measured

- **perimeter:** 7-vertex oriented ring tracing the cleared/paved operational footprint inside the treeline, rotated to the building's NW-SE axis. **≈5.24 acres.**
- **truckGate zone:** small quad at the SW drive-into-yard threshold (no physical gate present; marks the control point a YMS would add).
- **dropYards:** one ring over the NW nose-out trailer storage row.
- **dockAprons:** two quads — the long NW dock apron (parallel to the warehouse wall) and the small S-corner dock.
- **staging:** null (the open NW/W apron is captured by postGateStaging classification rather than a separate ring).
- **yardMetrics:** dockDoorCount 16, trailersVisible 18, trailerParkingCapacity 25, truckGateCount 1, buildingCount 1, siteAreaAcres 5.24, railServed false.

## 5. Web findings

- Plant operated by Nestlé Waters North America 2002-2021, then **BlueTriton Brands** (One Rock Capital / Metropoulos), now under **Primo Brands**. Remains **operational** (serves Western Canada + U.S. Pacific Northwest), unlike BlueTriton's closed Ontario plants.
- Bottles aquifer water near Hope; subject of B.C. water-extraction / drought coverage. Confirms an active bottling/warehousing operation consistent with the audited footprint.

## 6. Street View

No usable coverage. Of ~11 metadata probes around the plant and its drive, the only `OK` pano was **49.3815957, -121.3868879** (Othello Rd, captured 2023-06), which shows only forest and a roadside marker — neither the plant nor its gate is visible. All zone `streetViewMeta` set `hasCoverage:false`. This is the expected outcome for a rural BC plant on a private forest drive.

## 7. Final confidence

**Medium.** Facility identity and footprint are solid (clear satellite, corroborating web evidence). The gate/guard determinations rest on satellite alone because the forested approach drive is partly obscured and there is zero Street View — `truckGate`, `guardShack`, `remoteGs`, dock/drop bands, and ship/receive split are flagged uncertain.
