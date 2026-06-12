# YardFlow TAM — Definition & Tagging Engine Design Spec

Date: 2026-06-11
Owner: Casey Larkin (founding AE, YardFlow by FreightRoll)
Status: Approved definition, pre-implementation

## Why

The MQL/SQL qualification engine gates on account fit, but the current fit signal
(`yardflow_icp_score`) is the discovery pipeline's PROXIMITY-led corridor scan — it tagged
451 of 11,705 companies and misses the enterprise book (GXO/Mondelez/Wesco unscored despite
hundreds of engaged contacts). We need a real, exhaustive Total Addressable Market: the NA
companies whose facilities + freight justify a standardized driver experience and yard network.
The TAM is the foundation everything downstream keys off (qualification, drip, ABM, reporting).

## Definition (approved)

An account is **in the TAM** when ALL hold:

1. **NA freight footprint** — operates physical facilities in US / Canada / Mexico (HQ may be
   anywhere; what matters is NA yard-bearing operations).
2. **Facility floor** — runs **>= 3 qualifying facilities OR >= 1 high-throughput facility**
   (a large DC/plant/terminal with real gate/yard/dock congestion). Qualifying facility types:
   manufacturing plants, distribution centers, warehouses, truck terminals, cross-docks, ports,
   intermodal/rail ramps, fulfillment centers, cold-storage facilities.
3. **Freight intensity** — meaningful inbound/outbound truck volume, evidenced by freight-heavy
   vertical × scale (revenue, headcount, known private fleet, or 3PL/carrier status) and a
   discernible freight mix (dry van / reefer / flatbed / intermodal / bulk / parcel).
4. **Vertical fit** — operates where we solve yard/dock/driver pain.
   **IN:** CPG / food / beverage manufacturing, retail & grocery distribution, 3PLs & dedicated
   carriers, building materials & industrial, chemicals / plastics, paper / packaging, e-commerce
   & parcel fulfillment, cold chain / cold storage, ports / marine terminals / intermodal,
   automotive & heavy manufacturing, agriculture / food processing, wholesale distribution.
   **OUT:** pure services, software / SaaS, finance / insurance, healthcare providers, hospitality,
   real estate, professional services, media — anything without significant yard freight.

### Corporate-family rollup (the Mondelez rule)
TAM membership lives at the **ultimate-parent account**. All brands/subsidiaries/op-cos roll their
facilities + freight UP to the parent; contacts associate up; the parent is the single canonical
TAM account. Implementation reuses the canonical/identity engine
(`src/lib/revops/{canonical-records,canonical-sync,account-identity}.ts`).

### Tiering
- **Tier A** — national/regional network (>= 10 qualifying facilities) or enterprise scale
  (rev >= $1B or >= 5k employees). The whale list.
- **Tier B** — multi-site (3–9 facilities) or rev >= $250M / >= 1k employees.
- **Tier C** — single high-throughput yard or smaller multi-site; still real pain.
- **Review** — fit likely but evidence incomplete; needs a human/agent second look.

## Output schema (HubSpot company properties)

Reuse where present, create where missing (via `ensure*Properties` pattern in
`src/lib/hubspot/properties.ts`):

| Property | Type | Meaning |
|---|---|---|
| `yardflow_tam` | enum: `in` / `review` / `out` | the verdict |
| `tam_tier` | enum: `A` / `B` / `C` | size/priority tier (in-TAM only) |
| `tam_segment` | enum (verticals above) | which vertical |
| `tam_facility_count` | number | best-estimate qualifying facility count |
| `facility_count_band` | enum (exists) | banded facility range |
| `primary_freight_type` | enum/multi (exists, empty) | dry van / reefer / flatbed / intermodal / bulk / parcel / mixed |
| `tam_reason` | text | one-line evidence ("47 US DCs, dry+reefer, $26B CPG") |
| `tam_source` | text | how scored (apollo / web / discovery / clawd / manual) |
| `tam_evaluated_at` | datetime | audit stamp |
| `na_operating` | bool | has NA facilities |

## Architecture (mirrors the qualification engine — code decides, dry-run/apply)

