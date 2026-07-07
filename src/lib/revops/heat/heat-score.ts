/**
 * YardFlow Account Heat Score — the single canonical intent ranking.
 *
 * ONE number per account (0-100) that fuses every signal we have into a live,
 * decaying "who is hot right now" order. It replaces the stale "network vs list"
 * split: TAM-in is the *eligibility denominator* (you must be `yardflow_tam='in'`
 * to score at all), and this blend is the *ranking within it*.
 *
 * Design (Casey deferred the exact shape — this is the recommended one):
 *   heat  = round( base · fitGate )
 *   base  = 100 · (1 - e^(-points / SATURATION_K))   // saturating, never exceeds 100
 *   points= Σ (component_i/100 · maxPoints_i)         // each component 0-100, decayed
 *   fitGate ∈ [0.30 .. 1.00]                          // dock-door / TAM-tier suppression
 *
 * Why a saturating point-sum and not a convex weighted average: account-level
 * signals are SPARSE (only 7 companies carry an intent_score at all), so a
 * plain weighted mean would crush the hottest accounts toward zero when just one
 * strong component fires. The point model lets a single strong first-party signal
 * read genuinely hot, while stacking multiple signals saturates gracefully under
 * 100 (diminishing returns) instead of overflowing.
 *
 * Five components, each squashed to 0-100 (decayed where noted) then given a
 * MAX-POINTS ceiling = its relative weight. Ceilings picked to rank first-party
 * behavior and qualified humans above third-party noise:
 *
 *   intent   55 pts  account-level intent_score (native /for + /demo behavioral
 *                    heat rolled up to the COMPANY). Highest: first-party, on our
 *                    property, high-intent. DECAYED by last_intent_at.
 *   qual     45 pts  rolled-up MQL/SQL density from contacts (yardflow_qual_verdict),
 *                    SPLIT so a stale marketing list cannot dominate the ranking:
 *                      · SQL portion (75% of the ceiling): saturates fast (k=2) and is
 *                        NOT decayed — a sales-qualified human is a durable, high-value
 *                        signal short of a booked meeting.
 *                      · MQL portion (25% of the ceiling): saturates SLOWLY (k=25) so a
 *                        raw MQL count of 20-140 no longer pegs the ceiling, and is
 *                        DECAYED by the list's last sales-activity date (qualLastActivityAt)
 *                        so a big cold historical list ages out instead of ranking hot.
 *                    (Before 2026-07-07 the whole qual component was undecayed and
 *                    MQL-saturating at k=2, so ~20 stale MQLs pegged the full 45 pts and
 *                    cold list-heavy accounts outranked live multi-SQL accounts.)
 *   pounce   30 pts  trigger intelligence (news / X / clawd) — the account is in
 *                    the news for something yard-relevant. DECAYED by last_trigger_at.
 *   deck     25 pts  sales-deck engagement (HubSpot Documents) summed to the
 *                    account. DECAYED by last_viewed — a May open is ~gone by July.
 *   web      25 pts  /for spear-page views over 180d. Lowest-trust (top-of-funnel,
 *                    semi-anonymous); no per-view timestamp, so NOT decayed
 *                    (treated as a slow 180d-window average). SUPPRESSED to 0 when the
 *                    account already carries an account-level intent_score: the native
 *                    /for tracker stamps company intent_score via /api/microsites/track,
 *                    so counting the same /for views again here would double-score one
 *                    behavior through two ceilings. intent_score OWNS /for when present;
 *                    the web component is the fallback for accounts whose /for (or /demo)
 *                    behavior never rolled up to an account intent_score.
 *
 * SATURATION_K = 70: a lone maxed intent signal (55 pts) reads ~54/100; a fully
 * stacked account (180 pts) tops out ~92, leaving headroom so nothing pins at 100.
 *
 * DECAY: reuses the Pounce spine's recency model (src/lib/pounce/ranked.ts):
 *   factor = e^(-ageDays / 14).  14-day half-life-ish so a two-week-old signal is
 *   ~1/e (37%) and a ~two-month-old deck open is ~2% — it fades below a fresh SQL.
 *
 * FIT: reuses the Pounce spine's dock-door weighting concept (src/lib/pounce/fit.ts)
 *   but as a PURE function of numbers (numbers in, no file reads) so it unit-tests.
 *   Dock doors are the best single proxy for "many yards, high freight volume."
 *   A vendor with a tiny yard cannot rank as a hot opportunity no matter how loud
 *   its other signals are — it is multiplicatively suppressed toward the 0.30 floor.
 *
 * TIERS: heat orders *within* a tier; the tier itself is a rule-based cadence
 *   bucket (see classifyTier) so RevOps gets an action label, not just a number.
 */

