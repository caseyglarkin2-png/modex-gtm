# Deep-Audit Dossier — Smith's Grocery Distribution Center, Layton UT

**Account:** The Kroger Co. (Smith's Food & Drug division) · roster idx **11**
**Type:** Grocery Distribution Center
**Address:** 500 N Sugar St, Layton, UT 84041
**Resolved center:** 41.0648, -111.9838
**Maps (satellite):** https://www.google.com/maps/@41.06480,-111.98380,400m/data=!3m1!1e3
**Method:** deep-audit (satellite + Street View) · **Confidence: HIGH**

---

## Step 0 — Location confirmation

The roster coordinates (41.065045, -111.984294, GEOMETRIC_CENTER) landed
directly inside a large multi-building industrial campus. Satellite at z16-z18
showed a sprawling distribution complex: solar-roofed warehouses to the north,
extensive trailer drop yards and a large employee lot in the center, and
refrigerated/warehouse buildings to the south.

Identity was positively confirmed in Street View along the N Sugar St frontage:
the white-and-red warehouse carries the **"Smith's"** wordmark on its west wall,
and **Smith's-branded 53' trailers** are parked along the fence. Web research
(Waze, Chamber of Commerce) corroborates "Smith's Layton Distribution, 500 N
Sugar St" as a 24-hour Kroger-division DC. Right building, right operator.

**Bounds:** West = N Sugar St (office frontage); North = open field then the
campus warehouses; East = the BNSF/UTA rail corridor running diagonally NE-SW;
South = a residential subdivision (975 West neighborhood).

---

## Key views

- **z16/z17 overview** — full campus: ~6 distinct large buildings, two big
  trailer drop yards, hundreds of cars in employee lots, dock-door rows on
  multiple building faces.
- **Sugar St Street View (2022-11), several headings** — west frontage is
  chain-link fenced with parked Smith's trailers; the **main yard entrance**
  (~41.0651, -111.9858) is a **wide OPEN paved driveway**. Looking straight east
  down the drive: no barrier arm, no sliding/swing gate, no staffed booth across
  the lane. Employee parking (fenced) on the left, a fenced landscaped strip on
  the right, open pavement into the yard. A small reddish sign/structure sits
  beside the drive but is not a multi-window guard booth.
- **Secondary south driveway** (~41.0635) — open office/shop access, also no
  gate; leads to a tan office building and the SW maintenance/shop yard.
- **Dock close-ups (z19)** — continuous dock-door rows with trailers backed in
  along the north warehouses' south faces and the south refrigerated building;
  rooftop refrigeration equipment confirms a cold/grocery DC.
- **Drop-yard close-up (z19)** — dozens of trailers in marked rows in the
  central yard plus a second south yard; very large staging footprint.

---

## Gate / guard-shack / dock determinations

- **truckGate: FALSE** — the truck entrance off N Sugar St is an uncontrolled
  open driveway (Street View, multiple frames). Perimeter is fenced but the
  entry lane has no barrier. Matches the "No Gate / No GS" archetype.
- **guardShack: FALSE** — no staffed booth astride the entry lane in any frame.
- **remoteGs: FALSE** — no gate exists, so remote check-in flag does not apply.
- **dockDoors: "50+"** — well over 100 doors across the multi-building campus
  (estimate ~130); long bays with trailers backed in confirm active docks.
- **dropArea / dropYard: "50+" / true** — two dedicated trailer-storage lots,
  ~220 trailers visible, ~350 capacity.
- **shipRcvSeparate: TRUE** — separate dock banks on the north grocery
  warehouse vs the south refrigerated building.
- **postGateStaging: TRUE**, **drivewayLong: TRUE**, **backupSensitive: FALSE**
  — large interior paved yard absorbs inbound queues on-site; nothing stacks
  onto Sugar St.
- **multipleFacilities: TRUE** — ~6 distinct large buildings.
- **urbanRural: Urban** — Layton/SLC metro industrial fabric, residential to S.

---

## Yard zones & counts (traced)

- **perimeter** — 6-vertex ring following the fenced campus: W along N Sugar St,
  N across the warehouse tops, E down the rail corridor, S along the residential
  edge. ~**58 acres**.
- **truckGate** — quad over the open main entry apron off N Sugar St.
- **dropYards (2)** — central trailer yard + south trailer yard.
- **dockAprons (1)** — long thin quad hugging the dock face of the north
  warehouses where trailers back in.

| Metric | Value |
|---|---|
| dockDoorCount | ~130 |
| trailersVisible | ~220 |
| trailerParkingCapacity | ~350 |
| truckGateCount | 2 (both open) |
| buildingCount | ~6 |
| siteAreaAcres | ~58 |
| railServed | false (mainline adjacent, no clear spur in) |

**Street View metadata:** truckGate & perimeter both keyed to road pano
`CgSbthrtbapZsvp6GChSMA` on N Sugar St (headings 95° / 101° aimed into the yard)
— the frame a driver sees on arrival.

---

## Web findings

- Smith's Layton Distribution, 500 N Sugar St, Layton UT 84041; 801-552-3600;
  listed as open 24 hours (Chamber of Commerce, Waze, Indeed employee reviews).
- Smith's is a Kroger banner; this is the division's regional grocery DC.

## Uncertain fields

- `scale` — no weigh pad resolved (left false).
- `railServed` — mainline rail abuts the E edge; no spur clearly enters the
  yard, so false but flagged.
- `truckGateCount`, `trailerParkingCapacity` — overhead estimates.

**Final confidence: HIGH** — building identity certain (Smith's wordmark), gate
status clearly readable as open/uncontrolled in 2022 Street View, dock and yard
scale unambiguous in tight imagery.
