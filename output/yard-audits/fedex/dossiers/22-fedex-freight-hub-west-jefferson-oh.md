# Deep-Audit Dossier — idx 22

## FedEx Freight Hub - West Jefferson OH (Columbus, CMH)

- **Type:** Freight LTL hub service center (~278 doors)
- **Address:** 10 Commerce Pkwy, West Jefferson, OH 43162
- **Resolved center:** 39.95620, -83.34370
- **Confidence:** high

## Location confirmation (Step 0)
The roster geocode (39.956197, -83.343704, ROOFTOP, moved 5969 m) landed
directly on the building. Satellite probes z16-z21 showed an unmistakable LTL
cross-dock terminal: a single very long, narrow building with dock doors on both
long faces and trailers backed in along nearly its full length. Street View at
the entrance driveway (pano captured 2024-08) shows a **FedEx Freight monument
sign**, confirming the CMH service center. Address corroborated by FedEx Freight
service-center data, Waze and Loc8NearMe.

## What the key views showed
- **Wide (z16):** Classic LTL hub layout — long cross-dock building running
  NW-SE, large trailer drop yards, an office/shop building at the SE, and a
  highway interchange to the north. Surrounded by farmland and retention ponds.
- **Tight (z18-z21):** Dock doors and trailers backed in along both long faces
  of the main building; dolly/equipment cluster in the central yard; rows of drop
  trailers on the SE and at the NW dock end.
- **Truck gate (z20-z21):** The entrance driveway from Commerce Pkwy crosses a
  fence line at a pinch point. A small square guard-booth structure (~1-2
  parking-space footprint) sits beside the driveway at that pinch — a textbook
  guarded freight-terminal entrance.
- **Street View:** FedEx Freight sign at the entrance; long driveway leading up
  to the gate.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Single controlled entrance off Commerce Pkwy; fence line
  crosses the driveway at a clear pinch point.
- **guardShack = true.** Small staffed booth resolved on z21 satellite beside the
  truck lane at the gate. remoteGs = false accordingly.
- **dockDoors = "50+".** ~278 dock doors per FedEx Freight service-center data;
  doors visible on both long faces of the building.
- **dropArea = "50+", dropYard = true.** Large trailer drop yards SE and NW with
  hundreds of parked trailers.

## Yard zones and counts
- **perimeter:** ~39.9534 S / -83.3472 W / 39.9593 N / -83.3389 E — ~62 acres
  covering the fenced LTL terminal property.
- **truckGate:** the gate/guard-booth pinch point on the SE entrance driveway.
- **dropYards:** SE trailer yard and the NW yard beyond the dock end.
- **dockAprons:** the paved strips along both long faces of the cross-dock
  building where trailers back in.
- **staging:** paved apron outside/at the gate for waiting trucks.
- **yardMetrics:** ~278 dock doors, ~360 trailers visible, ~450 trailer capacity,
  1 truck gate, 2 buildings (cross-dock + shop), ~62 acres, no rail spur.

## Web findings
FedEx Freight CMH service center, 10 Commerce Pkwy, West Jefferson OH 43162 —
Columbus-area LTL hub. Listings note onsite services and secure truck parking,
consistent with a guarded freight terminal.

## Final confidence
**High.** Facility identity is certain (FedEx Freight sign + unmistakable LTL
cross-dock footprint). Gate and guard booth are both clearly resolved on
high-zoom satellite. Only entry/exit lane split is approximate.
