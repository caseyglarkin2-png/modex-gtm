import Link from 'next/link';
import { getAccounts, getPersonasByAccount, getAuditRoutes, getMeetingBriefs, getOutreachWaves, slugify } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/breadcrumb';
import { Rocket, Target, Mail, Linkedin, Calendar, FileText, ExternalLink, Zap, Clock, ArrowRight } from 'lucide-react';
import { CampaignActions } from './campaign-actions';

export const metadata = { title: 'Campaign Command Center' };

/* ── hand-crafted intel per Wave 1 account ── */
const WAVE1_INTEL: Record<string, {
  trigger: string;
  p1a_frame: string;
  p1a_subject: string;
  p1b_frame: string;
  p1b_subject: string;
  p2_subject: string;
  why_now_hook: string;
  proof_line: string;
  site_link: string;
}> = {
  'General Mills': {
    trigger: 'New CSCO (Jonathan Ness) appointed March 2026',
    p1a_frame: '90-Day Quick Win — new leadership trigger',
    p1a_subject: '90 days in — one yard network idea',
    p1b_frame: 'Network logistics cost reduction',
    p1b_subject: 'yard network data from 24 sites',
    p2_subject: 'what we found walking 200+ yards',
    why_now_hook: "Congrats on the CSCO role. The supply chain leaders who move fastest in their first 90 days lock in standardization before the org resists change.",
    proof_line: '24 sites live, $1M+ per-site profit lift, headcount neutral. 48→24 min drop & hook.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'Frito-Lay': {
    trigger: 'MODEX signal + high-velocity snack network',
    p1a_frame: 'Variance Tax at PepsiCo scale',
    p1a_subject: 'the variance tax across PepsiCo yards',
    p1b_frame: 'Transportation fleet flow optimization',
    p1b_subject: '48 to 24 minutes — what changed',
    p2_subject: 'manual gate check-in is costing you',
    why_now_hook: "At PepsiCo's throughput volumes, every manual gate process and radio dispatch compounds into millions in hidden variance.",
    proof_line: 'Over 20 high-volume food sites cut drop & hook from 48 to 24 min without adding a single headcount.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'Diageo': {
    trigger: 'MODEX signal + beverage network complexity',
    p1a_frame: 'Beverage throughput under volume pressure',
    p1a_subject: 'yard throughput at Diageo distilleries',
    p1b_frame: 'Manufacturing & distillation flow',
    p1b_subject: 'one driver journey across every facility',
    p2_subject: 'clipboard and radio at the gate — sound familiar?',
    why_now_hook: "Beverage flow is time-sensitive and network-heavy. When every distillery and warehouse runs its own yard playbook, variance compounds fast.",
    proof_line: 'Standardized operating protocol across 24 sites — same check-in, same dock assignment, same proof. Not a YMS.',
    site_link: 'https://yardflow.ai/product',
  },
  'Hormel Foods': {
    trigger: 'New CSCO (Will Bonifant) appointed 2026',
    p1a_frame: '90-Day Quick Win — transformation mandate',
    p1a_subject: '90 days in — yard standardization quick win',
    p1b_frame: 'Planning COE & network variance',
    p1b_subject: 'your yards are running different playbooks',
    p2_subject: 'what we found walking 200+ yards',
    why_now_hook: "Congrats on the CSCO appointment. New supply chain leadership + proven yard standardization = a win you can point to inside 90 days.",
    proof_line: 'Each of 24 sites at least $1M+ more profitable. Zero added headcount. 30 min remote deploy per facility.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'JM Smucker': {
    trigger: 'New Chief Product Supply Officer (Rob Ferguson) Feb 2026',
    p1a_frame: '90-Day Quick Win — product supply transformation',
    p1a_subject: 'new role quick win — yard standardization',
    p1b_frame: 'Transportation spend optimization ($400M+)',
    p1b_subject: '$400M in transport — how much leaks in the yard?',
    p2_subject: 'the protocol gap between your warehouses',
    why_now_hook: "As the new Chief Product Supply Officer, you\'re building your transformation agenda. Yard standardization is the fastest, lowest-risk win on the board.",
    proof_line: 'A standardized operating protocol — not a YMS — that made each of 24+ sites at least $1M+ more profitable.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'The Home Depot': {
    trigger: 'CFO Richard McPhail keynoting MODEX 2026',
    p1a_frame: 'MODEX keynote proximity + retail DC volume',
    p1a_subject: 'yard network data for MODEX conversation',
    p1b_frame: 'Supply chain & distribution flow',
    p1b_subject: 'standardizing yard ops across retail DCs',
    p2_subject: 'dock congestion at high-volume DCs',
    why_now_hook: "With your CFO keynoting MODEX, supply chain execution is on the executive radar. Yard standardization is the presentation-ready proof point.",
    proof_line: 'Over 200 facilities contracted. Same driver journey at every site. Deploys in 30 minutes per facility.',
    site_link: 'https://yardflow.ai/roi',
  },
  'Georgia Pacific': {
    trigger: 'Industrial plant complexity + MODEX signal',
    p1a_frame: 'Industrial plant yard variance',
    p1a_subject: 'yard variance across GP plants',
    p1b_frame: 'Wood products logistics throughput',
    p1b_subject: 'trailer scheduling at industrial scale',
    p2_subject: 'every plant runs a different yard playbook',
    why_now_hook: "Industrial sites with high trailer volumes and complex scheduling create the exact yard variance that compounds into hidden cost.",
    proof_line: 'Standardized the driver journey across 24 industrial-grade sites. Gate time variance eliminated.',
    site_link: 'https://yardflow.ai/product',
  },
  'H-E-B': {
    trigger: 'Grocery DC velocity + MODEX signal',
    p1a_frame: 'Grocery distribution dock velocity',
    p1a_subject: 'dock velocity at grocery-scale DCs',
    p1b_frame: 'Transport & reverse logistics flow',
    p1b_subject: 'the variance tax on grocery distribution',
    p2_subject: 'what standardized yard flow looks like',
    why_now_hook: "Grocery distribution is brutally unforgiving — one congested dock window cascades into missed store replenishment. Standardized yard flow fixes the root cause.",
    proof_line: 'Drop & hook from 48 to 24 min. FIFO enforced by system, not tribal knowledge. Headcount neutral.',
    site_link: 'https://yardflow.ai/solutions',
  },
};

