# Deep-Audit Dossier — US PL S Houston Factory (idx 26)

- **Facility:** US PL S Houston Factory
- **Type:** Bottling plant (PL)
- **Operator:** Ozarka / BlueTriton Brands (Primo Brands)
- **Resolved address:** 9351 E Point Dr, Houston, TX 77054
- **Resolved coords:** 29.66880, -95.40480
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Operational status — OPERATIONAL

This was a blank-flag entry on the BlueTriton facility list, flagged for a possible
closure. It is **not closed**. It is the active Ozarka bottling plant + distribution
center in southwest Houston (zip 77054), which Nestle/BlueTriton historically marketed
as its "South Houston" bottling facility (paired with the Pasadena plant). No closure
news exists.

Evidence:
- **Web:** Macrae's Blue Book lists the site as a *manufacturer* that "manufactures
  bottled water." Other directories list it as a bottling water delivery/distribution
  center (~110 staff). Combined bottling plant + DC — consistent with "S Houston Factory."
- **Street View (2022-11):** tall vertical process/storage **silos** behind the
  building (a bottling-plant tell), an active fenced gate with Ozarka-branded signage,
  and multiple tractors + XTRA-lease trailers staged inside the fence.
- **Satellite (2026 Maxar):** trailers backed into the south docks, a full trailer
  drop row along the rail, and pallets of finished product (blue-wrapped water) staged
  in the yard.

## Location resolution

The supplied approximate coords (29.6650, -95.3850) were ~2 km too far east — they
landed at a freeway interchange with a solar field and residential, no industrial use.
Web search resolved the real plant to **9351 E Point Dr, Houston TX 77054** (~29.6688,
-95.4048). Confirmed by satellite (a large fenced industrial building with NW silos, a
south dock face, and a trailer yard) and by Street View showing the Ozarka gate sign
and branded fence panel.

## What the key views showed

- **z17/z18 context:** an inner-loop Houston industrial park threaded by a multi-track
  rail line. The Ozarka complex is the central fenced parcel: main warehouse/bottling
  building with a silo cluster on its NW corner, an attached white-roof production hall
  on the east, a south-face dock apron, and a rail-side trailer drop row.
- **z19/z20 dock view:** a long continuous dock apron along the south face with a
  regular bay rhythm — ~20-24 dock positions, banded **10-25**. Pallets of finished
  product staged in the yard.
- **z20 drop yard:** ~15-18 trailers parked perpendicular without tractors along the
  rail line — a dedicated drop strip, banded **10-25**.
- **Street View (E Point Dr, pano `tW75nXdg5UqvujlvB_OOqA`, 2022-11):** the north
  truck gate — chain-link perimeter, a sliding gate across the truck drive, and
  Ozarka-branded sign panels reading call-box / check-in instructions
  ("Visitor Entrance / Live call box for entry / ...Gate 3"-style). Trucks and XTRA
  trailers staged inside. No guard booth.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE** — fenced perimeter with a sliding gate across the truck drive,
  confirmed in Street View headings 120-135 from the E Point Dr pano.
- **guardShack = FALSE** — no staffed booth at the entrance; the gate carries call-box /
  intercom check-in signage instead.
- **remoteGs = TRUE** — controlled gate with no guard shack → remote (call-box) check-in.
- **dockDoors = 10-25** — ~24 doors counted along the south face (uncertain near the
  upper band edge).

## Yard zones & counts measured

- **perimeter:** ~14 acres, traced around the fenced main complex (silos + main building
  + east hall + internal yard + south drop strip); neighboring warehouse parcels excluded.
- **truckGate:** the north sliding gate off E Point Dr.
- **dropYards:** one ring — the rail-side perpendicular trailer row on the south edge.
- **dockAprons:** one ring — the long south-face dock apron.
- **staging:** none traced separately (the large internal yard functions as postGateStaging).
- **yardMetrics:** dockDoorCount 24, trailersVisible ~26, trailerParkingCapacity ~30,
  truckGateCount 1, buildingCount 2, siteAreaAcres ~14, railServed false (rail runs
  along the south edge but no spur enters the property).

## Web findings

- Macrae's Blue Book: manufacturer, "manufactures bottled water," 9351 E Point Dr 77054.
- Multiple directories: "Ozarka Bottled Water Delivery & Distribution Center," ~110 staff.
- Nestle Waters PR (2019): "South Houston and Pasadena bottling facilities" — two
  distinct Houston-area plants; this is the South Houston one.
- No closure / demolition / sale reporting for the E Point Dr site.

## Confidence

**High** on identification, operational status, and the gate/guard-shack calls (clear
Street View). Uncertain (flagged): exact dock-door count (band edge), entry/exit lane
counts, ship/receive separation, and the building count within the complex vs. adjacent
parcels.
