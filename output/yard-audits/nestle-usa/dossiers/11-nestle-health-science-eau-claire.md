# Deep-Audit Dossier — idx 11

## Nestlé Health Science — Eau Claire, WI
**Type:** Nutritional beverage manufacturing plant (Boost, Carnation Breakfast Essentials, RTD medical nutrition)
**Resolved address:** 1200 Nestlé Ave, Eau Claire, WI 54703
**Locked center:** 44.8315, -91.5253

## Location resolution
The roster entry was unreliable: address listed as "3185 Galloway St" (flagged "approximate") and
coordinates 44.8212, -91.4667 (RANGE_INTERPOLATED). Probing the roster point at zoom 17 showed only a
construction site and a road interchange — no industrial plant.

Web research (Nestlé Health Science press materials, Leader-Telegram, Yelp, LoopNet) gave the true
address: **1200 Nestlé Ave**, with approximate coordinates 44.8321, -91.5260. Satellite at that point
revealed a large NW-SE-oriented manufacturing complex consistent with a 35+-year nutritional-beverage
plant. The roster point was ~6 km off. Locked center set to 44.8315, -91.5253. (Galloway St does run
along the NE/E side of the parcel, so the roster's street name was directionally correct.)

## Key views
- **Wide z16/z17:** Large sprawling production building running NW-SE, hemmed in by residential streets
  on the west and south, with a school athletic field to the SE and other light-industrial parcels to
  the north. A standalone older dark-roofed warehouse sits at the south end.
- **Center z18:** East building face carries a long continuous run of loading docks with many trailers
  (orange, white, green) backed in. The building wraps an interior courtyard with rooftop equipment.
- **NW corner z18/z19:** Employee parking lots and a canopied parking deck to the lower-left; ancillary
  sheds and large white storage tanks (silos); an open paved yard with trailers staged near the docks.
- **East face z19:** ~18-20 dock doors along the east face with ~14-16 trailers backed in.

## Gate / guard-shack determination
- **Truck gate: TRUE.** Street View of the NW driveway (captured 2023-07 and 2024-08) shows a controlled
  checkpoint where the main driveway meets the frontage road — a guard booth in the driveway throat and
  perimeter fencing along the property line (a decorative brick wall topped with black metal fence).
- **Guard shack: TRUE.** A small canopied booth, ~1-2 vehicle footprint, sits beside the inbound lane in
  the entrance throat, distinct from the main building. Multiple Street View headings confirm it.
- **Remote GS: FALSE** — a staffed booth is present.
- The entrance apron is wide and opens onto a large interior paved yard, giving room to add an express
  bypass lane (`fastLaneOpportunity: true`). Single combined entry/exit at this one gate.

## Yard zones and counts
- **Perimeter:** ~33 acres for the fenced industrial parcel (bounding box S 44.8295 / W -91.5278 /
  N 44.8340 / E -91.5232; box overincludes some margin given the diagonal footprint).
- **Truck gate zone:** NW driveway throat, ~44.8330-44.8334 N.
- **Drop yard:** Open paved NW-corner yard where trailers are staged near ancillary buildings.
- **Dock aprons:** Two — the long east face and the NW-corner dock face.
- **dockDoorCount ~32** (banded 25-50; approximate from overhead imagery).
- **trailersVisible ~22** across the east face and NW corner.
- **trailerParkingCapacity ~30.**
- **buildingCount 3** — main complex, standalone south warehouse, ancillary sheds/tank structures.
- **railServed: false** — no spur visible.

## Web findings
Nestlé Health Science has produced consumer products in Eau Claire for 35+ years; a $43M expansion
(announced Jan 2023, ~60 new jobs) added two RTD production lines for Boost and similar medical-nutrition
drinks. Zero-waste-to-landfill site committed to 100% renewable electricity. Sources: nestlehealthscience.us,
areadevelopment.com, leadertelegram.com, volumeone.org, loopnet.com.

## Final confidence
**High.** Facility unambiguously identified, gate and guard shack confirmed by multiple Street View
captures, layout and dock structure clear. Dock-door count, ship/receive separation, and exit-lane count
are honest overhead estimates flagged in `uncertainFields`.
