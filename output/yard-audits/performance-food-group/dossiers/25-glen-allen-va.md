# Deep Audit — idx 25: Performance Foodservice Glen Allen (Glen Allen / Hanover County, VA)

**Facility:** Performance Foodservice - Virginia (Glen Allen)
**Address:** 10399 Washington Highway, Glen Allen, VA 23059 (Cardinal Commerce Center, Hanover County)
**Type:** Broadline Foodservice Distribution Center
**Resolved coordinates:** 37.69430, -77.46680
**Confidence:** Medium

## Location resolution

Roster coordinates (37.69583, -77.469168) were flagged with a `movedMeters` of
2662 and landed in the Cardinal Commerce Center area but not exactly on the
building. Web research resolved the facility precisely: Performance Food Group
occupies **Phase I-Building B of Cardinal Commerce Center**, a 420,000 SF
building (PFG leases 332,000 SF), at 10399 Washington Highway in Hanover County.
The DC was built by Scannell Properties / ARCO and opened in 2023 as PFG's
new Virginia regional sales and distribution center. The building was positively
identified in March 2026 Street View — a red "Performance Foodservice" wall logo
faces the fenced front employee parking lot. Cardinal Commerce Center has three
buildings: Building A (260,000 SF, 2022), Building B (420,000 SF — PFG), and
Building C (186,900 SF speculative). Locked center: 37.69430, -77.46680.

## What the imagery showed

- **z15/z17 wide:** A brand-new three-building commerce park in southern Hanover
  County near Virginia Center Commons, with residential subdivisions immediately
  to the southwest. The PFG building is the largest of the three.
- **z18/z19:** A very large rectangular DC. A long dock line runs along the
  southwest face with trailers backed in; a wide truck court / drop yard sits in
  front of the docks; a loop road circles the building. Employee parking is on
  the southeast (front) side, enclosed by a black ornamental security fence.
- **Truck court (z19/z20):** Open paved truck court on the southwest with
  trailers and — in 2024-2026 imagery — construction barriers and materials
  still staged (site mid-finish-out). No barrier arm or guard booth at the
  truck-court entrance.
- **Front entrance (Street View, March 2026):** The front employee lot is
  enclosed by a black ornamental aluminum security fence with two driveway
  openings. The openings are uncontrolled curb cuts — no barrier arm, no guard
  booth. A monument sign stands at the entrance.

## Gate / guard-shack / dock determinations

- **Truck gate — FALSE.** No barrier arm, sliding gate across a lane, or
  checkpoint pinch-point visible at the truck-court entrance or at the two front
  employee-lot driveway openings. The front lot has a perimeter security fence,
  but the driveway openings are open curb cuts. Flagged in `uncertainFields` —
  the perimeter fencing on a new-build DC could imply a sliding gate not
  resolvable in current imagery.
- **Guard shack — FALSE.** No small staffed-booth structure at any entrance in
  satellite or Street View.
- **Remote GS — FALSE.** Set false because no truck gate is confirmed; if a
  sliding gate exists on the fence opening, the absence of a booth would make
  this true. Flagged.
- **Docks:** A very large 420,000 SF DC with a long southwest dock line —
  estimated ~70 doors. Banded **50+**. Construction staging and roof glare make
  this an estimate.

## Yard zones and counts

- **Perimeter:** ~30 acres — the PFG parcel including building, truck court /
  drop yard, loop road, and fenced front employee lot.
- **Drop yard:** Wide truck court on the southwest serving the dock line,
  capacity ~60 trailers.
- **Dock apron:** One — the long southwest dock face.
- **Trailers visible:** ~22 (site was still being finished out in the imagery).
- **Building count:** 1. **Rail:** none enters the property.
- **Fast-lane opportunity:** the brand-new truck court is wide with generous
  paved aprons — physical room for an express/bypass lane (inferred — flagged).

## Web findings

Richmond BizSense, Hanover County EDA, and Timmons Group materials confirm PFG's
new Hanover DC: ~$80M+ investment, 420,000 SF Building B in Cardinal Commerce
Center, PFG leasing 332,000 SF, operations begun 2023 (receiving from August,
shipping from September). It is PFG's regional sales and distribution center for
Virginia, replacing/consolidating older Richmond-area capacity near PFG's
corporate hometown.

## Final confidence: Medium

The facility, address, building (Cardinal Commerce Center Building B), and brand
are positively confirmed by web research and March 2026 Street View. Confidence
is medium rather than high because: imagery captures the site mid-finish-out so
counts are estimates; and the front perimeter fence on this new-build DC leaves
open the small possibility of a sliding gate at a driveway opening that current
Street View does not fully resolve — hence truckGate / remoteGs are flagged.
