# Microsite ROI Engine Contract

Status: In progress through S7-T3
Created: 2026-04-07
Scope: Flagship microsites first: Frito-Lay, General Mills, AB InBev, Coca-Cola, Dannon

## Purpose

Replace reductive microsite ROI copy with the real YardFlow ROI model, while keeping a single source of truth for math and a separate layer for account-specific research and person-specific framing.

This document captures the contract we can confirm from the live ROI experience today, the integration decision for this repo, and the schema shape needed before formula porting begins.

## Current Baseline

1. The public ROI calculator lives at `https://www.yardflow.ai/roi/` and is not implemented in this repo.
2. Microsites currently hardcode ROI summaries as static `roiLines`, `totalAnnualSavings`, `paybackPeriod`, and `methodology` fields inside account configs.
3. Current overview and person routes render those static fields through the existing section pipeline.
4. The clean integration seam is: account config -> microsite rules resolver -> ROI section renderer.

## Source-Of-Truth Decision

1. Implement a shared, pure TypeScript ROI domain layer inside this repo.
2. Treat the public ROI calculator contract as canonical for inputs, outputs, and display semantics.
3. Do not iframe the public page into microsites.
4. Do not scrape the public page at runtime.
5. Do not maintain a separate "microsite math" fork with different formulas.
6. Microsites should own account-specific assumptions, evidence, and narrative framing.
7. Person variants may change framing, emphasis, and section order, but they may not alter the underlying scenario totals.

## Confirmed Public ROI Contract

The items below are confirmed from the live public page copy and rendered output, not inferred from hidden implementation details.

### Confirmed network inputs

1. Total facilities operated.
2. Facilities that already have a YMS.
3. Facilities that have drop trailers.
4. Average margin per shipment.

The public page also derives three facility archetypes from those counts:

1. Facilities with a YMS.
2. Facilities with drops and no YMS.
3. Facilities without drops.

Example shown publicly:

1. `50 facilities: 25 with YMS, 10 with drops (no YMS), 15 without drops`.

### Confirmed per-archetype assumption inputs

Each archetype exposes editable assumptions on the live page:

1. DC FTE count.
2. DC shifts.
3. Spotter FTE count.
4. Spotter shifts.
5. Shipments per day.
6. Average cycle time.
7. Annual FTE cost.

### Confirmed high-level outputs

The live page renders these summary outputs:

1. Payback on hard savings.
2. Payback on all savings.
3. Net year 1 gain.
4. Cost of inaction per month.
5. Year 1 ROI.

### Confirmed hard-savings outputs

The live page renders hard-savings breakdowns by archetype.

For facilities with a YMS, the rendered comparison includes:

1. YardFlow cost per year.
2. YardFlow savings per year.
3. Core YMS cost per year.
4. Core existing YMS savings.
5. Return multiple.
6. Category lines covering paper, spotter efficiency, detention, and DC labor efficiency cost.

For facilities with drops and no YMS, the rendered view includes:

1. YardFlow cost per year.
2. YardFlow savings per year.
3. Return multiple.
4. Category lines covering paper, spotter efficiency, detention, and DC labor efficiency cost.

For facilities without drops, the rendered view includes:

1. YardFlow cost per year.
2. YardFlow savings per year.
3. Return multiple.
4. Category lines covering paper, drop trailer opportunity, detention, and DC labor efficiency cost.

### Confirmed throughput outputs

The live page renders throughput-value breakdowns by archetype.

Confirmed output families:

1. Facilities with a YMS: YardFlow value vs existing YMS value.
2. Facilities with drops and no YMS: YardFlow value.
3. Facilities without drops: YardFlow value.

Confirmed throughput categories:

1. Base improvement.
2. Driver journey optimization.
3. Systemwide optimization.

### Confirmed total-value outputs

The live page renders a total savings opportunity comparison across all facilities:

1. Total annual value with YardFlow.
2. Total annual value with existing YMS.
3. Value multiple.
4. Category grouping across hard savings, throughput, and standardization opportunity.

### Confirmed export expectation

The public experience supports a board-ready ROI PDF tied to the modeled scenario.

## Contract Items Still Unresolved

These items must be validated from the underlying calculator implementation or source system before formula porting is considered complete.

1. Exact formula constants for subscription cost.
2. Exact labor-savings formulas.
3. Exact detention formulas.
4. Exact throughput value formulas.
5. Exact standardization-opportunity formulas.
6. Exact year-one ROI denominator and presentation rules.
7. Exact export payload contract for the board-ready PDF.

No implementation should invent these values.

## Required Microsite Data Additions

Each flagship account needs an engine-backed ROI profile with:

1. Facility mix by archetype.
2. Average margin per shipment.
3. Per-archetype assumption overrides where the account materially differs from the public defaults.
4. Account-level assumptions tied to research.
5. Source notes with confidence levels: measured, public, estimated, or inferred.

## Render Contract For Microsites

The microsite ROI section should become a render target, not the authoring source of truth.

The render layer needs to support:

1. Existing `roiLines` for legacy accounts.
2. Headline stats for payback, ROI, and cost of inaction.
3. Archetype-level hard-savings and throughput breakdowns.
4. Total value comparison.
5. Source and assumption notes.

## Migration Rules

1. Flagship accounts migrate first.
2. Long-tail accounts remain on the legacy static ROI shape until their assumptions are research-ready.
3. Person-specific routes may reframe the result, but never re-calculate it differently.
4. Public and private ROI outputs must ultimately resolve from the same formula contract.

## Exit Criteria For S7-T1 Through S7-T3

1. The ROI contract is written down in the repo.
2. The source-of-truth integration decision is explicit.
3. The microsite schema can represent engine-backed ROI inputs and outputs without breaking current static microsites.