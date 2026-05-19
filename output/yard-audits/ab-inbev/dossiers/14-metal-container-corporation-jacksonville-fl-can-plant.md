# Deep-Audit Dossier — Metal Container Corporation, Jacksonville FL Can Plant (idx 14)

## Resolved location — ROSTER ADDRESS CORRECTED
- **Facility:** Metal Container Corporation (MCC) can plant, **1100 Ellis Rd N, West Jacksonville, FL 32254**
- **Locked center:** 30.33980, -81.74480 (MCC manufacturing complex)
- **The roster address and coords were WRONG.** The roster gave "5775 Skinner Lake Dr" / 30.2524,-81.5380 — that location is a commercial/retail area in SE Jacksonville with no industrial plant. The correct MCC plant is at 1100 Ellis Rd N in West Jacksonville (confirmed via Yelp, Jax Daily Record, EPA TRI facility ID 32205MTLCN1100N). Roster `movedMeters` was only 5 because it geocoded the wrong address precisely.
- **The roster's "adjacent to Jacksonville brewery" note is also incorrect** — this can plant is in West Jacksonville, ~25 km from the AB Jacksonville brewery (which is on the far north side at Busch Dr).
- AB-owned MCC can plant; built 1975, expanded 1992; $170M expansion announced; also produces cans for PepsiCo under contract.

## Key views
- **z15-16:** Heavy industrial district of West Jacksonville near I-10; the plant is a large manufacturing complex with extensive trailer parking and a rail line on the W.
- **z17 candidate:** Large windowless manufacturing building with marked trailer-stall yard on the W side.
- **z19 trailer yard:** Large drop yard with yellow-marked stalls full of trailers (~110 visible).
- **z19-20 rail side:** Rail line on the W with covered hopper cars staged on sidings — aluminum feedstock delivery.
- **z20-21 SE entrance:** Wide paved vehicular entrance with divided entry/exit and directional arrow markings; a gate spans the lane.
- **Street View (2025):** Continuous chain-link perimeter fence around the entire building and trailer yard; "NO TRUCKS" sign on the office-side road steers trucks to the dedicated gate.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Large fully-fenced industrial plant — continuous chain-link perimeter confirmed all around in Street View; a controlled vehicular entrance with divided entry/exit and directional markings on the SE side, with a gate across the truck lane.
- **guardShack = false (medium confidence).** No clearly identifiable guard booth at the truck gate; a small structure near the entrance at z21 is ambiguous. Flagged uncertain.
- **remoteGs = true (flagged uncertain).** Set true because there IS a gate but no confirmed guard booth — implies kiosk / call-box / app check-in.
- **dockDoors = 25-50** (~35 est.) — trailers backed in along the NW and W building faces.
- **scale = false** — none identified (flagged uncertain).

## Yard zones and counts
- **Perimeter:** ~40 acres, S 30.33700 / W -81.74850 / N 30.34200 / E -81.74300.
- **Drop yards:** large marked-stall trailer drop yard on the W side, ~110 trailers visible, capacity ~180 — `dropYard = true`, `dropArea = 50+`.
- **Dock aprons:** NW and W building faces — `shipRcvSeparate = true`.
- **Staging:** post-gate paved area inside the SE entrance.
- **Buildings:** 3 — one large can-manufacturing building plus a small yard/dock structure; single primary cluster — `multipleFacilities = false`.
- **Rail:** rail line on the W edge with covered hopper cars on sidings — `railServed = true`.

## Web findings
AB-owned MCC can plant, 1100 Ellis Rd N; built 1975, expanded 1992; $170M expansion; supplies cans for AB and PepsiCo. Active facility.

## Final confidence: MEDIUM
The facility was relocated from a wrong roster address and positively re-identified at 1100 Ellis Rd N. Fenced perimeter, gate, trailer yard and rail service are clearly confirmed. The guard shack could not be ground-confirmed (no clear Street View of the gate booth); `guardShack`, `remoteGs`, `scale`, lane counts and dock-door count are flagged uncertain.
