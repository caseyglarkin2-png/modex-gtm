export type ContentStudioTabId =
  | 'generate'
  | 'library'
  | 'queue'
  | 'send-readiness'
  | 'playbook'
  | 'briefs'
  | 'search-strings'
  | 'intel'
  | 'audit-routes'
  | 'qr-assets'
  | 'microsites'
  | 'generated-content';

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
  { id: 'generated-content', label: 'Generated Content', purpose: 'Review generated one-pagers, filter, publish drafts, and send.' },
  { id: 'briefs', label: 'Briefs', purpose: 'Pre-meeting preparation documents and prep priority board.' },
  { id: 'search-strings', label: 'Search Strings', purpose: 'Sales Navigator, LinkedIn, and Google X-Ray queries.' },
  { id: 'intel', label: 'Intel', purpose: 'Open research items, owner status, and field-to-update tracking.' },
  { id: 'audit-routes', label: 'Audit Routes', purpose: 'UTM-tracked landing-page URLs with copyable asks.' },
  { id: 'qr-assets', label: 'QR Assets', purpose: 'Booth-ready QR codes and account-specific scan destinations.' },
  { id: 'microsites', label: 'Microsites', purpose: 'Internal gallery of public-facing account microsites.' },
  { id: 'queue', label: 'Queue', purpose: 'Track generation jobs, failures, and retry paths.' },
  { id: 'send-readiness', label: 'Send Readiness', purpose: 'Review publish/send prerequisites before outbound execution.' },
  { id: 'playbook', label: 'Playbook', purpose: 'Rank, manage, and reuse winning message blocks across segments.' },
];

export const contentAssetTypes: ContentAssetType[] = [
  {
    id: 'generated-content',
    label: 'Generated Content',
    owner: 'Content Studio',
    canonicalTab: 'generated-content',
    legacyRoutes: ['/generated-content'],
    routeBehavior: 'Legacy /generated-content redirects to Studio Generated Content tab.',
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
    canonicalTab: 'briefs',
    legacyRoutes: ['/briefs', '/briefs/[account]'],
    routeBehavior: 'Legacy /briefs index redirects to Studio Briefs tab; /briefs/[account] detail route is preserved.',
    statusBehavior: 'Ready when seeded; coverage gaps are shown from meeting context.',
  },
  {
    id: 'search-string',
    label: 'Search Strings',
    owner: 'Content Studio',
    canonicalTab: 'search-strings',
    legacyRoutes: ['/search'],
    routeBehavior: 'Legacy /search redirects to Studio Search Strings tab.',
    statusBehavior: 'Uses ready, priority, owner, and wave status from the search fixture.',
  },
  {
    id: 'intel',
    label: 'Actionable Intel',
    owner: 'Content Studio',
    canonicalTab: 'intel',
    legacyRoutes: ['/intel'],
    routeBehavior: 'Legacy /intel redirects to Studio Intel tab.',
    statusBehavior: 'Uses open/closed owner status with field-to-update context.',
  },
  {
    id: 'audit-route',
    label: 'Audit Routes',
    owner: 'Content Studio',
    canonicalTab: 'audit-routes',
    legacyRoutes: ['/audit-routes'],
    routeBehavior: 'Legacy /audit-routes redirects to Studio Audit Routes tab.',
    statusBehavior: 'Uses open/closed, owner, warm-route, and last-touch status.',
  },
  {
    id: 'qr',
    label: 'QR Assets',
    owner: 'Content Studio',
    canonicalTab: 'qr-assets',
    legacyRoutes: ['/qr'],
    routeBehavior: 'Legacy /qr redirects to Studio QR Assets tab.',
    statusBehavior: 'Ready when QR fixture exists for an audit URL.',
  },
  {
    id: 'microsite',
    label: 'Microsites',
    owner: 'Content Studio',
    canonicalTab: 'microsites',
    legacyRoutes: ['/for', '/for/[account]', '/for/[account]/[person]'],
    routeBehavior: 'Public /for/[account] microsites remain on yardflow.ai; internal /for index redirects to Studio Microsites tab.',
    statusBehavior: 'Uses account microsite registry, showcase flag, and route variants.',
  },
  {
    id: 'proposal',
    label: 'Proposals',
    owner: 'Content Studio',
    canonicalTab: 'microsites',
    legacyRoutes: ['/proposal/[slug]'],
    routeBehavior: 'Proposal routes remain public account-specific assets and are indexed under the Microsites tab.',
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
