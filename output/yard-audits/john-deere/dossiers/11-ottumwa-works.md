# Deep-Audit Dossier — John Deere Ottumwa Works (idx 11)

**Facility:** John Deere Ottumwa Works — Ottumwa, IA
**Type:** Assembly Plant (hay and forage equipment, windrowers)
**Address:** 928 E Vine St, Ottumwa, IA 52501
**Resolved center:** 41.003824, -92.4103
**Confidence:** High

## Location confirmation (Step 0)
The roster geocode (ROOFTOP, moved 2034 m) landed directly on a large multi-building
industrial complex on the east edge of Ottumwa, bounded by the Des Moines River and
US-63 to the east and a residential street grid to the west and south. The scale and
layout — many connected long-span manufacturing buildings, material storage yards,
and a fenced perimeter — are fully consistent with a legacy John Deere assembly plant.
Web search confirmed the address (928 E Vine St) and the facility identity. Coordinates
locked at the supplied point.

## Key views
- **Wide (z16/z17):** Sprawling campus of ~8 distinct connected/adjacent manufacturing
  buildings, extensive open paved yards, material laydown areas, and trailer storage.
- **South gate (z19/z21):** The truck access road runs north from E Vine St into the
  property. At z21 a small gatehouse structure sits in the drive with a paved apron in
  front and a perimeter fence line running off both sides — a controlled checkpoint.
- **Street View (2024-09):** Panos cover the large employee parking apron south of the
  plant. Views toward the entrance show the gate structure(s) and continuous chain-link
  perimeter fencing wrapping the plant property.
- **Docks (z19/z20):** Dock doors are distributed across several building faces in the
  legacy style — south-central building (shipping) and east/north faces — not a single
  modern bank.
- **SE / N yards (z18/z19):** Large open lots with rows of parked trailers and staged
  material — dedicated drop/storage yards.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Satellite z21 shows a structure occupying the truck drive with
  a defined apron — a checkpoint pinch-point — plus a perimeter fence. Single truck
  entrance off the south access road.
- **guardShack = true.** A small standalone gatehouse booth (~1-2 vehicle footprint)
  sits at the entrance. Driver reviews explicitly reference "friendly staff from the
  gate house to the docks" and on-site security controlling access. remoteGs = false.
- **dockDoors = "25-50".** Legacy assembly-plant docks scattered across multiple
  building faces; estimated 25-50 total (low confidence — flagged).
- **shipRcvSeparate = true.** Shipping and receiving observed on physically separate
  building faces.

## Yard zones and counts
- **Perimeter:** ~110 acres fenced plant property (irregular parcel, river/highway to E,
  residential to W/S).
- **Truck gate:** single controlled entrance, south access road.
- **Drop yards:** SE open lot and N material/trailer yard; ~70 trailer parking capacity.
- **Dock apron:** strip along the south-central shipping building.
- **Staging:** large paved internal yards between gate and docks.
- **Metrics:** ~30 dock doors (est.), ~28 trailers visible, ~70 trailer capacity,
  1 truck gate, ~8 buildings, ~110 acres, no rail spur.

## Web findings
Driver reviews (Yelp / Loc8NearMe) describe a well-maintained factory, night truck
parking available, security ensuring safe access, ~30-minute unloading, and portable
washrooms in the dock area — consistent with a staffed, gated, drop-friendly plant.

## Final confidence
**High.** Facility unambiguously identified; gate and guard shack confirmed by both
imagery and corroborating driver reviews. Dock-door count is the main low-confidence
item (legacy scattered docks) and is flagged in uncertainFields.
