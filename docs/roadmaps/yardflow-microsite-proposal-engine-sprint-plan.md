# YardFlow Microsite Proposal Engine Sprint Plan

Status: In progress through Sprint 6
Created: 2026-04-07
Primary repo: modex-gtm
Reference repo: clawd-control-plane

## Goal

Upgrade YardFlow account microsites from strong static ABM pages into proposal-grade buying experiences for top-tier accounts, while preserving the existing static TypeScript content model and person-variant architecture.

The build should borrow the best ideas from the proposal engine in clawd-control-plane without copying the wrong constraints.

## Success Criteria

1. Microsites capture engagement depth, not just page views.
2. Top-tier pages feel authored, sequenced, and proof-driven.
3. Person-specific variants change meaningfully by role and mandate.
4. Casey can see which accounts are hot, why they are hot, and what to do next.
5. The engine scales to additional accounts without rewriting the renderer.

## Guardrails

1. Keep static TypeScript microsite data as the source of truth.
2. Do not switch YardFlow to tokenized proposal URLs.
3. Do not make backend fetches a hard dependency for microsite rendering.
4. Do not ship narration/TTS in the first implementation wave.
5. Keep Google Calendar booking intact for now, except for warm-intro-only accounts like Dannon.
6. Preserve `export const dynamic = 'force-dynamic'` on pages that write to Prisma.
7. Use the existing analytics infrastructure and keep one canonical analytics dashboard.
8. Personalization must be grounded in named-person research already captured in the account config, not inferred from generic role templates.
9. Variant copy should prefer documented mandates, quotes, prior-company context, public language, and known pain points before any role-based hypothesis.

## Personalization Standard

This project should move toward research-grounded microsites, not persona cosplay.

1. Every flagship variant must anchor on the actual individual when that research exists.
2. Role-based assumptions are fallback only, never the lead framing for named targets.
3. If a variant cannot point to an actual mandate, quote, operating philosophy, or known pain point from research, it is not ready for flagship status.
4. Generic executive, ops, or logistics language is acceptable only where account research is incomplete and should be treated as temporary debt.
5. The fastest way to improve quality is to deepen the named-person record, not to invent more abstract persona templates.

## Execution Snapshot

As of 2026-04-07, the engine is materially ahead of the original Sprint 0/Sprint 1 approval point.

### Completed implementation slices

1. Sprint 0 harness and contracts are complete.
2. Sprint 1 engagement tracking core is complete.
3. Sprint 2 shell foundation is complete.
4. Sprint 3 proof primitives are live for Frito-Lay, General Mills, and AB InBev.
5. Sprint 5 operator surfaces now exist in the canonical analytics dashboard and the account detail page.
6. Sprint 4 has started with Frito-Lay and General Mills expanded to five named-person variants each, AB InBev now carrying two research-grounded executive variants, and Coca-Cola now carrying three research-grounded named-person routes.
7. Variant-switching browser coverage now validates named-person routing for Frito-Lay, General Mills, AB InBev, and Coca-Cola.
8. Microsite engagement CSV export is available through the existing export pipeline.
9. Flagship route and source links are indexed in `docs/roadmaps/flagship-microsite-asset-index.md`.

### Delivered commits

1. `86cd2054` `feat: build proposal-grade microsite foundation`
2. `05a586ce` `feat: add canonical microsite analytics dashboard`
3. `109b750f` `feat: surface account-level microsite signals`
4. `cf3f2ea6` `feat: upgrade flagship microsite proof narratives`
5. `a3d3bba2` `feat: expand microsite operator visibility`

### Current operator-visible capabilities

1. Public microsites track section reads, scroll depth, CTA clicks, and variant switching.
2. The canonical analytics dashboard ranks hot accounts and recent microsite sessions.
3. Account detail pages show account-level engagement summaries, variant performance, and recent microsite sessions.
4. New microsite CTA clicks create DB-backed activity rows for follow-up visibility.
5. Operators can export microsite engagement data as CSV from the analytics surface.

### Documentation and review aids

1. Flagship route and source links now live in `docs/roadmaps/flagship-microsite-asset-index.md`.
2. The roadmap and checklist docs remain the accountability source for which flagship routes are actually research-grounded.

