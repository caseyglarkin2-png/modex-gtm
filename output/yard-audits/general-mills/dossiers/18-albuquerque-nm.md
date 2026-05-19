# Deep-Audit Dossier — General Mills, Albuquerque NM (idx 18)

## Location resolution
- Roster address: 3501 Paseo del Norte NE, Albuquerque, NM 87113.
- Roster geocode moved 2,485 m (GEOMETRIC_CENTER) and resolved correctly onto
  the plant. Locked center ~35.1772, -106.6080.
- Web search confirms: a General Mills cereal manufacturing plant (grain &
  oilseed milling / breakfast cereal) at this address; member of the Rio
  Rancho / Bernalillo County Chamber, listed by Dun & Bradstreet and Baking
  Business.

## Key views
- Wide satellite (z17): one very large interconnected plant building in the
  center, ringed by a perimeter access road. Extensive trailer drop yards on
  the W and NW (dozens of trailers in marked rows). Employee parking on the S.
- Gate close-up (z20/z21): a small guard booth on a raised concrete median
  island mid-roadway on the SE access road from Paseo del Norte. The entry
  road splits around the booth; gate/barrier crosshatch markings at the yard
  road junction.
- W building face (z19/z20): dock apron with ~8-10 trailers backed in.
- N building face (z19): an inset notch with ~6-8 trailers backed into doors.
- N and E sides (z19/z20): active rail spurs curve into the property with
  railcars positioned on-site.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled entrance off the SE access road; a guard
  island sits in the center of the entry roadway with gate/barrier markings.
- **guardShack = true.** Small staffed booth (~1-2 vehicle footprint) on a
  raised concrete median island at the entrance — classic guarded-entry island
  visible in z20-z21 imagery.
- **remoteGs = false.** Guard shack present.
- **dockDoors = 25-50.** Doors on the W face (~8-10) and an N-face notch
  (~6-8) plus additional bays; exact count uncertain.
- **dropArea = 50+ / dropYard = true.** Very large trailer drop yards on the W
  and NW holding well over 50 trailers in marked rows.
- **fastLaneOpportunity = true.** Wide entry roadway and ring-road apron with
  abundant unused paved width around the guard island.
- **shipRcvSeparate = true** (medium confidence) — two distinct dock clusters
  on the W and N building faces.

## Yard zones and counts
- `perimeter`: whole fenced/ring-road property, ~65 acres (irregular; ~557 m
  N-S x ~519 m E-W gross).
- `truckGate`: guard-island area on the SE access road.
- `dropYards`: two boxes — the large W/NW trailer storage yard and a secondary
  trailer staging area N of the building.
- `dockAprons`: two boxes — W-face apron and N-face notch apron.
- `staging`: small box at the entry roadway approach (post-gate holding).
- Metrics: ~38 dock doors, ~95 trailers visible, ~140 trailer capacity, 1
  truck gate, 2 buildings (one campus), ~65 acres, rail-served.

## Web findings
- Confirmed an active GM breakfast-cereal manufacturing plant; grain & oilseed
  milling industry classification. Phone (505) 897-5400.

## Setting
Urban — within the Albuquerque metro fabric, an industrial/business-park
district off Paseo del Norte (a major arterial). connectivityIssue = false.

## Final confidence: HIGH
Plant positively identified; guarded entry with central guard island clearly
visible. Uncertain: exact dock-door count, ship/rcv separation, lane counts.
