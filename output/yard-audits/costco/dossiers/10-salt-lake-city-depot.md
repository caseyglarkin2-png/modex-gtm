# Yard Dossier — Costco Depot #584/585, Salt Lake City UT

**Type:** Dry Depot (Intermountain West regional cross-dock)
**Address:** 5995 W 300 S, Salt Lake City, UT 84104
**Resolved center:** 40.75815, -112.03230
**Maps (satellite):** https://www.google.com/maps/@40.75815,-112.03230,400m/data=!3m1!1e3
**Method:** deep-audit (satellite z16-z20 + Street View) · **Confidence: high**

---

## Location confirmation
Roster coords (40.758482, -112.032165) landed directly on the roof of a very
long, narrow north-south building inside the West-Valley / SLC International
industrial corridor off 300 South. Web research confirms the address as Costco's
SLC Distribution Center / Depot (appointment-only receiving 5:00a-12:30p Mon-Sat;
drivers check in and are issued a pager with their unload door number). The
center coordinate was nudged to the true footprint mid-point (40.75815,
-112.03230). The building is the long central structure; the large white-roofed
building to the southeast and the buildings to the west are separate tenants and
were excluded from the Costco perimeter.

## Building & layout
- One enormous cross-dock building, roughly **640 m (N-S) x 170 m**, dock doors
  on **both** long faces. North wall ~40.7610, south wall ~40.7552; west wall
  ~-112.0333, east wall ~-112.0313. The southern third has a lighter/newer roof
  section (likely an expansion).
- Roof is dotted with regular skylights/vents (the "checkerboard" pattern), with
  a bright skylight glare at the NW corner across multiple captures.

## Truck gate / guard shack (rigorous calls)
- **truckGate = TRUE.** A single main truck entrance enters from **300 South on
  the north side**. The driveway throat (z18/z19 sat) is wide and long, funneling
  down ~150 m from the public road into the yard. Street View from the road
  (pano JSzFNVV-enXULm4bbe7BzQ, 2025-07, looking south) shows tractors staged in
  the throat and **perimeter chain-link fencing** along the property line.
- **guardShack = TRUE.** Inner-yard Street View (pano vkRCTVybp4pmBPRcJHwYjg,
  2021-05, looking north) clearly shows a **manned gatehouse with a red canopy
  spanning the lane**, with a tractor queued at it. This matches the published
  driver procedure (check in, receive a pager). It is a canopied check-in booth,
  not the main building.
- **remoteGs = FALSE** — the gate is physically manned, not a kiosk/call-box.
- **multiStep = FALSE** — no distinct second checkpoint (no scale house) seen
  after the gate.

## Docks
- **dockDoors = "50+".** Both long faces carry a continuous rhythm of dock doors
  for the full ~640 m. West-face Street View shows an unbroken wall of dock seals
  with trailers backed in; east face is the same in satellite. Honest total
  estimate ~180 doors across both faces.
- **shipRcvSeparate = TRUE.** Cross-dock with two physically separate dock banks
  (east face vs. west face) — inbound and outbound run from different walls.

## Yard zones & drop yards
- **dropYard = TRUE, dropArea = "50+".** Three trailer storage areas modeled:
  1. Large **east drop yard** (rows of parked trailers between the east apron and
     the property's east field edge).
  2. **North drop yard** along 300 South, north of the building.
  3. **West yard** strip (employee parking transitions into a west-side trailer
     yard backed to the west dock face).
- **postGateStaging = TRUE** — wide paved holding apron inside the gate before
  the docks. **preGateStaging = TRUE** — paved apron between 300 South and the
  gatehouse where trucks stage on arrival.
- **drivewayLong = TRUE** — gate-to-dock approach easily holds 3+ trucks.
- **fastLaneOpportunity = TRUE** — the entrance apron is far wider than the truck
  path; ample unused paved width to add an express/bypass lane.
- **entryExitTogether = TRUE** — one gate group; a minor secondary connection on
  the south road feeds employee parking but is not a separate manned truck gate.

## Yard metrics (overhead estimates)
- dockDoorCount ~180 · trailersVisible ~240 · trailerParkingCapacity ~320
- truckGateCount 1 · buildingCount 1 · siteAreaAcres ~79.5 · railServed false

## Setting & connectivity
- **urbanRural = "Urban"** — dense industrial fabric of West Valley / SLC
  International, surrounded by other large DCs and an interstate corridor.
- **connectivityIssue = FALSE** — metro-edge industrial park, strong coverage
  expected. **backupSensitive = FALSE** — deep internal throat absorbs queues;
  trucks stage off the public road.

## Web findings
- Appointment-only receiving 5:00a-12:30p Mon-Sat; night parking available.
- Driver check-in issues a pager with the assigned unload door number —
  corroborates a manned check-in gate, not self-service.

## Street View
- truckGate / perimeter arrival frame: pano **JSzFNVV-enXULm4bbe7BzQ** at the
  300 South driveway mouth (heading ~180-181 into the entrance).
- Gatehouse canopy + dock wall confirmed from interior pano
  **vkRCTVybp4pmBPRcJHwYjg** (2021-05).

## Confidence
**High.** Building positively identified, gate and guard shack confirmed in two
independent Street View captures plus published driver procedure, dock and drop
banding clear from satellite. Lower-confidence items: exact lane counts, scale
presence (none seen), and precise trailer capacity — flagged in uncertainFields.
