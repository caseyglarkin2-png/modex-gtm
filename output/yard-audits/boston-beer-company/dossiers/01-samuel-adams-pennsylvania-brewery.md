# Deep-Audit Dossier — Samuel Adams Pennsylvania Brewery, Breinigsville PA

**Account:** The Boston Beer Company · **Roster idx:** 1
**Address:** 7880 Penn Drive, Breinigsville, PA 18031
**Locked center:** 40.5755, -75.6285
**Confidence:** High

## Location confirmation
The roster's ROOFTOP geocode (40.5752, -75.624758) landed in a gap between
buildings in the Penn Drive industrial park. Probing satellite at z16-z18 around
the point identified the correct building ~400 m to the WNW: a large
manufacturing complex with the unmistakable signature of a brewery — a dense
cluster of cylindrical fermentation/bright tanks in the NW, brewing process
equipment, grain silos, a complex multi-section roof with heavy rooftop
mechanical equipment, an employee parking lot, and a taproom patio with brick
pavers and picnic landscaping on the NE corner. Web research (Lehigh Valley
Chamber, Yelp, Panjiva import records) confirms Boston Beer / Samuel Adams
operates the Pennsylvania Brewery at 7880 Penn Dr. The neighboring large white
buildings to the SW and SE are separate distribution warehouses, not part of
the brewery; the brewery parcel is the central fenced complex.

## Key views
- **Wide (z16-z17):** Central building complex bounded by I-78/Schantz Rd to the
  north and Penn Drive to the south/west. Extensive multi-row trailer drop yards
  wrap the south and west sides of the brewery building.
- **Brewery center (z18):** Tank farm, process equipment, red-roof section, and
  trailers staged on all sides of the main building.
- **NW (z19):** A rail spur curves into the property from the northwest with a
  string of rail cars parked on it — the site is RAIL-SERVED.
- **West/south yards (z19-z20):** Hundreds of trailers in marked rows; a busy
  material/pallet storage yard; a creek-lined wooded buffer separating the
  brewery from the SE warehouse.
- **East face (z19-z20):** Loading docks with trailers backed in along the east
  building face — the primary dock apron.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** Satellite shows a fully chain-link-fenced perimeter
  (fencing visible in the landscaped buffers on the east and west). Street View
  panos only reach adjacent properties and do not capture the brewery's internal
  truck gate, but driver reviews are explicit and decisive.
- **Guard shack: TRUE.** Multiple driver reviews reference "the guard shack
  personnel" and "professional front-gate staff" at this brewery — a staffed
  guard booth at a manned front gate.
- **remoteGs: FALSE** — guard shack present, so not a remote/kiosk check-in.
- **Scale: TRUE.** Driver reviews state the brewery "delivers convenient on-site
  scales, and weigh-ins at the property" — an on-site truck scale.
- **multiStep:** Gate check-in plus a separate weigh-in step before docks implies
  a two-stage flow; flagged medium-confidence (scale house not isolated in
  imagery).
- **Docks:** ~40 dock doors estimated across the east face and trailer-yard
  faces (band 25-50). Shipping and receiving run from physically distinct dock
  clusters -> shipRcvSeparate TRUE.
- **postGateStaging: TRUE / drivewayLong: TRUE** — large paved internal aprons
  give a deep queue (3+ trucks); a yard jockey ("Robert") manages staging per
  reviews. fastLaneOpportunity TRUE — wide aprons leave room for a bypass lane.

## Yard zones & counts
- **Perimeter:** ~70 acres (matches the ~76-acre figure in the facility type
  description once landscaped buffers are included).
- **Drop yards:** two large multi-row trailer drop areas (south and west);
  dropArea band 50+, dropYard TRUE.
- **Dock apron:** primary apron along the east building face.
- **Trailers visible:** ~170 across captured imagery; capacity ~250.
- **Buildings:** 4+ (main brewhouse/process building, tank-farm structures,
  adjacent warehouse/material buildings) -> multipleFacilities TRUE (campus).
- **Rail-served:** TRUE.

## Web findings
Lehigh Valley Chamber and Boston Beer materials confirm this is the company's
largest brewery (~1M sq ft). Driver-facing reviews describe: efficient loading
(<1 hour turn), a manned front gate with friendly guard-shack staff, a yard
jockey for staging, on-site scales and weigh-ins, and a dedicated driver lounge
with restroom. Panjiva import records confirm freight activity at 7880 Penn Dr.

## Final confidence
**High.** Building positively identified; gate, guard shack, and scale
corroborated by consistent driver reviews. Dock-door and trailer counts are
honest overhead estimates and flagged in uncertainFields.
