'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Building2,
  User,
  FileText,
  Radio,
  Search,
  Lightbulb,
  ClipboardList,
  Smartphone,
  QrCode,
  CalendarCheck,
  Activity,
  BarChart3,
} from 'lucide-react';
import accountsData from '@/lib/data/accounts.json';
import personasData from '@/lib/data/personas.json';
import meetingBriefsData from '@/lib/data/meeting-briefs.json';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const pages = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Accounts', href: '/accounts', icon: Building2 },
  { name: 'Personas', href: '/personas', icon: User },
  { name: 'Outreach Waves', href: '/waves', icon: Radio },
  { name: 'Generation Queue', href: '/queue/generations', icon: Activity },
  { name: 'Generated Content', href: '/generated-content', icon: FileText },
  { name: 'Meeting Briefs', href: '/briefs', icon: FileText },
  { name: 'Audit Routes', href: '/audit-routes', icon: ClipboardList },
  { name: 'QR Assets', href: '/qr', icon: QrCode },
  { name: 'Search Strings', href: '/search', icon: Search },
  { name: 'Actionable Intel', href: '/intel', icon: Lightbulb },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Meetings', href: '/meetings', icon: CalendarCheck },
  { name: 'Mobile Capture', href: '/capture', icon: Smartphone },
  { name: 'Jake Queue', href: '/queue', icon: ClipboardList },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <Command
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl"
        label="Command Menu"
      >
        <Command.Input
          placeholder="Search accounts, personas, pages..."
          className="w-full border-b border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            No results found.
          </Command.Empty>

          <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
            {pages.map((p) => (
              <Command.Item
                key={p.href}
                value={p.name}
                onSelect={() => go(p.href)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-[var(--accent)]"
              >
                <p.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                {p.name}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Accounts" className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
            {accountsData.map((a) => (
              <Command.Item
                key={a.name}
                value={`account ${a.name}`}
                onSelect={() => go(`/accounts/${slugify(a.name)}`)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-[var(--accent)]"
              >
                <Building2 className="h-4 w-4 text-[var(--muted-foreground)]" />
                {a.name}
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">{a.priority_band}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Personas" className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
            {personasData.slice(0, 50).map((p, i) => (
              <Command.Item
                key={i}
                value={`persona ${p.name} ${p.account}`}
                onSelect={() => go(`/accounts/${slugify(p.account)}`)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-[var(--accent)]"
              >
                <User className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>{p.name}</span>
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">{p.account}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Briefs" className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
            {meetingBriefsData.map((b, i) => (
              <Command.Item
                key={i}
                value={`brief ${b.account}`}
                onSelect={() => go(`/briefs/${slugify(b.account)}`)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-[var(--accent)]"
              >
                <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                {b.account} Brief
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-mono">↑↓</kbd> Navigate
          <span className="mx-2">·</span>
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-mono">↵</kbd> Open
          <span className="mx-2">·</span>
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-mono">Esc</kbd> Close
        </div>
      </Command>
    </div>
  );
}
