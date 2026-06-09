# Yard Audit Dossier — Kroger Customer Fulfillment Center, Monroe OH (idx 12)

**Facility:** Kroger Customer Fulfillment Center (Ocado-automated "shed")
**Address:** 6266 Hamilton Lebanon Rd, Monroe, OH 45050 (Butler County)
**Resolved center:** 39.44755, -84.40615
**Method:** deep-audit (Maxar 2026 satellite + Google Street View 2025-07 + web)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied approximate coordinates (39.447326, -84.406393) landed on the
target building. Web research confirms 6266 Hamilton Lebanon Rd is Kroger's
first U.S. Ocado-powered Customer Fulfillment Center, a ~335-375k sq ft
automated "shed" (~$55M, opened spring 2021, ~400 jobs, "The Hive" robotic
grid). The address geocodes to 39.445723, -84.406538 — the south parking edge
of the centered building. The neighboring large buildings (a bigger DC to the
NE, another to the E) are separate properties; the audited building is the
mid-frame one whose south frontage matches the address pin. Locked center at
39.44755, -84.40615.

## Key views

- **Wide z16/z17:** isolates the CFC from the two neighboring big-box DCs.
  Building is a single large rectangle rotated ~15-20° clockwise from north,
  long axis NNW-SSE.
- **Full-footprint z17 (39.44755,-84.40615):** docks/trailers on the EAST
  face only; large employee + delivery-van lot to the south; fenced screened
  equipment enclosure at the SE building corner; storm-water pond SE; tree
  line / drainage ditch on the west; continuous white perimeter wall/fence.
- **East-face z20:** ~18-22 dock positions with trailers backed in, plus
  separate marked angled drop-trailer rows further east.
- **Entrance z19-z21 + Street View (pano BrJGvc6qhrNY6H6je0-_nw, 2025-07):**
  divided-boulevard entry off Hamilton Lebanon Rd with a landscaped median and
  a monument sign at the median nose. No barrier arm, gate, or booth at the
  property line.

## Gate / guard-shack / dock determinations

- **truckGate: FALSE.** The truck entrance is an open divided boulevard off
  Hamilton Lebanon Rd. Street View at the mouth (2025-07) and 2026 satellite
  show no barrier arm, no sliding/swing gate, and no checkpoint pinch-point at
  the property line — vehicles flow straight in. There is a continuous white
  perimeter wall/fence and internal one-way painted-lane circulation around
  landscaped islands, but the entry itself is uncontrolled. Matches the
  "#3 No Gate / No GS" baseline archetype.
- **guardShack: FALSE.** No staffed booth at the entrance. The small white
  ancillary building in the SE yard sits beside a fenced screened equipment
  enclosure (refrigeration/generator/solar grid) — a maintenance/utility
  structure, not a multi-window guard booth at a gate.
- **remoteGs: FALSE.** No controlled gate exists, so remote-guard logic does
  not apply. (An automated CFC of this type schedules docks via app, but no
  kiosk/call-box is visible to assert remote check-in.)
- **dockDoors: 10-25.** ~18-22 dock positions counted along the single east
  face; no separate ship/receive banks (shipRcvSeparate false).
- **dropArea / dropYard: 25-50 / true.** Two-plus marked angled trailer-stall
  rows east of the building hold ~25-35 drop trailers, separate from the
  active dock apron.

## Yard zones and counts

- **perimeter** — 6-vertex oriented ring tracing the fenced/developed parcel
  (west ditch line, north access-road curve, east past the drop rows to the
  pond, south road frontage). ~41 acres of the ~68-acre parcel.
- **truckGate** — small quad over the entrance boulevard throat at the road
  (uncontrolled, but the geofence marks where a gate WOULD sit).
- **dockApron** — long thin rotated quad hugging the east building wall at the
  building's ~15-20° angle.
- **dropYard** — rotated quad over the east marked trailer rows, parallel to
  the trailer lines.
- **staging:** null (no distinct pre-gate staging; interior yard serves as
  post-gate holding → postGateStaging true).
- **yardMetrics:** dockDoorCount 22, trailersVisible 18, capacity ~30,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~41, railServed false.

## Setting

Edge-of-town / rural: two-lane Hamilton Lebanon Rd with open farmland directly
across the road; industrial-park-on-farmland fabric, not dense metro →
urbanRural Rural. Not isolated (adjacent DCs, town nearby) → connectivityIssue
false.

## Web findings

- Kroger/Ocado CFC, 6266 Hamilton Lebanon Rd, Monroe OH; first-of-its-kind
  U.S. automated grocery fulfillment "shed", ~335-375k sq ft, ~$55M, ~400
  jobs, 90-mile delivery radius, "The Hive" 1,000+ bot robotic grid. Heavy
  last-mile delivery-van operation (confirmed by rows of vans in the south
  lot), with conventional inbound truck docks on the east face.

## Final confidence: HIGH

Building identity, setting, gate/guard verdicts, and overall layout are
unambiguous. Low-confidence items flagged: exact dockDoorCount and
trailerParkingCapacity (overhead estimates) and remoteGs (no gate to qualify).
