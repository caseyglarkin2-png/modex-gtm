# Deep-Audit Dossier — K-C Neenah Experimental Mill, Neenah WI (idx 12)

## Resolved location
- Roster coordinates (44.185819, -88.462609, geocode precision APPROXIMATE, moved 137 m) landed in **downtown Neenah** — close to the target.
- Web research (Wisconsin DNR Green Tier participant page, Waze, Foursquare) identified the facility as the **Kimberly-Clark Experimental Mill ("X-Mill")** at **126 N Commercial St, Neenah, WI 54956** — the site of K-C's original Globe Mill, the company's first plant, in the downtown core.
- Satellite and Street View confirmed a K-C industrial/office campus on a Fox River-front block in downtown Neenah.
- **Locked center: 44.18830, -88.46260.**

## Key views
- **Downtown overview (z16/z17):** The facility sits in the dense downtown Neenah core on the Fox River. Adjacent blocks hold modern apartment buildings, retail, and a city park ("Legacy Park").
- **Campus z18/z19:** The K-C campus occupies a riverfront block — the X-Mill industrial building (flat-roofed, with rooftop solar), connected office buildings, a multi-story parking deck, and fenced surface parking lots. Heavy shadow in the imagery limits structural detail.
- **Street View (2024):** A "Kimberly-Clark Corporation" monument sign on a landscaped corner; the X-Mill brick/metal industrial building behind chain-link fencing; fenced surface lots with chain-link **sliding gates** and internal service drives; a multi-story brick parking deck. The campus fronts city streets directly on all sides.

## Gate / guard-shack / dock determinations
- **truckGate = true (soft call, flagged uncertain).** There is no conventional truck gate at a public road. K-C-owned surface lots and service drives are fenced with chain-link **sliding gates** controlling campus access. Marked true on the basis of those controlled internal gates.
- **guardShack = false.** No staffed guard booth visible anywhere on the urban campus.
- **remoteGs = true.** Gate present, no guard shack — access via badge/card-controlled sliding gates typical of an urban campus.
- **dockDoors = 0-10 (flagged uncertain).** Loading is via recessed dock bays on the X-Mill's west/south faces. Heavy shadow prevents a precise count; estimated fewer than 10 doors.
- **dropArea = NONE; dropYard = false.** No trailer drop yard or marked trailer stalls — this urban site has no yard space.
- **drivewayShort = true; backupSensitive = true.** Any truck approach is a short urban service drive (1-2 trucks); a queue would spill directly onto downtown city streets.
- **multipleFacilities = true.** The campus is several connected buildings — the X-Mill, office buildings, and a parking deck.
- **scale = false; railServed = false; multiStep = false.**
- **urbanRural = Urban.** Squarely in the dense downtown Neenah core.

## Yard zones & counts
- **Perimeter:** ~14 acres covering the K-C-controlled Fox River-front block; soft estimate because the campus is interleaved with downtown streets.
- **truckGate / dropYards / staging:** null / empty — no conventional truck-yard infrastructure exists at this urban site.
- **dockAprons:** a single short apron at the X-Mill's recessed loading bays (best estimate under shadow).
- **Buildings:** ~5 distinct structures (X-Mill industrial building, office buildings, parking deck) — several connected.
- **Metrics:** ~8 dock doors (low confidence), 0 trailers visible, no drop-yard capacity, 1 controlled gate, no rail.

## Web findings
- Wisconsin DNR Green Tier confirms the Kimberly-Clark Experimental Mill as a Tier 1 participant since 2006. The X-Mill's role is to develop and deliver innovative product and process solutions for the Family Care business; it stands on the site of K-C's first plant, the Globe Mill, in downtown Neenah.

## Final confidence: **medium**
The facility is positively identified, but it is an atypical urban R&D / experimental mill embedded in a downtown core — there is no conventional truck yard, drop yard, or staffed gate, and heavy shadow obscures the dock count. The `truckGate`/`remoteGs` calls and the dock count are the principal soft calls (all flagged in `uncertainFields`).
