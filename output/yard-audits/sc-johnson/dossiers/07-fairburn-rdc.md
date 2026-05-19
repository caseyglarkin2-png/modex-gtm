# Deep-Audit Dossier — SC Johnson Fairburn Regional Distribution Center

**Facility:** Fairburn Regional Distribution Center
**Address:** 1555 Oakley Industrial Blvd, Fairburn, GA 30213
**Resolved center:** 33.53330, -84.59590
**Type:** Regional Distribution Center (aerosol storage)
**Audit method:** Satellite (z16–z19) + Street View (Feb 2022, Oct 2025) + web research
**Confidence:** High

---

## 1. Location resolution

Roster coordinates 33.533794, -84.595568 (geocode moved 226 m) land between two
adjacent warehouses in a wooded industrial park south of the Atlanta metro,
just off I-85. Identity confirmed via the **EPA Risk Management Plan record**
for the "Fairburn Regional Distribution Center" at 1555 Oakley Industrial Blvd,
a **Panjiva buyer record** ("S.C. Johnson & Son Inc., 1555 Oakley Ind Blvd
Fairburn GA"), and a Waze listing ("Exel Logistics/SC Johnson & Son Inc") — the
RDC is operated with Exel/DHL Supply Chain and stores LPG-propellant aerosol
finished goods.

Of the two warehouses, the SC Johnson building is the **western (left)** one,
identified by a distinctive **curved truck-loop apron at its south end**. The
eastern building (1525 Oakley Industrial Blvd, Southcreek Distribution Center
IV) is a separate tenant. Locked center: 33.53330, -84.59590.

## 2. What the key views showed

- **Wide satellite (z16):** Two large warehouses in a tree-bounded industrial
  park; I-85 runs along the NW. The SCJ building runs roughly N–S.
- **Tight satellite (z17–z19):** The SCJ warehouse has a continuous dock bank
  on **both long faces** — the west face fronts a trailer drop yard, the east
  face has docks with trailers backed in. A wide, sweeping **curved truck loop**
  wraps the south end.
- **NW-corner satellite:** A single private access drive comes off Oakley
  Industrial Blvd to the NE and threads through a wooded buffer into the
  property; the truck loop road then circles the whole building.
- **Street View (Feb 2022) along the access drive and west face:** Open private
  drive and employee parking against the west wall; **no barrier arm, gate or
  guard booth** anywhere along the drive or the loop road.

## 3. Gate / guard-shack determination

- **truckGate = false.** The site is entered by a single open private drive off
  Oakley Industrial Blvd. No barrier arm, sliding/swing gate, or checkpoint
  pinch-point was visible on the drive or at the building loop in Street View.
  Open site within a wooded industrial park.
- **guardShack = false.** No staffed booth (1–3-vehicle footprint) was found at
  the access drive or anywhere on the truck loop.
- **remoteGs = false.** With no truck gate, remoteGs is false by rule.
- **multiStep = false.** No second checkpoint.

## 4. Yard zones and counts

- **Perimeter:** Captures the warehouse, both drop yards, and the southern loop
  apron. ≈ 26 acres.
- **Drop yards:** Two — one along the west face, one along the east face — both
  full of parked trailers without tractors.
- **Dock aprons:** Two, one per long face, in front of the continuous dock
  banks.
- **Staging:** The wide curved south-end loop apron serves as an internal
  staging/queue area.
- **dockDoorCount ≈ 90** across both ~330 m long faces.
- **trailersVisible ≈ 95** across the captured imagery.
- **trailerParkingCapacity ≈ 130.**
- **truckGateCount = 1** (single open access drive).
- **buildingCount = 1** (SCJ warehouse only; the eastern building is excluded).
- **railServed = false** — no rail spur into the parcel.

## 5. Web findings

EPA RMP "Fairburn Regional Distribution Center" — storage/distribution
warehouse for SC Johnson aerosol consumer products; LPG propellant on site
drives the RMP filing; no prior accidents with offsite impact. Panjiva and an
FCC ULS license ("EXEL SC JOHNSON") confirm the facility is run with Exel/DHL.
CompStak/OfficeSpace data place 1555 and the neighboring 1525 Oakley Industrial
Blvd in the same Southcreek industrial park. The Fairburn RDC is the current
Atlanta-metro successor to the dossier-noted historical Forest Park GA RDC.

## 6. Final confidence

**High.** Building identity confirmed by multiple independent records; layout,
dock banks and yard zones clearly read from imagery; the open-site gate
determination is well supported by Street View. Lane counts are the only soft
fields (flagged).

**3-line summary**
- Gate: FALSE — single open private access drive, no barrier/checkpoint.
- Guard shack: FALSE — no staffed booth anywhere on site.
- Confidence: HIGH.
