# Flagship Validation Record - Sprint 7B

Updated: 2026-04-08
Owner: Casey

## Ticket Metadata

- Sprint: Sprint 7B
- Ticket ID: S7B-T1a through S7B-T5
- Ticket title: Viewability and shareability polish for the canonical flagship route family
- Commit SHA:
- Route family: Frito-Lay and General Mills canonical overview, named-person, and proposal routes
- Owner: GitHub Copilot
- Date: 2026-04-08

## Scope Summary

- Goal: widen the flagship shell, relax dense desktop caps, keep mobile CTA behavior stable, and make screenshot capture repeatable for shareability review.
- Why this ticket is atomic: this slice stays inside the flagship shell, proposal frame, section wrappers, shell regression coverage, and screenshot workflow without changing account copy or route data models.
- Files touched: `src/components/microsites/theme.tsx`, `src/components/microsites/microsite-shell.tsx`, `src/components/microsites/proposal-brief.tsx`, `src/components/microsites/sections.tsx`, `tests/e2e/microsite-shell.spec.ts`, `tests/e2e/flagship-screenshot.spec.ts`
- Risks introduced: desktop line lengths, mobile CTA reachability, and screenshot stability.
- Rollback commit or flag: `git revert <commit>`

## Automated Validation

|Check|Command|Expected Result|Actual Result|Evidence|
|---|---|---|---|---|
|Build|`npm run build`|Pass|Pass|Local build completed on 2026-04-08|
|Public shareability|`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/public-shareability.spec.ts --reporter=line`|Pass|Pass|Included in the 17-test local Playwright run|
|Shell regression|`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/microsite-shell.spec.ts --reporter=line`|Pass|Pass|Included in the 17-test local Playwright run|
|Screenshot workflow|`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/flagship-screenshot.spec.ts --reporter=line`|Pass|Pass|18 screenshots generated under `screenshots/shareability-audit/s7b-t4/`|

## Failure Triage

- No build failure observed.
- No public-route smoke failure observed.
- No `/api/auth/session` regressions observed in the public shareability pack.
- No screenshot generation failure observed.

## Screenshot Artifact Contract

Artifacts stored under `screenshots/shareability-audit/s7b-t4/`.

Representative files reviewed:

1. `desktop-for-frito-lay.png`
2. `mobile-for-frito-lay-bob-fanslow.png`
3. `desktop-proposal-general-mills.png`

Generated route set includes desktop, tablet, and mobile captures for:

1. `/for/frito-lay`
2. `/for/frito-lay/bob-fanslow`
3. `/proposal/frito-lay`
4. `/for/general-mills`
5. `/for/general-mills/zoe-bracey`
6. `/proposal/general-mills`

## Manual QA Checklist

### Desktop - 1440x1200

- [x] Hero headline is fully visible with no clipping or awkward wrapping.
- [x] The page no longer reads like a narrow center column.
- [x] Proof, ROI, and CTA modules have more breathing room than the pre-Sprint-7B shell.
- [x] No overlapping sticky elements or broken rails were observed in the reviewed desktop screenshots.

### Tablet - 768x1024

- [x] Section order still reads clearly.
- [x] CTA remains visible and usable.
- [x] Right rail or stacked modules do not crowd the main story in reviewed screenshots.

### Mobile - 390x844

- [x] Minimum readable gutter is preserved.
- [x] Hero copy is readable without horizontal overflow.
- [x] CTA remains visible or reachable without covering content.
- [x] No text truncation in proof, ROI, or CTA modules was observed in reviewed screenshots.

### Public Route Safety

- [x] No `/api/auth/session` requests were introduced on public routes.
- [x] Overview, named-person, proposal, and OG-image routes still render publicly.
- [x] Warm-intro-only rules remain unaffected because Dannon routes were not changed in this slice.

### Feature-Gate Coexistence

- [x] No new flagship-only narration or interactive-proof gates were introduced in this slice.
- [x] Existing public shells continue to render without route-access regressions.
- [x] Old-shell and new-shell route coexistence remains acceptable for the currently reviewed flagship surfaces.

### Narrative Quality

- [x] The flagship routes read more deliberate on desktop than the previous narrow-shell state.
- [x] The account proof remains specific and credible.
- [x] The result does not read like a generic SaaS landing page.

## Performance Check

- Method: build plus local Playwright smoke
- Route tested: `/for/frito-lay`, `/for/frito-lay/bob-fanslow`, `/proposal/general-mills`
- Result summary: no new performance or rendering blocker observed in the validation slice.
- Target LCP: `<= 2.5s` when motion or shell behavior changed
- CLS observation: no obvious visual instability observed in reviewed routes.
- Target CLS: `<= 0.1`
- Scroll or animation jank observation: not materially changed in this slice.

## Demo Artifact

- Local run command: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Routes demonstrated: `/for/frito-lay`, `/for/frito-lay/bob-fanslow`, `/proposal/frito-lay`, `/for/general-mills`, `/for/general-mills/zoe-bracey`, `/proposal/general-mills`
- Screenshot folder: `screenshots/shareability-audit/s7b-t4/`
- Before or after note: flagship routes now use a wider frame and roomier dense-section treatment, with reproducible desktop, tablet, and mobile screenshot artifacts.

## Release Steward Sign-off

- [x] Validation bundle reviewed
- [x] Public-route behavior preserved
- [x] Ready to merge or demo
- [ ] Commit is atomic and rollback-safe

Reviewer: GitHub Copilot
Notes: This slice combines the Sprint 7B shell and screenshot workflow tasks into one validated batch. It is green locally and suitable for demo review.