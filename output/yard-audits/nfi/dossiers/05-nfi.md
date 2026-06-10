# Deep-Audit Dossier — NFI Port Logistics, Eastvale CA (Site 05)

**Facility:** NFI Port Logistics Eastvale CA — Port Logistics / import-transload DC
**Address:** 13000 Mission Blvd, Eastvale, CA 92509
**Resolved center:** 34.029780, -117.556720
**Map:** https://www.google.com/maps/@34.029780,-117.556720,400m/data=!3m1!1e3
**Confidence:** HIGH
**Method:** deep-audit

---

## 1. Location confirmation

The supplied coordinates (34.029547, -117.556723) landed directly on the
correct building. Satellite probes (z16–z18) showed a single very large
single-tenant distribution building, and the SW-frontage Street View (2025-11)
shows the **NFI** blue logo on the building wall plus a parked NFI trailer at
the gate, with the cross street sign reading "Mission" — confirming
13000 Mission Blvd.

Corroborating research (Colliers / CoStar / Commercial Observer / Bisnow):
NFI bought the **761,000 SF** building on a **~42.8-acre** parcel from
Sares-Regis Group for **$220M**, closing **Dec 1, 2022**; built 2000; an Inland
Empire (Eastvale) import/transload port-logistics operation near Ontario Intl.
My perimeter polygon measures **40.6 acres**, matching the documented parcel.

## 2. Key views

- **z16 / z17 overview:** Large building rotated ~10° clockwise (long axis
  NNW–SSE). Dock banks on the **west wall** (main) and **south face**; a large
  trailer drop yard fills the **south / SE** of the parcel. Building north end
  fronts employee parking and the SR-60 corridor.
- **z18–z21 tight:** West face is a continuous bank of dock doors with trailers
  backed in; south face a second dock bank. The SW corner driveway off Mission
  Blvd is the entrance.
- **Street View (2025-11):**
  - SW gate (heading ~60/100°): black ornamental-steel **perimeter fence**
    along the whole Mission Blvd frontage with a **sliding steel gate** across
    the truck drive, stop/check-in signage on the gate, NFI logo + trailer
    behind it. No guard booth.
  - West frontage (heading 90°): continuous fence in front of a long west-wall
    **dock bank** (~30+ doors visible in that one stretch).
  - Office frontage: glazed two-story office at the SW, behind the same fence.

## 3. Gate / guard-shack / dock determinations

- **truckGate = TRUE.** Sliding steel gate across the truck drive at the SW
  corner on Mission Blvd; fully fenced perimeter on every street frontage
  (verified in Street View on multiple headings). Controlled entry, not an open
  driveway.
- **guardShack = FALSE.** No 1–3-space staffed booth beside the lane in either
  overhead (z20/z21) or ground-level Street View. The gate is unmanned.
- **remoteGs = TRUE.** Gate present, no booth → kiosk / call-box / app check-in
  implied.
- **dockDoors = "50+".** West-wall bank (~50–60 doors) plus a south-face bank
  (~10–15) → well over 50. Overhead estimate.
- **shipRcvSeparate = TRUE.** Two distinct dock clusters on two different
  building faces (long west wall + south face).
- **dropYard / dropArea = TRUE / "50+".** Dedicated trailer-storage lot south
  and SE of the building, 80–100 trailers parked in marked rows.
- **postGateStaging = TRUE / drivewayLong = TRUE.** Deep internal drive aisle
  and apron inside the gate along the west docks can hold a 3+ truck queue.
- **fastLaneOpportunity = TRUE.** Wide gated apron and deep west-side aisle
  leave room for a bypass/express lane.
- **scale / multiStep / rail = FALSE.** No truck scale, no second checkpoint, no
  rail spur entering the property.
- **urbanRural = "Urban".** Dense Inland-Empire logistics fabric, surrounded by
  large DCs on all sides; metro setting.

## 4. Yard zones & counts (estimates from overhead)

| Metric | Value |
|---|---|
| dockDoorCount | ~70 (50–60 west + 10–15 south) |
| trailersVisible | ~90 |
| trailerParkingCapacity | ~140 |
| truckGateCount | 1 |
| buildingCount | 1 |
| siteAreaAcres | 40.6 (perimeter polygon) |
| railServed | false |

Geofences traced as oriented rings matching the building's ~10° rotation:
perimeter (6-vertex parcel), truckGate (SW sliding-gate apron), one south
dropYard, and two dockAprons (west wall + south face). Street View metadata
captured for perimeter (pano `t1kHi4rjQI93iA709y89qg`, heading 72°) and
truckGate (pano `EL2DL0jl7LnkDFHAjQ0J4Q`, heading 53°), both 2025-11 coverage.

## 5. Web findings

- Colliers brokered the $220M sale; CoStar/Commercial Observer/Bisnow confirm
  761,000 SF, ~42.8 acres, built 2000, Sares-Regis → NFI (Dec 2022).
- Positioned as a Southern California port-logistics / import-transload node
  near Ontario International Airport.

## 6. Confidence

**HIGH.** Building positively identified by NFI signage in Street View and
address sign; perimeter area matches public records within ~5%. Gate and
no-guard-shack calls are directly evidenced in ground-level imagery. Low-
confidence items (entry/exit lane counts, exact trailer capacity) are flagged
in `uncertainFields`.
