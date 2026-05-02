'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Mail, Loader2, Database, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { importHubSpotContact, importHubSpotContactsBulk, listRecentHubSpotContacts, searchHubSpotContacts, type SearchResult } from './actions';
import { EmailComposer } from '@/components/email/composer';
import type { HubSpotIntakeCandidate } from '@/lib/contacts/hubspot-intake';

export function HubSpotSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, startSearch] = useTransition();
  const [loadingRecent, startRecentLoad] = useTransition();
  const [bulkImporting, startBulkImport] = useTransition();
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function handleSearch() {
    if (!query.trim()) return;
    startSearch(async () => {
      const data = await searchHubSpotContacts(query);
      setResults(data);
      setSelectedIds(new Set());
    });
  }

  function handleLoadRecent() {
    startRecentLoad(async () => {
      const data = await listRecentHubSpotContacts();
      setResults(data);
      const recommended = new Set(data.contacts.filter((c) => c.recommendedImport).map((c) => c.id));
      setSelectedIds(recommended);
    });
  }

  async function handleImport(contact: HubSpotIntakeCandidate) {
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

  function toggleSelection(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  function handleBulkImport() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startBulkImport(async () => {
      const result = await importHubSpotContactsBulk(ids);
      toast.success(
        `Imported ${result.imported}, linked ${result.linked}, skipped ${result.skipped}, blocked ${result.blocked}, errors ${result.errors}`,
      );
      setSelectedIds(new Set());
      const refreshed = await listRecentHubSpotContacts();
      setResults(refreshed);
    });
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
        <div className="mb-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadRecent}
            disabled={loadingRecent}
            className="gap-2"
          >
            {loadingRecent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Load Recent HubSpot Contacts
          </Button>
          <Button
            type="button"
            onClick={handleBulkImport}
            disabled={bulkImporting || selectedIds.size === 0}
            className="gap-2"
          >
            {bulkImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Import Selected ({selectedIds.size})
          </Button>
        </div>
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
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelection(c.id)}
                        disabled={!c.recommendedImport || importingIds.has(c.id)}
                        aria-label={`Select ${c.firstname} ${c.lastname}`}
                      />
                    </div>
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
                        {c.hasHubSpotLink && (
                          <Badge variant="secondary" className="text-[10px]">In App</Badge>
                        )}
                        {c.hasEnrichmentRecord && (
                          <Badge variant="outline" className="text-[10px]">Enriched</Badge>
                        )}
                        {c.hasApolloEnrichment && (
                          <Badge variant="outline" className="text-[10px]">Apollo</Badge>
                        )}
                        <Badge variant={c.helpfulBand === 'A' ? 'default' : c.helpfulBand === 'B' ? 'secondary' : 'outline'} className="text-[10px]">
                          {c.helpfulBand} {c.helpfulScore}
                        </Badge>
                        {c.recommendedImport && (
                          <Badge className="text-[10px] bg-emerald-600 text-white">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Recommended
                          </Badge>
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