### Current open work

1. Extend the same named-person depth to the remaining flagship account, Dannon, within its warm-intro constraint.
2. Deepen AB InBev and Coca-Cola further where operator-level named-person evidence is available.
3. Keep replacing thin role-based fallbacks with better named-person evidence as research improves.
4. Finish the Dannon concierge branch and then return to fast-follow migration tooling.

## Best Ideas To Port

### Port directly

| Source | Destination | Why |
|---|---|---|
| `clawd-control-plane/proposals-app/lib/use-tracker.ts` | new `src/components/microsites/use-microsite-tracker.ts` | Fine-grained client engagement tracking |
| `clawd-control-plane/proposals-app/components/CustomProposal.tsx` `Reveal` pattern | new `src/components/microsites/reveal.tsx` | Staggered section reveal and stronger scroll pacing |
| `clawd-control-plane/proposals-app/components/CustomProposal.tsx` shell patterns | new `src/components/microsites/microsite-shell.tsx` | Proposal-grade header, thesis panel, content rhythm |
| `clawd-control-plane/proposals-app/lib/proposal-service.ts` normalized section semantics | `src/lib/microsites/schema.ts` extensions | Richer narrative roles and proof primitives |
| `clawd-control-plane/proposals-app/lib/use-tracker.ts` payload dedupe strategy | `src/lib/microsites/tracking.ts` | Prevent noisy repeat writes |

### Use as inspiration, not a direct port

| Source | Adaptation |
|---|---|
| `clawd-control-plane/dwtb-site/app/proposal/[token]/page.tsx` | Reuse section sequencing ideas for YardFlow proof and plan framing |
| `clawd-control-plane/proposals-app/components/ParticleHero.tsx` | Borrow atmosphere and hero depth, but keep bundle impact under control |
| `clawd-control-plane/proposals-app/components/ErrorBoundary.tsx` | Add a microsite-specific client error boundary only if the shell becomes more interactive |

### Do not port

| Source pattern | Reason |
|---|---|
| Token-authenticated proposal routes | YardFlow microsites need stable account and person slugs |
| Backend-generated proposal JSON as page source | YardFlow already has a better static authoring model |
| Narration/TTS in wave one | More complexity than value for current sales motion |
| Generic proposal acceptance flow | YardFlow needs meeting intent, not proposal acceptance |

## Current State Snapshot

### modex-gtm strengths

1. Strong typed microsite schema in `src/lib/microsites/schema.ts`.
2. Strong person-variant resolution in `src/lib/microsites/rules.ts`.
3. Working account and person routes in `src/app/for/[account]/page.tsx` and `src/app/for/[account]/[person]/page.tsx`.
4. Working section renderer in `src/components/microsites/sections.tsx`.
5. Build passes in production mode.

### modex-gtm gaps

1. Dannon remains the last flagship account that still needs its warm-intro-specific named-person depth.
2. AB InBev and Coca-Cola still have room for more operator-level named-person evidence even after the latest expansion.
3. Fast-follow migration tooling and completeness scoring are still ahead on the roadmap.
4. Some account pages still lean more on role framing than named-person evidence and need cleanup.

### clawd-control-plane strengths worth learning from

1. Strong engagement tracking shape.
2. Strong section reveal and pacing.
3. Strong proposal shell composition.
4. Strong proposal analytics and follow-up mindset.

## Build Order

### Flagship build order

This is the recommended engineering order, not just the account score order.

1. Frito-Lay
2. General Mills
3. AB InBev
4. Coca-Cola
5. Dannon

### Why this order

1. Frito-Lay is the best cold-outbound flagship reference implementation.
2. General Mills already has one of the strongest account narratives.
3. AB InBev has strong enterprise upside but needs deeper variant coverage.
4. Coca-Cola needs better proof choreography more than raw content volume.
5. Dannon is special-case warm intro only and should branch after the core shell is proven.

## Validation Strategy

### Required validation layers

1. `npm run build` after every sprint.
2. Playwright route smoke coverage for flagship microsites.
3. New unit/component tests for client hooks and UI primitives.
4. Manual validation only for copy-review tasks where code tests do not make sense.

