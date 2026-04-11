'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { searchHubSpotContacts, importHubSpotContact, type SearchResult } from './actions';
import { EmailComposer } from '@/components/email/composer';
import type { HubSpotContact } from '@/lib/hubspot/contacts';

export function HubSpotSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, startSearch] = useTransition();
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  function handleSearch() {
    if (!query.trim()) return;
    startSearch(async () => {
      const data = await searchHubSpotContacts(query);
      setResults(data);
    });
  }

  async function handleImport(contact: HubSpotContact) {
    setImportingIds((prev) => new Set(prev).add(contact.id));
    try {
      const result = await importHubSpotContact(contact);
      if (result.success) {
        toast.success(`Imported ${contact.firstname} ${contact.lastname}`);
      } else {
        toast.error(result.error ?? 'Import failed');
      }
    } catch {
      toast.error('Import failed');
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4" />
          HubSpot Contact Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2 mb-4"
        >
          <Input
            placeholder="Search by name, email, or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {results && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              {results.total} results found
            </p>
            {results.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contacts found. Try a different search.
              </p>
            ) : (
              <div className="space-y-2">
                {results.contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {c.firstname} {c.lastname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.email} {c.company && `· ${c.company}`}
                      </p>
                      {c.jobtitle && (
                        <p className="text-xs text-muted-foreground">{c.jobtitle}</p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {c.hs_email_optout && (
                          <Badge variant="destructive" className="text-[10px]">Opted Out</Badge>
                        )}
                        {c.lifecyclestage && (
                          <Badge variant="outline" className="text-[10px]">{c.lifecyclestage}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImport(c)}
                        disabled={importingIds.has(c.id) || c.hs_email_optout}
                        className="gap-1 text-xs h-7"
                      >
                        {importingIds.has(c.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        Import
                      </Button>
                      {c.email && !c.hs_email_optout && (
                        <EmailComposer
                          accountName={c.company || ''}
                          personaName={`${c.firstname} ${c.lastname}`.trim()}
                          personaEmail={c.email}
                          trigger={
                            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                              <Mail className="h-3 w-3" />
                              Send
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
