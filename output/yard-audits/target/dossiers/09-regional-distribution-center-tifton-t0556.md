# Deep-Audit Dossier — Target Regional Distribution Center Tifton (T0556)

- **Facility:** Target Regional Distribution Center T0556
- **Type:** RDC (retail regional distribution center)
- **Address:** 4502 Union Rd (Old Union Rd), Tifton, GA 31794
- **Geocoded coords (supplied):** 31.421362, -83.518147 — OFF (landed on the
  east office annex / parking edge, not the building center)
- **Resolved center:** 31.42050, -83.52080
- **Confidence:** HIGH
- **Method:** deep-audit (satellite z15-z21 + Street View, Feb 2026 panos)

## Location confirmation

The supplied point sat on the small standalone structure at the building's
east end (office annex / employee-parking edge). The actual RDC is the massive
diagonal building to the WEST. Positively confirmed as Target T0556 by:

1. **Street View, north dock face (heading 180° from Old Union Rd):**
   white trailers backed into the dock doors carry the red **Target bullseye**
   logo — unmistakable Target branding across the entire dock wall.
2. **Address match:** 4502 Union Rd / Old Union Rd, Tifton GA 31794 — matches
   the Tift County Chamber listing and Target's own Workday job postings for
   "Regional Distribution Center, Tifton, GA (T0556)."
3. **Footprint:** a single ~0.5 M sq-ft+ rectangular DC with a vast trailer
   drop yard — consistent with a Target RDC, not an office or unrelated plant.

## What the key views showed

- **Wide (z15/z16):** large rectangular building oriented diagonally, long
  axis running roughly NNE-SSW (~25° off north). Public road (Old Union Rd)
  runs E-W across the north. Woods/farmland west and south; a separate
  silo / feed-mill complex sits to the NW; a Penske truck-lease yard and other
  small industrial buildings to the east. Setting is rural / edge-of-town.
- **North dock face (z18 + SV):** long bank of dock doors with dozens of
  Target trailers backed in; fenced dock service road runs along the face
  behind a grass buffer.
- **SW drop yard (z18):** enormous trailer-storage lot — many rows of marked
  stalls holding hundreds of trailers (blue, white, green, orange tops),
  clearly a dedicated drop yard separate from active dock staging.
- **NW corner (z19):** a rail spur curves into the property — rail-served.
- **NE entrance (z20 + SV, heading 200°):** a wide open paved truck driveway
  connects the dock service road to the public road. Turn-arrows painted on
  the road; NO barrier arm, NO sliding gate, NO guard booth at the road.
- **W boulevard drive (z20 + SV):** a divided entrance drive near the office
  with a small white booth-footprint structure on a grass island — but Street
  View shows this drive continues NW to the feed-mill/silo complex (a separate
  operation). The booth is associated with that shared agricultural access,
  not a Target manned gate.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** The yard perimeter is fenced and trucks enter through
  defined truck-lane driveways (NE dock-road driveway + W office boulevard),
  functioning as controlled property entrances. Standard for a retail RDC of
  this scale. *(Note: no barrier arm is visible at the road in Street View;
  control is at the fence-line driveways — medium-high confidence on the call.)*
- **guardShack = FALSE.** No staffed guard booth at any Target truck entrance
  in the Feb-2026 Street View. The only booth-footprint structure (W
  boulevard) belongs to the adjacent feed-mill operation up the shared road.
  The NE truck entrance is an open driveway with no booth.
- **remoteGs = TRUE.** Gate/controlled fenced entrance present but no manned
  booth -> kiosk / app / call-box check-in implied.
- **Docks (50+):** dock banks on two faces — the north face (Target trailers
  backed in across the whole wall) and the west/southwest face along the drop
  yard. Comfortably 50+ doors total → `shipRcvSeparate = TRUE`.
- **Drop area (50+):** the SW lot holds hundreds of parked trailers in marked
  rows → `dropYard = TRUE`.
- **scale = FALSE / multiStep = FALSE:** no truck scale or second checkpoint
  observed in the yard.

## Yard zones & counts (overhead estimates)

- dockDoorCount ≈ 110 (north + west faces; low-confidence exact)
- trailersVisible ≈ 320 in captured imagery
- trailerParkingCapacity ≈ 450
- truckGateCount = 2 (NE dock driveway + W boulevard)
- buildingCount = 2 (main RDC + east office annex)
- siteAreaAcres ≈ 83.5 (shoelace from perimeter ring)
- railServed = TRUE (spur curves through NW)

## Geofences

- **perimeter:** 6-vertex oriented ring tracing the fenced property —
  N entrance corner, NE office/parking corner, E edge, S corner by the pond,
  SW drop-yard edge, W dock-yard corner.
- **truckGate:** rotated quad over the NE dock-road entrance driveway.
- **dropYards:** one rotated quad over the SW trailer-storage lot, aligned to
  the trailer rows / building angle.
- **dockAprons:** two rotated quads — one hugging the north dock wall, one
  hugging the SW dock wall along the drop yard, both at the building's true
  angle.
- **staging:** null (post-gate yard circulation is open; no distinct staging
  pad isolated).

## Web findings

- Tift County Chamber of Commerce lists "Target Distribution T0556," 4502 Old
  Union Rd, Tifton GA 31794; ~500-999 employees, $1B+ throughput.
- Target Workday postings: "Full Time Hourly Warehouse Operations (T0556)" and
  "Operations Manager Intern — Regional Distribution Center, Tifton, GA," both
  at the 4502 Union Rd address — confirms it is an active Target RDC.

## Final confidence

**HIGH.** Facility identity is unambiguous (Target-branded trailers + address +
job postings). Layout, docks, drop yard, and rail are clearly read from
imagery. Lower-confidence items (flagged in uncertainFields): the precise
guard-shack / remote-gate distinction and the entry/exit lane counts, since the
Street View does not capture a barrier arm at the road directly.
