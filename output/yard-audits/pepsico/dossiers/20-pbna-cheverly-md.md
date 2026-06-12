# PBNA - Cheverly MD — Deep-Audit Dossier

**Facility:** Pepsi-Cola bottling plant (Bottling Group LLC / PBNA), 2511 Pepsi Pl, Cheverly MD 20781
**Locked center:** 38.92670, -76.92560 (roster geocode was RANGE_INTERPOLATED and sat ~150m SW on the road; corrected to the building rooftop)
**Audited:** 2026-06-12 · method: deep-audit (satellite z16-z19 + Street View 2022-07)

## Location confirmation
The landmark plant beside the Baltimore-Washington Pkwy. Street View from the south
road shows the PEPSI sign on the building; the yard is full of Pepsi-branded trailers
and blue bottle shells; Pepsi Pl dead-ends at the plant's roundabout. Identity certain.

## Entrance / gate / guard shack
- **One truck gate**, at the west side of the Pepsi Pl roundabout (38.92655, -76.92425):
  chain-link fence on both sides, gate hardware, 5-mph + STOP signage, and all trucks
  pass under a **large steel check-in canopy**. A booth-sized tan structure with a STOP
  sign sits beside the lane — read as a staffed check-in booth (flagged uncertain).
  Verdict: `truckGate: true`, `guardShack: true` (medium), `remoteGs: false`.
- Entry and exit share the throat (1 lane each way). No room for a bypass lane —
  `fastLaneOpportunity: false`. Queue spillback would reach the roundabout within ~2
  trucks (`backupSensitive: true`, though Pepsi Pl is a low-traffic dead-end).
- South and west frontages are fenced with no truck access (employee car entrance on
  the west road only).

## Docks and yard
- **South-face dock bank**: ~12 trailers backed in (z19). **East-face angled bank**:
  ~12-15 docked. Estimated ~26 doors → band **25-50** (lower edge, flagged).
- **SE drop yard**: dense angled trailer rows behind the south fence (~45 trailers in
  one frame). **NE yard**: trailer + blue-shell storage north of the canopy. Total
  ~75 trailers visible, est. capacity ~90 → `dropArea: 50+`, `dropYard: true`.
- Two physically separate dock clusters (south vs east faces) → `shipRcvSeparate: true`
  (inferred from overhead).
- Site is hemmed in by BW Pkwy woods, a slope to the south road, and neighbors —
  a tight ~13-acre urban yard.

## Geofences
- **Perimeter**: 9-vertex ring (~13.2 acres by shoelace) following the west road
  (diagonal SW edge), the north tree line, the NE yard, the east fence at the gate
  throat, and the south fence above the road slope. The lot is not rectangular; the
  ring follows the real fence geometry.
- Truck gate quad over the canopy/throat; 2 drop-yard rings (SE yard, NE yard);
  2 dock-apron quads (south bank, east bank).
- Street View: gate + perimeter pano `WV-YVxAC68KEbfCndGwawg` on the roundabout
  (heading ~277° = the driver's arrival frame into the canopy); drop yard visible from
  pano `SGg2YVQZB5OhuMDBnCjd1g` on the south road. No coverage at dock aprons.

## Web corroboration
Roster sources (D&B/YellowPages) list Bottling Group LLC at 2511 Pepsi Pl; the
landmark "Pepsi sign" plant along the BW Parkway serving the DC metro. Layout
(plant + route fleet + drop yard + single canopy gate) matches a metro bottler.

## Verdict
Gated single-throat site with a check-in canopy and probable booth; tight urban yard,
heavy drop operation, queue-sensitive entrance — strong fit for gate automation /
fast-lane messaging (no room to add physical lanes; digital check-in is the lever).
**Confidence: high.** Uncertain: guardShack, dock band, postGateStaging,
backupSensitive, shipRcvSeparate.
