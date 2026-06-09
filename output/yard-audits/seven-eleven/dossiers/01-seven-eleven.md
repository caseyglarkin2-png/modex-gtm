# Deep-Audit Dossier — 7-Eleven Combined Distribution Center, Bohemia NY

**Facility:** 7-Eleven Combined Distribution Center (Fresh Food Commissary + CDC)
**Address:** 545 Johnson Ave, Bohemia, NY 11716
**Resolved center:** 40.77695, -73.09140
**Method:** deep-audit (satellite z17-z20 + Street View, June 2024 panos)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied city-level coordinates (40.777146, -73.093362) were accurate. Google
geocoding returns a **ROOFTOP** match for "545 Johnson Ave, Bohemia, NY 11716" at
40.7771459, -73.093362 — the SW frontage of the parcel, where Johnson Ave meets
McCormick Dr.

A labeled hybrid satellite probe places the business labels **"Constance Food
Group"** and **"Gold Glass-ALP"** directly on a single long industrial building
running roughly east-west between McCormick Dr (north) and a wooded/residential
strip (south/east). Constance Food Group is the current operator of this site
(formerly Norris Food Services), which web research confirms is the 7-Eleven
commissary / Combined Distribution Center: a 130,000 sq ft mixed-use facility
(72,000 sq ft kitchen) that prepares fresh foods and distributes to ~674 7-Eleven
stores across NY/NJ/PA. Building footprint, multi-face dock banks, employee
parking and trailer yards are all consistent with a commissary + DC. Locked center
40.77695, -73.09140.

It is a **multi-tenant** building (Constance Food Group / 7-Eleven CDC plus Gold
Glass-ALP and other small tenants), which is normal for Long Island flex/industrial.

---

## Key views

- **Wide satellite (z17):** suburban Long Island industrial park, many large flex
  buildings. The audited building is the long structure on the SE side with a full
  dock bank and trailer yard on its south face.
- **North face / McCormick Dr (Street View, pano UaTlER7…):** office frontage,
  open landscaped employee/visitor parking. **No fence, no gate, no booth.**
- **South face (z19-z20):** the primary dock bank — a long run of dock doors with
  trailers backed in (several red trailers visible), plus angled trailer-storage
  rows in the yard and painted no-park striping.
- **East face (z19):** a SECOND dock bank — trailers backed into the east wall
  facing an east-side trailer yard. Tree line forms the east property boundary.
- **West end (z20):** no docks; grass strip + car parking. The west driveway
  descends from McCormick to the south yard (open, uncontrolled).
- **South service road (Street View):** open shared road serving the dock yard and
  the neighboring Packaging Dynamics building; no checkpoint.

---

## Gate / guard-shack / dock determinations

- **truckGate = false.** No barrier arm, no sliding/swing gate, no checkpoint
  pinch-point anywhere on the perimeter. Trucks turn off McCormick Dr onto open
  private pavement and wrap around the building to the south/east dock yards with
  zero access control. Verified from McCormick frontage panos and the south
  service-road pano.
- **guardShack = false.** No staffed booth (1-3-space footprint, multi-window)
  beside any truck lane. The north frontage is open office parking.
- **remoteGs = false.** No gate at all, so no kiosk/call-box/app check-in implied.
- **dockDoors = "25-50".** ~26 doors on the south face + ~12 on the east face ≈ 38.
- **dropArea / dropYard.** Angled trailer-storage rows in the south yard (~12
  dropped trailers) plus an east trailer yard (~12 backed-in trailers); marked
  stalls present → "25-50", dropYard = true.
- **shipRcvSeparate = true.** Two physically distinct dock clusters on different
  building faces (south + east), consistent with separate commissary-inbound vs
  DC-outbound flows.
- **drivewayLong = true.** Deep open paved yard between the dock faces and the
  south tree line holds a 3+ truck queue.
- **entryExitTogether = true.** Same open driveways off McCormick serve both
  directions; no separate in/out gates.
- **urbanRural = "Urban".** Dense Islip/Bohemia metro industrial fabric; strong
  cellular coverage → connectivityIssue = false.

---

## Yard zones & counts (oriented polygons)

All rings traced to the building's true E-W orientation (slight tilt), not a
north box.

- **perimeter** — full parcel: north employee parking (McCormick frontage) + the
  building + south dock/drop yard + east trailer yard. ~19.4 acres.
- **truckGate** — west driveway apron where the dock-yard drive meets McCormick
  (no physical gate hardware; this is the truck arrival point).
- **dropYards** — (1) south angled trailer rows, (2) east-face trailer yard.
- **dockAprons** — (1) long south apron hugging the south dock wall, (2) short
  east apron hugging the east dock wall.
- **staging** — null (no distinct pre/post-gate staging pad; open yard serves the
  function).

**yardMetrics:** dockDoorCount ≈ 38 · trailersVisible ≈ 42 · trailerParkingCapacity
≈ 55 · truckGateCount 1 (uncontrolled) · buildingCount 1 · siteAreaAcres 19.4 ·
railServed false.

**Street View meta:** perimeter + truckGate both reference McCormick frontage pano
`UaTlER7gaFDlMeQwClMvhQ` (June 2024) — the frame a driver sees on arrival;
hasCoverage true for both. Street View does not penetrate the private dock yard
itself.

---

## Web findings

- Facility opened Jan 28, 2009 as 7-Eleven's "green" Long Island commissary +
  Combined Distribution Center; ~130,000 sq ft, ~72,000 sq ft kitchen, ~250
  employees, serving ~674 7-Eleven stores in NY/NJ/PA.
- Operated by Constance Food Group (formerly Norris Food Services).

Sources: globenewswire (2009 opening release), cspdailynews, csnews,
trellis.net.

---

## Confidence

**High.** Location unambiguous (ROOFTOP geocode + on-building business label +
corroborating web research). Imagery is clear at z19-z20. Gate/guard-shack
determinations are firm from multiple Street View headings and the open site
geometry. Low-confidence items (listed in `uncertainFields`): exact entry/exit
lane counts (no gate to count lanes) and trailer-parking capacity (estimated from
yard footprint).
