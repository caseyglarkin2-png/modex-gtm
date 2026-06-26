# Deep-Audit Dossier — idx 46 · Layton Bakery (Bldg 5)

**Facility:** Layton Bakery — Bakery Plant
**Operator:** The Kroger Co. / Smith's
**Address:** 500 N Sugar Street, Bldg 5, Layton, UT 84041
**Resolved center:** 41.06435, -111.98370
**Confidence:** High

## Step 0 — Building confirmation
The supplied coordinates (41.065045, -111.984294) and address point to the large
Kroger/Smith's industrial campus on the 500 N Sugar Street block in Layton, UT.
The campus holds **three distinct facilities**, which had to be separated:

1. **Smith's Distribution Center** — the large solar-paneled building on the north
   of the campus, with long dock bands; carries the "Smith's" wordmark (confirmed
   via Street View on Sugar St, 2022-11).
2. **Layton Bakery (Bldg 5)** — the target. The southern production building mass.
   Positively identified by **flour silos / process tanks on its roof** (visible at
   z20) and its dedicated **north and south angled dock bands**. This is the
   building directly south of the shared truck yard, at 41.06435, -111.98370.
3. **Dairy / process plant** — the building immediately east of the bakery, grey
   roof crowded with heavy rooftop process equipment; a separate operation.

The supplied point landed in the truck-circulation yard just off the bakery's
north dock face. I locked the bakery building center and audited it specifically,
not the DC and not the dairy.

## Key views
- **z16/z17 wide:** Campus structure — DC (north, solar roof) → fan-shaped trailer
  drop yard (middle) → production cluster (bakery + dairy, south). Residential
  subdivisions border the campus to the south and east.
- **z18/z19 bakery:** Two heavy angled dock bands (north face + south face), each
  with ~10-15 trailers backed in. Flour silos on the roof.
- **z20 dock band / point:** Confirms flour silos (circular tanks) on the bakery
  roof bottom-right; angled dock doors with trailers.
- **Street View (Sugar St, 2022-11, pano CgSbthrtbapZsvp6GChSMA):** West campus
  entrance is **open and uncontrolled** — no barrier arm, no gate, no guard booth
  at the public-road property line; only chain-link perimeter fence. Wasatch
  mountains in the background confirm Layton, UT. A north pano shows the "Smith's"
  building wordmark.

## Gate / guard-shack / dock determinations
- **truckGate = false.** The campus access road off Sugar Street is an open paved
  entrance into the yard/parking with no barrier, gate, or pinch-point checkpoint.
- **guardShack = false.** No staffed booth at the entrance. The only small
  freestanding structure inside the yard (~41.0653, -111.9846) is a yard-tractor
  dispatch/maintenance office ringed by yard trucks and employee cars — not an
  entrance checkpoint.
- **remoteGs = false** (no gate exists).
- **dockDoors = 25-50.** Bakery has two dock bands (north + south faces); ~45
  doors estimated, partly obscured by backed-in trailers.
- **shipRcvSeparate = true.** Ship and receive run from physically separate dock
  banks on opposite building faces.
- **dropYard / dropArea = true / 50+.** Large angled trailer drop lot south/SE of
  the bakery plus the fan-shaped shared trailer yard to the north hold 50+ parked
  trailers without tractors.

## Yard zones and counts
- **perimeter:** Bakery (Bldg 5) building footprint incl. north + south dock faces,
  grid-aligned to the campus N-S/E-W; ~24 acres.
- **truckGate zone:** the open Sugar St entrance apron (SV coverage; pano above,
  heading 90 = east into the yard).
- **dropYards:** angled drop lot SE of the bakery + fan trailer yard to the north.
- **dockAprons:** north dock apron strip + south dock apron strip.
- **Metrics:** ~45 dock doors, ~70 trailers visible, ~140 parking capacity,
  1 campus truck entrance, 1 bakery building, ~24 ac, no rail.

## Web findings
- foodbevg.com and OJT.com list "Layton Bakery — The Kroger Co., 500 N Sugar St,
  Bldg #5, Layton UT 84041," a frozen-dough / bakery manufacturing plant.
- Smith's Layton Distribution shares the 500 N Sugar St address (the DC, a separate
  building), confirming the multi-facility campus.

## Final confidence: High
Building identity, gate/guard verdicts, and dock/drop reads are well-supported by
satellite (z16-z20) and 2022-11 Street View. Lane counts, exact door count, scale,
and acreage are honest estimates (flagged uncertain).