```
src/lib/revops/tam/
  types.ts        # TamVerdict, TamTier, TamSegment, AccountSignals, TamDiff
  criteria.ts     # PURE: classifyTam(signals) -> { verdict, tier, segment, reason }; thresholds, vertical maps
  criteria.test.ts# vitest decision matrix (in/out/review, family rollup, tier edges)
  signals.ts      # gather AccountSignals per company from Apollo + HubSpot + discovery + web research
  evaluate.ts     # iterate candidate universe -> TamDiff[] (read-only)
  apply.ts        # write tam props (write-guarded), idempotent
src/lib/hubspot/properties.ts          # ensureTamProperties()
src/app/api/cron/tam/route.ts          # CRON_SECRET-guarded; mode=dryrun|apply
```

### Signal sources (per account)
- **Apollo MCP** (`organizations_enrich` / `bulk_enrich`): industry, NAICS/SIC, employees, revenue,
  HQ + location count, keywords; `job_postings` for ops/warehouse/driver hiring (freight-intensity proxy).
- **HubSpot**: existing `facility_count_band`, `number_of_locations`, `parent_category`, `sic`,
  domain, name, associated-contact count.
- **modex-gtm discovery**: Places-scanner physical sites near reference corridors (real yard signals).
- **clawd-control-plane**: its enriched account/contact pipeline + `build_yardflow_truth` buyer model.
- **Web research** (agent): facility counts from company site / annual report / news for the borderline
  and the whales (the part that needs reasoning, not just a firmographic lookup).

### Classification
`classifyTam(signals)` is pure and tested: applies NA + vertical + facility-floor + freight-intensity,
emits verdict/tier/segment/reason. The hard, fuzzy facility-counting happens upstream in `signals.ts`
(and the enrichment agents); `criteria.ts` is deterministic over the gathered signals.

## Exhaustive enrichment (the build)

Candidate universe = the 9,907 companies-with-contacts (dedup first) UNION a sourced net of known
freight-heavy NA enterprises to reach the ~2,000 in-TAM target. Process each account through
signal-gathering → classify → tag, with a verification pass on every `review`/borderline and every
Tier-A call. This is run as a **multi-agent workflow**: fan out batches of accounts to enrichment
agents (Apollo + web research), classify, adversarially verify in/out edges, write tags. A
completeness critic checks coverage (verticals not swept, whales missing) and feeds the next round.

## Continuous discovery / labeling

A repeatable loop (cron + clawd's `yardflow_tam_refresh`): as new accounts enter (discovery,
enrichment, replies), gather signals → classify → tag `review` for anything uncertain, so the
criteria sharpen over time and the TAM stays live. New verticals/edge-cases get codified back into
`criteria.ts`.

## Downstream wiring

The MQL/SQL qualification engine's TAM gate switches from `yardflow_icp_score >= 70` to
`yardflow_tam = in` (keep the corridor score as a *proximity/priority* signal, not the fit gate).
The 2 Active Lists + Hot Accounts list rebuild on `yardflow_tam` + `tam_tier`.

## Rollout (sprints)

- **S0** Criteria + schema: `criteria.ts` (TDD) + `ensureTamProperties()` + finalize vertical/NAICS maps.
- **S1** Signals: `signals.ts` (Apollo + HubSpot + discovery), fixture-tested.
- **S2** Evaluate + dry-run cron over a pilot batch (the engaged enterprise: GXO/Mondelez/Wesco +
  top 200) → review precision with Casey.
- **S3** Apply path + properties live; tag the pilot.
- **S4** Exhaustive multi-agent enrichment across the full candidate universe; verify; tag.
- **S5** Re-point the qualification gate to `yardflow_tam`; rebuild lists; enable the continuous loop.

## Risks / mitigations
- **Facility counts are fuzzy** → agents cite evidence in `tam_reason`; Tier-A + review get verified;
  bias toward `review` over false `in`/`out`.
- **Family rollup conflicts with dedup** → run after company dedup; reuse canonical engine; parent is
  the single TAM record.
- **Apollo credits** → batch `bulk_enrich`; cache signals; only deep-web-research the borderline/whales.
- **Over-inclusion** → scale floor (>=3 facilities OR >=1 big yard) + vertical OUT-list; `review` buffer.

## Out of scope
- Contact-level qualification (the separate MQL/SQL engine consumes this).
- Changing the proximity corridor score (kept as a priority signal).