### Testing decision

The repo currently has Playwright but no unit/component test harness. Sprint 0 establishes Vitest plus Testing Library so hook, shell, and renderer logic can be validated without relying only on browser E2E tests.

## Sprint 0 - Harness And Contracts

Demoable artifact: the repo has a microsite-specific test harness, fixtures, and tracking contracts ready for implementation.

| ID | Task | Files | Validation |
|---|---|---|---|
| S0-T1 | Add Vitest, jsdom, and React Testing Library configuration | `package.json`, new `vitest.config.ts`, new `tests/setup.ts` | `npx vitest run` passes with a smoke test |
| S0-T2 | Add microsite fixture builders for account page, person page, and sections | new `tests/fixtures/microsites.ts` | Fixture tests compile and render sample sections |
| S0-T3 | Add stable `sectionId` to microsite section types | `src/lib/microsites/schema.ts` | TypeScript compile passes and fixture tests confirm IDs |
| S0-T4 | Add narrative-role support to sections without changing existing data shape semantics | `src/lib/microsites/schema.ts` | Unit tests cover backward compatibility |
| S0-T5 | Create tracking payload schema and shared types | new `src/lib/microsites/tracking.ts` | Unit tests validate accepted and rejected payloads |
| S0-T6 | Add content-migration checklist doc for flagship accounts | new `docs/roadmaps/microsite-content-checklist.md` | Manual review against Frito-Lay and General Mills |

## Sprint 1 - Engagement Tracking Core

Demoable artifact: a visitor can scroll a microsite, switch variants, click a CTA, and persist engagement depth to the database.

| ID | Task | Files | Validation |
|---|---|---|---|
| S1-T1 | Add `MicrositeEngagement` Prisma model for per-session aggregated telemetry | `prisma/schema.prisma` | `npx prisma generate` and schema validation pass |
| S1-T2 | Add tracking route with Zod validation and deduped upsert semantics | new `src/app/api/microsites/track/route.ts`, new `src/lib/validations.ts` entries | Route tests for valid, invalid, and duplicate payloads |
| S1-T3 | Add client hook modeled on `useTracker` from clawd | new `src/components/microsites/use-microsite-tracker.ts` | Hook unit tests for sections viewed, scroll depth, and unload behavior |
| S1-T4 | Add section markers and CTA identifiers to renderer output | `src/components/microsites/sections.tsx` | Renderer tests assert `data-section-id` and CTA tags exist |
| S1-T5 | Bootstrap tracker on account and person routes | `src/app/for/[account]/page.tsx`, `src/app/for/[account]/[person]/page.tsx` | Playwright spec verifies a session row is written after scroll |
| S1-T6 | Add CTA click tracking and variant-switch tracking | same route files plus new client helper | Playwright spec verifies CTA click and variant switch events |
| S1-T7 | Write first microsite telemetry smoke test | new `tests/e2e/microsite-tracking.spec.ts` | Test passes locally against seeded page |

## Sprint 2 - Proposal Shell V1

Demoable artifact: one flagship microsite renders in a premium shell with stronger pacing, a thesis panel, sticky navigation, and a persistent CTA.

| ID | Task | Files | Validation |
|---|---|---|---|
| S2-T1 | Add reusable `Reveal` component inspired by clawd proposal shell | new `src/components/microsites/reveal.tsx` | Component tests for reveal-on-intersection behavior |
| S2-T2 | Add `MicrositeShell` wrapper component | new `src/components/microsites/microsite-shell.tsx` | Component tests for layout states and props |
| S2-T3 | Extend theme system with glow, atmospheric backgrounds, and shell tokens | `src/components/microsites/theme.tsx` | Visual manual review plus build |
| S2-T4 | Add sticky progress nav and sticky mobile CTA footer | `src/components/microsites/microsite-shell.tsx` | Playwright mobile test validates CTA persistence |
| S2-T5 | Migrate account page route to new shell | `src/app/for/[account]/page.tsx` | Build passes and Frito-Lay route renders in shell |
| S2-T6 | Migrate person page route to new shell | `src/app/for/[account]/[person]/page.tsx` | Build passes and variant route renders in shell |
| S2-T7 | Add route smoke test for shell rendering | new `tests/e2e/microsite-shell.spec.ts` | Test asserts hero, nav, CTA, and section flow |

