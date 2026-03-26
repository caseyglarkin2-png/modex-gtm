'use client';

import { useState } from 'react';
import data from '@/lib/data/search-strings.json';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/copy-button';
import { Search } from 'lucide-react';

type SearchEntry = (typeof data)[number];

export default function SearchPage() {
  const strings: SearchEntry[] = data;
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? strings.filter((s) => s.account.toLowerCase().includes(filter.toLowerCase()) || s.function.toLowerCase().includes(filter.toLowerCase()))
    : strings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Strings ({strings.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pre-built Sales Navigator, LinkedIn, and Google X-Ray queries. Click copy to grab instantly.
        </p>
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

      <div className="space-y-4">
        {filtered.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{s.account}</span>
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

      <p className="text-xs text-[var(--muted-foreground)]">{filtered.length} of {strings.length} results</p>
    </div>
  );
}
