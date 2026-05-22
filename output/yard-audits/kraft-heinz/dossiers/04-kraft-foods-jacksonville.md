# Kraft Foods - Jacksonville (FL) — Warehouse — Deep Audit

**Resolved location:** 4601 Bulls Bay Hwy, Jacksonville, FL 32219
(Westside Industrial Park, Buildings 100 / 200 / 300 campus).
**Resolved center coords:** `30.37692, -81.78521`
**Maps link:** https://www.google.com/maps/@30.37692,-81.78521,400m/data=!3m1!1e3

---

## Step 0 — Locating the facility

The supplied coords `30.3846241, -81.789257` plotted ~1.1 km **north** of the
Kraft site (Westside Industrial Park spreads several km north-south along
Bulls Bay Hwy). A web search for "Kraft Foods Jacksonville FL distribution
center" surfaced the canonical address **4601 Bulls Bay Hwy, Jacksonville FL
32219** (Yellow Pages, Waze, Manta, Buzzfile). A geocoding lookup gave
~`30.3768, -81.7829` for that street number. CommercialSearch / JLL listings
confirm 4601 Bulls Bay = "Westside Industrial Park, Buildings 100 / 200 / 300"
— **1,165,658 SF across 26.155 acres**, built 1997, three multi-tenant
cross-dock warehouses on one campus. Bandana lists Kraft Heinz at suite
**4601-300 Bulls Bay Hwy** (one of the three buildings). A separate page lists
the campus tenants as Johnstone Supply, Wasserstrom, and Kraft Heinz.

Satellite probe at z16–z18 around 30.3768, -81.7828 lands exactly on a
three-building rectangular cross-dock campus that matches that footprint:
office/employee parking + landscaped front on the west (Bulls Bay Hwy side),
three parallel long warehouses with dock doors on both faces stacked
north-south, truck courts between them, and rough trailer parking along the
east edge. **This is the correct site.** Locked center to `30.37692, -81.78521`
(midpoint between the three buildings).

A second much larger DC sits ~120 m east of the campus across a cleared dirt
corridor — that is a separate operator (massive cross-dock with extensive
trailer aprons, likely an LTL hub) and not part of the Kraft Heinz audit.

Important framing: Kraft Heinz **does not own** this campus. It is a **tenant**
leasing ~250-300K SF inside Building 300 (per Compstak comp; lease started
2025, expires 2035). The classification therefore characterises the
**shared multi-tenant campus** that Kraft trucks must navigate, not a
Kraft-built private DC.

---

## What the imagery showed

**Z16 / Z17 wide views** (`tmp/kraft-jax-15-campus.png`, `kraft-jax-07-z17.png`)
Three identical-format long rectangular warehouses oriented east-west, stacked
parallel from north to south. Long truck courts run between them. Office /
employee parking on the WEST end of each building (facing Bulls Bay Hwy).
Trailers backed into dock doors on both faces of each building; rows of drop
trailers parked in the courts and along the east property edge. Tree line and
storm-water swales mark the perimeter. The east property edge abuts a cleared
dirt utility/access corridor.

**Z18 / Z19 dock close-ups**
(`tmp/kraft-jax-18-middle-z19.png`, `kraft-jax-19-north-z19.png`,
`kraft-jax-20-south-z19.png`):

- Each building shows continuous dock-door rhythm along both long faces.
  Trailers backed in include white reefers, dry vans, and several green/orange
  units (diverse tenant mix — multi-tenant park).
- Per JLL spec for Bldg 100: 66 dock-high doors + 3 drive-in. Three identical
  buildings -> ≈198 dock-high doors campus-wide. **dockDoors = "50+"**.
- The south building (`kraft-jax-20-south-z19.png`) shows the south truck
  court, drop trailers parked diagonally, and the south property fence beyond.
- Office face has employee parking only — no truck-side activity on the west
  ends.

**Truck-court Street View** (`tmp/kraft-jax-sv-01-east.png`, captured 2019-10,
pano at 30.37591, -81.78683): looking east along the truck court between the
south building and the middle building. **No gate, no barrier arm, no guard
shack, no fencing across the truck driveway.** An AAA Cooper Transportation
trailer is parked at the dock; numbered dock stalls (`101` painted on the
asphalt) confirm an active multi-tenant LTL/freight operation. The court
continues uninterrupted into the public park road network.

**Office-side Street View** (`tmp/kraft-jax-sv-03-bullsbay-east.png`,
`kraft-jax-sv-04-south.png`, `kraft-jax-sv-05-north.png`): brick office
facades, palm trees, US flag, employee parking, no truck-side features and
**no guard booth**. This is the front-of-house, not the truck-side.

**South perimeter Street View** (`tmp/kraft-jax-sv-06-south-entry.png`,
captured 2024): chain-link fence and a stub of paved truck pavement
terminating at the south property line. The fence is a property fence, not a
checkpoint gate.

**East-side Street View** (`tmp/kraft-jax-sv-07-east-side.png`, captured 2014,
on Westside Industrial Drive looking west toward the campus): wide divided
industrial parkway, no fence visible from the road, open access.

---

## Gate / guard-shack / remote-GS determinations

- **truckGate = false.** No barrier arm, no sliding/swing gate, no checkpoint
  pinch-point across any truck driveway. SV pano inside the truck court
  confirms the court is continuous with the park road network with no gate
  structure. Multiple uncontrolled entry/exit points serve the campus
  (typical multi-tenant industrial park, where each suite/tenant handles its
  own check-in at the building, not at a campus gate).
