# Yard Audit Dossier — Sam's Club Distribution Center, Hattiesburg MS

- **Account:** Sam's Club (idx 4)
- **Facility:** Sam's Club Distribution Center Hattiesburg MS
- **Type:** Distribution Center (cross-dock) — operated by 3PL Saddle Creek Logistics
- **Address:** 185 J M Tatum Industrial Dr, Hattiesburg, MS 39401
- **Resolved center:** 31.265540, -89.268450
- **Maps (satellite):** https://www.google.com/maps/@31.265540,-89.268450,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite probe + Street View, Feb 2025 + Feb 2026 panos)
- **Confidence:** high

---

## Step 0 — Facility confirmation

The supplied coordinates (31.265479, -89.268464) landed inside the J M Tatum
Industrial Park east of Hattiesburg-Bobby L. Chain Municipal Airport (runway
visible to the east). The address and web research confirmed the operator: this
is **Sam's Club DC #4792, operated by Saddle Creek Logistics**, one of three
Sam's Club DCs Saddle Creek runs (Lakeland FL, Hattiesburg MS, Villa Rica GA)
as integrated consolidation / cross-dock operations.

Satellite z18–z20 at the confirmed point shows a **long cross-dock building
(~137 m, long axis ~ESE) with dock doors on BOTH long faces and trailers backed
in on both sides**, wrapped by multiple rows of parked trailers — unmistakably
the DC truck yard, not the office. (A "45,000 sq ft" figure that appears in
business listings is the registration/office footprint, not the operating
building.) The big blue-roof building across the tree line to the NE is a
separate, unrelated facility and was excluded. Center locked at
**31.265540, -89.268450**.

## Key views

- **z16 / z15 context:** Industrial park, building set among woods, airport to
  the east. Several distinct facilities; the Sam's Club DC is the long
  cross-dock with surrounding trailer rows.
- **z18 full site:** The whole operating lot — central cross-dock building,
  trailer-storage rows N/S/E of it, a paved access loop around the yard,
  employee parking + a row of small utility sheds along the north edge, and a
  single driveway exiting NW to J M Tatum Industrial Dr.
- **z19 / z20 building:** Dock doors run the full length of both the north and
  south walls with trailers backed in; office + car parking at the east end.
- **z20 / z21 entrance structures:** The small white structures near the north
  perimeter are evenly-spaced **utility/storage sheds**, not a guard booth.

## Gate / guard-shack / dock determinations

- **truckGate = FALSE.** Street View at the driveway throat
  (pano `KRg-ik6V6TZ3JfxYJHcDQw`, captured Feb 2025; road pano at
  31.26672, -89.27025) shows the paved entrance drive curving in from the road
  with only a **property/directional sign on a post** — **no barrier arm, no
  sliding/swing gate, no checkpoint pinch-point**. Multiple SV headings (90°,
  135°, 160°, 200°) confirm the DC sits well back across an **open grassy
  buffer with no perimeter fence**. This is the open "No Gate / No GS"
  archetype.
- **guardShack = FALSE.** No staffed booth beside the entrance lane. The row of
  small structures inside the yard are utility sheds (too many, evenly spaced,
  along the inner perimeter — not a 1–3-stall booth at the gate).
- **remoteGs = FALSE** (no gate at all → not a remote/kiosk-checkin gate).
- **dockDoors = "50+".** ~137 m building with doors on both long faces at ~4 m
  spacing ≈ ~32/side ≈ **~64 total** (honest overhead estimate, flagged).
- **dropArea / dropYard = "50+" / TRUE.** Dedicated long trailer-storage rows
  north and south of the building, separate from the dock aprons.
- **shipRcvSeparate = FALSE.** Doors on both faces are one continuous cross-dock
  flow, not two physically distinct ship-vs-receive clusters (flagged
  uncertain).

## Yard zones & counts measured

- **perimeter:** 7-vertex oriented ring tracing the cleared/paved operating lot
  inside the tree line → **~10.5 acres**.
- **truckGate:** quad over the NW driveway throat at the public road.
- **dropYards:** two rings — the north trailer-row block and the south
  trailer-row block (each runs parallel to the building's ESE long axis).
- **dockAprons:** two long thin rings hugging the north and south dock walls.
- **streetViewMeta:**
  - truckGate → pano `KRg-ik6V6TZ3JfxYJHcDQw`, heading **163°** (road → gate).
  - perimeter → on-site pano `CAoSHENJQUJJaEFVemFxRXBaak51WDJVVXBXUGx2R1Y.`
    (Feb 2026, inside the yard at 31.26560, -89.26863), heading **274°**.
- **yardMetrics:** dockDoorCount 64, trailersVisible ~160, capacity ~200,
  truckGateCount 1, buildingCount 1, siteAreaAcres 10.5, railServed false (no
  spur into the property).

## Web findings

- Saddle Creek Logistics operates this DC for Sam's Club; named Sam's Club 3PL
  Partner of the Year, ~28-year relationship, runs 3 Sam's Club DCs.
- Facility is a consolidation / cross-dock hub (matches the dual-face cross-dock
  building observed).
- Listed at 185 J M Tatum Industrial Dr, Hattiesburg MS 39401, ph (601)
  543-0122; "Sam's Distribution Center #4792."

## Setting

Edge-of-town industrial park beside a small municipal airport, surrounded by
woods/farmland → **Rural**. Neighboring DCs and Hattiesburg nearby, so
`connectivityIssue` left **false** (low confidence).

## Final confidence: HIGH

Facility unambiguous, imagery clear at all zooms, and the entrance was
positively read from Feb-2025 Street View. Door/trailer counts are honest
overhead estimates (flagged in `uncertainFields`); the gate/guard-shack/no-gate
verdict is high-confidence.
