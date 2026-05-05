export type FreshnessState = 'fresh' | 'aging' | 'stale' | 'never_refreshed';

export type FreshnessDimensionKey = 'summary' | 'signals' | 'contacts' | 'generated_content';

export type FreshnessDimension = {
  key: FreshnessDimensionKey;
  label: string;
  status: FreshnessState;
  stale: boolean;
  source: 'live' | 'cache' | 'local';
  fetchedAt: string | null;
  updatedAt: string | null;
  ageHours: number | null;
  note: string;
};

export type AgentActionFreshness = {
  fetchedAt: string;
  stale: boolean;
  source: 'live' | 'cache';
  status: FreshnessState;
  dimensions: Record<FreshnessDimensionKey, FreshnessDimension>;
};

type PartialAgentActionFreshness = Omit<Partial<AgentActionFreshness>, 'dimensions'> & {
  dimensions?: Partial<Record<FreshnessDimensionKey, FreshnessDimension>>;
};

const FRESHNESS_DIMENSION_LABELS: Record<FreshnessDimensionKey, string> = {
  summary: 'Research summary',
  signals: 'Signals',
  contacts: 'Contacts',
  generated_content: 'Generated content',
};

function getDefaultDimensionSource(
  key: FreshnessDimensionKey,
  source: AgentActionFreshness['source'],
): FreshnessDimension['source'] {
  if (key === 'summary' || key === 'signals') {
    return source === 'cache' ? 'cache' : 'live';
  }
  return 'local';
}

type FreshnessDimensionInput = {
  key: FreshnessDimensionKey;
  label: string;
  updatedAt?: Date | string | null;
  fetchedAt?: Date | string | null;
  source?: FreshnessDimension['source'];
  thresholds?: {
    freshHours: number;
    agingHours: number;
  };
  notes?: Partial<Record<FreshnessState, string>>;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return null;
  const normalized = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(normalized.getTime())) return null;
  return normalized.toISOString();
}

function getAgeHours(updatedAt: string | null) {
  if (!updatedAt) return null;
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  if (Number.isNaN(diffMs)) return null;
  return Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
}

export function resolveFreshnessState(
  updatedAt: Date | string | null | undefined,
  thresholds: { freshHours: number; agingHours: number } = { freshHours: 24, agingHours: 72 },
): FreshnessState {
  const iso = toIsoString(updatedAt);
  if (!iso) return 'never_refreshed';
  const ageHours = getAgeHours(iso);
  if (ageHours === null) return 'never_refreshed';
  if (ageHours <= thresholds.freshHours) return 'fresh';
  if (ageHours <= thresholds.agingHours) return 'aging';
  return 'stale';
}

export function buildFreshnessDimension(input: FreshnessDimensionInput): FreshnessDimension {
  const updatedAt = toIsoString(input.updatedAt);
  const fetchedAt = toIsoString(input.fetchedAt);
  const status = resolveFreshnessState(updatedAt, input.thresholds);
  const ageHours = getAgeHours(updatedAt);
  const defaultNotes: Record<FreshnessState, string> = {
    fresh: `${input.label} is current enough to use as-is.`,
    aging: `${input.label} is aging. Refresh soon before broadening the motion.`,
    stale: `${input.label} is stale. Refresh before generating or sending.`,
    never_refreshed: `${input.label} has not been refreshed yet.`,
  };

  return {
    key: input.key,
    label: input.label,
    status,
    stale: status === 'stale' || status === 'never_refreshed',
    source: input.source ?? 'local',
    fetchedAt,
    updatedAt,
    ageHours,
    note: input.notes?.[status] ?? defaultNotes[status],
  };
}

