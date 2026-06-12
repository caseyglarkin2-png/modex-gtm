# YardFlow TAM classification — agent instructions

Classify companies into YardFlow's TAM using FREE tools only (your own knowledge + WebSearch). Do NOT use Apollo. Work from `C:\Users\casey\modex-gtm`.

YardFlow sells yard-management / standardized driver-experience / yard-network software. An account is **IN TAM** if it operates physical facilities in North America (US/Canada/Mexico) with enough FACILITIES (plants, distribution centers, warehouses, terminals, cross-docks, ports, intermodal/rail ramps, fulfillment centers, cold-storage) and FREIGHT VOLUME (real inbound/outbound truck activity) to justify a yard network — i.e. >=3 such facilities OR >=1 high-throughput yard — in a freight-heavy vertical.

**IN verticals:** CPG/food/beverage, retail & grocery distribution, 3PL & carriers, building materials & industrial mfg, chemicals/plastics/oil, paper/packaging, e-commerce/parcel fulfillment, cold chain, ports/intermodal, automotive & heavy mfg, agriculture/food processing, wholesale distribution, consumer goods/electronics mfg, medical-device & pharma mfg/distribution, waste/environmental (transfer stations + fleets).

**OUT:** software/SaaS/IT, finance/banking/insurance, healthcare providers/hospitals, education, hospitality/restaurants/QSR, professional/marketing/PR/legal/consulting services, government/military, real estate, media, **aerospace & defense primes** (out per Casey), **passenger airlines**, **cruise lines**, **electric/gas utilities**, **general contractors** (jobsite-based, no fixed DC/yard network), nonprofits, facilities/janitorial/events services, sports/entertainment.

**REVIEW:** only if you genuinely cannot determine what the company is even after a WebSearch.

## Process
Read `scripts/tam/unassigned-review.json` (a JSON array of `{id, name, domain, contacts}`). Process ONLY the index range you are told. For each company: identify it from `name` + `domain` using your own knowledge FIRST (most are recognizable brands); only WebSearch the ones you don't recognize (e.g. `"<domain> company what does it do"` or `"<name> distribution centers warehouses"`). Decide `in` / `out` / `review`.

## Output
Write to the jsonl file you are told, ONE JSON object per line, exactly:
`{"id":"<id>","verdict":"in|out|review","segment":"<seg or empty>","tier":"<A|B|C or empty>","reason":"<one line>"}`

- `segment` (only for `in`, else ""): one of `cpg_food_beverage, retail_grocery, 3pl_carrier, building_materials_industrial, chemicals_plastics, paper_packaging, ecommerce_parcel, cold_chain, ports_intermodal, automotive_heavy_mfg, agriculture_food_processing, wholesale_distribution`
- `tier` (only for `in`, else ""): A (national network / enterprise), B (multi-site), C (smaller / single big yard)

Process EVERY index in your range. Be decisive on recognizable companies (no search). REPORT ONLY one line: `in=X out=Y review=Z searches=N` — nothing else.
