# Deep-Audit Dossier — idx 21

## Busch Agricultural Resources - Idaho Falls ID Malt Plant

**Type:** Agricultural Processing - Malt Plant
**Account:** AB InBev (`ab-inbev`)
**Resolved coords:** 43.4444, -112.0685
**Address:** 5755 S Yellowstone Hwy, Idaho Falls, ID 83402

## Step 0 — Facility confirmation

Roster coordinates (43.445057, -112.069285, ROOFTOP, 9 m moved) landed directly
on the facility. Web search confirmed "Busch Agricultural Resources Inc - Malt
Plant" at 5755 S Yellowstone Hwy, Idaho Falls, ID 83402 — an Anheuser-Busch
barley malthouse (Yelp, hub.biz, Manta, AB newsroom). Probed satellite and
found a large malting complex with tall process buildings, grain silos, a large
grain storage building, wastewater ponds, and a rail spur — consistent with the
facility type. Positively identified; center re-set on the building mass at
~43.4444, -112.0685.

## Key views

- **Wide satellite (z16-17):** Malt plant in open Idaho barley farmland south
  of Idaho Falls, between Yellowstone Hwy + a rail line on the NW and cropland
  on all other sides.
- **Plant complex (z18-20):** Tall malting/process buildings (~250 ft per AB
  newsroom), a large segmented-roof grain storage building (SW), grain
  silo/germination drum clusters, an office, and outbuildings. Wastewater
  treatment ponds on the SE.
- **Rail (z18-20):** A rail spur curves off the mainline (parallel to
  Yellowstone Hwy) into the property; a long string of covered hopper rail
  cars is parked on the siding alongside the malt plant and grain storage
  buildings. Confirmed rail-served.
- **Entrance (z19-20):** A long access road off Yellowstone Hwy crosses the
  rail spur and branches into landscaped driveways with a monument sign on the
  median. No barrier arm, sliding gate, guard booth, or checkpoint structure
  visible.
- **Truck yard (z19):** A very large open paved truck-circulation yard between
  the buildings and the wastewater ponds.
- **Street View:** Only highway-level panos exist (2015-2025); the access road
  into the plant has no Street View coverage. Highway panos confirm the plant
  sits behind a tree line and rail, set back from Yellowstone Hwy.

## Gate / guard-shack / dock determinations

- **truckGate: false.** The Yellowstone Hwy access road and the internal
  driveways are open and uncontrolled in every satellite probe (zoom 20) — no
  barrier or checkpoint structure.
- **guardShack: false.** No staffed booth visible at the entrance or along the
  access road.
- **remoteGs: false.** No gate, so no remote check-in.
- **scale: true (flagged).** Malt plants receive inbound barley and ship
  finished malt by truck; a truck scale is operationally expected and a small
  scale-house-like structure is present in the truck yard, but it could not be
  confirmed unambiguously from overhead imagery.
- **dockDoors: "0-10".** Not a dock-door distribution facility — bulk loadout
  via spouts/conveyors plus a few building doors (~6, low-confidence estimate).
- **dropArea: "NONE" / dropYard: false.** No dedicated marked trailer-storage
  lot; trucks circulate through a large open yard.
- **railServed: true.** Confirmed rail spur with hopper cars.

## Yard zones and counts

- **Perimeter:** ~54-acre developed campus, roughly 485 m (E-W) x 455 m (N-S).
- **Truck gate zone:** the open access road off Yellowstone Hwy.
- **Staging:** the large open paved truck-circulation yard inside the plant.
- **dockDoorCount:** ~6 · **trailersVisible:** ~2 · **trailerParkingCapacity:**
  ~20 · **truckGateCount:** 1 · **buildingCount:** ~7 (malting/process
  buildings, grain storage building, silo/drum clusters, office, outbuildings)
  · **siteAreaAcres:** ~54 · **railServed:** true.

## Web findings

The Idaho Falls malt plant is an Anheuser-Busch / Busch Agricultural Resources
(BARI) barley malthouse — built in the late 1980s, expanded 2005, producing
~300,000 metric tons of finished malt per year with ~68 workers at the plant.
Barley steeps ~38 hours, germinates ~4 days, kilns ~12 hours. Active facility,
a key node in AB's Idaho barley program. Rail is a primary inbound/outbound
mode.

## Final confidence

**high.** Facility positively identified (roster coordinates accurate),
imagery clear at zoom 19-20, rail service confirmed, gate/guard determinations
supported by satellite (no Street View coverage of the access road, but
satellite is unambiguous). The truck-scale call and dock/door counts carry
minor uncertainty (flagged).

### 3-line summary
- Gate verdict: NO truck gate — open Yellowstone Hwy access road, no barrier/checkpoint.
- Guard-shack verdict: NO guard shack.
- Confidence: high.
