# Frito-Lay — Kirkwood Plant, Binghamton NY (idx 15)

## Resolved location
- **Roster input:** 200 Frito Lay Dr, Kirkwood NY 13795 — lat/lng 42.039983, -75.79687 (geocode precision **APPROXIMATE**).
- **Problem:** the roster point fell in a residential / wooded area of Kirkwood ~6 km SE of the actual plant.
- **Resolution:** web research returned the operating address **10 Spud Ln, Binghamton/Kirkwood NY 13795 / 13904** (PotatoPro, Yelp, Greater Binghamton Chamber). Nominatim placed Spud Lane at 42.0982, -75.8403. Satellite there shows a large riverside snack-manufacturing complex.
- **Confirmed center:** ~42.0978, -75.8388. Street View from NY Route 11 confirmed multiple potato/corn silos, a steam plume rising from the frying operation, a rail line in front, and a blue Frito-Lay sign at the access intersection — definitively the Frito-Lay Kirkwood chip plant.

## Key views
- **Wide satellite (z16-17):** The plant occupies a long parcel between the Susquehanna River (SW boundary) and NY Route 11 + an active rail line (NE boundary). Components: a large main manufacturing building with attached warehouse (center), a separate long warehouse building (NW), a very large trailer drop yard with dozens of trailers in marked rows (W/SW), and employee parking (E, by the road).
- **Street View (Route 11):** Confirmed silos, fryer steam plume, rail line, and Frito-Lay signage at a signalized intersection. No Street View coverage exists on the private plant access road.
- **Tight satellite (z18-20):** Trailers backed into dock doors on the SW building face; long rows of stored trailers; the dedicated access road crossing the rail line at the NE corner.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (medium confidence).** A single dedicated plant access road runs from a signalized public-road intersection (~42.0997, -75.8374) across the rail line into the property. A controlled checkpoint is standard for a Frito-Lay manufacturing plant of this scale; the private drive is not covered by Street View so a barrier arm could not be directly imaged.
- **Guard shack — FALSE / remoteGs TRUE.** No guard booth resolvable in satellite at the entrance. Classified as gate-without-visible-shack (kiosk / call-box style). Low confidence — any booth would sit on the unviewable private drive.
- **Dock doors — "25-50".** Trailers seen backed into dock faces along the SW side of the main building; ~40 doors estimated from overhead imagery (approximate).
- **Drop yard — TRUE, "50+".** Dozens of trailers parked in long marked rows on the W/SW side along the river — easily 50+ stalls, the dominant yard feature.
- **Rail-served — TRUE.** An active rail line runs along the NE edge between the plant and the road; the plant has historically received bulk inbound by rail.

## Yard zones & counts
- **Perimeter:** ~42.0952–42.1003 N/S, -75.8420–-75.8370 E/W — roughly 560 m × 440 m ≈ **61 acres**.
- **Truck gate zone:** the NE access road / rail-crossing checkpoint area.
- **Drop yards:** two boxes covering the long trailer-storage rows on the W/SW side.
- **Dock apron:** one box on the SW main-building face.
- **Metrics:** dockDoorCount ~40, trailersVisible ~120, trailerParkingCapacity ~200, truckGateCount 1, buildingCount 3, railServed true.

## Web findings
- Frito-Lay Kirkwood is a long-running (50+ years) snack plant producing Doritos, Fritos, Ruffles, and Lay's; ~9 fryer lines. Major regional employer for the Binghamton area.

## Final confidence
**Medium.** Facility positively identified and the yard layout is clear. Gate and guard-shack calls are inferred — the private access road has no Street View coverage, so barrier-arm / booth presence could not be directly imaged. Setting: Rural (small-town riverside industrial corridor).
