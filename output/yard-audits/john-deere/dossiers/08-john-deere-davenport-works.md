# Deep-Audit Dossier — John Deere Davenport Works, Davenport IA (idx 8)

## Resolved location
- **Address:** 1175 E 90th St, Davenport, IA 52807
- **Locked center:** 41.601800, -90.551500 (centroid of the giant main
  assembly hall)
- **Confirmation:** Roster geocode moved 2959 m (GEOMETRIC_CENTER quality), so
  the location was verified independently. Satellite z15-17 around the supplied
  point shows one enormous manufacturing complex standing alone in open
  farmland NE of Davenport. Web search (about.deere.com Davenport Works, Iowa
  DNR Facility Explorer, Quad Cities Chamber) confirms John Deere Davenport
  Works — a Construction & Forestry division plant producing articulated dump
  trucks, four-wheel-drive loaders, motor graders, and log skidders since 1974.
  Finished construction equipment (graders, ADTs, wheel loaders) staged in rows
  on the yards confirms the site. Correct location confirmed; locked center
  shifted onto the actual building.

## Key views
- **Very wide (z15):** Single immense plant in farmland; private access road
  runs ~600 m north to a controlled intersection on E 90th St.
- **Main building (z17):** A vast assembly hall — one of Deere's largest single
  roofs — plus older lighter-roofed building sections to the north and NE.
- **North yards (z19-20):** Finished construction equipment marshaled in rows
  (motor graders, articulated dump trucks, wheel loaders) on huge paved aprons.
- **NE corner (z19):** Trailer rows and lumber/material storage beside an older
  building section.
- **Entry (z18-19):** Wide multi-lane private access road off a signed
  intersection on the public road; no Street View coverage past the road edge.
- **Street View (E 90th St, 2023-2025):** Plant sits far back behind farmland
  and a landscaped lawn; no booth or gate visible from the public road.

## Gate / guard-shack / dock determinations
- **truckGate: true (inferred, medium confidence)** — The campus is reached by
  a single wide private access road off a controlled public-road intersection;
  multi-lane markings at the junction indicate a managed private entry. A
  perimeter control point is inferred from the campus layout; the exact gate
  hardware could not be resolved (no Street View on the internal road).
- **guardShack: false** — No booth structure resolved at the road entry or
  along the access road.
- **remoteGs: true (low confidence)** — Set as the corollary of an inferred
  gate with no resolved booth.
- **Docks:** ~20 truck dock positions estimated along the north building face,
  banded **10-25**. Note finished construction equipment also ships drive-away
  or on flatbeds, so dock count understates real freight throughput.

## Yard zones and counts
- **Perimeter:** ~290-acre fenced industrial parcel (surrounding farmland
  excluded).
- **truckGate:** Boxed at the private-road / public-road junction on E 90th St.
- **dropYards:** Two — NE trailer/material yard, and the long north-face
  finished-equipment marshaling apron.
- **dockAprons:** One — the north building face loading strip.
- **staging:** Large interior paved holding area between the building and the
  finished-goods yard.
- **yardMetrics:** ~20 dock doors, ~18 trailers visible, ~60 trailer capacity,
  1 truck gate, 5 buildings, ~290 acres, no rail spur observed.

## Web findings
- about.deere.com confirms Davenport Works (Construction & Forestry) producing
  ADTs, 4WD loaders, motor graders, log skidders; production began 1974.
- Iowa DNR Facility Explorer and Quad Cities Chamber corroborate the 1175 E
  90th St address and the standalone rural campus.

## Final confidence
**Medium.** Location, scale, and product mix are unambiguous. Confidence is held
at medium because the truck-gate and guard-shack calls are inferred from campus
geometry — the internal access road has no Street View coverage and satellite
resolution does not resolve a booth or barrier — and because finished equipment
ships partly drive-away, leaving dock-door counts approximate.
