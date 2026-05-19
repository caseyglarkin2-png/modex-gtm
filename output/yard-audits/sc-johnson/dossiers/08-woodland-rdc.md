# Deep-Audit Dossier — SC Johnson Woodland Regional Distribution Center

**Facility:** Woodland Regional Distribution Center
**Address:** 2030 Hanson Way, Woodland, CA 95776
**Resolved center:** 38.67840, -121.72730
**Type:** Regional Distribution Center (aerosol storage)
**Audit method:** Satellite (z16–z19) + Street View (Jan/Mar 2026, Mar 2022) + web research
**Confidence:** High

---

## 1. Location resolution

Roster coordinates 38.678343, -121.72736 (geocode moved 103 m) land correctly
on the building. Identity confirmed via the **EPA Risk Management Plan record**
for the "Woodland Regional Distribution Center" at 2030 Hanson Way, a **Panjiva
buyer record** (S.C. Johnson & Son Inc., 2030 Hanson Way Woodland CA), and the
LoopNet "Hanson Way Distribution Center" listing. The Journal Times reported
SC Johnson leasing a **~200,000 sq ft** distribution facility in Woodland; the
LoopNet record gives the building specs: **built 2002, 30-ft clear height,
40 docks plus 1 drive-in.** It serves Northern California and stores
LPG-propellant aerosol finished goods (the basis for the RMP filing).

The SCJ building is the **lone mid-size white-roof warehouse**; the much larger
buildings immediately to the north and east are separate tenants. Locked
center: 38.67840, -121.72730.

## 2. What the key views showed

- **Wide satellite (z16):** A compact mid-size warehouse sitting among several
  much larger distribution buildings; open farmland borders the parcel to the
  west.
- **Tight satellite (z18–z19):** Dock banks on **both the north and south long
  faces** — trailers backed in on both, with truck yards in front of each. The
  west side carries the office entrance and employee parking.
- **Street View (Jan 2026, west face):** The building's office front is set
  behind **chain-link fencing** enclosing the parking lot. Arched entry façade.
- **Street View (Mar 2022, SE):** The fronting road is a public arterial; the
  SCJ parcel and its truck yards sit behind landscaping/fence.

## 3. Gate / guard-shack determination

- **truckGate = true.** The parcel is a controlled-access fenced site —
  chain-link fence rings the office parking and the truck yards, with gate
  openings where the perimeter drive enters the truck yards on the north and
  south faces.
- **guardShack = false.** No staffed guard booth was visible at the entrance or
  yard gates in Street View along the two fronting roads.
- **remoteGs = true.** Gate/fence present, no guard shack → remote check-in
  (kiosk / badge) is the implied control.
- **multiStep = false.** No second checkpoint.

## 4. Yard zones and counts

- **Perimeter:** Captures the ~200k sq ft warehouse, the north and south truck
  yards, and the west office parking. ≈ 14 acres — a compact parcel.
- **Drop yards:** Two — a north-face yard and a south-face yard — both with
  parked trailers without tractors.
- **Dock aprons:** Two, one per long face.
- **dockDoorCount ≈ 42** (web research: 40 docks + 1 drive-in).
- **trailersVisible ≈ 25** (winter/dry-season captures; count approximate).
- **trailerParkingCapacity ≈ 70.**
- **truckGateCount = 1.**
- **buildingCount = 1.**
- **railServed = false** — no rail spur into the parcel.

## 5. Web findings

EPA RMP "Woodland Regional Distribution Center" — storage/distribution
warehouse for SC Johnson aerosol consumer products; LPG propellant drives the
RMP. LoopNet/Showcase "Hanson Way Distribution Center": built 2002, 30-ft
clear, 40 docks, 1 drive-in. Journal Times: SC Johnson leased a ~200,000 sq ft
Woodland facility. The site provides Northern California coverage and matches
the dossier-noted historical Woodland CA RDC.

## 6. Final confidence

**High.** Building identity and core specs corroborated by EPA, LoopNet and
Journal Times. Layout and fenced-compound classification read clearly from
imagery and Street View. Trailer count and lane counts are soft (flagged).

**3-line summary**
- Gate: TRUE — chain-link-fenced parcel, gate openings into the truck yards.
- Guard shack: FALSE — no staffed booth → remote check-in (remoteGs).
- Confidence: HIGH.
