# Detention Clock — design

**Date:** 2026-05-09
**Author:** Casey Larkin (with Claude Opus 4.7)
**Status:** approved by Casey, ready for implementation plan
**Related:** issue #45 (Detention Clock); supersedes #46 (Live Ticker, closed as wrong-register for the memo)

## Goal

Mount a small fixed-position chip on every per-account memo that ticks up the modeled detention cost accruing across the buyer's network while they read. The math is honest (account's facility count × public ATA assumptions), the framing is documentary (observation, not pressure), and the visual treatment fits the memo's controlled aesthetic instead of fighting it.

## Non-goals

- **Real-time data.** The clock is a deterministic function of `mountTime` + `perSecond`. No backend, no fetch, no live feed.
- **Cross-tab persistence.** Each page load resets the clock. Carrying accrued totals across tabs is overengineering for a chip whose point is "while you read."
- **Forced visibility on mobile.** If the chip would crowd touch targets, it shrinks (dollar + dot only) or hides. Mobile users get the memo content first.
- **Per-account tuning of the assumptions.** The 90-min dwell and $100/hr rate are public ATA 2024 yard ops figures — used uniformly across all accounts. If we ever want per-vertical rates (e.g., reefer vs dry van), that's a separate spec.

## Why drop #46 (Live Ticker)

The memo's editorial register is "private analysis, slowed-down, citation-grounded, willing to be wrong out loud." A Bloomberg-style ticker fights that register: busy chrome, fabricated plant codes, urgency theater. F500 ops execs would clock the synthetic data within 10 seconds and trust drops, undermining the citation pact the rest of the memo carefully maintains.

The Detention Clock achieves the same atmospheric goal ("the network feels alive") with honest data — modeled detention exposure scaled to the buyer's actual facility count, sourced to ATA 2024 — and a corner-positioned chip that complements the document instead of overwriting its top edge.

## Architecture

### Three files

```
src/lib/microsites/
└── detention-rate.ts             # pure function + assumptions table

src/components/microsites/
└── detention-clock.tsx           # client component (the chip)

src/app/for/[account]/
└── layout.tsx                    # NEW — wraps the index memo and any
                                  #   future child routes (e.g., person
                                  #   variants), mounts the clock once
                                  #   from server-side data
```

### Math

`detention-rate.ts` exports a constants table plus a pure function:

```ts
export const DETENTION_ASSUMPTIONS = {
  dwellHours: 1.5,           // 90-min average
  dollarsPerHour: 100,       // ATA 2024 yard ops survey
  movesPerFacilityPerDay: 8,
  workdaysPerMonth: 22,
};

export function computeDetentionPerSecond(facilityCount: number): number {
  const { dwellHours, dollarsPerHour, movesPerFacilityPerDay, workdaysPerMonth } = DETENTION_ASSUMPTIONS;
  const monthly = facilityCount * dwellHours * dollarsPerHour * movesPerFacilityPerDay * workdaysPerMonth;
  return monthly / (30 * 86400);
}
```

For Dannon (13 facilities): ~$0.132/sec → ~$11,400/day → ~$343,000/month modeled exposure.

The constants are exported (not inlined) so the assumptions are testable and inspectable. If the source citation needs to change later, it changes in one place.

### Component flow

1. **Server (`layout.tsx`)** reads account data via `getAccountMicrositeData(params.account)`. If `data.network?.facilityCount` is missing OR the account is unknown (notFound case is handled by the page), the layout renders `{children}` only — no clock. Otherwise it computes `perSecond` and renders `<DetentionClock perSecond={perSecond} accentColor={data.theme?.accentColor} />` alongside `{children}`.

2. **Client (`detention-clock.tsx`)** is `"use client"`. Initial state: `accrued = 0`, mountTime captured in `useRef`. A `useEffect` mounts a `setInterval(updateAccrued, 1000)` that recalculates `accrued = (Date.now() - mountTime) × perSecond / 1000` on each tick. Cleans up the interval on unmount. Renders the chip per the visual spec below.

3. **Hydration safety:** server renders the same `$0.00` initial markup the client renders before its first effect tick. There's no DOM mismatch — only the timer is client-only.

### Per-account override and persistence

The clock lives in `layout.tsx`, not the page, so navigating between `/for/[account]` and child routes (current `/for/[account]/[person]` or any future addition) does not unmount-and-remount the clock. The accrued total continues uninterrupted.

## Visual treatment

