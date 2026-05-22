# Kraft Heinz — Fremont, OH (deep audit)

**Site:** Kraft Heinz Company, Fremont Plant
**Address (main):** 1200 N 5th St, Fremont OH 43420
**Address (truck / shipping):** 1301 Heinz Drive, Fremont OH 43420
**Resolved center:** 41.3614° N, 83.0920° W
**Truck gate:** ~41.3618° N, 83.0905° W (east side of campus, off N 5th St)
**Archetype hint going in:** #6 (Gate + GS + campus) — but no guard shack was positively resolved; classification flags this as Gate + remote-GS + campus.

## Resolution & confirmation

The approximate point provided (41.3605, -83.0933) sat near the middle of the
campus; web search confirmed the historic Heinz / Kraft Heinz ketchup plant at
1200 N 5th St, Fremont OH. The Fremont plant opened in 1937 and is documented
as producing ~80% of US Heinz ketchup supply.

Satellite probes (z15 → z21) and Street View 2024-05 panoramas along the east
access roads confirmed:

- the historic red-brick main plant with smokestack and "Heinz" lettering on
  the south end (visible from N 5th St);
- the very large modern distribution warehouse on the north end of the campus
  (single roof span ~700 ft x ~250 ft, abutting the US-20 / SR-53 highway);
- the rail spur running north-south through the property between the plant
  and the warehouse (rail tank cars parked on it, visible in Street View);
- the Heinz 57 logo sign and Kraft Heinz Distribution Center signage at the
  truck entrance off Heinz Drive.

The campus sits between the Sandusky River (west) and N 5th St (east); the
US-20 / SR-53 interchange clips the NE corner.

## Imagery captured (in `tmp/`)

Wide:
- `khf-fremont-z17.png`, `khf-fremont-z16.png`, `khf-wide-z15.png`,
  `khf-west-z16.png`
Center / main plant:
- `khf-center-z18.png`, `khf-main-z19.png`, `khf-midwest-z19.png`,
  `khf-mainplant-east.png`, `khf-west-main.png`
Warehouse / drop yard:
- `khf-north-z19.png`, `khf-northbldg-z18.png`, `khf-whse-east-z18.png`,
  `khf-whse-east-z19.png`, `khf-dock-full.png`, `khf-ne-highway-z18.png`,
  `khf-eastapron-z20.png`
Gate area:
- `khf-gate-z19.png`, `khf-gate2-z20.png`, `khf-gate-realz20.png`
Street View along the east access road:
- `khf-sv-west-1.png` (S, employee lot frontage with brick plant + smokestack)
- `khf-sv-west-2.png` (mid, looking onto south end of campus)
- `khf-sv-west-3.png` (mid-north, with Heinz logo on warehouse)
- `khf-sv-northwest.png` (W side of warehouse — long blank façade, fence)
- `khf-sv-north-1.png` (north end of campus, Heinz-branded purple semi visible)
- `khf-sv-trkg1.png`, `khf-sv-trkg2.png`, `khf-sv-gate-close.png`,
  `khf-sv-gate-arm.png`, `khf-sv-mainentry.png` (the truck gate at Heinz Dr)
- `khf-sv-main1.png`, `khf-sv-mid.png`, `khf-sv-eastrd.png` (south plant area,
  flatbed at south dock, rail tank cars on spur)

## Key views

**Truck gate (Heinz Drive @ N 5th St)** — `khf-sv-trkg2.png` and
`khf-sv-gate-close.png`. Wide truck-only driveway turning west off N 5th St
into the campus. Sliding silver metal gates pulled open to either side of the
drive. Orange-painted bollards line both sides of the apron. A tall pole
mounts the iconic Heinz "57" red logo. A separate freestanding sign reads
"Kraft Heinz" with "Distribution Center / Shipping & Receiving / No
Trespassing / 1301 Heinz Drive". A row of multi-coloured trailers — including
distinctive purple Heinz reefer trailers — is parked just inside the gate.
**No staffed guard booth is visible at the inbound lane.** Gate operation
appears remote / automated (kiosk or appointment-based check-in implied).

**Warehouse east dock face** — `khf-whse-east-z18.png`,
`khf-whse-east-z19.png`. Continuous orange/red dock strip running roughly
~700 ft along the east face of the distribution warehouse. Counting bay
rhythm and trailers backed in, the door count lands in the **40+ range on
this face alone**; main plant adds more dock positions on its south and east
faces. Final band: **50+**.

**Drop yard** — `khf-whse-east-z18.png`, `khf-ne-highway-z18.png`. Primary
drop yard sits east of the warehouse: roughly 6 long rows of trailer stalls
holding ~70 trailers at imagery time, with empty stalls (parking
capacity ~100+). A secondary trailer apron along the east side of the main
plant adds ~15-20 more stalls.

**Main plant docks** — `khf-sv-main1.png`. Red brick main plant (1937 era)
with a Heinz logo and smokestack. A white flatbed trailer is backed in at a
south-side shipping dock with a worker in safety vest visible. Chain-link
fence and orange bollards prevent uncontrolled vehicular entry from the
public road.

**Rail-served confirmation** — `khf-sv-eastrd.png` and `khf-center-z18.png`.
Tank cars sit on a north-south rail spur internal to the campus, running
between the main plant and warehouse. The historic Heinz operation has used
rail for inbound tomato/paste receiving; rail-served is true.

