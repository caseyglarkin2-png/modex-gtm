# Deep-Audit Dossier — Creative Contract Packaging (Aurora, IL) — idx 10

**Account:** Hormel Foods
**Facility type:** Production Facility (contract packaging — House of Tsang sauces, HERB-OX bouillon, puddings/gelatins, private-label)
**Resolved location:** ~2001 Bilter Rd area, NE Aurora, IL 60502
**Locked center:** 41.80475, -88.27090
**Confidence:** medium

## Step 0 — Location resolution
Roster gave the address "2001 Bilter Rd, Aurora IL 60502" with coordinates
(41.806642, -88.267623). The roster point itself lands on a residential strip.
~250 m south, on a N-S road in the same 60502 (NE Aurora) zip area, sits a
large warehouse/packaging facility with an attached office annex and a sizable
trailer yard — the only facility matching a contract-packaging operation near
the roster pin. Hormel's own materials state CCP operates **two** Aurora
facilities; the web-listed address (3777 Exchange Ave, zip 60504, SW Aurora)
is the other one. The roster's zip 60502 and Bilter Rd reference both point to
NE Aurora, so this building (~41.8047, -88.2709) was audited as the
roster-intended site.

## Key views
- **Wide z16:** Building sits on the developing NE edge of Aurora — farm fields
  to the west/north, residential to the west, and a large retail/mall complex
  immediately south.
- **z18 plant:** Large gray-roofed warehouse/packaging building with a
  white-roofed office annex on the NW; a canopy/carport equipment shelter on
  the NE; employee parking on the NW.
- **z19/z20 yard:** Fenced truck yard wrapping the east and south of the
  building. South yard holds a row of ~20+ parked trailers; additional trailer
  rows along the east. East building face has trailers backed into a dock bank.
- **Street View (captured 2024-05):** Chain-link fence around the truck yard.
  Trailers branded for outside fleets — Penske rental, beverage brands
  (Gatorade/Pepsi) — consistent with a contract-packaging logistics operation.
  No guard booth or barrier arm visible.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE (medium confidence).** The truck yard is enclosed by
  chain-link fencing, but the driveway entrances are open gate gaps with no
  barrier arm and no staffed booth. No controlled checkpoint identified.
- **Guard shack: FALSE.** No booth at any entrance. The NE canopy is an
  equipment shelter, not a guard booth.
- **Remote GS: FALSE** — no gate, not applicable.
- **Docks:** East building face has a dock bank with trailers backed in;
  estimated ~14-18 doors visible plus additional doors. Total estimated
  **10-25** band (~22). Estimate from overhead imagery.
- **Drop yard: TRUE.** Large trailer drop yard — south-yard row of ~20+
  trailers plus east-side rows. `dropArea` 25-50 band.
- **Ship/Rcv separate: FALSE** — dock activity concentrated on the east face.

## Yard zones and counts
- **Perimeter:** ~278 m (N-S) × ~149 m (E-W) ≈ **10.2 acres**.
- **Truck gate zone:** open driveway entrance off the road (NE).
- **Drop yards:** south-yard trailer row and east-side trailer rows.
- **Dock apron:** east-facing dock apron.
- **dockDoorCount ≈ 22, trailersVisible ≈ 40, trailerParkingCapacity ≈ 55.**
- **buildingCount 2** — main warehouse/packaging building + attached office
  annex; one integrated facility.
- **railServed FALSE** — no rail spur into the property.

## Web findings
Creative Contract Packaging (CCP) was started by Hormel Foods in 1998 and
employs 120+ people. It blends, bottles, and packages House of Tsang sauces,
HERB-OX bouillon, private-label puddings/gelatins, seasoning mixes, and Hormel
Health Labs products. Hormel notes CCP runs two Aurora production facilities.

## Final confidence: medium
The facility was located by reconciling the roster pin (residential strip) with
the nearest matching warehouse/packaging building. Confidence is medium because
(1) CCP runs two Aurora sites and the roster's "2001 Bilter Rd" could not be
exactly verified against this building, and (2) the gate/guard-shack call rests
on satellite plus peripheral Street View — no booth or barrier arm was seen but
the entrance is partly tree-screened. The dock-door count and the urban/rural
call (metro-edge setting) are also flagged in `uncertainFields`.
