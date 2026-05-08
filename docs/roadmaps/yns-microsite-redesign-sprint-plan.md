# YNS Microsite Redesign — Sprint Plan

**Status:** Approved 2026-05-08
**Purpose:** Rebuild the per-account microsite as a YNS-thesis-first, anti-selling thinking artifact that hands prospects off to the existing `yardflow.ai/roi/` calculator instead of asking for a meeting. Two artifacts, zero forced conversations.

## North Star

The microsite's job is **not** to book a call. It is a thinking artifact — proof that YardFlow has done the work on the prospect's specific network, written so a champion can read it, share it, and build an internal case from it. The CTA is not "book the audit"; the CTA (single, soft, end-of-page) is "see this modeled against your actual network" — which deep-links into `yardflow.ai/roi/` pre-filled with the account's archetype mix.

The funnel is:

```
COLD OUTBOUND
  └─ personalized cover letter (Sprint M6)
     │  body references prospect mandate; link includes ?p=person-slug
     ▼
ARTIFACT 1 — MICROSITE  (this redesign)
  └─ YNS thesis · Network observation · Comparable · Methodology · About
     │  reader-aware framing when ?p= matches
     │  one soft action: "see this modeled against your network →"
     ▼
ARTIFACT 2 — /roi/ CALCULATOR  (already exists on yardflow.ai)
  └─ pre-filled with account archetype mix
     │  prospect adjusts assumptions, generates Board-ready PDF
     │  optional "Book a Network Audit" CTA exists but isn't required
     ▼
INBOUND  (when prospect is ready)
  └─ reply to email or click audit CTA on /roi/
```

## Design principles

1. **Anti-selling.** The microsite reads like an analyst memo, not a sales pitch. Observations, not claims. Ranges, not point estimates. "We may be wrong about parts of this" is honest and earns trust.
2. **YNS thesis leads.** Every microsite frames the same thesis up front: 75% of yards still run on radios and clipboards; layering more software on top of WMS/TMS doesn't see what's happening between gate and dock; YardFlow is the missing network layer (a YNS, not a YMS).
3. **Light memo, not dark theatre.** Replace the current dark `MicrositeShell` (slate-950 + grid + spotlights) with a clean white memo layout. System sans, narrow column, footnoted citations, accent line per account.
4. **One soft action, end of page.** The only forward action is the deep link to `/roi/`. No sticky CTA in the header. No "book a call" buttons. Calendar links removed entirely.
5. **Reader-aware, not per-route personalized.** Drop `/for/[account]/[person]` routes. Use `?p=person-slug` query param to render person-aware framing inline (greeting, KPI vocabulary, mandate-relevant emphasis). One URL per account, infinite reader variants.
6. **Forwardability over screenshot.** Optimize for "champion forwards this to their team and they read it end-to-end" — not for the first impression on hero alone.

## Section structure (5 sections, fixed order)

1. **Header** — `PRIVATE ANALYSIS · prepared YYYY-MM-DD` · "Yard execution as a network constraint for [Company]" · "prepared for [reader] · 47-plant footprint" · author byline. No CTA.
2. **YNS Thesis** — universal across accounts. The frame: WMS/TMS spend isn't moving yard variance because most yards run on radios + clipboards; this is a network-layer standardization problem; YardFlow is the missing layer.
3. **What we observed about your network** — public-data composition (plant count, archetype mix, network shape) + bottleneck hypothesis with citations + "we may be wrong, happy to be corrected" caveat.
4. **What a similar network did** — Primo Brands (or other peer) case study, archetype-matched, specific numbers + timeline + reference availability noted but not pushed.
5. **Methodology + About** — data sources cited, confidence levels per finding, what we don't know, author bio, soft sign-off including the deep link to `/roi/`.

## Sprints

Each sprint task gets the full acceptance card filled in **before** implementation starts. One commit per task unless atomically inseparable. Each sprint closes with a proof-ledger entry.

```text
Task ID:
Current route(s):
Canonical route/view:
Seed/fixture:
User assertion:
Test command:
Required artifact:
Commit boundary:
```

### Sprint M1 — Public Access Foundation

