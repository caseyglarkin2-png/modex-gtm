# Flagship Validation Template

Updated: 2026-04-08
Owner: Casey
Use this record for every flagship design, UX, narration, proof, or export ticket that does not have complete automated coverage.

## Ticket Metadata

- Sprint:
- Ticket ID:
- Ticket title:
- Commit SHA:
- Route family:
- Owner:
- Date:

## Scope Summary

- Goal:
- Why this ticket is atomic:
- Files touched:
- Risks introduced:
- Rollback commit or flag:

## Automated Validation

|Check|Command|Expected Result|Actual Result|Evidence|
|---|---|---|---|---|
|Build|`npm run build`|Pass|-|-|
|Public shareability|`npx playwright test tests/e2e/public-shareability.spec.ts`|Pass|-|-|
|Shell regression|`npx playwright test tests/e2e/microsite-shell.spec.ts`|Pass or N/A|-|-|
|Variant regression|`npx playwright test tests/e2e/microsite-variants.spec.ts`|Pass or N/A|-|-|
|Unit or Vitest coverage|`npm exec vitest run ...`|Pass or N/A|-|-|

Add or remove rows only when a check is clearly not relevant.

## Failure Triage

- If `npm run build` fails: record the first failing file or route, the exact error, and whether rollback is required before more work lands.
- If public-route smoke fails: record the affected path, response status, whether `/api/auth/session` was requested, and whether the failure blocks share-ready status.
- If screenshot or manual QA fails: record the viewport, exact visual break, and whether the issue is layout, copy-fit, motion, or CTA behavior.
- If performance fails: record the budget miss, likely cause, and whether motion, layout, or asset weight introduced the regression.

## Screenshot Artifact Contract

Store artifacts under `screenshots/shareability-audit/<sprint-ticket>/`.

Required naming pattern:

1. `desktop-for-frito-lay.png`
2. `desktop-for-frito-lay-bob-fanslow.png`
3. `desktop-proposal-frito-lay.png`
4. `tablet-for-frito-lay.png`
5. `tablet-proposal-frito-lay.png`
6. `mobile-for-frito-lay.png`
7. `mobile-for-frito-lay-bob-fanslow.png`
8. `mobile-proposal-frito-lay.png`

If the ticket also affects General Mills, include the matching General Mills files in the same folder.

If the ticket changes layout, spacing, hierarchy, or motion, include before and after states where practical.

If the ticket changes share-preview composition, also capture an accepted OG baseline such as `og-for-frito-lay.png` or `og-proposal-frito-lay.png` in the same folder.

## Manual QA Checklist

### Desktop - 1440x1200

- [ ] Hero headline is fully visible with no clipping or awkward wrapping.
- [ ] The page no longer reads like a narrow center column.
- [ ] Proof, ROI, and CTA modules have enough breathing room.
- [ ] No overlapping sticky elements or broken rails.

### Tablet - 768x1024

- [ ] Section order still reads clearly.
- [ ] CTA remains visible and usable.
- [ ] Right rail or stacked modules do not crowd the main story.

### Mobile - 390x844

- [ ] Minimum readable gutter is preserved.
- [ ] Hero copy is readable without horizontal overflow.
- [ ] CTA remains visible or reachable without covering content.
- [ ] No text truncation in proof, ROI, or CTA modules.

### Public Route Safety

- [ ] No `/api/auth/session` requests were introduced on public routes.
- [ ] Overview, named-person, proposal, and OG-image routes still render publicly.
- [ ] Warm-intro-only rules still hold for Dannon when relevant.

OG-image verification:

- [ ] Confirm the relevant `opengraph-image` routes still return `200` for every affected public route family.
- [ ] Confirm the social-preview image still reflects the current flagship shell hierarchy and does not clip key proof or title copy.

### Feature-Gate Coexistence

- [ ] Migrated flagship routes show newly enabled flagship-only features only when intended.
- [ ] Non-migrated routes keep W2 and W3 features disabled by default.
- [ ] Old-shell and new-shell routes can coexist without broken spacing, styling collisions, or missing CTA behavior.

Feature-gate workflow:

- Pick one migrated flagship route family and one non-migrated route family.
- Preferred command: `npx playwright test tests/e2e/public-shareability.spec.ts` plus the narrowest shell or variant smoke relevant to the changed route family.
- Run that smoke or manual route QA and record whether flagship-only features remain absent on the non-migrated route.
- Record any styling collision, missing CTA behavior, or unexpected gated feature visibility before the ticket is considered complete.

Mixed-shell CSS coexistence guardrail:

