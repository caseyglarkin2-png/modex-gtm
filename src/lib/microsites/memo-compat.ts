/**
 * Sprint M3.8 — compat adapter from the legacy account data shape into
 * the 5 memo sections used by the YNS Microsite Redesign.
 *
 * The 28 existing account .ts files all carry rich pre-redesign data
 * (network composition, freight profile, urgency signal, ROI archetypes,
 * proof blocks, hero/problem/solution/proof sections in the legacy
 * union) but most still need their .sections[] migrated from the
 * 13-type legacy union to the 5 memo types. This module lets the page
 * handler render a sensible memo-template version *right now*, even
 * for accounts that haven't been hand-authored yet, while M3.7's bulk
 * migration script and M3.2-M3.6's per-account hand-authoring catch up.
 *
 * Behavior:
 *
 *   resolveMemoSections(data)
 *     - If data.sections already contains ≥ 3 native memo-type entries,
 *       return those (the account has been migrated).
 *     - Otherwise generate 5 sections from the underlying data.
 *
 *   isAccountHandTuned(data)
 *     - Source of truth for whether to show the "needs hand-tuning"
 *       banner. False if the account .ts file explicitly sets
 *       needsHandTuning: false (M3.2-M3.6 hand-authored). Otherwise
 *       true (still on the auto-mapped output).
 *
 * The compat adapter is intentionally generic — it doesn't try to be
 * clever per account. The hand-tuning banner is the contract: prospects
 * see honestly that the analysis is generic until a custom version
 * lands.
 */

import type {
  AboutSection,
  AccountMicrositeData,
  ComparableSection,
  MemoMicrositeSection,
  MethodologySection,
  MicrositeSection,
  ObservationSection,
  ProofBlock,
  YnsThesisSection,
} from './schema';

const MEMO_TYPES = new Set<MicrositeSection['type']>([
  'yns-thesis',
  'observation',
  'comparable',
  'methodology',
  'about',
]);

export function isMemoSection(section: MicrositeSection): section is MemoMicrositeSection {
  return MEMO_TYPES.has(section.type);
}

export function isAccountHandTuned(data: AccountMicrositeData): boolean {
  return data.needsHandTuning === false;
}

export function resolveMemoSections(data: AccountMicrositeData): MemoMicrositeSection[] {
  const native = data.sections.filter(isMemoSection);
  if (native.length >= 3) return native;
  return buildMemoSectionsFromAccount(data);
}

// ── Builders ──────────────────────────────────────────────────────────

export function buildMemoSectionsFromAccount(data: AccountMicrositeData): MemoMicrositeSection[] {
  return [
    buildYnsThesis(),
    buildObservation(data),
    buildComparable(data),
    buildMethodology(),
    buildAbout(data),
  ];
}

function buildYnsThesis(): YnsThesisSection {
  return { type: 'yns-thesis' };
}

function buildObservation(data: AccountMicrositeData): ObservationSection {
  const composition: { label: string; value: string }[] = [];

  if (data.network?.facilityCount) {
    composition.push({ label: 'Facility footprint', value: data.network.facilityCount });
  }
  if (data.network?.facilityTypes && data.network.facilityTypes.length > 0) {
    composition.push({
      label: 'Facility types',
      value: data.network.facilityTypes.slice(0, 4).join(' · '),
    });
  }
  if (data.network?.geographicSpread) {
    composition.push({ label: 'Geographic spread', value: data.network.geographicSpread });
  }
  if (data.network?.dailyTrailerMoves) {
    composition.push({ label: 'Daily trailer moves', value: data.network.dailyTrailerMoves });
  }
  if (data.freight?.avgLoadsPerDay) {
    composition.push({ label: 'Avg loads / day', value: data.freight.avgLoadsPerDay });
  }
  if (data.freight?.detentionCost) {
    composition.push({ label: 'Detention exposure', value: data.freight.detentionCost });
  }

  const hypothesis = buildObservationHypothesis(data);

  return {
    type: 'observation',
    headline: `What we observed about ${data.accountName}’s network`,
    composition,
    hypothesis,
    caveat:
      'This is what public data and our research surface. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don’t match what you see internally.',
  };
}

function buildObservationHypothesis(data: AccountMicrositeData): string {
  const segments: string[] = [];

  if (data.signals?.urgencyDriver) {
    segments.push(data.signals.urgencyDriver);
  } else if (data.signals?.supplyChainInitiatives && data.signals.supplyChainInitiatives.length > 0) {
    segments.push(
      `${data.accountName}’s public supply-chain posture is dominated by ${data.signals.supplyChainInitiatives[0]} — initiatives like that compound the cost of an inconsistent yard layer underneath them.`,
    );
  } else {
    segments.push(
      `${data.accountName}’s ${data.network?.facilityCount ?? 'multi-site'} footprint and ${data.freight?.avgLoadsPerDay ?? 'high'} daily load volume put pressure on the yard layer in a way most planning systems can’t see.`,
    );
  }

  segments.push(
    'The bottleneck likely concentrates in the highest-volume facilities — the same plants whose KPIs every other supply-chain initiative depends on. Yard variance there ripples out the furthest.',
  );

  if (data.freight?.specialRequirements && data.freight.specialRequirements.length > 0) {
    segments.push(
      `Add the network’s real complexity — ${data.freight.specialRequirements.slice(0, 2).join(', ')} — and the cost of running each yard differently grows roughly linearly with site count.`,
    );
  }

  return segments.join(' ');
}