## Sprint 3 - Narrative And Proof Engine

Demoable artifact: proof becomes a first-class narrative system instead of a static metric strip.

| ID | Task | Files | Validation |
|---|---|---|---|
| S3-T1 | Extend proof section schema with optional `proofVisual`, `methodology`, and `liveDeployment` fields | `src/lib/microsites/schema.ts` | Type tests and fixture rendering tests |
| S3-T2 | Add proof visual component primitives for metrics, before/after, and deployment callouts | `src/components/microsites/sections.tsx` | Renderer tests for each proof variant |
| S3-T3 | Add thesis side panel and plan-summary block to shell | `src/components/microsites/microsite-shell.tsx` | Component tests plus manual design review |
| S3-T4 | Add recommended action framing for CTA section | `src/lib/microsites/schema.ts`, `src/components/microsites/sections.tsx` | Unit tests for CTA rendering by mode |
| S3-T5 | Update Frito-Lay content to use new proof primitives | `src/lib/microsites/accounts/frito-lay.ts` | Manual review route plus build |
| S3-T6 | Update General Mills content to use new proof primitives | `src/lib/microsites/accounts/general-mills.ts` | Manual review route plus build |
| S3-T7 | Add regression test for old accounts still rendering with no new fields | fixture tests | Test confirms backward compatibility |

## Sprint 4 - Person Variant V2

Demoable artifact: person pages change by role in a visible, meaningful way.

| ID | Task | Files | Validation |
|---|---|---|---|
| S4-T1 | Extend `PersonVariant` with proof emphasis, CTA mode, and section order overrides | `src/lib/microsites/schema.ts` | Unit tests cover rule resolution |
| S4-T2 | Update rule engine to respect proof ordering and hidden sections | `src/lib/microsites/rules.ts` | Rules tests for executive, ops, and transformation flows |
| S4-T3 | Add variant-aware shell props for thesis and action framing | `src/components/microsites/microsite-shell.tsx` | Component tests for variant modes |
| S4-T4 | Expand Frito-Lay variants to five complete named-person views using documented mandate, language, and proof emphasis | `src/lib/microsites/accounts/frito-lay.ts` | Manual review checklist and build |
| S4-T5 | Expand General Mills variants to five complete named-person views using documented mandate, language, and proof emphasis | `src/lib/microsites/accounts/general-mills.ts` | Manual review checklist and build |
| S4-T6 | Add Dannon warm-intro CTA mode with no direct cold-booking framing | `src/lib/microsites/accounts/dannon.ts`, renderer files | Manual review confirms intro-only route copy |
| S4-T7 | Add Playwright variant-switching spec for flagship accounts | new `tests/e2e/microsite-variants.spec.ts` | Test confirms different copy and CTA states |

### Sprint 4 execution note

For flagship accounts, the standard is now named-person personalization first.

1. Start with the real person record in the account config.
2. Use role-based fallback only where the person record is missing evidence.
3. Treat any generic variant framing as backlog to be replaced with documented research.

## Sprint 5 - Analytics And Operator Surfaces

Demoable artifact: Casey can see which accounts are hot, what sections were read, and which CTA or variant created intent.

| ID | Task | Files | Validation |
|---|---|---|---|
| S5-T1 | Add server-side queries for microsite engagement summaries | new `src/lib/microsites/analytics.ts` | Query tests against seeded data |
| S5-T2 | Add hot-account scoring rules for microsite engagement | same analytics file | Unit tests for score bands |
| S5-T3 | Add microsite analytics sections to the canonical analytics dashboard | `src/app/analytics/page.tsx` and supporting analytics utilities | Playwright smoke test for analytics UI |
| S5-T4 | Add account-level engagement summary block on account detail page | `src/app/accounts/[slug]/page.tsx` | Manual validation using seeded engagement data |
| S5-T5 | Add CTA click events to `Activity` for operator visibility | tracking route plus existing activity creation logic | Integration test confirms activity row on click |
| S5-T6 | Add variant-performance view for flagship accounts | analytics UI files | Manual validation against seeded Frito-Lay variant data |
| S5-T7 | Add exportable microsite engagement CSV | new export handler or existing export route | Manual validation of CSV shape |

