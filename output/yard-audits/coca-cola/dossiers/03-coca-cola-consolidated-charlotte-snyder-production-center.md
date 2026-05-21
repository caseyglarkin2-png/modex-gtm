# Deep-Audit Dossier — Coca-Cola Consolidated Charlotte (Snyder) Production Center (idx 3)

## Facility
- **Name:** Coca-Cola Consolidated - Charlotte (Snyder) Production Center
- **Type:** Bottling / Manufacturing Plant
- **Address:** 4901 Chesapeake Dr, Charlotte, NC 28216
- **Locked coordinates:** 35.28450, -80.88300

## Step 0 — Location confirmation
The roster geocode (35.284839, -80.883091) moved 1649 m and landed inside a
large multi-building industrial campus. Satellite imagery shows extensive
diagonal trailer parking, large production/warehouse buildings, and a guarded
truck entrance. Street View on Chesapeake Dr (captured 2025-12) shows a red
Coca-Cola sign and chain-link perimeter fencing fronting the property,
positively confirming this as the Coca-Cola Consolidated Charlotte production
center. Yelp, CMac and Hotfrog all list the facility at 4901 Chesapeake Dr.

## Key views
- **z16/z17 overview:** Large industrial campus with multiple buildings,
  extensive trailer yards, rail line along the west boundary.
- **z20 truck gate:** A dark-roofed guard booth plus a small companion
  structure flank the truck lane; perimeter fence and gate point; a truck was
  parked at the booth at capture.
- **z19 dock views:** Long dock banks with trailers backed in on the north and
  southwest building faces.
- **z18 yard views:** Hundreds of trailers in diagonal-stall lots on the west
  and north sides; pallet/material storage in the yard.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled, fenced truck entrance off Chesapeake Dr with
  a gate point and guard booth.
- **guardShack = true.** A staffed dark-roofed booth sits beside the truck lane,
  distinct from the main building (z20 satellite).
- **remoteGs = false** — a booth is present.
- **dockDoors = 50+.** Multiple large production/warehouse buildings with dock
  banks on several faces; estimated ~60 doors.
- **shipRcvSeparate = true.** Distinct dock clusters on the north and southwest
  building faces.

## Yard zones and counts
- **Perimeter:** ~38 acres.
- **Drop yards:** Two large trailer-storage lots (west/south and north-central),
  ~110 trailers visible, capacity ~160.
- **Dock aprons:** North building face and southwest building face.
- **Staging:** Post-gate paved area before the dock banks.
- **truckGateCount:** 1.
- **buildingCount:** ~4 (multi-building campus → multipleFacilities = true).
- **railServed = false (uncertain):** Rail line runs along the west boundary
  but appears to serve the neighboring property; no clear spur into the
  Coca-Cola docks.

## Web findings
Coca-Cola Bottling Co. Consolidated (Coca-Cola Consolidated), the largest US
Coca-Cola bottler, operates this production/distribution facility at 4901
Chesapeake Dr; phone (704) 393-4300. Referenced in SEC 10-K manufacturing
facility lists.

## Final confidence
**High.** Location positively confirmed by signage and fencing; gate, guard
booth, dock banks and trailer yards all clearly visible. `railServed` and
`scale` flagged as uncertain.
