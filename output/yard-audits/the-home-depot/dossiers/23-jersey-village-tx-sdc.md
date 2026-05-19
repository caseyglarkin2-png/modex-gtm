# Deep-Audit Dossier — Home Depot SDC, Jersey Village TX (idx 23)

**Facility:** Home Depot Stocking Distribution Center
**Address:** 7301 Security Way, Jersey Village, TX 77040 (NW Houston, Harris County)
**DC numbers:** #5501 (co-located MDO #5822) per SupplierWiki HD DC list
**Building:** "Prologis Jersey Village 4" — ~296,839 sq ft on a 44.74-acre lot
**Resolved coordinates:** 29.87742, -95.557076
**Confidence:** High

## Location resolution

Web search (Manta, LoopNet, Showcase, Prologis leasing flyer) confirms 7301
Security Way as a distribution facility in the Prologis Jersey Village
industrial park — a state-of-the-art building with a spacious truck court,
67 numbered dock-high doors with mechanical pit levelers, 4 semi-dock doors,
1 drive-in ramp, and 28' clear height, on a 44.74-acre lot. The roster geocode
was ROOFTOP precision (only 57 m move). Satellite probing confirmed the roster
pin sits on the southern (brown-roof) portion of the large N-S building on the
west side of the Prologis park; a "PROLOGIS Jersey Village" monument sign is
visible in Street View. Location locked.

## Key views

- **z16 wide:** Prologis Jersey Village industrial park at the US-290 / Beltway 8
  interchange — a dense cluster of large distribution buildings in NW Houston.
- **z17/z18:** The HD building runs N-S; its truck dock court is on the WEST
  face. The brown southern roof is the HD/7301 portion. Truck court partly empty
  at time of capture (consistent with ~161,099 SF marketed for lease — partial
  occupancy).
- **z19-z21 + Street View (2025):** The dock court is fully enclosed by a black
  metal perimeter fence with a single cantilever/rolling gate at the SE.

## Gate / guard-shack determination

**Truck gate: YES.** The entire truck dock court is wrapped in a black metal
perimeter fence. A cantilever/rolling gate spans the single truck driveway at
the SE corner (~29.8766, -95.5565), clearly visible in 2025 Street View. This
is a controlled truck entrance — the only way trucks reach the dock line.

**Guard shack: NO.** Street View along the full fenced perimeter shows no
staffed booth structure — only the automated rolling gate. `remoteGs` is
therefore **true**: a real gate with no guard shack, implying badge / kiosk /
automated check-in.

**Lanes:** Single rolling gate over one driveway lane; entry and exit share the
one gate → `entryExitTogether`. The gate sits close to Security Way with only a
short apron → `drivewayShort`. Standard single-lane geometry, no extra paved
width → `fastLaneOpportunity: false`.

## Yard zones & counts

- **Dock doors:** 67 dock-high + 4 semi-dock = 71 doors along the single W-face
  dock line per the leasing listing; Street View shows the long numbered dock
  line (door 78 visible). Band: **50+**.
- **Ship/receive:** One continuous dock bank along the W face — not split into
  separate ship/receive clusters → `shipRcvSeparate: false`.
- **Drop yard:** Trailer parking inside the fenced W truck court; imagery shows
  the court partly empty (~10-25 detached trailers at capture). `dropYard: true`
  but the drop-area band is flagged uncertain given variable occupancy.
- **Staging:** Paved truck court inside the gate before the dock doors provides
  post-gate holding room; no dedicated pre-gate staging apron.
- **Site area:** 44.74-acre lot per the Prologis listing.
- **Rail:** No rail spur.
- **Buildings:** Single building (7301 Security Way); neighboring Prologis-park
  warehouses are separate facilities.

## Web findings

The SupplierWiki HD DC list catalogs this as SDC #5501 with a co-located MDO
(#5822) — a stocking DC plus an appliance/bulky market-delivery operation. The
Prologis leasing flyer marketing ~161,099 SF at 7301 indicates the building is
only partially occupied by HD, consistent with the relatively light trailer
activity seen in current imagery. Strategic location at US-290 / Beltway 8 with
access to SH-249, Grand Parkway 99, and I-45.

## Final confidence

**High.** Location confirmed by ROOFTOP-precision geocode, leasing-listing
building specs, and the Prologis monument sign. Gate and absence of a guard
booth are clearly established from 2025 Street View. Trailer-count and
drop-area band flagged uncertain because the truck court occupancy is variable
and the building is partially leased.
