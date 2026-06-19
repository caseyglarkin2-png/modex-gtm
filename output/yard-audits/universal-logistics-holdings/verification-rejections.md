# Universal Logistics Holdings — FOV verification rejections

Account: Universal Logistics Holdings (ULH, NASDAQ:ULH, Warren MI). 3PL — trucking,
intermodal/drayage, contract/value-added logistics (heavily auto). Verified pack-direct
against `public/demo-packs/universal-logistics-holdings.json` → `network.sites[]`.

Verified 2026-06-19 (agent web research). 26 sites: 16 confirmed, 2 probable, 8 rejected.

The controller will remove the rejected sites and recompute network totals separately.

## Rejected (8)

- **02 Logistics Insight Corp - Stellantis Sequencing Plant (Detroit MI, 6836 Georgia St)** — REJECTED: confirmed PERMANENT CLOSURE. ULH announced closure of Logistics Insights Corp + Universal Dedicated of Detroit (677 layoffs) at the ~1M sq ft auto-parts sequencing plant; Stellantis pulled the Jeep Grand Cherokee sequencing contract and moved it to a nonunion operator; layoffs began Feb 18, 2025. The pack's own WARN flag is verified correct. [Tier 2: https://www.crainsdetroit.com/manufacturing/moroun-owned-universal-logistics-lay-677-detroit, 2024-04 ; Tier 2: https://moparinsiders.com/detroit-warehouse-serving-stellantis-to-close/, 2025-01]

- **08 Universal Logistics Services - Maryville Terminal (Maryville TN, 1615 Robert C Jackson Dr)** — REJECTED: WRONG COMPANY (name collision). "Universal Logistics Services Inc" (USDOT 839281, MC 371555, ~77 trucks, GM Jim Brinkley) is an unrelated independent carrier, NOT a Universal Logistics Holdings subsidiary. The NLRB single-employer case enumerating ULH's actual subsidiaries does not include it. [Tier 1: https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=839281, 2026 ; Tier 1: https://www.nlrb.gov/case/21-CA-286645, 2022]

