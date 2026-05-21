# Frito-Lay — Aberdeen MD (idx 18)

## Resolved location
- **Roster input:** 1080 Old Philadelphia Rd, Aberdeen MD 21001 — lat/lng 39.489025, -76.189621 (geocode precision **RANGE_INTERPOLATED**, moved 80 m).
- **Resolution:** the roster point landed in the right industrial park but not on the plant. Web research returned the operating address **800 Hickory Dr, Aberdeen MD 21001** (Waze, BBB, Maryland Dept. of Commerce). OpenStreetMap tags the Frito-Lay building directly at **39.49876, -76.188679**.
- **Confirmation:** Street View on Hickory Drive shows the "Frito-Lay, Inc." blue monument sign, the large manufacturing-distribution building, and Cheetos-branded Frito-Lay trailers backed into the dock — positive identification.

## Key views
- **Wide satellite (z16-17):** A large single connected manufacturing-distribution building set in a wooded industrial park, with trailers parked on all four faces, a large trailer drop yard and car parking on the south/SW side, bulk ingredient tanks at the NW corner, and a rail line along the NW edge.
- **Street View (Hickory Dr, 2024 pano):** Clear view of the truck entrance — a barrier arm across the single driveway, continuous chain-link perimeter fencing, the Frito-Lay sign, and a Cheetos trailer at the dock behind.
- **Tight satellite (z18-21):** Dozens of dock doors with trailers backed in on multiple faces; long rows of stored trailers in the SW drop yard; a small structure beside the gate barrier arm.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (high confidence).** Street View directly shows a barrier arm across the truck driveway with continuous perimeter chain-link fencing. Single shared in/out lane.
- **Guard shack — FALSE / remoteGs TRUE (flagged uncertain).** A small structure sits beside the gate arm (visible in Street View and z21 satellite), but it reads as a small check-in kiosk / booth (~1-vehicle footprint) rather than a clearly staffed multi-window guard shack. Classified as gate-without-clear-shack.
- **Dock doors — "50+".** Trailers backed into dock doors on the west, north, south, and east building faces; total well into the 50+ band (~70 estimated).
- **Drop yard — TRUE, "50+".** Large trailer drop yard on the SW/south side with long rows of parked trailers — easily 50+ stalls.
- **Rail-served — TRUE (flagged uncertain).** A rail line runs along the NW edge with an apparent spur toward the plant's NW corner near the bulk tanks; Frito-Lay Aberdeen is a manufacturing-distribution center that historically received rail inbound.

## Yard zones & counts
- **Perimeter:** ~39.4958–39.5005 N/S, -76.1925–-76.1864 E/W — roughly 500 m × 470 m ≈ **58 acres**.
- **Truck gate zone:** the Hickory Drive barrier-arm entrance on the E side.
- **Drop yard:** one box covering the long SW trailer-storage rows.
- **Dock aprons:** two boxes — the south building face and the north/NW face.
- **Metrics:** dockDoorCount ~70, trailersVisible ~130, trailerParkingCapacity ~160, truckGateCount 1, buildingCount 1, railServed true.

## Web findings
- Frito-Lay Aberdeen is a manufacturing-distribution center; the company announced a 2016 expansion adding ~140 jobs (Maryland Dept. of Commerce / Area Development). It serves the Mid-Atlantic region.

## Final confidence
**High.** Facility positively identified via OSM tagging and Street View signage; truck gate with barrier arm directly imaged. The only soft calls are the guard-shack/remote-gate distinction (small ambiguous structure at the gate) and whether the NW rail spur actually serves the plant. Setting: Rural (edge-of-town Aberdeen industrial park).
