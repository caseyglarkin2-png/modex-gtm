# Deep-Audit Dossier — idx 21: Hormel Suffolk Plant (Suffolk, VA)

## Facility
- **Name:** Hormel Suffolk Plant — Planters peanut processing
- **Type:** Production Facility
- **Roster address:** 1 Planters St, Suffolk, VA 23434
- **Resolved address:** 245 Culloden St, Suffolk, VA 23434 (historic Planters / Mr. Peanut factory)

## Step 0 — Location resolution
The roster coordinates (36.723019, -76.619984, flagged ROOFTOP) were wrong — they
landed in a residential subdivision roughly 3.5 km west of the actual plant.
Web search identified the Planters processing plant at 245 Culloden St in
downtown Suffolk. The EPA FRS registry (id 110001135762) places the facility at
~36.7244, -76.5803. Satellite confirmed a large multi-building white-roofed
industrial complex running NE-SW through the block, with the iconic Mr. Peanut
statue and curved visitor pavilion on the Culloden St frontage.
**Locked center: 36.72320, -76.58270.**

## Key views
- **Wide (z16-17):** Long industrial complex (~600 m) embedded in dense
  residential street grid; large employee parking lot and retention pond at the
  NE corner.
- **Dock area (z19-20):** Two building faces line a paved internal drive yard;
  ~38 dock doors with many trailers backed in; a tractor visible mid-yard.
- **Truck yard (StreetView 2022 & 2023):** Yard fully enclosed by chain-link
  fence with black privacy slats; XTRA-leased trailers backed into docks; a
  chain-link gate spans the truck drive at the yard's north end.
- **Front entrance (StreetView):** Culloden St frontage has the office/visitor
  entrance with Mr. Peanut statue — not a truck checkpoint.
- **SW end (z17):** A second dock apron and trailer lot at the SW corner with a
  detached support building.

## Gate / Guard / Dock determinations
- **truckGate = true.** The truck yard is fully fenced; a chain-link swing/slide
  gate controls the truck drive entrance. No barrier arm but a clear controlled
  fenced pinch-point.
- **guardShack = false.** No booth structure of guard-shack footprint at the
  truck gate in any satellite or StreetView frame.
- **remoteGs = true.** Gated entry with no guard shack implies kiosk / call-box
  / phone check-in.
- **dockDoors = 25-50.** ~38 doors counted across the two internal-yard faces
  plus the SW apron.
- **dropArea = 10-25.** 10-25 untethered XTRA trailers parked in the internal
  yard and SW lot.

## Yard zones and counts
- **Perimeter:** ~32 acres irregular industrial parcel (long diagonal building).
- **Truck gate:** north end of the internal drive yard.
- **Drop yards:** internal drive yard between buildings; SW corner trailer lot.
- **Dock aprons:** two — east and west faces of the internal drive yard.
- **Metrics:** ~38 dock doors, ~24 trailers visible, ~35 capacity, 1 truck gate,
  4 buildings, no rail spur.

## Web findings
Hormel-operated Planters peanut plant; the historic Mr. Peanut birthplace
factory in Suffolk, VA. ~350+ employees per Hormel's locations page. Long-
established urban factory, not a modern greenfield distribution site.

## Confidence
**High.** Location positively confirmed; gate/guard/dock all backed by clear
satellite + StreetView evidence. Dock-door and capacity counts are honest
overhead estimates (flagged in uncertainFields).