**Goal:** Prospects clicking yardflow.ai/for/[account] land on the (current dark) microsite, not 404. Routing pipe in place; visual rebuild happens in M2-M3.
**Demo:** Open `https://yardflow.ai/for/general-mills` incognito → microsite renders + `MicrositeEngagement` row created.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M1.1 | Make `/for/[account]` truly public on modex-gtm | Drop the unauthenticated `redirect to micrositeBaseUrl` block in `middleware.ts`; matcher exclusion stays so auth doesn't fire | middleware.ts only |
| M1.2 | Add Vercel rewrite on `flow-state-klbt` repo | `vercel.json` rewrite `/for/:path*` → `https://modex-gtm.vercel.app/for/:path*` | flow-state-klbt vercel.json only |
| M1.3 | Drop dead yardflow.ai allowlist in modex-gtm middleware | `host.includes(PUBLIC_DOMAIN)` block + `PUBLIC_DOMAIN_ALLOWLIST` constant + `isPublicDomainPath` helper all gone | middleware.ts only |
| M1.4 | Public-access smoke spec | Playwright asserts `yardflow.ai/for/general-mills` 200 + expected H1 + `MicrositeEngagement` row written | `tests/e2e/microsite-public-access.spec.ts` only |

### Sprint M2 — Light Memo Template

**Goal:** Replace the dark `MicrositeShell` with a light memo layout. Single template, anti-selling tone, no sticky CTA.
**Demo:** A throwaway test microsite renders with new memo layout + footnotes + accent line + readable column width.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M2.1 | `MemoShell` component | `src/components/microsites/memo-shell.tsx` — white bg, narrow readable column, system sans (Inter), authorship header (no CTA button), accent line per account | new file + render fixtures |
| M2.2 | `Footnote` primitive | `<Footnote id source confidence>…</Footnote>` renders inline marker + numbered footnote list at bottom + confidence badges (measured/public/estimated/inferred) | new primitive + tests |
| M2.3 | `MemoSection` renderer scaffold | Switches on the new section type union (M2.5), renders citations + accent treatment | new file |
| M2.4 | Per-account theme reduces to accent | `theme.accentColor` drives a single accent line + footnote marker color; full-theme overrides removed | `theme.tsx` + memo-shell wire-up |
| M2.5 | New `SectionType` union | `'yns-thesis' \| 'observation' \| 'comparable' \| 'methodology' \| 'about'`; legacy types still accepted via M3 compat layer | `schema.ts` only |
| M2.6 | OG image generator updated for memo style | New OG card matches memo aesthetic (light bg, accent line, type) | `opengraph-image.tsx` only |

### Sprint M3 — Section Migration + Author Voice

**Goal:** All 28 account `.ts` files migrate from 13-type sections to the 5-type memo structure. Voice shifts to observational / anti-selling.
**Demo:** Each migrated account renders end-to-end on the new template; un-migrated accounts show a "needs hand-tuning" banner.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M3.1 | Universal YNS thesis content | `src/lib/microsites/yns-thesis.ts` exports the universal thesis (75% radios+clipboards stat with ATA+DOT footnote, YNS-not-YMS frame, network-layer-not-software argument) | one lib file |
| M3.2-M3.6 | Migrate top 5 accounts hand-authored | Dannon, General Mills, Frito-Lay, Diageo, Campbell's — each commit migrates one account | one .ts per commit |
| M3.7 | Bulk-migration script with template defaults | `scripts/migrate-microsite-sections.ts` walks remaining 23 accounts, generates rough sections from existing data, marks each `needsHandTuning: true` | one script |
| M3.8 | Compat layer for legacy sections | Old types still render via fallback adapter + log deprecation warning per old type rendered | one helper |
| M3.9 | "Needs hand-tuning" banner | When `needsHandTuning: true`, MemoShell renders top-of-page strip: "This is a generic analysis. A custom version is in flight." | shell change |
| M3.10 | Strip CTA mechanics from schema | Remove `CTABlock`, `cta` `SectionType`, `ctaOverride` on `PersonVariant`, `normalizeMicrositeCta`, `buildShortOverviewCta`, calendar links | `schema.ts` + `cta.ts` |

### Sprint M4 — ROI Deep-Link Integration

**Goal:** Microsite's only soft action — "see this modeled against your network" — opens `/roi/` pre-filled with the account's archetype mix.
**Demo:** Click soft action on `/for/general-mills` → lands on `yardflow.ai/roi/?facilities=47&withYMS=12&drops=10&without=25&account=general-mills&lead_source=microsite` with assumptions tab populated.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M4.1 | `buildROIDeepLink(account)` helper | Takes `AccountMicrositeData`, derives counts from `roiModel.archetypeMix`, returns URL with all params + `lead_source=microsite` | helper + unit test |
| M4.2 | Render soft action at end of "About" section | Single inline link, no button styling. "If you'd like this modeled against your network's actual archetype mix, the calculator is here." | `sections.tsx` only |
| M4.3 | Coordinate `/roi/` contract with the parallel sales-enablement work on flow-state-klbt | Doc the deep-link query schema (param names, types, defaults). The `/roi/` side parses, pre-fills, and stores `lead_source=microsite` for attribution | `docs/roadmaps/roi-deeplink-contract.md` |
| M4.4 | Track the deep-link click as `MicrositeEngagement` | New event `roi-deeplink-click` captured with target archetype mix + reader-id (if `?p=` present) | `tracking.ts` + emitter |

