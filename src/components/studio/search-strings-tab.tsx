'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Search, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CopyButton } from '@/components/copy-button';
import { MetricCard } from '@/components/metric-card';
import type { SearchString } from '@/lib/data';

type SearchStringsTabProps = {
  strings: SearchString[];
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function priorityRank(priority: string) {
  if (priority === 'P1') return 1;
  if (priority === 'P2') return 2;
  if (priority === 'P3') return 3;
  return 4;
}

export function SearchStringsTab({ strings }: SearchStringsTabProps) {
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? strings.filter((s) => s.account.toLowerCase().includes(filter.toLowerCase()) || s.function.toLowerCase().includes(filter.toLowerCase()))
    : strings;

  const readyCount = strings.filter((entry) => /ready/i.test(entry.status)).length;
  const p1Count = strings.filter((entry) => entry.priority === 'P1').length;
  const accountCount = new Set(strings.map((entry) => entry.account)).size;
  const ownerCount = new Set(strings.map((entry) => entry.owner)).size;

  const sprintBoard = [...strings]
    .filter((entry) => /ready/i.test(entry.status))
    .sort((left, right) => {
      const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
      if (priorityDelta !== 0) return priorityDelta;
      return left.account.localeCompare(right.account);
    })
    .slice(0, 6);

  const waveCounts = Array.from(
    strings.reduce((acc, entry) => {
      acc.set(entry.wave, (acc.get(entry.wave) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Search Strings ({strings.length})</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pre-built Sales Navigator, LinkedIn, and Google X-Ray queries. Click copy to grab instantly.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Ready queries" value={readyCount} tone={readyCount > 0 ? 'text-emerald-600' : 'text-[var(--foreground)]'} />
        <MetricCard label="P1 targets" value={p1Count} tone={p1Count > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
        <MetricCard label="Accounts covered" value={accountCount} tone="text-[var(--foreground)]" />
        <MetricCard label="Owners active" value={ownerCount} tone="text-[var(--foreground)]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Search Sprint Board</CardTitle>
              <Link href="/contacts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open contacts <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sprintBoard.map((entry, index) => (
                <div key={`${entry.account}-${entry.target_title}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/accounts/${slugify(entry.account)}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                        {entry.account}
                      </Link>
                      <Badge variant="outline" className="text-xs">{entry.wave}</Badge>
                      <Badge variant={entry.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">{entry.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{entry.target_title}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">Named seed: {entry.named_seed || 'None yet'} · Owner: {entry.owner}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyButton text={entry.sales_nav_query} className="mt-0" />
                    <Link href={`/accounts/${slugify(entry.account)}`}>
                      <Button size="sm">Account</Button>
                    </Link>
                  </div>
                </div>
              ))}
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
                <Target className="h-4 w-4" /> {readyCount} query{readyCount === 1 ? '' : 'ies'} are ready to use right now.
              </span>
            </div>

            <div className="space-y-2">
              {waveCounts.slice(0, 4).map(([wave, count]) => (
                <div key={wave} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="text-[var(--foreground)]">{wave}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Filter by account or function..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Query Library</h3>
          <p className="text-xs text-[var(--muted-foreground)]">Use the sprint board above for the highest-value searches, then filter the full library below.</p>
        </div>

        <div className="space-y-4">
          {filtered.map((s, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{s.account}</span>
                    <Badge variant="outline" className="text-xs">{s.wave}</Badge>
                    <Badge variant={s.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">{s.priority}</Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">{s.status}</Badge>
                </div>
                <p className="text-sm">{s.target_title}</p>
                {s.named_seed && <p className="text-xs text-[var(--muted-foreground)]">Named seed: {s.named_seed}</p>}

                <div className="space-y-2">
                  {[
                    { label: 'Sales Nav', value: s.sales_nav_query },
                    { label: 'LinkedIn', value: s.linkedin_query },
                    { label: 'Google X-Ray', value: s.google_xray_query },
                  ].map((q) => (
                    <div key={q.label} className="flex items-start gap-2">
                      <span className="mt-1.5 w-20 shrink-0 text-xs font-medium text-[var(--muted-foreground)]">{q.label}</span>
                      <pre className="flex-1 overflow-x-auto rounded-md bg-[var(--muted)] p-2.5 text-xs font-mono whitespace-pre-wrap break-all">
                        {q.value}
                      </pre>
                      <CopyButton text={q.value} className="mt-0.5" />
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[var(--muted-foreground)]">
                  Keywords: {s.keywords} &middot; Source: {s.source_signal} &middot; Owner: {s.owner}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">{filtered.length} of {strings.length} results</p>
    </div>
  );
}