- **13 Universal Logistics - Vance Value-Added Facility (Vance AL, no address)** — REJECTED: no discrete operating building verifiable. Only a city-level Indeed/Glassdoor presence near MBUSI; the named MBUSI Vance LSPs are BLG/Penske/Schnellecke/Celadon, not Universal; ULH 10-K Item 2 discloses no Alabama property. Pack already flagged unresolved; anchor coords are a placeholder. [Tier 1: https://www.sec.gov/Archives/edgar/data/0001308208/000095017025040283/ulh-20241231.htm, 2025-03 ; Tier 1: https://www.automotivelogistics.media/mercedes-benz-switches-from-one-to-three-lsps-in-alabama/17357.article, 2017]

- **15 Universal Logistics - Spring Hill Contract Logistics Warehouse (Spring Hill TN, no address)** — REJECTED: no discrete operating building verifiable. Universal's GM Spring Hill operation is REAL (Facebook launch post + 100+ jobs) but runs on GM premises (the Logistics Operations Center is a conversion inside GM's own plant); no public source ties Universal to a discrete street address; the named local buildings are tenanted by Comprehensive Logistics/Magna/Tenneco. Anchor coords are a placeholder. [Tier 1: https://www.sec.gov/Archives/edgar/data/0001308208/000095017025040283/ulh-20241231.htm, 2025-02 ; Tier 2: https://idealcontracting.com/projects/gm-spring-hill-assembly-plant-logistics-operations-center/, 2024]

- **16 Universal Logistics - San Antonio Contract Logistics Warehouse (San Antonio TX, no address)** — REJECTED: no discrete operating building verifiable. Indeed/Glassdoor city presence only; ULH never names San Antonio or Toyota in any SEC filing (EDGAR full-text: 0 hits); TMMTX on-site sequencing is run by Toyota Tsusho America. Anchor coords are a placeholder. [Tier 1: https://www.sec.gov/Archives/edgar/data/1308208/000095017025040283/ulh-20241231.htm, 2025-03 ; Tier 2: https://pressroom.toyota.com/tmmtx-welcomes-new-on-site-suppliers/, 2024]

- **18 Universal Logistics - Chillicothe Contract Logistics Warehouse (Chillicothe IL, ~2800 E Cedar Hills Dr)** — REJECTED: no discrete ULH-operated building verifiable. ULH runs pick/pack/sequencing INSIDE Caterpillar's Chillicothe warehouse — a customer-provided location per the FY2025 10-K (value-added at ~50 customer-provided locations), not a discrete ULH facility. The building is Caterpillar's. [Tier 1: https://www.sec.gov/Archives/edgar/data/1308208/000119312526108365/ulh-20251231.htm, 2026-03 ; Tier 1: https://www.indeed.com/cmp/Universal-Logistics-Holdings,-Inc./locations/IL/Chillicothe, 2026]

- **19 Universal Logistics - Mossville Contract Logistics Warehouse (Mossville IL, Caterpillar Mossville plant, 1900 E Old Galena Rd)** — REJECTED: no discrete ULH-operated building verifiable. ULH contract logistics is embedded inside the Caterpillar Mossville engine/manufacturing complex (customer-provided location); mapped onto the customer's plant, not a discrete ULH facility. [Tier 1: https://www.sec.gov/Archives/edgar/data/1308208/000119312526108365/ulh-20251231.htm, 2026-03 ; Tier 1: https://www.indeed.com/cmp/Universal-Logistics-Holdings-Inc./locations/IL/Mossville, 2026]

- **22 Universal Intermodal Services - Gary Terminal (Gary IN, no address)** — REJECTED: unlocatable. The FY2025 10-K names Gary IN among owned terminal-yard cities, but no findable public street address or imagery exists for a Universal Intermodal Gary terminal (FMCSA shows only the Warren MI corporate address; loadmatch/IANA directories show no Gary IN Universal terminal). The pack itself flagged it unresolved; anchor coords are a placeholder. [Tier 1: https://www.sec.gov/Archives/edgar/data/1308208/000119312526108365/ulh-20251231.htm, 2026-03]

## Probable / low-confidence (kept, flagged — controller may want to cap or drop)

- **12 LINC - Sturtevant Contract Logistics Warehouse (Sturtevant WI, 7100 Durand Ave Ste 300)** — PROBABLE: LINC-branded hiring + CNH (Case New Holland) trade records place LINC at the address, BUT the CNH ag program is winding down and ~half the building (300,410 of 601,160 sq ft) was marketed for lease as of Jul 2025. Active but contracting; scale unproven. [Tier 3: https://www.facebook.com/DriveUniversal/posts/4243706279024009/, 2024 ; Tier 3: https://www.crexi.com/lease/properties/983727/wisconsin-7100-durand-ave, 2025-07]

- **17 Universal Logistics - Polaris Madison Plant Contract Logistics (Madison AL, 7049 Greenbrier Pkwy NW)** — PROBABLE: Polaris Madison plant confirmed operating in 2026 (the 2025 Polaris closure was Osceola WI, not Madison — closure risk cleared). Universal's captive inbound-logistics role fits ULH's 10-K customer-facility model and was historically address-attested, but lacks a fresh current re-confirmation. Medium confidence; tenancy customer-provided (operate-inside-plant). [Tier 1: https://www.sec.gov/Archives/edgar/data/0001308208/000095017025040283/ulh-20241231.htm, 2025-03 ; Tier 1: https://www.polaris.com/en-us/locations/huntsville-al/, 2026]

## Segment-level watch-note

ULH's INTERMODAL segment took an ~$81.2M impairment in Q3 2025 (goodwill + customer-relationship
intangibles, with a ~$43.2M correction in March 2026) and ULH has publicly floated potential
intermodal divestitures. The intermodal terminals confirmed here (04 Dearborn, 09 Jacksonville,
10 Rancho Dominguez, 11 Houston, 20 Savannah, 21 Harvey, 23 Louisville, 24 Columbus, 25 Clearfield,
26 Memphis) all remain in the post-impairment FY2025 10-K owned/operated list, but this is the
segment most exposed to consolidation — re-verify before any large commitment. Site 01 (GM EV
warehouse) runs but its Factory Zero EV program is being squeezed by repeated idlings/cuts.
