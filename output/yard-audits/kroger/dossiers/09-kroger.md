# 09 — King Soopers Grocery Distribution Center, Aurora CO

**Facility type:** Grocery Distribution Center (Kroger / King Soopers, operated under the Advantage Logistics / Windigo banner)
**Address:** 1933 Tower Rd, Aurora, CO 80011
**Resolved center:** 39.74440, -104.77750
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

---

## Location confirmation (Step 0)

The supplied coordinates (39.744719, -104.77703) landed squarely inside a large
multi-building industrial campus on the west side of Tower Rd. Satellite probes
at z15–z18 showed a contiguous fenced distribution complex with four large
warehouse buildings, banks of dock doors, and extensive trailer drop yards —
exactly consistent with a grocery DC, not an office or unrelated property.

Web research corroborates: this is the **King Soopers / Kroger Aurora
Distribution Center** at 1933 Tower Rd, a ~650,000 sq ft (originally) automated
DC opened in 2006 supplying dry grocery and general merchandise to King Soopers,
City Market, Dillons and Kroger stores across multiple states. This is the
**Tower Rd grocery DC**, distinct from the Kroger/Ocado CFC on Jackson Gap Way
elsewhere in Aurora (roster idx 15). Location locked.

---

## What the key views showed

- **Wide satellite (z15–z16):** One large fenced campus bounded by Tower Rd on
  the east, Smith Rd to the south, an industrial road to the north, and a
  drainage corridor / residential edge to the west. Four major DC buildings:
  a north building (white + tan roof, rooftop solar = the automated DC),
  a central DC, a very long south DC (the largest footprint), and a smaller
  warehouse at the south end.
- **Gate close-up (z19–z20):** The main truck entrance off Tower Rd shows a
  clear checkpoint — a guard booth between channelized lanes, painted hatched
  islands, gate posts and pedestrian crossings.
- **Street View (Tower Rd pano @ 39.74490, -104.77424, captured 2023-05):**
  Ground truth of the gate. A **brick masonry guard house** with wraparound
  windows, a peaked roof and a camera/comms mast on top sits between the inbound
  and outbound lanes. **STOP signs** face both directions, **yellow jersey-barrier
  islands** channel traffic into lanes, and a tractor-trailer (McKinney) is
  captured passing through. The DC buildings and dock doors are visible behind.
- **Drop-yard / dock probes (z18–z19):** Large trailer drop lots along Tower Rd
  and between buildings (hundreds of trailers), plus long dock-apron strips with
  trailers backed in along the building faces.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled entrance: guard booth between channelized
  lanes, STOP signs both ways, barrier-island pinch-point where the drive meets
  Tower Rd. Not an open driveway.
- **guardShack = true.** A permanent brick guard house with multi-side windows
  and a rooftop camera mast, set beside/between the gate lanes — a classic
  staffed booth, separate from the main building.
- **remoteGs = false.** A staffed booth is present, so this is not a remote /
  kiosk check-in.
- **entry/exit together = true.** One gate complex on Tower Rd serves both
  directions (booth flanked by an in lane and an out lane). entryLanes ~1,
  exitLanes ~1 (flagged uncertain).
- **fastLaneOpportunity = true.** Wide paved gate apron and barrier-defined
  lanes leave room to add an express/bypass lane.
- **dockDoors = 50+.** Multiple full-size DC buildings, each with long banks of
  dock doors on opposing faces; campus total in the hundreds.
- **dropArea / dropYard = 50+ / true.** Dedicated trailer-storage lots full of
  parked trailers, separate from active dock staging.
- **shipRcvSeparate = true.** Dock banks on opposite faces of the big DC
  buildings indicate physically separate shipping/receiving clusters.
- **multipleFacilities = true.** A campus of four large DC buildings under one
  fenced King Soopers/Kroger operation.
- **postGateStaging = true, drivewayLong = true.** Deep interior apron between
  the gate and the docks holds a long truck queue.
- **urbanRural = Urban.** Inside the Denver–Aurora metro fabric.
- **scale = false, multiStep = false.** No truck scale or second checkpoint
  stage visible.
- **railServed = false (uncertain).** A through rail corridor runs along the
  north edge but no spur enters any building.

---

## Yard zones & counts measured

- **perimeter:** 9-vertex polygon enclosing all four DC buildings and their
  yards; ~**102.2 acres**.
- **truckGate:** rotated quad over the Tower Rd booth/checkpoint.
- **dropYards (3):** the Tower Rd east drop lot, the north-side trailer rows,
  and the south-end drop lot.
- **dockAprons (3):** long thin strips hugging the south DC's north and south
  dock faces and the central DC's north dock face.
- **streetViewMeta:** only one pano exists within range (the Tower Rd gate,
  2023-05); used for both perimeter (heading 250) and truckGate (heading 302).
- **yardMetrics:** dockDoorCount ~320, trailersVisible ~240, capacity ~420,
  truckGateCount 1, buildingCount 4, siteAreaAcres 102.2, railServed false.
  Counts are honest overhead estimates.

---

## Web findings

- King Soopers / Kroger Aurora DC, 1933 Tower Rd, 24/7 operation.
- Opened 2006 as Kroger's second automated DC (~650,000 sq ft at open; the
  campus has since expanded with additional buildings and large trailer yards).
- Serves City Market, Dillons, King Soopers and Kroger banners across ~6 states;
  operated under the Advantage Logistics / Windigo Logistics structure.

---

## Final confidence: HIGH

Facility positively identified and corroborated by web sources. Gate and guard
shack confirmed by direct Street View ground truth. Dock/drop/campus calls are
clear from high-zoom satellite. Lane counts and rail-service are the only
soft fields (flagged in uncertainFields).
