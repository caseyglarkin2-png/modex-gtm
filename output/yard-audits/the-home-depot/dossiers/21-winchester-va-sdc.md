# Deep-Audit Dossier — Home Depot SDC, Winchester VA (idx 21)

**Facility:** Home Depot Stocking Distribution Center
**Address:** 280 Maranto Manor Drive, Winchester, VA 22602 (Frederick County)
**DC numbers:** #5362 / #5364 / #5365 / #5366 (multi-DC SDC campus per SupplierWiki HD DC list)
**Resolved coordinates:** 39.080075, -78.153229
**Confidence:** High

## Location resolution

The roster geocode flagged a 9,866 m move, so the location needed careful
verification. Web search (Manta, BusinessYab, opengovny) all confirm "The Home
Depot Distribution Center: SDC, 280 Maranto Manor Dr, Winchester, VA 22602"
with navigation coordinates 39.0800035, -78.1529453 — a near-exact match to the
roster lat/lng. Satellite probing at z15-z17 confirmed a single very large
cross-dock distribution building on the forested southern edge of Winchester,
consistent with an SDC. A Walmart retail store and one other building sit to
the NE; the HD DC is a standalone parcel reached by a dedicated truck access
road. Location locked.

## Key views

- **z15/z16 wide:** Standalone DC wrapped in forest on the edge of town; farmland
  to the south, a Walmart and scattered residential to the NE. Rural/edge-of-town
  setting.
- **z17/z18:** Large cross-dock building (~600 m long, NE-SW axis) with dock doors
  and trailers backed in on BOTH long faces (NW and SE) — classic ship/receive
  split. Long rows of parked trailers along the NW court and near the NE end.
- **z19-z21 gate views:** The dedicated truck access road branches off the public
  road at a stop-sign intersection (Street View confirmed, 2024 imagery), curves
  ~250 m, and meets the truck yard at the SE corner through a guarded checkpoint.

## Gate / guard-shack determination

**Truck gate: YES.** At ~39.0801, -78.1506 the truck access road passes through
a clear checkpoint pinch-point: canopy structures span the inbound and outbound
lanes, a striped channelizing median separates the traffic, and painted
directional arrows mark the lanes. This is a controlled, purpose-built truck
entrance — not an open driveway.

**Guard shack: YES.** A small booth-footprint structure with a canopy over the
lanes sits beside the truck lanes at the checkpoint, distinct from the main DC
building. `remoteGs` is therefore false.

**Lanes:** ~2 inbound and ~2 outbound lanes through the gate canopy (moderate
confidence from z20/z21). Entry and exit run through the same gate complex →
`entryExitTogether`. The wide gate apron and long, deep access road give clear
room to add an express/bypass lane → `fastLaneOpportunity: true`.

## Yard zones & counts

- **Dock doors:** Cross-dock building with dock doors along both ~600 m faces;
  well into the **50+** band. `dockDoorCount` ≈ 200 (estimate).
- **Drop yard:** Long rows of parked trailers (no tractor) line the NW truck
  court and an additional lot near the NE end → **50+** drop area, `dropYard: true`.
- **Ship/receive separate:** Two distinct dock banks on opposite long faces →
  `shipRcvSeparate: true`.
- **Staging:** Paved apron outside the gate (pre-gate; a truck was seen staged
  on the access road) and paved yard inside the gate before the dock aprons
  (post-gate).
- **Site area:** ~62 acres for the developed/fenced footprint (building + both
  truck courts + trailer lots); the forested parcel envelope is larger.
- **Rail:** No rail spur into the property.
- **Buildings:** Single distribution building.

## Web findings

SupplierWiki's HD DC list catalogs this as a multi-number SDC campus
(#5362/5364/5365/5366) — consistent with HD's practice of running multiple
"DC" operations under one roof. Manta lists it as a 24-hour weekday operation
(~72 directory-reported employees, likely understated for a building this size).
No public mention of a yard-management system. The SDC role (conveyable
inventory holding feeding RDCs/stores) fits the cross-dock layout observed.

## Final confidence

**High.** Location unambiguously confirmed; the gate, guard booth, dual dock
faces and trailer lots are all clearly visible in current Maxar imagery.
Exact dock-door and trailer-capacity counts are honest estimates from overhead
imagery (flagged in `uncertainFields`).
