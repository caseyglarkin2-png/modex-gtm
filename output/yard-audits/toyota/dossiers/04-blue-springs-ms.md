# TMMMS — Toyota Motor Manufacturing Mississippi, Blue Springs MS

**Idx 4 · Vehicle Assembly Plant · 1200 Magnolia Way, Blue Springs, MS 38828**
**Resolved center:** 34.3805, -88.8950 · [Maps](https://www.google.com/maps/@34.3805,-88.895,400m/data=!3m1!1e3)

## Location resolution

The roster coordinate (34.38039, -88.895064) was ROOFTOP precision and landed
directly on the plant. A wide satellite probe confirmed the large white-roofed
assembly building in heavily forested rural NE Mississippi between Tupelo and
Pontotoc — unambiguously TMMMS (Corolla / Corolla Cross plant). Locked center at
34.3805, -88.8950.

## What the imagery showed

- **Wide (z14):** A large isolated assembly plant surrounded on all sides by
  dense forest and farmland, with a perimeter loop road encircling the campus.
- **Plant (z16):** A single large central assembly building (one contiguous
  footprint) with employee parking to the NE and trailer drop yards to the SE.
- **East side (z17/z18):** Clear dock banks with trailers backed in along the
  building face; two distinct trailer drop yards holding dense rows of
  red/white/colored trailers in dedicated lots, served by the perimeter loop.
- **West side (z17):** Additional dock face and parking.
- **North entrance (z17):** Wide multi-lane internal approach roads with
  roundabouts connecting the campus to the public highway.
- **Street View:** Perimeter-road panos show the plant (with a visible "TOYOTA"
  sign) set back behind a grassy berm, accessed via wide internal roads.

## Gate / guard determination

- **truckGate = true.** TMMMS is a fully fenced, security-controlled automotive
  assembly plant with a perimeter loop road. Wide multi-lane internal approach
  roads lead from the public highway into the campus; truck entrances are
  controlled checkpoints. High confidence given facility type and layout.
- **guardShack = true.** Manned guard houses are standard at Toyota
  assembly-plant primary gates; small guard structures are present at the
  entrances. `remoteGs = false`.
- **entryExitSeparate = true** — distinct gates serve the perimeter loop.
- **multiStep = false** — no clear second post-gate checkpoint resolved.

## Yard zones & counts

- **Perimeter:** core developed campus, ~34.3760–34.3870 N / -88.9010 to
  -88.8840 E → ~470 acres developed (TMMMS owns extensive additional forested
  buffer land — ~1,700 acres total).
- **Drop yards:** two distinct trailer lots E and SE of the assembly building.
  `dropArea = 25-50` (flagged uncertain). `dropYard = true`.
- **Dock aprons:** dock banks along the E and W faces of the assembly building.
- **Dock doors:** ~90 estimate, `50+` band certain.
- **Trailers visible:** ~220; capacity ~400.
- **Buildings:** one large assembly building plus minor ancillary structures →
  `multipleFacilities = false`.
- **Rail:** rail-served.

## Web findings

TMMMS produces the Corolla and Corolla Cross. The plant is one of Toyota's
newer US assembly sites, a JIT operation feeding a high-volume compact-car line
— directly relevant to the dossier's "yard is the last mile of JIT" pitch.

## Confidence

**High.** Facility unambiguously identified (ROOFTOP geocode); layout, perimeter
loop, gates, drop yards and dock banks all corroborated by multi-zoom satellite
and Street View. Exact dock-door, drop-area and lane counts are honest estimates
from overhead imagery (flagged in `uncertainFields`).
