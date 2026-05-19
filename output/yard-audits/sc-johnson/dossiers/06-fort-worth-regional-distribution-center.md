# Deep-Audit Dossier — SC Johnson Fort Worth Regional Distribution Center

**Facility:** Fort Worth Regional Distribution Center
**Address:** 850 Transport Dr, Fort Worth, TX 76177
**Resolved center:** 32.96895, -97.33145
**Type:** Regional Distribution Center (aerosol storage)
**Audit method:** Satellite (z17–z19) + Street View (Aug 2018, Sep 2025) + web research
**Confidence:** High

> **Note:** This dossier was backfilled to accompany the previously written
> `06-fort-worth-regional-distribution-center.json`. The JSON was **not
> modified**; its key views were re-probed and this dossier is written fully
> consistent with the JSON's classification and metrics.

---

## 1. Location resolution

Roster coordinates 32.968943, -97.331494 (ROOFTOP geocode, moved 143 m) land
correctly on the building. Identity is supported by the **EPA Risk Management
Plan record** for the "Fort Worth Regional Distribution Center" and a Waze
listing ("DHL - SC Johnson"). The facility sits in the **AllianceTexas**
industrial area on the far north side of Fort Worth and is operated with DHL
Supply Chain. It is the dossier-noted Fort Worth RDC. Locked center
(per the JSON): 32.96895, -97.33145.

## 2. What the key views showed

- **Wide satellite (z17):** Two large warehouses; the SCJ RDC is the western
  cross-dock building. Vacant land lies to the north; a large facility with
  extensive trailer parking sits to the NW.
- **Tight satellite (z18–z19):** A single long cross-dock building with
  continuous dock banks on **both long faces** (east and west), trailers backed
  in on both, and wide paved truck yards / drop yards flanking each face.
- **Street View (Sep 2025), SW truck approach (Transport Dr side):** A wide
  open paved truck driveway enters the site with **no barrier arm, sliding
  gate, or checkpoint** — fully open.
- **Street View, perimeter approach:** Open paved driveways and a tree-lined
  parkway entrance; no road-side staffed booth.

## 3. Gate / guard-shack determination

Consistent with the JSON:

- **truckGate = false.** Truck driveways enter the site from the perimeter
  industrial roads with no barrier arm, sliding gate, or checkpoint. Street View
  of the truck roads shows wide-open paved driveways with no control. Open site.
- **guardShack = false.** No staffed booth at any truck entrance. The dark
  elongated structure beside the SW driveway in tight satellite imagery is a
  parked trailer/container, not a guard booth.
- **remoteGs = false.** No truck gate → remoteGs false by rule.
- **multiStep = false.** No second checkpoint.

## 4. Yard zones and counts (per the JSON)

- **Perimeter:** ~30 acres, covering the building and both truck yards; vacant
  land to the north excluded.
- **Drop yards:** Two — one along each long face — both with many trailers
  parked without tractors (`dropArea: 50+`).
- **Dock aprons:** Two, one per long face, in front of the continuous dock
  banks.
- **dockDoorCount ≈ 120** — continuous dock bank along both ~430 m faces, total
  doors well over 100 (`dockDoors: 50+`).
- **trailersVisible ≈ 95** across the imagery.
- **trailerParkingCapacity ≈ 140.**
- **truckGateCount = 2** — two open truck entrances.
- **buildingCount = 1.**
- **railServed = false.**
- **shipRcvSeparate = true** — cross-dock with continuous dock banks on opposite
  (east and west) faces, so shipping and receiving run from physically separate
  clusters.
- **fastLaneOpportunity = true** — very wide paved truck yards and multiple wide
  open driveways leave ample room for express/bypass lanes if a gate were added.

## 5. Web findings

EPA RMP "Fort Worth Regional Distribution Center" — storage/distribution
warehouse for SC Johnson aerosol consumer products; LPG propellant drives the
RMP. Waze "DHL - SC Johnson" confirms DHL Supply Chain operation. The site is
an AllianceTexas-area RDC matching the dossier-noted historical Fort Worth RDC.

## 6. Final confidence

**High.** Building identity, cross-dock layout, open-site gate determination and
metrics are all consistent between the imagery re-probe and the existing JSON.

**Observation (not an error in the JSON):** the JSON classifies
`urbanRural: "Urban"`. The site sits in the AllianceTexas industrial district
on the far north edge of Fort Worth, surrounded by large industrial buildings
but with notable vacant land adjacent. "Urban" is a defensible call given the
dense AllianceTexas distribution fabric; a "Rural" reading would also be
arguable under the rubric's small-town tie-break. Flagged for awareness only —
the JSON was left unchanged per instructions.

**3-line summary**
- Gate: FALSE — open paved truck driveways, no barrier/checkpoint.
- Guard shack: FALSE — no staffed booth; SW structure is a parked trailer.
- Confidence: HIGH; dossier consistent with the existing 06 JSON.
