# Deep-Audit Dossier — Frito-Lay Rancho Cucamonga CA (DC) (idx 02)

## Resolved location
- **Address:** 9535 Archibald Ave, Rancho Cucamonga, CA 91730
- **Locked center:** 34.080051, -117.591112 (large warehouse building mass)
- **Confidence:** Medium

Roster supplied 34.080051, -117.591112 (ROOFTOP geocode). Satellite probes z16-z19
landed on a large tan-roofed warehouse/DC building with an extensive south-side trailer
yard, consistent with a Frito-Lay distribution facility. Address corroborated by web
sources.

**Operational caveat:** Web research (KTLA, Food Dive, The Real Deal, Food Business
News — all June 2025) confirms PepsiCo fully closed this site: manufacturing ended in
2024 and the distribution hub closed June 6, 2025 with 248 layoffs (680 total across
the round, including warehouse workers and a hostler). The roster's premise that the
DC continues is outdated. PepsiCo said it would shift operations to a new, unnamed
local DC. This audit classifies the PHYSICAL yard as it appears in imagery; it is no
longer an active Frito-Lay operation.

## Key views
- **z16/z17 wide:** Large industrial building in a Rancho Cucamonga industrial park,
  residential to the west, multi-tenant business park to the north.
- **z18 south:** Long dock bank on the building's south face; large trailer drop yard
  with many parked trailers filling the south lot.
- **z19 south edge:** Truck entrance on the south frontage road (6th St) — a driveway
  with a guard-booth structure set inside and a divided in/out lane.
- **z19 east/north:** Property bounded by fence lines; separate facilities adjacent.
- **Street View (Aug 2025):** South frontage shows the driveway entrance flanked by a
  perimeter wall and mature trees; a structure (guard booth) is visible set back inside
  the entrance.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Single controlled truck entrance on the south frontage. The
  z19 satellite clearly shows lane channelization and a booth structure inside the
  driveway throat, with a perimeter wall flanking the entrance.
- **guardShack = true (moderate confidence).** A small booth-sized structure sits
  inside the entrance lane in satellite imagery; Street View confirmation is partly
  obscured by trees.
- **remoteGs = false** — a physical booth appears present.
- **dockDoors = 50+.** Long continuous dock bank along the building's south face with
  numerous trailers backed in; estimated ~55 doors.
- **dropArea = 50+.** Extensive marked trailer-parking rows fill the south yard — well
  over 50 stalls.

## Yard zones and counts
- **Perimeter:** ~48 acres (large DC/plant footprint).
- **truckGate zone:** South-frontage entrance / guard-booth area.
- **dropYards:** South-side trailer-parking rows (one large drop yard).
- **dockAprons:** South-face apron strip in front of the dock bank.
- **staging:** Paved area just inside the gate (postGateStaging = true).
- **yardMetrics:** ~55 dock doors; ~150 trailers visible; ~200 trailer capacity;
  1 truck gate; 2 buildings (primary warehouse + small ancillary structure); not
  rail-served.

## Web findings
KTLA / ABC7 / Food Dive / The Real Deal / Food Business News (June 2025): The
9535 Archibald Ave facility — opened 1970, once one of San Bernardino County's largest
employers — was fully shut down. Manufacturing ceased 2024; distribution closed June 6,
2025. 248 layoffs in the final round (680 total). Operations to move to an unnamed new
local DC.

## Final confidence
**Medium.** The physical site is positively identified and the gate/dock layout is
clear, but (a) the facility is operationally closed, undercutting its value as an
active YardFlow target, and (b) guard-booth confirmation and exact lane/door counts
are limited by tree cover and imagery resolution. Flagged in uncertainFields.
