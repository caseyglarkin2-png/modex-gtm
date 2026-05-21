# Deep-Audit Dossier — Campbell's, Goodyear AZ (idx 19)

## Facility
- **Name:** Campbell's - Goodyear AZ (Campbell Snacks / Snyder's of Hanover pretzel plant)
- **Type:** Manufacturing — snacks/food production (pretzels; Snack Factory Pretzel Crisps)
- **Confirmed address:** 1200 N Bullard Ave, Goodyear, AZ 85338
- **Locked coordinates:** 33.4595, -112.3795

## Step 0 — Location resolution
The roster supplied address "13301 W Van Buren St, Goodyear AZ 85338" with coords
(33.44986, -112.34641). Probing that point at zoom 17 showed a residential
subdivision and small commercial buildings — clearly **not** a Campbell's plant.

Web research established the real facility: Campbell Snacks operates a
Snyder's-of-Hanover pretzel plant at **1200 N Bullard Ave, Goodyear AZ 85338**
(built 1998, ~177,000 SF, expanded ~67,000 SF in 2006). OpenStreetMap geocoding
returned two nearby nodes — one a generic warehouse block (33.4538, -112.3754)
and one labeled "Campbell's Food" at **33.4595, -112.3795**. Satellite at that
second point shows an unmistakable food-manufacturing building: large
white-roofed plant dense with rooftop process equipment, truck docks with
trailers backed in, an on-site drop yard, and an employee parking lot. Elevated
Street View from the adjacent I-10 freeway shows orange/red **"Campbell's
Snacks"** signage on the building face. Locked center: 33.4595, -112.3795.

## Site layout
- Single large manufacturing/warehouse building, long axis roughly E–W, plus a
  small utility outbuilding on the south side.
- **North:** employee parking lot and the site access road; I-10 freeway and its
  south frontage road run immediately north.
- **West:** main truck dock face — ~12–15 trailers backed into dock doors, with a
  parallel row of drop trailers in the paved yard.
- **South / SE:** a marked trailer drop yard (red-dirt apron) holding 20+
  trailers, plus an additional SW dock cluster.
- **South / east / west beyond the pavement:** active agricultural fields.

## Gate / guard-shack determination
- **truckGate: false.** The site entrance is an open driveway off the I-10 south
  frontage road at the NE corner. Zoom-19 and zoom-20 satellite show no barrier
  arm and no sliding/swing gate across the truck lane — open access.
- **guardShack: false.** No small staffed booth is visible at the entrance or
  anywhere along the internal loop road.
- **remoteGs: false.** No controlled gate exists, so there is no remote/kiosk
  check-in implication.
- Street View coverage is limited to the elevated I-10 freeway (no ground-level
  pano on the access road), but the overhead resolution at z19–z20 is sufficient
  to rule out a gate or booth.

## Docks, yard and counts
- **Dock doors:** W building face plus a SW/S cluster — estimate ~32 doors,
  reported band **25-50** (flagged low-confidence).
- **Drop yard / dropArea: 25-50.** Two trailer-parking areas (W dock yard row +
  S/SE marked drop yard).
- **Trailers visible:** ~46 across the captured imagery; estimated parking
  capacity ~70.
- **Buildings:** 2 (main plant + small utility outbuilding).
- **Rail:** none — no spur enters the property.
- **Scale:** none visible.
- **Site area:** ~16.5 acres from the perimeter box.

## Geofences
- **Perimeter:** S 33.4580 / W -112.3818 / N 33.4609 / E -112.3768 — captures the
  paved property between the frontage road and the fields.
- **truckGate:** NE-corner open driveway area off the frontage road.
- **dropYards:** W dock-yard trailer row; S/SE marked drop yard.
- **dockApron:** W building dock face.
- **staging:** none distinct (internal loop road serves as post-gate queueing).

## Classification rationale
Open-access ("#3"-style) industrial plant: no truck gate, no guard shack. Long
internal loop road gives ample post-gate / driveway depth (drivewayLong,
postGateStaging true). Entry and exit share the single NE driveway. Dedicated
on-site drop yard present (dropYard true). Rural / edge-of-town setting (bounded
by farmland), away from dense metro fabric.

## Final confidence
**High.** Facility positively identified by signage and OSM label; layout, docks
and yard clearly read from z18–z20 satellite. Only the exact dock-door and
trailer counts are estimates (flagged).
