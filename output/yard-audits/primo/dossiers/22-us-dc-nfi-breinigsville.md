# US DC NFI - Breinigsville - Deep Audit Dossier

**idx 22 | slug `us-dc-nfi-breinigsville` | type DC/Warehouse | Breinigsville, PA 18031**
**Resolved center: 40.57480, -75.63780 (555 Nestle Way - the 1.045M SF Nestle Distribution Center)**
**Method: deep-audit | Confidence: high**

---

## 1. Location resolution & disambiguation

The supplied coords (40.5340, -75.6290) landed ~5 km SW in Breinigsville
farmland/residential and were city-level only. The target is the Nestle Way
industrial complex between I-78 and Route 100, west of Allentown. Google
geocoding (ROOFTOP) resolved every relevant building:

| Address | Coords | What it is |
|---|---|---|
| 200 Nestle Way | 40.5676, -75.6361 | NFI DC (has an NFI facility-profile PDF) |
| 405 Nestle Way | 40.5732, -75.6315 | BlueTriton / Deer Park **direct** (384,575 SF, 1995) |
| **555 Nestle Way** | **40.5742, -75.6387** | **1.045M SF Nestle Distribution Center (1994); "Nestle Distribution Center Truck Entrance"; supports Nestle Waters / BlueTriton / Purina** |
| 910 Nestle Way | 40.5673, -75.6493 | small NFI cross-dock (34,701 SF, 47 doors) |
| 860 Nestle Way | 40.5710, -75.6474 | Anex Warehouse & Distribution |

**Building chosen: 555 Nestle Way.** This is the large Nestle DC near the
I-78/I-476 junction called out in the research lead, the documented "Nestle
Distribution Center Truck Entrance," and the building with the only full-scale
truck yard on the campus. NFI is the 3PL operating the BlueTriton (Deer Park,
405 Nestle Way - immediately adjacent) distribution out of this DC, so 555 is
the best match for "NFI DC serving BlueTriton near 405/555 Nestle Way."

NFI also operates separate, smaller buildings on the campus (200 and 910 Nestle
Way). If "NFI-leased" is read strictly to the building on NFI's own facility
profile, **200 Nestle Way** is the alternative - flagged in `uncertainFields`
for human confirmation of the exact lease-to-building mapping. The audit was run
on 555 because it carries the real, large truck yard a DC audit needs.

Imagery: Airbus/Maxar satellite (z15-z19) + Google Street View along the private
Nestle Way boulevard (panos captured 2025-05).

---

## 2. What the key views showed

- **z15/z16 complex overview** - a cluster of very large warehouses. The 555
  building is the white-roof structure paralleling I-78, long axis WSW-ENE
  (rotated off north), with a continuous north dock bank and a huge east-end
  trailer yard.
- **z18 NW crop** - the north wall is a continuous bank of dock doors with
  trailers backed in along its full length; a checkpoint/canopy sits at the NW.
- **z19 NW gate crop** - a chevron-striped pinch-point funnels the truck drive
  into a covered **check-in canopy** at the building's NW face, with a paved
  driver-parking/turnaround loop just outside (pre-gate staging).
- **z18/z19 east-yard crops** - the east end is a dedicated **trailer drop yard**:
  herringbone rows of ~100-130 trailers (white, orange, green) with no tractors,
  served by its own controlled entrance with a small **guard booth** beside the
  lane (z19 east-control crop, ~40.5745,-75.6362).
- **Street View (Nestle Way)** - a tree-lined private boulevard rings the south
  and east; the warehouse wall, dock trailers, and a property sign are visible
  through the screen of trees. Interior/north zones have no drive-in coverage.

---

## 3. Gate / guard-shack / dock determinations

- **truckGate = TRUE (high).** Two controlled truck entrances: (a) NW chevron
  pinch-point into a check-in canopy at the north docks; (b) SE/east entrance
  into the drop yard. Both off the private boulevard, screened by a double tree
  line. `truckGateCount = 2`.
- **guardShack = TRUE (high).** A small booth (1-2 vehicle footprint) with its
  own checkpoint pad sits beside the east drop-yard lane; the NW entrance shows a
  check-in canopy/booth at the building face. `remoteGs = false`.
- **entryExitSeparate = TRUE / entryExitTogether = FALSE.** Two distinct
  entrances at different property-line points split inbound/outbound. Which is in
  vs out is not certain from imagery.
- **dockDoors = "50+" (~90).** Nearly the full ~700 m north face is dock bays
  with trailers backed in, plus east-face docks - consistent with a 1.045M SF DC.
- **dropArea = "50+" / dropYard = TRUE.** East-end herringbone trailer lot,
  ~100-130 trailers, distinct from the north dock apron.
- **fastLaneOpportunity = TRUE.** Wide gate aprons and unused paved width at both
  entrances leave clear room for an express/bypass lane.
- **shipRcvSeparate = TRUE (medium).** Two dock clusters on different faces
  (north bank + east face) imply split ship/receive; function unconfirmed.
- **scale = FALSE (uncertain).** No weigh pad clearly resolved.
- **railServed = FALSE.** No spur into the property.

---

## 4. Yard zones & counts measured

- **perimeter** - 8-vertex oriented ring tracing the 555 parcel inside the fence:
  north dock apron + I-78 setback, the east drop-yard bulge, the south edge along
  Nestle Way, and the west end. ~58 acres.
- **truckGate** - rotated quad over the NW check-in canopy/chevron pinch-point.
- **dropYards** - one ring over the east-end herringbone trailer lot.
- **dockAprons** - two quads: the long north dock apron (parallel to the north
  wall) and the east-face dock apron.
- **streetViewMeta** - perimeter (pano `u5xt7RtM_dCCYm9-0W5pMw`, heading 28),
  truckGate (pano `VpxxFVHr7AVKu2n1eh5IEA`, heading 327), dropYard
  (pano `D6oKl5Qc_B4yqMp2ebyOwA`, heading 90) - all real Nestle Way panos
  (2025-05) looking toward each zone; interior zones lack drive-in coverage.

**yardMetrics:** dockDoorCount ~90, trailersVisible ~130, trailerParkingCapacity
~150, truckGateCount 2, buildingCount 1, siteAreaAcres ~58, railServed false.

---

## 5. Web findings

- 555 Nestle Way = a 1.045M SF distribution center built 1994 near the
  I-78/I-476 junction, supporting Nestle, Nestle Waters and Nestle Purina;
  listed/known as the "Nestle Distribution Center (Truck Entrance)."
- 405 Nestle Way = BlueTriton / Deer Park direct (formerly Nestle Waters North
  America), 384,575 SF, built 1995 - immediately adjacent, the brand this DC
  serves.
- NFI operates 3PL distribution across the campus, with its own building profiles
  at 200 Nestle Way and a smaller cross-dock at 910 Nestle Way (47 doors).

---

## 6. Final confidence

**High.** Building positively identified by ROOFTOP geocode + satellite +
web corroboration; gate, guard shack, dock band, and drop yard all read clearly
from z18/z19 imagery and Street View. Residual uncertainty: exact NFI
lease-to-building mapping (555 vs 200), in/out lane assignment, ship/receive
function split, pre-gate staging, and presence of a truck scale - all flagged in
`uncertainFields`.

**3-line summary**
- Truck gate: TRUE - two controlled entrances (NW chevron check-in canopy + SE/east drop-yard entrance).
- Guard shack: TRUE - manned booth at the east drop-yard lane + NW check-in canopy.
- Confidence: high. Center 40.57480, -75.63780. Docks 50+ (~90). Audited 555 Nestle Way (the 1.045M SF Nestle DC).
