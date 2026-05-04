export type ContentStudioTabId = 'generate' | 'library' | 'queue' | 'send-readiness' | 'playbook' | 'asset-types';

export type ContentStudioTab = {
  id: ContentStudioTabId;
  label: string;
  purpose: string;
};

export type ContentAssetTypeId =
  | 'generated-content'
  | 'generation-job'
  | 'brief'
  | 'search-string'
  | 'intel'
  | 'audit-route'
  | 'qr'
  | 'microsite'
  | 'proposal';

export type ContentAssetType = {
  id: ContentAssetTypeId;
  label: string;
  owner: 'Content Studio';
  canonicalTab: ContentStudioTabId;
  legacyRoutes: string[];
  routeBehavior: string;
  statusBehavior: string;
};

export type ContentAssetSourceCounts = {
  generated: number;
  generationJobs: number;
  briefs: number;
  searchStrings: number;
  intel: number;
  auditRoutes: number;
  qrAssets: number;
  microsites: number;
  proposals: number;
};

export type ContentStudioSummary = ContentAssetSourceCounts & {
  totalAssets: number;
  sendReadyGenerated: number;
  reviewRequiredGenerated: number;
  failedJobs: number;
};

export const contentStudioTabs: ContentStudioTab[] = [
  { id: 'generate', label: 'Generate', purpose: 'Create new AI-assisted assets and campaign-specific drafts.' },
  { id: 'library', label: 'Library', purpose: 'Find account, campaign, and field assets across legacy asset routes.' },
  { id: 'queue', label: 'Queue', purpose: 'Track generation jobs, failures, and retry paths.' },
  { id: 'send-readiness', label: 'Send Readiness', purpose: 'Review publish/send prerequisites before outbound execution.' },
  { id: 'playbook', label: 'Playbook', purpose: 'Rank, manage, and reuse winning message blocks across segments.' },
  { id: 'asset-types', label: 'Asset Types', purpose: 'Show the owner, status, and route behavior for every content asset type.' },
];

export const contentAssetTypes: ContentAssetType[] = [
  {
    id: 'generated-content',
    label: 'Generated Content',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/generated-content'],
    routeBehavior: 'Legacy route remains a filtered library and send-readiness workspace.',
    statusBehavior: 'Uses published, draft, recipient, and send-state status.',
  },
  {
    id: 'generation-job',
    label: 'Generation Jobs',
    owner: 'Content Studio',
    canonicalTab: 'queue',
    legacyRoutes: ['/queue/generations'],
    routeBehavior: 'Legacy queue remains reachable from Studio Queue and Work Queue.',
    statusBehavior: 'Uses pending, processing, completed, failed, and retry count.',
  },
  {
    id: 'brief',
    label: 'Meeting Briefs',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/briefs', '/briefs/[account]'],
    routeBehavior: 'Brief library remains reachable while account-specific briefs also surface under Account Assets.',
    statusBehavior: 'Ready when seeded; coverage gaps are shown from meeting context.',
  },
  {
    id: 'search-string',
    label: 'Search Strings',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/search'],
    routeBehavior: 'Search-string library remains copyable from the legacy route and discoverable in Studio Library.',
    statusBehavior: 'Uses ready, priority, owner, and wave status from the search fixture.',
  },
  {
    id: 'intel',
    label: 'Actionable Intel',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/intel'],
    routeBehavior: 'Intel remains a legacy research route and is discoverable as a Studio asset type.',
    statusBehavior: 'Uses open/closed owner status with field-to-update context.',
  },
  {
    id: 'audit-route',
    label: 'Audit Routes',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/audit-routes'],
    routeBehavior: 'Audit URLs remain openable/copyable from the route library and Studio Library.',
    statusBehavior: 'Uses open/closed, owner, warm-route, and last-touch status.',
  },
  {
    id: 'qr',
    label: 'QR Assets',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/qr'],
    routeBehavior: 'QR assets remain scannable/downloadable from the legacy route and linked from Studio Library.',
    statusBehavior: 'Ready when QR fixture exists for an audit URL.',
  },
  {
    id: 'microsite',
    label: 'Microsites',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/for', '/for/[account]', '/for/[account]/[person]'],
    routeBehavior: 'Public microsites remain public routes; internal gallery is linked from Studio Library.',
    statusBehavior: 'Uses account microsite registry, showcase flag, and route variants.',
  },
  {
    id: 'proposal',
    label: 'Proposals',
    owner: 'Content Studio',
    canonicalTab: 'library',
    legacyRoutes: ['/proposal/[slug]'],
    routeBehavior: 'Proposal routes remain public account-specific assets and are indexed as Studio assets.',
    statusBehavior: 'Ready when a microsite proposal brief can be resolved for an account slug.',
  },
];

export function getContentStudioTabForLegacyRoute(route: string): ContentStudioTab | undefined {
  const normalized = route.split('?')[0] ?? route;
  const assetType = contentAssetTypes.find((asset) =>
    asset.legacyRoutes.some((legacyRoute) => {
      const baseRoute = legacyRoute.replace('/[account]', '').replace('/[person]', '').replace('/[slug]', '');
      return normalized === baseRoute || normalized.startsWith(`${baseRoute}/`);
    }),
  );

  return assetType ? contentStudioTabs.find((tab) => tab.id === assetType.canonicalTab) : undefined;
}

export function getContentAssetTypeForLegacyRoute(route: string): ContentAssetType | undefined {
  const normalized = route.split('?')[0] ?? route;
  return contentAssetTypes.find((asset) =>
    asset.legacyRoutes.some((legacyRoute) => {
      const baseRoute = legacyRoute.replace('/[account]', '').replace('/[person]', '').replace('/[slug]', '');
      return normalized === baseRoute || normalized.startsWith(`${baseRoute}/`);
    }),
  );
}

export function buildContentStudioSummary(
  counts: ContentAssetSourceCounts,
  generatedRows: Array<{ is_published?: boolean; external_send_count?: number }> = [],
  jobs: Array<{ status: string }> = [],
): ContentStudioSummary {
  const sendReadyGenerated = generatedRows.filter((row) => row.is_published && (row.external_send_count ?? 0) === 0).length;
  const reviewRequiredGenerated = generatedRows.filter((row) => !row.is_published).length;
  const failedJobs = jobs.filter((job) => job.status === 'failed').length;

  return {
    ...counts,
    totalAssets:
      counts.generated +
      counts.generationJobs +
      counts.briefs +
      counts.searchStrings +
      counts.intel +
      counts.auditRoutes +
      counts.qrAssets +
      counts.microsites +
      counts.proposals,
    sendReadyGenerated,
    reviewRequiredGenerated,
    failedJobs,
  };
}
