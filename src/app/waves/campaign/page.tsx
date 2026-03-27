import Link from 'next/link';
import { getAccounts, getPersonasByAccount, getAuditRoutes, getMeetingBriefs, getOutreachWaves, slugify } from '@/lib/data';
import { dbGetDashboardStats } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/breadcrumb';
import { Rocket, Target, Mail, Linkedin, Calendar, FileText, ExternalLink, Zap, Clock, ArrowRight } from 'lucide-react';
import { CampaignActions } from './campaign-actions';
import { CampaignToolbar } from './campaign-toolbar';
import { BulkSendPanel } from './bulk-send-panel';

export const dynamic = 'force-dynamic';
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
    trigger: 'New CSCO (Jonathan Ness) March 2026. Oklahoma grad. Been there for years, new to the chair.',
    p1a_frame: 'New CSCO, 90-day window. The yard is the fastest win he can point to.',
    p1a_subject: 'the yard is the quick win',
    p1b_frame: 'Network variance is compounding across every plant. Name it.',
    p1b_subject: 'your yards are running blind',
    p2_subject: 'the analog mile at general mills',
    why_now_hook: "New CSCO. First 90 days. The yard is the fastest board-ready proof point on the table. Every week without a standard protocol is another week of variance compounding across the network.",
    proof_line: '24 facilities. $1M+ profit lift per site. Headcount neutral. 48 to 24 min drop and hook. Not a YMS.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'Frito-Lay': {
    trigger: 'PepsiCo scale. High-velocity snack network. The variance tax is enormous.',
    p1a_frame: 'At PepsiCo throughput volumes, yard variance is a P&L event.',
    p1a_subject: 'the variance tax at pepsico scale',
    p1b_frame: 'Every manual gate process compounds into millions hidden in the network.',
    p1b_subject: 'the yard is the blind spot',
    p2_subject: 'radio and clipboard at the gate',
    why_now_hook: "At PepsiCo throughput volumes, every manual gate process and radio dispatch is a variance generator. It compounds across the network. The yard is where margin goes to die.",
    proof_line: '24 high-volume food sites. Drop and hook from 48 to 24 min. Not a single headcount added.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'Diageo': {
    trigger: 'Beverage network complexity. Every distillery runs its own yard playbook.',
    p1a_frame: 'Beverage flow is time-sensitive. The yard is where orchestration falls apart.',
    p1a_subject: 'the yard problem at distillery scale',
    p1b_frame: 'One driver journey across every facility. The protocol that does not exist yet.',
    p1b_subject: 'the protocol gap across diageo',
    p2_subject: 'visibility dies in the yard',
    why_now_hook: "Beverage flow is time-sensitive and network-heavy. When every distillery and warehouse runs its own yard playbook, the digital supply chain is fiction. The yard is where it becomes real or stays imaginary.",
    proof_line: 'Standardized operating protocol across 24 facilities. Same check-in, same routing, same proof. Not a YMS.',
    site_link: 'https://yardflow.ai/product',
  },
  'Hormel Foods': {
    trigger: 'New CSCO (Will Bonifant) 2026. Transformation mandate.',
    p1a_frame: 'New CSCO reads: 90-day window before the org absorbs the ambition.',
    p1a_subject: 'the yard is the 90-day win',
    p1b_frame: 'Planning COE cannot plan what the yard does not report.',
    p1b_subject: 'the network runs blind at the yard',
    p2_subject: 'every plant, different playbook',
    why_now_hook: "New CSCO. The yard is the fastest, lowest-risk proof point available. One protocol, one driver journey, board-ready ROI. Before the org resists standardization.",
    proof_line: '24 sites. $1M+ each. Zero added headcount. 30 min remote deploy per facility.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'JM Smucker': {
    trigger: 'New Chief Product Supply Officer (Rob Ferguson) Feb 2026.',
    p1a_frame: 'New role, transformation agenda. Yard standardization is the fastest win on the board.',
    p1a_subject: 'the fastest win on the board',
    p1b_frame: '$400M+ transport spend. How much leaks in the yard where nobody is measuring?',
    p1b_subject: '$400M in transport, how much leaks',
    p2_subject: 'the gap between your warehouses',
    why_now_hook: "New Chief Product Supply Officer building a transformation agenda. $400M+ in transportation spend. The yard is the one place where all of it touches down and nobody is standardizing the handoff.",
    proof_line: 'A standardized operating protocol that made each of 24 sites $1M+ more profitable. Not a YMS.',
    site_link: 'https://yardflow.ai/solutions',
  },
  'The Home Depot': {
    trigger: 'CFO Richard McPhail keynoting MODEX 2026. Supply chain is on the executive radar.',
    p1a_frame: 'CFO on stage at MODEX. Supply chain execution already in the spotlight. The yard is the proof point.',
    p1a_subject: 'the yard data for modex',
    p1b_frame: 'Retail DC volume at Home Depot scale. Yard standardization across the network.',
    p1b_subject: 'dock congestion at dc scale',
    p2_subject: 'the constraint nobody named',
    why_now_hook: "Your CFO is keynoting MODEX. Supply chain execution is already on the executive radar. The yard is the area where it either holds up or quietly falls apart. That is where the proof is.",
    proof_line: '200+ facilities contracted. Same driver journey at every site. 30 min deploy. Headcount neutral.',
    site_link: 'https://yardflow.ai/roi',
  },
  'Georgia Pacific': {
    trigger: 'Industrial plant complexity. High trailer volumes. Complex scheduling. Perfect variance generator.',
    p1a_frame: 'Industrial yards with complex scheduling are the exact place variance compounds into hidden cost.',
    p1a_subject: 'yard variance at plant scale',
    p1b_frame: 'Every plant runs a different playbook. The network has no protocol layer.',
    p1b_subject: 'the missing protocol layer',
    p2_subject: 'tribal knowledge at the gate',
    why_now_hook: "Industrial sites with high trailer volumes and complex scheduling create the exact yard variance that compounds into hidden cost. Every plant running its own playbook is local improvisation disguised as operations.",
    proof_line: 'Standardized the driver journey across 24 industrial-grade sites. Variance eliminated at the gate.',
    site_link: 'https://yardflow.ai/product',
  },
  'H-E-B': {
    trigger: 'Grocery DC velocity. One congested dock window cascades into missed replenishment.',
    p1a_frame: 'Grocery distribution is unforgiving. The yard is the root cause of dock congestion.',
    p1a_subject: 'the root cause of dock congestion',
    p1b_frame: 'FIFO enforced by system, not tribal knowledge.',
    p1b_subject: 'the variance tax on grocery',
    p2_subject: 'analog yards, digital ambitions',
    why_now_hook: "Grocery distribution is unforgiving. One congested dock window cascades into missed store replenishment. The root cause is always the same: the yard has no protocol. Standardized yard flow fixes the actual constraint.",
    proof_line: 'Drop and hook from 48 to 24 min. FIFO by system, not tribal knowledge. Headcount neutral.',
    site_link: 'https://yardflow.ai/solutions',
  },
};

