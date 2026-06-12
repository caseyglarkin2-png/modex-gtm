# 13 — PBNA Burnsville MN (1300 Cliff Rd E, Burnsville, MN 55337)

## Location confirmation
Roster geocode (ROOFTOP, 44.791272, -93.256578) lands on a large white-roof industrial
building fronting Cliff Rd E. Web search confirms 1300 Cliff Rd E = Pepsi-Cola
Metropolitan Bottling Company (D&B, Yelp, BBB). Street View from the 12th Ave S
driveway (2022-02 pano) shows Pepsi-globe trailers parked just inside the lot —
positive ID. Locked center: 44.79126, -93.25670.

Sources: [D&B profile](https://www.dnb.com/business-directory/company-profiles.pepsi-cola_metropolitan_bottling_company_inc.be67fdcda999de88d0bf10c04f98129a.html), [Yelp](https://www.yelp.com/biz/pepsi-bottling-group-burnsville), [BBB](https://www.bbb.org/us/mn/burnsville/profile/food-manufacturer/pepsi-cola7-up-bottling-co-mstp-0704-853)

## Campus context (important)
The plant is the SOUTH building of a two-building Pepsi campus. The building
immediately north is the separate Pepsi warehouse at 11601 12th Ave S (per roster
note). The two share one open truck court: the warehouse's south face carries a
~25-28-door dock row (trailers + tractors backed in, z19/z20 imagery), and drop
trailers for both sit in the court. Those warehouse docks were NOT counted for
this facility. `multipleFacilities: true` reflects the shared-yard campus reality.

## Gate / guard shack
- East drive off Cliff Rd (44.7904, -93.2553): Street View 2023-05 — open driveway,
  box truck exiting, no barrier arm, no gate, no booth.
- North 12th Ave S driveway (44.7916): Street View 2022-02 — open curb cut into the
  trailer lot, chain-link perimeter fence behind, no gate structure.
- South 12th Ave S driveway (44.7909): open, landscaped berm, car lot behind.

Verdict: **truckGate false, guardShack false, remoteGs false** — open site (Kraft
Holland-style archetype #3 pattern).

## Docks / yard
- Plant dock doors are on the EAST face: box trucks and trailers backed in along a
  north-south apron (z20). Estimated ~14 doors (band 10-25, flagged uncertain).
- West lot: Pepsi route/delivery box trucks in marked stalls plus a trailer strip
  along the 12th Ave fence (~10 trailers).
- North wall: a parallel-parked drop row of ~8 trailers (not docked).
- No truck scale, no rail spur, no second checkpoint.

## Geofence
Perimeter traced as the plant parcel: 12th Ave S (west) to the flex building's west
wall (east, ~-93.25545), Cliff Rd frontage (south) to the mid-court drive aisle
south of the warehouse dock row (north, ~44.79203). Streets here run true N-S/E-W,
so the rectangle is genuinely orientation-correct. ~171 m x ~209 m = ~8.8 acres.
Sub-zones: truckGate quad on the Cliff Rd east-drive throat; 2 drop yards (north
wall row, 12th Ave strip); 1 dock apron (east face).

## Confidence
**Medium.** Facility ID and open-gate verdict are solid; uncertainty is the parcel
split with the adjacent Pepsi warehouse (shared court), the exact east-face door
count, and ship/receive separation (not visible).
