# Amazon — FOV verification rejections & flags

FOV scrub run 2026-06-18. 16 sites verified against the closure/cancellation
gauntlet + a positive current-operation source. Amazon's 2022-2023 pullback
(and the 2024 Stockton/Irvine/West-Sacramento and 2026 Homestead/Reno closures)
were specifically checked against each site.

## Rejections

**None.** All 16 sites are currently Amazon-operated. No site matched a
canceled, closed, idled, or divested Amazon building.

How verified: each site's Amazon facility code was mapped to its exact
city/building, confirmed with at least one current source (Amazon's own tours
portal / hiring.amazon.com / aboutamazon.com / Amazon-hosted FC list, plus
econ-dev and dated press), and run through the closure gauntlet
("<code> closed", "<city> fulfillment center closed OR canceled OR layoffs WARN",
"shuttered"). The closure hits that surfaced all named DIFFERENT buildings
(TMB8 Homestead FL, Stockton 4601 Newcastle Dr, Irvine, West Sacramento, the OH
janitorial-contractor layoffs), never these 16.

## Low-confidence (probable, ships caveated + capped)

- **PHX6 Fulfillment Center, Phoenix AZ** (08) — PROBABLE. Multiple current-dated
  (May/Jun 2026) sources show PHX6 actively hiring and operating at ~5050 W
  Mohave St, and the closure/WARN gauntlet was clean, but no Tier-1
  aboutamazon/press source surfaced for the exact building. Capped to probable.
  [Tier 3: https://www.indeed.com/q-amazon-phx6-l-phoenix,-az-jobs.html, 2026-06]

## Re-pin / data-quality flags (confirmed sites, but record fields need a fix)

- **BFI4 Kent WA** (01) — Street address in the prompt note (2700 Center Dr) is
  wrong; that is BFI3/DuPont. BFI4 is at **21005 64th Ave S, Kent WA 98032**.
  City (Kent) and code are correct. Coords look correct. Update street address
  if/when stored.
- **FTW1 "Dallas" TX** (06) — Operation confirmed at **33333 W LBJ Fwy, 75241**,
  but that is **south Dallas (Hutchins/Wilmer corridor)**, not central Dallas.
  Label "Dallas" is imprecise. Coords match the LBJ Fwy building.
- **DFW7 "Fort Worth" TX** (07) — Confirmed at **700 Westport Pkwy** in
  AllianceTexas; building sits on the **Fort Worth/Haslet line** and some
  directories tag it Haslet TX 76177. Coords match. Not AFW1 (a different FW FC).
- **SCK6 Tracy CA** (16) — TWO flags. (1) Labeled "Sortation Center" but every
  source describes it as a **5-story robotics FULFILLMENT center** (1500 E Grant
  Line Rd, 3.5M sqft, 40 dock bays, 230 trailer stalls). Consider relabeling to
  FC. (2) **SCK** code = Stockton metro but the building is physically in
  **Tracy** — expected (Amazon codes by metro), not disqualifying. Freight-yard
  sanity holds.
- **SCK4 Stockton CA** (15) — Confirmed IXD on **S Austin Rd, Stockton** (opened
  Oct 2023). Note: the June-2024 Stockton Amazon closure was a DIFFERENT building
  (4601 Newcastle Dr), not SCK4. No action needed; recorded to prevent a future
  false-positive rejection.

## Tally

- Confirmed: 15
- Probable: 1 (PHX6)
- Rejected: 0
- Total: 16
