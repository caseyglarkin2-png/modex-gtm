# Deep-Audit Dossier — Danone Fort Worth TX (idx 9)

**Facility:** Danone - Fort Worth TX
**Type:** Fresh yogurt plant — Danimals, Activia, YoCrunch
**Address:** 1300 West Peter Smith Street, Fort Worth, TX 76104
**Resolved coordinates:** 32.741022, -97.339329
**Confidence:** High

## Step 0 — Location confirmation
Roster coordinates (32.741022, -97.339329, ROOFTOP, 121 m move) landed on a large
multi-building industrial complex in Fort Worth's Near Southside district, directly
adjacent to Interstate 30. Web research confirms the historic Dannon Fort Worth
plant: founded 1925, 10.9-acre site, ~210 employees, producing Danimals, Activia
and YoCrunch. Street View confirms a "Shipping & Receiving" sign at the truck gate.
Coordinates confirmed correct.

## Key views
- **z17-z18 wide:** A sprawling, dense historic plant — many connected building
  sections with extensive process equipment and tanks. Bordered by I-30 and
  railroad tracks on the north, city streets on the other sides.
- **z19 north:** Mainline railroad tracks run parallel to the plant's north edge
  beneath the I-30 overpass. No spur turns into the property.
- **z19-z20 west:** A fenced trailer/equipment yard with parked rental reefers
  (XTRA Lease and others) and equipment laydown.
- **z19 south:** Employee parking lots full of cars.
- **Street View (Jan 2025), west street:** The truck entrance has a "Shipping &
  Receiving" directional sign and a sliding chain-link gate across the driveway.
  A yellow forklift and parked vehicles visible inside the fence. No guard booth.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A sliding chain-link gate spans the truck driveway off the
  west street, with a "Shipping & Receiving" sign at the entrance — a clear
  controlled truck gate.
- **guardShack: false** — No staffed booth; no small windowed structure beside the
  gate. The directional sign routes drivers; check-in is at the building.
- **remoteGs: true** — A controlled gate exists with no guard shack, implying
  call-box / intercom / app check-in.
- **dockDoors: 10-25** — Dense historic plant; dock doors spread across building
  faces, partly obscured by parked trailers and process structures. Estimate ~18.
- **dropArea: 10-25** — The fenced west-side trailer yard holds a band of parked
  trailers without tractors.

## Yard zones and counts
- **Perimeter:** ~10.9 acres, bounded by I-30/rail (north) and city streets.
- **Truck gate:** 1 — sliding chain-link gate off the west street.
- **Drop yard:** Fenced trailer/equipment yard on the west side (~14 trailers
  visible, capacity ~20).
- **Dock apron:** Along the building's NE faces.
- **Rail:** Tracks run parallel to the plant but no spur enters — not rail-served.
- **Setting:** Urban — dense Near Southside fabric adjacent to I-30.
- **backupSensitive:** True — the gate opens onto a narrow city street with little
  stacking room; a truck queue would spill onto the public street.

## Web findings
KERA News / Fort Worth Report (Jan 2026): the plant is undergoing a $4M, ~3,495
sq ft expansion to add production equipment. Established 1925, 10.9 acres, ~210
employees. Danimals, Activia, YoCrunch brands. No published gate/dock operational
detail beyond the on-site "Shipping & Receiving" signage.

## Final confidence
High. Facility positively identified; the controlled chain-link truck gate and
"Shipping & Receiving" signage are clearly visible in recent (Jan 2025) Street
View. Dock-door and trailer-capacity counts are moderate confidence (dense
historic layout with occlusion) and listed in uncertainFields.
