# Deep-Audit Dossier — KDP Distribution Center, Evansville IN (idx 21)

## Status: COULD NOT POSITIVELY LOCATE — confidence LOW

## Resolution attempt
- **Facility:** KDP Distribution Center — Evansville, IN (DSD depot)
- **Roster coordinates:** 37.971559, -87.57109 ("APPROXIMATE", geocode moved
  only 292 m). Probing those coordinates (z18) shows **downtown Evansville's
  civic/office core** — dense urban blocks, office and government buildings,
  a vacant lot. This is plainly not an industrial DSD depot; the geocoder
  resolved a downtown street address, not the actual facility.

## Research conducted
- Web search for the KDP / Dr Pepper Snapple Evansville distribution
  warehouse across Indeed, Cortera, Manta, Yellowpages, FMCSA SAFER, NLRB,
  and KDP careers.
- The **only consistently-cited address** for "Keurig Dr Pepper Inc" in
  Evansville is **2600 S Kentucky Ave, Evansville, IN 47714-4513**
  (Cortera company profile; echoed by other directories).
- That address geocodes (Nominatim) to **37.9440, -87.5481**.

## What the imagery at 2600 S Kentucky Ave showed
- **Satellite (z17-20):** A large, mostly-empty asphalt parking lot on the
  east side of S Kentucky Ave, with a generic white-roof industrial building
  adjacent. No beverage-distribution signage, no bank of loading docks with
  trailers backed in, no marked trailer-drop yard, no recognizable truck
  yard. West of Kentucky Ave: a green-fenced lot holding cars/equipment and
  scattered light-industrial buildings.
- **Street View (2019-06, 2023-06):** S Kentucky Ave is a light-industrial
  street; the green-fenced lot and a low warehouse with car parking are
  visible, but nothing identifiable as a KDP / Dr Pepper beverage facility.
- A larger genuine freight terminal (long warehouses, trailers, dock doors,
  yard tractors) sits a few hundred metres west — but that complex is a
  third-party logistics operation (consistent with Warehouse Services Inc,
  which surfaced in search results), not confirmable as KDP.

## Why this could not be resolved
1. The roster coordinates are wrong (downtown, non-industrial).
2. The one cited address (2600 S Kentucky Ave) appears to be an
   administrative/registered address — imagery there shows parking lots and
   a generic building with no confirming evidence of a beverage DSD depot.
3. KDP DSD depots are small and poorly documented; no company page, news
   item, or directory gave a confirmable operational warehouse address.
4. Historical context: the Evansville Dr Pepper / RC distribution was tied
   to **Royal Crown Bottling Corp** (1100 Independence Ave, Evansville).
   That company was **renamed "Vision Beverage" in 2020 and stopped
   distributing KDP brands** — so the legacy bottler is no longer the KDP
   depot, and KDP's current Evansville DSD presence (if a standalone depot)
   could not be pinned to a building.

## Output
The `.json` is written with `confidence: "low"`, every field listed in
`uncertainFields`, and a best-effort placeholder perimeter around the
candidate building near 2600 S Kentucky Ave (NOT a confirmed KDP site). All
classification flags default to false/null because no truck-yard evidence
could be assessed.

## Recommendation
Flag for human review. Next steps: contact KDP for the Evansville DSD depot
address; check Vanderburgh County GIS / property records for KDP or American
Bottling Company parcels; or pull a live KDP careers posting for Evansville,
which may list the worksite address.

- Gate verdict: **Undetermined — facility not located**
- Guard-shack verdict: **Undetermined — facility not located**
- Confidence: **low**
