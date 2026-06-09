# Deep-Audit Dossier — Target Regional Distribution Center Wilton (T0579)

- **Facility:** Target Regional Distribution Center Wilton (T0579), RDC
- **Address:** 129 North Rd, Wilton, NY 12831
- **Geocoded coords (given):** 43.177592, -73.716211
- **Resolved center:** 43.17760, -73.71680 (building centroid)
- **Confidence:** HIGH
- **Method:** deep-audit (satellite zoom 15-21 + Street-View + web)

## 1. Location confirmation
Web search confirmed the facility unambiguously: 129 North Rd, Wilton NY 12831 is
the **Target Distribution Center**, and the T0579 code matches Target's own job
postings for this site (Warehouse Associate, Operations Manager, and **Target
Security Specialist — Regional Distribution Center, Wilton NY** all list 129
North Rd). The given coordinates land squarely on the building, so they were
correct — only nudged ~30 m west to the building centroid. The satellite imagery
shows a single very large distribution building (>1,000 ft long) with a partial
solar-panel roof, an extensive west-facing dock line, and multiple trailer yards
— fully consistent with a Target RDC, not a neighboring property.

## 2. Site layout (what the key views showed)
- **wide-z15 / wide-z16 / context-z15:** One dominant RDC building oriented
  NW–SE (long axis), partial solar roof on the south/east half. Dock face and
  long trailer rows run the full SW/west side. Trailer drop yards sit south and
  southeast of the building. Bounded by North Rd to the south and the I-87
  (Northway) wooded corridor to the east; woods/farmland west and north.
- **nw-corner-z18:** NW end of the building — continuous angled dock bays with
  trailers backed in along the SW face; employee parking lot at the far north.
- **west-dock-z19 / gate-cross-z20:** The truck driveway leaves the SW dock yard
  and crosses a continuous **east-west perimeter fence** at a single defined
  pinch-point. Fence rails are visible running across the grass strips on both
  sides of the drive — a clear controlled truck gate.
- **se-yard-z19 / main-entrance-z19 / entrance-z17:** Large, dense **trailer
  storage drop yard** to the southeast holding several hundred parked trailers
  (no tractors), plus angled employee-car parking and a small maintenance/fleet
  building.

## 3. Gate / guard-shack / remote determination (rigorous)
- **truckGate = TRUE.** gate-cross-z20.png shows the SW dock-yard truck driveway
  funneling down through a single opening in a continuous east-west perimeter
  fence (fence lines clearly cross the grass strips left and right of the drive).
  This is a controlled pinch-point truck gate, not an open driveway. Centroid
  ~43.1749, -73.7174.
- **guardShack = TRUE (medium-confidence on imagery, corroborated by hiring).**
  A small light-colored booth-sized structure sits immediately beside the truck
  lane at the gate crossing (booth-z21.png). Its footprint is small and partly
  shadowed so the satellite call alone is borderline, but it is corroborated by
  Target's published **on-site Target Security Specialist (TSS)** staffing for
  this exact RDC — Target RDCs run staffed security at the truck gate. Listed in
  uncertainFields.
- **remoteGs = FALSE.** A staffed guard booth is present, so this is not a
  kiosk/call-box remote check-in.
- **multiStep = FALSE.** No second checkpoint (scale house / second booth) was
  visible after the gate.

## 4. Docks, drop yards, counts
- **dockDoors = 50+.** Two long banks of angled dock bays with trailers backed in
  run the entire SW/west building face (wide-z16, nw-corner-z18). Estimate ~120
  doors.
- **dropArea / dropYard = 50+ / TRUE.** Two dedicated trailer-storage lots: one
  directly south of the building and a dense SE storage yard (se-yard-z19)
  holding several hundred trailers without tractors. Approx. 350 trailers
  visible; lot capacity ~500.
- **fastLaneOpportunity = TRUE.** Wide paved gate apron and yard width allow an
  express/bypass lane.
- **drivewayLong / postGateStaging = TRUE.** Long internal approach from the gate
  to the dock doors with room to stack 3+ trucks; paved holding area inside the
  fence before the docks.
- **railServed = FALSE.** No rail spur enters the property.
- **siteAreaAcres ≈ 95** from the perimeter polygon (building + west dock yards +
  south/SE drop yards + employee parking).
- **buildingCount = 2** (main RDC + small maintenance/fleet building);
  multipleFacilities = FALSE (single operation).

## 5. Street View
No usable Street View at the gate or perimeter. The Street View metadata returned
`ZERO_RESULTS` at both the truck-gate and perimeter centroids; the only nearby
panos are old peripheral rural-road captures (2007-10 on North Rd, 2022-08 on an
adjacent road) that show only distant building rooflines through fields/trees —
they do not reach the private truck entrance. `streetViewMeta.hasCoverage` is
`false` for both zones.

## 6. Web findings
- Saratoga.com / Saratoga County Chamber list the Target Distribution Center at
  129 North Rd, Wilton.
- Target corporate/Workday job postings tie T0579 to 129 North Rd and advertise
  **Target Security Specialist – Regional Distribution Center, Wilton NY**,
  confirming on-site guarded security.

## 7. Setting
Rural — edge of Wilton near Saratoga Springs, surrounded by woods, farmland and
the I-87 Northway corridor. urbanRural = Rural. connectivityIssue = FALSE (a town
and the interstate are immediately adjacent, so cellular coverage is fine).

## Final verdict
- **Truck gate:** YES — single controlled pinch-point gate through a perimeter
  fence where the SW dock-yard drive meets the internal road.
- **Guard shack:** YES — booth-sized structure beside the gate lane, corroborated
  by Target's on-site TSS staffing (medium-confidence on imagery alone).
- **Confidence:** HIGH overall (guardShack the only borderline visual call).