**Campus scope** — `khf-fremont-z16.png`, `khf-west-z16.png`. Visible
buildings on the property: historic main plant; admin / welcome center
(distinctive mansard terra-cotta roof, south end); modern distribution
warehouse (north); secondary processing buildings; tomato/paste storage
silos with two large red circular paste tanks; water-treatment ponds south
of the silos. Clear multi-building campus.

## Yard / geofence measurements

- **Perimeter bbox:** S 41.3578, W -83.0945, N 41.3650, E -83.0892.
- **N–S extent:** ~0.0072° × 111,320 ≈ **801 m**.
- **E–W extent:** ~0.0053° × 111,320 × cos(41.36°) ≈ **443 m**.
- **Site area:** ≈ **88 acres**.
- **Truck gate bbox:** S 41.3615, W -83.0912, N 41.3622, E -83.0902.
- **Drop yards:** primary east of warehouse + secondary east of main plant
  (both bbox'd in JSON).
- **Dock aprons:** east face of warehouse + south face of main plant.
- **Staging:** post-gate trailer staging just inside the Heinz Dr gate.

## Yard metrics

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | ~60 | warehouse east ~40 + warehouse south ~5 + main plant ~10-15 |
| trailersVisible | ~80 | ~70 in primary drop yard + ~10-15 at docks/secondary |
| trailerParkingCapacity | ~120 | drop-yard stall capacity counting empty rows |
| truckGateCount | 1 | single primary gate at Heinz Dr |
| buildingCount | ~7 | main plant, warehouse, welcome center, 2 secondary processing, silos cluster, water-treatment |
| siteAreaAcres | ~88 | from perimeter bbox |
| railServed | true | rail spur with tank cars on-site |

## Classification calls (highlights)

- **truckGate: TRUE** — sliding gates + bollards + lane markings + signage
  at Heinz Drive entry. (high confidence)
- **guardShack: FALSE** — no positively identified staffed 1-3-bay booth at
  the inbound lane. Small ancillary structures inside the gate but their
  function isn't a guard booth. (medium confidence — flagged in
  `uncertainFields`)
- **remoteGs: TRUE** — gate present, no guard booth — implies remote /
  automated check-in (kiosk / call-box / appointment).
- **postGateStaging: TRUE** — large paved staging area inside the gate.
- **drivewayLong: TRUE** — long internal approach gate → dock face holds
  3+ trucks easily.
- **fastLaneOpportunity: TRUE** — wide unused paved width at the Heinz Dr
  apron; easy bypass-lane room.
- **dockDoors: "50+"** — warehouse east face alone reaches ~40-50.
- **dropArea: "50+"** — primary drop yard ~70 trailers + secondary ~15-20.
- **shipRcvSeparate: TRUE** — main plant shipping docks separate from
  warehouse distribution docks.
- **multipleFacilities: TRUE** — clear campus with 6+ distinct buildings.
- **dropYard: TRUE** — large dedicated trailer-storage lots.
- **urbanRural: Rural** — Fremont OH small-town setting with farmland
  abutting; campus is edge-of-town.
- **scale: FALSE** — no truck scale positively identified, but flagged in
  `uncertainFields` as a moderate-confidence call.

## Web findings

- Kraft Heinz Fremont opened in **1937** as the first Heinz ketchup plant.
- Produces ~**80% of US Heinz ketchup** supply (bottles + packets).
- ~**1 billion+ pounds of ketchup** per year.
- One of the largest food-manufacturing employers in NW Ohio.
- Truck/shipping mailing address listed publicly as **1301 Heinz Drive** —
  confirms the truck gate is at a separate sign-posted address from the
  main 1200 N 5th St plant address.

Sources:
- [Kraft Heinz Foods Co. — IndustryNet](https://industrynet.com/listing/1068927/kraft-heinz-foods-co)
- [Love Heinz Ketchup? You Have Fremont, Ohio, to Thank — Midstory](https://www.midstory.org/love-heinz-ketchup-you-have-fremont-ohio-to-thank/)
- [Driving directions to Kraft Heinz Company, 1200 N 5th St, Fremont — Waze](https://www.waze.com/live-map/directions/us/oh/fremont/kraft-heinz-company)
- [Heinz factory in Fremont, Ohio — Ohio Memory](https://ohiomemory.org/digital/collection/p267401coll34/id/8688/)

## Confidence

**high** overall. Site identity unambiguous (Heinz signage, smokestack,
historical context, rail spur). Truck gate location and characteristics
positively confirmed via Street View 2024-05. Dock count, drop-yard size,
campus scope, rail-served, and urban/rural classifications are well
supported. Three fields are flagged in `uncertainFields`:

- `guardShack` — no booth resolved at the inbound lane; medium confidence.
- `scale` — no truck scale resolved in imagery; medium confidence
  (negative).
- `buildingCount` — adjacent structures may share roofs and be miscounted
  from overhead.

## 3-line summary

- Gate verdict: **TRUE** — sliding-gate truck entrance at 1301 Heinz Dr off
  N 5th St with bollards, lane markings, Heinz 57 logo signage.
- Guard-shack verdict: **FALSE / remote** — no staffed booth resolved;
  gate operation appears remote / automated (kiosk / appointment).
- Confidence: **high** (with `guardShack`, `scale`, `buildingCount` flagged
  as moderately uncertain).
