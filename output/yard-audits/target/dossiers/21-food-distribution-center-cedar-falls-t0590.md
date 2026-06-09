# Deep-Audit Dossier — Target Food Distribution Center Cedar Falls (T0590)

- **Facility:** Target Food Distribution Center, T0590 (perishable / cold-storage grocery DC)
- **Resolved address:** 2115 Technology Parkway (a.k.a. 6601 Hudson Rd), Cedar Falls, IA 50613
- **Resolved center:** **42.47660, -92.47030**
- **Method:** deep-audit (satellite z15-z21 + Street View 2025-08 / 2026-04 + web research)
- **Confidence:** HIGH

## 1. Location resolution (the geocode was wrong)

The supplied coordinates (42.5077, -92.41034 / "3400 Cedar Heights Dr") were **incorrect** — a z17 satellite probe there showed a residential street and small retail/strip development roughly 6 km NE of any distribution facility, with no industrial building present.

Web research corrected this:
- Target careers / Yelp / Waze / TruckMap all place **Target Distribution Center T-0590 at 6601 Hudson Rd, Cedar Falls** (and the food DC at 2115 Technology Pkwy on the same campus).
- **Iowa DNR Facility Explorer** (facID 311387103, "Target Food Distribution Center") lists coordinates **42.47508, -92.46961**, which land precisely on the SE office wing of the compact center building.

Satellite confirmed a two-building Target campus at Hudson & Viking roads (~1.4M sq ft total under roof): a very large general-merchandise DC to the north with an enormous trailer yard, and a separate, compact, roughly-square **cold-storage building to the south** with rooftop refrigeration units (clearly visible at z19/z20) — the **~420,000 sq ft Food DC**. That center building is the audited facility.

## 2. Key views

- **z15/z16 campus overview** — distinguished the food DC (compact, center) from the GM DC (huge, north). Separate footprints with a green gap and a shared dock aisle between them.
- **z17 perimeter overview** — full food DC parcel: building, north & south dock banks, west apron, SE office wing + employee parking, retention pond to the east, drop yard to the south.
- **z19/z20 roof close-ups** — multiple rooftop refrigeration penthouses and condenser banks confirm cold-storage/reefer operation.
- **z19/z20 south yard** — long rows of parked **reefer trailers** (white nose units) = drop yard; reefer trailers also backed into dock doors.
- **Street View 2026-04 (access drive, pano 7h8eZAquVwBdmbGDBdrMzg)** — Target bullseye sign at the DC entrance; **black metal perimeter fence** enclosing the truck yard along the east side.

## 3. Gate / guard-shack / dock determinations

- **truckGate = TRUE.** The truck yard is fully enclosed by a perimeter fence (black metal fence directly imaged in Street View). A single controlled truck entrance comes off the SE internal access drive. Driver reviews explicitly reference "the security gate" on arrival. Evidence: fenced yard + single pinch-point entry + corroborating reviews.
- **guardShack = TRUE.** Multiple independent driver reviews describe a **staffed guard shack** at the gate: "the wait to get through the guard shack is a little long," and a distinctive **pneumatic-tube document exchange** — "cylinders that you put the bills in and gets shot to the office like at a bank, and when you are confirmed at the security gate you check in at the office." That is a manned booth, not an unattended kiosk.
- **remoteGs = FALSE.** A staffed guard shack is present, so this is not a remote/kiosk/app check-in.
- **dockDoors = 50+.** Three dock banks — north face (over the shared aisle), south face (over the drop yard), and a west apron — combine to well over 50 doors (est. ~58), most with reefer trailers backed in.
- **shipRcvSeparate = TRUE.** Distinct dock clusters on opposite (north vs south) building faces.
- **scale = FALSE.** No weigh pad / scale house visible in the truck path.
- **multiStep = FALSE.** Single guarded gate; no clearly imaged second checkpoint.

## 4. Yard zones & counts measured

- **perimeter** — 8-vertex ring tracing the fenced parcel (building + yards + office/parking), oriented to the slight clockwise tilt of the site. ≈ **28.1 acres**.
- **truckGate** — small quad at the SE access-drive entry to the fenced yard.
- **dropYards** — one ring over the south trailer-storage lot (full rows of reefers).
- **dockAprons** — two thin quads hugging the north and south dock walls at the building angle.
- **dockDoorCount ≈ 58**, **trailersVisible ≈ 95**, **trailerParkingCapacity ≈ 70**, **truckGateCount 1**, **buildingCount 1**, **railServed false**.

## 5. Web findings

- Iowa DNR Facility Explorer: "Target Food Distribution Center," 2115 Technology Pkwy, 42.47508/-92.46961.
- ~420,000 sq ft perishable food DC; four temperature-controlled zones incl. two freezer rooms; serves Target stores across a nine-state region (WCF Courier; Grow Cedar Valley).
- Driver reviews (Indeed / TruckMap): strict appointment policy, long unload waits (4-10 hrs), guard-shack + pneumatic-tube check-in, no on-site driver parking (dedicated trucks only).
- Note: a related **Target FDC T3895** (6603 Hudson Rd) also exists on/near this campus; T0590 is the food DC audited here per the DNR-confirmed building.

## 6. Final confidence

**HIGH.** Building identity is unambiguous (DNR coordinate on the building + matching cold-storage architecture). Gate and guard-shack calls are backed by both the imaged perimeter fence and explicit driver-review testimony. Lane counts and post-gate staging are estimated from overhead imagery and flagged uncertain.
