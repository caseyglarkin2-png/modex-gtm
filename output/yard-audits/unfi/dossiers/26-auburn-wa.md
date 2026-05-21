# UNFI — Auburn WA DC (Seattle) — Deep Audit (idx 26)

**Resolved location:** Valley Centre industrial complex, B St NW, Auburn, WA 98001
**Locked center:** 47.32655, -122.24905
**Confidence:** Medium

## Location resolution

The roster gave only city-level coordinates (47.307323, -122.228453, ~1.5 km
move) that landed in downtown Auburn — retail, no DC. Research resolved the
actual site:

- UNFI operated a **323,000 sq ft DC in Auburn, WA** as one of five PNW
  facilities. UNFI's Feb 2019 press release announced closing the Auburn,
  Tacoma and Portland warehouses once the new **Centralia DC** (roster idx 21)
  and expanded **Ridgefield DC** (idx 22) came online; customer transition
  completed early 2020.
- LoopNet lists **"United Natural Foods - Valley Centre Bldg 3"** at
  **2530 B St NW, Auburn, WA 98001**, APN/Parcel 000460-0043 — 181,300 sq ft
  on 8.13 acres, M1 zoning. A CoStar headline ("United Natural Foods Renews,
  Expands in Auburn") confirms a long-term UNFI lease here.
- UNFI's operational footprint (323k sq ft) spanned Bldg 3 plus expansion
  space in the Valley Centre campus. Center locked on the 2530 B St NW
  building and its truck court.

This is a **former / vacated UNFI DC** (closed ~2020). Satellite imagery still
shows an intensely active grocery-DC operation — yard hostlers, dense reefer
rows — so the physical yard remains a working large-scale food DC, whether
under UNFI or a successor tenant.

## What the imagery showed

- **Wide satellite (z16-17):** Valley Centre is a multi-building industrial
  campus on the west side of B St NW, hard against WA-167. 4+ large warehouse
  buildings share a continuous truck court.
- **Tight satellite (z19-20):** The truck court is packed with reefer trailers
  in long parking rows on the south and north sides; yellow yard tractors
  (hostlers) are visible moving trailers — a hallmark of an active high-volume
  DC. Dock doors run along the inner building faces.
- **Street View (B St NW, 2025-04):** Chain-link perimeter fence the full
  frontage. Truck driveways are open gaps in the fence — **no barrier arm and
  no guard booth visible** from the road at any entrance. Office/parking
  frontage is also chain-link fenced.

## Gate / guard-shack determination

- **truckGate: true** — the property is a fenced commercial yard with
  controlled driveway pinch-points; classed true but flagged uncertain since
  no hard barrier arm was confirmed from Street View.
- **guardShack: false** — no booth at any B St NW driveway.
- **remoteGs: true** — gate present, no shack ⇒ kiosk / call-box check-in.

## Yard zones and counts

- **Perimeter:** ~18 acres capturing the Valley Centre building cluster and
  shared truck court (the UNFI operational footprint).
- **Drop yards:** two trailer-storage zones (south and north of the court),
  both full of reefers — `dropArea` 50+, `dropYard` true.
- **Dock aprons:** the inner building faces along the central court.
- **dockDoorCount ≈ 45** across multiple building faces (estimate, multi-
  building campus).
- **trailersVisible ≈ 90**, **capacity ≈ 130**.
- **buildingCount 4** (multi-building campus ⇒ `multipleFacilities` true).
- **railServed false** — no spur into the property.

## Web findings

UNFI 2019 PNW optimization press release (closure of Auburn/Tacoma/Portland
into Centralia + Ridgefield); LoopNet listing 33539967 and property record
APN 000460-0043 (2530 B St NW); CoStar article 87594 (UNFI renew/expand in
Auburn).

## Final confidence: Medium

Building and campus positively identified via APN-confirmed LoopNet listing.
Confidence held at medium because UNFI vacated the site (~2020), the 323k sq
ft footprint spanned more than the single 2530 B St NW parcel, and the gate
hardware could not be confirmed from Street View.
