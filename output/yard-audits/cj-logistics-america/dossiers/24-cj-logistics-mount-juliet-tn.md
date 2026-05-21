# CJ Logistics - Mount Juliet TN — Deep Audit Dossier

**Idx:** 24
**Type:** Distribution Center
**Resolved coords:** 36.0717, -86.43315 (648 Couchville Pike, Mount Juliet TN 37122)
**Confidence:** medium

## Location resolution
Roster supplied no street address (source: Indeed CJ Logistics America
locations list) and city-centroid coords (36.2, -86.5186) that land in
central Mount Juliet, ~17 km from the actual building.

Web research found a documented **DSC Logistics** facility at **648
Couchville Pike, Mount Juliet TN 37122**. DSC Logistics is the legacy
company that CJ Logistics America was formed from (DSC rebranded as CJ
Logistics), so this is the CJ Logistics Mount Juliet site. Geocoding API
returned ROOFTOP precision at 36.0714, -86.4330; satellite confirmed a
large cross-dock distribution building.

Caveat: current directory listings (TruckMap, Yellowpages) show the
building operating as a **Denso/ABB Supply Chain** facility (~380,000
sq ft). Tenancy may have changed since the roster was compiled — the
physical yard audit below is of the correct building regardless.

## Key views
- **z16/z17 overview:** Large cross-dock warehouse running SW-NE, trailers
  backed in along both long faces (NW and SE), truck courts wrapping the
  building, auto parking at the NE end. Several other large DCs nearby
  along the Couchville Pike corridor.
- **z18 dock view:** Long row of trailers backed into dock doors with
  canopies along the NW face.
- **z20/z21 entrance:** Access road runs ~150 m from Couchville Pike up to
  the building. A small white guard-booth structure with a dark roof and
  canopy sits at the truck court / building entrance beside the auto
  parking lot.
- **Street View 2024-12 (Couchville Pike):** Open road junction at the
  public road (no gate at the road); building set back; monument sign
  reading "Denso ... ABB"; canopy/checkpoint structure visible at the
  building entrance.

## Gate / guard-shack / dock determinations
- **truckGate: true** — Long access road from Couchville Pike leads to a
  controlled building entrance; guard-booth structure at the truck court
  entry (z20-z21 satellite).
- **guardShack: true** — Small ~1-vehicle-footprint white booth with dark
  roof and a walkway at the building entrance, consistent with a staffed
  guard shack.
- **remoteGs: false** — Guard booth present.
- **dockDoors: 50+** — Cross-dock building with trailers backed into dock
  doors with canopies along both long faces; ~60 doors estimated for a
  ~380,000 sq ft building. Approximate.
- **dropArea: 25-50 / dropYard: true** — ~50 trailers across the NW/NE
  truck courts.
- **shipRcvSeparate: true** — Docks on two opposing long faces.
- **drivewayLong: true** — Long ~150 m access road plus deep truck courts.

## Yard zones and counts
- **perimeter:** ~40 acres — building plus truck courts on both faces.
- **truckGate:** guard booth at the building entrance.
- **dropYards:** trailer storage across the NW/NE truck courts.
- **dockAprons:** NW-face apron and SE-face apron.
- **railServed: false** — no rail spur.

## Web findings
- 648 Couchville Pike documented as a DSC Logistics location; DSC rebranded
  to CJ Logistics America. Building now associated with Denso/ABB Supply
  Chain (~380,000 sq ft). Indeed has CJ Logistics America Mount Juliet
  employee reviews.

## Final confidence
**Medium.** The building is positively the documented DSC/CJ Logistics
Mount Juliet site and the yard layout (gate, guard booth, cross-dock,
trailer storage) is clear in recent imagery. Confidence is held at medium
because the roster gave no address (resolved via the DSC legacy link) and
current tenancy may be Denso/ABB rather than CJ. Dock and trailer counts
are honest overhead estimates.
