# Deep-Audit Dossier — idx 30

## FedEx Freight Hub - Stockton CA

**Type:** Freight LTL hub service center (Northern California)
**Resolved coordinates:** 37.9118, -121.2235
**Confidence:** medium

## Location resolution

The roster supplied "4444 S B St, Stockton, CA 95206" and coordinates
(37.908392, -121.244053, RANGE_INTERPOLATED). Step-0 satellite probes at the
roster point showed a modern big-box distribution-warehouse park in south
Stockton — NOT an LTL freight hub. The roster address is wrong for this
facility.

Web research consistently lists the FedEx Freight STK service center at 4520 S
Highway 99 / 4520 CA-99, Stockton, CA 95215 (FedEx Freight STK page, Waze
"FedEx Freight, 4520 CA-99", Yellow Pages, Indeed driver reviews). Geocoding
places that address at ~37.9118, -121.2235, where satellite reveals an LTL
cross-dock terminal complex along the SR-99 corridor. Locked center:
37.9118, -121.2235.

## Key views

- **Roster point (z16):** Big-box DC warehouse park, south Stockton — not a
  freight hub.
- **SR-99 corridor (z17-18):** An LTL cross-dock terminal complex — long narrow
  cross-dock building(s) with a dense regular rhythm of dock doors on both long
  faces, trailers backed in, dock aprons, and extensive trailer parking with
  dense rows of pup trailers.
- **Street View (2026-03):** Perimeter-fenced LTL terminal with a security gate
  along the S Highway 99 frontage road; SAIA branding visible at the main
  cross-dock's SW frontage.

## Determinations

- **Facility identity:** The cross-dock complex at the resolved location is
  unmistakably an LTL truck terminal. Street View shows SAIA branding,
  indicating the complex hosts SAIA LTL Freight; the FedEx Freight STK terminal
  (address 4520 S Hwy 99) is either co-located in this multi-carrier terminal
  complex or occupies an adjacent cross-dock within it. Facility type and
  corridor location are confident; the exact FedEx footprint is medium-
  confidence (no FedEx signage directly confirmed).
- **truckGate = true.** LTL terminal yards in this complex are perimeter-fenced
  with controlled gates (security fence and gate visible in Street View).
- **guardShack = false / remoteGs = true.** No staffed guard booth identified;
  LTL service centers of this size typically use remote/kiosk check-in.
- **dockDoors = "50+".** Long cross-dock building(s) with doors on both long
  faces; ~90-door overhead estimate.
- **dropArea = "50+" / dropYard = true.** Extensive trailer parking with dense
  rows of pup trailers.
- **multipleFacilities = true.** The SR-99 terminal corridor hosts multiple LTL
  cross-dock operations.

## Yard zones and counts

- **perimeter:** S 37.9098, W -121.2258, N 37.9135, E -121.2208 (~40 acres
  around the terminal complex; FedEx's portion is a subset).
- **truckGate:** small box on the S Highway 99 frontage access side.
- **dropYards:** one box covering the trailer parking.
- **dockAprons:** one box along the cross-dock building faces.
- **staging:** null.
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~130, capacity ~280,
  1 truck gate, ~4 buildings, ~40 acres, not rail-served.

## Web findings

FedEx Freight STK service-center page, Waze, Yellow Pages, and Indeed driver
reviews consistently place the FedEx Freight Stockton terminal at 4520 S
Highway 99, Stockton, CA 95215. The roster's 4444 S B St address appears to be
an incorrect listing.

## Final confidence

Medium. The roster address was wrong; the correct FedEx Freight STK service
center was located along the SR-99 corridor as an LTL cross-dock terminal
complex. Facility type and location are confident, but the exact FedEx building
within the multi-carrier terminal complex (SAIA branding observed) and the
gate/guard details are inferred rather than directly confirmed.
