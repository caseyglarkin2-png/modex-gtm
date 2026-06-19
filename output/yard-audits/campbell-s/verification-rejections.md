# Campbell's (campbell-s) — FOV verification rejections

FOV scrub run 2026-06-19 against the demo pack `public/demo-packs/campbell-s.json`
(`network.sites[]`, 21 sites). Verdicts stamped directly onto each site object's
`verification` block. Account: The Campbell's Company (renamed from "Campbell
Soup Company" in 2024).

## Result summary
- 21 sites verified.
- 20 confirmed (self-operated, except site 21 which is 3PL/DHL — included, OK).
- 1 rejected.

## Rejected sites

- **Lance - Burlington IA** (12-lance-burlington-ia; ~40.8277, -91.1395) —
  REJECTED: not Campbell's-operated. Snyder's-Lance divested its private-label
  business, including the Burlington, Iowa plant (and Cambridge, Ontario), to
  **Shearer's Foods** for ~$430M in **2014** — four years BEFORE Campbell's
  acquired Snyder's-Lance (2018). The plant still operates today, but as a
  Shearer's Foods facility, not Campbell's. Campbell's never operated this site.
  [Tier 2: https://en.wikipedia.org/wiki/Snyder%27s-Lance, 2014]
  [Tier 2 (current operator): https://en.wikipedia.org/wiki/Shearer%27s_Foods — Shearer's lists Burlington IA among its current manufacturing plants, 2026-06]

## Notes / traps cleared (NOT rejected — flagged for the controller)

- **Paris TX (03)** — kept as confirmed. The 2026 WARN headlines read like a
  closure but are a soup-line-only partial layoff (~205 of 568); the plant stays
  open as Campbell's flagship Prego/Pace sauce facility. Soup volume moved to
  Napoleon OH + Maxton NC.
- **Kettle Brand Salem OR (13)** — kept as confirmed. The closed Oregon plant is
  **Tualatin / Pacific Foods** (soup/broth, ceasing ~July 2026), a different
  brand/facility ~35 mi north. The Jan 2026 potato-chip consolidation closed
  **Hyannis MA only**; Salem is unaffected.
- **Bloomfield CT (08)** — kept as confirmed. The 2018 "closure" was the Norwalk
  corporate HQ office, not the Bloomfield manufacturing plant (same press
  committed to growing Bloomfield). Strongest dated press is 2018; ongoing
  hiring corroborates continuation.
- **Charlotte NC (11)** — kept as confirmed. Only the separate Emerald nuts
  building at the campus closed in 2023; the Lance cracker/chip plant
  (~1.2M sqft, ~1,500 staff) continues.
- **Stockton CA (18)** — kept as confirmed. The closed CA plant was Sacramento
  (2013) and the divested CA asset was Bolthouse/Bakersfield (2019); the Stockton
  tomato-paste plant (Campbell Soup Supply Co.) remains operational.
- **Goodyear AZ (19)** — kept as confirmed. Not a phantom; Campbell's newsroom
  names Goodyear AZ as one of its three Campbell Snacks pretzel plants.
- **Findlay OH DC (21)** — kept as confirmed, operator = 3PL (DHL Supply Chain
  runs it for Campbell's). Included per protocol.
