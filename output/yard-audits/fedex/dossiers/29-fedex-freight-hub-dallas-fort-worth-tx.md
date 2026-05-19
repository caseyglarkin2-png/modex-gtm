# Deep-Audit Dossier — idx 29

## FedEx Freight Hub - Dallas/Fort Worth TX

**Type:** Freight LTL hub service center (DFW metro)
**Resolved coordinates:** 32.8378, -97.3340
**Confidence:** medium

## Location resolution

The roster supplied "3600 Reeves Pl, Fort Worth, TX 76119" and coordinates
(32.790629, -97.223508, RANGE_INTERPOLATED). Step-0 satellite probes and Street
View at the roster point showed a small multi-tenant flex/industrial building
(drive-in garage doors) in the Carter Industrial Park, SE Fort Worth — NOT an
LTL freight hub. The roster address is wrong for this facility.

Web research found the official FedEx Freight FTW service center at 1909 Great
Southwest Pkwy, Fort Worth, TX 76106 (FedEx Freight FTW service-center map PDF
and locator). That address sits in the Great Southwest Industrial District
(GSID), inside Loop 820 north of Meacham Blvd. Geocoding (OSM Nominatim) placed
1909 Great Southwest Pkwy at ~32.8358, -97.3386; satellite probing the
immediate area revealed an LTL cross-dock terminal complex at approximately
32.8378, -97.3340. Locked center: 32.8378, -97.3340.

## Key views

- **Roster point (z15, Street View 2023):** Carter Industrial Park flex
  buildings — not a freight hub.
- **GSID satellite (z17-18):** An LTL cross-dock terminal complex — multiple
  long narrow cross-dock buildings with trailers backed in along both long
  faces, dock aprons, trailer parking, and a rail line along the south edge.
- **Street View (2023, 2025):** Fenced LTL terminal yards along Great Southwest
  Pkwy; a 'C.M.I.' trailer was seen at one cross-dock, indicating this is a
  multi-carrier terminal corridor. No direct FedEx signage was captured.

## Determinations

- **Facility identity:** The cross-dock complex at the resolved location is
  unmistakably an LTL truck terminal. It appears to be a multi-carrier terminal
  corridor; FedEx Freight FTW occupies a cross-dock within it. Facility type and
  general location are confident; the exact FedEx building footprint within the
  complex is medium-confidence (no FedEx signage directly confirmed).
- **truckGate = true.** LTL terminal yards in this complex are fenced and gated
  off Great Southwest Pkwy. Exact gate not directly confirmed.
- **guardShack = false / remoteGs = true.** No staffed guard booth identified;
  LTL service centers of this size typically use remote/kiosk gate check-in.
  Low-medium confidence.
- **dockDoors = "50+".** Long cross-dock buildings with doors on both long
  faces; ~130-door overhead estimate.
- **dropArea = "25-50" / dropYard = true.** Trailer parking and dock aprons hold
  dozens of trailers/pups.
- **multipleFacilities = true.** Multi-carrier terminal corridor with several
  cross-dock buildings (FedEx's footprint is a subset).

## Yard zones and counts

- **perimeter:** S 32.8362, W -97.3395, N 32.8398, E -97.3300 (~70 acres
  around the terminal complex; FedEx's leased portion is a subset).
- **truckGate:** small box on the Great Southwest Pkwy access side.
- **dropYards:** one box covering the trailer parking around the cross-docks.
- **dockAprons:** one box along the cross-dock building faces.
- **staging:** null.
- **yardMetrics:** dockDoorCount ~130, trailersVisible ~110, capacity ~250,
  1 truck gate, ~4 buildings, ~70 acres, not rail-served (rail runs along the
  south edge but no spur into the yard).

## Web findings

FedEx Freight FTW service-center map PDF and locator confirm 1909 Great
Southwest Pkwy, Fort Worth, TX 76106 as the FedEx Freight Fort Worth service
center. The roster's 3600 Reeves Pl address appears to be an incorrect listing.

## Final confidence

Medium. The roster address was wrong; the correct FedEx Freight FTW service
center was located in the GSID as an LTL cross-dock terminal. Facility type and
location are confident, but the exact FedEx building within the multi-carrier
terminal corridor and the gate/guard details are inferred rather than directly
confirmed.
