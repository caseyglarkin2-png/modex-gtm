# Facility Count Research Workbench

Generated: 2026-04-07

Purpose: replace guessed facility counts with source-backed counts that can feed microsites and ROI models.

## Workflow

1. Run the query pack generator to create the current account list and one-click Google searches.
2. Research each account in query order: official footprint, annual report, SEC, North America scope, expansion history, operations footprint.
3. Record the count and evidence in `src/lib/data/facility-facts.json` once you have a defensible number and scope.
4. Re-run `npm run research:facility-report` to confirm coverage moved from repo guesses to researched facts.
5. Re-run `tsx scripts/generate-microsite-data.ts` when generated microsites need the updated count source.

## Coverage Snapshot

- Accounts in workbench: 17
- Accounts with facility facts recorded: 0
- Accounts still relying on dossier / accounts.json / heuristic fallback: 17

## Evidence Rules

- Prefer official company network pages, annual reports, or SEC filings over third-party listicles.
- Capture scope explicitly: global, North America, or the operational subset relevant to YardFlow.
- If the company mixes plants and DCs in one total, note that instead of pretending the count is cleaner than the evidence.
- Use `provisional` only when the number is defensible but not yet confirmed by an official/public-filing source.

## Account Query Packs

### Dannon

- Priority: A / Tier 1
- Current repo count: 15+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Dannon" OR "Danone") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Dannon%22%20OR%20%22Danone%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Dannon" OR "Danone") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Dannon%22%20OR%20%22Danone%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Dannon" OR "Danone") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Dannon%22%20OR%20%22Danone%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Dannon" OR "Danone") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Dannon%22%20OR%20%22Danone%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Dannon" OR "Danone") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Dannon%22%20OR%20%22Danone%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Dannon" OR "Danone") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Dannon%22%20OR%20%22Danone%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Diageo

- Priority: B / Tier 2
- Current repo count: 30+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "Diageo" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22Diageo%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "Diageo" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22Diageo%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "Diageo" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22Diageo%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "Diageo" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22Diageo%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "Diageo" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22Diageo%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "Diageo" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22Diageo%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Frito-Lay

- Priority: B / Tier 2
- Current repo count: 20+
- Current source: heuristic
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Frito-Lay" OR "PepsiCo") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Frito-Lay%22%20OR%20%22PepsiCo%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Frito-Lay" OR "PepsiCo") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Frito-Lay%22%20OR%20%22PepsiCo%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Frito-Lay" OR "PepsiCo") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Frito-Lay%22%20OR%20%22PepsiCo%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Frito-Lay" OR "PepsiCo") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Frito-Lay%22%20OR%20%22PepsiCo%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Frito-Lay" OR "PepsiCo") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Frito-Lay%22%20OR%20%22PepsiCo%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Frito-Lay" OR "PepsiCo") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Frito-Lay%22%20OR%20%22PepsiCo%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### General Mills

- Priority: B / Tier 2
- Current repo count: 20+
- Current source: heuristic
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "General Mills" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22General%20Mills%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "General Mills" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22General%20Mills%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "General Mills" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22General%20Mills%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "General Mills" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22General%20Mills%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "General Mills" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22General%20Mills%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "General Mills" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22General%20Mills%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Hormel Foods

- Priority: B / Tier 2
- Current repo count: 40+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Hormel Foods" OR "Hormel") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Hormel%20Foods%22%20OR%20%22Hormel%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Hormel Foods" OR "Hormel") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Hormel%20Foods%22%20OR%20%22Hormel%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Hormel Foods" OR "Hormel") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Hormel%20Foods%22%20OR%20%22Hormel%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Hormel Foods" OR "Hormel") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Hormel%20Foods%22%20OR%20%22Hormel%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Hormel Foods" OR "Hormel") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Hormel%20Foods%22%20OR%20%22Hormel%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Hormel Foods" OR "Hormel") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Hormel%20Foods%22%20OR%20%22Hormel%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### JM Smucker

- Priority: B / Tier 2
- Current repo count: 25+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("JM Smucker" OR "The J.M. Smucker Company") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22JM%20Smucker%22%20OR%20%22The%20J.M.%20Smucker%20Company%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("JM Smucker" OR "The J.M. Smucker Company") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22JM%20Smucker%22%20OR%20%22The%20J.M.%20Smucker%20Company%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("JM Smucker" OR "The J.M. Smucker Company") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22JM%20Smucker%22%20OR%20%22The%20J.M.%20Smucker%20Company%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("JM Smucker" OR "The J.M. Smucker Company") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22JM%20Smucker%22%20OR%20%22The%20J.M.%20Smucker%20Company%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("JM Smucker" OR "The J.M. Smucker Company") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22JM%20Smucker%22%20OR%20%22The%20J.M.%20Smucker%20Company%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("JM Smucker" OR "The J.M. Smucker Company") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22JM%20Smucker%22%20OR%20%22The%20J.M.%20Smucker%20Company%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### The Home Depot

