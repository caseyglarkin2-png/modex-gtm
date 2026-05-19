# Deep-Audit Dossier — idx 10

## DHL Supply Chain — Whitestown DC — Whitestown IN

**Type:** Distribution Center
**Audited coordinates:** 39.96780, -86.37660 (geocoded "5000 Anson Blvd")
**Confidence:** Medium — facility identification uncertain

## Step 0 — Locating the facility

The roster coordinate was geocoded from "5000 Anson Blvd, Whitestown IN" and **moved
2755m** — a large displacement that signals low geocoding precision. The roster source
itself noted the address came "via Waze / DHL location references" (weak provenance).

Web research confirms DHL Supply Chain **moved to 5000 Anson Blvd, Whitestown** in Q1
2020, and that DHL also runs other nearby Whitestown sites (3930 S 500 E; a Fishback
Creek Business Park facility). The Anson development is a very large logistics park off
I-65 containing **dozens of near-identical speculative warehouses** — many vacant in
current satellite imagery. No DHL signage could be confirmed in Street View: most
park-interior panos are June-2019 (pre-construction), and the few 2023-2025 panos show
other occupants (e.g. "Langham Life Sciences") or unlabeled buildings.

Because the exact DHL building could not be positively isolated among the cluster, the
audit targets the building **at the geocoded coordinate** (39.9678, -86.3766) as the
best-available candidate. That building shows operational dock activity (trailers
backed in), consistent with a facility occupied since 2020.

## Key views

- **Satellite (z17-19):** A single front-load (single-sided) warehouse running SW-NE,
  ~250m long. Dock doors with ~25-30 trailers backed in along the NW long face. The SE
  face borders I-65 with an employee-parking buffer strip and no docks.
- **Truck court:** on the NW side, shared apron with the adjacent warehouse; a short
  row of ~12 drop-yard trailers parked in the court.
- **Entrance:** open driveways within the Anson park road grid; no gate or guard booth
  visible.
- **Street View:** park-interior panos mostly June-2019 pre-construction; 2023-2025
  panos along I-65 show neighboring buildings but no confirmable DHL identification.

## Gate / guard-shack / dock determinations

- **truckGate = false (uncertain).** No barrier, gate, or checkpoint visible — access
  via open industrial-park driveways typical of spec warehouses.
- **guardShack = false (uncertain).** No guard booth visible.
- **remoteGs = false.** No gate, so no remote check-in.
- **dockDoors = 25-50.** ~30-40 dock doors on the single NW face (low confidence).
- **dropArea = 10-25.** ~12 drop-yard trailers in the court.
- **shipRcvSeparate = false.** Single-sided dock face.

## Yard zones & counts

- **Perimeter:** ~290m x ~195m bounding box; the diagonal parcel + truck court is
  estimated at ~15 acres (low confidence — box overstates the diagonal lot).
- **Drop yard:** short trailer row in the NW truck court.
- **Dock apron:** the NW building face.
- **Metrics:** ~35 dock doors; ~42 trailers visible; ~70 trailer parking capacity;
  1 building; ~15 acres; not rail-served.

## Web findings

DHL Supply Chain relocated to 5000 Anson Blvd, Whitestown (Boone County) in Q1 2020 from
4850 W 78th St, Indianapolis. DHL operates several Indiana facilities (Whitestown,
Indianapolis, Mooresville, Franklin, Whiteland). Sources: chamberofcommerce.com,
Better in Boone EDC, Supply Chain Dive.

## Final confidence

**Medium** — the building was audited at the geocoded "5000 Anson Blvd" coordinate, but
the exact DHL-occupied building could not be positively confirmed among the dense
cluster of similar Anson warehouses, and no DHL signage was visible in available
imagery. Recommend human re-verification of the facility identification.
