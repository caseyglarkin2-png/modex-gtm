# Deep-Audit Dossier — Caterpillar Victoria TX Hydraulic Excavator Plant (idx 15)

## Resolved location
- **Roster address was wrong.** Roster gave "203 Holt Rd, Victoria, TX 77905" (geocode
  precision GEOMETRIC_CENTER). That address geocodes to the **HOLT CAT dealership**
  (a Caterpillar equipment dealer with a "CAT / HOLT CAT" pylon sign, confirmed in
  Street View at 28.8405,-96.9078), not the Caterpillar manufacturing plant.
- **Correct facility:** Caterpillar North American Hydraulic Excavator plant,
  **7300 Lone Tree Rd, Victoria, TX 77905** — confirmed via the Victoria Chamber of
  Commerce member listing. The plant is the ~1.1M sq ft tilt-up concrete facility
  (opened Aug 2012, $200M investment) located ~3.3 km WSW of the roster point, just
  SW of Victoria Regional Airport, in the Lone Tree Industrial Park.
- **Locked center:** 28.81950, -96.93750 — the massive modern white-roofed building
  visible at z16-z20 satellite, with two retention ponds, large employee parking, and
  outdoor component laydown consistent with an excavator assembly plant.

## Key views
- z14 airport probe: located Victoria Regional Airport; the plant is on the SW side.
- z16 campus probe (28.8195,-96.9375): full campus — main 1.1M sq ft plant building
  running NW-SE, a second large building to the NW, a third smaller structure SW,
  two retention ponds (one NE, one S), SE employee parking lots.
- z18-z21 probes of the W/SW face: outdoor material/component laydown, trailers
  staged, and a covered dock canopy along the building edge.
- Street View (2023-03, 2024-11): chain-link perimeter fencing around the building;
  a long row of dock doors with trailers backed in on the SW building face; a
  multi-lane divided boulevard (Lone Tree Rd) approach; the office/security wing on
  the SE side with employee parking.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The campus is fully fenced (chain-link visible in SV). Truck
  traffic enters via wide divided internal campus roads from Lone Tree Rd. A
  controlled truck entrance is consistent with a major Caterpillar plant, though no
  barrier arm was positively imaged.
- **guardShack = false / remoteGs = true (LOW CONFIDENCE — flagged).** No staffed
  guard booth was positively confirmed. The small structure at the SW (28.8163,
  -96.9384) that first looked like a booth is, on z21 imagery and SV, a windowless
  utility/electrical building — not a guard booth. remoteGs set true on a
  remote-checkin assumption; both fields flagged uncertain.
- **dockDoors = "10-25".** Street View clearly shows a row of dock doors with
  trailers backed in along the SW building face; counted ~20 from overhead + ground.
- **postGateStaging = true, drivewayLong = true.** Wide internal campus roads and
  large paved aprons give 3+ truck stacking depth inside the property.

## Yard zones and counts
- **Perimeter:** developed/fenced campus, ~161 acres (bounding box 28.8145-28.8235 N,
  -96.9425 to -96.9335 W). The full parcel including buffer land is larger.
- **Drop yard / laydown:** W/NW side of the plant — trailers + component laydown,
  estimated 25-50 trailer-equivalent capacity.
- **Dock apron:** SW building face, ~20 dock doors, trailers backed in.
- **buildingCount = 3** (campus → multipleFacilities = true).
- **railServed = false** — no spur into the property.

## Web findings
- Caterpillar opened the Victoria hydraulic excavator facility in Aug 2012; ~1.1M
  sq ft, $200M investment, ~225+ jobs; subassembly, assembly, painting, final
  inspection of hydraulic excavator models.
- Anchor tenant of the Lone Tree Industrial Park; supplier VictTec sited across the
  street on Lone Tree Rd.
- Address confirmed as 7300 Lone Tree Rd, Victoria, TX 77905 (Victoria Chamber).

## Final confidence: medium
Facility positively identified and located; layout, docks, and campus structure are
clear. Guard-shack / remote-check-in determination could not be positively confirmed
from imagery and is flagged. Dock-door and trailer counts are honest overhead
estimates.
