# ROI Calculator Deep-Link Contract

The YNS account microsites (Sprint M4) link prospects to
**yardflow.ai/roi/** with the account context prefilled into the query
string. This file documents the params the calculator should read and how
they map to its inputs.

The /roi/ calculator lives in the **Flow-State-** repo
(`flow-state-site/app/roi/page.tsx`); the deep-link builder lives in
**modex-gtm**: `src/lib/microsites/roi-deep-link.ts`.

## Params

All params are optional. The calculator should fall back to its own
defaults when a param is absent.

| Param | Type | Source | Maps to |
| --- | --- | --- | --- |
| `account` | string | `data.accountName` | Header label (`"Pre-filled for Dannon"`). |
| `account_slug` | string | `data.slug` | Stable identifier for tracking + share IDs. |
| `facilities` | int | `data.network.facilityCount` (leading number) | Site count input on the calculator. |
| `primary_mode` | string | `data.freight.primaryModes[0]` | Archetype mix preset (truckload / intermodal / mixed). |
| `detention_est` | int | `data.freight.detentionCost` (leading dollar amount, M/K aware) | Detention $ input baseline. |
| `loads_per_day` | int | `data.freight.avgLoadsPerDay` (leading number) | Throughput multiplier baseline. |
| `p` | string | `?p=person-slug` from the memo URL (Sprint M5) | Reader-aware label on the calculator. |
| `ref` | string | constant `"memo"` | Attribution. Used to filter "calculator from memo" in analytics. |

## Behavior expectations on the /roi/ side

1. **Read params on mount.** Hydrate calculator state from the query string
   on first render, not via redirect.
2. **Show the prefilled badge.** Render a small "prefilled for {account}"
   chip near the top so the prospect can confirm the inputs reflect their
   network and adjust if needed.
3. **Don't lock inputs.** Every prefilled value is editable. The deep
   link is a starting point, not a contract.
4. **Tracking attribution.** Log the `ref=memo` and `account_slug` query
   params into whatever analytics layer the calculator uses, alongside the
   existing PDF-export events.

## What the deep-link does NOT do

- Authenticate. There's no signed token. Anyone can construct a link with
  arbitrary params; the calculator should treat them as user input.
- Embed sensitive data. The memo's research is on the modex-gtm side; the
  deep-link only carries publicly observable network shape.
- Pre-populate confidential numbers. Detention estimates in the link are
  derived from public data (10-K / DOT / industry benchmarks). Real
  numbers come from the prospect editing the calculator.

## When the calculator side has not yet read the params

Until a Flow-State- PR ships the param-reading code, the link still works:
prospects land on /roi/ with the account context visible in the URL. The
soft-action's value (anchoring the funnel without a meeting CTA) holds
either way.
