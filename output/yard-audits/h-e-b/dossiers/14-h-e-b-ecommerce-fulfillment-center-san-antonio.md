# Deep-Audit Dossier — H-E-B eCommerce Fulfillment Center, San Antonio TX (idx 14)

## Facility
- **Name:** H-E-B eCommerce Fulfillment Center - San Antonio
- **Type:** E-commerce Fulfillment Center
- **Address:** San Antonio, TX (no specific address in roster)
- **Status:** **COULD NOT RESOLVE — no verifiable distinct facility found.**

## Step 0 — Location attempt (unresolved)
The roster supplies only a city-level address and APPROXIMATE coordinates
(29.42519, -98.494592, geocode moved 6794 m). Probing those coordinates at
z17 shows downtown San Antonio's civic core — government buildings, parking
garages, dense urban blocks — with no industrial or fulfillment facility
anywhere near. The coordinates are identical to the placeholder used for
roster idx 7 (San Antonio Snack Plant), confirming they are a generic
San-Antonio city centroid, not a real geocode.

## Research performed
Extensive web research across H-E-B Newsroom, Grocery Dive, Supply Chain
Dive, Supermarket News, Progressive Grocer, The Shelby Report and Swisslog:

- H-E-B's publicly documented e-commerce fulfillment centers are:
  - **Houston** — multiple, including the standalone Holmes Rd eFC (Feb 2025);
  - **Katy** — 2023, ~100,000 sq ft, explicitly described as H-E-B's *first
    stand-alone* eFC;
  - **Plano** — 2023, ~55,000 sq ft, attached to the Plano store;
  - **Leander** — 5th eFC, 651 N US Hwy 183, ~50,000 sq ft;
  - **Cibolo** — 2024, ~55,000 sq ft, 8th eFC, attached to the Cibolo store,
    explicitly serving "Cibolo, New Braunfels, and surrounding cities around
    the San Antonio area";
  - **Frisco** — planned, construction 2026-2027.
- No source identifies a separate stand-alone eFC inside the city of San
  Antonio. Before the 2023 Katy facility, H-E-B's eFCs were store-integrated
  micro-fulfillment, not stand-alone freight buildings.
- The roster's own source note concedes: "specific San Antonio standalone eFC
  street address not publicly confirmed."

## Conclusion
This roster entry (idx 14) appears to be a **speculative / placeholder line
item** generated from H-E-B's general public statement of "nine eFCs since
2018." H-E-B's San Antonio-metro Curbside and Home-Delivery demand is served
by the **Cibolo eFC (roster idx 13)** and by earlier store-integrated
micro-fulfillment. There is no distinct, verifiable San Antonio-proper
standalone eFC to audit.

## Output
The `.json` is written with `confidence: "low"`, all 22 classification
fields listed in `uncertainFields`, and `geofences`/`yardMetrics` zeroed/null.
**Recommend human review:** either merge this entry into idx 13 (Cibolo) or
strike it from the roster as a probable double-count.

## Confidence
**Low.** Facility could not be located or verified after a genuine research
effort.
