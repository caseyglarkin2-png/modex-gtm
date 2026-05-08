import {
  Activity,
  BarChart3,
  Building2,
  FileText,
  GitBranch,
  HeartPulse,
  Home,
  Inbox,
  ListTodo,
  Megaphone,
  Search,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavModule = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  aliases: string[];
  section: 'Operator Flow' | 'Platform';
};

export type CommandRoute = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
  canonicalOwner: string;
};

export const canonicalNavModules: NavModule[] = [
  { id: 'accounts', label: 'Accounts', href: '/accounts', icon: Building2, aliases: ['/accounts'], section: 'Operator Flow' },
  { id: 'content-studio', label: 'Content Studio', href: '/studio', icon: FileText, aliases: ['/studio', '/generated-content', '/briefs', '/search', '/intel', '/audit-routes', '/qr', '/for', '/proposal'], section: 'Operator Flow' },
  { id: 'work-queue', label: 'Work Queue', href: '/queue', icon: ListTodo, aliases: ['/queue', '/queue/generations', '/capture'], section: 'Operator Flow' },
  { id: 'engagement', label: 'Engagement', href: '/engagement', icon: Inbox, aliases: ['/engagement', '/api/notifications'], section: 'Operator Flow' },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3, aliases: ['/analytics', '/analytics/emails', '/analytics/quarterly'], section: 'Operator Flow' },
  { id: 'home', label: 'Home', href: '/', icon: Home, aliases: ['/'], section: 'Platform' },
  { id: 'campaigns', label: 'Campaigns', href: '/campaigns', icon: Megaphone, aliases: ['/campaigns', '/waves', '/waves/campaign'], section: 'Platform' },
  { id: 'contacts', label: 'Contacts', href: '/contacts', icon: Users, aliases: ['/contacts', '/personas'], section: 'Platform' },
  { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: GitBranch, aliases: ['/pipeline', '/activities', '/meetings'], section: 'Platform' },
  { id: 'ops', label: 'Ops', href: '/ops', icon: Settings, aliases: ['/ops', '/admin/crons', '/admin/generation-metrics'], section: 'Platform' },
];

export const commandRoutes: CommandRoute[] = [
  ...canonicalNavModules.map((module) => ({
    label: module.label,
    href: module.href,
    icon: module.icon,
    keywords: [module.label],
    canonicalOwner: module.label,
  })),
  { label: 'Quick Capture', href: '/capture', icon: Smartphone, keywords: ['Mobile Capture', 'Field Capture', 'Capture'], canonicalOwner: 'Work Queue' },
  { label: 'Personas', href: '/contacts', icon: Users, keywords: ['Personas', 'People'], canonicalOwner: 'Contacts' },
  { label: 'Outreach Waves', href: '/campaigns', icon: Megaphone, keywords: ['Outreach Waves', 'Waves'], canonicalOwner: 'Campaigns' },
  { label: 'Campaign HQ', href: '/campaigns', icon: Megaphone, keywords: ['Campaign HQ', 'MODEX HQ'], canonicalOwner: 'Campaigns' },
  { label: 'Generation Queue', href: '/queue?tab=system-jobs', icon: Activity, keywords: ['Generation Queue', 'AI Jobs', 'System Jobs'], canonicalOwner: 'Work Queue' },
  { label: 'Generated Content', href: '/studio?tab=generated-content', icon: FileText, keywords: ['Generated Content', 'One-Pagers'], canonicalOwner: 'Content Studio' },
  { label: 'Meeting Briefs', href: '/studio?tab=briefs', icon: FileText, keywords: ['Meeting Briefs', 'Briefs'], canonicalOwner: 'Content Studio' },
  { label: 'Search Strings', href: '/studio?tab=search-strings', icon: Search, keywords: ['Search Strings'], canonicalOwner: 'Content Studio' },
  { label: 'Actionable Intel', href: '/studio?tab=intel', icon: HeartPulse, keywords: ['Actionable Intel', 'Intel'], canonicalOwner: 'Content Studio' },
  { label: 'Audit Routes', href: '/studio?tab=audit-routes', icon: FileText, keywords: ['Audit Routes'], canonicalOwner: 'Content Studio' },
  { label: 'QR Assets', href: '/studio?tab=qr-assets', icon: FileText, keywords: ['QR Assets', 'QR'], canonicalOwner: 'Content Studio' },
  { label: 'Microsites', href: '/studio?tab=microsites', icon: FileText, keywords: ['Microsites', 'Public', 'Gallery'], canonicalOwner: 'Content Studio' },
  { label: 'Activities', href: '/pipeline?tab=activities', icon: Activity, keywords: ['Activities'], canonicalOwner: 'Pipeline' },
  { label: 'Meetings', href: '/pipeline?tab=meetings', icon: Activity, keywords: ['Meetings'], canonicalOwner: 'Pipeline' },
  { label: 'Quarterly Review', href: '/analytics?tab=quarterly', icon: BarChart3, keywords: ['Quarterly Review'], canonicalOwner: 'Analytics' },
  { label: 'Cron Health', href: '/ops?tab=cron-health', icon: Settings, keywords: ['Cron Health'], canonicalOwner: 'Ops' },
  { label: 'Generation Metrics', href: '/ops?tab=generation-metrics', icon: Settings, keywords: ['Generation Metrics'], canonicalOwner: 'Ops' },
];

export function isActiveNavModule(pathname: string, module: NavModule) {
  return module.aliases.some((alias) => (
    pathname === alias ||
    (alias !== '/' && pathname.startsWith(`${alias}/`))
  ));
}

export function getPageLabelForPath(pathname: string) {
  const owner = canonicalNavModules.find((module) => isActiveNavModule(pathname, module));
  return owner?.label ?? 'RevOps OS';
}
