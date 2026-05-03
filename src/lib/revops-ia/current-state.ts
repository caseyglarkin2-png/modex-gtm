export type CurrentNavItem = {
  section: string;
  label: string;
  href: string;
  canonicalOwner: string;
  disposition: string;
  classification: 'keep-top-level' | 'hidden-core' | 'duplicate' | 'should-be-tab' | 'legacy-artifact';
};

export type CanonicalModule = {
  label: string;
  href: string;
  purpose: string;
};

export const canonicalModules: CanonicalModule[] = [
  { label: 'Home', href: '/', purpose: 'Daily cockpit, priorities, alerts, campaign health, and proof status.' },
  { label: 'Accounts', href: '/accounts', purpose: 'Account command center and account list.' },
  { label: 'Contacts', href: '/contacts', purpose: 'People, enrichment, readiness, and relationship context.' },
  { label: 'Campaigns', href: '/campaigns', purpose: 'Year-round motions; waves and phases live inside campaigns.' },
  { label: 'Engagement', href: '/engagement', purpose: 'Buyer response, inbox, hot accounts, microsite sessions, and engagement triage.' },
  { label: 'Work Queue', href: '/queue', purpose: 'Executable operator tasks, captures, approvals, retries, and stuck jobs.' },
  { label: 'Content Studio', href: '/studio', purpose: 'Generated content, source assets, asset library, prompts, and send readiness.' },
  { label: 'Pipeline', href: '/pipeline', purpose: 'Opportunities, meetings, activities, stage movement, and history.' },
  { label: 'Analytics', href: '/analytics', purpose: 'Campaign/revenue performance, reporting, quarterly review, and attribution.' },
  { label: 'Ops', href: '/ops', purpose: 'Proof ledger, cron health, generation metrics, provider health, and admin controls.' },
];

export const currentSidebarItems: CurrentNavItem[] = [
  { section: 'Core', label: 'Dashboard', href: '/', canonicalOwner: 'Home', disposition: 'Keep as Home.', classification: 'keep-top-level' },
  { section: 'Core', label: 'Accounts', href: '/accounts', canonicalOwner: 'Accounts', disposition: 'Keep as Accounts.', classification: 'keep-top-level' },
  { section: 'Core', label: 'Personas', href: '/personas', canonicalOwner: 'Contacts', disposition: 'Convert to Contacts saved view or legacy alias.', classification: 'should-be-tab' },
  { section: 'Outreach', label: 'Outreach Waves', href: '/waves', canonicalOwner: 'Campaigns', disposition: 'Move into Campaign Phases/Waves.', classification: 'duplicate' },
  { section: 'Outreach', label: 'Campaigns', href: '/campaigns', canonicalOwner: 'Campaigns', disposition: 'Keep as Campaigns.', classification: 'keep-top-level' },
  { section: 'Outreach', label: 'Campaign HQ', href: '/waves/campaign', canonicalOwner: 'Campaigns', disposition: 'Fold into MODEX campaign saved view.', classification: 'legacy-artifact' },
  { section: 'Outreach', label: 'Generation Queue', href: '/queue/generations', canonicalOwner: 'Work Queue / Content Studio', disposition: 'Move to System Jobs and/or Studio Queue.', classification: 'duplicate' },
  { section: 'Outreach', label: 'Generated Content', href: '/generated-content', canonicalOwner: 'Content Studio', disposition: 'Move to Studio Library / Send Readiness.', classification: 'duplicate' },
  { section: 'Outreach', label: 'Meeting Briefs', href: '/briefs', canonicalOwner: 'Content Studio / Accounts', disposition: 'Move to Asset Library and Account Assets.', classification: 'should-be-tab' },
  { section: 'Outreach', label: 'Search Strings', href: '/search', canonicalOwner: 'Content Studio', disposition: 'Move to Asset Library.', classification: 'should-be-tab' },
  { section: 'Outreach', label: 'Actionable Intel', href: '/intel', canonicalOwner: 'Content Studio / Campaigns', disposition: 'Move to Asset Library or Campaign Intel.', classification: 'should-be-tab' },
  { section: 'Field', label: 'Mobile Capture', href: '/capture', canonicalOwner: 'Quick Capture / Work Queue', disposition: 'Keep as global mobile action feeding Work Queue and timelines.', classification: 'should-be-tab' },
  { section: 'Field', label: 'Jake Queue', href: '/queue', canonicalOwner: 'Work Queue', disposition: 'Keep route as canonical Work Queue; rename product concept.', classification: 'duplicate' },
  { section: 'Field', label: 'Audit Routes', href: '/audit-routes', canonicalOwner: 'Content Studio / Accounts', disposition: 'Move to Asset Library and Account Assets.', classification: 'should-be-tab' },
  { section: 'Field', label: 'QR Assets', href: '/qr', canonicalOwner: 'Content Studio / Accounts', disposition: 'Move to Asset Library and Account Assets.', classification: 'should-be-tab' },
  { section: 'Pipeline', label: 'Pipeline Board', href: '/pipeline', canonicalOwner: 'Pipeline', disposition: 'Keep as Pipeline.', classification: 'keep-top-level' },
  { section: 'Pipeline', label: 'Activities', href: '/activities', canonicalOwner: 'Pipeline', disposition: 'Move under Pipeline Activities.', classification: 'should-be-tab' },
  { section: 'Pipeline', label: 'Meetings', href: '/meetings', canonicalOwner: 'Pipeline', disposition: 'Move under Pipeline Meetings.', classification: 'should-be-tab' },
  { section: 'Pipeline', label: 'Analytics', href: '/analytics', canonicalOwner: 'Analytics', disposition: 'Keep as Analytics.', classification: 'keep-top-level' },
  { section: 'Pipeline', label: 'Quarterly Review', href: '/analytics/quarterly', canonicalOwner: 'Analytics', disposition: 'Move under Analytics Quarterly.', classification: 'should-be-tab' },
  { section: 'Pipeline', label: 'Cron Health', href: '/admin/crons', canonicalOwner: 'Ops', disposition: 'Move under Ops Cron Health.', classification: 'should-be-tab' },
  { section: 'Creative', label: 'Creative Studio', href: '/studio', canonicalOwner: 'Content Studio', disposition: 'Keep route as canonical Content Studio; rename product concept.', classification: 'keep-top-level' },
];

export const hiddenCoreRoutes = [
  { href: '/contacts', canonicalOwner: 'Contacts', disposition: 'Promote to top-level navigation.' },
  { href: '/engagement', canonicalOwner: 'Engagement', disposition: 'Create as first-class buyer-response workspace.' },
  { href: '/ops', canonicalOwner: 'Ops', disposition: 'Create as first-class system/proof workspace.' },
];

export function getDuplicateModuleScorecard() {
  return currentSidebarItems.reduce<Record<CurrentNavItem['classification'], number>>((acc, item) => {
    acc[item.classification] += 1;
    return acc;
  }, {
    'keep-top-level': 0,
    'hidden-core': hiddenCoreRoutes.length,
    duplicate: 0,
    'should-be-tab': 0,
    'legacy-artifact': 0,
  });
}

export function getDuplicateModuleRows() {
  return currentSidebarItems.map((item) => ({
    label: item.label,
    href: item.href,
    section: item.section,
    classification: item.classification,
    canonicalOwner: item.canonicalOwner,
    disposition: item.disposition,
  }));
}

