# Detention Clock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mount a fixed-position chip on every per-account memo that ticks up modeled detention exposure (account's facility count × public ATA assumptions) while the buyer reads, framed as documentary observation rather than sales pressure.

**Architecture:** A pure-function lib computes per-second accrual from a single facility-count input. A client component takes `perSecond` as a prop, accumulates from `Date.now() - mountTime`, and renders a hairline chip in the bottom-right that matches the memo's color budget (warm cream, accent dot, JetBrains Mono dollar figure, Mona Sans label). The chip mounts in a NEW `src/app/for/[account]/layout.tsx` so it persists across child route navigation without resetting.

**Tech Stack:** React Server Components (server-side data + layout), client component with `useEffect` + `setInterval`, vitest + @testing-library/react with fake timers, Tailwind for the chip styling, CSS keyframes for the subtle pulse.

---

## File Structure

**Create:**
- `src/lib/microsites/detention-rate.ts` — pure formula + `DETENTION_ASSUMPTIONS` constants table
- `src/components/microsites/detention-clock.tsx` — client component (the chip)
- `src/app/for/[account]/layout.tsx` — server layout, mounts the clock once across child routes
- `tests/unit/detention-rate.test.ts`
- `tests/unit/microsite-detention-clock.test.tsx`

**Branch:** `feat/detention-clock`, off latest `main`. Last commit on main is the just-merged audio pipeline (`audio:run` script, `AccountAudioBrief` schema field, etc.).

---

## Task 1: Per-second formula + assumptions

**Files:**
- Create: `src/lib/microsites/detention-rate.ts`
- Test: `tests/unit/detention-rate.test.ts`

- [ ] **Step 1: Branch off main**

Run: `cd /mnt/c/Users/casey/modex-gtm && git checkout main && git pull --ff-only origin main && git checkout -b feat/detention-clock`
Expected: clean working tree, on `feat/detention-clock`.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/detention-rate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DETENTION_ASSUMPTIONS,
  computeDetentionPerSecond,
} from '@/lib/microsites/detention-rate';

describe('DETENTION_ASSUMPTIONS', () => {
  it('exports the public ATA-sourced figures so callers can inspect / cite them', () => {
    expect(DETENTION_ASSUMPTIONS.dwellHours).toBe(1.5);
    expect(DETENTION_ASSUMPTIONS.dollarsPerHour).toBe(100);
    expect(DETENTION_ASSUMPTIONS.movesPerFacilityPerDay).toBe(8);
    expect(DETENTION_ASSUMPTIONS.workdaysPerMonth).toBe(22);
  });
});

