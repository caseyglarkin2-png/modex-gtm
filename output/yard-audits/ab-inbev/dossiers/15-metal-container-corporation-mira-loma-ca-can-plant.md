# Deep-Audit Dossier — idx 15

## Metal Container Corporation - Mira Loma CA Can Plant

**Type:** Can Manufacturing Plant
**Account:** AB InBev (`ab-inbev`)
**Resolved coords:** 34.0320, -117.5226
**Address:** 10980 Inland Ave, Mira Loma / Jurupa Valley, CA 91752

## Step 0 — Facility confirmation

Roster coordinates (34.031509, -117.521978, ROOFTOP, 132 m moved) landed on
the SE corner of the building. Probed satellite at zoom 17-18 around the point
and re-centered on the building mass at 34.0320, -117.5226. Web search
confirmed "Metal Container Corp-Mira Loma Can Plant" at 10980 Inland Ave, an
AB-owned MCC aluminum-can manufacturing plant (Yelp, D&B, EPA TRI facility
91752MTLCN10980, anheuser-busch.com/careers). The building is a large
single-story industrial structure with a tall process stack visible in Street
View — consistent with a can plant. Positively identified.

## Key views

- **Wide satellite (z17-18):** Large white-roofed manufacturing building
  occupying a full block. Bounded by Inland Ave + a rail corridor on the west,
  a public road on the north, a public road on the south, and an electrical
  substation / rail corridor on the east. Employee parking on the SE.
- **South face (z20):** Continuous row of dock doors with a blue canopy/awning;
  ~12-14 doors counted. A large paved truck yard wraps the south and SW.
- **South entrance (Street View Feb 2025):** Wide open driveway with a
  landscaped median (decorative rock + agave) and a directional sign post. No
  barrier arm, no sliding/swing gate, no guard booth, no checkpoint
  pinch-point. Free-flowing access into the dock yard.
- **North frontage (Street View Nov 2025):** Property line is metal palisade
  perimeter fencing with a grassy buffer — no vehicle entrance.
- **West side:** Dense vegetation buffer plus a rail corridor along Inland Ave;
  no entrance.
- **NE corner:** A separate annex building with rooftop tanks/silos (can-end or
  coatings process building) sits on the same fenced parcel. An electrical
  substation is just east, off-property.

## Gate / guard-shack / dock determinations

- **truckGate: false.** The single south-side truck entrance is an open, wide
  driveway with a planted median and no access-control structure. North and
  west property lines are fenced but have no vehicle gates.
- **guardShack: false.** No staffed booth at the entrance in satellite or
  Street View. Listed as a low-confidence negative — entrance landscaping could
  obscure a small structure, but nothing supports one.
- **remoteGs: false.** No gate, so no remote check-in either.
- **dockDoors: "10-25".** ~12-14 doors along the south face under the blue
  canopy (estimate).
- **dropArea / dropYard: true, "10-25".** Large paved truck yard with marked
  space; ~4 trailers visible in the captured imagery, capacity well above that.

## Yard zones and counts

- **Perimeter:** ~27 acres fenced parcel, roughly 295 m (E-W) x 420 m (N-S).
- **Truck gate zone:** the open south driveway off the south public road.
- **Drop yard:** paved trailer yard along the south/SW of the building.
- **Dock apron:** strip in front of the south-face dock doors.
- **dockDoorCount:** ~14 · **trailersVisible:** 4 · **trailerParkingCapacity:**
  ~40 · **truckGateCount:** 1 · **buildingCount:** 2 (main + NE annex) ·
  **siteAreaAcres:** ~27 · **railServed:** false (adjacent rail corridor is a
  through-line; no spur into the building).

## Web findings

MCC Mira Loma is part of Anheuser-Busch's Metal Container Corporation packaging
group, manufacturing aluminum beverage cans. MCC overall produces 25B+ cans and
27B+ lids annually and supplies AB plus PepsiCo and Coca-Cola. EPA TRI lists it
as an active facility. AB has announced expansion investment in MCC container
facilities. Plant is active.

## Final confidence

**high.** Facility positively identified, imagery clear at zoom 20, gate and
dock determinations supported by both satellite and Street View. Dock-door
count and the guard-shack negative carry minor uncertainty (flagged).

### 3-line summary
- Gate verdict: NO truck gate — open south driveway, no barrier/checkpoint.
- Guard-shack verdict: NO guard shack at the entrance.
- Confidence: high.
