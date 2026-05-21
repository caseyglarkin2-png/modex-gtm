# Deep-Audit Dossier — idx 22

## Coca-Cola UNITED — Chattanooga Production Plant, TN

**Facility type:** Bottling / Manufacturing Plant
**Resolved location:** ~35.09230, -85.25300 — 4000 Amnicola Hwy, Chattanooga, TN 37406
**Confidence:** Medium

## Location resolution
The roster supplied address "2111 Polymer Dr" with coordinates
(35.045885, -85.193159). That point did not match the production plant. Web
research clarified that Coca-Cola UNITED operates two Chattanooga sites:
- **4000 Amnicola Hwy** — the **Chattanooga Coca-Cola Production Center**
  (bottling/manufacturing plant; the world's first Coca-Cola bottling franchise).
- **2111 W Shepherd Rd** — a separate $67M distribution center / regional
  headquarters.

The roster's "2111 Polymer Dr" conflates the "2111" number from the Shepherd Rd
DC with a wrong street. Since the roster type is "Bottling / Manufacturing
Plant," the correct target is the **production plant at 4000 Amnicola Hwy**
(Coca-Cola UNITED Chattanooga-2 location page; Google Maps place pin
35.0923, -85.2532). Satellite probing showed a large industrial bottling
complex on the Tennessee River, and Street View confirmed Coca-Cola script
branding on the building facade plus a "TRUCK DELIVERY" wayfinding sign.

## Key views
- **Wide satellite (z16-17):** Large building cluster between Amnicola Hwy
  (north) and the Tennessee River (south/east). Office wing fronts Amnicola Hwy
  with employee parking; the production/warehouse building fills the core; a
  trailer drop yard sits on the south side.
- **Tight satellite (z18-20):** West and south building faces are dock banks
  with trailers backed in (~35 doors estimated). South-side drop yard holds
  ~30 trailers in rows.
- **Street View (Amnicola Hwy):** Coca-Cola script + red branding on the
  building facade; "TRUCK DELIVERY" directional sign confirms a separate truck
  route from the visitor entrance.
- **Street View (west-side road):** The truck/dock yard is enclosed by
  chain-link fencing with gate sections; a tractor and trailers backed into
  docks are visible inside the fence.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (flagged uncertain):** The truck/dock yard is enclosed by
  chain-link fencing and trucks enter the fenced yard via a gated opening off
  the internal west-side road. The main visitor entrance off Amnicola Hwy is an
  open driveway, but the operational truck yard is fenced/gated. Flagged
  uncertain because the gate hardware is partly tree-obscured in Street View.
- **Guard shack — FALSE:** No standalone staffed booth seen at the truck-yard
  gate.
- **Remote GS — TRUE:** Gate present without a staffed booth implies
  kiosk/remote check-in (flagged uncertain alongside truckGate).
- **Docks — 25-50 band:** ~35 dock doors estimated across the west and south
  building faces.

## Yard zones & counts
- **Perimeter:** Coca-Cola property between Amnicola Hwy and the Tennessee
  River — roughly 19 acres.
- **Drop yard:** South-side trailer-parking area, ~30 trailers visible,
  estimated ~50-trailer capacity — dropYard true, dropArea 25-50.
- **Dock apron:** West and south building faces where trailers back in.
- **Staging:** Internal paved staging/parking area between the gate and the
  docks — postGateStaging true, drivewayLong true.
- **Buildings:** Production/warehouse building + office wing + support buildings
  (equipment refurbishment center / shop) — multipleFacilities true.
- **Rail:** No rail spur — railServed false.

## Web findings
- Coca-Cola UNITED Chattanooga Production Center, 4000 Amnicola Hwy — the
  world's first Coca-Cola bottling franchise; produces/distributes 400+
  beverages.
- 2111 W Shepherd Rd is a distinct $67M Coca-Cola distribution center and
  regional HQ that opened 2016 (Chattanooga Times Free Press).

## Final confidence
**Medium.** Identity, layout, dock count, and drop yard are confidently
established. The truck-gate / remote-check-in calls are TRUE but flagged
uncertain because the gate hardware is partly obscured by trees in Street View.