// ---------------------------------------------------------------------------
// Weights — MAX POINTS per component (its ceiling contribution). Documented
// above. Named + exported so the tests and the dry-run driver read the exact
// same numbers and nobody can drift them.
// ---------------------------------------------------------------------------
export const HEAT_WEIGHTS = {
  intent: 55,
  qual: 45,
  pounce: 30,
  deck: 25,
  web: 25,
} as const;

/**
 * How the 45-pt qual ceiling splits between the durable SQL signal and the
 * decayable MQL signal. SQL carries most of the weight (a sales-qualified human
 * is the strongest short-of-meeting signal); MQL is a light top-up that a big
 * stale list cannot use to dominate the board. Fractions sum to 1.
 */
export const QUAL_SPLIT = { sql: 0.75, mql: 0.25 } as const;
/** SQL saturation: 1 SQL ~39, 2 ~63, 4 ~86 of the SQL sub-ceiling. Fast. */
export const K_SQL = 2;
/** MQL saturation: SLOW, so a raw MQL count of 20-140 does not peg its sub-ceiling. */
export const K_MQL = 25;

/** Saturation constant for base = 100·(1 - e^(-points/K)). See header. */
export const SATURATION_K = 70;

export const HALFLIFE_DAYS = 14; // mirrors src/lib/pounce/ranked.ts
export const FULL_FIT_DOCKS = 2000; // mirrors src/lib/pounce/fit.ts calibration
const FIT_FLOOR = 0.3; // worst-fit multiplier (tiny-yard vendor), not 0 so a true signal still surfaces a little
const FRESH_POUNCE_DAYS = 21; // a trigger newer than this counts as "fresh" for Tier-1

export type HeatTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

/** Raw signals for one account. The driver assembles these from HubSpot + CSV + seeds. */
export interface HeatSignals {
  // identity (passthrough for the report; not used in math)
  name?: string;
  domain?: string;
  slug?: string;

  // eligibility
  tam: string; // must be 'in' to score
  tamTier?: string; // 'A' | 'B' | 'C' | ''
  dockDoors?: number; // audited yard footprint; drives fit
  /**
   * True when the audited pack is a KNOWN-PARTIAL sample of a much larger real
   * footprint (e.g. PepsiCo's pack is a 30-site satellite sample, not the whole
   * network). Such an account's true dock-door count is far above what the pack
   * shows, so fit must not be dragged below full for a footprint we know we
   * under-audited. When set, fit is not penalized for a sub-FULL_FIT_DOCKS pack.
   */
  partialPack?: boolean;

  // component: intent (account-level, behavioral, decayed)
  intentScore?: number; // 0-100 raw HubSpot company intent_score
  lastIntentAt?: string | number | Date | null;

  // component: qualification density (rolled up from contacts)
  sqlCount?: number;
  mqlCount?: number;
  /**
   * Most-recent sales-activity date across this account's MQL contacts
   * (max hs_last_sales_activity_timestamp). Decays the MQL portion of qual so a
   * big COLD historical list ages out. Missing => no decay (structural cap still
   * keeps MQL from dominating). Does NOT decay the SQL portion.
   */
  qualLastActivityAt?: string | number | Date | null;

  // component: pounce trigger heat (decayed)
  pounceScore?: number; // 0-100 normalized trigger heat
  lastTriggerAt?: string | number | Date | null;

  // component: deck engagement (decayed)
  deckViews?: number;
  deckVisitors?: number;
  deckLastViewedAt?: string | number | Date | null;

  // component: web /for engagement (not decayed — 180d window)
  forViews?: number;
}

export interface HeatComponent {
  /** decayed, normalized 0-100 value that drives this component's points */
  value: number;
  /** the pre-decay normalized 0-100 value (for the report / tiering) */
  raw: number;
  /** recency multiplier applied (1 for non-decayed components) */
  decay: number;
  /** max-points ceiling for this component (from HEAT_WEIGHTS) */
  weight: number;
  /** value/100 · weight — this component's points into the saturating sum */
  contribution: number;
}

export interface HeatResult {
  heat: number; // 0-100
  tier: HeatTier;
  cadence: string;
  fit: number; // 0.30 .. 1.00 multiplier
  points: number; // Σ component points (pre-saturation)
  base: number; // saturated 0-100, pre-fit
  reason: string; // which tier rule fired
  breakdown: Record<keyof typeof HEAT_WEIGHTS, HeatComponent>;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));

/** e^(-ageDays/14). Reuses the Pounce recency model. Missing timestamp => no decay (1). */
export function decayFactor(at: string | number | Date | null | undefined, nowMs = Date.now()): number {
  if (at === null || at === undefined || at === '') return 1;
  const ms = toMs(at);
  if (ms === null) return 1;
  const ageDays = Math.max(0, (nowMs - ms) / 86_400_000);
  return Math.exp(-ageDays / HALFLIFE_DAYS);
}

