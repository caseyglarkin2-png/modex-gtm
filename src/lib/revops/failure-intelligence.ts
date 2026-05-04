export const FAILURE_CLASSES = [
  'invalid-email',
  'domain-reject',
  'provider-throttle',
  'policy-block',
  'unknown',
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];

export type FailureSignal = {
  id: string;
  accountName: string;
  occurredAt: Date;
  errorMessage?: string | null;
};

export type FailureCluster = {
  className: FailureClass;
  count: number;
  examples: string[];
};

export type RetryRecommendation = {
  className: FailureClass;
  recommended: 'retry-now' | 'retry-later' | 'no-retry';
  recoveryRate: number;
  rationale: string;
};

const CLASS_HINTS: Array<{ className: FailureClass; hints: RegExp[] }> = [
  {
    className: 'invalid-email',
    hints: [/mailbox/i, /unknown user/i, /does not exist/i, /invalid recipient/i, /no such user/i],
  },
  {
    className: 'domain-reject',
    hints: [/blocked/i, /rejected/i, /denied/i, /spam/i, /policy violation/i, /not accepted/i],
  },
  {
    className: 'provider-throttle',
    hints: [/429/i, /rate limit/i, /throttle/i, /too many requests/i, /temporar/i],
  },
  {
    className: 'policy-block',
    hints: [/readiness floor/i, /checklist policy/i, /approval required/i, /outside configured timezone/i, /domain cap exceeded/i],
  },
];

const RECOVERY_RATE_BY_CLASS: Record<FailureClass, number> = {
  'invalid-email': 0.05,
  'domain-reject': 0.18,
  'provider-throttle': 0.66,
  'policy-block': 0.42,
  unknown: 0.24,
};

export function classifyFailure(errorMessage?: string | null): FailureClass {
  const message = errorMessage?.trim() ?? '';
  if (!message) return 'unknown';
  for (const matcher of CLASS_HINTS) {
    if (matcher.hints.some((hint) => hint.test(message))) return matcher.className;
  }
  return 'unknown';
}

export function buildFailureClusters(signals: FailureSignal[]): FailureCluster[] {
  const grouped = signals.reduce<Record<FailureClass, FailureSignal[]>>((acc, signal) => {
    const className = classifyFailure(signal.errorMessage);
    if (!acc[className]) acc[className] = [];
    acc[className].push(signal);
    return acc;
  }, {
    'invalid-email': [],
    'domain-reject': [],
    'provider-throttle': [],
    'policy-block': [],
    unknown: [],
  });

  return FAILURE_CLASSES.map((className) => ({
    className,
    count: grouped[className].length,
    examples: grouped[className]
      .slice(0, 3)
      .map((entry) => entry.errorMessage?.trim() || `${entry.accountName} failure`),
  }))
    .filter((cluster) => cluster.count > 0)
    .sort((left, right) => right.count - left.count);
}

export function recommendRetryForClass(className: FailureClass): RetryRecommendation {
  const recoveryRate = RECOVERY_RATE_BY_CLASS[className];
  if (className === 'provider-throttle') {
    return {
      className,
      recommended: 'retry-later',
      recoveryRate,
      rationale: 'Throttle errors recover well after backoff.',
    };
  }
  if (className === 'policy-block') {
    return {
      className,
      recommended: 'retry-later',
      recoveryRate,
      rationale: 'Policy blocks need remediation, then retry.',
    };
  }
  if (className === 'invalid-email') {
    return {
      className,
      recommended: 'no-retry',
      recoveryRate,
      rationale: 'Invalid addresses have low recovery and should be corrected first.',
    };
  }
  if (className === 'domain-reject') {
    return {
      className,
      recommended: 'retry-later',
      recoveryRate,
      rationale: 'Domain-level rejections sometimes recover with altered timing/content.',
    };
  }
  return {
    className,
    recommended: recoveryRate >= 0.4 ? 'retry-later' : 'retry-now',
    recoveryRate,
    rationale: 'Unknown failures need controlled retry to learn recoverability.',
  };
}

export function buildRetryRecommendations(signals: FailureSignal[]): RetryRecommendation[] {
  const classes = new Set(signals.map((signal) => classifyFailure(signal.errorMessage)));
  return Array.from(classes)
    .map((className) => recommendRetryForClass(className))
    .sort((left, right) => right.recoveryRate - left.recoveryRate);
}

export type WeeklyFailureTrendPoint = {
  weekStartIso: string;
  total: number;
};

export function buildWeeklyFailureTrend(
  rows: Array<{ occurredAt: Date; errorMessage?: string | null }>,
  weeks = 8,
  now = new Date(),
): WeeklyFailureTrendPoint[] {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const currentWeekStart = new Date(now);
  currentWeekStart.setUTCHours(0, 0, 0, 0);
  const day = currentWeekStart.getUTCDay();
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - ((day + 6) % 7));

  const points: WeeklyFailureTrendPoint[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const bucketStart = new Date(currentWeekStart.getTime() - i * weekMs);
    const bucketEnd = new Date(bucketStart.getTime() + weekMs);
    points.push({
      weekStartIso: bucketStart.toISOString().slice(0, 10),
      total: rows.filter((row) => row.occurredAt >= bucketStart && row.occurredAt < bucketEnd).length,
    });
  }
  return points;
}
