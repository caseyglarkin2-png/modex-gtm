# CJ Logistics - Chester VA — Deep Audit Dossier

**Idx:** 26
**Type:** Distribution Center
**Resolved coords:** 37.29775, -77.39925 (16000 Walthall Industrial Pkwy, South Chesterfield VA 23834)
**Confidence:** medium

## Location resolution
Roster supplied no street address (source: Indeed CJ Logistics America
locations list) and city-centroid coords (37.3565, -77.4317) for Chester
VA, ~7 km from the actual building.

Web research found a documented **DSC Logistics / CJ Logistics America**
facility at **16000 Walthall Industrial Pkwy, South Chesterfield VA 23834**
(the Richmond-area site; the Chester/Colonial Heights/Chesterfield names
all refer to this cluster). Manta, Yellowpages, Loc8NearMe and D&B all list
this DSC Logistics location with cjlogistics.com as the company site. DSC
Logistics is CJ Logistics America's legacy brand. Geocoding API returned
ROOFTOP precision at 37.2983, -77.3998; satellite confirmed a large
multi-section cross-dock distribution building.

## Key views
- **z16/z17 overview:** Long multi-section warehouse (~6 connected gabled
  sections, ~700 ft) running NW-SE, set in woods, with trailers backed into
  docks along both long faces. Access road winds in from the NW.
- **z19 entrance:** Auto parking lot at the NW end; water tank; truck
  driveway running along the truck court. Only utility transformers near
  the entry — no guard booth or gate barrier.
- **z19 NE side:** Truck court along the NE face with dock doors and
  trailers; a rail line runs NW-SE beyond a drainage ditch.
- **z21 entry close-ups:** Small structures at the truck court entry
  resolved to electrical transformers, not a guard shack.
- **Street View 2024-04:** Coverage limited to the industrial access roads;
  modular/trailer office building on one access road; no gate seen.

## Gate / guard-shack / dock determinations
- **truckGate: false** — Winding wooded access road from Walthall
  Industrial Pkwy; at the building the truck driveway is an open approach
  with no barrier arm, sliding gate, or checkpoint pinch-point.
- **guardShack: false** — No staffed booth at the building entrance or
  truck court.
- **remoteGs: false** — No gate.
- **dockDoors: 50+** — Long multi-section cross-dock building with trailers
  along both long faces; ~60 doors estimated. Approximate.
- **dropArea: 10-25 / dropYard: false** — Trailers seen at docks on both
  faces; no clearly dedicated separate trailer-storage lot (low confidence).
- **shipRcvSeparate: true** — Docks on two opposing building faces.
- **drivewayLong: true** — Long winding access road plus a deep truck court.
- **railServed: false** — A rail line runs just NE of the building but it
  is a through line; no spur enters the property.

## Yard zones and counts
- **perimeter:** ~49 acres — building plus truck courts on both faces and
  the NW auto parking / access apron.
- **truckGate:** null — open, uncontrolled entry.
- **dockAprons:** SW-face apron and NE-face apron.
- **railServed: false.**

## Web findings
- 16000 Walthall Industrial Pkwy documented as a DSC Logistics location
  (Manta, Yellowpages, Loc8NearMe, D&B, CMac), phone (804) 520-2002. DSC
  Logistics rebranded to CJ Logistics America. Indeed carries CJ Logistics
  America Chesterfield VA employee reviews.

## Final confidence
**Medium.** The building is positively the documented DSC/CJ Logistics
Richmond-area site and the open, ungated layout is clear in high-zoom
satellite imagery. Confidence held at medium because the roster gave no
address (resolved via the DSC legacy link) and Street View coverage of the
building's own entrance is absent. Dock and trailer counts are honest
overhead estimates.
