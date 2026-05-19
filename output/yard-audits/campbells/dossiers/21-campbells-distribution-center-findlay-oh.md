# Deep-Audit Dossier — Campbell's Distribution Center, Findlay OH (idx 21)

## Facility
- **Name:** Campbell's Distribution Center - Findlay OH
- **Type:** Distribution center — 740,000 sq ft, $44M, operated by DHL Supply Chain
- **Confirmed address:** 1000 E Bigelow Ave, Findlay, OH 45840
  (Tall Timbers West Industrial Park, I-75 corridor)
- **Locked coordinates:** 41.07900, -83.63550

## Step 0 — Location resolution
The roster supplied only "Findlay, OH 45840" with an APPROXIMATE geocode
(41.039128, -83.650231) that landed in downtown Findlay — not the DC.

Web research established the facility: Campbell Soup's $44M, 740,000 sq ft
distribution center, operated by DHL Supply Chain, opened ~2018 in **Tall
Timbers West Industrial Park** along I-75, "across from the Lowe's RDC". The
Lowe's RDC geocodes to 41.0852, -83.6360 (12700 County Road 212). Probing the
adjacent industrial cluster found a large DC with a refrigerated section just
south of Lowe's. OSM reverse-geocode of that building returns **"Campbell's,
1000 East Bigelow Avenue, Findlay"** — positive confirmation. Locked center
41.0790, -83.6355.

## Site layout
- One very large distribution building (white main DC plus an attached
  darker-roofed refrigerated/freezer section on the east end).
- **North:** employee parking lot with a red-canopied office entrance.
- **South / SE:** the building's main dock-door bank, fronted by a wide dock
  apron.
- **West / NW:** a large trailer drop yard.
- **South:** a very large trailer-storage yard with hundreds of trailers in
  marked rows.
- Setting: edge-of-town industrial park surrounded by active agricultural
  fields, on the I-75 corridor outside Findlay.

## Gate / guard-shack determination
- **truckGate: true.** A truck lane pinches at a checkpoint on the SE side of the
  building, controlling access into the dock yard.
- **guardShack: true.** A small 1-vehicle-footprint gatehouse structure sits
  directly beside the SE truck lane, clearly visible at z18–z20 satellite — the
  classic guard-booth position at the truck entrance.
- **remoteGs: false.** A staffed guard booth is present, so this is not a
  kiosk/remote check-in.

## Docks, yard and counts
- **Dock doors:** long dock-door bank along the building's south/SE face — for a
  740,000 sq ft DC, comfortably **50+**; point estimate ~90 (flagged
  low-confidence due to variable imagery resolution).
- **dropArea: 50+** — the south trailer yard alone holds well over 100 trailers
  in marked rows; a second drop yard sits NW/W of the building.
- **Trailers visible:** ~230 across the captured imagery (approximate).
- **Buildings:** 1 (single DC with attached freezer wing).
- **Rail:** none — no spur enters the property (despite the park's proximity to
  the CSX North Baltimore railyard).
- **Scale:** none visible.
- **Site area:** ~58 acres from the perimeter box.

## Geofences
- **Perimeter:** S 41.07550 / W -83.64120 / N 41.08230 / E -83.63080.
- **truckGate:** SE-side guard-booth checkpoint.
- **dropYards:** NW/W trailer yard; large south trailer-storage yard.
- **dockApron:** south/SE building dock face.
- **staging:** paved post-gate holding area between the SE booth and the docks.

## Classification rationale
Large rural distribution center with a guarded truck entrance → truckGate true,
guardShack true. Generous gate-to-dock approach and wide aprons (drivewayLong,
postGateStaging, fastLaneOpportunity true). Extensive on-site trailer storage
(dropYard true, dropArea 50+). Single shared entry/exit point. Rural — edge-of-
town industrial park ringed by farmland.

## Web findings
- $44M, 740,000 sq ft, ~220 jobs, operated by DHL Supply Chain.
- Sited in Tall Timbers West Industrial Park for I-75 access and proximity to
  Campbell's Napoleon factory and the CSX North Baltimore freight railyard.

## Final confidence
**High.** Facility positively identified via OSM building label and corroborating
web research; layout, guard booth, docks and trailer yards clearly read from
z17–z20 satellite. Dock-door and trailer counts are approximate (flagged);
connectivityIssue is a low-confidence inference (flagged).
