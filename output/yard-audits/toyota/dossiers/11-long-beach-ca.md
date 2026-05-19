# TABC Inc (Toyota Auto Body California) — Long Beach, CA

**Roster idx:** 11
**Facility type:** Parts/components plant — stamping, welding, steering columns,
catalytic converters, painted service parts
**Address:** 6375 N Paramount Blvd, Long Beach, CA 90805
**Resolved center:** 33.87150, -118.16200
**Confidence:** Medium

## Location confirmation

The roster geocode (33.872001, -118.162735, GEOMETRIC_CENTER) lands in a dense
industrial cluster in north Long Beach. Web research confirms TABC at 6375 N
Paramount Blvd — a 430,700 sq ft manufacturing facility on ~30 acres, the
first Toyota plant in North America (established 1972), supplying Tacoma parts
and past-model service parts. Street View along Paramount Blvd positively
identifies the building: a long industrial building with red/cream banding and
a tall stack, fronting Paramount behind a hedge and steel security fence, with
the address numerals visible on the wall. The TABC plant is the large
white-roofed multi-section building on the west side of Paramount Blvd.

## Key views

- **Wide satellite (z16-17):** Dense industrial district; TABC is the large
  multi-section building fronting N Paramount Blvd.
- **Building (z18-19):** Large interconnected manufacturing complex with a
  sawtooth/ridged roof signature typical of a stamping/welding plant; internal
  service roads and equipment yards between building sections.
- **Street View (2017/2022/2025):** Long red-banded TABC building behind a
  hedge and tall steel perimeter fence along Paramount Blvd; gated vehicle
  entrances; employee parking lots behind fencing; a modern glass office
  building at the north entrance.
- **North/SE corners (z20-21):** Employee parking and outdoor areas used for
  stacked metal/parts racks and equipment storage — not a conventional trailer
  drop yard.

## Gate / guard-shack determination

- **truckGate = true.** The plant is fully enclosed by a steel perimeter fence
  (confirmed along Paramount Blvd in multiple Street View captures). Vehicle
  access is through controlled gates in that fence — truck access is gated.
- **guardShack = false (uncertain).** No distinct freestanding guard-booth
  structure beside a truck lane was visible in overhead or Street View
  imagery. A modern office building sits right at the north entrance, so
  check-in is likely handled at/near the office rather than a standalone
  booth.
- **remoteGs = true (uncertain).** Set true on the logic "gate present, no
  visible standalone booth," but this is a medium-confidence inference — the
  guard-shack / remote-gate split is the genuinely uncertain field here and is
  flagged for human review.
- One combined entry/exit at each gate (entryExitTogether), short approach
  (drivewayShort) — the site is tight against Paramount Blvd. The arterial
  road and minimal stacking room make the entry backup-sensitive.

## Yard zones and counts

- **Perimeter:** ~27 acres by the perimeter box (web sources cite ~30 acres;
  exact parcel boundaries are hard to read in the dense industrial fabric).
- **Drop yard:** None meaningful — this is an old, tightly-built urban plant
  whose building covers most of the parcel. Outdoor space holds stacked metal
  racks and parts containers; very few free-standing trailers. dropArea 0-10,
  dropYard = false.
- **Dock doors:** ~10 estimated, tucked along interior building faces — band
  0-10. Modest for the facility's age and constrained footprint.
- **Buildings:** One large multi-section manufacturing complex plus support
  structures and a separate office building — single operational facility.
- **Rail:** A rail line runs along the far west of the industrial district
  but does not clearly spur into TABC — treated as not rail-served.
- **Setting:** Dense north Long Beach industrial / metro fabric — Urban.

## Web findings

- TABC: 430,700 sq ft on ~30 acres, ~350 employees. First Toyota plant in
  North America (1972), originally built to circumvent the "chicken tax" on
  imported light trucks. Produces sheet-metal/aluminum components, weld
  subassemblies, steering columns, catalytic converters, and painted service
  parts for Toyota's North American plants, for export to Japan, and as
  past-model service parts.
- Sources: Toyota USA Newsroom (TABC facility page), Wikipedia (Toyota Auto
  Body California), Long Beach Area Chamber of Commerce.

## Final confidence: Medium

The facility is positively identified and the controlled fenced entrance is
clear, but the guard-shack vs. remote-check-in distinction could not be
resolved from imagery — the genuinely constrained urban site has no visible
standalone booth. `guardShack`, `remoteGs`, and several count fields are
flagged in `uncertainFields`.