function toMs(at: string | number | Date): number | null {
  if (at instanceof Date) return at.getTime();
  if (typeof at === 'number') return at; // epoch ms
  const s = at.trim();
  if (/^\d{10,}$/.test(s)) return parseInt(s, 10); // epoch ms string (HubSpot datetime)
  // "2026-05-12 20:07" (UTC, from the deck CSV) or ISO
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) ? s.replace(' ', 'T') + ':00Z' : s;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Saturating squash to 0-100: 1 - e^(-x/k). Diminishing returns, never exceeds 100. */
function saturate(x: number, k: number): number {
  if (x <= 0) return 0;
  return clamp(100 * (1 - Math.exp(-x / k)));
}

/**
 * Fit multiplier from audited dock doors, falling back to TAM tier when the
 * account has no audited pack. Range [FIT_FLOOR .. 1.0]. Pure — numbers in.
 *
 * `partialPack` = the audited dock count is a known-partial sample of a bigger
 * real footprint; in that case we do not penalize fit for the sub-FULL count
 * (norm = 1 → fit = 1.0), because the true footprint is above the audit.
 */
export function fitMultiplier(dockDoors?: number, tamTier?: string, partialPack?: boolean): number {
  let norm: number;
  if (partialPack) {
    norm = 1; // known-undercounted footprint — do not penalize fit for the partial audit
  } else if (dockDoors && dockDoors > 0) {
    norm = Math.min(1, dockDoors / FULL_FIT_DOCKS);
  } else {
    // no audited footprint — infer from tier so we neither reward nor annihilate
    const t = (tamTier || '').toUpperCase();
    norm = t === 'A' ? 0.85 : t === 'B' ? 0.55 : t === 'C' ? 0.35 : 0.2;
  }
  return Math.round((FIT_FLOOR + (1 - FIT_FLOOR) * norm) * 100) / 100;
}

// ---------------------------------------------------------------------------
// component normalizers (each returns pre-decay 0-100)
// ---------------------------------------------------------------------------
function intentRaw(s: HeatSignals): number {
  return clamp(s.intentScore ?? 0);
}

/**
 * Qual value 0-100, SQL and MQL scored separately so a stale marketing list
 * cannot dominate. SQL saturates fast (k=2) and is durable (never decayed); MQL
 * saturates slowly (k=25, so 20-140 does not peg it) and is decayed by the
 * list's last sales-activity date. Blended by QUAL_SPLIT. Already carries its
 * own decay, so heatScore feeds it into mk() WITHOUT a further decay factor.
 */
function qualValue(s: HeatSignals, nowMs: number): number {
  const sqlPart = saturate(s.sqlCount ?? 0, K_SQL); // undecayed, durable
  const mqlDecay = decayFactor(s.qualLastActivityAt, nowMs); // 1 when no timestamp
  const mqlPart = saturate(s.mqlCount ?? 0, K_MQL) * mqlDecay; // aged
  return clamp(QUAL_SPLIT.sql * sqlPart + QUAL_SPLIT.mql * mqlPart);
}

function pounceRaw(s: HeatSignals): number {
  return clamp(s.pounceScore ?? 0);
}

/** Deck: views + 1.5·visitors (multiple humans at the account is the stronger tell). k=12. */
function deckRaw(s: HeatSignals): number {
  const x = (s.deckViews ?? 0) + (s.deckVisitors ?? 0) * 1.5;
  return saturate(x, 12);
}

/** /for views over 180d. k=30 => crowley(73)->91, dannon(37)->71, pepsico(4)->12. */
function webRaw(s: HeatSignals): number {
  return saturate(s.forViews ?? 0, 30);
}

// ---------------------------------------------------------------------------
// tiering — rule-based cadence buckets; heat orders WITHIN a tier.
// ---------------------------------------------------------------------------
const CADENCE: Record<HeatTier, string> = {
  tier1: 'Pounce — same-day, multi-thread, personalized to the live signal',
  tier2: 'Warm — 3-touch reference sequence within 48h',
  tier3: 'Cold ABM — value-led opener, qualified but unengaged',
  tier4: 'Nurture — quarterly light-touch',
};

interface TierDecision {
  tier: HeatTier;
  reason: string;
}

