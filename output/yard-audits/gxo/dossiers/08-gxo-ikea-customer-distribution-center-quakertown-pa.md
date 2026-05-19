# Deep-Audit Dossier — GXO IKEA Customer Distribution Center, Quakertown PA (idx 8)

## Resolved location
- Roster address: 150 N West End Blvd, Quakertown, PA 18951 — **approximate** (the roster
  source flagged it "approximate to Quakertown industrial area"; geocode RANGE_INTERPOLATED
  along Route 309).
- True address: **3000 AM Drive #200, Quakertown, PA 18951** — established via web research
  (Racklify 3PL directory and multiple commercial-property listings).
- Locked center: **40.46075, -75.3475**
- The facility is a large multi-tenant distribution building in the AM Drive industrial park
  (Milford Township, NE of Quakertown borough). The building is anchored by **Continental
  Tire DC / DHL Supply Chain**; **GXO occupies Suite 200 (~195,000 SF)** running IKEA
  ecommerce parcel fulfillment. Racklify lists the whole building at 935,540 SF.
- Confirmation: the largest warehouse in the AM Drive park; cross-dock layout with a major
  trailer drop yard. A neighboring building numbered "1020" visible in 2025 Street View
  confirms the AM Drive industrial park identity.
- Caveat: GXO occupies only one suite of this shared building. Overhead imagery cannot
  isolate GXO's suite, so the geofence/counts cover the whole building and yard.

## Key views
- **Wide / context (z14-16):** Located the AM Drive industrial park; identified the big
  white-roofed warehouse as the largest building, with extensive docks and a drop yard.
- **Building footprint (z17-18):** Large warehouse running NE-SW; dock banks on both the
  NW face and the SE face (cross-dock); perimeter truck drive; large drop yard to the S/SE.
- **Dock / yard detail (z19-20):** Long rows of trailers backed into dock doors on both
  faces; dozens of trailers parked herringbone-style in the drop yard; a water tank and a
  small utility structure inside the SE truck yard.
- **Street View (2025):** Confirms the warehouse and trailers; shows neighboring building
  "1020"; frontage partly screened by a vegetated buffer.

## Gate / guard-shack / dock determinations
- **truckGate: false** — No barrier arm or sliding gate visible at the SE truck-yard
  entrance; appears to be an open paved approach. Listed uncertain (vegetated buffer screens
  the frontage in Street View).
- **guardShack: false** — No clear gatehouse at the road entrance. The small structure
  inside the SE yard reads as a maintenance/utility shed, not an entrance booth. Uncertain.
- **remoteGs: false** — No gate established.
- **dockDoors: 50+** — Two long dock banks with many trailers backed in; ~70 estimated.
- **shipRcvSeparate: true** — Cross-dock building, dock banks on NW and SE faces with
  separate yards.

## Yard zones and counts
- **perimeter:** ~57 acres covering the whole building and yard.
- **dropYard:** Large herringbone trailer-parking lot along the S/SE (`dropArea` 50+).
- **dockAprons:** SE-face apron and NW-face apron, both deep enough for 3+ truck stacking.
- **yardMetrics:** ~70 dock doors, ~60 trailers visible, ~120 capacity, 1 truck gate,
  1 building, ~57 acres, not rail-served (rail passes SW but no spur).

## Web findings
- Racklify: GXO Logistics warehouse at 3000 AM Drive #200, Quakertown — 935,540 SF building.
- GXO press release: 195,000 SF Quakertown Customer Distribution Center, 260+ employees,
  IKEA ecommerce parcel fulfillment, ranked No. 1 in IKEA's global warehouse network.
- Multiple listings confirm 3000 AM Drive houses Continental Tire DC / DHL Supply Chain.

## Final confidence
**medium** — facility positively re-identified at the correct address (roster address was
approximate); building, dock band, drop yard, and cross-dock layout read clearly from
satellite. Confidence held to medium because GXO occupies only one suite of a shared
multi-tenant building (geofence covers the whole building), and the truck-gate / guard-shack
calls are screened by a vegetated buffer in Street View.
