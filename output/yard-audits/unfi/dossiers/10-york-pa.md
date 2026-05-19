# UNFI — York PA DC (idx 10)

**Roster address:** "York, PA" (city-level only)
**Resolved address:** 225 Cross Farm Lane, York, PA 17406 — Greenspring
Industrial Park
**Resolved center:** 40.06860, -76.77470
**Confidence:** High

## Location resolution
The roster carried only city-level coordinates (39.961066, -76.72696) — these
landed in **downtown York**, dense urban fabric with no DC, and the roster note
itself flagged "street address not pinned down — city-level only" (movedMeters
673). The roster also mislabeled it "legacy SuperValu mid-Atlantic DC."

Research corrected both points. The UNFI York Distribution Center is at
**225 Cross Farm Lane, York PA 17406**, in Greenspring Industrial Park
(Conewago Township, York County, NE of York city). Confirmed by warehouse.ninja
("UNFI York Distribution Center"), a LoopNet / JLL property listing
("225 Cross Farm Lane — UNFI York, PA Distribution Center"), TruckMap, and the
**2008 UNFI investor-relations press release** announcing a new **675,000 sq ft**
facility in Greenspring Industrial Park with "Pick-to-Voice" fulfillment,
expected to open end of 2008 and employ 350. This is therefore a **legacy-UNFI**
build (pre-SuperValu acquisition), not a SuperValu inheritance — the roster note
was wrong on that point. Note: the separate roster idx 2 (Manchester PA) is a
different, newer 1.3M sq ft DC ~15 minutes away; idx 10 is the older York site.

## Site layout
- **One large rectangular DC building**, ~675,000 sq ft, oriented roughly
  N–S, dark roof.
- **Dock doors** wrap the **west face** (trailers backed in along its full
  length), the **north face** (continuous dock bank with trailers), and the
  **east face** (dock doors with trailers). One continuous dock complex.
- **Trailer drop yard** — a large dedicated lot at the **north end** of the
  building, full of parked trailers in marked rows.
- **Office + employee parking** at the **south end** — a multi-level car lot in
  a teardrop loop fed by Cross Farm Lane.
- The site sits in farmland/woods with a residential subdivision to the SE.

## Gate / guard-shack determination
- **truckGate: false.** Street View on Cross Farm Lane (2012 and 2023) shows
  the building set back behind a grassy berm with an **open-campus access
  driveway** and a turnaround near the office. There is **no barrier arm and no
  sliding/swing gate** at the public road, and none visible where the internal
  driveway opens onto the truck/dock yard. Open-campus archetype.
- **guardShack: false.** No small staffed booth (1–3-vehicle footprint) found at
  the property entrance, the office turnaround, or the truck-yard mouth in
  z19–z20 imagery. Flagged uncertain only because a booth could sit inside the
  truck yard out of a clean overhead line of sight — but none is visible.
- **remoteGs: false** — no gate, so remote check-in does not apply.

## Docks & yard
- **dockDoors: 50+** — roughly 110 dock doors estimated across the north, east
  and west faces; appropriate for a 675k sq ft DC. Exact count uncertain from
  overhead imagery.
- **dropArea: 50+** — the north-end drop yard holds well over 50 trailers in
  marked rows; clearly a dedicated drop-yard operation (`dropYard: true`).
- **postGateStaging: true** — wide dock aprons plus the north drop yard give
  ample internal queuing room.
- **drivewayLong: true** — long internal access driveway wrapping the building
  to the truck side.
- **fastLaneOpportunity: true** — the internal truck driveway and dock apron are
  notably wide with unused paved width; physical room to add an express lane.
- **shipRcvSeparate: false** — one continuous wrap-around dock complex, not two
  physically separate ship/rcv banks.
- **scale: false** — no truck scale identified.
- **railServed: false** — no rail spur enters the property.

## Setting
**Rural.** Greenspring Industrial Park is an edge-of-town development among
farmland and woods NE of York city; cellular coverage is adequate (industrial
park, not isolated), so `connectivityIssue: false`.

## Web findings
Legacy-UNFI east-coast DC, opened 2008 with Pick-to-Voice order fulfillment;
serves the mid-Atlantic. Indeed lists 115+ employee reviews for "UNFI, York PA."
Per UNFI/SuperValu network context, this region also includes the newer
Manchester PA DC (idx 2) and Carlisle PA DC (idx 3) — consistent with the
"fewer, larger, more automated" consolidation pattern described in the Bushway
dossier; the older York site is a candidate for absorption/consolidation.

## Final confidence: High
Location resolved unambiguously to a confirmed UNFI-named address despite the
roster's city-level coordinate. Gate/guard-shack calls are clear (open campus,
no checkpoint). Residual uncertainty is limited to exact dock-door count, lane
counts, and the small chance of an in-yard booth — all flagged in
`uncertainFields`.
