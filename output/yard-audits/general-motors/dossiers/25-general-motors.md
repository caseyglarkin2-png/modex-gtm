# Deep-Audit Dossier — GM Brownstown Battery Assembly (idx 25)

**Facility:** GM - Brownstown Battery Assembly, Brownstown Charter Twp MI
**Type:** Battery Assembly Plant (battery packs + electric drive units; legacy fuel-cell ops)
**Resolved center:** 42.1035, -83.2490
**Official address:** 20001 Brownstown Center Dr, Brownstown Charter Twp, MI 48183
(roster-listed 21500 Allen Rd is the adjacent public arterial)
**Confidence:** High

---

## Step 0 — Location confirmation

The roster seed coordinates (~42.0589, -83.2436) landed ~6 km south on rural
Huron River farmland — wrong. Web search resolved the plant's official address
to **20001 Brownstown Center Drive, Brownstown Charter Twp MI 48183** (GM media,
Panjiva import records, MarkLines). Probing the Allen Rd / Brownstown industrial
corridor at z15-z16 revealed a large GM auto-manufacturing complex:

- A single contiguous white-and-dark-roof manufacturing mega-building.
- A continuous private perimeter loop road encircling the property.
- Bounded by **I-75 on the east**, the **Allen Rd corridor / high-tension power
  line** on the SE, open farmland and a retention pond on the west/NW.
- Stenciled employee-lot text reading "MUSTANG" and auto-plant-scale parking —
  consistent with a GM facility.
- A public Allen Rd Street View pano (2024-07) shows the plant building on the
  NW horizon, confirming the sightline.

Center locked at **42.1035, -83.2490**. This is positively the GM Brownstown
manufacturing campus.

> Note on scale: GM publicly cites ~479,000 sq ft for the original battery
> building, but the contiguous roofed structure on site is substantially larger,
> reflecting the combined Brownstown campus (battery assembly + legacy fuel-cell
> + warehousing). The audit covers the freight-relevant truck yard of that
> contiguous complex.

---

## Key views

- **z15 region:** large industrial complex N of Allen Rd; main white-roof building
  center, a separate dark/solar-roof building on the parcel to the south (excluded).
- **z16-z17 full:** one contiguous building; perimeter loop road; west-side trailer
  drop yard with parallel rows; south employee lots and gatehouse cluster; I-75 to E.
- **z18 west face:** long continuous dock bank with ~15-20 trailers backed in,
  plus a deep drop yard of unattached trailers in multiple rows.
- **z19 west drop yard (tight):** ~50-70 trailers counted in parallel rows — heavy
  drop-trailer operation.
- **z19 south face:** sawtooth dock canopies with trucks backed in along the south
  wall; wide multi-lane internal entry artery.
- **z18/z19 south entry:** booth-footprint structure with adjacent circular tanks
  beside the controlled south entry lane = gatehouse.
- **Street View (Allen Rd, pano 9pSofkhImAu_xiKxUdmGrQ, 2024-07):** divided
  arterial, transmission corridor, plant building on NW horizon, a parked
  tarped trailer roadside.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Continuous perimeter fence/loop road; single controlled
  south entry where the drive pinches between a gatehouse and landscaping.
- **guardShack = true (medium).** Small multi-window booth-scale structure at the
  south entry lane; standard for a secured GM plant. Not resolved to door level —
  flagged uncertain. **remoteGs = false** as a result.
- **dockDoors = "50+".** West dock bank (15-20 doors w/ trailers) + south sawtooth
  dock line + north-building bays; cumulative > 50.
- **dropArea = "50+", dropYard = true.** West yard holds dozens of unattached
  trailers in striped rows.
- **shipRcvSeparate = true.** Distinct dock clusters on separate building faces
  (west vs. south).
- **multiStep = false; scale = false** (no second checkpoint or weigh pad seen).

---

## Yard zones & counts (overhead estimates)

- **perimeter:** ~175 acres, 5-vertex ring on the private loop road; excludes the
  separate southern dark-roof building/parcel.
- **truckGate:** quad over the south controlled entry.
- **dropYards:** west trailer-storage rows.
- **dockAprons:** (1) west dock bank, (2) south sawtooth dock line — thin quads
  parallel to each face.
- **dockDoorCount ~55, trailersVisible ~70, trailerParkingCapacity ~120,
  truckGateCount 1, buildingCount 2, railServed false.**

---

## Web findings

- GM Brownstown Battery Assembly: assembles battery packs and electric drive
  units; historically Volt/Bolt packs, now Corvette E-Ray drive units and
  Cadillac CELESTIQ packs; also legacy fuel-cell operations.
- Official address 20001 Brownstown Center Dr, 48183 (GM media / import records).
- Truck-served (no rail spur); I-75 frontage.

---

## Summary

- **Gate:** controlled single south truck gate — TRUE.
- **Guard shack:** booth-scale structure at the entry — TRUE (medium).
- **Confidence:** High (a few count/lane fields flagged uncertain).
