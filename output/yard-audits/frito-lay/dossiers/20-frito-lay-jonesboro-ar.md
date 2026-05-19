# Frito-Lay — Jonesboro AR (idx 20)

## Resolved location
- **Roster input:** 2810 Quality Way, Jonesboro AR 72401 — lat/lng 35.814768, -90.56181 (geocode flagged ROOFTOP but `movedMeters` 8439, which raised a concern).
- **Resolution:** despite the large geocode move, the supplied lat/lng landed directly on the Frito-Lay plant. Web research confirmed the address — a large Frito-Lay manufacturing plant producing Lay's, Ruffles, and Doritos (PotatoPro, BBB, Jonesboro Chamber; Frito-Lay announced an expansion in 2016).
- **Confirmation:** Street View from surrounding farm roads shows the plant building with process silos and a Frito-Lay monument sign in the adjacent field — positive identification.

## Key views
- **Wide satellite (z16-17):** A large single manufacturing building on a central parcel, surrounded by open agricultural fields. A massive trailer drop yard occupies the north side; employee parking is on the west; a single private access road runs west to the public road; detention ponds sit to the south.
- **Street View (farm roads):** Confirmed the plant, silos, and Frito-Lay signage. No Street View coverage on the private access drive.
- **Tight satellite (z18-20):** Hundreds of trailers parked in long rows in the north drop yard; extensive dock doors with trailers backed in along the building's north face; a rail spur curving into the SW corner of the property.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (flagged uncertain).** A large modern plant set well back from public roads, reached by a single private access road from the west. A controlled truck gate is standard for a plant of this scale; the private drive is not covered by Street View so a barrier arm could not be directly imaged.
- **Guard shack — FALSE / remoteGs TRUE (flagged uncertain).** No guard booth resolvable; any gate structure sits on the unviewable private access road.
- **Dock doors — "50+".** Extensive dock doors with trailers backed in along the building's north face; ~60 doors estimated.
- **Drop yard — TRUE, "50+".** A very large trailer drop yard on the north side — hundreds of trailers parked in long rows (~200+ visible).
- **Fast lane — TRUE (flagged uncertain).** Wide paved aprons and abundant yard space around the access road suggest room for a bypass/express lane.
- **Rail-served — TRUE.** A rail spur curves into the property at the SW corner, reaching the process/tank area.

## Yard zones & counts
- **Perimeter:** ~35.8110–35.8168 N/S, -90.5640–-90.5580 E/W — roughly 645 m × 545 m of developed footprint ≈ **87 acres**.
- **Truck gate zone:** the west-side private access road entrance.
- **Drop yards:** two boxes — the large north drop yard and the west-side trailer rows.
- **Dock apron:** one box on the north building face.
- **Metrics:** dockDoorCount ~60, trailersVisible ~220, trailerParkingCapacity ~280, truckGateCount 1, buildingCount 1, railServed true.

## Web findings
- The Jonesboro plant is a major Frito-Lay manufacturing facility (Lay's, Ruffles, Doritos); the company announced a Jonesboro expansion in 2016 adding up to ~30 jobs.

## Final confidence
**Medium.** Facility positively identified and the yard layout (huge drop yard, north dock face, rail spur) is clear from satellite. Gate and guard-shack calls are inferred — Street View does not cover the private access road, so the truck gate's barrier arm and any booth could not be directly imaged. Setting: Rural (surrounded by farmland on the edge of Jonesboro).
