# TMMI — Toyota Motor Manufacturing Indiana, Princeton IN

**Idx 2 · Vehicle Assembly Plant · 4000 Tulip Tree Drive, Princeton, IN 47670**
**Resolved center:** 38.290, -87.563 · [Maps](https://www.google.com/maps/@38.29,-87.563,400m/data=!3m1!1e3)

## Location resolution

The roster coordinate (38.291234, -87.565041) geocoded ~6.4 km off but still
landed within the property. A wide satellite probe immediately showed the large
white-roofed assembly complex surrounded by farmland on Tulip Tree Drive west of
Princeton, IN — unambiguously TMMI. Locked campus center at 38.290, -87.563.

## What the imagery showed

- **Wide (z14/z15):** A large multi-building manufacturing campus set in open
  Indiana farmland, with an on-site vehicle test track on the east side and
  extensive trailer/vehicle lots flanking the central assembly building.
- **East side (z16/z17/z18):** Multiple trailer drop yards — distinct lots of
  dozens of trailers each in dense rows on the plant's west and east faces.
  Large finished-vehicle distribution lots (rows of cars) and a separate office
  building on the east.
- **North dock area (z18):** Dock banks along the assembly plant; finished-car
  lots adjacent.
- **Street View:** Panos along Tulip Tree Drive show a wide, multi-lane internal
  approach road leading from the public road toward the plant buildings, curving
  to the entrance. The plant sits well back across open land.

## Gate / guard determination

- **truckGate = true.** TMMI is a fully fenced, security-controlled automotive
  assembly plant. A wide multi-lane internal approach road leads from the public
  road into the plant; truck entrances are controlled checkpoints. High
  confidence given facility type and observed layout.
- **guardShack = true.** Manned guard houses are standard at Toyota
  assembly-plant primary gates; small guard structures are present at the plant
  entrances. `remoteGs = false`.
- **entryExitSeparate = true** — multiple distinct gates serve the perimeter.
- **multiStep = false** — no clear second post-gate checkpoint resolved from
  imagery.

## Yard zones & counts

- **Perimeter:** core developed plant campus, ~38.2820–38.2985 N / -87.5720 to
  -87.5530 E → ~730 acres developed (TMMI owns substantial additional buffer
  land beyond this).
- **Drop yards:** several distinct trailer lots W and E of the assembly plant.
  `dropArea = 50+`, `dropYard = true`.
- **Dock aprons:** assembly-plant and logistics-building dock faces.
- **Dock doors:** ~150 estimate, `50+` band certain.
- **Trailers visible:** ~600 across the captured imagery; capacity ~850.
- **Buildings:** ~9 distinct structures plus an on-site test track →
  `multipleFacilities = true`.
- **Rail:** rail-served.

## Web findings

TMMI produces Highlander, Grand Highlander, and a new 3-row battery-electric SUV.
Toyota has invested ~$8B in Indiana cumulatively, including a $1.4B retool
(April 2024) to add BEV production — a live inbound-logistics redesign that maps
directly to the dossier's YardFlow pitch on multi-pathway / BEV complexity.

## Confidence

**High.** Facility unambiguously identified; layout, gates, drop yards, dock
banks and finished-vehicle lots all corroborated by multi-zoom satellite and
Street View. Exact dock-door and lane counts are honest estimates from overhead
imagery (flagged in `uncertainFields`).
