# Deep-Audit Dossier — Nabisco Aurora Sales & Distribution Center, Aurora CO (idx 10)

## Facility
- **Name:** Nabisco Aurora Sales & Distribution Center - Aurora CO
- **Type:** Sales / distribution center
- **Roster address:** Aurora, CO 80011 (ZIP-level only)
- **Resolved address:** 17689 E 30th Ave, Aurora, CO 80011
- **Locked coordinates:** 39.75895, -104.78150

## Step 0 — Location confirmation
The roster gave only APPROXIMATE ZIP-level coordinates (39.754247,
-104.7871). Web research (Superpages, Chamber of Commerce, Yellowpages,
Bandana) identified the Mondelez/Nabisco Aurora facility at 17689 E 30th Ave,
Aurora CO 80011 - a Nabisco distribution / sales warehouse handling Oreo,
Chips Ahoy, Ritz, Wheat Thins, Triscuit and Sour Patch Kids. The address was
geocoded with the Google Geocoding API to a ROOFTOP point at 39.7588784,
-104.7818061. Satellite + Street View confirmed a tan-roof warehouse there
with an east-side dock face and truck court. Locked to that building.

## Key views
- **z17/z18 context:** Tan-roof warehouse in a dense Aurora/Denver-metro
  industrial park (Stapleton/Northfield area), flanked by larger warehouses.
- **z18/z19 building:** Square tan-roof warehouse; dock face on the EAST side
  with a paved truck court; car parking on the west and south sides.
- **z20 east dock face:** ~8-12 tractor-trailer rigs backed into dock doors,
  empty positions between them - implying roughly 15-25 doors.
- **Street View (2022-10):** Black metal perimeter fence along the SOUTH
  frontage enclosing the car-parking side; building visible behind. East
  truck-court driveways are open paved curb cuts. Multiple white tractors and
  trailers in the court (DSD/sales-route operation). No barrier arm or guard
  booth identified.

## Gate / guard-shack / dock determinations
- **truckGate = false (uncertain).** The east truck court is reached by open
  paved driveways with no barrier arm, sliding gate, or staffed checkpoint
  visible. A black metal perimeter fence runs along the south car-parking
  frontage, so a sliding gate at the truck-court entrance is possible but not
  resolvable in the available imagery - flagged uncertain.
- **guardShack = false (uncertain).** No gate-side booth identified at either
  truck-court driveway; entrance partly tree-obscured in Street View.
- **remoteGs = false (uncertain).** No gate confirmed, so no remote check-in
  inferred.
- **Docks:** East face is the dock face; ~8-12 rigs backed in with empty
  positions between - estimated band **10-25** (count ~20), flagged uncertain.
- **Drop area:** East truck court holds a mix of tractor-trailer rigs being
  loaded and some dropped trailers; band **10-25**, flagged uncertain.
  dropYard = true (the court is reasonably full of trailers).

## Yard zones and counts
- **perimeter:** ~189 m N-S x ~128 m E-W, ≈ 6.0 acres - building, east truck
  court, and west/south car parking inside the parcel edge.
- **truckGate box:** the NE driveway into the east truck court.
- **dropYards:** the east truck court (doubles as dock staging and trailer
  parking).
- **dockApron:** the apron along the east building face.
- **yardMetrics:** dockDoorCount ~20, trailersVisible ~12, capacity ~25,
  truckGateCount 2, buildingCount 1, siteArea 6.0 ac, railServed false.

## Web findings
- Superpages / Chamber of Commerce / Yellowpages / Bandana: Mondelez
  International / Nabisco distribution facility at 17689 E 30th Ave, Aurora CO
  80011.
- The facility distributes Oreo, Chips Ahoy, Ritz, Wheat Thins, Triscuit and
  Sour Patch Kids and employs warehouse and driver associates - consistent
  with a sales / DSD distribution operation, matching the roster note tying it
  to 2021 Nabisco strike coverage.

## Classification rationale
Moderate single-building sales/DSD distribution center in the dense Aurora/
Denver-metro industrial corridor (Urban). East-side dock face and open truck
court, served by two open driveways; perimeter fence on the south frontage but
no confirmed truck gate or guard structure. Deep east truck court doubles as
drop yard. No scale, no rail, single building. Archetype likely No Gate / No GS
(#3-type) on the evidence, though gate status is genuinely uncertain.

## Confidence: MEDIUM
Location was resolved from ZIP-level data to a ROOFTOP-geocoded address and the
building confirmed in imagery, so site identity is solid. Confidence is MEDIUM
because gate/guard-shack status cannot be definitively resolved (south
perimeter fence present but truck-court entrance unconfirmed and tree-obscured)
and the dock/trailer counts are honest overhead estimates - all flagged in
uncertainFields.