export function buildAgentActionFreshness(input: {
  fetchedAt?: Date | string | null;
  source?: 'live' | 'cache';
  dimensions: Record<FreshnessDimensionKey, FreshnessDimension>;
}): AgentActionFreshness {
  const fetchedAt = toIsoString(input.fetchedAt) ?? new Date().toISOString();
  const dimensions = input.dimensions;
  const states = Object.values(dimensions).map((dimension) => dimension.status);
  const status = states.includes('stale')
    ? 'stale'
    : states.includes('never_refreshed')
      ? 'never_refreshed'
      : states.includes('aging')
        ? 'aging'
        : 'fresh';

  return {
    fetchedAt,
    stale: status === 'stale' || status === 'never_refreshed',
    source: input.source ?? 'live',
    status,
    dimensions,
  };
}

export function normalizeAgentActionFreshness(
  freshness: PartialAgentActionFreshness | null | undefined,
): AgentActionFreshness {
  const fetchedAt = toIsoString(freshness?.fetchedAt ?? null) ?? new Date().toISOString();
  const source = freshness?.source === 'cache' ? 'cache' : 'live';
  const rawDimensions: Partial<Record<FreshnessDimensionKey, FreshnessDimension>> = freshness?.dimensions ?? {};

  return buildAgentActionFreshness({
    fetchedAt,
    source,
    dimensions: {
      summary: buildFreshnessDimension({
        key: 'summary',
        label: FRESHNESS_DIMENSION_LABELS.summary,
        updatedAt: rawDimensions.summary?.updatedAt ?? null,
        fetchedAt: rawDimensions.summary?.fetchedAt ?? fetchedAt,
        source: rawDimensions.summary?.source ?? getDefaultDimensionSource('summary', source),
      }),
      signals: buildFreshnessDimension({
        key: 'signals',
        label: FRESHNESS_DIMENSION_LABELS.signals,
        updatedAt: rawDimensions.signals?.updatedAt ?? null,
        fetchedAt: rawDimensions.signals?.fetchedAt ?? fetchedAt,
        source: rawDimensions.signals?.source ?? getDefaultDimensionSource('signals', source),
      }),
      contacts: buildFreshnessDimension({
        key: 'contacts',
        label: FRESHNESS_DIMENSION_LABELS.contacts,
        updatedAt: rawDimensions.contacts?.updatedAt ?? null,
        fetchedAt: rawDimensions.contacts?.fetchedAt ?? fetchedAt,
        source: rawDimensions.contacts?.source ?? getDefaultDimensionSource('contacts', source),
      }),
      generated_content: buildFreshnessDimension({
        key: 'generated_content',
        label: FRESHNESS_DIMENSION_LABELS.generated_content,
        updatedAt: rawDimensions.generated_content?.updatedAt ?? null,
        fetchedAt: rawDimensions.generated_content?.fetchedAt ?? fetchedAt,
        source: rawDimensions.generated_content?.source ?? getDefaultDimensionSource('generated_content', source),
      }),
    },
  });
}

export function createDefaultAgentActionFreshness(fetchedAt?: Date | string | null): AgentActionFreshness {
  const normalizedFetchedAt = toIsoString(fetchedAt) ?? new Date().toISOString();
  return normalizeAgentActionFreshness({
    fetchedAt: normalizedFetchedAt,
    source: 'live',
  });
}

export function summarizeFreshness(freshness: AgentActionFreshness | null) {
  if (!freshness) {
    return {
      status: 'never_refreshed' as FreshnessState,
      label: 'Never refreshed',
      guidance: 'Refresh research before generating or sending.',
    };
  }

  switch (freshness.status) {
    case 'fresh':
      return {
        status: freshness.status,
        label: 'Fresh',
        guidance: 'Current context is usable for generation and first-touch send.',
      };
    case 'aging':
      return {
        status: freshness.status,
        label: 'Aging',
        guidance: 'Refresh soon so signals and committee coverage stay trustworthy.',
      };
    case 'stale':
      return {
        status: freshness.status,
        label: 'Stale',
        guidance: 'Refresh before generating or sending new outreach.',
      };
    case 'never_refreshed':
    default:
      return {
        status: 'never_refreshed' as FreshnessState,
        label: 'Never refreshed',
        guidance: 'No live refresh has been captured yet. Pull research now.',
      };
  }
}
