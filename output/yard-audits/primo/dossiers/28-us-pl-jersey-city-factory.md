# Site 28 - US PL Jersey City Factory

- **Type:** Bottling plant (PL) - in practice a Nestle Waters / BlueTriton **ReadyRefresh distribution + light-manufacturing branch**
- **Resolved location:** 111 Thomas McGovern Dr, Jersey City, NJ 07305 (APN 06-21507-0000-00001)
- **Center:** 40.70050, -74.05950
- **Maps:** https://www.google.com/maps/@40.70050,-74.05950,400m/data=!3m1!1e3
- **OPERATIONAL VERDICT: CLOSED / VACATED** (high confidence on closure; low confidence on the layout fields)
- **Confidence:** low

## Operational status (the #1 question)

This is the long-standing Nestle Waters North America / ReadyRefresh Jersey City
address (phone 201-451-4000), a ~50-year-old, **3.4-acre / ~65,715 sqft** industrial
building Nestle had **leased since 2008**. The evidence points to it being **closed
and (partly) vacated**:

1. **Yelp lists "READYREFRESH - CLOSED"** at 111 Thomas McGovern Dr (listing updated
   June 2026).
2. **~19,500 SF listed for sublease** at the address - the tenant is offloading space
   it no longer needs.
3. **Primo Brands has closed 49 facilities** since the Nov-2024 Primo/BlueTriton merger
   and is actively consolidating the ReadyRefresh last-mile delivery network. A small
   urban metro delivery branch is exactly the kind of node that gets consolidated.

**Building is standing, NOT demolished.** Satellite (©2026 Airbus/Maxar/Vexcel) still
shows the warehouse intact with vehicles in the yard, but that imagery vintage almost
certainly predates the wind-down. **Street View (Oct-2025 and Apr-2026, recent)** shows
the perimeter being repurposed: NYK shipping containers stacked along the W/NW chain-link
fence (third-party container storage) and sleeper-tractors parked as overflow on the
marshy E access road - signatures of a closed branch with the lot sublet/repurposed.

Conclusion: treat as a **CLOSED Primo/BlueTriton site**. The yard asset still physically
exists, but it is not an active YardFlow-relevant operating bottling plant.

## How I confirmed the location

Coordinates were not supplied. Web search tied the "Nestle Waters Jersey City" plant to
111 Thomas McGovern Dr 07305. LoopNet / CIMLS confirm a 3.4-acre, ~65,715 sqft, ~50-year
warehouse fully leased to Nestle Waters since 2008. I pinned the rectangular white-roof
warehouse at ~40.70050,-74.05950; my traced **perimeter computes to 3.41 acres
(shoelace)**, matching the recorded 3.4-acre parcel almost exactly - strong confirmation
this is the right building.

On the "Bottling plant (PL)" type: in dense urban Jersey City this is a distribution /
home-and-office-delivery branch with light water handling (a stainless water silo/tank is
visible beside the building), not a spring bottling plant. Type label kept as supplied.

## What the key views showed

- **z17/z18 wide:** dense multi-tenant industrial district; the much larger **Sysco** DC
  sits immediately SE. The subject is the central white-roof warehouse.
- **z19/z20 building:** rectangular warehouse rotated ~10-15deg off north. South face is
  the dock bank (trailers + box trucks backed in). SW lot packed with diagonal rows of
  small white **ReadyRefresh route box-trucks/vans** (a last-mile delivery fleet yard).
  Trailers staged along the E fence.
- **z21 south dock:** 53ft trailers staged end-to-end along the south wall + a row of
  route box-trucks - confirms the south dock bank.
- **Street View (2025-10, 2026-04):** full chain-link perimeter with privacy slats; open
  rolling gate openings off the shared private streets; **NYK containers** stacked along
  the NW fence; **overflow sleeper-tractors** on the E marsh road. No staffed guard booth
  anywhere. A water silo/tank visible at the building.

## Gate / guard-shack / dock determinations

- **truckGate: true (low conf).** Fenced lot entered via chain-link sliding/rolling gates
  off the surrounding private industrial street. No barrier-arm checkpoint resolvable, but
  a controlled fenced-yard entrance exists. Moot if the site is now closed/sublet.
- **guardShack: false.** No booth-sized structure at any entrance in satellite or Street
  View. Self-managed urban fenced lot.
- **remoteGs: true.** Per the rubric: gate present, no guard shack -> implies
  keypad/buzzer/self check-in.
- **Docks: 10-25.** South face shows ~12-18 dock positions with trailers/box trucks
  staged. Single bank -> shipRcvSeparate false.
- **backupSensitive: true.** Gate opens onto narrow shared private streets in a dense
  district (Sysco next door); a queue would spill onto the shared road. drivewayShort
  (1-2 truck approach).

## Yard zones and counts (from pre-closure imagery)

- **Perimeter:** 4-corner ring, ~3.41 acres - matches the 3.4-acre parcel.
- **Dock apron:** thin quad along the south building wall.
- **Drop yard:** south/SW staging - mix of ~10-18 OTR 53ft trailers plus 30-40 small
  ReadyRefresh route box-trucks (the branch's delivery fleet, not drop trailers).
- **yardMetrics:** dockDoorCount ~16, trailersVisible ~18 (OTR only), trailerParkingCapacity
  ~30, truckGateCount 1, buildingCount 1, siteAreaAcres 3.4, railServed false.

## Web findings

- 111 Thomas McGovern Dr 07305, APN 06-21507-0000-00001; ~65,715 sqft / 3.4 acres;
  leased to Nestle Waters since 2008 (LoopNet / CIMLS).
- Yelp "READYREFRESH - CLOSED" at this address (updated June 2026).
- ~19,500 SF on sublease at the address.
- Primo Brands (post Nov-2024 merger) has closed 49 facilities and is consolidating the
  ReadyRefresh network.

## Final confidence

**Low** overall. **High confidence the site is CLOSED/vacated**; low confidence on the
yard-layout fields because the only available overhead imagery predates the closure and
ground coverage is limited to the surrounding streets. All layout/gate/dock fields plus
operationalStatus are listed in `uncertainFields`.
