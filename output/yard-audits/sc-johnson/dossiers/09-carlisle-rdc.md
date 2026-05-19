# Deep-Audit Dossier — SC Johnson Carlisle Regional Distribution Center

**Facility:** Carlisle Regional Distribution Center
**Address:** 5 True Temper Dr, Carlisle, PA 17015
**Resolved center:** 40.17510, -77.24280
**Type:** Regional Distribution Center (aerosol storage)
**Audit method:** Satellite (z16–z19) + Street View (Nov 2023, Oct 2024) + web research
**Confidence:** High

---

## 1. Location resolution

The roster geocode was flagged as having moved **8,791 m** — the supplied
coordinates needed verification. Satellite probing around 40.175046, -77.24279
landed on the correct building: a very large cross-dock warehouse in the
Carlisle/Harrisburg logistics corridor.

Identity confirmed via the **EPA Risk Management Plan record** for the
"Carlisle Regional Distribution Center" at 5 True Temper Dr, the **Margulies
Hoelzli Architecture** project page, an **FCC ULS license ("EXEL SC JOHNSON")**,
and LoopNet/FCC listings. The architect describes a **500,000 sq ft northeast
regional logistics facility, 450 ft × 1,100 ft cross-dock**, fast-track
tilt-wall construction by First Industrial Realty Trust, with local operations
support offices. It is operated with DHL/Exel and stores LPG-propellant
aerosol finished goods (basis for the RMP). It is the Northeast RDC succeeding
the dossier-noted historical Harrisburg PA RDC. Locked center: 40.17510,
-77.24280.

## 2. What the key views showed

- **Wide satellite (z16–z17):** A single dominant warehouse running NW–SE, with
  a smaller office/operations annex at its NE corner and a separate warehouse
  to the south. A truck loop road wraps the entire building.
- **Tight satellite (z18–z19):** Continuous dock banks on **both long faces**
  (NW and SE) with trailers backed in on both — a true cross-dock. Large paved
  drop yards flank both faces, with additional trailer rows to the SE.
- **Street View (Nov 2023) at the NE entrance:** Open driveways off True Temper
  Dr; an office building near the entrance; **no barrier arm, gate, or
  checkpoint** on the entrance road.
- **Street View (Oct 2024) west:** Open rural roadway; the facility visible in
  the distance with no road-side gate.

## 3. Gate / guard-shack determination

- **truckGate = false.** The truck loop road wraps the whole building and
  connects to True Temper Dr by open driveways. No barrier arm, sliding/swing
  gate, or checkpoint pinch-point was visible at the entrance in Street View.
  Open site.
- **guardShack = false.** No staffed road-side booth. The small structure at the
  NE corner is an attached office/operations annex, not a guard booth.
- **remoteGs = false.** No truck gate → remoteGs false by rule.
- **multiStep = false.** No second checkpoint.

## 4. Yard zones and counts

- **Perimeter:** Captures the 500k sq ft cross-dock and the full wrap-around
  truck yards. ≈ 38 acres.
- **Drop yards:** Two — one along the NW face, one along the SE face — both full
  of parked trailers without tractors.
- **Dock aprons:** Two, one per long face, in front of the continuous dock
  banks.
- **dockDoorCount ≈ 110** across the two ~335 m long faces of the cross-dock.
- **trailersVisible ≈ 90** across the captured imagery.
- **trailerParkingCapacity ≈ 150.**
- **truckGateCount = 2** (two open truck entrances/exits on the loop).
- **buildingCount = 1** (SCJ cross-dock; the southern warehouse is excluded).
- **railServed = false** — no rail spur into the parcel.

## 5. Web findings

EPA RMP "Carlisle Regional Distribution Center" — storage/distribution
warehouse for SC Johnson aerosol consumer products; LPG propellant drives the
RMP. Margulies Hoelzli Architecture: 500,000 sq ft, 450×1,100 ft cross-dock,
tilt-wall, First Industrial Realty Trust developer, local operations offices.
FCC ULS license "EXEL SC JOHNSON" confirms DHL/Exel operation. The facility is
the Northeast RDC corresponding to the dossier/SupplyChainBrain historical
Harrisburg PA RDC.

## 6. Final confidence

**High.** Building identity confirmed by EPA, the project architect, and an FCC
license. Cross-dock layout, dock banks and wrap-around yards read clearly from
imagery; the open-site gate determination is well supported by Street View.
Lane counts are the only soft fields (flagged).

**3-line summary**
- Gate: FALSE — truck loop connects to True Temper Dr by open driveways.
- Guard shack: FALSE — no road-side booth; NE structure is an office annex.
- Confidence: HIGH.
