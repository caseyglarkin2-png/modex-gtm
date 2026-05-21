# Deep-Audit Dossier — Niagara Bottling, Temple TX

**Roster idx:** 28
**Address:** 5419 Wendland Rd, Temple, TX 76504
**Resolved center:** 31.156095, -97.354586 (main manufacturing plant centroid)
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** Medium

## Location confirmation
Roster coordinates (31.156095, -97.354586, ROOFTOP) land on a large
white-roofed manufacturing building. Web search confirmed Niagara Bottling's
Temple plant — a $90M, ~728,000 sq ft purified-water facility at 5419 Wendland
Rd in the Temple Industrial Park, opened 2019, with a subsequent $48M expansion
adding a logistics/distribution center (Temple Chamber, niagarawater.com,
KDH/TDT News). Street View (2026-04) shows the Niagara monument sign at the
Wendland Rd driveway and the branded plant — positive identification. Imagery
shows two large buildings: the original plant (north) and the logistics-center
expansion (south).

## Key views
- **z16 campus** — Two large Niagara buildings connected by an internal road,
  bounded by Wendland Rd on the west, farm fields on the east, and a rail line
  along the south.
- **Main plant east face (z19)** — A long dock bank with trailers backed in,
  plus stacked materials in the yard.
- **Logistics center (z18)** — Dock banks on its faces with rows of trailers
  (orange and white) backed in and parked.
- **Wendland Rd entrance (Street View 2026-04)** — Niagara monument sign at an
  open driveway; landscaped grass buffer; no fence, gate or booth.
- **Rail line (z18 south)** — A rail mainline/siding with rail cars runs just
  south of the logistics center but does not spur onto the property.

## Gate / guard-shack / dock determinations
- **Truck gate:** **false** (open driveways). The campus is bounded only by a
  landscaped grass buffer along Wendland Rd; there is no perimeter security
  fence, no barrier arm and no guard booth across any driveway — just a Niagara
  monument sign at the entrance. Medium confidence.
- **Guard shack:** **false.** No staffed-booth structure at any entrance. A
  small white structure near the main plant's NE corner reads as a
  process/utility building, not a gatehouse.
- **Remote GS:** **false** (no gate ⇒ no remote check-in inferred).
- **Dock doors:** **50+** band. The main plant has a long dock bank on its east
  face; the logistics center adds dock banks on its faces. Combined estimate
  ~90 doors.
- **Drop area / drop yard:** **50+** band; `dropYard: true`. Both buildings
  have large trailer yards holding 80+ tractor-trailers and drop trailers.
- **Multiple facilities:** **true** — two distinct large Niagara buildings on
  one campus (manufacturing plant + logistics center).

## Yard zones and counts
- **Perimeter:** ~78 acres — spans both buildings, their dock aprons and
  trailer yards.
- **Truck gate:** approximated at the SW Wendland Rd driveway (2 driveways
  serve the campus).
- **Drop yards:** main plant east yard + logistics center south yard.
- **Dock aprons:** main plant east apron + logistics center aprons.
- **Metrics:** ~90 dock doors, ~85 trailers visible, ~140 trailer capacity,
  2 truck gates, 2 buildings, ~78 acres, not rail-served.

## Web findings
Niagara Bottling Temple — $90M, ~728,000 sq ft purified-water plant opened
2019, plus a $48M expansion adding a logistics center for regional beverage
distribution. Confirmed via Temple Chamber, niagarawater.com and local news.

## Final confidence
**Medium.** Facility identity and the two-building campus layout are
unambiguous and well-imaged (very recent Street View and satellite). The gate
call is the main uncertainty — the campus is clearly open with no controlled
checkpoint, flagged in `uncertainFields` along with the overhead-derived
dock/trailer counts and the unconfirmed scale.
