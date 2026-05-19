# Kraft Calibration Report

Satellite + Street View classification vs Jake's baseline — 27 sites.

- **Archetype match: 9/27 (33%)** — the product output (#1-#10)
- **Archetype-driving fields: 189/243 (78%)** — honest yardstick, target >80%
- Overall field match, all 21 fields incl. Jake's sparse non-archetype columns: 404/567 (71%)

## Per-field accuracy (weakest first)

| Field | Match | Drives archetype |
|---|---|---|
| dropArea | 9/27 (33%) |  |
| connectivityIssue | 9/27 (33%) |  |
| dockDoors | 10/27 (37%) |  |
| dropYard | 12/27 (44%) |  |
| urbanRural | 13/27 (48%) |  |
| guardShack | 16/27 (59%) | yes |
| truckGate | 18/27 (67%) | yes |
| multipleFacilities | 18/27 (67%) | yes |
| remoteGs | 19/27 (70%) | yes |
| drivewayLong | 20/27 (74%) |  |
| drivewayShort | 20/27 (74%) |  |
| postGateStaging | 21/27 (78%) |  |
| backupSensitive | 21/27 (78%) | yes |
| preGateStaging | 22/27 (81%) |  |
| shipRcvSeparate | 22/27 (81%) | yes |
| entryExitSeparate | 24/27 (89%) | yes |
| entryExitTogether | 25/27 (93%) |  |
| fastLaneOpportunity | 25/27 (93%) | yes |
| scale | 26/27 (96%) | yes |
| entryLanes | 27/27 (100%) |  |
| exitLanes | 27/27 (100%) |  |

## Per-site

| # | Site | Fields (/21) | Archetype |
|---|---|---|---|
| 1 | Kraft Heinz - Aurora | 18/21 (86%) | #9 ✗ (want #1) |
| 2 | Kraft Heinz - Muscatine | 10/21 (48%) | #3 ✗ (want #2) |
| 3 | Kraft Heinz - Holland | 16/21 (76%) | #3 |
| 4 | Kraft Foods - Jacksonville | 9/21 (43%) | #3 ✗ (want #4) |
| 5 | Kraft Foods - Jacksonville - Portion Control | 16/21 (76%) | #3 |
| 6 | Kraft Heinz - Davenport | 17/21 (81%) | #1 ✗ (want #5) |
| 7 | Kraft Heinz - Winchester | 17/21 (81%) | #3 |
| 8 | Kraft Heinz - Massillon | 16/21 (76%) | #3 ✗ (want #6) |
| 9 | Kraft Heinz - Garland | 16/21 (76%) | #6 ✗ (want #7) |
| 10 | Kraft Heinz - Fremont | 15/21 (71%) | #9 ✗ (want #6) |
| 11 | Kraft Foods - Springfield | 17/21 (81%) | #1 |
| 12 | Kraft Heinz - Dover | 14/21 (67%) | #6 ✗ (want #1) |
| 13 | Kraft Heinz - Mason City | 15/21 (71%) | #9 ✗ (want #8) |
| 14 | Kraft Heinz - Cedar Rapids | 15/21 (71%) | #9 ✗ (want #3) |
| 15 | Kraft Heinz - Mason City | 15/21 (71%) | #3 |
| 16 | Kraft Heinz - Beaver Dam | 16/21 (76%) | #3 |
| 17 | Kraft Heinz - Coshocton | 18/21 (86%) | #1 ✗ (want #7) |
| 18 | Kraft Heinz - Champaign | 12/21 (57%) | #9 ✗ (want #6) |
| 19 | Kraft Heinz - Woodstock | 16/21 (76%) | #3 ✗ (want #2) |
| 20 | Kraft Heinz - Ft Myers | 16/21 (76%) | #9 |
| 21 | Kraft Heinz - Kendallville | 17/21 (81%) | #3 |
| 22 | Kraft Heinz - Lowville | 17/21 (81%) | #3 |
| 23 | Kraft Heinz - New Ulm | 13/21 (62%) | #9 ✗ (want #4) |
| 24 | Kraft Heinz - Avon | 16/21 (76%) | #3 ✗ (want #10) |
| 25 | Kraft Heinz - Granite City | 15/21 (71%) | #3 ✗ (want #9) |
| 26 | Kraft Heinz - Columbia | 11/21 (52%) | #1 ✗ (want #3) |
| 27 | Kraft Heinz/Ryder - Lathrop | 11/21 (52%) | #9 ✗ (want #3) |

## Mismatches by site

**1 Kraft Heinz - Aurora** — 3 miss(es):
- guardShack: got false, want true
- remoteGs: got true, want false
- dropYard: got true, want false

**2 Kraft Heinz - Muscatine** — 11 miss(es):
- truckGate: got false, want true
- guardShack: got false, want true
- postGateStaging: got false, want true
- drivewayLong: got false, want true
- drivewayShort: got true, want false
- backupSensitive: got true, want false
- entryExitTogether: got true, want false
- entryExitSeparate: got false, want true
- dropArea: got "0-10", want "50+"
- urbanRural: got "Rural", want "Urban"
- multipleFacilities: got true, want false

**3 Kraft Heinz - Holland** — 5 miss(es):
- postGateStaging: got false, want true
- dropArea: got "10-25", want "25-50"
- urbanRural: got "Rural", want "Urban"
- multipleFacilities: got true, want false
- dropYard: got true, want false

**4 Kraft Foods - Jacksonville** — 12 miss(es):
- truckGate: got false, want true
- guardShack: got false, want true
- drivewayLong: got true, want false
- drivewayShort: got false, want true
- backupSensitive: got false, want true
- dockDoors: got "50+", want "25-50"
- dropArea: got "25-50", want "NONE"
- shipRcvSeparate: got true, want false
- urbanRural: got "Urban", want "Rural"
- connectivityIssue: got false, want true
- multipleFacilities: got true, want false
- dropYard: got true, want false

**5 Kraft Foods - Jacksonville - Portion Control** — 5 miss(es):
- drivewayLong: got true, want false
- drivewayShort: got false, want true
- dockDoors: got "10-25", want "25-50"
- dropArea: got "0-10", want "NONE"
- connectivityIssue: got false, want true

**6 Kraft Heinz - Davenport** — 4 miss(es):
- dockDoors: got "25-50", want "10-25"
- dropArea: got "25-50", want "10-25"
- connectivityIssue: got false, want true
- dropYard: got true, want false

**7 Kraft Heinz - Winchester** — 4 miss(es):
- dropArea: got "50+", want "25-50"
- urbanRural: got "Rural", want "Urban"
- multipleFacilities: got true, want false
- dropYard: got true, want false

**8 Kraft Heinz - Massillon** — 5 miss(es):
- truckGate: got false, want true
- guardShack: got false, want true
- dockDoors: got "10-25", want "50+"
- dropArea: got "0-10", want "50+"
- urbanRural: got "Rural", want "Urban"

**9 Kraft Heinz - Garland** — 5 miss(es):
- dropArea: got "10-25", want "50+"
- urbanRural: got "Urban", want "Rural"
- connectivityIssue: got false, want true
- multipleFacilities: got true, want false
- dropYard: got true, want false

**10 Kraft Heinz - Fremont** — 6 miss(es):
- guardShack: got false, want true
- remoteGs: got true, want false
- dockDoors: got "25-50", want "50+"
- shipRcvSeparate: got true, want false
- urbanRural: got "Rural", want "Urban"
- dropYard: got true, want false

**11 Kraft Foods - Springfield** — 4 miss(es):
- dockDoors: got "10-25", want "50+"
- dropArea: got "10-25", want "50+"
- urbanRural: got "Rural", want "Urban"
- connectivityIssue: got true, want false

**12 Kraft Heinz - Dover** — 7 miss(es):
- drivewayLong: got true, want false
- drivewayShort: got false, want true
- dockDoors: got "25-50", want "10-25"
- dropArea: got "10-25", want "50+"
- shipRcvSeparate: got true, want false
- urbanRural: got "Rural", want "Urban"
- multipleFacilities: got true, want false

**13 Kraft Heinz - Mason City** — 6 miss(es):
- guardShack: got false, want true
- remoteGs: got true, want false
- dropArea: got "10-25", want "25-50"
- connectivityIssue: got false, want true
- multipleFacilities: got true, want false
- scale: got false, want true

**14 Kraft Heinz - Cedar Rapids** — 6 miss(es):
- truckGate: got true, want false
- remoteGs: got true, want false
- dockDoors: got "10-25", want "0-10"
- dropArea: got "10-25", want "0-10"
- urbanRural: got "Rural", want "Urban"
- dropYard: got true, want false

**15 Kraft Heinz - Mason City** — 6 miss(es):
- preGateStaging: got false, want true
- postGateStaging: got true, want false
- dockDoors: got "25-50", want "10-25"
- dropArea: got "10-25", want "NONE"
- urbanRural: got "Urban", want "Rural"
- connectivityIssue: got false, want true

**16 Kraft Heinz - Beaver Dam** — 5 miss(es):
- preGateStaging: got false, want true
- backupSensitive: got true, want false
- dropArea: got "10-25", want "NONE"
- urbanRural: got "Urban", want "Rural"
- connectivityIssue: got false, want true

**17 Kraft Heinz - Coshocton** — 3 miss(es):
- fastLaneOpportunity: got false, want true
- dropArea: got "10-25", want "0-10"
- connectivityIssue: got false, want true

**18 Kraft Heinz - Champaign** — 9 miss(es):
- guardShack: got false, want true
- remoteGs: got true, want false
- drivewayLong: got true, want false
- drivewayShort: got false, want true
- backupSensitive: got false, want true
- dockDoors: got "50+", want "25-50"
- dropArea: got "50+", want "0-10"
- multipleFacilities: got false, want true
- dropYard: got true, want false

**19 Kraft Heinz - Woodstock** — 5 miss(es):
- truckGate: got false, want true
- guardShack: got false, want true
- entryExitSeparate: got false, want true
- dockDoors: got "10-25", want "0-10"
- connectivityIssue: got false, want true

**20 Kraft Heinz - Ft Myers** — 5 miss(es):
- backupSensitive: got false, want true
- dockDoors: got "10-25", want "0-10"
- dropArea: got "0-10", want "NONE"
- urbanRural: got "Urban", want "Rural"
- connectivityIssue: got false, want true

**21 Kraft Heinz - Kendallville** — 4 miss(es):
- preGateStaging: got false, want true
- postGateStaging: got true, want false
- connectivityIssue: got false, want true
- dropYard: got true, want false

**22 Kraft Heinz - Lowville** — 4 miss(es):
- dockDoors: got "10-25", want "0-10"
- connectivityIssue: got false, want true
- multipleFacilities: got true, want false
- dropYard: got true, want false

**23 Kraft Heinz - New Ulm** — 8 miss(es):
- guardShack: got false, want true
- remoteGs: got true, want false
- drivewayLong: got true, want false
- drivewayShort: got false, want true
- backupSensitive: got false, want true
- dockDoors: got "25-50", want "10-25"
- connectivityIssue: got false, want true
- dropYard: got true, want false

**24 Kraft Heinz - Avon** — 5 miss(es):
- truckGate: got false, want true
- guardShack: got false, want true
- dockDoors: got "10-25", want "0-10"
- shipRcvSeparate: got false, want true
- connectivityIssue: got false, want true

**25 Kraft Heinz - Granite City** — 6 miss(es):
- truckGate: got false, want true
- remoteGs: got false, want true
- dockDoors: got "25-50", want "10-25"
- urbanRural: got "Urban", want "Rural"
- connectivityIssue: got false, want true
- dropYard: got true, want false

**26 Kraft Heinz - Columbia** — 10 miss(es):
- truckGate: got true, want false
- guardShack: got true, want false
- preGateStaging: got false, want true
- postGateStaging: got true, want false
- drivewayLong: got true, want false
- drivewayShort: got false, want true
- dockDoors: got "25-50", want "0-10"
- dropArea: got "10-25", want "0-10"
- connectivityIssue: got false, want true
- dropYard: got true, want false

**27 Kraft Heinz/Ryder - Lathrop** — 10 miss(es):
- truckGate: got true, want false
- remoteGs: got true, want false
- preGateStaging: got false, want true
- postGateStaging: got true, want false
- entryExitTogether: got false, want true
- entryExitSeparate: got true, want false
- fastLaneOpportunity: got true, want false
- shipRcvSeparate: got true, want false
- connectivityIssue: got false, want true
- dropYard: got true, want false

