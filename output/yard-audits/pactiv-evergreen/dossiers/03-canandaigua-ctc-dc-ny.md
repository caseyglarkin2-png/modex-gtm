# Pactiv Evergreen — Canandaigua CTC Distribution Center NY (idx 3)

**Address:** 2480 Sommers Drive, Canandaigua, NY 14424 (ZIP+4 14424-5250)
**Type:** Distribution Center
**Resolved center:** 42.905300, -77.303500
**Confidence:** High

## Resolved location & how confirmed
The roster coordinate (42.909565, -77.304568) landed on a large retention
pond / open water at the north edge of the Pactiv Canandaigua campus — the
geocode was off the building. Web search (Panjiva buyer reports, TruckMap, Dun
& Bradstreet) confirms "Pactiv Corp / Pactiv Canandaigua Corp" at 2480 Sommers
Drive, Canandaigua NY 14424, **ZIP+4 14424-5250** — the same +4 as the 5250
North Street plant. The CTC Distribution Center is the warehouse/distribution
half of the single contiguous Pactiv Canandaigua campus: the cluster of large
warehouse buildings on the **west side** of the campus, surrounded by extensive
trailer drop yards. Satellite probes z15-z19 confirmed the building footprints
and the campus is one fenced, gated property.

## Key views
- **z17 overview:** west-campus warehouse buildings (dark-roof and tan-roof
  distribution buildings) with hundreds of trailers in long marked rows around
  them — the classic DC drop-yard signature.
- **z19 DC north:** a large dark-roof warehouse with trailers backed against
  its faces; dozens of drop-yard trailers parked in rows on the west apron.
- **z19 DC south:** a large tan-roof warehouse building with more drop-yard
  trailer rows around it.

## Gate / guard-shack determination
**Truck gate: YES.** The CTC DC shares the single campus truck gate at the
south entrance (~42.9028, -77.3030). Street View (2016-09) shows a striped
**barrier arm** across the truck lane, two flanking **sliding chain-link
gates**, STOP signs, and full perimeter chain-link fencing.

**Guard shack: YES.** A small flat-roof **booth** beside the gate lane —
windowed on multiple sides, ~1-2 vehicle footprint, "Adecco" staffing sign, US
flag pole — is the staffed check-in booth. A "Pick Up Phone For Directions"
call-box kiosk is a secondary aid, so `remoteGs = false`.

## Yard zones & counts
- **Drop yards:** very large marked trailer-parking rows ring the DC
  warehouses — well over 100 trailers visible; `dropArea` = 50+.
- **Dock aprons:** dock faces along the DC warehouse buildings with trailers
  backed in; estimated ~35 doors across the DC buildings (low-confidence).
- **Post-gate staging:** internal paved access roads / aprons inside the gate.
- **Rail-served:** the campus has a rail spur from the NE (primarily serving
  the plant side); marked true at campus level.
- **Site area:** ~145 acres shared campus perimeter; the DC occupies the
  western portion.

## Web findings
- Panjiva buyer reports list "Pactiv Canandaigua Corp" and "Pactiv Corp" as
  importers of record at 2480 Sommers Drive — confirms active inbound
  distribution operations.
- TruckMap lists the 2480 Sommers Drive location as open 24 hours — consistent
  with a distribution center running extended/round-the-clock dock operations.
- Account GTM dossier (Chuck Whittington) names Canandaigua as a publicly
  profiled major manufacturing campus in Pactiv Evergreen's "Inside the Supply
  Chain" series.

## Classification highlights
Gate + guard shack + campus (`multipleFacilities`) + dedicated drop yard +
50+ drop area + rail-served at campus level. `fastLaneOpportunity = true` —
wide multi-bay gate apron. Rural edge-of-town setting.

**Final confidence: High** — location resolved (geocode was on the pond; the
correct DC building cluster identified by address, ZIP+4 match, and imagery).
Gate and guard booth positively confirmed in Street View. Dock/trailer counts
are honest overhead estimates and flagged uncertain.