/* ── also handle Dannon for reference ── */
const DANNON_INTEL = {
  trigger: 'Active warm intro via Mark Shaughnessy → Danone CSCO',
  warmPath: 'Mark Shaughnessy → Danone CSCO office',
  action: 'Text Mark. Send him the one-pager. Let warm path breathe 48h before cold outreach.',
};

export default async function CampaignPage() {
  const accounts = getAccounts();
  const auditRoutes = getAuditRoutes();
  const briefs = getMeetingBriefs();
  const waves = getOutreachWaves();

  // Live pipeline stats from DB
  let stats: Awaited<ReturnType<typeof dbGetDashboardStats>> | null = null;
  try {
    stats = await dbGetDashboardStats();
  } catch {
    // DB offline — degrade gracefully
  }

  const modexDate = new Date('2026-04-13');
  const today = new Date();
  const daysUntilModex = Math.max(0, Math.ceil((modexDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

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
            MODEX 2026. April 13-16. The yard is the constraint. Name it. Book the meeting.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> casey@yardflow.ai</span>
          <a href={calendarLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 hover:underline">
            <Calendar className="h-3.5 w-3.5" /> Booking Calendar <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Live Pipeline Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{daysUntilModex}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Days to MODEX</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{stats?.emailsSent ?? '—'}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Emails Sent</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats?.openRate ?? 0}%</p>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Open Rate</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-cyan-600">{stats?.clickRate ?? 0}%</p>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Click Rate</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats?.meetingsBooked ?? 0}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Meetings Booked</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats?.contacted ?? 0}/20</p>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Accounts Contacted</p>
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

      {/* ── Bulk Send Panel ── */}
      {(() => {
        const bulkRecipients = wave1Accounts
          .filter((a) => a.name !== 'Dannon')
          .flatMap((account) => {
            const personas = getPersonasByAccount(account.name);
            return personas.map((p) => ({
              accountName: account.name,
              personaName: p.name,
              email: p.email ?? '',
              priority: p.priority ?? 'P2',
              title: p.title ?? undefined,
            }));
          });
        return <BulkSendPanel recipients={bulkRecipients} />;
      })()}

      {/* ── Wave 1 Campaign Cards ── */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" /> Wave 1: Cold Outreach
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Generate. Read it. Fix what needs fixing. Send. The AI writes in your voice. You own the final word.
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
                    <CampaignToolbar
                      accountName={account.name}
                      personas={personas.map(p => ({ name: p.name, title: p.title ?? undefined, priority: p.priority ?? 'P2' }))}
                    />
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
                <div className="flex items-center gap-3 pt-2 border-t text-xs flex-wrap">
                  <Link href={`/briefs/${slugify(account.name)}`} className="flex items-center gap-1 text-cyan-600 hover:underline">
                    <FileText className="h-3 w-3" /> Meeting Brief
                  </Link>
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
          <CardTitle className="text-base">Cadence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <Badge className="bg-blue-500/15 text-blue-700">Day 0</Badge>
              <p className="font-medium">Name the constraint</p>
              <p className="text-[var(--muted-foreground)]">Open on their reality. The yard is the black hole. Under 120 words.</p>
            </div>
            <div className="space-y-1">
              <Badge className="bg-amber-500/15 text-amber-700">Day 3</Badge>
              <p className="font-medium">New proof, different angle</p>
              <p className="text-[var(--muted-foreground)]">One stat, one module, one quote. Tighter. Harder. Under 80 words.</p>
            </div>
            <div className="space-y-1">
              <Badge className="bg-violet-500/15 text-violet-700">Day 9</Badge>
              <p className="font-medium">The variance tax</p>
              <p className="text-[var(--muted-foreground)]">Make inaction feel expensive and compounding. The last analog mile. Under 80 words.</p>
            </div>
            <div className="space-y-1">
              <Badge className="bg-neutral-500/15 text-neutral-700">Day 16</Badge>
              <p className="font-medium">Clean break</p>
              <p className="text-[var(--muted-foreground)]">Plant the seed. The constraint exists. YNS exists. Door stays open. Under 50 words.</p>
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
              <p className="text-[var(--muted-foreground)]">Send the one-pager. &ldquo;Worth 30 minutes to walk through the deployment data. Tuesday April 14 work?&rdquo;</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;Not the right person&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Appreciate it. Who owns yard operations across the network?&rdquo; Then email the referral with the warm intro.</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;What does it cost?&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Depends on network size. The audit maps that. 30 minutes gives us both a number.&rdquo; Never put pricing in email.</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">&ldquo;We have a YMS&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;YNS is not a YMS. It is the network layer that makes your YMS work across sites. The protocol your YMS does not enforce.&rdquo;</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">Calendar clicked, did not book</p>
              <p className="text-[var(--muted-foreground)]">&ldquo;Saw some interest. Tuesday April 14 at 1pm work? We will have live users on-site you can talk to.&rdquo;</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">OOO auto-reply</p>
              <p className="text-[var(--muted-foreground)]">Note return date. Send Step 2 on return date +1. If return is during MODEX, adjust to in-person ask.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
