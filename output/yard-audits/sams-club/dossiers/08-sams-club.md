# Deep-Audit Dossier — Sam's Club Distribution Center, Edwardsville IL

- **Facility:** Sam's Club Distribution Center (Walmart) — fulfillment / DC
- **Address:** 5710 Inner Park Dr, Ste 200, Edwardsville, IL 62025 (Exeter Inner Park)
- **Resolved center:** 38.7659, -90.0513
- **Confidence:** medium
- **Method:** deep-audit (satellite ©2026 + Street View Aug 2023 + web)

---

## Step 0 — Locating the building

The supplied coords (38.766772, -90.051418) landed on the NW corner of the
correct building. Web research confirms a ~370,000 sq ft Sam's Club
distribution / fulfillment center at 5710 Inner Park Dr in Exeter Inner Park,
Edwardsville, opened January 2024 (Walmart corporate, Supply Chain Dive, St.
Louis Regional Freightway, CoStar). The site is the large white-roofed building
in the center of the park, distinct from the brown/dark-roofed warehouses to
the N and the trailer-heavy warehouse across the west canal (a different
tenant). Locked center 38.7659, -90.0513; building long axis runs N–S, rotated
~3° clockwise.

## Layout (what each view showed)

- **Wide z16/z17 overview:** A long N–S building on a peninsula bounded by
  engineered stormwater canals/ponds on the west and east. Employee car
  parking (angled striped stalls full of cars) sits north of the building, with
  retention ponds and Inner Park Drive at the top. Large empty paved aprons
  wrap the east and south sides.
- **North end (z18–z20):** Car parking lot with landscaped oval islands; an
  open driveway crosses a causeway between two ponds out to Inner Park Drive.
  No gate, arm, or booth at this connection.
- **South end (z18–z19):** A continuous dock canopy with a regular door rhythm
  spans the full south (short) face — this is the only dock bank. South of it,
  a wide concrete apron transitions to bare graded dirt (undeveloped parcel).
- **East side (z19):** A vast, essentially empty concrete apron running the
  building's length to the east canal. No trailers, no fence.
- **West side (z18–z20):** A narrow apron pinned against the west stormwater
  canal; no docks on this face.

## Gate / guard-shack determination

- **Truck gate: NO.** In current (©2026) satellite there is no barrier arm,
  sliding/swing gate, or controlled checkpoint at any entrance. Access from
  Inner Park Drive is a wide open two-lane driveway over a landscaped causeway
  between two ponds (z20 main-entry view). The property's W and E sides are
  closed off by canals/ponds (natural barriers), not a security fence; the S
  apron simply meets graded dirt.
- **Guard shack: NO.** No 1–3-car booth at any entrance. The only small
  structure on site (NW corner, z21) is an elongated dark-roofed
  utility/maintenance building (~30 m) sitting inside the parking lot beside a
  pond with a couple of parked trailers/boxes — a back-of-house structure, not
  a gatehouse at a pinch-point.
- **remoteGs: NO** — there is no truck gate at all, so remote check-in does not
  apply.

> Caveat: Google Street View coverage here is a single Aug-2023 pano
> (`HynqAHaV96KQ1s-UvAkkJg`), captured during construction before the building
> was finished/occupied — it shows the Exeter Inner Park monument sign and
> graded earth, not a finished gate. The gate / guard-shack calls therefore
> rest on current satellite imagery, which is why overall confidence is
> **medium** rather than high.

## Docks, trailers, yard

- **Dock doors:** ~44 along the south face under a continuous canopy → band
  **25-50** (low-confidence exact count).
- **Ship/Rcv:** Single dock bank on one face → not physically separate.
- **Trailers visible:** ~0. The facility is new (Jan 2024) and lightly utilized
  in this imagery; the east and south aprons are empty undelineated concrete.
- **Drop area / drop yard:** No striped trailer-storage stalls; large open
  aprons could be used as drop space but are not configured/marked as such →
  `dropArea: NONE`, `dropYard: false`. Capacity estimate (~120) is the
  theoretical hold of the open aprons if striped.
- **Staging:** Ample paved holding inside the property before the docks
  (`postGateStaging: true`); the wide gate apron also gives clear room to add an
  express/bypass lane (`fastLaneOpportunity: true`).
- **Rail:** None.

## Geofences

- **perimeter** — 6-vertex oriented ring tracing the paved property (parking
  lot + building + E/S aprons) inside the canal/pond barriers; ~30.9 acres.
- **truckGate** — quad over the Inner Park Drive entry causeway.
- **dockApron** — thin quad hugging the south dock wall at the building's angle.
- **dropYard** — quad over the large empty east apron (potential drop space).
- **staging** — quad over the south apron in front of the docks.
- **streetViewMeta** — perimeter heading 148°, truckGate heading 89°, both from
  pano `HynqAHaV96KQ1s-UvAkkJg` (hasCoverage true, but Aug-2023 construction-era).

## Web findings

- 370,000 sq ft Sam's Club distribution / fulfillment center, Exeter Inner Park,
  Edwardsville IL; opened Jan 2024; >100 jobs; greater St. Louis region.
- Sources: Walmart corporate newsroom, Supply Chain Dive, St. Louis Regional
  Freightway, CoStar, Illinois EDC, Fox2Now.

## Final confidence: medium

Building identity, layout, docks, and the open-access (no gate / no guard
shack) finding are clear from current satellite. Confidence is held at medium
because (a) Street View predates completion so the entrance can't be verified at
ground level, and (b) the brand-new, near-empty yard makes trailer/drop counts
estimates rather than observations.
