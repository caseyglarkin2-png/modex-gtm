# Yard Audit Dossier — Costco Dry Depot #175, Monroe Township NJ

- **Facility:** Costco Dry Depot #175 (Northeast dry cross-dock)
- **Address:** 10 Costco Dr, Monroe Township, NJ 08831
- **Resolved center:** 40.356173, -74.455342
- **Method:** deep-audit (satellite + Street View)
- **Confidence:** high

---

## 1. Location confirmation

The roster coordinates were correct. Geocoding resolved:
- **10 Costco Dr (DRY #175)** → 40.3561728, -74.4553418 — exactly the roster point.
- **12 Costco Dr (WET #265)** → 40.3562264, -74.4625090 — ~600 m WEST, a physically
  separate building.

Satellite at z15-z18 confirms the roster point lands on a single very large
light-gray-roofed cross-dock building wrapped by extensive trailer yards. A probe
at the wet-depot coordinates shows a distinct, separate building cluster to the
west, confirming the two are different structures. **This audit covers ONLY the
dry depot at 10 Costco Dr.** Web research (Chamber of Commerce, Loc8NearMe,
Panjiva) corroborates Dry Depot #175 as a trucker-facing distribution depot,
hours ~5:00 AM-2:30 PM Mon-Sat, "quick in-and-out for drivers."

## 2. What the key views showed

- **z15/z16 wide:** A massive U/L-shaped cross-dock at the center-right of a large
  industrial park. The building and its trailer yards form one fenced block, rotated
  off north (long axes run roughly NE-SW). Employee car parking sits on the west side
  near two retention ponds; a wooded/powerline buffer and a rail line run along the
  south.
- **z17/z18 detail (NE, SE, SW):** Continuous bank of dock doors with backed-in
  trailers and clear dock-leveler rhythm on the north face and along the wings.
  Hundreds of trailers parked without tractors in dense fanned rows on the NE, SE and
  SW — classic large drop yards. A large central paved apron provides truck
  maneuvering/staging.
- **z19/z20 entrance throats:** The single vehicular approach enters from the NW off
  Costco Drive, past the ponds and employee lot. Tree cover and lack of interior
  Street View prevented resolving a barrier arm or booth at the gate itself.

## 3. Gate / guard-shack / dock determinations

- **truckGate = true.** The property is fully fenced — chain-link perimeter fence is
  directly visible in Street View on the west boundary (pano `AY6EyDCda2gVrJU2-JkKRQ`,
  captured 2025-06, heading 135 toward the depot). The site has a single controlled
  vehicular throat off Costco Drive. Consistent with Costco's standard guarded depot
  operation. The gate barrier sits on the private interior road (no Street View) and
  is partly tree-obscured from above, so the arm itself was not pinned, but the
  fenced single-throat layout makes a controlled gate certain.
- **guardShack = true (uncertain).** Inferred from Costco depot SOP (staffed driver
  check-in booth at the truck entrance) plus the fenced single-throat geometry. A
  distinct booth structure could not be positively resolved in the available imagery;
  listed in `uncertainFields`. `remoteGs` therefore false (also uncertain).
- **dockDoors = 50+.** A ~1M+ sq ft cross-dock; door rhythm and backed-in trailers
  on multiple faces. Overhead door-count estimate ~220.
- **dropArea = 50+, dropYard = true.** Hundreds of unhitched trailers in dedicated
  rows on three sides.

## 4. Yard zones and counts measured

- **perimeter:** 6-vertex oriented ring tracing the fenced building + trailer yards
  → **112.1 acres**.
- **truckGate:** quad at the NW entrance throat off Costco Drive.
- **dropYards:** three rings — NE yard, SE/central yard, SW yard.
- **dockAprons:** two rings hugging the north dock face and a wing face at the
  building's true angle.
- **staging:** the large central maneuvering apron inside the gate (postGateStaging).
- **yardMetrics:** dockDoorCount ~220, trailersVisible ~600, trailerParkingCapacity
  ~750, truckGateCount 1, buildingCount 1, siteAreaAcres 112.1, railServed false
  (rail line in the south buffer does not spur into the yard).

## 5. Classification highlights

`drivewayLong` true (deep internal approach + large apron hold 3+ trucks),
`postGateStaging` true, `fastLaneOpportunity` true (ample unused paved width to add
a bypass lane), `entryExitTogether` true, `urbanRural` Rural (exurban Monroe Twp
setting — golf course, subdivisions, farmland and wooded buffers adjacent),
`shipRcvSeparate` false (one integrated cross-dock), `multipleFacilities` false
(wet depot is a separate building, excluded here), `scale`/`multiStep` false
(none resolved).

## 6. Web findings

Chamber of Commerce and directory listings confirm Dry Depot #175 at 10 Costco Dr
and Wet Depot #265 at 12 Costco Dr as two distinct depots. Panjiva buyer records
list "Costco Depot 175, 10 Costco Drive" as an import consignee. Driver-facing
descriptions emphasize fast in/out, consistent with a high-throughput cross-dock.

## 7. Final confidence

**High** on location, perimeter, dock/drop bands, and the gated/fenced
determination. **Medium** on the guard-shack specifics (booth not pinned in
imagery) and exact lane counts — flagged in `uncertainFields`.
