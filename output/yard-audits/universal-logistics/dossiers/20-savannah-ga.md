# Universal Intermodal Services — Savannah Terminal (idx 20)

**Account:** Universal Logistics Holdings
**Facility:** Universal Intermodal Services - Savannah Terminal
**Address:** No street address in roster — resolved to 6052 Commerce Court, Garden City / Savannah GA 31408
**Type:** Intermodal / Drayage Terminal (owned)
**Resolved center:** 32.13320, -81.17500
**Confidence:** Medium

## Location resolution
The roster supplied no address and no coordinates — only "ULH 2025 10-K Item 2
Properties — Savannah GA named as owned terminal yard property serving Port of
Savannah." Web search and the loadmatch intermodal directory resolved Universal
Intermodal Services' Savannah terminal to **6052 Commerce Court, Garden City /
Savannah GA 31408**, ~1.6 miles from the Port of Savannah. The address geocoded
to 32.1329, -81.1751; satellite probing confirmed a truck / intermodal terminal
at that point.

Note: directories show 6052 Commerce Ct shared with Mason Dixon Intermodal —
the audited yard is the Universal Intermodal drayage terminal at that address.
Medium confidence.

## Key views
- **Satellite z17-z19 (tight):** A central shop/office building — distinctive
  sawtooth-roof M&R shop bays plus an office wing — surrounded by a large paved
  truck yard full of tractors and trailers, with fuel tanks. Multiple adjacent
  trailer-storage parcels (paved and unpaved) hold rows of trailers and
  chassis. The access road runs along the west side.
- **Street View (2025-11, from the road):** Tractors and trailers parked behind
  chain-link perimeter fencing; no staffed guard booth visible on the pass.
- **Setting:** an industrial-outdoor-storage zone in Garden City on the western
  fringe of the Savannah port area — trailer-storage yards and woods around,
  with a rail line and highway buffer to the east.

## Gate / guard-shack determination
- **truckGate = true (medium confidence).** The terminal yard is perimeter
  chain-link fenced; truck access is via a gated fenced opening off the west
  access road. No barrier arm was directly resolved, but the fenced gate
  opening functions as the truck gate. C-TPAT/FAST-certified secure-terminal
  status corroborates access control.
- **guardShack = false / remoteGs = true.** No staffed guard booth was
  positively resolved at the entrance in satellite or Street View. Access
  control appears fence/gate-based with office/kiosk check-in. Flagged
  uncertain.
- **multiStep = false.** No second checkpoint stage observed.

## Docks & yard
- **dockDoors = 0-10** (~4). This is a drayage terminal, not a warehouse — the
  central building is an M&R shop (sawtooth-roof shop bays) plus office, with
  only a handful of shop/dock bays.
- **dropArea = 50+ / dropYard = true.** Extensive trailer / container / chassis
  storage — the paved core yard plus multiple adjacent storage parcels hold
  rows of trailers. Classic drayage drop-yard.
- **postGateStaging = true, drivewayLong = true.** Generous paved yard inside
  the gate gives ample truck holding/queue depth before the shop bays.
- **fastLaneOpportunity = false.** The single fenced gate opening off the
  access road has limited width to add a bypass lane.
- **multipleFacilities = false.** Single terminal (shop building + small
  outbuilding).

## Geofence & metrics
- **Perimeter:** S 32.13150 / W -81.17700 / N 32.13470 / E -81.17320 — the
  Universal Intermodal terminal yard and adjacent trailer-storage parcels,
  ~9 acres.
- **Truck gate:** the fenced gate opening off the west access road.
- **Drop yards:** the north/east paved trailer yard and a south trailer-storage
  parcel.
- **truckGateCount = 1**; **buildingCount = 2**; **railServed = false** — a rail
  line runs in the corridor to the east but no spur enters the terminal;
  drayage moves are truck-only.

## Web findings
Universal Intermodal Services operates port/rail-ramp drayage from 40 terminals
and 8 container yards; C-TPAT/FAST-certified, customs-bonded carrier. Savannah
is a 10-K-named owned terminal yard property serving the Port of Savannah.

## Final confidence: Medium
Location positively confirmed via the loadmatch directory address (6052
Commerce Court) + satellite confirmation of a truck/intermodal terminal +
proximity to the Port of Savannah. Medium because the roster gave no
address/coordinates, the address is shared with a co-tenant in directories, and
no barrier arm / guard booth was directly visible to confirm gate type (classed
remoteGs from fence-gate evidence + C-TPAT status).
