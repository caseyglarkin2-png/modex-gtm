# Deep-Audit Dossier — idx 16

## Metal Container Corporation - Newburgh NY Can Plant

**Type:** Can Manufacturing Plant
**Account:** AB InBev (`ab-inbev`)
**Resolved coords:** 41.4878, -74.0958
**Address:** 130 Breunig Rd, New Windsor, NY 12553 (also called the "Newburgh Can Plant")

## Step 0 — Facility confirmation

The roster had no street address and city-level coordinates (41.5034, -74.0104)
that landed in downtown Newburgh — wrong. Web search identified the facility as
"Metal Container Corp-Newburgh Can Plant" at **130 Breunig Rd, New Windsor, NY
12553** (Yahoo Local, EPA TRI facility 12550MTLCN1000B, Windsor Chamber, LoopNet
parcel record). LoopNet/listing data gave coordinates ~41.4873, -74.0957, about
8 km SW of the roster point. Probed satellite there and found a large industrial
building in wooded terrain with manufacturing process equipment, silos, dock
banks and a trailer yard — consistent with an AB-owned MCC aluminum-can plant.
Positively identified; re-centered on the building mass at 41.4878, -74.0958.

## Key views

- **Wide satellite (z16-17):** Large industrial building set in woods,
  surrounded by a tree buffer; access via Breunig Rd from the SW. A separate
  industrial facility lies to the NE.
- **Building close-up (z18):** A warehouse section (NW, large flat roof) joined
  to a manufacturing section (SE, rooftop process equipment + silos). A
  truck-circulation perimeter road wraps the building. Employee parking SW.
- **West face (z19-20):** Truck yard with two clusters of trailers parked
  angle-nose-in (drop-yard storage), ~15-18 trailers; a continuous row of dock
  doors along the SW/west face.
- **NE face (z19):** A second dock cluster on the NE building face with a few
  trailers, plus a perimeter road exiting NE.
- **SW entrance (Street View Aug 2023):** Wide open driveway past a "130" AB
  monument sign (red star logo) on a landscaped median. No barrier arm, no
  gate, no guard booth, no perimeter fence at the road — open campus frontage.
- **NE junction (z20):** A small peaked-roof house-like utility/storage
  building set back from a road junction — not a guard booth, no barrier.

## Gate / guard-shack / dock determinations

- **truckGate: false.** Main SW entrance is an open driveway with no
  access-control structure; Street View confirms no fence/gate at the road. The
  NE access road also has no gate. The site is an open campus.
- **guardShack: false.** No staffed booth at either access point. The NE
  junction structure is a utility building, not a checkpoint booth.
- **remoteGs: false.** No gate, so no remote check-in.
- **dockDoors: "10-25".** ~20-22 doors across the SW/west face and NE face
  (estimate).
- **shipRcvSeparate: true.** Two distinct dock banks on different building
  faces (SW/west warehouse side vs. NE face).
- **dropYard / dropArea: true, "10-25".** West truck yard holds ~15-18 parked
  trailers in angled storage rows.

## Yard zones and counts

- **Perimeter:** ~50-acre wooded parcel, roughly 390 m (E-W) x 520 m (N-S);
  developed footprint is large with a wide tree buffer.
- **Truck gate zone:** open SW driveway off Breunig Rd.
- **Drop yard:** west truck yard with two angled trailer-storage clusters.
- **Dock apron:** strip in front of the SW/west-face dock doors.
- **dockDoorCount:** ~22 · **trailersVisible:** ~18 · **trailerParkingCapacity:**
  ~35 · **truckGateCount:** 2 (SW main + NE access road) · **buildingCount:** 1
  (connected warehouse + manufacturing) · **siteAreaAcres:** ~50 · **railServed:**
  false.

## Web findings

MCC New Windsor / "Newburgh Can Plant" is an Anheuser-Busch Metal Container
Corporation subsidiary plant manufacturing aluminum beverage cans; MCC supplies
a large share of AB's beer cans and lids. EPA TRI lists it as an active
facility. No rail-spur or expansion project specific to this site was found.

## Final confidence

**high.** Facility positively re-located (roster coordinates were wrong),
imagery clear at zoom 19-20, gate and dock determinations corroborated by
Street View. Dock-door count and trailer-parking capacity carry minor estimate
uncertainty (flagged).

### 3-line summary
- Gate verdict: NO truck gate — open campus, no barrier/checkpoint at either access.
- Guard-shack verdict: NO guard shack.
- Confidence: high.
