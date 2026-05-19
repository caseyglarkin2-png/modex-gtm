# Deep-Audit Dossier — Nestlé Prepared Foods, Jonesboro AR (idx 2)

## Resolved location
- **Address:** 1 Nestle Way, Jonesboro, AR 72411 (Craighead County Technology Park)
- **Locked center:** 35.81930, -90.57950
- **Confirmation:** Roster geocode (35.8189, -90.578985) was already within the
  parcel; satellite probes z16-z21 confirm a large frozen-food manufacturing
  plant set in the Craighead County Technology Park, surrounded by farmland.
  Street View (2026-01) shows the plant from the divided highway; a Nestlé
  monument sign stands at the entrance drive. Web research confirms 1 Nestle
  Way in the Craighead Technology Park (Stouffer's/Lean Cuisine/DiGiorno/Hot
  Pockets, ~375,000+ SF, $100M Hot Pockets expansion in 2020).

## Setting
- Rural — the plant occupies a technology-park parcel ringed by agricultural
  fields on all sides; a 4-lane divided highway runs along the north.
  Neighbors include other industrial facilities (Millard, Frito-Lay, etc.) but
  the broader fabric is small-town/edge-of-town.

## Key views
- **Overview (z16-17):** One very large white-roof plant building with a large
  orange/brown-roof expansion on the east (the Hot Pockets expansion).
  Employee parking on the W and N; truck operations on the S and E.
- **SE drop yard (z19-20):** Large gravel/unpaved trailer-storage area holding
  many parked trailers in rows.
- **East truck yard (z19-20):** Paved truck yard with dock doors along the
  building's east face and rows of parked trailers.
- **Truck entrance (z20):** A small white booth-footprint structure with a
  vehicle parked beside it sits at the pinch-point where the east access road
  meets the paved truck yard (~35.8203, -90.5757) — a staffed guard booth.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** Trucks enter via a long access road off the divided
  highway, controlled at a pinch-point where the road meets the paved truck
  yard.
- **Guard shack — TRUE.** A small ~1-2-vehicle-footprint white structure with
  a parked car beside it controls the truck-yard entrance — reads clearly as a
  staffed guard booth in z20 imagery.
- **Docks — 25-50 band (~40 doors).** Dock banks read on two distinct building
  faces (south and east) — `shipRcvSeparate: true`.

## Yard zones and counts
- **Perimeter:** ~78 acres — building + truck yards + parking, excluding
  surrounding undeveloped/agricultural land.
- **Drop yards:** Two — a gravel SE yard and a paved E yard — together holding
  ~50+ trailers. `dropYard: true`, `dropArea: 50+`.
- **Dock aprons:** Strips along the south and east building faces.
- **Staging:** Open paved area inside the property before the docks.
- **Buildings:** 1 connected plant complex (with attached expansion).
- **Rail:** Not rail-served — no spur enters this parcel.

## Web findings
- Arkansas Business / Site Selection / Jonesboro Unlimited confirm Nestlé in
  the Craighead County Technology Park, originally a 375,000-SF Stouffer's /
  Lean Cuisine frozen-meal plant (opened 2003), with a $100M Hot Pockets
  expansion announced Dec 2020.

## Final confidence
**High.** Facility unambiguously identified; gate, guard booth, dual drop
yards and dock band well supported. Exact lane and dock counts are estimates
(flagged in uncertainFields).

- Gate verdict: TRUE — long access road controlled at a yard pinch-point.
- Guard-shack verdict: TRUE — small staffed booth at the truck-yard entrance.
- Confidence: high.
