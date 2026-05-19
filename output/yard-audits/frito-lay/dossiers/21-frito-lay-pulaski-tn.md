# Deep-Audit Dossier — Frito-Lay Pulaski TN (idx 21)

## Resolved location
- **Address:** 298 Industrial Blvd, Pulaski, TN 38478
- **Locked center:** 35.21580, -87.06050
- **Confirmation:** Street View (heading 70° from a public-road pano on the west
  side, 2023-07 capture) clearly shows the **Frito-Lay logo** on the plant's
  office building. The geocoded roster coordinates (ROOFTOP, 90 m move) landed
  inside the campus and required no correction. Web search (PotatoPro, Giles
  County Chamber) confirms this as the Frito-Lay Pulaski snack plant
  (chips, extruded snacks, pretzels, tortilla chips).

## What the key views showed
- **Wide satellite (z16-17):** A large multi-building industrial campus.
  Main process plant in the center, a very large finished-goods warehouse on
  the west, additional dock/sawtooth buildings, and a long drop yard to the NW.
  Bounded by woods on the N, W, and E, and open field to the SE.
- **Street View, west public road (Industrial Blvd):** Continuous black
  metal / chain-link perimeter fence runs the full length of the campus.
  Employee parking sits just inside the fence on the office side.
- **NW drop yard (sv16, satellite):** Two long rows of carrier trailers
  (orange/white livery — third-party fleet) plus box trucks, chain-link fenced,
  with a small angled-roof building at the yard entrance.
- **Rail dock building (sv13):** A rail spur crosses the access road and runs
  into the property; trailers are backed into dock doors along this building.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (medium confidence).** The entire campus is enclosed by
  perimeter fence; trucks reach the dock yards and the NW drop yard through
  controlled fenced openings off the internal driveway network. No open,
  uncontrolled driveway straight from the public road to the docks.
- **Guard shack — FALSE / uncertain.** No classic 1-3-vehicle guard booth was
  positively identified at a public-road gate. A small structure sits at the
  drop-yard entrance and may serve as a transportation/check-in office, but it
  could not be confirmed as a staffed guard booth. Flagged uncertain.
- **Remote GS — TRUE (low confidence).** Given a controlled truck entrance with
  no confirmed guard booth, check-in is likely via kiosk / app / office.
- **Docks — "25-50" band (~45 doors estimated).** Dock doors are spread across
  several building faces: the rail-served dock building, the warehouse west/SW
  edge, and a sawtooth dock building. Because these are physically separate
  dock banks, `shipRcvSeparate` is set true.

## Yard zones and counts
- **Perimeter:** the fenced campus, ~52 acres (irregular — the bounding box
  includes wooded buffer; usable industrial footprint is the honest estimate).
- **Drop yard (NW):** large dedicated trailer-storage lot, ~40-55 trailers
  visible, capacity ~70.
- **Dock aprons:** two boxed — the rail dock building apron and the
  sawtooth/warehouse dock apron.
- **Trailers visible:** ~55. **Buildings:** 6+. **Rail-served:** yes.
- **Truck gates:** 1 primary controlled entrance (drop-yard / yard side).

## Web findings
PotatoPro and the Giles County Chamber list this as an active Frito-Lay
manufacturing plant producing chips, extruded snacks, pretzels and tortilla
chips. PepsiCo/Frito-Lay division. No public news on gate operations.

## Final confidence: MEDIUM
Facility identity and overall layout are certain. The truck-gate / guard-shack
determination is the soft spot — the campus is clearly fenced and controlled,
but Street View only covers the west public road and never directly framed a
manned booth, so guard-shack vs. remote check-in is inferred, not observed.
Dock count and ship/receive separation are honest overhead estimates.
