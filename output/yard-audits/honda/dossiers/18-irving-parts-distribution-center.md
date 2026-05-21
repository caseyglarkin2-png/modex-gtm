# Deep-Audit Dossier — idx 18

## American Honda - Irving Parts Distribution Center - Irving TX

**Type:** Parts Distribution Center
**Resolved coordinates:** 32.92215, -97.00910
**Maps:** https://www.google.com/maps/@32.92215,-97.00910,400m/data=!3m1!1e3
**Confidence:** high

---

## Step 0 — Location confirmation

The roster coordinates (32.911717, -96.99072, geocode precision
"APPROXIMATE") landed in the Las Colinas office/residential district of
Irving — not an industrial warehouse. Web research established the facility's
address as **4525 W Royal Lane, Irving, TX 75063** — American Honda's South
Central parts distribution operation.

A directory record yielded coordinates 32.9222481, -97.0091904. A satellite
probe there revealed a large warehouse with a dock bank and trailers on its
east face, a covered (solar) parking canopy to the north, and a trailer
staging area at the NE. Street View confirmed Honda branding: a "HONDA" sign
on the building face and "HONDA - TRUCK ENTRANCE ONLY" signage at the gate —
positively identifying the site. The roster's lat/lng were rejected and the
site relocated.

Locked center: **32.92215, -97.00910**.

---

## Key views

- **Full property z17 (`honda-18-full-z17.png`):** A single large warehouse
  with a covered solar parking canopy on the north, a trailer staging area at
  the NE, an east-face dock bank with trailers, an office building at the SW,
  and employee parking — set in a dense Irving industrial/office corridor.
- **East dock face (`honda-18-dockface-z19.png`, `honda-18-apron-z20.png`):**
  A dock bank along the building's east face with trailers (white, green,
  red) backed in for most of the building length; a wide paved apron runs
  along the docks.
- **NE staging (`honda-18-necorner-z19.png`, `honda-18-north-z18.png`):** A
  row of trailers parked in a staging/drop area at the NE of the property.
- **Truck entry gate (`honda-18-sv-entry1.png`, `honda-18-sv-entry3.png`,
  `honda-18-sv-booth.png`, Street View 2025-05):** A wide driveway on the
  south side with sliding chain-link gates on both sides and a sign reading
  "HONDA - TRUCK ENTRANCE ONLY" with a directional arrow.
- **Truck exit gate (`honda-18-sv-ne1.png`, `honda-18-sv-ne2.png`,
  Street View 2025-05):** A separate NE driveway with a chain-link gate and a
  "HONDA / NO ENTRY - EXIT ONLY" sign; a tractor was visible inside the yard.
- **Perimeter (`honda-18-sv-mid1.png`):** A continuous black metal fence runs
  along the east side enclosing the dock apron and yard.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Two controlled truck gates exist — a signed
  entry-only gate (south) and a signed exit-only gate (NE), each with sliding
  chain-link gates and perimeter fencing. Not open driveways.
- **entryExitSeparate = true.** Entry and exit are physically separate, at
  different points of the property line, and explicitly signed as such.
- **guardShack = false / remoteGs = true.** No staffed guard booth is visible
  at either truck gate in Street View; the gates read as remote/badge-operated
  sliding gates. A small set-back utility/pump structure near the entry is not
  a gate booth. `guardShack` and `remoteGs` are flagged in `uncertainFields`.
- **dockDoors = "25-50".** A single dock bank on the east building face with
  trailers backed in along most of the length; total doors estimated ~30 — a
  mid-size 1980s-era PDC.
- **dropArea = "10-25", dropYard = true.** A row of trailers parked in a
  dedicated staging/drop area at the NE of the property.
- **shipRcvSeparate = false.** Loading is concentrated on one east-face dock
  bank — no second physically separate dock cluster.

---

## Yard zones and counts

- **perimeter:** ~19 acres (estimate from the perimeter box) — the whole
  Honda PDC property inside the fence line.
- **truckGate:** the south "TRUCK ENTRANCE ONLY" gate (the primary entry).
- **dropYards:** one box — the NE trailer staging area.
- **dockAprons:** one — the east-face dock apron.
- **staging:** left null — the east apron doubles as post-gate staging
  (postGateStaging = true), no distinct separate staging zone.
- **yardMetrics:** dockDoorCount ~30 (estimate), trailersVisible ~35 in the
  captured imagery, trailerParkingCapacity ~45 (estimate), truckGateCount 2
  (separate entry and exit), buildingCount 2 (warehouse + SW office),
  siteAreaAcres ~19, railServed false.

---

## Web findings

- Multiple business directories list American Honda Motor Co. at 4525 W Royal
  Lane, Irving, TX 75063; the roster source cites a JQ Engineering
  mezzanine-addition project record for the American Honda Irving PDC.
- Wikimapia identifies the building as "American Honda Motor Co." — a parts
  distribution facility near DFW Airport and major highways.
- No published acreage or square-footage figure was found; site metrics are
  honest overhead estimates.

---

## Final confidence: high

Facility positively identified despite a bad roster geocode — Honda branding
is visible on both the building and the truck gate signage. The truck gates
(separate entry and exit) are confirmed; the absence of a guard shack is the
main residual uncertainty and is flagged in `uncertainFields`. Door/trailer
counts and acreage are honest overhead estimates.
