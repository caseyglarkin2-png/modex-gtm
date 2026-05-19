# Deep-Audit Dossier — Sovos / Rao's, Austin TX (idx 20)

## Facility
- **Name:** Sovos / Rao's - Austin TX (Michael Angelo's Gourmet Foods plant)
- **Type:** Manufacturing — premium pasta sauces / frozen Italian foods
  (Michael Angelo's; Rao's Made for Home)
- **Confirmed address:** 200 Michael Angelo Way, Austin, TX 78728 (Wells Branch)
- **Locked coordinates:** 30.47105, -97.67700

## Step 0 — Location resolution
The roster supplied only "Austin, TX" with the Austin city-center coordinates
(30.267153, -97.743061) — no street address. Rao's *sauce* production is
actually in NJ / NY / Alma GA, not Austin, so the roster's "Rao's - Austin"
entry had to be resolved by research.

Sovos Brands' Austin facility is the **Michael Angelo's Gourmet Foods** plant at
**200 Michael Angelo Way, Austin TX 78728** (Wells Branch / north Austin). Sovos
produced "Rao's Made for Home" and Michael Angelo's frozen Italian entrees
there. Google Maps places 200 Michael Angelo Way at 30.4713683, -97.6768125.
Satellite at that point shows a large food-manufacturing building with rooftop
refrigeration units, a truck dock yard and employee parking. Street View on
Michael Angelo Way shows clear building signage: **"MICHAEL ANGELO'S Gourmet
Foods, Inc."** — positive confirmation. Locked plant center 30.47105, -97.67700.

## Site layout
- Single L-shaped manufacturing/warehouse building, long axis roughly E–W, with
  extensive rooftop process/refrigeration equipment (frozen-food plant).
- **North:** employee parking lot, open off the Michael Angelo Way cul-de-sac.
- **South:** truck dock face — ~12–15 trailers backed into dock doors — inside a
  chain-link-fenced truck yard.
- **SE:** drop trailers parked along the fenced yard.
- Setting: a dense north-Austin (Wells Branch) industrial/business park,
  surrounded on all sides by large warehouse buildings.

## Gate / guard-shack determination
- **truckGate: true.** The south truck dock yard is enclosed by chain-link
  fencing (clearly visible in Street View). A sliding gate controls the
  truck-yard access opening on the east side (z20 satellite). The dock yard is a
  controlled, fenced area.
- **guardShack: false.** No staffed booth at the truck-yard gate. The small
  white-roofed structure near the building's edge is a utility building abutting
  the plant — not a freestanding 1–3-vehicle guard booth set beside the truck
  lane.
- **remoteGs: true.** A controlled (fenced) truck gate exists but with no guard
  shack — implies kiosk / call-box / app check-in.

## Docks, yard and counts
- **Dock doors:** south building face — estimate ~22 doors, band **10-25**
  (flagged low-confidence).
- **dropArea: 10-25** — drop trailers along the SE of the fenced yard.
- **Trailers visible:** ~18 across the captured imagery; estimated capacity ~28.
- **Buildings:** 1 (single L-shaped plant).
- **Rail:** none.
- **Scale:** none visible.
- **Site area:** ~9.5 acres from the perimeter box.

## Geofences
- **Perimeter:** S 30.47015 / W -97.67830 / N 30.47230 / E -97.67600.
- **truckGate:** east-side sliding-gate opening into the fenced south dock yard.
- **dropYard:** SE of the fenced truck yard.
- **dockApron:** south building dock face.
- **staging:** none distinct (fenced yard itself acts as post-gate holding).

## Classification rationale
Fenced truck yard with a controlled gate but no guard booth → truckGate true,
remoteGs true, guardShack false. Compact business-park parcel: short gate-to-dock
approach (drivewayShort), single shared entry/exit. Urban — embedded in a dense
north-Austin industrial park. Dedicated on-site drop area present (dropYard
true). Gate opens onto an internal cul-de-sac/loop road, not a public arterial,
so not backup-sensitive.

## Final confidence
**High.** Facility positively identified by building signage; layout, docks and
fenced truck yard clearly read from z18–z20 satellite and Street View. Only the
exact dock-door and trailer counts are estimates (flagged).
