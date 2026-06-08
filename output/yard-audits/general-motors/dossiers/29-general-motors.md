# GM CCA - Davison Road Processing Center, Burton MI

**Idx 29 · GM roster · deep-audit · confidence: high**

Address: 4400 / 4420 Davison Rd, Burton, MI 48509
Resolved center: **43.0272, -83.6411**
Maps (satellite): https://www.google.com/maps/@43.02720,-83.64110,400m/data=!3m1!1e3

## Step 0 - Facility confirmation

The roster's approximate coordinates (43.0245, -83.668) landed on a school/office
complex with tennis courts well west of the real site - wrong building. I re-pinned
by web research + satellite scanning east along Davison Rd.

Web findings (GM News, Automotive Logistics, GM Authority, abc12, Grand Blanc View):
- The Davison Road Processing Center is GM Customer Care & Aftersales' (CCA) main
  hub for GM Genuine and ACDelco parts; opened 2019, ~1.1 million sq ft, on a vacant
  **141-acre lot at the corner of Genesee Rd and Davison Rd** in Burton.
- **84 shipping and receiving dock doors** (up from 35 at the prior facility).
- Ships ~15,000 parts orders / day; ~700-1,460 team members (UAW Local 651).
- A **132-ft (101,500 sq ft) ASRS automated-storage tower** was approved 2024 on the
  **east side of the building, toward Davison Rd, near the Genesee Rd corner.**

Satellite then unambiguously matched these facts: a very large white-roof modern
building running E-W, the **GM water tower at its SW corner**, the **east end at the
Genesee Rd / Davison Rd intersection** (where the ASRS tower sits), an active **rail
line with a siding along the south edge**, and an **enormous legacy GM concrete apron
extending north** to a residential street. Confirmed = true, confidence high.

## Key views

- **Wide / context (z15-16):** large white industrial complex N of Davison Rd, rail
  corridor along the south, major N-S Genesee Rd on the east, residential to the north.
- **Building (z17-19):** ~1.1M sq ft white-roof building, E-W long axis (~700 m),
  modern uniform roof with rooftop units; ASRS / tall section at the east end.
- **South face (Street View, 2025):** building sits across the rail from Davison Rd;
  the south frontage is blank wall + employee car parking, no docks on the rail side.
- **North side (z17-19 + 2011 Street View from inside the lot):** a vast cracked
  concrete apron (tens of acres) - the legacy GM yard - with trailers staged against
  the building's north face and a perimeter fence separating it from the homes.
- **East end (z18-19):** employee parking and yard at the Genesee/Davison corner; the
  rail siding/turnout is visible at z19 along the south boundary.
- **SW corner (z18 + Street View):** GM water tower marks the corner; Davison Rd ×
  N-S road intersection with rail "XX" crossings; small retail party store across the
  public road (not GM).

## Gate / guard-shack / dock determinations

- **truckGate = true.** Continuous perimeter fence rings the paved yard (clearly seen
  in 2025 Street View along Genesee Rd, fence between the GM apron and residential
  lots). Access is through controlled industrial driveways. Two principal access points
  (east off Genesee Rd; west driveway) -> **truckGateCount 2**, entry/exit treated as
  **separate**.
- **guardShack = false (uncertain).** No staffed booth was positively identifiable;
  the gate driveways sit back from the public road and the available panos did not
  capture a booth. **remoteGs = true** (kiosk / app check-in assumed) at low confidence.
- **dockDoors = "50+".** 84 documented shipping/receiving docks across the building
  faces; docks + staged trailers visible on the north face and east end in satellite.
- **dropArea / dropYard = "50+" / true.** The enormous north concrete apron is a
  dedicated trailer-staging field with capacity in the hundreds (estimate ~250),
  separate from the active dock aprons. Visible trailer count in the captured imagery
  was modest (~25) but the lot holds far more.
- **postGateStaging / drivewayLong = true.** Deep paved internal yard inside the fence,
  before the docks, easily queues 3+ trucks.
- **fastLaneOpportunity = true.** Huge unused paved width and wide aprons leave room
  for an express/bypass lane.
- **scale = false (uncertain).** No truck scale positively identified.
- **multipleFacilities = false; buildingCount 1.** One dominant processing building
  (plus its attached ASRS tower) on the parcel.

## Yard zones & counts measured

- **perimeter:** fenced GM property, ~43.02525-43.02985 N, -83.64575 to -83.63660 W;
  traced quad ~90-100 acres. siteAreaAcres set to the documented **141 acres** for the
  full parcel.
- **truckGate zone:** NE corner driveway area off Genesee Rd into the north yard.
- **dropYards:** (1) the large north legacy apron; (2) a smaller east trailer-staging
  strip near the building's east end.
- **dockAprons:** long thin strip hugging the building's north face where trailers back in.
- **yardMetrics:** dockDoorCount 84, trailersVisible ~25, trailerParkingCapacity ~250,
  truckGateCount 2, buildingCount 1, siteAreaAcres 141, railServed true.

## Street View metadata

The useful panos sat on public roads (Davison Rd, Genesee Rd) and on the internal
2011 apron, not at the actual fenced gate driveways, so no single pano cleanly frames
a zone centroid. `streetViewMeta` left `hasCoverage:false` for both perimeter and
truckGate to avoid asserting a pano that does not show the gate.

## Web findings (sources)

- GM News - "GM to invest more than $100 Million in CCA facility" (2023)
- Automotive Logistics - "GM invests in Michigan for aftersales distribution and EV assembly"
- GM Authority - "GM To Invest $100 Million In Davison Road Processing Center" (2023)
- WILX / Automoblog - groundbreaking + 2019 opening, 1.1M sq ft, 84 docks, 141 acres
- abc12 / Davison Index / Grand Blanc View - 132-ft ASRS tower (east side, near Genesee corner)

## Final confidence: HIGH

3-line summary:
- **Gate:** YES - fenced industrial site with controlled driveways (2 access points); entry/exit separate.
- **Guard shack:** Not confirmed - no booth visible; remoteGs/kiosk assumed (low confidence).
- **Confidence:** HIGH on facility ID, layout, docks (84), rail, and drop-yard scale; gate-control detail and exact lane/trailer counts are estimates.
