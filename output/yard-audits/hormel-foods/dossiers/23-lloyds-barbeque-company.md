# Deep-Audit Dossier — idx 23: Lloyd's Barbeque Company (Mendota Heights, MN)

## Facility
- **Name:** Lloyd's Barbeque Company — Mendota Heights Plant (Hormel-owned)
- **Type:** Production Facility (fully-cooked BBQ meats — shredded pork/chicken/
  beef, ribs)
- **Address:** 1455 Mendota Heights Rd, Mendota Heights, MN 55120

## Step 0 — Location resolution
Roster coordinates (44.86629, -93.170877, ROOFTOP) landed on/adjacent to the
correct building. Satellite confirmed a single large white-roofed meat-
processing plant with extensive rooftop refrigeration/processing equipment, an
adjacent trailer yard, and employee parking in the Mendota Heights industrial
park beside I-494. Web search confirmed Hormel ownership and the 1455 Mendota
Heights Rd address. **Locked center: 44.86640, -93.17050.**

## Key views
- **Wide (z17-18):** Single plant building with a trailer yard to the NE; sits
  in a dense suburban office/industrial park, I-494 along the NW edge.
- **Roof (z20):** Heavy processing/refrigeration equipment confirming a cooked-
  meat plant.
- **Dock area (z20):** Dock doors on the NE face with trailers backed in; a
  paved apron between the building and the trailer rows.
- **Trailer yard (z20):** Rows of untethered white trailers parked NE of the
  plant.
- **StreetView (2021-2022):** Open, landscaped frontage along Mendota Heights
  Rd — no perimeter fence, no gate, no barrier arm, no guard booth. A separate
  office building with a "for lease" sign to the SE is a neighboring property.

## Gate / Guard / Dock determinations
- **truckGate = false.** Open site: the truck yard, dock apron and employee
  parking form one continuous paved lot with no perimeter fence or controlled
  entrance. (StreetView lacks road access into the truck yard, so a low-
  likelihood internal gate cannot be fully ruled out — flagged in
  uncertainFields.)
- **guardShack = false.** No booth on any frontage or in the yard.
- **remoteGs = false.** No gate, no remote check-in.
- **dockDoors = 10-25.** ~14 doors on the NE plant face (low-confidence).
- **dropArea = 10-25.** 10-25 untethered trailers in the NE yard.
- **dropYard = true.** Dedicated trailer-storage rows distinct from the apron.

## Yard zones and counts
- **Perimeter:** ~12-acre industrial-park parcel.
- **Truck gate:** none (`truckGate` geofence null).
- **Drop yard:** NE trailer-storage area.
- **Dock apron:** NE face of the plant.
- **Metrics:** ~14 dock doors, ~16 trailers visible, ~24 capacity, 1 open
  access point, 1 building, no rail spur.

## Web findings
Lloyd's Barbeque Company founded 1978, Mendota Heights; owned by Hormel Foods.
Produces fully-cooked shredded BBQ meats and ribs. Small workforce per
public listings (food-manufacturing site).

## Confidence
**High.** Location confirmed; the open no-gate / no-guard layout is well
supported by satellite and StreetView. Dock-door count is an honest overhead
estimate and `truckGate` carries a minor caveat (no StreetView into the yard) —
both flagged in uncertainFields.
