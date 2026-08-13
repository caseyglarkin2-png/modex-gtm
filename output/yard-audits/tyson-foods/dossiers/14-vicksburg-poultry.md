# Tyson Foods - Vicksburg Plant, Vicksburg MS (idx 14)

**Resolved location:** 32.364817, -90.658987. Street address **1785 Interplex Cir, Vicksburg, MS 39183** (Ceres industrial park, east of Vicksburg, north of Armory Road).
**Maps:** https://www.google.com/maps/@32.364817,-90.658987,400m/data=!3m1!1e3
**Confidence:** high (location, gate, fence, docks); `guardShack` is a medium-confidence negative, explained below.

---

## The roster coordinate was wrong - by 12.6 km

The roster carried 32.398947, -90.791323 flagged `APPROXIMATE`. Satellite at that point is woodland, farm tracks and residential subdivisions north-west of Vicksburg - **no industrial site of any kind**. That coordinate must not be used.

Corrected by two API lookups that agree exactly:
- **Google Geocoding** for "Tyson Foods Vicksburg MS" returns *1785 Interplex Cir, Vicksburg MS 39183* at **32.3648171, -90.6589868**, `location_type: ROOFTOP`.
- **Google Places (New) text search** returns one result, *Tyson Foods Inc*, `primaryType: manufacturer`, same address, same point.

Satellite at the corrected point shows a large poultry processing plant with three separate trailer-storage areas. Street View (March 2025) shows **Tyson-branded reefers ("Tyson Crispy Strips") parked inside the fenced yard** and a **Jimmy Dean** trailer (Tyson brand) on the west side - first-party confirmation of the operator.

**Excluded from the site:** the very large white-roofed warehouse immediately south across Armory Road is **Unified Brands, 88 Armory Rd** (a foodservice-equipment maker), not Tyson. It is outside the geofence.

---

## What each view showed

| View | Finding |
| --- | --- |
| z16 wide | Isolated industrial parcel ringed by cropland and woodland; employee lot north-west, plant center, Armory Road along the south. |
| z17 site | Single connected plant complex ~313 m x 290 m. Three drop yards: a long north row along the property line, a curved row on the east perimeter road, and a south-west lot. Large employee lot on the west. |
| z18 / z19 north | ~24 trailers standing in the north row alone; yard tractors, fuel tanks, and a fence line separating the employee lot from the yard. |
| z20 west | Three canopied dock banks on the plant's west face, ~13 docked positions inside a single 80 m window. |
| z20 / z21 south-west entrance | Wide (~50 m) paved apron off Armory Road with two grass islands. No barrier or booth in the throat itself. |
| Street View, Armory Road (7 panos, March 2025) | Chain-link fence along the whole south frontage. **Two gates found.** |

---

## Gate / guard-shack determination

**truckGate = true.** The property is enclosed in chain-link, confirmed continuously along the Armory Road frontage. Two gated lanes:

1. **South-west drop-yard lane** (~32.36389, -90.66024): a cantilever/rolling chain-link gate leaf with a visible **electric gate-operator cabinet** and yellow bollards, opening onto the row of Tyson reefers.
2. **East lane** (~32.36395, -90.65810): a **double swing gate** (leaves standing open in the imagery) with a **STOP sign** and bollards in the lane.

Caveat recorded honestly in the JSON: the wide main apron **between** those two lanes (~32.36379, -90.65985) reads as an open paved throat with no barrier in the lane itself, so control on that specific lane is unconfirmed. The site is gated; whether every lane is gated is not.

**guardShack = false (medium confidence).** No guard booth was found at either gate in any Street View heading or in z20-z21 satellite. A small prefab shed with a single door and one window sits inside the east gate - but an identical shed stands elsewhere on the property, so both read as storage, not a staffed booth. Flagged in `uncertainFields`.

**remoteGs = true.** Gated fence line + electric gate operator + STOP control with no staffed booth is the signature of driver self-check-in (kiosk / call box / app).

**preGateStaging = true.** Tractor-trailers were parked on the wide gravel shoulder of Armory Road **outside** the fence in March 2025 - two separate Street View panos were completely blocked by roadside trailers. That is functioning overflow staging even though no marked stalls exist. Useful in the sales conversation: drivers are already waiting on the public shoulder.

**backupSensitive = false.** Armory Road is a low-traffic industrial-park road and the apron is ~50 m wide with deep stacking room inside the fence.

---

## Docks, drop yards, zones measured

- **Perimeter:** 10-vertex ring traced to the fenced Tyson parcel, bounded by Interplex Circle (west) and Armory Road (south). **19.1 acres.**
- **Truck gate zone:** quad covering the south-west apron from the road into the yard, including the gated drop-yard lane.
- **Drop yards (3):** north property-line row (1.15 ac), east perimeter row (1.00 ac), south-west lot (1.89 ac).
- **Dock aprons (2):** the plant's west face (0.61 ac) and the north face (0.62 ac).
- **dockDoorCount 55, band 50+ (estimate).** Extrapolated from ~13 docked positions in an 80 m window on a west face running roughly 200 m, plus the north-face dock line and the south-west shipping building.
- **trailersVisible ~90; trailerParkingCapacity ~130.** Both approximate.
- **dropArea 50+**, across three physically separate yards - the classic multi-yard hunt-for-the-trailer problem.
- **shipRcvSeparate = true.** Docks on the west face, a separate line on the north face, and a distinct shipping building at the south-west corner.
- **railServed false.** No spur.
- **scale: recorded false, unverified.** No weigh pad isolated. As at New Holland, this reads as a **further-processing / prepared-foods plant rather than a live-haul kill plant**: no poultry holding sheds, no open-sided cage trailers, only dry vans and reefers. That materially changes the yard profile - no live-haul receiving queue, no bird-holding dwell.

---

## Web findings

None. The session's web-search budget was exhausted. Everything above comes from satellite imagery, Street View, the Google Geocoding/Places APIs, and Tyson brand livery observed inside the fence. The verification block is marked `confirmed` on the Places manufacturer listing plus first-party trailer branding and visible operating activity (full drop yards, trailers docked, steam plumes), with `checkedDivestiture` and `checkedBankruptcyEra` both false.

## Final confidence

**High** on location, fence, gates and yard structure. Uncertain: `guardShack`, `entryLanes`, `exitLanes`, `entryExitSeparate`, `scale`, `multiStep`, `dockDoorCount`, `trailerParkingCapacity`.