- Check the migrated route and the non-migrated route for spacing-token drift, panel-width regressions, or class-name collisions that change layout unexpectedly.
- Record whether CTA placement, CTA copy, and CTA reachability stayed consistent across both shells.
- If a new flagship-only class or token appears to affect an old-shell route, treat that as a failure until the collision is removed or explicitly gated.

Worked example record:

- Migrated route checked: `/for/frito-lay`
- Non-migrated route checked: `/for/diageo`
- Test path: `npx playwright test tests/e2e/public-shareability.spec.ts`
- CSS coexistence observation: no spacing-token drift, no panel-width regression, no unexpected class overlap observed.
- CTA observation: both routes preserved visible CTA hierarchy and reachable CTA actions.
- Feature-gate result: narration and interactive proof remained absent on the non-migrated route.
- Pass or fail: pass

### Account Migration Verification

- [ ] Enable `features.flagshipShell` in the target account config under `src/lib/microsites/accounts/*.ts`.
- [ ] Run `npm run build` and confirm no shell, route, or schema regression.
- [ ] Run the narrowest relevant Playwright route smoke for the migrated account plus `tests/e2e/public-shareability.spec.ts`.
- [ ] Capture desktop, tablet, and mobile screenshots for the migrated account route family.
- [ ] Verify the flagship shell is present on the migrated account and absent on a non-migrated comparison account.
- [ ] Verify CTA placement remains reachable and old-shell globals do not override the migrated shell.
- [ ] Release Steward sign-off is recorded before the account is marked migrated.

### Narrative Quality

- [ ] The route feels more premium immediately, not just different.
- [ ] The account proof still reads as specific and credible.
- [ ] The result does not look like a generic SaaS marketing page.

### Accessibility

- [ ] Interactive controls are keyboard reachable and usable with Enter and Escape where relevant.
- [ ] Heading order remains logical and does not skip structural levels without reason.
- [ ] Text, proof cards, and CTA treatments preserve readable contrast.
- [ ] Media, proof modules, and custom controls expose usable labels or descriptive text.
- [ ] Motion-heavy tickets respect reduced-motion preferences.
- [ ] State changes in narration or interactive-proof UI remain understandable to assistive-technology users.

### Optional Ticket-Specific Checks

Use only the subsections that apply to the ticket being validated.

#### Narration

- [ ] Audio playback appears only on routes with narration enabled.
- [ ] Transcript content matches the approved proposal content.
- [ ] Disabled or missing audio falls back to transcript-first behavior without broken controls.
- [ ] Player controls expose clear labels for play, pause, and any speed changes.

#### Interactive Proof

- [ ] Default state, active state, and fallback state all render clearly.
- [ ] The module still communicates the operational consequence without a walkthrough.
- [ ] No-JS or failed-hydration behavior preserves usable proof content.
- [ ] Keyboard and assistive-technology users can still understand the changed state.

#### Export And Board Pack

- [ ] Exported JSON preserves thesis, proof, ROI, scenario assumptions, and appendix fields expected from the live route.
- [ ] Exported HTML preserves the same narrative order and CTA framing as the live route.
- [ ] Appendix blocks retain source context, transcript summary, and state annotations where the ticket requires them.

## Performance Check

- Method: `npx lighthouse`, Chrome DevTools Performance, or equivalent
- Route tested:
- Result summary:
- Target LCP: `<= 2.5s` when motion or shell behavior changed
- CLS observation:
- Target CLS: `<= 0.1`
- Scroll or animation jank observation:

If no motion or performance-sensitive behavior changed, state that explicitly.

## Demo Artifact

- Local run command:
- Routes demonstrated:
- Screenshot folder:
- Before or after note:

## Release Steward Sign-off

- [ ] Validation bundle reviewed
- [ ] Commit is atomic and rollback-safe
- [ ] Public-route behavior preserved
- [ ] Ready to merge or demo

Reviewer:
Notes:

## Example Short Record

- Sprint: Sprint 7B
- Ticket ID: S7B-T1a
- Ticket title: Widen flagship desktop container constants
- Route family: Frito-Lay canonical routes
- Files touched: `src/components/microsites/theme.tsx`
- Rollback commit or flag: `git revert <commit>`
- Screenshot folder: `screenshots/shareability-audit/s7b-t1a/`
- Before or after note: desktop shell widened so proof modules read as premium surfaces rather than stacked brochure cards.

## Example Sprint-Close Bundle

- Sprint: Sprint 7B
- Demo artifact: local `npm run dev` session plus the canonical Frito-Lay public route family and a screenshot pack at desktop, tablet, and mobile sizes.
- Validation bundle: build pass, public shareability pass, shell smoke pass, manual QA checklist completed, screenshot folder present.
- Release steward note: no new auth-session requests, no clipped hero text, and rollback path documented before share-ready sign-off.
