# Deep-Audit Dossier — idx 24

## Mondelez Ontario Distribution Center — Ontario, CA

**Status: RESOLVED — confidence HIGH** (re-audit of an earlier low-confidence stub)

### Step 0 — Location
Confirmed address: **5815 Clark St, Ontario CA 91761** — a single-tenant
distribution warehouse in the dense Inland Empire industrial fabric of
Ontario, San Bernardino County. Google geocode returned a ROOFTOP match at
`34.0451114, -117.524735`. Locked center: `34.04500, -117.52555`.

> The earlier stub mislabeled this site "Los Angeles, CA" and could not
> resolve it. It is in Ontario, CA (the Inland Empire) — corrected here.

### Steps 1-5 — Audit

**Building & layout.** A single rectangular warehouse with dock banks on
**two** faces: a dock bank along the **south** face inside a screened truck
court, and a second dock bank along the building's **west-facing** court.
Employee car-parking wraps the east (Clark St) and south frontages; the
Clark St face is a blank tilt-up wall with landscaping (no truck access).

**Docks.** Two distinct dock clusters (south and west) — estimated ~38 doors
total (`dockDoors: 25-50`; count flagged uncertain). Two separate banks on
different faces — `shipRcvSeparate: true`.

**Truck court.** The truck court is screened from the public street by a
tilt-up concrete screen wall. Trailers are backed into the south and west
dock banks; a modest band of parked trailers sits within the court
(`dropArea: 10-25`). No dedicated separate trailer-storage lot, so
`dropYard: false`.

**Truck gate.** Street View (Jan 2025) at the truck-court driveway shows a
**wheeled sliding chain-link gate** across the entrance, set between the
screen-wall sections. `truckGate: true`.

**Guard shack.** No staffed guard booth — a sliding chain-link gate with what
appears to be a small kiosk / call-box and a signage post beside it, but no
standalone guard building. Remote (kiosk/call-box/app) check-in inferred
(`remoteGs: true`). `guardShack` flagged uncertain.

**Rail.** A rail line runs E-W along the building's north property line, but
it serves the building to the north and does **not** spur into the 5815 Clark
St property — `railServed: false`.

**Setting.** Ontario / Inland Empire — one of the densest warehouse-industrial
submarkets in the US — **Urban**.

**Geofence.** Perimeter captures the building plus the screened south truck
court and the west dock court: ~173 m N-S x ~217 m E-W ≈ **9.3 acres**.

### Verdicts
- **Gate verdict:** truck gate present — wheeled sliding chain-link gate on a
  screen-walled truck court.
- **Guard-shack verdict:** no guard shack observed — remote (kiosk/call-box)
  check-in inferred; flagged uncertain.
- **Confidence:** high.
