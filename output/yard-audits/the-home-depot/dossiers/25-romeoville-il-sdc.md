# Deep-Audit Dossier — Home Depot SDC, Romeoville IL (idx 25)

**Facility:** Home Depot Stocking Distribution Center
**Address:** 1070 Windham Parkway, Romeoville, IL 60446 (Will County)
**DC number:** #5061 per SupplierWiki HD DC list / directory listings
**Resolved coordinates:** 41.663229, -88.112651
**Confidence:** High

## Location resolution

Web search (CMac, Dun & Bradstreet, Manta, hoursofoperation) confirms the Home
Depot Distribution Center at 1070 Windham Parkway, Romeoville, IL 60446 — DC
#5061, a General Warehousing & Storage operation. The roster geocode was
ROOFTOP precision (only 43 m move). Satellite probing confirmed the roster pin
sits on a large cross-dock distribution building in the Romeoville / I-55
logistics corridor. Location locked.

## Key views

- **z16 wide:** The HD SDC is one of many large distribution buildings in the
  dense Romeoville / Joliet-area logistics corridor along Windham Parkway.
- **z17/z18:** Large cross-dock building (~600 m long, N-S axis). Dock doors and
  trailers backed in concentrated along the WEST face; office/employee parking
  on the S face. Retention ponds wrap the S and parts of the W.
- **z20-z22 + Street View (2022):** A guarded checkpoint at the SW corner where
  the truck driveway enters the W-face truck court.

## Gate / guard-shack determination

**Truck gate: YES.** At the SW corner (~41.6633, -88.1130) the truck driveway
curves in from the access road and passes a controlled checkpoint: barrier-arm
gates span the lanes, with a chainlink fence corner enclosing the truck court.
Confirmed in 2022 Street View — a controlled truck entrance.

**Guard shack: YES.** A small white guard booth with windows on multiple sides
and a ~1-vehicle footprint sits beside the truck gate lanes, clearly visible in
Street View — distinct from the main DC building. `remoteGs` is therefore false.

**Lanes:** Single inbound lane past the booth and a single outbound lane; entry
and exit share the one gate complex → `entryExitTogether`. Standard
single-lane-each-way guarded gate, no spare width → `fastLaneOpportunity:
false`. The driveway curves in and opens into a deep truck court → `drivewayLong`.

## Yard zones & counts

- **Dock doors:** Long dock line with dock doors and trailers backed in along
  the ~600 m W face — into the **50+** band. `dockDoorCount` ≈ 90 (estimate).
- **Drop yard:** Rows of detached trailers in the fenced W truck court →
  estimated **25-50** band, `dropYard: true`.
- **Ship/receive:** Docks concentrated on the one W face — no second separate
  dock cluster → `shipRcvSeparate: false`.
- **Staging:** Paved truck court inside the gate before the dock doors gives
  post-gate holding; no distinct pre-gate staging apron.
- **Site area:** ~45 acres for the building plus the W truck court / drop yard
  and S office parking.
- **Rail:** No rail spur into the property.
- **Buildings:** Single distribution building (neighbouring large warehouses
  along Windham Parkway are separate facilities).

## Web findings

Directory listings catalog this as HD DC #5061, a stocking DC in the Romeoville
logistics submarket serving the Chicago region. Reported ~72-100+ employees.
No public mention of a yard-management system.

## Final confidence

**High.** Location confirmed by ROOFTOP-precision geocode and directory DC#
match. The guarded truck gate and guard booth are unambiguous in 2022 Street
View and z21/z22 satellite. Dock-door and trailer-capacity counts are honest
overhead estimates (flagged in `uncertainFields`).
