# Yard Audit Dossier — 7-Eleven Combined Distribution Center, Austin TX (E.A. Sween)

- **Facility:** 7-Eleven Combined Distribution Center (CDC), operated by E.A. Sween Company
- **Type:** Combined Distribution Center (fresh-food cross-dock / route distribution)
- **Address:** 8606 Wall Street, Suite 450, Austin, TX 78754
- **Resolved center:** 30.340827, -97.672565
- **Maps (satellite):** https://www.google.com/maps/@30.340827,-97.672565,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation
The supplied city-level coordinate (30.341858, -97.673059) landed in a dense
multi-tenant industrial cluster. Geocoding "8606 Wall St, Austin, TX 78754"
returned a `premise` at **30.340547, -97.6727847** (parcel bounds SW
30.3385978,-97.6748452 / NE 30.3424647,-97.6708005) in the **Walnut Creek
Business Park** neighborhood. Web research confirmed:
- E.A. Sween Company **CDC** is listed at 8606 Wall St, Austin TX 78754
  (Yelp "E A SWEEN COMPANY C D C", Yellow/Superpages, phone 512-719-4698).
- The address is a **Prologis "Walnut Creek 14"** multi-tenant tilt-wall
  warehouse; the LoopNet suite listing cites only ~6 dock-high doors and 705 SF
  of office — i.e. E.A. Sween leases a **suite (450)**, not a stand-alone DC.
- E.A. Sween is 7-Eleven's fresh-food distributor (ready-to-eat sandwiches /
  commissary), so this is a small refrigerated cross-dock serving area 7-Eleven
  stores by route truck/van, not a large trailer-yard DC.

The audited footprint is the **central two-building cluster** sharing an open
truck court inside the parcel block (confirmed at zoom 18-20 and matched to the
geocode bounds). This is the correct building, not an office or unrelated site.

## Key views
- **Satellite z16/z17 (wide):** grid of multi-tenant warehouses in the business
  park; Wall St runs diagonally NE-SW past the parcel.
- **Satellite z18/z19 (parcel):** two parallel tilt-wall buildings on a ~35°
  (NW-SE) axis sharing a paved truck court; rear-load dock doors face the court.
- **Satellite z20 (court):** trailers, box trucks and route vans backed into the
  central building's dock wall; a UPS box truck mid-court.
- **Street View, pano `dqmsaKkN-jISlA27mXq8QA` (2022-04), heading ~300/315°:**
  the truck-court mouth opens **directly onto the public road with no gate, no
  barrier arm, and no guard booth**; route vehicles and trailers visible at the
  docks on the right.
- **Street View heading 240° / 290°:** landscaped lawn and trees front the road
  with only a **decorative stone monument pillar** and low metal fence panels —
  a business-park entrance marker, not a controlled truck checkpoint.
- **Street View court interior (70°):** long rear-load dock wall with multiple
  **CEVA-branded trailers** backed in — confirming a shared, open multi-tenant
  truck court.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Every driveway from Wall St into the court is open;
  no arm, sliding/swing gate, or pinch-point checkpoint anywhere on the frontage.
- **guardShack = false.** No staffed booth at any entrance. The only roadside
  structure is a decorative stone monument and ornamental fencing.
- **remoteGs = false.** No gate exists, so no kiosk/app check-in is implied.
- **Dock doors:** rear-load dock wall on the court-facing (SW) face of the
  central building shows ~12-18 doors with trailers/box trucks backed in.
  Banded **10-25** for the audited building face (the full multi-tenant block,
  counting both dock walls, could reach 25-50 — flagged uncertain).
- **Driveway = short** (1-2 trucks from road to dock); **entry/exit together**
  through the single open court; lanes uncontrolled (null).

## Yard zones & counts
- **Perimeter:** oriented quad tracing the central building block + shared court,
  long axis NW-SE, ~86m × ~195m ≈ **4.1 acres**.
- **Dock apron / drop area:** one strip — the shared truck court between the two
  buildings where trailers back into the dock wall.
- **yardMetrics:** dockDoorCount ≈18 (court face), trailersVisible ≈6,
  trailerParkingCapacity ≈10, truckGateCount 0, buildingCount 2,
  siteAreaAcres 4.1, railServed false.
- **Setting:** Urban — inside Austin's 700-acre Walnut Creek Business District
  near US-183/US-290/I-35; no connectivity concern.

## Web findings
- Yelp/Yellow/Superpages: "E A Sween Company CDC", 8606 Wall St, 512-719-4698.
- LoopNet/Prologis: 8606 Wall St = Prologis "Walnut Creek 14", multi-tenant,
  ~6 dock-high doors per suite, 25' clear, front-load config.
- E.A. Sween: 7-Eleven fresh-food distributor; this CDC serves area 7-Eleven
  stores by route distribution (commissary/sandwich model).

## Final confidence
**High.** Location positively confirmed by geocode + multiple web sources;
clear satellite and 2022 Street View imagery resolve the gate, guard-shack, and
dock calls unambiguously. Archetype: **No Gate / No Guard Shack** (open
multi-tenant business-park cross-dock). Uncertain only on the exact dock-door
band (multi-tenant block vs. audited face) and the multipleFacilities call.
