# Deep-Audit Dossier — SC Johnson Ontario Distribution Center

**Facility:** Ontario Distribution Center
**Address:** 1545 E Locust St, Building 7, Ontario, CA 91761
**Resolved center:** 34.04610, -117.61840
**Type:** Distribution Center (aerosol storage)
**Audit method:** Satellite (z16–z20) + Street View (Feb/May 2025, May 2022) + web research
**Confidence:** High

---

## 1. Location resolution

Roster coordinates 34.046012, -117.618383 (geocode moved 125 m) land correctly
on the building. Identity confirmed via the **EPA Risk Management Plan record**
for the "Ontario Distribution Center" at 1545 E Locust St Building 7, the
LoopNet APN listing (parcel 0113-441-12), and the Smart Warehousing facility
directory. The building is **~268,830 sq ft, built 1997/98**, in Thoroughbred
Business Park Phase II. Locked center: 34.04610, -117.61840.

## 2. Tenancy caveat (roster note confirmed)

The roster flagged that third-party listings now associate 1545 E Locust with a
3PL. **Confirmed:** Street View (Feb/May 2025) shows a **"Smart Warehousing"**
sign on the office face, and Smart Warehousing lists this address as its
"Ontario #2" warehouse. The EPA RMP historically tied SC Johnson aerosol
storage to this address, but **SC Johnson's current direct tenancy here is
doubtful** — it is most likely now a 3PL-operated DC that may still handle SCJ
aerosol product or may have transitioned tenants. The site was audited as the
physical RDC location per the assignment; the tenancy uncertainty is recorded
in the JSON `fieldNotes.tenancy` and flagged here for the sales team.

## 3. What the key views showed

- **Wide satellite (z16–z18):** A large warehouse in dense Inland Empire
  industrial fabric — wall-to-wall distribution buildings in every direction.
- **Tight satellite (z18–z20):** A continuous dock bank along the **west face**
  fronting a fenced truck drop yard, plus a shorter dock bank on the **south
  face**. The west truck yard is squeezed between this building and the
  neighboring building.
- **Street View (May 2022), west truck yard:** A clear **sliding/cantilever
  gate** spans the truck driveway, with chain-link fence flanking it and FedEx
  Ground trailers parked inside the fenced yard. A small structure sits at the
  SW corner of the yard by the gate.
- **Street View (Feb 2025), office front:** "Smart Warehousing" branding;
  employee parking; no fence across the office front.

## 4. Gate / guard-shack determination

- **truckGate = true.** A sliding/cantilever gate across the west-side truck
  driveway, with chain-link fence enclosing the truck drop yard, is clearly
  visible in Street View. Controlled truck entrance.
- **guardShack = false.** No staffed multi-window guard booth at the gate. The
  small structure at the SW corner of the truck yard is not a road-side staffed
  booth.
- **remoteGs = true.** Truck gate present, no guard shack → remote check-in
  (kiosk / badge / app) is the implied control.
- **multiStep = false.** No second checkpoint.

## 5. Yard zones and counts

- **Perimeter:** Captures the ~268k sq ft warehouse, the fenced west truck drop
  yard, and the office parking. ≈ 13 acres — a compact urban parcel.
- **Drop yard:** One — the fenced west-face truck yard with trailers parked
  without tractors.
- **Dock aprons:** Two — the continuous west-face bank and a shorter south-face
  bank.
- **dockDoorCount ≈ 45** (continuous west bank + shorter south bank).
- **trailersVisible ≈ 20** (some FedEx; count approximate).
- **trailerParkingCapacity ≈ 55.**
- **truckGateCount = 1.**
- **buildingCount = 1.**
- **railServed = false** — no rail spur into the parcel.

## 6. Web findings

EPA RMP "Ontario Distribution Center" — storage/distribution warehouse for SC
Johnson aerosol consumer products; LPG propellant drives the RMP. LoopNet APN
0113-441-12: ~268,830 sq ft, built 1997/98, Thoroughbred Business Park Phase
II. Smart Warehousing lists 1545 E Locust as "Ontario #2" — the building is now
3PL-operated, which is why the tenancy caveat above matters for outreach.

## 7. Final confidence

**High** on the physical audit — building identity, footprint, gate and dock
layout are well established by imagery and records. The one open item is
**tenancy**: the site is now Smart-Warehousing-branded, so SC Johnson's current
direct occupancy of this DC is uncertain (flagged, not resolved).

**3-line summary**
- Gate: TRUE — sliding/cantilever gate across the west truck drive, fenced yard.
- Guard shack: FALSE — no staffed booth → remote check-in (remoteGs).
- Confidence: HIGH (physical audit); tenancy now Smart-Warehousing — SCJ
  occupancy uncertain.
