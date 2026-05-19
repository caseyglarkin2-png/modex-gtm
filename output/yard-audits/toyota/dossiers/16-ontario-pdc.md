# Deep Audit — Toyota Parts Distribution Center, Ontario CA (idx 16)

**Facility:** Toyota North American Parts Center (NAPDC)
**Type:** Parts Distribution Center
**Resolved coordinates:** 34.0330, -117.5818
**Address:** 1425 Toyota Way, Ontario, CA 91761
**Confidence:** Medium

## Location resolution

Roster supplied only a city-level Ontario point (34.034814, -117.584802,
"APPROXIMATE"). Web research resolved the facility to **1425 Toyota Way, Ontario
CA 91761** — the Toyota North American Parts Center, Toyota's largest US parts
distribution facility (confirmed via Yellow Pages, LoopNet, D&B/Panjiva, an
ITA Foreign-Trade-Zone site listing, and the Aramark cafe page for "NAPCC").
LoopNet records the building as ~817,493 SF Class A industrial (built 1996).

Satellite at z15-z20 resolves the site to the large white-roof tilt-up warehouse
running E-W between **Toyota Way** (north frontage, with employee parking) and
the **CA-60 freeway** (south). The building's single ~800K sf mass, modern
construction, the Toyota Way street name, and the geocoded point all point to
this footprint as the NAPDC. (One caveat: the precise parcel boundary of "1425"
vs an immediate neighbor could not be 100% pinned from imagery alone — noted.)

## What the imagery showed

- **z15/z16 overview:** A massive single-mass warehouse in the Ontario industrial
  district, dwarfing surrounding multi-tenant buildings.
- **z17/z18 building:** North face fronts Toyota Way with a landscaped front
  entrance and employee parking; south face fronts CA-60.
- **z19 south face / truck yard:** The entire south building face is one
  continuous dock bank — a regular rhythm of ~70 dock doors with trailers backed
  in across most. A deep paved truck apron separates the dock face from a large
  fenced drop yard holding ~70 parked trailers in striped rows.
- **z18/z19 east end:** Building east face, internal road, and an adjacent paved
  lot; the truck yard connects to a controlled gate at the SE.
- **Street View (2018 / 2025):** Tall tilt-up warehouse walls; the truck yard and
  drop yard are fenced from the CA-60 frontage road.

## Gate / guard-shack determination

- **truckGate = true.** The south truck yard, dock apron and drop yard are fenced
  off from the public frontage road; truck access is via a controlled gate at the
  SE end. A modern OEM parts DC of this scale operates a controlled truck gate.
- **guardShack = false / remoteGs = true (inferred, medium confidence).** No
  discrete staffed booth could be isolated in imagery. Modern Inland Empire DCs of
  this profile typically use a controlled gate with kiosk / badge / app check-in
  rather than a manned booth. Flagged uncertain — a small booth at the SE gate is
  possible.
- **multiStep = false** — no second post-gate checkpoint visible.

## Yard zones & counts

- **Perimeter:** ~42 acres (building + south truck yard + drop yard).
- **Dock doors:** ~70 across the single continuous south face — band 50+.
- **Drop yard:** large fenced lot parallel to the dock apron, ~70 trailers
  visible, capacity ~110 — band 50+; `dropYard` true.
- **Dock apron / post-gate staging:** deep paved apron between dock face and drop
  yard — `drivewayLong` true.
- **Ship/Rcv:** single south dock face — `shipRcvSeparate` false.
- **Rail served:** NO — building fronts the freeway, no rail spur.

## Web findings

- NAPDC is Toyota's largest US parts distribution center; 185,000-260,000+ unique
  service parts; ~65,000 order lines/day.
- ~817,493 SF Class A warehouse, built 1996; designated an FTZ site.
- Inland Empire location ~50 mi east of Los Angeles.

## Final confidence: MEDIUM

Facility identity and location are well-supported (address, scale, street name,
geocode all agree). Dock-door and drop-yard counts are confidently read from
clear z19 imagery. Guard-shack vs remote check-in, exact gate/lane counts, and
the precise parcel boundary are inferred / approximate — flagged in
uncertainFields.
