# Deep-Audit Dossier — Smucker Plant, Havre de Grace MD (idx 11)

## Resolved location
- **Roster input:** "1601 Pulaski Hwy, Havre de Grace, MD 21078" — geocoded to 39.535468, -76.116224.
- **Problem found:** That point lands on a long narrow strip building on Pulaski Hwy (US-40) that reads as retail/strip commercial, not a manufacturing plant.
- **Resolution:** Web search for the Smucker Havre de Grace plant returned the real address **340 Old Bay Lane, Havre de Grace MD 21078** (operating names: Smucker Quality Beverages / Smucker Natural Foods Inc — fruit/juice canning & bottling, portion-control type products). Listed coordinates ~39.5307, -76.1085.
- **Confirmed building:** Satellite probes at 39.530705, -76.108505 show a mid-sized industrial/manufacturing building (~50k sq ft footprint) with a full rooftop solar array on its southern half, process tanks/silos at the NE corner, dock doors with trailers on the SE face, and a perimeter loop driveway. Consistent with a food/beverage plant. **Locked center: 39.5305, -76.1085**, ~640 m SE of the geocoded point.

## Key views
- **z16 context:** Edge-of-town industrial park on the SE outskirts of Havre de Grace; cultivated farmland immediately to the south; several other large industrial buildings in the same park (distinct parcels).
- **z17/z18 overview:** Single plant building, roughly square, with a paved perimeter drive looping the whole property. Employee parking on the N/NE. A separate large white distribution warehouse sits to the east; a separate building with a CFI trailer at dock sits to the NW.
- **z19/z20 tight:** Rooftop solar covers the south roof. NE corner has process silos/tanks and a small outbuilding. SE/S building face carries the dock doors with ~7 trailers visible backed in or parked nearby.
- **Street View (Old Bay Ln, 2019-09):** Panos cluster on Old Bay Lane adjacent to the *neighboring* NW building (CFI trailer at its dock) — coverage does not extend to the Smucker plant itself. The neighboring building's driveway is an open, uncontrolled entrance; chain-link fencing runs along property lines; a propane/tank farm is visible between properties.

## Gate / guard-shack / dock determinations
- **truckGate: false** — No barrier arm, sliding/swing gate, or checkpoint pinch-point visible where the plant's driveway meets the access road (satellite z20). The perimeter loop connects to an open industrial-park intersection. Chain-link fencing exists on property lines but the truck lane is uncontrolled. *Low-confidence caveat:* Street View never reached the plant entrance, so this rests on satellite alone — flagged in uncertainFields.
- **guardShack: false** — No 1-3-vehicle-footprint booth beside any entrance. The only small structure is an NE-corner outbuilding by the tank farm, not an entry booth.
- **remoteGs: false** — No gate, so no remote check-in.
- **dockDoors: 0-10** — ~9 dock doors on the SE/S face, several occupied by trailers.
- **dropArea: 0-10** — A handful of untethered trailers along the SE apron and NE corner; no dedicated marked drop lot.

## Yard zones and counts
- **Perimeter:** whole fenced parcel, ~244 m N-S × ~232 m E-W ≈ **14 acres**.
- **Dock apron:** one apron strip along the SE building face.
- **Drop yards / staging:** none clearly delineated — left null/empty.
- **Metrics:** dockDoorCount ~9, trailersVisible ~7, trailerParkingCapacity ~8, truckGateCount 1, buildingCount 1, railServed false.

## Web findings
- Operating entity: Smucker Quality Beverages / Smucker Natural Foods Inc, 340 Old Bay Lane. Listed as fruit/vegetable/specialty canning and juice bottling. Facility footprint reported around ~48,800 sq ft. Employee counts in directories conflict (a few staff to several hundred) — directory data unreliable, not used for classification.

## Final confidence
**High.** Building positively identified and re-located from a wrong roster address; layout, docks, and absence of any gate/booth are clear in satellite imagery. Gate/guard-shack flagged uncertain only because Street View did not reach the plant; satellite evidence is consistent with an open, unguarded site.

- Gate verdict: NO truck gate (open driveway)
- Guard-shack verdict: NO guard shack
- Confidence: high