## Sprint 6 - Flagship Content Migration

Demoable artifact: five flagship microsites look and behave like the new system, not the legacy shell.

| ID | Task | Files | Validation |
|---|---|---|---|
| S6-T1 | Rebuild Frito-Lay page as the reference flagship | `src/lib/microsites/accounts/frito-lay.ts` | Stakeholder review and route smoke |
| S6-T2 | Rebuild General Mills page on the new shell | `src/lib/microsites/accounts/general-mills.ts` | Stakeholder review and route smoke |
| S6-T3 | Rebuild AB InBev with deeper proof and more variants | `src/lib/microsites/accounts/ab-inbev.ts` | Stakeholder review and route smoke |
| S6-T4 | Rebuild Coca-Cola with bottler-network framing and stronger proof sequencing | `src/lib/microsites/accounts/coca-cola.ts` | Stakeholder review and route smoke |
| S6-T5 | Rebuild Dannon as a warm-intro concierge page | `src/lib/microsites/accounts/dannon.ts` | Stakeholder review and intro-path QA |
| S6-T6 | Add flagship route smoke coverage | Playwright microsite specs | All flagship routes pass |
| S6-T7 | Add flagship completeness score audit | new `scripts/audit-microsites.ts` | Script output confirms all flagship pages meet thresholds |

## Sprint 7 - Fast-Follow Migration Factory

Demoable artifact: the system can scale the new shell and proof model to the next tier without bespoke rebuilds every time.

| ID | Task | Files | Validation |
|---|---|---|---|
| S7-T1 | Add microsite completeness scoring to account configs | `src/lib/microsites/schema.ts`, new audit script | Audit script returns expected scores |
| S7-T2 | Add content lint rules for generic proof, missing stakes, and weak CTA copy | new `scripts/lint-microsite-content.ts` | Lint script fails known-bad fixtures |
| S7-T3 | Create migration checklist template for fast-follow accounts | new `docs/roadmaps/microsite-fast-follow-checklist.md` | Manual review against Diageo |
| S7-T4 | Migrate Diageo and Hormel to the new shell | account files | Manual review and build |
| S7-T5 | Migrate JM Smucker and The Home Depot to the new shell | account files | Manual review and build |
| S7-T6 | Migrate Georgia Pacific as industrial proof point | account file | Manual review and build |
| S7-T7 | Add portfolio gallery route for internal review of best work | new `src/app/for/page.tsx` or review route | Route smoke and stakeholder review |

## Deferred Backlog

These are explicitly out of the initial build sequence.

1. ElevenLabs narration for microsites.
2. Token-authenticated private proposal URLs.
3. Full backend-generated proposal composition.
4. WebGL hero scenes.
5. Live voice follow-up generation.

## Recommended First Implementation Sequence After Approval

1. Sprint 0 in full.
2. Sprint 1 in full.
3. Sprint 2 through S2-T5 only, then review the first Frito-Lay shell.
4. Sprint 3 for Frito-Lay and General Mills only.
5. Resume Sprint 2-S2-T6 and all of Sprint 4.

## Commands To Use During Execution

| Purpose | Command |
|---|---|
| Build | `npm run build` |
| Existing Playwright suite | `npm run test:click` |
| Single Playwright microsite spec | `npx playwright test tests/e2e/microsite-*.spec.ts` |
| Prisma client refresh | `npx prisma generate` |
| Future unit test suite | `npx vitest run` |

## Approved Decisions

1. Sprint 0 adds Vitest and Testing Library now.
2. The flagship build order remains Frito-Lay, General Mills, AB InBev, Coca-Cola, Dannon.
3. Microsite analytics will extend the existing canonical analytics dashboard in `src/app/analytics/page.tsx`.
4. Named-person research beats generic role templates whenever account research exists.
