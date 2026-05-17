'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mail, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { EmailComposer } from '@/components/email/composer';

type PersonaHit = {
  name: string;
  email: string | null;
  title: string | null;
  account_name: string;
};

/**
 * Global compose FAB — visible on all internal pages, Ctrl+Shift+E.
 * On an /accounts/[slug] page it pre-fills account context. Anywhere
 * else it opens a recipient search so a cold compose can still pick a
 * real person without hand-typing an address.
 */
export function GlobalComposeButton() {
  const pathname = usePathname();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PersonaHit[]>([]);
  const [picked, setPicked] = useState<PersonaHit | null>(null);

  const accountSlug = pathname.match(/^\/accounts\/([^/]+)/)?.[1];
  const accountName = accountSlug
    ? accountSlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : undefined;

  function openCompose() {
    if (accountName) {
      setPicked(null);
      setComposerOpen(true);
    } else {
      setPickerOpen(true);
    }
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        if (accountName) setComposerOpen(true);
        else setPickerOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [accountName]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/personas/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setHits(data.personas ?? []);
        }
      } catch {
        // Aborted or transient — non-critical.
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function selectHit(hit: PersonaHit) {
    setPicked(hit);
    setPickerOpen(false);
    setComposerOpen(true);
  }

  return (
    <>
      <Button
        onClick={openCompose}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        title="Compose email (Ctrl+Shift+E)"
      >
        <Mail className="h-5 w-5" />
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compose — pick a recipient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people or accounts..."
                className="pl-8"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {hits.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
                  {query.trim().length < 2 ? 'Type to search contacts.' : 'No matching contacts.'}
                </p>
              ) : (
                hits.map((hit) => (
                  <button
                    key={`${hit.account_name}-${hit.email}`}
                    onClick={() => selectHit(hit)}
                    className="flex w-full flex-col items-start rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--muted)]"
                  >
                    <span className="text-sm font-medium">{hit.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {[hit.title, hit.account_name, hit.email].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmailComposer
        accountName={picked?.account_name ?? accountName ?? ''}
        personaName={picked?.name}
        personaEmail={picked?.email ?? undefined}
        open={composerOpen}
        onOpenChange={setComposerOpen}
      />
    </>
  );
}