Matches the memo's color budget — warm cream + ink + hairline + one accent. **No red.** The "live indicator" semiotics use the account accent dot, which is consistent with the contents-rail active marker pattern.

```
┌──────────────────────────────────┐
│ ●  $1,432.18                     │   ← JetBrains Mono, tabular nums
│    modeled detention accrued     │   ← Mona Sans, label gray
│    while reading                 │
│    rate · ATA 2024 yard ops      │   ← Mona Sans, smaller, source line
└──────────────────────────────────┘
```

- Background: `#fffdf7` (slightly warmer than the page cream so it floats above the paper)
- Border: `1px solid #d8d2c2` with a `2px solid var(--memo-accent)` left rule (matches the contents-rail active marker)
- Pulsing dot: 5px, `var(--memo-accent)`, 1.6s pulse with low-opacity peak (subtle, not aggressive)
- Position: `fixed bottom-6 right-6 z-50`
- Width: ~14rem desktop; chip mode (~6.5rem, dollar + dot only) on viewports < 640px
- Typography:
  - Dollar figure: `font-[family-name:var(--font-memo-mono)]`, ~17px, tabular-nums
  - Label and source line: `font-[family-name:var(--font-memo-sans)]`, 11px label / 10px source, color `#8a847b`
- Accessibility: chip is decorative atmosphere, not content. The element carries `aria-hidden="true"` so screen readers skip it — announcing a continuously-changing dollar figure every second would be hostile. Screen-reader users get the same network-cost information from the memo's prose, comparable section, and footnotes.

## Testing

`detention-rate.test.ts` — three cases:
- `computeDetentionPerSecond(13)` returns ~0.132 (within ±0.001 tolerance)
- Linearity: `computeDetentionPerSecond(N) ≈ N × computeDetentionPerSecond(1)`
- `computeDetentionPerSecond(0)` returns 0

`microsite-detention-clock.test.tsx` — four cases:
- Initial render shows `$0.00` and the source line `rate · ATA 2024 yard ops`
- The chip carries `aria-hidden="true"` (decorative atmosphere, not content for screen readers)
- Pulsing dot element exists with the accent CSS variable applied via inline style
- After advancing fake timers by 5 seconds at perSecond=1, the rendered figure shows `$5.00`

The new layout file isn't unit-tested directly — it's a server component that delegates to existing helpers. Coverage comes from a smoke check during PR review (Vercel preview shows the chip on /for/dannon).

## Failure modes

| Case | Behavior |
|---|---|
| Account slug unknown | `notFound()` from the page handler runs first; layout renders into a 404 frame so the clock doesn't appear |
| Account has no `network.facilityCount` | layout renders `{children}` only; no clock element in the DOM |
| Account has `facilityCount: 0` | `perSecond = 0`; chip renders but always shows `$0.00`. Same DOM presence keeps layout stable; we accept the "always zero" reading rather than special-casing |
| Reader leaves the tab open for hours | `accrued` keeps accumulating per `Date.now() - mountTime`. Currency formatter handles up to ~$10M without grief |
| Reduced-motion preference | Pulsing dot animation respects `prefers-reduced-motion: reduce` (animation: none). Accrue still ticks; only the dot pulse stops |

## Decisions made

- **Tone: documentary observer, not subliminal pressure.** Source line is shown ("rate · ATA 2024 yard ops"), framing reads "modeled detention accrued while reading" (observation), not "$X.XX accrued" (loaded).
- **Color: account accent for the dot, not red.** Red would break the memo's color budget and signal alert/error inappropriately.
- **Live indicator: subtle pulse, not throbbing.** Low-opacity peak in a 1.6s cycle, respects `prefers-reduced-motion`.
- **Mount point: layout, not page.** Persists across child route navigation. Requires creating `src/app/for/[account]/layout.tsx`.
- **Math constants: exported, sourced.** `DETENTION_ASSUMPTIONS` is a named export and the source line in the chip cites ATA 2024 yard ops survey.
- **Mobile: shrink, don't hide outright.** A dollar + dot remains useful; the source line and label drop on viewports below 640px.
- **No backend, no fetch.** The clock is fully deterministic from mountTime + perSecond. Rebuild-only changes; no runtime data dependency.

## Out of scope

- Per-vertical rate variants (reefer, food-grade, dry van) — separate spec when needed
- Cross-tab or cross-session persistence — would defeat the "while you read" framing
- Live data from a YardFlow demo backend — V2 if/when we have one
- Editorial style guide (#48) — separate task
