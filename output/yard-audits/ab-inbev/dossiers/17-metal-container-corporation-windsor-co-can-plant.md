# Deep-Audit Dossier — idx 17

## Metal Container Corporation - Windsor CO Can Plant

**Type:** Can Manufacturing Plant
**Account:** AB InBev (`ab-inbev`)
**Resolved coords:** 40.4670, -104.8623
**Address:** 1201 Metal Container Ct, Windsor, CO 80550

## Step 0 — Facility confirmation

Roster coordinates (40.466826, -104.862252, ROOFTOP, 120 m moved) landed
directly on the building. Web search confirmed "Metal Container" at 1201 Metal
Container Ct, Windsor, CO 80550 — an Anheuser-Busch MCC aluminum-can plant
(Yelp, Windsor Chamber, EPA fact sheet CO-PF00102, D&B). The EPA/Chamber fact
sheet describes a ~105,000 sq ft facility producing 2B+ 12-oz cans per year
with ~100 workers. Probed satellite and confirmed a manufacturing building with
process equipment, silos and dock doors in a rural setting. Positively
identified; center ~40.4670, -104.8623.

## Key views

- **Wide satellite (z16):** Building set in open farmland with scattered
  industrial neighbors; large warehouse to the west (separate property). Roads
  on the south and east.
- **Building close-up (z18):** Two-section structure - a windowless
  warehouse/storage box (north) joined to a manufacturing section (south) dense
  with rooftop process equipment. Employee parking on the south.
- **NE corner (z20):** A row of ~6-8 dock doors with a paved truck apron.
- **East side (z19):** Undeveloped dirt land, a perimeter road, and a single
  N-S rail line running adjacent to the property (corridor, not a spur).
- **South entrance (Street View Oct 2025):** Wide open paved truck driveway off
  the south public road with a yellow sign post on the median. No barrier arm,
  no gate, no guard booth. Driveway curves ~200+ m up into the property toward
  the building.
- **South frontage (Street View Oct 2025):** Building set well back behind a
  wide grassy buffer with a small pond/wetland; open campus, no perimeter fence
  at the road.

## Gate / guard-shack / dock determinations

- **truckGate: false.** The single truck driveway off the south road is open
  with no access-control structure; Street View confirms no gate or fence at
  the road and no internal gate.
- **guardShack: false.** No staffed booth at the entrance.
- **remoteGs: false.** No gate, so no remote check-in.
- **dockDoors: "0-10".** ~6-8 dock doors at the NE corner — modest, consistent
  with a manufacturing plant rather than a distribution center (estimate).
- **dropArea: "NONE" / dropYard: false.** No dedicated marked trailer-storage
  lot; the east apron is truck circulation/staging only. ~2 trailers visible.
- **drivewayLong: true.** Long curved approach from the south road to the dock
  apron, ample queue room.

## Yard zones and counts

- **Perimeter:** ~16.5-acre developed parcel, roughly 200 m (E-W) x 335 m
  (N-S).
- **Truck gate zone:** open truck driveway off the south road.
- **Dock apron:** strip in front of the NE-corner dock doors.
- **Staging:** the curved internal driveway / east apron functions as
  post-gate truck staging.
- **dockDoorCount:** ~8 · **trailersVisible:** 2 · **trailerParkingCapacity:**
  ~12 · **truckGateCount:** 1 · **buildingCount:** 1 · **siteAreaAcres:** ~16.5
  · **railServed:** false (adjacent rail is a corridor; no spur into the
  building).

## Web findings

MCC Windsor is an Anheuser-Busch Metal Container Corporation can plant: ~105,000
sq ft, ~2 billion 12-oz cans per year, ~100 workers (EPA fact sheet CO-PF00102,
Windsor Chamber). Active facility. No rail-siding detail found; imagery shows
the adjacent rail line does not enter the plant.

## Final confidence

**high.** Facility positively identified, imagery clear at zoom 19-20, gate and
guard-shack determinations corroborated by Oct 2025 Street View. Dock-door
count and trailer-staging capacity carry minor estimate uncertainty (flagged).

### 3-line summary
- Gate verdict: NO truck gate — open driveway, no barrier/checkpoint.
- Guard-shack verdict: NO guard shack.
- Confidence: high.
