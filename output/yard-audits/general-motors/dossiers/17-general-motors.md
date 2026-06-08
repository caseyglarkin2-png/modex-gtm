# Deep-Audit Dossier — DMAX (GM diesel), Moraine OH (idx 17)

**Address:** 3100 Dryden Rd, Moraine, OH 45439
**Resolved center:** 39.70505, -84.22185
**Type:** Engine Plant (GM joint venture — Duramax 6.6L V8 diesel)
**Confidence:** High

## Location confirmation
The roster coordinates resolved to the Moraine OH industrial belt. The street
address (3100 Dryden Rd) and web research (GM facilities page, GM Authority,
Dayton Daily News) place the DMAX Ltd diesel engine plant here, built 2001 to
produce the Duramax 6.6L V8. The address is shared historically with the former
GM Moraine Assembly site; that older assembly complex (now Fuyao Glass America)
is a separate building farther south between Kettering Blvd and OH-741. The
building audited here is the engine plant.

Positive ID is unambiguous: Street View on the west perimeter road
(pano `CvcXabIhcUviMHwYg0r22g`) shows the **DMAX logo painted on the building
face**, red dock doors, and a red Duramax-branded tractor parked in the fenced
yard.

## What the key views showed
- **Wide satellite (z16):** one large rectangular plant building center-frame,
  employee parking to the SW, a multi-track rail corridor and solar array to the
  east, residential to the west, Dryden Rd along the north.
- **Tight roof (z18-20):** single very large building (~1,000 ft long axis,
  near N-S with a slight tilt). Loading docks on two faces.
- **East/SE dock face (z19):** a long bank of dock doors with ~8-12 trailers
  backed in, plus a drop yard of trailers parked in marked rows to the south and
  a large solar array beyond.
- **West/SW dock face (Street View, pano CvcXabIhcUviMHwYg0r22g):** red dock
  doors with trailers/tanker backed in behind continuous chain-link fence.
- **North perimeter (Street View, panos AHvJNboPH4NikryDbtI_Wg, sv at
  39.7066,-84.2228):** continuous chain-link fence, internal perimeter road
  inside the fence, trailers parked along the line.

## Gate / guard / dock determinations
- **truckGate = true.** Fully fenced property (chain-link confirmed on N, W and
  along the E/S buffers in every Street View angle). The truck/yard entrance is
  at the NW corner off the Dryden Rd intersection, where the internal loop road
  enters the secured yard.
- **guardShack = false / remoteGs = true (both flagged uncertain).** No staffed
  guard booth at the truck lane was positively visible in satellite or Street
  View; the entrance reads as a fenced/gated checkpoint. Plants at this scale
  often do have a gatehouse, so these two flags are low-confidence.
- **dockDoors = 25-50.** Two physically separate dock banks — a red-doored bank
  on the west/SW face and a row on the east/SE face — give `shipRcvSeparate =
  true`. Estimated total ~34 doors.
- **dropYard = true, dropArea = 25-50.** Dedicated trailer rows: a drop yard SE
  of the building toward the rail/solar buffer, plus trailer rows along the west
  yard. ~24 trailers visible; capacity ~70.
- **postGateStaging = true / drivewayLong = true / fastLaneOpportunity = true.**
  Broad paved aprons inside the fence on the west and south faces, wide internal
  perimeter roads, and a wide NW gate apron leave room to stack trucks and to
  add a bypass/express lane.

## Yard zones measured
- **perimeter:** fenced property ring, ~37.5 acres.
- **truckGate:** NW entrance apron off Dryden Rd.
- **dropYards (2):** SE trailer rows (toward rail/solar); west trailer rows.
- **dockAprons (2):** east/SE dock apron; west/SW dock apron.
- **streetViewMeta:** perimeter pano `AHvJNboPH4NikryDbtI_Wg` (north face, head
  ~180); truckGate pano `CvcXabIhcUviMHwYg0r22g` (NW entrance, head ~135) — the
  frame showing the DMAX-branded building and yard.

## Rail
A multi-track main-line rail corridor runs immediately east of the property, but
a wooded buffer separates it from the fence and no spur is visible entering the
DMAX property. **railServed = false.** (The corridor serves the broader Moraine
industrial area, not necessarily this plant.)

## Web findings
GM facilities page and GM Authority confirm DMAX Ltd, Moraine OH — Duramax 6.6L
diesel engine plant, opened 1999/production 2001, at 3100 Dryden Rd. Fuyao Glass
America occupies the former GM Moraine Assembly building nearby (separate site).

## Final confidence
**High** on identity, fenced perimeter, dual-face docks, drop yards, and Urban
setting. Uncertain only on the guard-shack/remote-gate call and exact lane/door
counts (flagged in `uncertainFields`).

---
**3-line summary**
Gate: YES — fully fenced property, NW truck entrance off Dryden Rd.
Guard shack: NOT CONFIRMED — gated entrance, no booth positively visible
(remoteGs assumed, flagged uncertain).
Confidence: High.
