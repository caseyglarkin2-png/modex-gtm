# Deep-Audit Dossier — Target RDC Indianapolis (T0559)

- **Facility:** Target Regional Distribution Center Indianapolis (T0559)
- **Type:** RDC (regional distribution center)
- **Address:** 7551 W Morris St, Indianapolis, IN 46231
- **Resolved center:** 39.74650, -86.29600
- **Method:** deep-audit (satellite z15-21 + Street View 2011/2019/2024/2025 + web)
- **Confidence:** HIGH

## Location confirmation
The supplied geocode (39.745747, -86.296794) landed directly on the correct
building — no relocation needed. Positive ID via:
- **Web:** IBJ reporting describes a ~1.4M sq ft Target RDC at 7551 W Morris St,
  west of Girls School Rd, north of Indianapolis International Airport, ~600
  employees, being partially converted (~254k sq ft) for e-commerce fulfillment.
- **Imagery:** A single dominant ~1.4M sq ft white-roofed building with
  continuous dock banks and surrounding multi-row trailer yards.
- **Branding:** Street View shows the Target bullseye on the building wall
  (sv-yardentry, sv-west-morris) and rows of "TARGET" bullseye-marked trailers
  in the west yard (sv-westperim-90). Red Target property/security signage at
  the Morris St office frontage.

## Key views
- **overview-z17 / wide-z16 / full-z15:** Establish the single large building
  with drop yards on the west and south and a curving SE access/circulation road.
  A second large white building to the north is a SEPARATE facility (not Target).
- **north-entry-z17:** North (Morris St) frontage — diamond office-entry canopy,
  employee parking, public road along the top.
- **dropyard-west-z18 / sv-westperim-90:** West drop yard — dozens of rows of
  Target-branded trailers in marked stalls; tall chain-link perimeter fence with
  jersey barriers.
- **east-mid-z18 / se-drive-z18 / se-exit-z20:** South drop yard and the wide
  internal circulation road (painted directional arrows, yard row labels R11-R13).

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** The property is fully fenced (tall chain-link + concrete
  jersey barriers, confirmed across multiple Street View frames). Sliding/swing
  gates cross the truck drives — clearest at the west building face (pano
  39.74897,-86.29739, sv-morris-north-180) and the west-yard entrance
  (sv-yardentry-180). Controlled, gated access, not an open driveway.
- **guardShack = FALSE (flagged uncertain).** No standalone guard-booth structure
  (the ~1-3-stall windowed booth pattern) resolved at any truck entrance in
  satellite z20-21 or in any Street View frame. The SE corner "structure" at
  z21 resolved to a parked trailer + yard-parking stalls, not a booth.
- **remoteGs = TRUE.** A gate exists but no manned booth is visible, implying
  kiosk / badge / app check-in at the perimeter gates.
- **dockDoors = "50+".** Continuous dock-door banks run the long west face and
  the long south face of the building (~180 doors estimated).
- **shipRcvSeparate = TRUE.** Two distinct dock banks on different building faces.

## Yard zones & counts (estimates from overhead imagery)
- **perimeter:** ~72 acres of fenced paved truck-operations area (oriented ring
  tracing the Morris St north edge, west fence, south tree line, and the
  diagonal SE access edge).
- **dropYards:** west yard (largest, many trailer rows) + south yard. Hundreds
  of trailers; dropArea = "50+", dropYard = true.
- **dockAprons:** long apron strips hugging the west and south dock faces.
- **dockDoorCount ~180; trailersVisible ~320; trailerParkingCapacity ~450;
  truckGateCount 2; buildingCount 1; railServed false** (no spur into the lot).

## Web findings
- 1.4M sq ft RDC, ~600 employees, Midwest store replenishment + partial
  e-commerce conversion (Indianapolis Business Journal, corporate.target.com
  job postings, TruckMap/Waze listings).

## Setting & access geometry
- **urbanRural = Urban** — within the Indianapolis metro industrial fabric near
  the airport; neighbors include other warehouses and small businesses on Morris St.
- **entryExitSeparate / drivewayLong / postGateStaging / fastLaneOpportunity =
  true** — multiple separated truck access points and deep internal drives with
  ample paved width and queue room; large interior aprons for staging.
- **backupSensitive = false** — abundant on-site stacking; queues would not spill
  to the public road.

## Final confidence: HIGH
Facility identity, fenced gated truck access, dock scale, and drop-yard scale are
unambiguous. The only soft calls (flagged uncertain) are the guard-shack /
remote-check-in pair and exact lane counts, which overhead + available Street View
cannot fully resolve.
