# Deep-Audit Dossier — Constellation Gonzales Winery (idx 4)

**Account:** Constellation Brands
**Facility:** Constellation Gonzales Winery — Gonzales, CA
**Type:** Winery / Production Facility
**Address:** 800 S. Alta Street, Gonzales, CA 93926
**Resolved center:** 36.502400, -121.434700
**Confidence:** medium

## Location confirmation (Step 0)

The roster coordinate (36.501207, -121.433476, GEOMETRIC_CENTER, moved 1073 m)
landed inside the correct industrial area but was imprecise. Satellite probing
at zoom 16-20 plus web research positively identified the facility.

The key finding: **two separate industrial operations sit side by side on S
Alta Street.** Street View at the SW industrial building revealed a sign
reading "braga ... LINE TRUCK ENTRANCE" — that building cluster is **Braga
Fresh** (a produce/vegetable packer, 500 S Alta St), NOT Constellation. It has
a large, busy trailer yard, but it was excluded from this audit.

The **Constellation Gonzales Winery (800 S Alta St)** is the large complex to
the NE: a massive open-air **tank farm** (~70-80 large white wine tanks), a
big **warehouse** with an extensive rooftop solar array, a **crush/processing
pad**, and a **south administrative/processing building cluster**. Web sources
(California Sustainable Winegrowing; a Constellation/PRNewswire solar release
citing the Gonzales winery's large rooftop solar installation) corroborate
this is the Monterey County production winery. The property is bounded by
US-101 on the east, S Alta Street on the west/SW, and farmland to the south.

## Key views

- **z16-17 overview:** Full campus — tank farm (NW), solar-roofed warehouse
  (center), crush pad (S of warehouse), and an admin building cluster with its
  own solar at the SE near the entrance. A landscaped oval/roundabout marks
  the entrance approach.
- **z18-21 building/gate probes:** Confirmed winery production buildings, the
  tank farm, and a divided in/out entrance road off the public road at the SE.
- **Street View (S Alta St, 2025-03):** Showed the Braga Fresh property and
  its truck-entrance sign, residential parcels on the west side of the road,
  and the winery behind chain-link fencing. Street View does NOT cover the
  winery's private entrance drive.

## Gate / guard-shack / dock determinations

- **Truck gate — false (low confidence).** The winery's main entrance is a
  divided road (separate ENTER/EXIT lanes, painted pavement markings) running
  off the public road at the SE, with a small admin/office structure beside
  it. No barrier arm or sliding/swing gate is visible across the truck lane in
  satellite imagery, and Street View does not reach the private drive. Treated
  as an open industrial entrance.
- **Guard shack — false.** The small structure at the entrance reads as an
  administrative/reception office, not a dedicated 1-3-vehicle guard booth set
  beside a gated lane.
- **Remote GS — false.** No truck gate identified.
- **Docks — "0-10".** This is a winery production campus, not a freight DC.
  No long bank of freight dock doors. Estimate ~6-12 service/loading doors
  across the warehouse south face and crush-pad service area. Low confidence.
- **Drop area — "0-10".** Roughly 6-10 trailers seen parked along internal
  roads and near the crush pad; not a dedicated marked drop lot. (The large
  trailer yard nearby belongs to Braga Fresh and was excluded.)

## Yard zones and counts

- **Perimeter:** entire winery property ≈ 41 acres (US-101 to S Alta St,
  ~470 m N-S by ~340 m E-W footprint of the developed campus).
- **Truck gate zone:** the divided entrance road / admin-office area at the SE.
- **Drop yard:** trailer parking strip along the internal road S of the
  warehouse / W of the crush pad.
- **Dock apron:** warehouse south-face / crush-pad service strip.
- **Staging:** internal paved holding/circulation area between the entrance
  and the production buildings (post-gate).
- **Metrics:** dockDoorCount ~10, trailersVisible ~8, trailerParkingCapacity
  ~20, truckGateCount 1, buildingCount 4, siteAreaAcres ~41, railServed false
  (US-101-corridor rail line passes the east boundary but no spur enters).

## Web findings

- Confirmed 800 S Alta St, Gonzales CA 93926 as the Constellation winery
  (Monterey County production winery; Central Coast crush capacity expanded
  from 70K to 80K tons; retained by Constellation after the 2025 Wine Group
  sale).
- Confirmed the adjacent SW operation as Braga Fresh (500 S Alta St) — a
  separate produce company — and excluded it from the audit.

## Final confidence

**Medium.** The facility is positively identified and the campus layout is
clear, but the truck gate / guard-shack determination relies on satellite
imagery only (no Street View of the private drive), and dock/trailer counts
are honest overhead estimates for a winery (not a standard freight DC). Those
fields are flagged in `uncertainFields`.
