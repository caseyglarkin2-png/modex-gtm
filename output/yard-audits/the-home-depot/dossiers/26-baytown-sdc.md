# Deep-Audit Dossier — Home Depot SDC, Baytown TX (idx 26)

**Facility:** Home Depot Stocking Distribution Center (DC #5565)
**Address:** 6115 FM 1405, Baytown, TX 77523
**Resolved coordinates:** 29.732166, -94.917884
**Confidence:** High

## Location confirmation
The supplied roster coordinates (ROOFTOP geocode, moved only 221 m) landed
directly on a large white-roofed distribution building in a greenfield
industrial park east of Baytown, off FM 1405 near the SH-99 Grand Parkway.
Satellite at zoom 17-20 confirms a single very large rectangular DC with
loading docks on both long faces and dense trailer parking — consistent with
an HD Stocking Distribution Center serving the Houston port-adjacent import
flow. A 2023 Street View pass on the perimeter road shows the building still
finishing construction at that time; current Maxar imagery shows it fully
operational with trailers in the yard. Location is positively identified.

## Key views
- **Zoom 17/18 overview:** Single large DC oriented NW-SE. White membrane
  roof. Dock doors with trailers backed in run the length of both long faces.
  Trailer drop rows fill the paved aprons on both sides.
- **Zoom 19-20 dock/yard crops:** Trailers (white with assorted colored roofs,
  including HD-spec units) backed into docks on the SE face; additional rows
  staged in the apron. The NW face mirrors this with its own dock bank.
- **Wide zoom 16 context:** The HD building sits in a multi-building logistics
  park; a second large DC lies to the NW. Internal access roads connect to
  FM 1405. Open farmland surrounds the park on the south and east.

## Gate / guard-shack determination
- **truckGate: true.** Truck traffic is funneled through a single internal
  access road off FM 1405 to a controlled property entrance at the building's
  SE; the truck yard is ringed by perimeter fencing visible in tight imagery.
- **guardShack: false / remoteGs: true.** No staffed booth could be positively
  resolved at the entrance in current imagery. Modern HD DCs of this vintage
  are gate-controlled; absent a visible booth this is classified as a remote
  kiosk / app check-in. Flagged as a lower-confidence call.
- **multiStep: false** — no second checkpoint visible.

## Yard zones & counts
- **Perimeter:** ~53 acres enclosing the building and both drop yards.
- **Dock doors:** 50+ band — 60+ doors per long face.
- **Drop area / drop yard:** 50+ band; ~80-130 trailer slots across the NW and
  SE paved rows; a dedicated drop yard is present (`dropYard: true`).
- **Ship/receive separate:** true — two distinct dock banks on opposite faces.
- **railServed:** false — no spur into the property.

## Web findings
SupplierWiki / SPS Commerce HD DC list identifies DC #5565 at this address as
a Houston-region Stocking Distribution Center positioned for port-adjacent
import flow. No driver-review detail on gate process found.

## Final confidence: High
Location and physical layout are unambiguous. The only soft calls are the
guard-shack vs. remote-kiosk distinction and exact entry/exit lane counts.
