# Deep-Audit Dossier — idx 12

## KDP Coffee Roasting Plant — Castroville CA

**Type:** Manufacturing - Coffee
**Resolved location (best effort):** 11480 Commercial Pkwy, Castroville, CA 95012 — `36.757300, -121.740100`
**Gate verdict:** No controlled truck gate (low confidence) · **Guard shack:** None · **Confidence:** Low

## CRITICAL FINDING — facility is defunct
Web research is unambiguous: the **Keurig Green Mountain Castroville, CA manufacturing and
distribution center closed permanently on July 3, 2017.** All 183 employees were laid off, Keurig
offered transfers to its East Coast plant, and the facility's equipment was sold at public online
auction starting September 22, 2017 (sources: CoffeeTalk, Vending Market Watch, Center for Jobs,
mychamplainvalley, KRON4). KDP has **no active operations** in Castroville. The roster's source
note ("one of six KDP US coffee roasting facilities") is outdated — this facility should not be
counted as an active KDP yard.

## Location resolution
The roster gave 10711 Cara Mia Pkwy (36.7593, -121.7436). Step-0 probes showed that point lands
in the Castroville industrial park but not on a confirmed Keurig building. The best-documented
former Keurig address from business listings is **11480 Commercial Pkwy, Castroville CA 95012**
(geocoded 36.7570, -121.7385). Satellite imagery of that area shows a mid-size warehouse with
faint rooftop markings plus adjacent warehouse units. The former Keurig DC has since been
subdivided / re-tenanted, and 2024 Street View shows lease/sale signage on the buildings — so the
exact original Keurig footprint cannot be confirmed.

## Key views
- **Wide (z16/z17):** Castroville industrial park bordered by agricultural fields to the north
  and east; a rail line runs diagonally through the park.
- **11480 Commercial Pkwy (z19):** A gray-roofed warehouse with rooftop markings and an adjacent
  paved yard; a larger warehouse with a dock apron and a few trailers sits immediately east.
- **Street View (2024):** Buildings show "For Lease / Sale" signage — consistent with the
  facility no longer being a single-tenant KDP operation.

## Gate / guard-shack / dock determinations
All determinations are LOW confidence because the site is defunct and re-tenanted:
- **truckGate = false:** Open warehouse forecourt off Commercial Pkwy; no barrier arm, gate, or
  checkpoint visible.
- **guardShack = false:** No booth structure visible.
- **dockDoors = "10-25":** ~14 doors estimated on the warehouse east apron.
- **dropArea = "0-10" / dropYard = false:** A modest paved yard; a handful of trailers visible,
  no dedicated drop lot.

## Yard zones and counts
- **Perimeter:** ~4.5 acres around the 11480 Commercial Pkwy building cluster.
- **truckGate zone:** the forecourt off Commercial Pkwy (no actual gate structure).
- **dropYards:** one paved yard area east of the building.
- **dockAprons:** one apron on the warehouse east face.
- **staging:** none identified.
- **yardMetrics:** ~14 dock doors, ~6 trailers visible, ~20 trailer capacity, 1 truck access,
  2 buildings, ~4.5 acres, not rail-served (rail line passes through the park but does not spur
  into this parcel).

## Web findings
- Keurig Green Mountain owned the Castroville warehouse from 2010; closed it July 3, 2017.
- 183 jobs lost; equipment auctioned. Decision favored the company's East Coast coffee plants.

## Final confidence
**Low.** The facility is defunct as a KDP site, the precise original building footprint cannot be
confirmed (re-tenanted, stale roster address), and all classification fields are best-effort
estimates from current imagery. Flagged for human review — recommend dropping this entry from the
active KDP yard list.
