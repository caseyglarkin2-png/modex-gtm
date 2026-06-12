# 17 — PBNA Las Vegas NV (6500 W Sunset Rd, Las Vegas, NV 89118)

## Location confirmation
Roster geocode (GEOMETRIC_CENTER, 36.071804, -115.234118) lands on the large
bottling + distribution campus at Sunset Rd between Rainbow and Lindell — matching
the Packaging Gateway profile (387,400 sq ft, built 2008). Street View 2025-02 from
Sunset Rd shows the Pepsi globe on the facade, a Gatorade trailer in the front lot,
and the blue entrance canopy. Positive ID. Locked center: 36.07220, -115.23410.

## Gate / guard shack
The operational yard is fully enclosed by a tall tan block wall — confirmed in
Street View on the Sunset (south), north (from the neighbor's lot), and east sides.
Access points found:
- Front Sunset Rd drives: open car entrances into the visitor/employee lot only
  (lobby with blue canopy; lot is outside the wall line).
- NE corner (36.0735, -115.2320): the single truck access - a curb cut off the
  east street through the wall into the internal perimeter drive (yellow-striped
  curb, z19/z20). Gate hardware not resolvable from overhead and no SV reach.

Verdict: **truckGate true (walled single-throat yard; hardware unverified -
flagged), guardShack false (none observed), remoteGs true.** A wrong-side risk:
if the NE throat is actually staffed, remoteGs flips; flagged in uncertainFields.

## Docks / yard
- West-face dock row toward the fleet yard: ~12-14 trailers backed in.
- East-face row on the perimeter drive: ~6-8. Ship/receive read as separate banks.
- Walled north yard: trailer drop rows (~18) plus pallet/shell stacks; middle-yard
  rows (~10); route trucks across the west yard; SW outbuilding with van fleet.
- No scale, no rail, no second checkpoint.

## Surroundings gotcha
The strip between the west public street and Pepsi's west wall is a separate
parcel (a Helix Electric laydown in 2022 SV, now holding trailer rows) — excluded
from the perimeter. Semis queued on that street in 2022 SV are not Pepsi pre-gate
staging.

## Geofence
Perimeter = the walled campus + front lot: north wall (36.07344) to Sunset Rd
frontage (36.07089), west wall (-115.23635) to east wall/street (-115.23189);
streets run true N-S/E-W so the rectangle is orientation-correct. ~28 acres.
Sub-zones: NE truckGate quad, 2 drop yards (north yard, middle yard), 2 dock
aprons (west face, east face).

## Confidence
**Medium.** Identity certain; walls and layout clear; the gate/guard configuration
at the NE throat is inferred from the walled geometry rather than seen directly.
