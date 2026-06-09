# 08 — 7-Eleven Combined Distribution Center, Moore OK (E.A. Sween)

**Resolved location:** 35.339155, -97.487195 (site center)
**Address:** 110 NW 1st St, Moore, OK 73160
**Confidence:** High (on the physical read; a couple of counts flagged uncertain)
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Locating and confirming the facility

The supplied coordinates (35.338977, -97.487348) were labeled city-level/approximate, but a Google rooftop geocode of "110 NW 1st St, Moore, OK 73160" returned **35.3389771, -97.487348 (ROOFTOP)** — i.e. the supplied point was already rooftop-accurate, not off. The address resolves to a small commercial block in **downtown Moore**, one block west of the 4-lane Broadway (and the BNSF rail corridor), not to a large industrial park.

Web research confirmed E.A. Sween operates a Moore facility branded **"Moore-VAS"** at this exact address (110 NW 1st St). E.A. Sween is 7-Eleven's fresh-food maker/distributor; its CDCs and VAS (value-added-services) sites supply daily fresh food to 7-Eleven stores via small route trucks. The roster name calls it a "Combined Distribution Center," but the building on the ground is a **modest fresh-food route-delivery depot**, not a large CDC. I treated the confirmed building as the facility per the Step-0 instruction to confirm the actual footprint.

Satellite sweep (z16 → z20) around the point ruled out the larger warehouse rows further north along the rail (those are multi-tenant/storage buildings) and confirmed the depot block. Street View at the in-lot pano (2024-03/06) positively shows E.A. Sween's operation: the route-van fleet, staged trailers, and the covered loading area.

---

## What the key views showed

- **z20 satellite (rooftop):** A single ~1.1-acre block. West half is a paved lot holding a **fleet of ~12-15 small box trucks / route vans** parked in rows (the 7-Eleven fresh-food delivery vehicles). East/center is the depot building with a covered canopy loading area; a small metal warehouse sits on the lot. Multiple curb cuts open directly onto the public streets.
- **Street View looking south from the in-lot pano (35.33937, -97.48721, 2024-03):** Clear view of a covered dock/canopy at the building, a **row of 53' semi-trailers** backed in along the east side, several cabover box trucks staged, light poles and a traffic cone. No fence, no gate, no booth — wide-open paved lot continuous with the street.
- **Street View looking west (2024-03):** Box delivery trucks parked, brick building, open striped parking. Again no perimeter control.
- **Street View frontage (2015 & 2023 panos):** Single-story white/brick commercial building, rooftop HVAC, one 53' trailer parked at the side, open grass/gravel frontage, no fence line.

---

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE.** There is no barrier arm, sliding/swing gate, or checkpoint pinch-point anywhere on the property. Access is via several open curb cuts onto NW 1st St and the west cross street. Confirmed in both z20 satellite and 2024 Street View.
- **Guard shack: FALSE.** No booth, kiosk, or staffed structure at any entrance.
- **Remote GS: FALSE.** remoteGs only applies when a gate exists without a booth; here there is no gate at all.
- **Docks: 0-10.** A single covered loading canopy on the building's east side with ~3-4 truck/trailer positions visible. No large multi-door dock bank. Door count (~4) is an estimate — flagged.
- **Drop area: 0-10 / dropYard FALSE.** A few 53' trailers staged near the canopy plus the route-van fleet, but no marked drop stalls and no dedicated trailer-storage lot.

---

## Yard zones and counts measured

- **perimeter** — oriented ring tracing the ~1.1-acre depot block (NW 1st St on the south, west cross street on the west, paved-lot edge on the east before the open dirt lot toward Broadway). siteAreaAcres ≈ **1.09**.
- **truckGate** — there is no controlled gate; the zone marks the primary north curb-cut/entry apron used by trucks, traced as a small quad aligned to the lot. (Classification truckGate remains false; the geofence simply marks where trucks enter.)
- **dockApron** — one thin quad hugging the building's east loading canopy where trailers back in.
- **dropYards / staging** — none traced (no dedicated drop yard or pre/post-gate staging area exists).
- **yardMetrics:** dockDoorCount ≈ 4, trailersVisible 3, trailerParkingCapacity ≈ 6, truckGateCount 1 (open), buildingCount 2 (depot + metal warehouse), siteAreaAcres 1.09, railServed false (BNSF runs ~2 blocks east but no spur enters the property).

**Street View metadata:** Both the perimeter and truckGate centroids resolve to pano `l3RIv6fypDmSw2D8mPc9CA` (in-lot, 2024-03) — the single most informative ground frame. Perimeter heading 178° (camera south over the dock/trailer line); truckGate heading 335° (camera back toward the north entry).

---

## Web findings

- E.A. Sween Company ("Moore-VAS" at 110 NW 1st St, Moore OK 73160) confirmed via E.A. Sween careers listings (Oklahoma City / Moore positions) and corporate pages describing its Wholesale and Combined Distribution Center (CDC) network supplying 7-Eleven fresh food.
- E.A. Sween HQ: 16101 West 78th St, Eden Prairie, MN. Oklahoma is one of its operating states.
- The site fits the VAS / fresh-food route-depot profile: small downtown footprint, route-van fleet, light dock, no semi-trailer yard.

Sources: easween.com (about / careers / locations), ok7-eleven.com distribution-center page, E.A. Sween careers portal (Oklahoma City jobs), Google rooftop geocode of the street address.

---

## Final confidence

**High** on the physical classification (open, ungated, unguarded small downtown fresh-food route depot with a light dock and a route-van fleet). `backupSensitive`, the dock-door count, and trailer-parking capacity are flagged in `uncertainFields` as honest estimates from overhead + ground imagery.

### 3-line summary
- **Gate:** No truck gate — open lot, multiple curb cuts, no barrier/checkpoint.
- **Guard shack:** None (and no remote kiosk — there is no gate to control).
- **Confidence:** High.
