import Link from 'next/link';
import { dbGetPersonas } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ContactRound } from 'lucide-react';
import { PersonasTable, type PersonaRow } from './personas-table';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function priorityRank(priority: string | null | undefined) {
  if (priority === 'P1') return 1;
  if (priority === 'P2') return 2;
  if (priority === 'P3') return 3;
  return 4;
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Personas' };

export default async function PersonasPage() {
  const rawPersonas = await dbGetPersonas();

  const personas: PersonaRow[] = rawPersonas.map((p) => ({
    persona_id: p.persona_id,
    account: p.account_name,
    name: p.name,
    title: p.title,
    priority: p.priority,
    persona_lane: p.persona_lane,
    email: p.email,
    email_valid: p.email_valid,
    linkedin_url: p.linkedin_url,
    persona_status: p.persona_status,
    next_step: p.next_step,
    slug: slugify(p.account_name),
  }));

  const accountCount = new Set(personas.map((p) => p.account)).size;
  const readyToContactCount = personas.filter(
    (persona) => persona.email && persona.email_valid !== false && /found|research complete/i.test(persona.persona_status ?? ''),
  ).length;
  const priorityFocusCount = personas.filter((persona) => /P1|P2/i.test(persona.priority ?? '')).length;
  const execSponsorCount = personas.filter((persona) => /exec/i.test(persona.persona_lane ?? '')).length;
  const coverageGapCount = personas.filter(
    (persona) => !persona.email || persona.email_valid === false || /to find|research needed/i.test(persona.persona_status ?? ''),
  ).length;

  const triagePersonas = [...personas]
    .sort((left, right) => {
      const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
      if (priorityDelta !== 0) return priorityDelta;
      const leftReady = left.email && left.email_valid !== false ? 0 : 1;
      const rightReady = right.email && right.email_valid !== false ? 0 : 1;
      if (leftReady !== rightReady) return leftReady - rightReady;
      return left.account.localeCompare(right.account);
    })
    .slice(0, 6);

  const laneCounts = Array.from(
    personas.reduce((acc, persona) => {
      const lane = persona.persona_lane ?? 'Unassigned';
      acc.set(lane, (acc.get(lane) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Personas' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personas ({personas.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {personas.length} named personas across {accountCount} accounts. Click row to view account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <PersonaMetricCard label="Ready to contact" value={readyToContactCount} tone={readyToContactCount > 0 ? 'text-emerald-600' : 'text-[var(--foreground)]'} />
        <PersonaMetricCard label="P1 / P2 focus" value={priorityFocusCount} tone={priorityFocusCount > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
        <PersonaMetricCard label="Exec sponsors" value={execSponsorCount} tone="text-[var(--foreground)]" />
        <PersonaMetricCard label="Coverage gaps" value={coverageGapCount} tone={coverageGapCount > 0 ? 'text-amber-600' : 'text-emerald-600'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Persona Priority Board</CardTitle>
              <Link href="/accounts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open accounts <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {triagePersonas.map((persona) => {
                const nextMove = persona.next_step || (persona.email ? 'Draft note and personalize the first touch.' : 'Confirm email path before outreach.');

                return (
                  <div key={persona.persona_id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/accounts/${persona.slug}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                          {persona.name}
                        </Link>
                        <Badge variant={persona.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">
                          {persona.priority ?? 'Unscored'}
                        </Badge>
                        <StatusBadge status={persona.persona_status ?? 'Not started'} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {persona.account} · {persona.title || 'Title TBD'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Next move: {nextMove}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="outline" className="text-xs">{persona.persona_lane ?? 'Unassigned'}</Badge>
                      <Link href={`/accounts/${persona.slug}`}>
                        <Button size="sm">Account</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Coverage Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-2 text-[var(--foreground)]">
                <ContactRound className="h-4 w-4" /> {readyToContactCount} persona{readyToContactCount === 1 ? '' : 's'} are ready for a real first touch.
              </span>
            </div>

            <div className="space-y-2">
              {laneCounts.slice(0, 4).map(([lane, count]) => (
                <div key={lane} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="text-[var(--foreground)]">{lane}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PersonasTable personas={personas} />
    </div>
  );
}

function PersonaMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
