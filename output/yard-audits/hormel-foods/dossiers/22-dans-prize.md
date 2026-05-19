# Deep-Audit Dossier — idx 22: Dan's Prize (Long Prairie, MN)

## Facility
- **Name:** Dan's Prize, LLC — Long Prairie Plant (Hormel subsidiary)
- **Type:** Meat Processing Plant
- **Address:** 20 Riverside Dr, Long Prairie, MN 56347

## Step 0 — Location resolution
Roster coordinates (45.975374, -94.865992, RANGE_INTERPOLATED) landed at the SE
corner of the parcel near the Long Prairie River. The actual plant complex sits
just NW of that point. Satellite confirmed a large multi-building meat-processing
campus bounded by the river on the SE. **Locked center: 45.97720, -94.86780.**
Web search confirmed this is the Dan's Prize Long Prairie sous-vide cooked-meat
plant, a Hormel subsidiary (~530 employees across Long Prairie + Browerville).

## Key views
- **Wide (z17):** Multi-building industrial complex on the west bank of the Long
  Prairie River, surrounded by small-town residential and farmland.
- **Plant (z18-19):** Main white-roofed processing building, an attached gray
  building, a separate lower gray-roofed dock building, plus support warehouses;
  large open trailer lots throughout.
- **Dock area (z19):** Trailers backed into docks on the SW face of the lower
  gray-roofed building; clusters of parked trailers across the open yard.
- **StreetView (2014):** The access road runs straight into the campus past a
  green facility sign — no gate, no barrier arm, no guard booth, no perimeter
  fence. A CIMTRAN tractor-trailer sits in the open yard directly off the road.

## Gate / Guard / Dock determinations
- **truckGate = false.** Fully open site — StreetView shows the truck drive
  running uncontrolled from the public road into the yard, no fence or gate.
- **guardShack = false.** No booth structure anywhere on the entry road.
- **remoteGs = false.** No gate, so no remote check-in.
- **dockDoors = 10-25.** ~22 doors counted, scattered across building faces
  (low-confidence — flagged).
- **dropArea = 25-50.** 25-50 untethered trailers parked in the open lots.
- **dropYard = true.** Dedicated open trailer-storage areas distinct from the
  active dock apron.
- **multipleFacilities = true.** Campus of ~5 separate large buildings.

## Yard zones and counts
- **Perimeter:** ~28-acre campus parcel (river-bounded; portion is woodland).
- **Truck gate:** none (`truckGate` geofence null).
- **Drop yards:** open trailer lots NW of the main plant and a southern lot.
- **Dock apron:** SW face of the lower gray-roofed dock building.
- **Metrics:** ~22 dock doors, ~40 trailers visible, ~70 capacity, 1 open
  access point, 5 buildings, no rail spur.

## Web findings
Dan's Prize founded in Long Prairie 1986; acquired by Hormel 1991. Produces
sous-vide cooked beef, ham, turkey and 600+ meat products. Major local employer.

## Confidence
**High.** Location confirmed; the open no-gate / no-guard finding is well
supported by StreetView and satellite. Dock-door and capacity counts are honest
overhead estimates (flagged in uncertainFields). StreetView is from 2014 — the
nearest available — but the open layout is corroborated by current satellite.