/* ── also handle Dannon for reference ── */
const DANNON_INTEL = {
  trigger: 'Active warm intro via Mark Shaughnessy → Danone CSCO',
  warmPath: 'Mark Shaughnessy → Danone CSCO office',
  action: 'Text Mark. Send him the one-pager. Let warm path breathe 48h before cold outreach.',
};

export default function CampaignPage() {
  const accounts = getAccounts();
  const auditRoutes = getAuditRoutes();
  const briefs = getMeetingBriefs();
  const waves = getOutreachWaves();

  const wave1Accounts = accounts
    .filter((a) => (a.priority_score ?? 0) >= 4)
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));

  const dannon = accounts.find((a) => a.name === 'Dannon');
  const dannonPersonas = getPersonasByAccount('Dannon');
  const dannonRoute = auditRoutes.find((r) => r.account === 'Danone');

  const calendarLink = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Outreach Waves', href: '/waves' }, { label: 'Campaign Command Center' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-6 w-6 text-cyan-500" /> Campaign Command Center
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Wave 1 booking campaign. Pre-loaded intel, hand-crafted frames, one-click generation.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> casey@yardflow.ai</span>
          <a href={calendarLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 hover:underline">
            <Calendar className="h-3.5 w-3.5" /> Booking Calendar <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Dannon Special Card (Warm Path) ── */}
      {dannon && (
        <Card className="border-l-4 border-l-red-500 bg-red-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                Dannon (Danone) — WARM PATH ACTIVE
                <Badge variant="outline" className="text-red-600 border-red-300">Wave 0</Badge>
              </CardTitle>
              <Link href={`/accounts/${slugify('Dannon')}`}>
                <Button variant="ghost" size="sm" className="text-xs">View Account →</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-red-500/10 p-3 text-sm">
              <p className="font-semibold text-red-700">DO NOT cold email. Activate warm path first.</p>
              <p className="mt-1 text-[var(--muted-foreground)]">
                <strong>Route:</strong> {DANNON_INTEL.warmPath}
              </p>
              <p className="mt-1 text-[var(--muted-foreground)]">
                <strong>Action:</strong> {DANNON_INTEL.action}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-medium">P1 Targets</p>
                {dannonPersonas.filter((p) => p.priority === 'P1').map((p) => (
                  <p key={p.persona_id} className="text-[var(--muted-foreground)]">{p.name} — {p.title}</p>
                ))}
              </div>
              <div>
                <p className="font-medium">Assets Ready</p>
                <p className="text-[var(--muted-foreground)]">One-pager: Generate on account page</p>
                {dannonRoute && (
                  <a href={dannonRoute.audit_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                    Audit URL →
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Wave 1 Campaign Cards ── */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" /> Wave 1: Cold Outreach — Score 4-5 Accounts
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Each card has pre-loaded frames, subject lines, and trigger hooks. Generate → Edit → Send.
        </p>
      </div>

      <div className="space-y-4">
        {wave1Accounts.filter((a) => a.name !== 'Dannon').map((account) => {
          const intel = WAVE1_INTEL[account.name];
          if (!intel) return null;

          const personas = getPersonasByAccount(account.name);
          const p1s = personas.filter((p) => p.priority === 'P1');
          const p2s = personas.filter((p) => p.priority === 'P2');
          const route = auditRoutes.find((r) => r.account === account.name);
          const brief = briefs.find((b) => b.account === account.name);
          const wave = waves.find((w) => w.account === account.name);

          return (
            <Card key={account.name} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {account.name}
                    <Badge variant="outline" className="text-xs">Score {account.priority_score ? Math.round(account.priority_score / 20) : '?'}</Badge>
                    <Badge className="bg-amber-500/15 text-amber-700 text-[10px]">{intel.trigger}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href={`/accounts/${slugify(account.name)}`}>
                      <Button variant="ghost" size="sm" className="text-xs">View Account →</Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Why Now + Proof */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-[var(--muted-foreground)] mb-1">Why Now Hook</p>
                    <p className="text-sm italic">&ldquo;{intel.why_now_hook}&rdquo;</p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--muted-foreground)] mb-1">Proof Line</p>
                    <p className="text-sm">{intel.proof_line}</p>
                  </div>
                </div>

                {/* P1-A Target */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">P1 Exec Sponsors</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {p1s.map((p, i) => {
                      const frame = i === 0 ? intel.p1a_frame : intel.p1b_frame;
                      const subject = i === 0 ? intel.p1a_subject : intel.p1b_subject;
                      return (
                        <div key={p.persona_id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">{p.title}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">P1{i === 0 ? '-A' : '-B'}</Badge>
                          </div>
                          <div className="text-xs space-y-1">
                            <p><span className="font-medium">Frame:</span> {frame}</p>
                            <p><span className="font-medium">Subject:</span> <code className="bg-[var(--muted)] px-1 rounded">{subject}</code></p>
                            <p><span className="font-medium">Email:</span> {p.email ?? 'N/A'}</p>
                            {p.linkedin_url && (
                              <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 hover:underline">
                                <Linkedin className="h-3 w-3" /> LinkedIn Profile
                              </a>
                            )}
                          </div>
                          <CampaignActions
                            accountName={account.name}
                            personaName={p.name}
                            personaEmail={p.email ?? ''}
                            subjectLine={subject}
                            auditUrl={route?.audit_url}
                            calendarLink={calendarLink}
                            whyNowHook={intel.why_now_hook}
                            proofLine={intel.proof_line}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* P2 Targets (collapsed) */}
                <details className="group">
                  <summary className="text-xs font-semibold text-violet-600 uppercase tracking-wide cursor-pointer flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                    P2 Operators & Routes ({p2s.length})
                    <span className="font-normal text-[var(--muted-foreground)] ml-1">— Subject: &ldquo;{intel.p2_subject}&rdquo;</span>
                  </summary>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {p2s.map((p) => (
                      <div key={p.persona_id} className="rounded-lg border p-2 text-xs space-y-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-[var(--muted-foreground)]">{p.title}</p>
                        <p>{p.email}</p>
                        {p.linkedin_url && (
                          <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">LinkedIn →</a>
                        )}
                        <CampaignActions
                          accountName={account.name}
                          personaName={p.name}
                          personaEmail={p.email ?? ''}
                          subjectLine={intel.p2_subject}
                          auditUrl={route?.audit_url}
                          calendarLink={calendarLink}
                          whyNowHook={intel.why_now_hook}
                          proofLine={intel.proof_line}
                        />
                      </div>
                    ))}
                  </div>
                </details>

                {/* Resources row */}
                <div className="flex items-center gap-3 pt-2 border-t text-xs">
                  {route?.audit_url && (
                    <a href={route.audit_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 hover:underline">
                      <FileText className="h-3 w-3" /> Audit URL
                    </a>
                  )}
                  <a href={intel.site_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> YardFlow Site
                  </a>
                  <a href={calendarLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 hover:underline">
                    <Calendar className="h-3 w-3" /> Booking Calendar
                  </a>
                  <span className="text-[var(--muted-foreground)]">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {wave?.start_date ?? 'TBD'} → {wave?.follow_up_1 ?? 'TBD'} → {wave?.follow_up_2 ?? 'TBD'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Campaign Cadence Reference ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cadence & Frame Rotation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <Badge className="bg-blue-500/15 text-blue-700">Day 0 — Today</Badge>
              <p className="font-medium">Initial Email</p>
              <p className="text-[var(--muted-foreground)]">Pain-specific hook with trigger. Under 125 words.</p>
            </div>
            <div className="space-y-1">
              <Badge className="bg-amber-500/15 text-amber-700">Day 3 — Monday</Badge>
              <p className="font-medium">Proof Follow-up</p>
              <p className="text-[var(--muted-foreground)]">New stat, customer quote, or case study. No &ldquo;circling back.&rdquo;</p>
            </div>
            <div className="space-y-1">
              <Badge className="bg-violet-500/15 text-violet-700">Day 6 — Thursday</Badge>
              <p className="font-medium">Peer Pressure</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Your peers went live in Q1.&rdquo; Entirely different angle.</p>
            </div>
            <div className="space-y-1">
              <Badge className="bg-neutral-500/15 text-neutral-700">Day 10 — Monday</Badge>
              <p className="font-medium">Gracious Breakup</p>
              <p className="text-[var(--muted-foreground)]">Short, zero pressure. &ldquo;Door&apos;s open when ready.&rdquo;</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Reply Playbook ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reply Playbook</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;Send more info&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">One-pager link + &ldquo;Happy to walk through it live — here&apos;s 30 min&rdquo; + calendar link.</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;Not the right person, talk to X&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Thank you — reaching out to X now.&rdquo; Email X with warm intro reference.</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;What&apos;s the cost?&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Depends on network size. Worth 30 min to scope?&rdquo; Never put pricing in email.</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;We have a YMS&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;We&apos;re not a YMS. We&apos;re the network layer that makes your YMS work across sites.&rdquo;</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">Calendar clicked, didn&apos;t book</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Saw you checked — want me to suggest a specific time?&rdquo;</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">OOO Auto-reply</p>
              <p className="text-[var(--muted-foreground)]">Note return date. Send Step 2 on return date +1.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
