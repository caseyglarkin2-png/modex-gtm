# TMMTX — Toyota Motor Manufacturing Texas, San Antonio TX

**Idx 3 · Vehicle Assembly Plant · 1 Lone Star Pass, San Antonio, TX 78264**
**Resolved center:** 29.2625, -98.5425 · [Maps](https://www.google.com/maps/@29.2625,-98.5425,400m/data=!3m1!1e3)

## Location resolution

The roster coordinate (29.260605, -98.545494) was GEOMETRIC_CENTER precision and
landed on the SW edge of the campus (open land / undeveloped tracts confirmed by
satellite probes). A wide satellite probe immediately showed the large industrial
complex in far-south San Antonio. Web research confirms TMMTX at 1 Lone Star Pass:
the $1.2B Tundra/Tacoma plant Chris Nielsen designed and built (2003-2006), with
its distinctive integrated on-site supplier park. Locked the developed-campus
center at 29.2625, -98.5425.

## What the imagery showed

- **Wide (z14/z15):** A large manufacturing campus that is effectively a
  manufacturing park — a central assembly plant ringed by ~20 separate on-site
  Tier-1 supplier buildings, plus logistics/utility structures and an on-site
  test track. Surrounded by open scrubland and farmland.
- **Central plant (z17/z18):** The assembly building has a solar-paneled roof
  and solar canopy structures; dock banks along its faces.
- **North logistics (z17):** Trailer drop yards (rows of trailers) between the
  supplier buildings and the assembly plant; roundabouts and internal roads.
- **Employee parking / trailer staging (z18):** Large employee lots and trailer
  drop rows adjacent to the assembly plant.
- **Street View:** Public perimeter-road panos show the campus set back behind a
  grassy berm; the supplier-park road carries the truck flow.

## Gate / guard determination

- **truckGate = true.** TMMTX is a fully fenced, security-controlled campus.
  Web sources confirm the **Main Gate** is reached where Lone Star Pass / Watson
  Rd dead-ends at Applewhite Rd, with traffic continuing through the intersection
  into the Main Gate. Truck entrances are controlled checkpoints.
- **guardShack = true.** The "Main Gate" is a staffed checkpoint; manned guard
  houses are standard at Toyota assembly-plant gates and small guard structures
  are visible near the plant entrance. `remoteGs = false`.
- **entryExitSeparate = true** — distinct gates serve the perimeter.
- **multiStep = false** — no clear second post-gate checkpoint resolved.

## Yard zones & counts

- **Perimeter:** core developed campus incl. the supplier park, ~29.2520–29.2700
  N / -98.5530 to -98.5340 E → ~900 acres developed (TMMTX owns substantial
  additional buffer/test-track land beyond this).
- **Drop yards:** trailer rows center-campus near the assembly plant and
  logistics buildings. `dropArea = 25-50` (flagged uncertain — the on-site
  supplier-park model means less external trailer staging than a comparable
  stand-alone Toyota plant). `dropYard = true`.
- **Dock doors:** ~130 across assembly plant, logistics and ~20 supplier
  buildings — `50+` band certain.
- **Trailers visible:** ~350; capacity ~600.
- **Buildings:** ~20 distinct structures (assembly + supplier park) →
  `multipleFacilities = true`.
- **Rail:** rail-served.

## Web findings

TMMTX opened late 2006, builds the full-size Tundra and (added) Tacoma. Its
defining feature is the on-site supplier park — Tier-1 suppliers co-located
inside the campus deliver sequenced parts directly to the line, the physical
embodiment of Toyota JIT. This is the plant Nielsen personally built and then
ran as President — the emotional hook in the GTM dossier.

## Confidence

**High.** Facility unambiguously identified and corroborated by web research;
the supplier-park layout, gates, drop yards and dock banks are all visible in
multi-zoom satellite. Exact dock-door, drop-area and lane counts are honest
estimates from overhead imagery (flagged in `uncertainFields`).
