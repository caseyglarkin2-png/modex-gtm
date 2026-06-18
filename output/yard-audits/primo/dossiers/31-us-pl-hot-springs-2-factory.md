# Site 31 - US PL Hot Springs 2 Factory (Bottling plant, PL)

**Operator:** Primo Brands / The Mountain Valley (Mountain Valley Spring Water)
**Resolved location:** Glazypeau Road, near Hot Springs Village, Garland County, AR (exact parcel UNCONFIRMED)
**Status:** NEW FACTORY UNDER CONSTRUCTION - no usable imagery yet
**Confidence:** LOW

## Construction-status caveat (read first)

This is a brand-new ~200,000 sq ft Mountain Valley factory that **broke ground on October 29, 2025** and is targeted to be **fully operational in spring 2026** (production + logistics + warehouse, one small-format and two large-format lines). It is a **different facility** from the legacy idx-29 Mountain Valley plant (283 Mountain Valley Water Pl, Hot Springs Village).

**No factory building or large-scale construction is visible in current satellite imagery.** Google's satellite tiles over the Glazypeau Rd corridor clearly predate the Oct 2025 groundbreaking, and Street View along the corridor dates to 2023-02 / 2023-12. The audit therefore could not measure docks, gates, geofences, or yard metrics from imagery. All such fields are set to NONE / 0 / false at **low confidence** and every classification field is flagged in `uncertainFields`. **This site must be re-audited once post-construction satellite imagery becomes available.**

## How the location was resolved

Web research firmly establishes the project and the road, but no source publishes a street number or parcel:
- Hot Springs Sentinel-Record: groundbreaking held "on Glazypeau Road Wednesday near Hot Springs Village."
- Arkansas EDC / PR Newswire / Primo Brands / Talk Business: ~200,000 sq ft, multi-million-dollar investment, production + logistics + warehouse, 3 new lines (1 small-format, 2 large-format), Hot Springs / Garland County AR, operational spring 2026, first new factory since the Nov 2024 Primo merger.

The supplied approximate point (34.6100, -93.0500) lands in rural forest/large-lot residential - not it. Geocoding shows Glazypeau Rd is long (W Glazypeau ~34.567-34.631 / -93.057 to -93.158; E Glazypeau toward Hwy 7 ~34.625-34.637 / -93.015 to -93.058).

## What the satellite sweep showed (z16-z18)

Swept the developed Glazypeau Rd / Hwy 7 corridor and the given point:
- **34.626-34.633, -93.056 to -93.062 (E Glazypeau / Hwy 7 junction):** self-storage unit rows, a flea-market/storage-shed business, a school or church campus with parking, scattered rural commercial buildings, ponds and an old quarry/borrow pad (the bright white square at ~34.626,-93.058), and large open pasture fields. No factory, no foundations.
- **Large open greenfield ~34.629,-93.061:** adjacent to existing Glazypeau industrial buildings, large enough for a 200k sqft plant - the most plausible candidate parcel, but shows only open pasture in current imagery.
- **Given point 34.6100,-93.0500 and SE corridor:** forest and small rural lots.

No graded building pad, foundation, crane, or laydown yard at the required scale appears anywhere in the captured tiles.

## Gate / guard-shack / dock determinations

- **Truck gate:** Cannot assess - nothing built. `false`, low confidence. Not fabricated.
- **Guard shack:** Cannot assess - nothing built. `false`, low confidence.
- **Remote GS:** Cannot assess. `false`, low confidence.
- **Docks:** No docks built/visible -> `NONE`, low confidence. (Once built, a 200k sqft production + logistics + warehouse plant will carry a substantial dock bank - re-audit.)
- **Drop area / drop yard:** None built/visible -> `NONE` / `false`.

## Geofence / yard zones

Only a **low-confidence placeholder perimeter** was traced, over the largest open greenfield adjacent to the existing Glazypeau industrial buildings (~34.629,-93.061). This is a guess from setting and scale, not a confirmed footprint - the real parcel may be elsewhere on Glazypeau Rd. `siteAreaAcres` left at 0; no truckGate / dropYards / dockAprons / staging traced (nothing to trace). A Street View pano (dSQcG1b-Vt-dAF9yXMDtug, 2023-02) at the candidate road frontage is recorded for the perimeter zone but predates construction.

## Yard metrics

All set to 0 - honest placeholders for an unbuilt/under-construction site, not measurements.

## Web findings (sources)

- Primo Brands press release (groundbreaking, Oct 29 2025): primobrands.com / prnewswire.com
- Arkansas EDC newsroom (Oct 29 2025)
- Hot Springs Sentinel-Record (hotsr.com) - "on Glazypeau Road ... near Hot Springs Village"
- Talk Business & Politics - "Primo Brands expands in Hot Springs"
- Arkansas Democrat-Gazette (arkansasonline.com) - "marks construction of new bottling plant near Hot Springs"

## Final confidence: LOW

Project and road confirmed via multiple sources; exact parcel and all physical-yard attributes unconfirmed because the facility is newly under construction and current imagery predates the groundbreaking. Re-audit when post-2025 satellite imagery is available.