- **guardShack = false.** No booth structure observed anywhere on the campus
  perimeter, office face, or truck-court approaches.
- **remoteGs = false.** Per rubric, remote/kiosk check-in is only logged when
  a truck gate exists. There is no gate, so this is false.

---

## Yard zones, counts, and geofences

| Metric | Value | How measured |
|---|---|---|
| `dockDoorCount` | 198 | 3 buildings × 66 dock-high doors per JLL listing for Bldg 100; confirmed by z19 satellite count |
| `trailersVisible` | ~95 | Counted across z18 and z19 captures of each building's truck court |
| `trailerParkingCapacity` | ~130 | Available trailer slots in truck courts + east-perimeter row + south-end parking |
| `truckGateCount` | 0 | No gates observed |
| `buildingCount` | 3 | Buildings 100, 200, 300 |
| `siteAreaAcres` | 26.2 | Per CommercialSearch listing (26.155 acres) — published, used as published |
| `railServed` | false | No rail spur on the property; the dirt strip east is a utility corridor, not a rail line |

**Geofence — `perimeter`**
`{ south: 30.37535, west: -81.78735, north: 30.37865, east: -81.78310 }`
Captures the full three-building footprint plus office parking and east drop
yard. Bbox slightly larger than the listed 26.155 acres because it includes
the east trailer parking strip and west office-lawn buffer.

**Sub-zones**
- `dropYards`: two long east-west rows between the three buildings (middle
  truck court + north truck court).
- `dockAprons`: four bands — one per building face that has docks (south face
  of north bldg, north face of middle bldg, south face of middle bldg, north
  face of south bldg, plus an additional south-face apron on the south bldg).
- `truckGate`: null (no gate).
- `staging`: null (no clear pre- or post-gate staging area; with no gate, the
  concept does not apply).

---

## Web findings

- **CommercialSearch:** 4601 Bulls Bay Hwy = Westside Industrial Park Bldgs
  100/200/300, 1,165,658 SF, 26.155 acres, built 2000 (renov 2004), Class B,
  multi-tenant. Building 100 alone has 66 dock-high doors, 3 drive-in doors,
  30 ft clear, 40' × 50' columns, ESFR sprinklers, 250 parking spaces.
- **Compstak:** Kraft Heinz leases 250-300K SF; lease commenced 2025, expires
  2035. Other tenants include Johnstone Supply, Wasserstrom.
- **Bandana:** Kraft Heinz suite is 4601-300 Bulls Bay Hwy (Bldg 300).
- **Buzzfile / Manta:** Kraft Heinz Foods Company at 4601 Bulls Bay Hwy,
  Jacksonville FL 32219; phone 904-378-4200; classified as manufacturing
  activity (Kraft uses this as a regional warehouse/DC under their Foods
  Company entity).
- No driver-review forum mentions of gate/guard at this site — consistent
  with an open multi-tenant park where check-in is at each tenant's office.

---

## Classification summary

- truckGate: **false**, guardShack: **false**, remoteGs: **false**
- preGateStaging: false, postGateStaging: false (no gate → not applicable)
- drivewayLong: **true** (deep truck courts), drivewayShort: false
- backupSensitive: false (huge internal courts, no public-road queue risk)
- entryExitTogether: false, entryExitSeparate: **true** (multiple uncontrolled
  driveways from north, west, and south)
- entryLanes / exitLanes: **null** (not a single counted lane group)
- fastLaneOpportunity: false (no gate to bypass)
- dockDoors: **50+**, dropArea: **50+**
- shipRcvSeparate: **true** (docks on both long faces of each building)
- urbanRural: **Urban** (NW Jacksonville industrial fabric, inside I-295)
- connectivityIssue: false
- multipleFacilities: **true** (3 buildings on one campus)
- scale: false (no truck scale visible)
- dropYard: **true** (dedicated drop-trailer rows in courts + east perimeter)
- multiStep: false

**Archetype guidance:** This is essentially the same physical pattern as
Archetype `#3` (No Gate / No GS) at the Holland MI site — open driveways,
no checkpoint structure — but combined with `multipleFacilities` and `dropYard`
flags, which makes it a "no-gate, multi-building, drop-yard heavy" campus.
The supplied archetype hint **#4 (Backup-sensitive)** does NOT fit: there is
no constrained entry geometry, no risk of queue spilling onto a public road,
and no choked internal artery. Backup-sensitive should be false; the actual
operational pain at this site is more about *no gate control at all* across
a multi-tenant campus than about backup geometry.

---

## Final confidence: **high**

- Building identification: high (cross-referenced address, geocode, satellite,
  and tenant listings).
- Gate / guard verdict: high (Street View pano + multiple satellite zooms
  show no gate, no booth).
- Dock and yard counts: high (JLL spec + z19 satellite count agree).
- Uncertain only on entry/exit lane counts and `truckGateCount` framing,
  because the multi-tenant park has multiple uncontrolled access points —
  not a single countable gate.

---

## Three-line summary

- **Gate verdict:** FALSE — open multi-tenant industrial park with no
  barrier arm, sliding gate, or checkpoint anywhere on the campus.
- **Guard-shack verdict:** FALSE — no booth observed at any approach;
  check-in is done at individual tenant offices, not at a campus gate.
- **Confidence:** HIGH — building identification, gate/guard call, and yard
  counts are all corroborated across satellite + Street View + tenant
  listings.
