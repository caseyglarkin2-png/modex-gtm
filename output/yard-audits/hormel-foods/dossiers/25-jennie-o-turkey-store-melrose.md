# Deep-Audit Dossier — idx 25: Jennie-O Turkey Store (Melrose, MN)

## Facility
- **Name:** Jennie-O Turkey Store — Melrose Plant
- **Type:** Meat Processing Plant (turkey)
- **Roster address:** 123 5th Ave E, Melrose, MN 56352

## Step 0 — Location resolution (LOW CONFIDENCE)
This facility could not be positively confirmed. Steps taken:
1. Roster coords (45.675694, -94.807948) for "123 5th Ave E" landed in downtown
   Melrose with no plant present.
2. The largest food-processing complex in Melrose (~45.6705, -94.800) was probed
   in detail; StreetView signage over its main entrance clearly reads
   "LAND O'LAKES Inc." — this is the Land O'Lakes dairy plant, **not** Jennie-O.
3. Web search confirmed the new Jennie-O Melrose plant is a ~300,000-sq-ft,
   $137M facility built 2017-2019, and that the old plant sat across the street
   from the St. Mary church on 5th Ave E.
4. The audited building is the next-largest modern processing plant in town, on
   the NE edge of Melrose by the Sauk River (~45.6763, -94.7942): a large
   single-building plant with numbered truck drive-in bays (1B-5B), dock doors
   with trailers, an E-side trailer drop yard, and a perimeter loop drive. This
   best matches the modern Jennie-O plant profile, but **no Jennie-O signage was
   visible in StreetView**, so the identification remains unverified.

**Locked (provisional) center: 45.67630, -94.79420.**

## Key views
- **Wide (z16):** Large modern single-building plant on the NE edge of town,
  Sauk River to the N, retention pond and a detached SW building.
- **StreetView (2023-2024):** Numbered truck drive-in bays (1B-5B), open paved
  yard, employee parking, a tractor-trailer present; no perimeter fence or gate.
- **Docks/trailers (z19-20):** Dock doors with trailers backed in on the NE
  face; rows of untethered trailers in the E-side drop yard.

## Gate / Guard / Dock determinations
- **truckGate = false (uncertain).** No perimeter fence or gate visible at the
  plant approach in StreetView. Flagged given the location uncertainty.
- **guardShack = false.** No booth at any approach.
- **remoteGs = false.** No gate.
- **dockDoors = 10-25.** ~22 doors (numbered drive-in bays + dock doors); low-
  confidence.
- **dropArea = 10-25.** Untethered trailers in the E drop yard.
- **dropYard = true.** Dedicated E-side trailer-storage rows.

## Yard zones and counts
- **Perimeter:** ~34-acre parcel (provisional).
- **Truck gate:** none identified (`truckGate` geofence null).
- **Drop yard:** E side of the plant.
- **Dock apron:** NE face.
- **Metrics:** ~22 dock doors, ~18 trailers visible, ~35 capacity, 1 open
  access, ~2 buildings, no rail spur.

## Web findings
The Jennie-O Melrose plant is a ~300,000-sq-ft, $137M turkey processing plant
(construction 2017-2019). Hormel later agreed to sell its whole-bird turkey
business, including Melrose, to Life Science Innovations.

## Confidence
**Low.** The facility identity could not be verified by signage; the audited
building is a best-guess match. Gate/guard/dock determinations and all counts
are flagged in uncertainFields. This site is flagged for human review — the
exact Jennie-O Melrose plant location should be confirmed before use.