describe('computeDetentionPerSecond', () => {
  it('returns ~0.132 for a 13-facility footprint (Dannon-shaped)', () => {
    const perSecond = computeDetentionPerSecond(13);
    expect(perSecond).toBeGreaterThan(0.13);
    expect(perSecond).toBeLessThan(0.14);
  });

  it('scales linearly with facility count', () => {
    const oneFacility = computeDetentionPerSecond(1);
    const tenFacilities = computeDetentionPerSecond(10);
    expect(tenFacilities).toBeCloseTo(oneFacility * 10, 6);
  });

  it('returns 0 when facilityCount is 0 (chip will read $0.00 and tick no further)', () => {
    expect(computeDetentionPerSecond(0)).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/detention-rate.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — `Cannot find module '@/lib/microsites/detention-rate'`.

- [ ] **Step 4: Implement detention-rate.ts**

Create `src/lib/microsites/detention-rate.ts`:

```ts
/**
 * Public ATA-sourced assumptions used to compute modeled detention exposure
 * for the Detention Clock chip. Exported so the chip's source line can cite
 * "rate · ATA 2024 yard ops" and so callers can inspect the figures rather
 * than treat them as magic numbers.
 *
 * If a future spec wants per-vertical rates (reefer vs dry van, etc.), add
 * an overload that accepts an override object — but the default stays the
 * uniform public figure used across all accounts today.
 */
export const DETENTION_ASSUMPTIONS = {
  /** Average dwell per move (hours). 90-min average from the survey. */
  dwellHours: 1.5,
  /** Detention rate ($/hr). ATA 2024 yard ops survey. */
  dollarsPerHour: 100,
  /** Yard moves per facility per workday. */
  movesPerFacilityPerDay: 8,
  /** Working days per month. */
  workdaysPerMonth: 22,
} as const;

/**
 * Modeled detention dollars accruing per second across `facilityCount`
 * facilities, given the public ATA assumptions above.
 *
 *   monthly = facilities × dwellHrs × $/hr × moves/facility-day × workdays/mo
 *   perSecond = monthly / (30 × 86400)
 *
 * For a 13-facility footprint this is ~$0.132/sec → ~$11.4k/day →
 * ~$343k/mo. Linear in facilityCount; returns 0 when facilityCount is 0.
 */
export function computeDetentionPerSecond(facilityCount: number): number {
  const { dwellHours, dollarsPerHour, movesPerFacilityPerDay, workdaysPerMonth } =
    DETENTION_ASSUMPTIONS;
  const monthly =
    facilityCount * dwellHours * dollarsPerHour * movesPerFacilityPerDay * workdaysPerMonth;
  return monthly / (30 * 86400);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json && npx --no-install vitest run tests/unit/detention-rate.test.ts --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: tsc clean, 4/4 passing.

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/detention-rate.ts tests/unit/detention-rate.test.ts
git commit -m "$(cat <<'EOF'
feat(detention): per-second formula + ATA assumptions table

Pure function that converts an account's facility count into modeled
detention dollars accruing per second, using public ATA 2024 yard-ops
figures (90-min dwell, $100/hr, 8 moves/facility-day, 22 workdays/mo).

Constants are a named export so the chip's source line can cite them
and tests can pin the values.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: DetentionClock client component

**Files:**
- Create: `src/components/microsites/detention-clock.tsx`
- Test: `tests/unit/microsite-detention-clock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/microsite-detention-clock.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DetentionClock } from '@/components/microsites/detention-clock';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DetentionClock', () => {
  it('renders the dollar figure starting at $0.00 and the source line citing ATA 2024', () => {
    render(<DetentionClock perSecond={0.132} />);
    expect(screen.getByText('$0.00')).toBeDefined();
    expect(screen.getByText(/rate · ATA 2024 yard ops/i)).toBeDefined();
  });

  it('renders the documentary label "modeled detention accrued while reading"', () => {
    render(<DetentionClock perSecond={0.132} />);
    expect(screen.getByText(/modeled detention accrued/i)).toBeDefined();
  });

  it('marks the chip aria-hidden so screen readers skip the decorative ticker', () => {
    const { container } = render(<DetentionClock perSecond={0.132} />);
    const root = container.querySelector('[data-detention-clock]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-hidden')).toBe('true');
  });

  it('accumulates the dollar figure as fake time advances', () => {
    render(<DetentionClock perSecond={1} />);
    expect(screen.getByText('$0.00')).toBeDefined();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('$5.00')).toBeDefined();
  });

  it('applies the accent color via inline CSS variable on the dot', () => {
    const { container } = render(
      <DetentionClock perSecond={0.132} accentColor="#0E7490" />,
    );
    const dot = container.querySelector('[data-detention-clock-dot]');
    expect(dot).not.toBeNull();
    // The component sets --memo-accent on the wrapper so descendants pick it up.
    const wrapper = container.querySelector('[data-detention-clock]') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--memo-accent')).toBe('#0E7490');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install vitest run tests/unit/microsite-detention-clock.test.tsx --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement detention-clock.tsx**

Create `src/components/microsites/detention-clock.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';

interface DetentionClockProps {
  /** Dollars-per-second from computeDetentionPerSecond(facilityCount). */
  perSecond: number;
  /** Optional account accent override; falls back to inheriting --memo-accent. */
  accentColor?: string;
}

/**
 * Documentary "while you read" chip that shows modeled detention dollars
 * accruing across the account's network. Atmosphere, not pressure — the
 * chip carries `aria-hidden="true"` so screen-reader users skip it (the
 * memo's prose, comparable section, and footnotes already convey the
 * cost story accessibly).
 *
 * Hydration-safe: server renders $0.00 (the same initial state the client
 * begins from). Only the timer is client-only.
 *
 * Lives in the layout, not the page, so navigating between the index
 * memo and child routes (e.g. /for/[account]/[person]) keeps the
 * accrued total continuous.
 */
export function DetentionClock({ perSecond, accentColor }: DetentionClockProps) {
  const mountTimeRef = useRef<number | null>(null);
  const [accrued, setAccrued] = useState(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    const tick = () => {
      const start = mountTimeRef.current;
      if (start === null) return;
      const elapsedMs = Date.now() - start;
      setAccrued((elapsedMs / 1000) * perSecond);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [perSecond]);

  const wrapperStyle: CSSProperties = accentColor
    ? ({ ['--memo-accent']: accentColor } as CSSProperties)
    : {};

  return (
    <div
      data-detention-clock
      aria-hidden="true"
      style={wrapperStyle}
      className={[
        'fixed bottom-6 right-6 z-50 flex items-start gap-2.5',
        'rounded-sm bg-[#fffdf7] px-3 py-2.5',
        'border border-[#d8d2c2] border-l-2',
        'border-l-[color:var(--memo-accent)]',
        'shadow-[0_2px_12px_rgba(40,30,20,0.06)]',
        'sm:px-3.5 sm:py-3',
      ].join(' ')}
    >
      <span
        data-detention-clock-dot
        aria-hidden="true"
        className="mt-1.5 inline-block size-[6px] flex-shrink-0 rounded-full detention-clock-pulse"
        style={{ background: 'var(--memo-accent)' }}
      />
      <div className="flex flex-col leading-tight">
        <span
          className={[
            FONT_MONO,
            'text-[15px] font-medium tabular-nums leading-tight text-[#1a1a1a]',
            'sm:text-[16px]',
          ].join(' ')}
        >
          {formatAccrued(accrued)}
        </span>
        <span
          className={[
            FONT_SANS,
            'mt-0.5 max-w-[12rem] text-[11px] leading-snug text-[#8a847b]',
            'hidden sm:block',
          ].join(' ')}
        >
          modeled detention accrued while reading
        </span>
        <span
          className={[
            FONT_MONO,
            'mt-1 text-[9.5px] uppercase tracking-[0.16em] text-[#a89e8b]',
            'hidden sm:block',
          ].join(' ')}
        >
          rate · ATA 2024 yard ops
        </span>
      </div>
      <DetentionClockStyles />
    </div>
  );
}

/**
 * Inline keyframes for the dot pulse. Honors `prefers-reduced-motion` so
 * users with that preference get a static dot. Scoped via the named class
 * so the rule doesn't leak into the rest of the app.
 */
function DetentionClockStyles() {
  return (
    <style>{`
      @keyframes detention-clock-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .detention-clock-pulse {
        animation: detention-clock-pulse 1.6s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .detention-clock-pulse { animation: none; }
      }
    `}</style>
  );
}

function formatAccrued(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json && npx --no-install vitest run tests/unit/microsite-detention-clock.test.tsx --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: tsc clean, 5/5 passing.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/components/microsites/detention-clock.tsx tests/unit/microsite-detention-clock.test.tsx
git commit -m "$(cat <<'EOF'
feat(detention): client component for the chip

Documentary-observer chip that ticks up modeled detention dollars while
the buyer reads. Fixed bottom-right, hairline border with a 2px accent
left rule (matches the contents-rail active marker), JetBrains Mono
dollar figure with tabular numerals, Mona Sans label and source line,
subtle 1.6s dot pulse that respects prefers-reduced-motion.

aria-hidden="true" — the chip is decorative atmosphere; screen-reader
users get the cost story from the memo's prose and comparable section
without the hostile per-second update churn.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Account-route layout that mounts the clock

**Files:**
- Create: `src/app/for/[account]/layout.tsx`

This task is integration-only — server components that compose existing pieces don't get unit-tested directly; coverage comes from the Vercel preview smoke in Task 4.

- [ ] **Step 1: Confirm the layout doesn't exist yet**

Run: `ls /mnt/c/Users/casey/modex-gtm/src/app/for/\[account\]/layout.tsx 2>&1`
Expected: `No such file or directory`. (If it does exist, STOP and report — that's a surprise we need to handle.)

- [ ] **Step 2: Implement the layout**

Create `src/app/for/[account]/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { computeDetentionPerSecond } from '@/lib/microsites/detention-rate';
import { DetentionClock } from '@/components/microsites/detention-clock';

/**
 * Layout that wraps the per-account memo and any future child routes
 * (e.g. /for/[account]/[person]). Mounts the Detention Clock once so
 * the accrued total is continuous across child route navigation rather
 * than resetting whenever the user clicks into a person variant.
 *
 * If the account slug is unknown OR the account record has no
 * facilityCount, the clock is skipped — we never make up numbers.
 */
export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  const facilityCount = data?.network?.facilityCount;

  return (
    <>
      {children}
      {facilityCount ? (
        <DetentionClock
          perSecond={computeDetentionPerSecond(facilityCount)}
          accentColor={data?.theme?.accentColor}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 3: Run typecheck + the existing unit suite to confirm no regression**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install tsc --noEmit -p tsconfig.json && npx --no-install vitest run tests/unit/microsite-memo-audio-brief.test.tsx tests/unit/microsite-memo-section.test.tsx tests/unit/detention-rate.test.ts tests/unit/microsite-detention-clock.test.tsx --no-file-parallelism --pool=threads --poolOptions.threads.singleThread`
Expected: tsc clean, all tests pass.

- [ ] **Step 4: Smoke-build to make sure Next picks the new layout up**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx --no-install next build --webpack 2>&1 | tail -25`
Expected: build completes without errors. The `/for/[account]` route should still appear in the route summary, now wrapped by a layout.

If this build fails for an environmental reason (e.g., missing env vars), don't block — note it in the report and rely on the Vercel preview build for verification in Task 4.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add 'src/app/for/[account]/layout.tsx'
git commit -m "$(cat <<'EOF'
feat(memo): mount detention clock in /for/[account] layout

New server layout wraps the per-account memo and any future child
routes. When the account has a known facility count, it mounts the
Detention Clock alongside children so the accrued total is continuous
across child route navigation rather than resetting on each new page
inside the same account.

If the account slug is unknown or the record has no facilityCount,
the layout renders children only — the clock never makes up numbers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Push, open PR, verify on preview

- [ ] **Step 1: Push the branch**

Run: `cd /mnt/c/Users/casey/modex-gtm && git push -u origin feat/detention-clock`

- [ ] **Step 2: Open the PR**

Run:
```bash
cd /mnt/c/Users/casey/modex-gtm && gh pr create --title "feat: detention clock — modeled exposure ticker on per-account memo" --body "$(cat <<'EOF'
Implements the design at \`docs/superpowers/specs/2026-05-09-detention-clock-design.md\` (PR pending merge on \`docs/detention-clock\`).

## What ships

- \`src/lib/microsites/detention-rate.ts\` — pure function + \`DETENTION_ASSUMPTIONS\` table sourced to ATA 2024 yard ops
- \`src/components/microsites/detention-clock.tsx\` — client component (the chip)
- \`src/app/for/[account]/layout.tsx\` — NEW layout that mounts the clock once across child routes
- 9 unit tests across detention-rate (4) + detention-clock (5)

## Why this and not the Live Ticker (#46)

The Live Ticker direction was closed after review: synthetic plant codes ('MTN-457 check-in 87m') would have undermined the memo's citation pact with F500 ops execs. The Detention Clock achieves the same atmospheric goal — \"the network feels alive\" — using honest math (account's facility count × public ATA assumptions) and a corner-positioned chip that complements the document instead of overwriting its top edge.

## Test plan

- [ ] CI green on typecheck + unit tests
- [ ] Vercel preview \`/for/dannon\`: chip renders bottom-right, ticks once per second, accent dot pulses subtly, source line cites \"rate · ATA 2024 yard ops\"
- [ ] Vercel preview \`/for/dannon?p=heiko-gerling\`: clock continues from where it was (does NOT reset) when the URL switches to a person variant
- [ ] DevTools mobile viewport (≤640px): chip shrinks — only dollar + dot visible, label and source line hidden
- [ ] DevTools \`prefers-reduced-motion: reduce\`: dot stops pulsing, dollar figure still ticks
- [ ] DevTools accessibility tree: chip carries \`aria-hidden=\"true\"\`, no live-region announcements on each tick
EOF
)"
```

Save the PR URL printed at the end.

- [ ] **Step 3: Snapshot CI status**

Run: `gh pr checks <PR_NUMBER> --repo caseyglarkin2-png/modex-gtm 2>&1 | head -10`

If `typecheck` or `unit-tests` come back FAILED, that's a real issue — report the failure for the orchestrator to address. If still pending, that's expected and the orchestrator can wait.

- [ ] **Step 4: Done**

Pipeline complete. Once CI is green, Casey reviews the Vercel preview against the test-plan checklist and merges if it looks right.

---

## Self-Review

**Spec coverage check:**
- ✓ Math (Section "Math") → Task 1
- ✓ Visual treatment + chip dimensions (Section "Visual treatment") → Task 2
- ✓ Hydration-safe SSR `$0.00` initial state → Task 2 (server renders the same initial markup the client begins from)
- ✓ Mobile shrink (chip mode below 640px) → Task 2 (`hidden sm:block` on the label and source line)
- ✓ Pulse with `prefers-reduced-motion` → Task 2 (`@media` rule in `DetentionClockStyles`)
- ✓ Mount in layout for cross-route persistence → Task 3
- ✓ Skip clock when facilityCount missing → Task 3 (`facilityCount ?` guard)
- ✓ Source citation in the chip — "rate · ATA 2024 yard ops" → Task 2
- ✓ aria-hidden decorative → Task 2 (test + impl)
- ✓ Tests for the formula and the component → Tasks 1 & 2

**Placeholder scan:** No "TBD"/"TODO"/"implement later" in any step. Each step contains either exact code or an exact command + expected output.

**Type consistency:** `DetentionClockProps` (Task 2) takes `perSecond: number` and `accentColor?: string`. The layout (Task 3) calls `<DetentionClock perSecond={...} accentColor={data?.theme?.accentColor} />` — names match. `computeDetentionPerSecond(facilityCount)` (Task 1) returns a number that flows directly into the prop.

**Naming consistency:** `DETENTION_ASSUMPTIONS` (Task 1) constants table is referenced in the chip's source-line text via the human-readable phrase "rate · ATA 2024 yard ops" rather than re-importing the constants — this is by design (the source line is a string, not derived from the table) and acceptable as long as the citation stays accurate. If the assumptions table changes ATA year, the source-line string should be updated to match.

---

## How to use after merge

The clock is automatic. Every account with a `network.facilityCount` field gets a chip on its memo. Accounts without that field get no chip — the clock never makes up numbers.

If you ever want per-vertical rates (reefer, food-grade, dry van, etc.), extend `DETENTION_ASSUMPTIONS` into a function that takes a vertical override and update `layout.tsx` to pass it through. That's a separate spec.
