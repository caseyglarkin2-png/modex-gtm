# Deep-Audit Dossier — Ford BlueOval City / TN Electric Vehicle Center (idx 09)

## Facility
- **Name:** Ford - BlueOval City / Tennessee Electric Vehicle Center, Stanton TN
- **Type:** Vehicle Assembly Plant (greenfield, ramp-up)
- **Address:** TN-222 at Stanton-Somerville Rd, Stanton, TN 38069
  (street address now 2025 BlueOval City Drive, Stanton, TN)
- **Resolved center:** 35.42000, -89.41800 (CORRECTED — see below)

## Step 0 — Location correction
The roster geocode (35.457145, -89.405212, flagged GEOMETRIC_CENTER, moved 1 m)
landed on the **town of Stanton itself** — a small farming community, NOT the
plant. Satellite probe at z14 of the geocode point showed only farmland and
the town center.

Web research (Haywood County, TN Megasite Authority, Wikipedia) places
BlueOval City ~2.5 miles **south** of Stanton on the 4,100-acre Memphis
Regional Megasite in SW Haywood County. Probing south of Stanton found the
campus at approximately **35.420, -89.418** — a large industrial campus with
multiple completed buildings, internal roads, and ongoing construction. Center
locked there.

## Key views
- **z13/z14 wide:** Large industrial campus mid-build — completed white-roofed
  buildings, internal road network with roundabouts, and large areas of raw
  graded land.
- **Main assembly/battery plant (z16):** A vast white-roofed building on the
  south side; a long covered structure (covered parking / solar) to the north;
  supplier buildings.
- **West side (z17):** Electrical substation and plant utility infrastructure.
- **NE (z18):** A gate/checkpoint structure with crosswalk markings on the
  truck route; trailers parked nearby.
- **Street View (Feb 2026):** Continuous perimeter chain-link fencing; the
  internal road network is paved with street lighting, but large portions of
  the campus are still raw graded land with earthmoving equipment active.

## Gate / guard-shack / dock determinations
- **truckGate = true (uncertain).** Continuous perimeter fencing and a
  controlled internal road network; a gate/checkpoint structure visible on the
  NE truck route. Marked uncertain — site is mid-ramp-up, imagery is mixed-era.
- **guardShack = true (uncertain).** A booth/checkpoint structure is visible;
  Ford runs staffed gatehouses at assembly campuses. Uncertain due to greenfield
  ramp-up status.
- **remoteGs = false (uncertain).** Default to staffed gatehouse model.
- **multiStep = true (uncertain).** Campus-scale site implies layered
  checkpoints.
- **dockDoors = 25-50.** ~35 doors estimated; dock banks still being
  established.

## Yard zones and counts
- **Perimeter:** ~950 acres developed core (full megasite is 4,100 acres;
  Ford footprint still expanding).
- **Drop yards:** Trailer parking / laydown areas near the NE and W building
  faces.
- **Metrics:** ~35 dock doors, ~60 trailers visible, ~200 trailer capacity,
  2 truck gates, ~12 buildings, rail-served = true (planned, uncertain).

## Web findings
- Haywood County / TN Megasite Authority / Wikipedia: BlueOval City is a
  $5.6B greenfield EV truck + battery campus on the 4,100-acre Memphis Regional
  Megasite, ~2.5 miles south of Stanton in SW Haywood County. Designed to build
  electric trucks and batteries (JV battery operations with SK On).

## Final confidence: MEDIUM
The facility was located and confirmed (after correcting a wrong roster
geocode), and major buildings, fencing, and a checkpoint structure are
visible. Confidence is held at medium because the site is a genuine greenfield
in active ramp-up — imagery is mixed-era, dock banks and final gate
configuration are still being established, and metrics are best-effort
estimates that will change as the campus builds out.
