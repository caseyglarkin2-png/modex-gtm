'use client';

import { useState } from 'react';
import data from '@/lib/data/search-strings.json';

type SearchEntry = (typeof data)[number];

export default function SearchPage() {
  const strings: SearchEntry[] = data;
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? strings.filter((s) => s.account.toLowerCase().includes(filter.toLowerCase()) || s.function.toLowerCase().includes(filter.toLowerCase()))
    : strings;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Search Strings ({strings.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Pre-built Sales Navigator, LinkedIn, and Google X-Ray queries. Click to copy.
      </p>

      <input
        type="text"
        placeholder="Filter by account or function..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mt-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-sm"
      />

      <div className="mt-6 space-y-4">
        {filtered.map((s, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{s.account}</span>
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs">{s.wave}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.priority === 'P1' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {s.priority}
                </span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">{s.status}</span>
            </div>
            <p className="mt-1 text-sm">{s.target_title}</p>
            {s.named_seed && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Named seed: {s.named_seed}</p>}

            <div className="mt-3 space-y-2">
              {[
                { label: 'Sales Nav', value: s.sales_nav_query, key: `sn-${i}` },
                { label: 'LinkedIn', value: s.linkedin_query, key: `li-${i}` },
                { label: 'Google X-Ray', value: s.google_xray_query, key: `gx-${i}` },
              ].map((q) => (
                <div key={q.key} className="flex items-start gap-2">
                  <span className="mt-1 w-20 shrink-0 text-xs font-medium text-[var(--muted-foreground)]">{q.label}</span>
                  <pre className="flex-1 overflow-x-auto rounded bg-[var(--muted)] p-2 text-xs font-mono whitespace-pre-wrap">
                    {q.value}
                  </pre>
                  <button
                    onClick={() => copy(q.value, q.key)}
                    className="mt-1 shrink-0 rounded bg-[var(--primary)] px-2 py-1 text-xs text-[var(--primary-foreground)] hover:opacity-90"
                  >
                    {copied === q.key ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Keywords: {s.keywords} &middot; Source: {s.source_signal} &middot; Owner: {s.owner}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
