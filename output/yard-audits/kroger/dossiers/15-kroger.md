# Deep-Audit Dossier — Kroger Customer Fulfillment Center, Aurora CO (idx 15)

**Facility:** Kroger Customer Fulfillment Center (Ocado-automated CFC)
**Address:** 6125 N Jackson Gap Way, Aurora, CO 80019
**Resolved center:** 39.80755, -104.69228
**Type:** ~300,000 sq ft AI/robotics automated grocery e-commerce fulfillment hub ("The Hive")
**Method:** deep-audit (Maxar satellite z16-z21; Street View checked, no usable coverage)
**Confidence:** high

---

## Step 0 — Location confirmation

Roster supplied 39.807077, -104.691758 (ROOFTOP geocode of the street address).
Satellite at z17 around that point immediately showed a single large white-roofed
industrial building on open prairie at the far-NE edge of Aurora, consistent with a
modern fulfillment center. Web research corroborated: Kroger/Ocado opened this
Denver-metro CFC at 6125 N Jackson Gap Way in March 2023 — a 300,000 sq ft
automated facility (1,000+ bots on a 3D grid), 200+ associates growing to 400+,
serving King Soopers/City Market delivery up to 90 minutes out. This is the Ocado
CFC on Jackson Gap Way, distinct from the King Soopers grocery DC on Tower Rd
(idx 9). The supplied coordinates land on the building; I re-centered the audit on
the developed-pad centroid (39.80755, -104.69228).

Sources: Supermarket News, Kroger IR / PR Newswire, The Shelby Report,
Progressive Grocer (all March 2023 Denver-metro CFC opening coverage).

## What the key views showed

- **z16/z17 overview:** One main building running roughly N-S, set on an open
  ~27-acre developed pad surrounded by farmland/vacant parcels. Truck/van
  operations and loading docks on the WEST face; employee car parking on the EAST.
  A single access driveway connects to N Jackson Gap Way (public road) on the south.
- **z18 east-entry / z20 curb-cut:** The main entrance is a wide, open driveway off
  N Jackson Gap Way with turn-lane markings and landscaped islands. No barrier arm,
  no sliding/swing gate, no guard booth straddling the lane at the property line.
- **z19/z20/z21 west yard:** Rows of white Kroger Delivery refrigerated last-mile
  vans staged in angled stalls, plus drop trailers; loading docks line the building's
  west wall with trailers and vans backed in. One ancillary maintenance/utility
  building and a fenced utility compound sit in the SW operations area.
- **z19 north end:** A trailer/drop strip along the north edge; dock doors continue
  along the upper west face.

## Gate / guard-shack / dock determinations

- **truckGate = false.** The z20 curb-cut frame shows an open entrance: wide apron,
  landscaped islands, turn arrows on the public road, but no gate arm, sliding gate,
  or checkpoint pinch-point. Trucks/vans enter freely from N Jackson Gap Way.
- **guardShack = false** (flagged uncertain). No small staffed booth (1-3-space
  footprint, multi-side windows) beside the entrance lane. The structures near the
  SW operations yard are ancillary maintenance/utility buildings, not an arrival
  booth. Caveat: a high-security Ocado CFC may run access-controlled internal gates
  or app/kiosk check-in not resolvable from overhead, so this is the one call I'd
  flag for human/on-site verification.
- **remoteGs = false** — no truck gate present, so false by rule.
- **dockDoors = "25-50"** (uncertain exact). Docks are consolidated on the long west
  building face; ~10-12 dock positions visible in a single z19 frame, extrapolated
  across the ~700 ft wall into the 25-50 band. shipRcvSeparate = false (single
  consolidated dock bank on one face).

## Yard zones & counts measured

- **perimeter** — 9-vertex oriented ring tracing the developed/fenced pad; shoelace
  area = ~27.3 acres.
- **truckGate** — quad over the open entry apron/drive off N Jackson Gap Way.
- **staging** — approach drive segment between the road and the operations yard.
- **dropYards** (2) — (1) west van/trailer staging lot; (2) north trailer-drop strip.
- **dockAprons** (1) — long thin quad hugging the west dock wall.
- yardMetrics: dockDoorCount 32 (est.), trailersVisible 46 (mostly refrigerated
  delivery vans + drop trailers), trailerParkingCapacity ~90, truckGateCount 1,
  buildingCount 2, siteAreaAcres 27.3, railServed false.

## Street View note

Both nearest panos on N Jackson Gap Way (2016-11 ~170 m E; 2020-11 ~140 m E) return
status OK but PREDATE the 2023 CFC — they show empty prairie, not the facility.
`streetViewMeta.hasCoverage` is therefore set false for both zones (no pano depicts
the built yard; no pano id invented). All gate/dock calls rest on Maxar satellite.

## Web findings

Opened March 2023; Ocado-powered automated CFC ("The Hive", 1,000+ bots); ~300,000
sq ft; serves Denver metro King Soopers/City Market delivery within ~90 min; 200+
associates scaling to 400+; temperature-controlled delivery-van fleet (visible in
imagery as the white box vans dominating the west yard).

## Final confidence: HIGH

Facility identity, location, layout, open-entry gate verdict, and yard zones are
unambiguous from high-res satellite. Lower-confidence items: exact dock-door count
(banded), and whether internal/non-visible access control exists (guardShack flagged
for verification). Street View adds nothing here (pre-construction panos only).
