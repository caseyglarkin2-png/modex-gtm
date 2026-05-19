# Deep-Audit Dossier — idx 15

## Performance Foodservice — Pacific Northwest (Portland, OR)

**Facility type:** Broadline Foodservice Distribution Center
**Address:** 19606 NE San Rafael St, Portland, OR 97230
**Resolved coordinates:** 45.53600, -122.46080
**Confidence:** Medium

---

### Location resolution

The roster geocode was GEOMETRIC_CENTER precision (moved 110 m), landing near
the public road north of the facility. Probing satellite z17-z20 around the
point and walking Street View along the adjacent industrial street resolved the
PFG building: the brown/dark-roofed warehouse whose south yard is filled with
**PFG-branded white reefer box trucks** (the outbound foodservice delivery
fleet) parked in characteristic fanned rows. Street View (May 2025) on the
inner street shows a PFG-style blue-and-white tractor parked alongside the
building, and the front office bears a "Pacific…" sign consistent with the
Performance Foodservice — Pacific Northwest branch. Performance Foodservice's
location page and Waze list this as the Pacific Northwest broadline DC.

The site sits inside a dense Gresham / NE Portland multi-tenant industrial
park, bordered by comparable warehouses on all sides.

### Key views

- **Satellite z17-z19:** A mid-size warehouse with docks on the south face,
  fronting a paved truck/staging yard packed with white box trucks. A larger
  warehouse adjoins to the east; smaller warehouses to the west and north.
- **Street View, building side (heading S):** The building's tall metal side
  wall rises above a landscaped bank; a man-door is visible. No gate.
- **Street View, inner street / office (heading N):** An open paved driveway
  leads to the office entrance — no barrier arm, no sliding gate, no guard
  booth. A PFG tractor + reefer is parked curbside.
- **Satellite, yard:** South yard holds ~30 box trucks / trailers in fanned
  rows; pallets staged near the dock apron.

### Gate / guard-shack / dock determinations

- **truckGate = false** — No barrier arm or sliding gate at the truck-yard
  access; the driveway from the public street is uncontrolled. Some perimeter
  fencing exists but there is no checkpoint pinch-point or controlled lane.
  Flagged in uncertainFields — overhead trees partly obscure the SW corner.
- **guardShack = false** — No booth at any entrance.
- **remoteGs = false** — No gate, so not applicable.
- **dockDoors = "10-25"** — Dock bank on the south face; ~22 doors estimated,
  partly hidden behind parked box trucks.
- **dropArea = "25-50"** — South yard full of parked reefer box trucks.
- **drivewayLong = true** — Deep paved yard between the access and the docks.

### Yard zones and counts

- **Perimeter:** ~4.6 acres covering the warehouse and its south yard.
- **Drop yard:** South yard, fanned rows of PFG box trucks.
- **Dock apron:** Strip along the south dock face.
- **Truck gate:** None — left null.
- **Dock doors:** ~22 (medium confidence).
- **Trailers / box trucks visible:** ~30.
- **Rail-served:** No spur into the property.

### Web findings

- Performance Foodservice — Pacific Northwest, 19606 NE San Rafael St,
  Portland, OR 97230; phone (800) 666-8998. Listed as the PNW broadline DC.

### Final confidence: MEDIUM

Building identified by the resident PFG box-truck fleet and a PFG tractor in
Street View, but the geocode was geometric-center grade and the office sign is
only partially legible. The gate call is "false" with moderate confidence —
no checkpoint structure is visible, but trees obscure part of the perimeter.
Dock count is an overhead estimate. Flagged accordingly.