- Priority: C / Tier 2
- Current repo count: 200+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "The Home Depot" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22The%20Home%20Depot%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "The Home Depot" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22The%20Home%20Depot%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "The Home Depot" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22The%20Home%20Depot%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "The Home Depot" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22The%20Home%20Depot%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "The Home Depot" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22The%20Home%20Depot%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "The Home Depot" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22The%20Home%20Depot%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Georgia Pacific

- Priority: C / Tier 2
- Current repo count: 150+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Georgia Pacific" OR "Georgia-Pacific") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Georgia%20Pacific%22%20OR%20%22Georgia-Pacific%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Georgia Pacific" OR "Georgia-Pacific") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Georgia%20Pacific%22%20OR%20%22Georgia-Pacific%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Georgia Pacific" OR "Georgia-Pacific") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Georgia%20Pacific%22%20OR%20%22Georgia-Pacific%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Georgia Pacific" OR "Georgia-Pacific") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Georgia%20Pacific%22%20OR%20%22Georgia-Pacific%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Georgia Pacific" OR "Georgia-Pacific") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Georgia%20Pacific%22%20OR%20%22Georgia-Pacific%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Georgia Pacific" OR "Georgia-Pacific") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Georgia%20Pacific%22%20OR%20%22Georgia-Pacific%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### H-E-B

- Priority: C / Tier 2
- Current repo count: 50+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "H-E-B" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22H-E-B%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "H-E-B" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22H-E-B%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "H-E-B" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22H-E-B%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "H-E-B" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22H-E-B%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "H-E-B" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22H-E-B%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "H-E-B" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22H-E-B%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Honda

- Priority: D / Tier 3
- Current repo count: 12
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "Honda" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22Honda%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "Honda" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22Honda%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "Honda" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22Honda%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "Honda" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22Honda%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "Honda" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22Honda%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "Honda" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22Honda%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Hyundai Motor America

- Priority: D / Tier 3
- Current repo count: 5
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Hyundai Motor America" OR "Hyundai") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Hyundai%20Motor%20America%22%20OR%20%22Hyundai%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Hyundai Motor America" OR "Hyundai") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Hyundai%20Motor%20America%22%20OR%20%22Hyundai%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Hyundai Motor America" OR "Hyundai") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Hyundai%20Motor%20America%22%20OR%20%22Hyundai%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Hyundai Motor America" OR "Hyundai") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Hyundai%20Motor%20America%22%20OR%20%22Hyundai%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Hyundai Motor America" OR "Hyundai") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Hyundai%20Motor%20America%22%20OR%20%22Hyundai%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Hyundai Motor America" OR "Hyundai") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Hyundai%20Motor%20America%22%20OR%20%22Hyundai%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### John Deere

- Priority: D / Tier 3
- Current repo count: 60+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "John Deere" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22John%20Deere%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "John Deere" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22John%20Deere%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "John Deere" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22John%20Deere%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "John Deere" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22John%20Deere%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "John Deere" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22John%20Deere%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "John Deere" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22John%20Deere%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Kenco Logistics Services

- Priority: D / Tier 3
- Current repo count: 100+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Kenco Logistics Services" OR "Kenco") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Kenco%20Logistics%20Services%22%20OR%20%22Kenco%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Kenco Logistics Services" OR "Kenco") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Kenco%20Logistics%20Services%22%20OR%20%22Kenco%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Kenco Logistics Services" OR "Kenco") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Kenco%20Logistics%20Services%22%20OR%20%22Kenco%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Kenco Logistics Services" OR "Kenco") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Kenco%20Logistics%20Services%22%20OR%20%22Kenco%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Kenco Logistics Services" OR "Kenco") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Kenco%20Logistics%20Services%22%20OR%20%22Kenco%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Kenco Logistics Services" OR "Kenco") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Kenco%20Logistics%20Services%22%20OR%20%22Kenco%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Barnes & Noble

- Priority: D / Tier 3
- Current repo count: 8
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "Barnes & Noble" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22Barnes%20%26%20Noble%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "Barnes & Noble" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22Barnes%20%26%20Noble%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "Barnes & Noble" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22Barnes%20%26%20Noble%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "Barnes & Noble" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22Barnes%20%26%20Noble%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "Barnes & Noble" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22Barnes%20%26%20Noble%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "Barnes & Noble" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22Barnes%20%26%20Noble%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### FedEx

