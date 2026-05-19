# Deep-Audit Dossier — Frito-Lay Modesto CA (idx 01)

## Resolved location
- **Address:** 600 Garner Rd, Modesto, CA 95357
- **Locked center:** 37.631150, -120.920200 (main plant building mass)
- **Confidence:** High

Roster supplied 37.631499, -120.920769 (ROOFTOP geocode). Satellite probes z16-z19
landed directly on a large tan/cream-colored manufacturing complex. Confirmed it is
the Frito-Lay plant via Street View of the south face: branded Frito-Lay / Cheetos /
Doritos trailers backed into a long dock bank. Web research corroborates: Frito-Lay
Modesto is a flagship facility — 500,000 sq ft, 80 acres, 1,100+ associates, and the
company's zero-/near-zero-emissions fleet showcase (Tesla Semis, 38 Volvo VNL CNG
tractors, Peterbilt 220EV box trucks). The west side of the property carries large
solar carports consistent with that sustainability program.

## Key views
- **z16/z17 wide:** Large industrial complex in central Modesto industrial district,
  flanked by other big-box warehouses. Plant building tan-roofed; solar carports west;
  trailer rows east and south.
- **z18 south face:** Long dock bank on the lower building's south face with trailers
  backed in; trailer parking lot to the SW.
- **z18 SE:** Wide truck driveway from Garner Rd; large trailer drop-yard rows east.
- **z19/z21 entrance:** Divided in/out driveway with a landscaped median island, yellow
  lane channelization, and a canopied guard-booth structure set inside the apron.
- **Street View (Feb 2026):** South face shows branded Frito-Lay trailers at docks; the
  SE entrance is a very wide open apron from Garner Rd — no barrier arm at the road
  edge, but a guard booth and lane striping are present a short way inside.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Single controlled truck entrance off Garner Rd at the SE
  corner. The driveway is divided with a landscaped median, has yellow lane striping,
  and channels traffic past a guard booth — a clear controlled checkpoint, even though
  there is no arm right at the public road edge.
- **guardShack = true.** A small canopied booth (~1-2 vehicle footprint) sits inside
  the entrance beside the divided lanes, visible as a dark canopied structure in z21
  satellite imagery.
- **remoteGs = false** — a physical staffed booth is present.
- **dockDoors = 50+.** Dock banks on the south face (branded trailers backed in,
  confirmed via Street View) and on the east face. Estimated ~60 doors total.
- **dropArea = 50+.** Extensive marked trailer-parking rows on the east side and along
  the south — well over 50 stalls, many holding trailers without tractors.

## Yard zones and counts
- **Perimeter:** ~81 acres (matches the publicly stated 80-acre site).
- **truckGate zone:** SE entrance / guard-booth area off Garner Rd.
- **dropYards:** East-side trailer rows (primary drop yard) + SW trailer lot.
- **dockAprons:** South-face apron + east-face apron.
- **staging:** Paved apron just inside the gate (postGateStaging = true).
- **yardMetrics:** ~60 dock doors; ~160 trailers visible; ~220 trailer capacity;
  1 truck gate; 3 buildings (plant masses + co-located warehouse to the north);
  not rail-served (a road/rail corridor runs along the north boundary but no spur
  enters the yard).

## Web findings
PR Newswire / PotatoPro / TruckingInfo (2023): Modesto is a Frito-Lay sustainability
showcase — 91% reduction in direct fleet GHG emissions, Tesla Semi commercial fleet,
Tesla 750kW chargers, CNG tractors. Confirms heavy, modern truck operations and a
large managed fleet — a strong YardFlow profile.

## Final confidence
**High.** Facility positively identified; gate, guard booth, dock banks, and drop
yards all visible. Low-confidence items (exact lane counts, presence of a truck scale,
exact dock-door count) are flagged in uncertainFields.