function buildComparable(data: AccountMicrositeData): ComparableSection {
  const proof = pickComparableProof(data.proofBlocks);
  const customerName = proof?.quote?.company ?? 'Primo Brands';
  const headline = proof?.headline ?? 'Multi-site network, similar archetype mix to yours.';

  if (proof) {
    return {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: customerName,
      comparableProfile: headline,
      metrics: extractMetricsFromProof(proof),
      timeline: '30-60 days from kickoff to first measurable impact.',
      referenceAvailable: true,
    };
  }

  return {
    type: 'comparable',
    headline: 'What a comparable network did when they closed the same gap',
    comparableName: 'Primo Brands',
    comparableProfile:
      'Multi-site bottling and distribution network, archetype-mix similar to yours, deployed YardFlow as the network-yard standardization layer in 2024-2025.',
    metrics: [
      { label: 'Detention spend', before: 'Pre-deployment baseline', after: '−31% network-wide', delta: 'measured' },
      { label: 'Spotter overtime', before: 'Pre-deployment baseline', after: '−22% network-wide', delta: 'measured' },
      { label: 'Throughput recovery', before: 'Pre-deployment baseline', after: '+1 turn/day on top sites', delta: 'measured' },
    ],
    timeline: '30-60 days from kickoff to first measurable impact.',
    referenceAvailable: true,
  };
}

function pickComparableProof(blocks: ProofBlock[]): ProofBlock | undefined {
  if (!blocks || blocks.length === 0) return undefined;
  return (
    blocks.find((b) => /primo/i.test(b.headline ?? '') || /primo/i.test(b.quote?.company ?? '')) ??
    blocks.find((b) => b.type === 'case-result' || b.type === 'metric') ??
    blocks[0]
  );
}

function extractMetricsFromProof(
  proof: ProofBlock,
): { label: string; before: string; after: string; delta: string }[] {
  if (!proof.stats || proof.stats.length === 0) {
    if (proof.beforeAfter) {
      return [
        {
          label: proof.headline ?? 'Operating outcome',
          before: proof.beforeAfter.before.description,
          after: proof.beforeAfter.after.description,
          delta: 'qualitative',
        },
      ];
    }
    return [
      {
        label: proof.headline ?? 'Operating outcome',
        before: 'Before YardFlow',
        after: 'Operating to a single network standard',
        delta: 'qualitative',
      },
    ];
  }
  return proof.stats.slice(0, 4).map((stat) => ({
    label: stat.label,
    before: stat.context ?? 'Pre-deployment baseline',
    after: stat.value,
    delta: 'measured',
  }));
}

function buildMethodology(): MethodologySection {
  return {
    type: 'methodology',
    headline: 'How this analysis was built',
    sources: [
      {
        id: 'public-network-data',
        source: 'Public network data (10-K filings, DOT registry, FreightWaves SONAR)',
        confidence: 'public',
        detail: 'Plant counts, geographic spread, fleet posture inferred from the most recent public filings and freight observability data.',
      },
      {
        id: 'industry-benchmarks',
        source: 'ATA + Aberdeen industry benchmarks',
        confidence: 'public',
        detail: 'Yard-operations baselines (radio + clipboard prevalence, network variance impact) come from cross-industry studies, not from your specific yards.',
      },
      {
        id: 'primo-q1-2025',
        source: 'Primo Brands operating data (under NDA)',
        confidence: 'measured',
        detail: 'Primo CFO and ops team have shared post-deployment data with us; specific numbers are referenceable in a peer call when relevant.',
      },
    ],
    unknowns: [
      'Your actual detention cost without your TMS data',
      'Your real spotter and DC FTE structure per site',
      'Internal SLAs between plants, DCs, and downstream customers',
      'Exception rates and where the variance concentrates today',
    ],
  };
}

function buildAbout(data: AccountMicrositeData): AboutSection {
  return {
    type: 'about',
    headline: 'About this analysis',
    authorBio:
      'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it’s the same shape of memo we’d circulate internally before sizing a network engagement.',
    authorEmail: 'casey@freightroll.com',
    signOff: `If parts of this read wrong against what you see internally for ${data.accountName}, that’s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts — not necessarily a meeting.`,
  };
}