export function classifyTier(s: HeatSignals, b: Record<keyof typeof HEAT_WEIGHTS, HeatComponent>): TierDecision {
  const intent = (s.intentScore ?? 0) > 0;
  const freshPounce =
    (s.pounceScore ?? 0) > 0 && decayFactor(s.lastTriggerAt) >= Math.exp(-FRESH_POUNCE_DAYS / HALFLIFE_DAYS);
  const sql = (s.sqlCount ?? 0) >= 1;
  const mql = (s.mqlCount ?? 0) >= 1;
  const deckEngaged = (s.deckViews ?? 0) > 0 || (s.deckVisitors ?? 0) > 0;
  const webEngaged = (s.forViews ?? 0) > 0;
  const tierA = (s.tamTier || '').toUpperCase() === 'A' || (s.tamTier || '').toUpperCase() === 'B';

  // Tier 1 — live intent: on-property behavior, a fresh trigger, or a qualified human.
  if (intent || freshPounce || sql) {
    const bits: string[] = [];
    if (intent) bits.push(`intent_score ${s.intentScore}`);
    if (freshPounce) bits.push('fresh pounce trigger');
    if (sql) bits.push(`${s.sqlCount} SQL`);
    return { tier: 'tier1', reason: `Live intent: ${bits.join(' + ')}` };
  }
  // Tier 2 — engaged: touched the deck or a /for page but no live-intent signal.
  if (deckEngaged || webEngaged) {
    const bits: string[] = [];
    if (deckEngaged) bits.push(`deck ${s.deckViews ?? 0} views / ${s.deckVisitors ?? 0} people`);
    if (webEngaged) bits.push(`${s.forViews} /for views`);
    return { tier: 'tier2', reason: `Engaged: ${bits.join(' + ')}` };
  }
  // Tier 3 — qualified-cold: strong-tier TAM with an MQL but zero engagement.
  if (tierA && mql) {
    return { tier: 'tier3', reason: `Qualified-cold: Tier-${(s.tamTier || '').toUpperCase()} TAM + ${s.mqlCount} MQL, no engagement` };
  }
  // Tier 4 — the rest of the TAM.
  void b;
  return { tier: 'tier4', reason: 'TAM-in, no current signal' };
}

// ---------------------------------------------------------------------------
// the score
// ---------------------------------------------------------------------------
export function heatScore(signals: HeatSignals, nowMs = Date.now()): HeatResult {
  const mk = (raw: number, weightKey: keyof typeof HEAT_WEIGHTS, decayAt?: HeatSignals[keyof HeatSignals]): HeatComponent => {
    const decay = decayAt === undefined ? 1 : decayFactor(decayAt as string | number | Date | null, nowMs);
    const value = clamp(raw * decay);
    const weight = HEAT_WEIGHTS[weightKey]; // max points
    const contribution = (value / 100) * weight; // points contributed
    return {
      raw: Math.round(raw * 10) / 10,
      decay: Math.round(decay * 1000) / 1000,
      value: Math.round(value * 10) / 10,
      weight,
      contribution: Math.round(contribution * 100) / 100,
    };
  };

  const breakdown = {
    intent: mk(intentRaw(signals), 'intent', signals.lastIntentAt),
    qual: mk(qualValue(signals, nowMs), 'qual'), // decay is baked into qualValue (SQL durable, MQL aged)
    pounce: mk(pounceRaw(signals), 'pounce', signals.lastTriggerAt),
    deck: mk(deckRaw(signals), 'deck', signals.deckLastViewedAt),
    web: mk(webRaw(signals), 'web'), // not decayed (no per-view timestamp)
  } as Record<keyof typeof HEAT_WEIGHTS, HeatComponent>;

  // De-dupe /for behavior: when an account already carries an account-level
  // intent_score, the native /for tracker stamped it via /api/microsites/track,
  // so the same /for views are already scored through the 55-pt intent ceiling.
  // Suppress the 25-pt web component here so one behavior is not double-counted.
  // intent_score OWNS /for when present; web is the fallback otherwise.
  if ((signals.intentScore ?? 0) > 0) {
    breakdown.web = { ...breakdown.web, value: 0, contribution: 0 };
  }

  const points =
    breakdown.intent.contribution +
    breakdown.qual.contribution +
    breakdown.pounce.contribution +
    breakdown.deck.contribution +
    breakdown.web.contribution;

  const base = 100 * (1 - Math.exp(-points / SATURATION_K));
  const fit = fitMultiplier(signals.dockDoors, signals.tamTier, signals.partialPack);
  const heat = clamp(Math.round(base * fit));

  const { tier, reason } = classifyTier(signals, breakdown);

  return {
    heat,
    tier,
    cadence: CADENCE[tier],
    fit,
    points: Math.round(points * 10) / 10,
    base: Math.round(base * 10) / 10,
    reason,
    breakdown,
  };
}

/** Map a tier to its integer for HubSpot's `yardflow_heat_tier` enum (1..4). */
export function tierNumber(tier: HeatTier): number {
  return { tier1: 1, tier2: 2, tier3: 3, tier4: 4 }[tier];
}
