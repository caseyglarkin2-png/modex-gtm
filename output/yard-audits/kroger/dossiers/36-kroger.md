# Deep-Audit Dossier — idx 36

**Facility:** Pace Dairy of Indiana (Crawfordsville Cheese) — Dairy Plant
**Address:** 800 N Englewood Dr, Crawfordsville, IN 47933
**Resolved center:** 40.05080, -86.87380
**Confidence:** high

## Location confirmation (Step 0)
Approximate coords (40.051006, -86.873926) landed directly on a large industrial
complex. Web research confirmed it is the Kroger-owned Pace Dairy cheese cut-and-
wrap / shred plant (built 1982, ~148,000 sq ft, ~250-300 employees, ~80-110M lb of
cheese/yr), at 800 N Englewood Dr. The Apr-2026 Street View entrance frame shows a
"PACE DAIRY" monument sign, positively identifying the building. Coords accurate; no
relocation needed.

## Key views
- **z17/z18 overview:** roughly square plant complex (near-cardinal orientation),
  large diagonal employee parking lot on the west, an aerated wastewater treatment
  lagoon (oval) on the east, a perimeter truck loop, and trailer rows along the east
  and south.
- **East face (z20):** ~12-15 trailers backed into dock doors on the building's east
  wall; a wide truck apron; and a dedicated drop yard (two long trailer rows, 20-30+
  trailers) beside the lagoon. This is the main dock + drop concentration.
- **South face (z20):** a curved truck turnaround / staging apron and an angled row of
  staged trailers along the south access road.
- **West driveway (z19/z20):** single entrance off Englewood Dr; driveway splits to the
  employee lot and to the perimeter truck road.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Apr-2026 Street View (pano Rv6jlO0YSodPkn1tql9aUQ, heading ~90°)
  shows a fenced entrance: chain-link perimeter fence on both sides of the drive, a gate,
  and a truck mid-checkpoint. A clear controlled pinch-point, not an open driveway.
- **guardShack = true.** A small booth sits on a center island in the gate apron, visible
  in Street View and as a distinct ~1-vehicle structure in z20 satellite. remoteGs = false.
- **postGateStaging = true / drivewayLong = true.** Large paved truck loop / turnaround
  inside the gate before the docks; gate-to-dock approach easily holds 3+ trucks.
- **dockDoors = "25-50".** East wall ~12-15 doors (trailers backed in) plus a south/SE
  dock cluster; banded 25-50 (not exhaustively counted — flagged uncertain).
- **dropYard = true / dropArea = "25-50".** Dedicated trailer-storage rows along the east
  side by the lagoon, plus a staged south row.
- **scale = false** (none clearly visible). **shipRcvSeparate = false** (docks on adjacent
  faces, not two clearly separate clusters). **multiStep = false** (single checkpoint).

## Yard zones & counts (from z20-21 imagery)
- perimeter ≈ 17.5 acres (fenced property: building, parking, lagoon, drop yards, loop).
- dockDoorCount ≈ 32; trailersVisible ≈ 38; trailerParkingCapacity ≈ 50.
- 1 truck gate, 1 building complex (attached refrigerated warehouse), no rail spur.
- entryExitTogether (single gate), entryLanes 1 / exitLanes 1, no fast-lane width.

## Setting
urbanRural = Rural — edge of Crawfordsville, IN, bordered by farmland on the south and
open ground east; light-traffic Englewood Dr, so backupSensitive = false and
connectivityIssue = false (in-town industrial area).

## Web findings
Kroger subsidiary; cheese cut/wrap + shred plant; ~110M lb/yr distributed to half the
U.S.; recent $5M shred-line upgrade. Sources: Dairy Foods, Inside INdiana Business,
Journal Review, Yelp/Indeed listings (800 N Englewood Dr).

## Confidence
High — facility unambiguously identified, recent (Apr-2026) Street View resolves the
gate and guard booth, satellite resolves docks/drop yards. Dock-door exact count and
ship/rcv split are the only soft calls (flagged).
