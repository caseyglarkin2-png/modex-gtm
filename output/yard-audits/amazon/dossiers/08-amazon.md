# Deep-Audit Dossier — Amazon PHX6 Fulfillment Center, Phoenix AZ

- **Roster idx:** 8
- **Type:** Fulfillment Center (~1.2M sq ft)
- **Address (roster):** 4750 W Mohave St, Phoenix, AZ 85043
- **Resolved center:** 33.43215, -112.16655
- **Maps:** https://www.google.com/maps/@33.43215,-112.16655,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Facility confirmation
Supplied coordinates (33.434708, -112.167239) geocoded as GEOMETRIC_CENTER and
landed on the street grid near 47th Ave / W Mohave St in southwest Phoenix's
dense industrial belt by I-10. Wide z15/z16 satellite showed several large
boxes. Web research (warehouserating, FLEX Fulfillment, Waze, Tripadvisor tour
listing) confirms PHX6 is a ~1.2M sq ft fulfillment center at 4750/5050 W
Mohave St (a sibling sort facility TFC1 shares the 5050 address). The colossal
single building immediately south of the supplied point — single ~370 m long
box, dock bank with trailers along its south face, employee parking to the
north off Mohave St — matches the PHX6 description. Dec-2025 Street View of the
west truck gate shows the building number placard and Amazon equipment-entrance
signage, positively identifying it. Locked center 33.43215, -112.16655.

## Steps 1-5 — Audit findings

### Building / layout
One very large (~1.2M sq ft) FC building, long axis east-west. Dock bank runs
the entire ~370 m **south** face. Employee/visitor parking is a large lot
**north** of the building off W Mohave St (cars only, no truck activity). The
warehouses across the public roads to the north and south are separate
parcels/tenants and were excluded. siteAreaAcres ~93.7 (developed footprint).

### Truck entrance & gate (rigorous)
- TRUCK GATE: **TRUE.** The truck/equipment entrance is on the **west** drive
  (47th Ave side). Dec-2025 Street View (pano `QYC0WAXQoSn6fA1-CtfvnA`,
  @33.43113,-112.16838) shows a long white **cantilever/sliding gate** across
  the truck lane, set into a **masonry perimeter screen wall**, with red
  "NO TRESPASSING / EQUIPMENT ENTRANCE" signage and an Amazon site placard.
  Clearly controlled access.
- GUARD SHACK: **FALSE.** No staffed booth at the gate in any heading
  (N 350°, NE 30°, ENE 60°, E 90°). The structure beside the gate is the
  building's glass lobby/office vestibule (palm-landscaped main entrance), not a
  1-3-space guard booth.
- REMOTE GS: **TRUE.** Gate present, no booth → remote check-in (sliding gate +
  signage; Amazon runs appointments via Carrier Central). Flagged uncertain.
- Single truck gate (truckGateCount 1); entry and exit share the lane group
  (entryExitTogether). entryLanes/exitLanes estimated 1/1, flagged.

### Staging & approach
- Pre-gate staging: false — the gate sits on the apron off the public drive
  with no dedicated outside-the-gate truck stalls.
- Post-gate staging: **true** — a deep, wide paved truck court inside the gate
  between the dock face and the south fence, holding a full drop-trailer row
  plus circulation.
- drivewayLong: **true** — the court is long and deep (>300 m of apron); a 3+
  truck queue fits inside the gate. backupSensitive: false.
- fastLaneOpportunity: **true** — wide gate apron and multiple drive lanes at
  the SW entry leave clear room for an express/bypass lane.

### Docks & yard
- Dock doors: **50+.** Continuous dock bank across the full south face with
  dozens of trailers backed in (z19-z20). Estimated ~120 doors, flagged.
- Drop area: **50+** / dropYard **true.** A second full-length row of drop
  trailers is parked nose-out in the truck court alongside the docked row.
  trailersVisible ~130. No separate multi-acre trailer lot on-parcel, so
  trailerParkingCapacity estimated ~200 (flagged).
- shipRcvSeparate: false (one continuous south dock bank). scale: false.
  multiStep: false. multipleFacilities: false. railServed: false.

### Setting
- urbanRural: **Urban** — dense SW-Phoenix metro industrial fabric adjacent to
  I-10. connectivityIssue: false (urban, strong coverage).

## Geofences traced
- **perimeter** — 4-corner ring around the developed property (north parking
  edge ~33.4351 to south truck-court fence ~33.4307; west 47th Ave -112.16885
  to east end -112.16048). ~93.7 ac.
- **truckGate** — quad over the SW equipment gate / apron.
- **dockApron** — long thin quad hugging the south dock wall.
- **dropYard** — long quad over the drop-trailer court row south of the apron.
- **staging** — small quad inside the gate (post-gate queue throat).
- streetViewMeta: both perimeter (heading 60°) and truckGate (heading 41°) use
  the confirmed gate pano `QYC0WAXQoSn6fA1-CtfvnA` (hasCoverage true).

## Web findings
- PHX6 ~1.2-1.25M sq ft, ~28 football fields, ~8 mi of conveyance; SW Phoenix
  with quick I-10 access (warehouserating, FLEX Fulfillment, Tripadvisor tour).
- Carrier appointments via Amazon Carrier Central (consistent with remote,
  unmanned gate check-in).
- Sibling sort facility TFC1 shares the 5050 W Mohave address nearby.

## Confidence
**High.** Building positively identified; gate and guard-shack calls confirmed
on clear Dec-2025 Street View. Dock/trailer counts are honest overhead
estimates (banded 50+) and are flagged in uncertainFields.
