# Deep-Audit Dossier — idx 17

## American Honda - Chino Parts Distribution Center (NA Hub West) - Chino CA

**Type:** Parts / Accessories Distribution Center
**Resolved coordinates:** 33.99624, -117.69960
**Maps:** https://www.google.com/maps/@33.99624,-117.69960,400m/data=!3m1!1e3
**Confidence:** high

---

## Step 0 — Location confirmation

The roster coordinates (34.012023, -117.678685, geocode precision
"APPROXIMATE") landed in a residential neighborhood of Chino — confirmed via
Street View (palms, single-family homes). Web research established the
facility's address as **14141 Yorba Ave, Chino, CA 91710** — Honda's "North
American Hub - West" parts and accessories distribution center, a 500,000 sq
ft building on ~30 acres.

A Roadtrippers map record yielded coordinates 33.99624, -117.69999. A
satellite probe there revealed a large warehouse with a distinctive rooftop
solar array, dock banks with trailers in Honda's characteristic green/orange/
white livery, and a large trailer court — positively identifying the Honda
PDC. The roster's lat/lng were rejected and the site relocated.

Locked center: **33.99624, -117.69960**.

---

## Key views

- **Property z16/z17 (`honda-17-prop-z17.png`, `honda-17-wide-z16.png`):** A
  single very large warehouse with rooftop solar, an east-side trailer court
  full of parked trailers, and a south/SW dock face — set in a dense Chino
  industrial park.
- **East dock face + trailer court (`honda-17-dock2-z19.png`,
  `honda-17-truckcourt-z19.png`):** Dock doors on the building's east face
  with trailers backed in; east of that, a wide paved truck court holding many
  rows of parked trailers plus stacked intermodal containers — a substantial
  drop yard.
- **South/SW face (`honda-17-westgate-z18.png`, `honda-17-swcorner-z18.png`):**
  A second dock bank on the south/SW face with trailers backed in and
  additional staged trailers/containers.
- **Truck gate (`honda-17-sv-sgate2.png`, Street View 2025-10):** A wide
  chain-link rolling/sliding gate across the truck-court driveway off the east
  frontage road; the green/orange trailer court is visible directly behind the
  gate. No staffed booth is visible.
- **North gate (`honda-17-sv-ngate3.png`, `honda-17-ngate-z21.png`):** A
  separate driveway gate at the NE corner leads only into the employee/visitor
  car parking lot — not a truck entrance.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** A controlled truck entrance exists — a wide chain-link
  sliding gate across the truck-court driveway, clearly visible in Street View
  with the trailer court behind it. Not an open driveway.
- **guardShack = false / remoteGs = true.** No staffed guard booth is visible
  at the truck gate; the gate reads as a remote/badge-operated sliding gate.
  The east and south perimeter are hedge-screened, so a very small booth
  cannot be 100 % excluded — `guardShack` and `remoteGs` are flagged in
  `uncertainFields`. On the visible evidence, this is a gate without a guard
  shack (kiosk / badge check-in implied).
- **dockDoors = "50+".** Dock banks on two building faces (east and south/SW)
  on a 500,000 sq ft hub with heavy trailer traffic; total doors estimated
  ~55, in the 50+ band.
- **shipRcvSeparate = true.** Two physically distinct dock clusters on
  different building faces.
- **dropArea = "50+", dropYard = true.** A large dedicated trailer-storage
  court on the east/south of the building is full of parked trailers and
  stacked containers — well over 50 stalls.

---

## Yard zones and counts

- **perimeter:** ~30 acres (per Honda's grand-opening release) — the Honda PDC
  property inside the fence line.
- **truckGate:** the sliding-gate driveway off the east frontage road.
- **dropYards:** one box — the east-side trailer court.
- **dockAprons:** two — the east-face apron and the south/SW-face apron.
- **staging:** left null — the inside-the-gate truck court doubles as
  post-gate staging (postGateStaging = true) but no distinct separate staging
  zone is delineated.
- **yardMetrics:** dockDoorCount ~55 (estimate), trailersVisible ~90 in the
  captured imagery, trailerParkingCapacity ~120 (estimate), truckGateCount 1,
  buildingCount 1, siteAreaAcres 30, railServed false.

---

## Web findings

- hondanews / Honda corporate: the Chino facility is American Honda's "North
  American Hub - West" parts distribution center and customer-service call
  center; grand opening 2011; renovated ~500,000 sq ft building.
- Roster corroboration: 30-acre, 500,000 sq ft facility.
- Address consistently listed as 14141 Yorba Ave, Chino, CA 91710 across
  multiple business directories.

---

## Final confidence: high

Facility positively identified despite a bad roster geocode; imagery clear.
The truck gate is confirmed; the absence of a guard shack is the main
residual uncertainty (heavy hedge screening), and is flagged in
`uncertainFields`. Door/trailer/lane counts are honest overhead estimates.
