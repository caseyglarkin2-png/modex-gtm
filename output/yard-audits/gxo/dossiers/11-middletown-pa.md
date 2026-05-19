# Deep-Audit Dossier — GXO Logistics Distribution Center, Middletown PA (idx 11)

## Facility
- **Name:** GXO Logistics Distribution Center - Middletown PA
- **Type:** Fulfillment Center
- **Address:** 200 Capital Lane, Middletown, PA 17057
- **Resolved coordinates:** 40.20785, -76.74640
- **Maps:** https://www.google.com/maps/@40.20785,-76.74640,400m/data=!3m1!1e3

## Location confirmation
The roster lat/lng (40.207958, -76.747805) landed inside the **Capital Logistics
Center**, a ~1.4M-sq-ft multi-building industrial park on the SE edge of
Middletown PA (Harrisburg metro). Web research (Cushman & Wakefield, LoopNet,
CBRE) confirms 200 Capital Lane is the **~400,060 SF** warehouse/distribution
building GXO operated as an e-fulfillment center (the Saks DTC hub; GXO filed a
WARN closure for this address in 2025). Street View at the Capital Lane entrance
shows the stone "CAPITAL LOGISTICS CENTER" monument sign and a building marked
"100" — Building 100 is the neighboring structure. The roster coordinates sit on
the large dark-roof building immediately east of Building 100, which matches the
400k-SF footprint of 200 Capital Lane. Locked center at the building centroid
40.20785, -76.74640.

## Key views
- **z16/z17 overview:** Roster building is one of several large boxes in the
  logistics park. It is bordered by Capital Lane on the south, an internal
  N-S road on the east, woods on the west, and a second (separate) building to
  its north across a shared truck court.
- **z18/z19 building views:** Single large rectangular building, dark membrane
  roof, ~400k SF. Office and employee parking occupy the SW corner.
- **North dock face (z19):** A continuous bank of dock doors with canopies runs
  the full north wall; ~22 trailers backed in / parked in the truck court.
  Counted ~38 dock doors (approximate).
- **South face (Street View sv3/sv9/sv13):** Employee parking strip and a
  chain-link fence; trailers (Knight, Ryder) visible behind the fence — this is
  the truck-court fence line, not a second dock bank.
- **NE corner (z20):** The north truck court opens onto the internal east road
  via a wide paved apron — no barrier arm, no sliding gate, no guard booth.

## Gate / guard-shack / dock determinations
- **truckGate: false.** The truck court is reached from the internal east road
  through an open paved connection. z20 satellite shows no barrier arm or
  sliding gate across the truck lane. The Capital Lane park entrance is also
  open. Chain-link fencing rings the truck court but the vehicular access is
  uncontrolled.
- **guardShack: false.** No 1-3-vehicle-footprint booth at any entrance in z20
  satellite or in Street View. The monument-sign entrance is unstaffed.
- **remoteGs: false.** No gate, therefore no remote check-in inference.
- **Docks: "25-50".** ~38 dock doors counted along the single north face;
  regular bay rhythm, canopied, many trailers present. On-park Building 100 is
  documented at 39 doors, supporting the count.
- **Drop yard: yes / dropArea "10-25".** The deep north truck court doubles as
  trailer storage; ~22 trailers parked, capacity ~40.

## Yard zones and counts
- **perimeter:** whole property — building + north truck court + south parking
  strip. ~312 m N-S x ~459 m E-W ≈ **35.4 acres**.
- **truckGate zone:** NE corner open apron where the truck court meets the
  internal east road.
- **dropYards:** the north truck court (one box).
- **dockApron:** the strip in front of the north dock doors.
- **staging:** none distinct outside the gate; null.
- **yardMetrics:** dockDoors ~38, trailersVisible ~22, capacity ~40, 1 truck
  gate, 1 building, 35.4 acres, no rail.

## Web findings
- Capital Logistics Center: ~1.4M SF Class A park owned by Colony Industrial,
  at the I-76/I-283/I-83/I-81 confluence near Harrisburg.
- 200 Capital Lane = ~400,060 SF; GXO ran a Saks DTC e-fulfillment operation
  here and filed a WARN closure (~April 2025). Building remains; audit reflects
  the physical site regardless of current tenancy.

## Confidence
**High.** Facility positively identified; imagery clear at z18-z20. The two
flagged uncertain fields are the exact dock-door count (estimate ~38) and
truckGate (open access — confident it is uncontrolled, but flagged because the
internal road lacked Street View coverage to triple-check for a swing gate).

**3-line summary:**
- Gate: NO truck gate — open paved access from internal road, fence but no barrier.
- Guard shack: NO — no booth at any entrance.
- Confidence: HIGH.
