# Pactiv Evergreen — FOV Verification Rejections

FOV scrub run 2026-06-19 (verify-facility-prompt.md protocol). 30 of 30 sites verified.

**Result: 0 rejected, 0 probable, 30 confirmed.** No site was rejected — none required a rejection entry.

## Context that mattered (and why nothing was rejected)

- **Novolex acquisition (operator stays "self", NOT a rejection):** Novolex (Apollo-backed) completed its $6.7B acquisition of Pactiv Evergreen on **April 1, 2025**. The plants keep running as the same self-operated facilities. An acquisition that keeps a plant running is not a divestiture/closure, so every site is `operator: "self"`.

- **The 2023-2025 restructuring closures are all DIFFERENT sites** from the 30 audited here. Each was confirmed by name so a partial-string match could not slip a closed plant through:
  - **Beverage Merchandising / paperboard MILLS (2023):** Canton NC mill, Olmsted Falls OH (converting), Pine Bluff AR mill, Waynesville NC (sold to Suzano Oct 2024). These are upstream mills, **not** the downstream carton-converting plants in Athens GA / Raleigh NC / Plant City FL / Turlock CA, which kept running and were each independently confirmed.
  - **Novolex-era 2025-2026 closures:** Bakersfield CA (~127 jobs, Oct 2025), Kalamazoo MI (~153 jobs, Jun 2025), Bremen GA (Waddington/Novolex, ~49 jobs, Jan 2026). The Georgia closure is **Bremen, not Athens/Conyers/Covington/Macon** — explicitly disambiguated. The California closure is **Bakersfield, not Stockton or Turlock** — explicitly disambiguated.
  - The "Cedar Rapids plant closing" news refers to **Smurfit Westrock**, not the Pactiv Evergreen equipment HQ at 2400 6th St SW — disambiguated.

## Per-site evidence (all confirmed, operator self)

Each site carries a `verification` block with >=1 real dated citation. Highlights of the harder calls:

- **Carton / Beverage-Merchandising plants scrutinized hardest** (the segment hit by the fresh-carton wind-down): Athens GA, Raleigh NC, Plant City FL, Turlock CA — all confirmed still operating via active careers reqs / chamber / city records; none on any closure list.
- **Address corrections confirmed by Tier-1:** Kinston NC (1447 Enterprise Rd) and Plattsburgh NY (74 Weed Street) — both flagged in the roster for imprecise geocode — were confirmed at the exact street address by dated careers requisitions naming that address.
- **Imagery note:** Canandaigua NY Street View is stale (2016-09), but operations are current (700+ employees, county's largest private employer per the Ontario County Chamber); verdict holds on Tier-1 econ-dev + careers evidence.
- **Lower direct-address anchors (still confirmed):** Canandaigua CTC DC and Covington GA DC lean partly on Tier-3 corroboration because the Pactiv plant locator now redirects to a JS-rendered Novolex page with no static addresses; both sit inside demonstrably-active Pactiv campuses with no negative signal, so they hold as confirmed.

`checkedDivestiture: true` on all 30. `checkedBankruptcyEra: false` on all 30 — Pactiv Evergreen had no Chapter-11 / Motors-Liquidation-style bankruptcy era; the relevant change-events are the plant-by-plant restructuring closures and the Novolex deal, both covered by the divestiture gauntlet.
