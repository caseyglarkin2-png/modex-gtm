# Yard Audit — Costco Depot #288/289, Dallas TX

**Address:** 3730 Mountain Creek Pkwy, Dallas, TX 75236
**Type:** Refrigerated Depot (Texas regional wet/cold cross-dock; 2025 permit added 16 cold-dock doors)
**Resolved center:** 32.69300, -96.96080
**Maps (satellite):** https://www.google.com/maps/@32.69300,-96.96080,400m/data=!3m1!1e3
**Method:** deep-audit (satellite z15-z21 + Street View, Jan 2025 panos)
**Confidence:** high

---

## Location confirmation

Roster coords (32.692336, -96.960506) landed inside the south yard of a large
industrial park in the Mountain Creek district of southwest Dallas. Web search
confirmed "Costco Distribution Depot, 3730 Mountain Creek Pkwy, Dallas TX 75236"
(phone 972-587-1801, hours Mon-Sat 5:30 AM - 2:00 PM). Satellite (z15-z17)
positively identified the target as the long building running roughly NNW-SSE on
the west side of the park, wrapped by trailer drop yards on both long faces. The
big white spec warehouses to the east and north are separate properties.
Recentered the audit on the building/yard center at 32.69300, -96.96080.

Ground truth: Street View on the south frontage road (Jan 2025) shows tractors
coupled to **refrigerated (reefer) trailers** staged at the entrance, confirming
the cold/wet depot operation.

## What the key views showed

- **z15/z16 wide** — Long cross-dock building, dark/grey roof, drop yards on the
  east and west faces, perimeter road on the west, grass buffer to the east,
  public frontage road to the south. Roughly 94-acre footprint.
- **z17/z19 north** — Main building with loading doors on BOTH long faces;
  trailers backed in along the east and west walls. The north end carries a
  distinct dark-roof section consistent with the 2025 cold-dock addition.
- **z18/z20 south** — Central entrance drive runs north off the frontage road
  between the two drop yards, past a detached gate/fuel-island/maintenance
  structure, into the building. Painted, bollard-lined lanes.
- **z20/z21 entrance throat** — Painted lane control reading **"COSTCO FLEET
  ONLY"**, **"STOP"**, **"DO NOT BLOCK"**, **"FIRE LANE"** with lane dividers and
  a divided in/out island at the road. Dedicated fleet vs. visitor/vendor lanes.
- **z20/z21 drop yards** — Organized angled trailer stalls with painted stall
  numbers, packed with trailers (many orange-front reefers). East and west yards.
- **Street View (driveway pano XDAJlOfWbSndrv06dPPq2Q, Jan 2025)** — Wide
  entrance apron, Mountain Creek monument sign, reefer trucks staged at the curb,
  building dock faces visible beyond.

## Gate / guard-shack / dock determinations

- **Truck gate: YES.** The central entrance is a managed checkpoint — painted
  multi-lane stop control with dedicated "COSTCO FLEET ONLY" lane separated from
  a visitor/vendor lane, bollard-lined, with a divided in/out throat at the road.
  Entry and exit share the one entrance point (entryExitTogether).
- **Guard shack: NOT CONFIRMED (flagged uncertain).** No discrete staffed booth
  positively resolved in satellite or Street View; the access control sits set
  back inside the property and the wide road throat is open. Costco depots are
  universally access-controlled, so a kiosk/booth almost certainly exists, but it
  could not be imaged. Classified guardShack=false / remoteGs=true and flagged
  both — if a manned booth is present this flips to guardShack.
- **Dock doors: 50+.** True cross-dock — loading doors on both opposing long
  faces (east and west banks), plus the north cold-dock addition. Estimated ~120
  doors total; count approximate. shipRcvSeparate=true (two distinct opposing
  dock banks).
- **No truck scale / weigh pad** resolved. No rail spur enters the property.

## Yard zones and counts

- **Perimeter** — ~94.1 acres, oriented quad tracing the fence/property line:
  south frontage road, west perimeter road, east grass buffer, north spec-
  warehouse boundary.
- **Drop yards (2)** — East face yard (numbered angled stalls, heaviest trailer
  density) and west face yard. Combined capacity well into the 50+ band; ~320
  trailers possible, ~200+ visible in capture.
- **Dock aprons (2)** — Long thin quads hugging the east and west dock walls at
  the building's angle.
- **Staging** — Wide interior queue aprons flanking the central drive inside the
  entrance (postGateStaging), plus curb-side reefer staging on the frontage road
  ahead of the gate (preGateStaging). The ~600 m central spine holds a 3+ truck
  queue (drivewayLong).

| Metric | Value |
|---|---|
| Dock doors | ~120 (50+) |
| Trailers visible | ~220 |
| Trailer parking capacity | ~320 |
| Truck gates | 1 |
| Buildings | 2 |
| Site area | 94.1 acres |
| Rail served | No |

## Web findings

Costco Distribution Depot, 3730 Mountain Creek Pkwy, Dallas TX 75236. Mon-Sat
5:30 AM - 2:00 PM, closed Sunday. No overnight parking. Listed as a distribution
center with shipper loading docks; 4.4-star driver rating (768 reviews). Consistent
with a regional Texas cross-dock depot; the 2025 cold-dock permit aligns with the
dark-roof north addition observed.

## Confidence

**High** on location, layout, gate-as-controlled-checkpoint, dock band (50+),
drop yard band (50+), ship/receive separation, and acreage. **Uncertain:**
guardShack / remoteGs (booth not imaged), exact entry/exit lane counts, and
multiStep (no second checkpoint confirmed).
