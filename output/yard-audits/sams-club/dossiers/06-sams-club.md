# Deep Audit — Sam's Club Distribution Center, Oklahoma City OK (idx 06)

**Facility:** Sam's Club Distribution Center Oklahoma City OK
**Type:** Distribution Center
**Address:** 2400 S Council Rd, Oklahoma City, OK 73128
**Resolved center:** 35.439775, -97.651625
**Maps (satellite):** https://www.google.com/maps/@35.439775,-97.651625,400m/data=!3m1!1e3
**Method:** deep-audit (probe.ts satellite + Street View, web research)
**Confidence:** high

---

## Step 0 — Facility confirmation

The supplied ROOFTOP coordinates (35.440812, -97.650807) landed directly on a
large white-roof distribution building on the east side of S Council Rd. Web
research confirmed this is Oklahoma's first Sam's Club distribution center
(~300,000 sq ft dry-goods DC, ~130 employees, ~$40M investment, ribbon-cut
Jan 2024). Positive ID came from 2025-05 Street View at the north entrance off
S Council Rd, which clearly shows a **"Sam's Club Distribution Center" monument
sign with the Sam's Club logo** at the main entrance drive. This is the correct
building, not an office or unrelated property.

The given coordinates were accurate; I set the audit center to the geometric
centroid of the fenced property (35.439775, -97.651625).

---

## Site layout (what the imagery showed)

The property is a **two-building DC campus** on the east side of S Council Rd,
oriented nearly north-south with a slight clockwise tilt (north ends sit a few
degrees west of south ends):

- **North building** — long white-roof DC with a continuous dock bank on its
  **east** face; trailers backed in along the apron.
- **South building** — second large white-roof DC; 2025-05 Street View shows a
  bank of west-facing dock doors fronting S Council Rd with a row of **Werner**
  carrier trailers backed in behind a perimeter fence.
- The two buildings are separated by **employee parking lots** in the middle.
- **Drop yard** — a large dedicated trailer-storage lot east of the buildings
  with multiple long rows of parked trailers.
- **Tank farm / ancillary structures** in the southeast corner.
- A separate, much larger tan-roof building sits further **east** — a different,
  neighboring facility (NOT part of this site), excluded from the geofence.

Overall fenced property: ~501 m N–S × ~322 m E–W ≈ **39.6 acres**.

### Key views
- **z16/z17 satellite (2026 Airbus, finished build):** full campus, dock face on
  the east, drop-yard rows, two distinct buildings with parking between them.
- **z18 north/south halves:** dock apron + drop-yard rows; employee parking and
  perimeter drives on the west.
- **2025-05 Street View sweep along S Council Rd (the recent, post-completion
  pano set):** the authoritative ground truth — monument sign, office-tower
  facades, west-facing Werner docks, and the **black metal perimeter fence**
  enclosing the truck/dock yard.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** The truck/dock yard is fully enclosed by a black metal
  perimeter fence along the S Council Rd frontage and around the dock yard
  (unmistakable in multiple 2025-05 Street View frames). Trucks pass through a
  controlled fence opening off the main entrance drive. There is no barrier arm
  across the public-road throat itself, but the secured fence line with vehicle
  gates is the access control — classified as a truck gate.
- **guardShack = false.** No staffed guard booth is visible at the entrance in
  either 2025-05 Street View or 2026 satellite. The main entry is an open paved
  approach with the Sam's Club monument sign; the office tower is the building
  front, not a roadside booth. (Listed in uncertainFields — medium confidence.)
- **remoteGs = true.** Gated/fenced truck yard with no visible guard shack
  implies kiosk / app / badge check-in.
- **dockDoors = "50+".** Two cross-dock buildings each carry a long continuous
  bank of dock doors (north building east face; south building west and east
  faces). Estimated ~80–100 doors total across the complex.
- **dropArea = "50+".** Dedicated drop yard east of the buildings holds multiple
  long rows of trailers; capacity 100+.
- **scale = false.** No truck scale / weigh pad in the truck path.
- **multiStep = false.** No second checkpoint stage visible after the entrance.

---

## Yard zones traced (oriented polygons)

- **perimeter** — the whole fenced property (both buildings + drop yard),
  4-corner ring at the property's true orientation; ≈ 39.6 acres.
- **truckGate** — the north entrance throat off S Council Rd (the gated fence
  opening / entry drive).
- **dropYards** — one ring over the trailer-storage lot east of the buildings.
- **dockAprons** — one long thin ring hugging the east dock face at the
  building's angle.
- **staging** — null (no distinct dedicated pre/post-gate staging stall block
  visible; interior truck court provides holding room → postGateStaging true).

### streetViewMeta
- **truckGate:** pano `G-gXkTnPw1FlcHSrE7IWZQ` (2025-05), heading 98° E — the
  frame showing the Sam's Club monument sign at the main entrance (the arrival
  view a driver actually sees).
- **perimeter:** pano `4U4fpAp5XvQwPpOY0a2bEg` (2025-05), heading 96° E —
  mid-frontage view of the fenced dock yard with Werner trailers.
- Note: interior centroids return no Street View coverage; road-level 2025 panos
  along S Council Rd are used.

---

## Yard metrics

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | ~90 | two long dock banks across north + south buildings |
| trailersVisible | ~110 | dock apron + drop-yard rows, 2026 satellite |
| trailerParkingCapacity | ~140 | drop-yard row capacity estimate |
| truckGateCount | 1 | single primary gated entrance off S Council Rd |
| buildingCount | 2 | north + south DC buildings (campus) |
| siteAreaAcres | 39.6 | from perimeter polygon |
| railServed | false | no rail spur on property |

---

## Web findings

- Walmart corporate (Aug 2023) + OK Business Voice ribbon-cutting (Jan 2024):
  Oklahoma's first Sam's Club distribution center, ~300,000 sq ft, ~130
  employees, ~$40M capital investment, dry-goods supply to Oklahoma Sam's Clubs.
- SupplierWiki receiving listings reference DC 4714/4965.
- Sources: corporate.walmart.com, okbusinessvoice.com, ttnews.com,
  okcommerce.gov, velocityokc.com.

---

## Confidence

**High** overall. Imagery is clear and recent (2026 satellite + 2025-05 Street
View), and the facility is positively identified by on-site signage. Lower-
confidence calls (flagged in `uncertainFields`): exact guardShack/remoteGs
(no booth seen but cannot fully rule out kiosk vs. unattended), entry/exit lane
counts, postGateStaging, and ship/receive separation — these are reasonable
inferences from overhead + roadside imagery rather than certainties.
