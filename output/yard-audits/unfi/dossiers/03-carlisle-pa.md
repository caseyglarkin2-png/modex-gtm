# UNFI Carlisle PA DC — Deep-Audit Dossier

**Facility:** UNFI - Carlisle PA DC (idx 3)
**Address:** 192 Kost Rd, Carlisle, PA 17015
**Resolved center:** 40.22880, -77.08760
**Type:** Distribution Center (legacy-SuperValu conventional grocery DC, UNFI Mid-Atlantic)
**Confidence:** Medium

---

## Location resolution

The roster ROOFTOP geocode (40.22871, -77.088179) for 192 Kost Rd lands squarely
on a large rectangular cross-dock distribution building on the NE/upper side of
the Kost Rd industrial cluster, ~3 mi southeast of Carlisle, PA. Web search
(TruckMap, UNFI locations directory, OpenGovUS "Unfi Distribution Company LLC,
192 Kost Rd, Carlisle PA 17015") confirms this as the UNFI Carlisle DC — a
legacy-SuperValu mid-Atlantic conventional grocery distribution center.

**Address-ambiguity note:** 192 Kost Rd is a multi-tenant industrial address.
The SW/lower building in the same cluster — a separate ~450 ft x 1,100 ft
cross-dock facility with its own long office wing and a large employee parking
lot — is an SC Johnson regional logistics facility, audited separately under the
`sc-johnson` account (idx 9). The UNFI building is the **distinct NE/upper
building** on the ROOFTOP geocode; the two are separate parcels in the same
business park. This audit covers only the UNFI building.

## Key views

- **Wide z16/z17 satellite:** Two large DCs sit off Kost Rd. The UNFI building
  is the upper/NE one — a ~1,100 ft rectangular building oriented WSW-ENE, with
  a continuous dock face along its NW long side and a marked trailer drop yard
  off the NE end.
- **z19/z20 NW dock face:** A long, regular rhythm of dock doors lines the NW
  face with roughly 70 trailers backed in at capture time (mix of plain,
  green-, and orange-marked trailers — typical wholesale grocery trailer pool).
- **z19 NE-end drop yard:** A dedicated paved trailer-parking lot with marked
  stalls and a site water tower, holding parked trailers without tractors.
- **z19 SE side:** A rail line runs along the SE/south property boundary; no
  spur turns into the property.
- **Street View (Kost Rd, 2023-09):** Coverage stops at the public road — a
  business-park monument sign and the distant office cluster of the *adjacent*
  SC Johnson building are visible, but Street View does not reach the UNFI
  property entrance. The truck gate could not be observed directly.

## Gate / guard-shack determination

A single private access road serves the property from Kost Rd; the truck drive
wraps the WSW corner into the dock apron and drop yard. The gate/booth is not
visible in available imagery (Street View ends at the public road; the gate is
set well inside the parcel). A controlled truck checkpoint with a staffed
gatehouse is **assumed true** for a legacy-SuperValu conventional grocery DC of
this scale — that generation of SuperValu DCs characteristically ran staffed
guard booths. `truckGate: true`, `guardShack: true`, `remoteGs: false` — all
flagged as medium-confidence inferences.

## Yard zones and counts

- **Perimeter:** ~52 acres enclosing the UNFI building, NW dock apron, NE drop
  yard, and SE employee parking.
- **Dock doors:** Continuous dock rhythm on the NW long face → band **50+**
  (estimated ~90-100 positions).
- **Drop yard:** Marked trailer-parking lot at the NE end → `dropYard: true`,
  `dropArea` band **50+** (estimated ~110-stall capacity).
- **Trailers visible:** ~70 backed into the NW dock face at capture.
- **Ship/Rcv separate:** Dock activity is concentrated on the NW face plus the
  NE drop yard, not two distinct ship/rcv banks on opposite faces → false.
- **Rail-served:** False — rail line passes the SE boundary but no spur enters.

## Web findings

UNFI Carlisle DC is listed in UNFI's distribution network and multiple
directories (TruckMap, Yahoo Local, Birdeye — 2.8★/69 reviews, phone
717-590-2900). It operates as a 24-hour wholesale grocery DC in UNFI's
Mid-Atlantic / legacy-SuperValu Central footprint. The Bushway dossier notes
Carlisle as a DC that received automation upgrades — consistent with a surviving,
invested-in node in UNFI's "fewer, larger, more automated" consolidation thesis.

## Final confidence

**Medium.** Building identity is firmly confirmed via the ROOFTOP geocode and
web corroboration, and dock/drop-yard layout is clearly readable from satellite.
Gate and guard-shack calls are inferred (no Street View at the entrance) and are
flagged in `uncertainFields`.