- Priority: D / Tier 3
- Current repo count: 5,000+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: "FedEx" (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=%22FedEx%22%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: "FedEx" ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=%22FedEx%22%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov "FedEx" ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20%22FedEx%22%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: "FedEx" ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=%22FedEx%22%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: "FedEx" ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=%22FedEx%22%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: "FedEx" ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=%22FedEx%22%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### AB InBev

- Priority: Flagship / Flagship
- Current repo count: 100+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("AB InBev" OR "Anheuser-Busch InBev") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22AB%20InBev%22%20OR%20%22Anheuser-Busch%20InBev%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("AB InBev" OR "Anheuser-Busch InBev") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22AB%20InBev%22%20OR%20%22Anheuser-Busch%20InBev%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("AB InBev" OR "Anheuser-Busch InBev") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22AB%20InBev%22%20OR%20%22Anheuser-Busch%20InBev%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("AB InBev" OR "Anheuser-Busch InBev") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22AB%20InBev%22%20OR%20%22Anheuser-Busch%20InBev%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("AB InBev" OR "Anheuser-Busch InBev") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22AB%20InBev%22%20OR%20%22Anheuser-Busch%20InBev%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("AB InBev" OR "Anheuser-Busch InBev") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22AB%20InBev%22%20OR%20%22Anheuser-Busch%20InBev%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)

### Coca-Cola

- Priority: Flagship / Flagship
- Current repo count: 70+
- Current source: accounts-json
- Research status: missing
- Scope target: North America or MODEX-relevant operating network
- Current fact summary: no dedicated facility fact recorded yet.

Evidence capture:
- Exact facility count:
- Scope:
- Facility type mix:
- Best source 1:
- Best source 2:
- Reconciliation note:

Queries:
1. Official Footprint: Find the company's published network, locations, or footprint page.
   Search: ("Coca-Cola" OR "The Coca-Cola Company") (locations OR footprint OR network) (manufacturing OR plant OR warehouse OR "distribution center")
   Google: https://www.google.com/search?q=(%22Coca-Cola%22%20OR%20%22The%20Coca-Cola%20Company%22)%20(locations%20OR%20footprint%20OR%20network)%20(manufacturing%20OR%20plant%20OR%20warehouse%20OR%20%22distribution%20center%22)
2. Annual Report / IR: Find investor-facing language that discloses facility totals or regional footprint.
   Search: ("Coca-Cola" OR "The Coca-Cola Company") ("annual report" OR investor OR "10-K") (facilities OR plants OR warehouses OR "distribution centers")
   Google: https://www.google.com/search?q=(%22Coca-Cola%22%20OR%20%22The%20Coca-Cola%20Company%22)%20(%22annual%20report%22%20OR%20investor%20OR%20%2210-K%22)%20(facilities%20OR%20plants%20OR%20warehouses%20OR%20%22distribution%20centers%22)
3. SEC Filings: Cross-check formal public filings when company marketing pages are vague.
   Search: site:sec.gov ("Coca-Cola" OR "The Coca-Cola Company") ("10-K" OR "annual report") (facilities OR plants OR warehouse OR logistics)
   Google: https://www.google.com/search?q=site%3Asec.gov%20(%22Coca-Cola%22%20OR%20%22The%20Coca-Cola%20Company%22)%20(%2210-K%22%20OR%20%22annual%20report%22)%20(facilities%20OR%20plants%20OR%20warehouse%20OR%20logistics)
4. North America Network: Separate global footprint claims from the network Casey is actually selling into.
   Search: ("Coca-Cola" OR "The Coca-Cola Company") ("North America" OR USA OR US) (manufacturing OR distribution OR logistics) (facilities OR plants OR DCs OR warehouses)
   Google: https://www.google.com/search?q=(%22Coca-Cola%22%20OR%20%22The%20Coca-Cola%20Company%22)%20(%22North%20America%22%20OR%20USA%20OR%20US)%20(manufacturing%20OR%20distribution%20OR%20logistics)%20(facilities%20OR%20plants%20OR%20DCs%20OR%20warehouses)
5. Expansion History: Catch openings, expansions, and new DC announcements that imply current footprint scale.
   Search: ("Coca-Cola" OR "The Coca-Cola Company") ("distribution center" OR plant OR warehouse) (opened OR expansion OR footprint OR network)
   Google: https://www.google.com/search?q=(%22Coca-Cola%22%20OR%20%22The%20Coca-Cola%20Company%22)%20(%22distribution%20center%22%20OR%20plant%20OR%20warehouse)%20(opened%20OR%20expansion%20OR%20footprint%20OR%20network)
6. Operations Footprint: Find supply-chain and operations interviews that mention site counts and operating model.
   Search: ("Coca-Cola" OR "The Coca-Cola Company") ("supply chain" OR operations OR manufacturing OR logistics) (footprint OR facilities OR plants OR network)
   Google: https://www.google.com/search?q=(%22Coca-Cola%22%20OR%20%22The%20Coca-Cola%20Company%22)%20(%22supply%20chain%22%20OR%20operations%20OR%20manufacturing%20OR%20logistics)%20(footprint%20OR%20facilities%20OR%20plants%20OR%20network)
