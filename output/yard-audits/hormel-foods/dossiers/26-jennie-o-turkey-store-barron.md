# Deep-Audit Dossier — idx 26: Jennie-O Turkey Store (Barron, WI)

## Facility
- **Name:** Jennie-O Turkey Store — Barron Plant
- **Type:** Meat Processing Plant (turkey slaughter + processing)
- **Address:** 34 N 7th St, Barron, WI 54812

## Step 0 — Location resolution
Roster coordinates (45.40239, -91.847592, ROOFTOP) landed directly on the plant.
Identity confirmed by the green Jennie-O logo on the 3-story office building in
StreetView (2024). **Locked center: 45.40240, -91.84680.**

## Key views
- **Wide (z17-18):** Large multi-building turkey-processing complex in the city
  of Barron — dense rooftop equipment, an active rail line running through the
  property, feed-mill silos, a separate warehouse/DC building, extensive trailer
  parking.
- **Docks (z19):** Dock doors with trailers backed in on north and south
  building faces.
- **Trailer yard (z19):** Rows of untethered trailers in a large NE drop yard
  and a S-side yard; 45+ trailers visible.
- **StreetView (2024):** 3-story Jennie-O office building on the south frontage;
  green privacy-slat chain-link fence around the office/employee area; the main
  truck driveway off the public road runs uncontrolled into the plant yard —
  no barrier arm, no gate, no guard booth.

## Gate / Guard / Dock determinations
- **truckGate = false.** The main truck entrance is an open, uncontrolled
  driveway from the public road into the plant yard. Partial perimeter fencing
  exists around the office/yard, but the truck entry itself is open.
- **guardShack = false.** No booth at the truck entrance.
- **remoteGs = false.** No controlled gate.
- **dockDoors = 25-50.** ~40 doors across the multi-building faces (low-conf).
- **dropArea = 25-50.** 45+ untethered trailers in the NE and S drop yards.
- **shipRcvSeparate = true.** Dock banks on separate N/S building faces.
- **railServed = true.** Active rail line runs through the complex with spurs.
- **multipleFacilities = true.** Multi-building turkey campus + feed mill + DC.

## Yard zones and counts
- **Perimeter:** ~37-acre processing campus.
- **Truck gate:** open truck entrance (no control structure).
- **Drop yards:** large NE trailer yard and a S-side yard.
- **Dock aprons:** north and south building faces.
- **Metrics:** ~40 dock doors, ~45 trailers visible, ~80 capacity, 1 open truck
  entrance, ~7 buildings, rail-served.

## Web findings
Jennie-O Turkey Store is a Hormel turkey subsidiary; Barron is one of its major
turkey slaughter + processing plants. (Hormel later agreed to sell its whole-
bird turkey business to Life Science Innovations.)

## Confidence
**High.** Location and identity positively confirmed (Jennie-O signage); the
open no-gate truck entrance is clear in StreetView. Dock-door and capacity
counts are honest overhead estimates, and a truck scale could not be confirmed
— all flagged in uncertainFields.
