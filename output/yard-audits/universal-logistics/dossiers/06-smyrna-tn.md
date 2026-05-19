# Deep Audit — Universal Logistics, Nissan Integrated Logistics Center, Smyrna TN (idx 6)

**Facility:** Universal Logistics - Nissan Integrated Logistics Center
**Address:** 200 Sam Griffin Rd, Smyrna, TN 37167
**Type:** Integrated Logistics Center / Sequencing Warehouse
**Locked coordinates:** 35.95250, -86.48480
**Confidence:** High

## Location resolution
Roster coordinates (35.952729, -86.485103) landed mid-roof on a very large
white-roof warehouse southwest of the Nissan Smyrna assembly plant. The
facility was confirmed via multiple independent listings — TruckMap
("Nissan Integrated Logistics Center Universal, 200 Sam Griffin Rd"),
ImportYeti, Indeed (Universal-operated), and Chamber of Commerce — all placing
Universal Logistics' Nissan ILC at this address. Universal also runs a
companion "Universal Dedicated of Smyrna" yard-switching operation here
(switcher/CDL-A job postings). The building is a single continuous structure
running roughly NNE–SSW, ~890 m long, consistent with the ~1.5M sq ft figure
in the roster source. Center locked at 35.95250, -86.48480.

## Imagery findings
- **Wide satellite (z15–z17):** one dominant warehouse immediately SW of the
  Nissan plant; auto-supplier industrial corridor with woods/farmland to the
  west and south. Employee parking and trailer rows hug the NW side.
- **NW face (z18–z19):** a continuous bank of dock doors along the long NW
  wall with many trailers backed in; marked trailer-parking rows run parallel
  to the building. This is the primary ship/receive face.
- **SW corner gate (z19):** the main truck driveway meets the access road at a
  controlled checkpoint — a small guard-booth-footprint structure straddles
  the lane, with pedestrian turnstiles beside it, inside a chain-link
  perimeter fence. This is the truck gate.
- **Street View (Sam Griffin Rd + south access road, 2022–2023):** continuous
  perimeter chain-link fencing confirmed around the property; the building and
  dock face visible behind the fence line. The pano network only reaches the
  fence line, not the gate lane itself, so the gate read relies on the z19
  satellite crop.
- **NE end (z17):** north end of the warehouse with additional docks/trailers
  and a separate smaller office/support building; a parking lot to the north.

## Gate / guard-shack / dock determinations
- **truckGate = true** — controlled checkpoint with perimeter fence at the SW
  driveway/road junction.
- **guardShack = true** — distinct small booth structure in the truck lane
  with turnstile array beside it; appropriate for a major auto-OEM logistics
  facility. remoteGs = false.
- **drivewayLong = true** — long internal approach from gate to dock aprons,
  3+ truck queue capacity. **postGateStaging = true** (paved holding area
  inside the gate before the docks). **fastLaneOpportunity = true** — wide
  gate apron with room for an express lane.
- **dockDoors = "50+"** — continuous dock bank along the NW face;
  ~70 doors estimated (flagged uncertain — building is long, tight imagery
  partial).
- **dropArea = "50+", dropYard = true** — extensive marked trailer-parking
  rows along the NW side and a second cluster near the NE end; dozens of
  dropped trailers without tractors.

## Yard zones & counts
- **Perimeter:** ~70 acres enclosing the warehouse, NW dock apron, NW trailer
  drop rows, employee parking, and the SW gate.
- **Truck gate:** SW corner checkpoint.
- **Drop yards:** NW-side trailer rows + NE-end trailer cluster.
- **Dock apron:** the strip along the NW face.
- **yardMetrics:** ~70 dock doors, ~95 trailers visible, ~230 trailer parking
  capacity, 1 truck gate, 2 buildings (main warehouse + NE office), ~70 acres,
  not rail-served.

## Web findings
Universal Logistics operates the Nissan ILC as an integrated
logistics/sequencing center feeding the adjacent Nissan Smyrna assembly plant;
Universal Dedicated of Smyrna provides on-site yard switching (3rd-shift CDL-A
switcher roles, $24.75/hr). This is a classic LINC-style plant-side
value-added operation — exactly the profile in the Jeff Morrish dossier
(auto-OEM, sequencing, yard-and-dock-dense).

## Final confidence
**High.** Facility identity, location, gate, guard shack, and dock/drop-yard
character are all well supported. Dock-door count and the 2-building count are
honest estimates and are flagged as uncertain.
