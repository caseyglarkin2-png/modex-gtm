# Deep-Audit Dossier — idx 14

## Niagara Bottling - Plainfield IN

- **Type:** Bottling / Manufacturing Plant
- **Roster address:** 1250 Whitaker Rd, Plainfield, IN 46168
- **Roster coords:** 39.683721, -86.349861 (geocode ROOFTOP, movedMeters unknown)
- **Locked coords:** 39.68500, -86.34900
- **Confidence:** medium

## Step 0 — Location resolution

The geocoded coordinate lands on a road intersection inside a dense Plainfield
logistics park (the AllPoints / Anson industrial area near Indianapolis
International Airport). The park holds many near-identical grey-roofed spec
warehouses with mixed addresses — a FedEx building two lots away reads "1399
South Perry Rd", confirming Whitaker Rd and S Perry Rd are distinct streets.

The audited building is the long N–S grey-roofed warehouse on the **west side
of the pin**, whose office and check-in driveway front Whitaker Rd directly at
the pin intersection. Web research confirms Niagara's Plainfield plant is
442,215 sq ft at 1250 Whitaker Rd. No on-building Niagara signage was readable
in available Street View panos, so building identification is medium-confidence
(supported by the address geocode, the office-driveway alignment, and the
controlled-entry feature consistent with a beverage plant).

## Steps 1–5 — What the imagery showed

- **Wide / tight satellite:** A long N–S warehouse. Office and employee parking
  at the SE corner; dock face and trailer yard along the W side. The roof is
  grey spec-warehouse style (no obvious heavy rooftop process equipment, which
  lowers identification confidence somewhat).
- **Dock face:** A long dock line runs the W side, with many trailers backed
  in — estimated ~50–70 doors → band **50+** (exact count low-confidence).
- **Drop yard:** Marked trailer-parking stalls along the W edge hold ~35
  trailers; capacity ~80 → `dropArea = 25-50`, `dropYard = true`.
- **Truck gate / guard shack:** The entrance driveway off Whitaker Rd has a
  **controlled-entry setup** — a small blue kiosk/booth beside the drive lane,
  a digital sign monument, a fence/gate across the lane, and traffic cones in
  the entry lane (seen in 2024 Street View). **truckGate = true.** The gate
  structure is small (≈1 parking-space footprint), more consistent with an
  unmanned check-in kiosk / call-box than a staffed multi-window guard booth →
  classed **remoteGs = true, guardShack = false**. The kiosk-vs-booth call is
  low-confidence and flagged in `uncertainFields`.
- **Staging:** No pre-gate staging. Deep entry drive and W-side dock apron give
  3+ truck post-gate stacking → `drivewayLong`, `postGateStaging`.
- **Web findings:** Niagara Plainfield, 442,215 sq ft at 1250 Whitaker Rd; a
  ~$6.1M expansion was planned to add production capacity and ~8 jobs.

## Yard zones & counts

- **Perimeter:** ~30 acres.
- **dockDoorCount:** ~58 (estimate, band 50+).
- **trailersVisible:** ~35.
- **trailerParkingCapacity:** ~80.
- **truckGateCount:** 1 (controlled driveway off Whitaker Rd).
- **buildingCount:** 1 (office integrated at SE corner).
- **railServed:** false — no spur into the property.

## Final confidence

**Medium.** The truck-gate determination is confident (a clear controlled
entry with kiosk, gate, and signage). The guard-shack-vs-kiosk distinction and
the exact building identification both carry residual uncertainty — the park is
full of look-alike spec warehouses and no Niagara signage was readable.

### 3-line summary
- Gate verdict: YES — controlled entry off Whitaker Rd (kiosk, gate, signage).
- Guard-shack verdict: NO staffed booth; small kiosk → remote check-in (remoteGs).
- Confidence: medium (gate confident; building ID and kiosk/booth call uncertain).
