# Deep-Audit Dossier — idx 24

## DHL Supply Chain — DC — Dallas/Irving TX
**Type:** Distribution Center
**Resolved location:** 5320 W Airport Freeway, Irving TX 75062
**Locked center:** 32.83480, -97.03130
**Confidence:** medium

## Step 0 — Location resolution
The roster entry had no address or coordinates ("contract-logistics DC building
street addresses not publicly enumerated"). Web research (DHL press release,
Supply Chain Dive, WFAA, Commercial Real Estate Direct) identified the marquee
DHL distribution facility in Irving as the **$57.5M, 220,000 sq ft DC at 5320
West Airport Freeway**, opened 2024 (relocated from Grand Prairie). The Google
Geocoding API returned **ROOFTOP** precision for that address. Satellite
probing found a modern distribution building beside SH-183; Street View
confirmed the **DHL red/yellow brand livery** on the building (red horizontal
stripe, yellow office accent).

**Division caveat:** this DC is operated by the **DHL eCommerce** division (a
parcel-sortation facility), not the **DHL Supply Chain** contract-logistics
division. It is, however, the verifiable, well-documented DHL distribution
center matching the roster's "Dallas/Irving" entry — the roster compiler could
not pin a separate DHL Supply Chain street address in Irving. An alternative
DHL Supply Chain / Discount Tire dedicated warehouse exists at 10101 Bonnie
View Rd, but that is in Dallas proper, not Irving. This nuance is recorded in
`fieldNotes` and the audit treats the Irving facility as the resolved site.

## Key views
- **Wide satellite (z17):** A modern single distribution building on a parcel
  bounded by SH-183 / Airport Freeway (north), a creek (west/southwest), and an
  internal loop road (east). Building runs NE-SW, ~280 m × ~100 m.
- **z18-21:** Dock aprons along BOTH long faces — NW (freeway side) and SE
  (truck-court side). z21 satellite shows a continuous perimeter fence
  (regularly-spaced posts) along the SE dock-apron edge.
- **Street View (2024-12):** DHL red-stripe / yellow brand livery on the
  building. A mature tree buffer screens the property from the public loop
  road, limiting a direct view of the truck-court gate.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** The SE truck court is enclosed by a continuous
  perimeter fence, clearly visible in z21 satellite. The entrance-driveway gate
  hardware could not be seen directly (tree buffer) — flagged uncertain — but a
  2024 purpose-built dedicated DHL DC with a fenced court implies a controlled
  gate.
- **Guard shack — FALSE.** No staffed booth visible; modern parcel-sortation
  DCs use kiosk / remote check-in.
- **Remote gate system — TRUE.** Gated court, no guard shack.
- **Dock doors — 50+.** Docks on both long faces of the ~280 m building;
  combined banded estimate 50+. Exact count not resolvable from overexposed
  white-roof satellite — flagged uncertain.
- **Ship/receive separate — TRUE.** Dock banks on two opposite faces, matching
  the documented four-inbound / four-outbound induction-line design.
- **Drop yard — FALSE.** Only a handful of trailers; active dock-position
  trailers, no dedicated trailer-storage lot.

## Yard zones and counts
- **Perimeter:** ~22.7 acres — building + NW apron + SE truck court + loop-road
  frontage.
- **Truck gate:** entrance driveway off the internal loop road into the SE
  truck court.
- **Drop yards:** none.
- **Dock aprons:** NW (freeway-side) and SE (court-side) aprons.
- **Staging:** paved loop road / apron before the court gate (pre-gate).
- **Metrics:** ~55 dock doors (banded 50+), ~12 trailers visible, ~20 trailer
  capacity, 1 truck gate, 1 building, no rail.

## Web findings
- DHL press release (2024): $57.5M investment, 220,000 sq ft, fully owned DC,
  relocated from Grand Prairie, ~150 employees over three shifts.
- Single-level next-generation loop sorter, 24,000 parcels/hour, eight
  induction lines (four inbound / four outbound) — explains the two-face dock
  layout.
- Located ~6 miles from DFW International Airport.

## Final confidence
**Medium.** The building is positively identified by address, ROOFTOP geocode,
and DHL brand livery. The principal uncertainties are: (1) the division nuance
— this is DHL eCommerce, not DHL Supply Chain proper, though it is the
verifiable DHL DC in Irving; (2) the truck-court gate hardware is screened by a
tree buffer (perimeter fence is clear); (3) the dock count is a banded estimate
from overexposed imagery. All flagged in `uncertainFields`.