### Sprint M5 — Reader-Aware Framing (`?p=person-slug`)

**Goal:** Adding `?p=dan-poland` renders person-aware framing inline (greeting, KPI vocabulary, mandate-relevant emphasis). One URL per account, infinite reader variants.
**Demo:** `/for/campbells?p=dan-poland` shows "Dan — given your transformation mandate" in About section + KPI vocabulary shifts in YNS thesis; without `?p=` the universal version renders.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M5.1 | `resolveReaderProfile(account, slug)` helper | Returns matched `PersonProfile` or `null` | helper + unit test |
| M5.2 | Reader-aware sign-off in About section | Address by first name + reference mandate or recent signal | section renderer |
| M5.3 | Reader-aware KPI language in YNS thesis | When `PersonProfile.kpiLanguage` exists, swap generic terms for their vocabulary | section renderer + `lib/microsites/kpi-vocab.ts` |
| M5.4 | Reader-aware comparable hook | When `PersonProfile.previousCompanies` includes a peer/customer, surface "you saw this pattern at [X]" inline | section renderer |
| M5.5 | "Prepared for [Name]" eyebrow when `?p=` matches | Subtle authorship eyebrow on memo header | shell change |
| M5.6 | Reader-aware overlay test | Playwright spec with `?p=dan-poland` asserts personalized eyebrow + sign-off | spec only |

### Sprint M6 — Email Cover-Letter Helper

**Goal:** Casey can generate a 2-paragraph personalized cover letter for any (account, person) pair from Studio's Generate tab. Output includes the `?p=` deep link, copy-paste-ready.
**Demo:** Studio → Generate → "Microsite intro letter" → pick General Mills + Dan Poland → output is a personalized email body referencing his transformation mandate, with `https://yardflow.ai/for/general-mills?p=dan-poland` at the bottom.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M6.1 | Add `microsite-intro-letter` asset type to Studio | `contentAssetTypes` gains the entry; Generate tab dropdown shows it | `content-studio.ts` only |
| M6.2 | Prompt template using `PersonProfile` + `AccountMicrositeData` | Synthesizes account network composition + person mandate + KPI language + recent signal → 2-paragraph email | one prompt + one wiring component |
| M6.3 | Output rendering with copy buttons | "Copy as plain text" + "Copy as HTML"; `?p=` deep link auto-inserted at bottom | studio component change |
| M6.4 | "I sent this" button writes Activity row | Activity `{ type: 'microsite-intro-letter', account, persona, body }` so engagement attribution connects letter → reply | activity logger + button |

### Sprint M7 — Cleanup

**Goal:** Old microsite engine code is gone. The microsite folder shrinks. No compatibility shims linger.
**Demo:** `wc -l src/components/microsites/* src/lib/microsites/*` shows meaningful reductions; grep returns no references to dark `MicrositeShell`, `FlagshipPrimitives`, `LayoutPreset`, per-person routes.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| M7.1 | Delete `/for/[account]/[person]/page.tsx` + opengraph-image | Per-person routes gone; replaced by `?p=` overlay in M5 | route deletes only |
| M7.2 | Delete dark `MicrositeShell` component | Replaced by `memo-shell.tsx` | one file delete |
| M7.3 | Delete `flagship-primitives.tsx` | Dark theatre primitives no longer used | one file delete |
| M7.4 | Drop `LayoutPreset` enum | `executive`/`industrial`/`retail`/`partnership` variants gone from schema | `schema.ts` + account edits |
| M7.5 | Drop legacy section types | Remove 10 legacy types from `SectionType` union; compat adapter from M3.8 removed | `schema.ts` |
| M7.6 | Drop dead `PersonVariant` knobs | Remove `variantSlug`, `sectionOrder`, `hideSections`, `addSections` | `schema.ts` |
| M7.7 | Replace flagship-microsite-asset-index doc | New microsite design doc reflecting YNS-thesis + 5-section + memo + two-artifact-funnel | docs only |

## Do-Not-Build Boundaries

- Do not add a "Book a meeting" button anywhere on the microsite. The intermediate step is `/roi/`, not a calendar.
- Do not regenerate per-person routes. Reader-aware framing via `?p=` replaces per-person URLs.
- Do not add new section types beyond the 5. If new content is needed, find a home in one of the existing 5.
- Do not duplicate the `/roi/` calculator inside the microsite. The microsite hands off, doesn't compete.
- Do not turn YNS thesis into per-account variation. The thesis is universal; only the network observation + comparable section vary.

## Approval Gate

Plan approved 2026-05-08. Begin with Sprint M1.
