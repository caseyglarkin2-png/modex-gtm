# CA DC Chilliwack Whse - Deep Audit Dossier

**Facility:** CA DC Chilliwack Whse (Triton Water Canada Holdings / Nestle Waters Canada distribution unit)
**Type:** DC / Warehouse
**Resolved address:** 527-6388 Unsworth Rd, Chilliwack, BC V2R 5M3 (Greendale; corner of Unsworth Rd & South Sumas Rd)
**Locked center:** 49.11795, -121.99110
**Maps:** https://www.google.com/maps/@49.11795,-121.99110,400m/data=!3m1!1e3
**Confidence:** Medium

---

## Location resolution

The supplied coordinates (49.1579, -121.9515) were city-level and landed ~4.6 km NE of the real site. The research lead pointed to "Triton Water Canada Holdings / Nestle Waters Canada, 6388 Unsworth Rd." Web research confirmed and sharpened this:

- Canpages / Yellowpages list **Triton Water Canada Holdings Inc at 527-6388 Unsworth Rd, Chilliwack BC** (the "527" is a unit number).
- LoopNet / Western Investor describe **6388 Unsworth Rd** as a **225,270 sqft, 5-unit, 8.67-acre multi-tenant industrial complex** at the corner of Unsworth and South Sumas Rd, **anchored by Nestle Canada**, with co-tenants **Tycrop Mfg, Bullseye Packaging, Ice River Springs (unit 511)**, plus truck parking.
- Street View confirmed **Old Yale Brewing** occupies the corner office/taproom unit (signage: "Old Yale" + "Find award winning craft beer this way").

This is the **distribution / warehouse** address, NOT the BC bottling plant (that is the Nestle Waters plant in Hope at 66700 Othello Rd). Geocoding 6388 Unsworth and the Unsworth/South Sumas corner, then probing satellite, positively identified the **anchor warehouse fronting the corner** as the audited DC building.

---

## What the key views showed

- **Wide satellite (z17-z18):** A developed industrial estate. Two dominant warehouses: the **anchor building** fronting South Sumas Rd (dock bank on its south face) and a **much larger south warehouse** (west-face dock bank + extensive trailer/lumber yard). Further east, another large warehouse with lumber storage. The estate is a campus of several large building clusters serving multiple tenants.
- **Anchor building (z19, p21-anchor-z19):** Office/brewery frontage and visitor parking on the north (South Sumas) face; a **continuous dock bank along the entire south face** with marked apron stalls; building long-axis rotated a few degrees clockwise from the grid.
- **Dock crops (z20, p21-dockcenter / p21-dockbank):** Regular rhythm of ~18-22 dock doors with a few trailers backed in -> **10-25 band** (top end).
- **Street View, South Sumas frontage (2023-06):** Open landscaped driveway straight to the building; **no gate, no barrier, no booth**.
- **Street View, SW yard mouth (pano W2B0feXmoivAMAdGDIzNXA):** Looks straight into a **fully open paved internal yard** between the buildings, with trailers/containers and forklifts and process silos. A small chain-link enclosure around the silos is utility fencing, not a truck checkpoint.
- **Street View, Unsworth Rd:** Open access, no controlled entrance.

---

## Gate / guard-shack / dock determinations

- **truckGate: FALSE.** No barrier arm, sliding/swing gate, or checkpoint pinch-point across any truck approach. Open multi-tenant industrial estate; trucks enter freely from Unsworth Rd and the internal park road off South Sumas. Evidence: open driveways in 2023-06 Street View on both roads + an uncontrolled open internal yard in the SW-corner pano.
- **guardShack: FALSE.** No staffed booth-sized structure at any entrance in satellite or Street View.
- **remoteGs: FALSE.** No gate at all, so no implied kiosk/app check-in.
- **dockDoors: 10-25.** ~18-22 doors on the anchor building's south face (honest overhead estimate; the neighbouring south warehouse adds ~20+ more but is a separate building/tenant).

---

## Yard zones and counts

- **Perimeter:** ~4.3 acres traced around the operational anchor-building lot (building + south dock apron + immediate yard + east parking). Note: the documented PARCEL is 8.67 acres / 225,270 sqft; the extra acreage covers shared yard and the larger south warehouse that belong to the estate rather than the single audited unit.
- **Truck gate zone:** the open SW yard mouth off Unsworth (no physical gate; traced as the controlled-area equivalent for Street View framing).
- **Dock apron:** long thin quad hugging the anchor building's south face, at the building's true angle.
- **Drop yard:** the shared paved internal yard south of the dock bank, used for trailer/container drop and staging.
- **yardMetrics:** dockDoorCount 20, trailersVisible ~14, trailerParkingCapacity ~40, truckGateCount 2 (both uncontrolled), buildingCount 1 (audited unit), siteAreaAcres ~4.3, railServed false.
- **Street View metadata:** perimeter pano `_J9T-Be8_tQqdA4hW-uBXQ` (heading 68) and truckGate pano `W2B0feXmoivAMAdGDIzNXA` (heading 135), both status OK, 2023-06.

---

## Web findings

- Nestle Waters Canada / Triton Water Canada operates as a **distribution tenant (unit 527)** in the 6388 Unsworth complex; their listing is in the bottled/bulk water category, with import/export ports of arrival at Seattle and Tacoma -> consistent with a regional **distribution** role, not bottling.
- The complex sold for ~$22M (Western Investor "done deals") and is leased across Nestle, Tycrop, Bullseye Packaging, and Ice River Springs.
- The BC bottling plant is separate (Hope, BC), reinforcing that this Chilliwack site is warehouse/DC.

---

## Final confidence

**Medium.** Location is positively resolved and the open/ungated nature of the truck yard is confirmed from multiple Street View angles plus satellite. Confidence is held at medium (not high) because: (1) it is a multi-tenant estate, so the exact unit boundary of the Nestle Waters/Triton DC vs. co-tenants cannot be drawn precisely from imagery; (2) the internal yard has no Street View coverage; (3) dock count, ship/receive split, and lot acreage carry the usual overhead-imagery uncertainty. All such fields are listed in `uncertainFields`.
