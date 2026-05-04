'use client';

import { useState, useTransition } from 'react';
import { Database, Download, Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createManualContactRecord,
  importContactsCsv,
  importApolloSavedAccountsPage,
  importApolloSavedContactsPage,
  importNextHubSpotContactsPage,
  listApolloSavedLists,
} from './actions';

type ContactsIntakePanelProps = {
  accountCount: number;
  contactCount: number;
  targetAccountCount: number;
  targetContactCount: number;
  hubspotLinkedCount: number;
  apolloLinkedCount: number;
};

export function ContactsIntakePanel({
  accountCount,
  contactCount,
  targetAccountCount,
  targetContactCount,
  hubspotLinkedCount,
  apolloLinkedCount,
}: ContactsIntakePanelProps) {
  const [apolloLabelIds, setApolloLabelIds] = useState('');
  const [apolloAccountLabelIds, setApolloAccountLabelIds] = useState('');
  const [apolloLists, setApolloLists] = useState<Array<{ id: string; name: string; modality?: string; cachedCount?: number }>>([]);
  const [apolloPage, setApolloPage] = useState(1);
  const [apolloAccountPage, setApolloAccountPage] = useState(1);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [manual, setManual] = useState({ name: '', email: '', title: '', accountName: '', companyDomain: '' });
  const [hubspotPending, startHubSpotImport] = useTransition();
  const [apolloListsPending, startApolloListsLoad] = useTransition();
  const [apolloPending, startApolloImport] = useTransition();
  const [apolloAccountsPending, startApolloAccountsImport] = useTransition();
  const [csvPending, startCsvImport] = useTransition();
  const [manualPending, startManualCreate] = useTransition();

  const accountCoverage = targetAccountCount ? Math.round((accountCount / targetAccountCount) * 100) : 0;
  const contactCoverage = targetContactCount ? Math.round((contactCount / targetContactCount) * 100) : 0;

  function runHubSpotImport() {
    startHubSpotImport(async () => {
      const result = await importNextHubSpotContactsPage();
      toast.success(
        `HubSpot page imported ${result.imported}, linked ${result.linked}, updated ${result.updated}, skipped ${result.skipped}, blocked ${result.blocked}, errors ${result.errors}`,
      );
    });
  }

  function runApolloImport() {
    const labelIds = apolloLabelIds.split(',').map((value) => value.trim()).filter(Boolean);
    startApolloImport(async () => {
      const result = await importApolloSavedContactsPage({
        contactLabelIds: labelIds,
        page: apolloPage,
      });
      toast.success(
        `Apollo page ${result.page}: imported ${result.imported}, updated ${result.updated}, skipped ${result.skipped}, blocked ${result.blocked}, errors ${result.errors}`,
      );
      setApolloPage((page) => page + 1);
    });
  }

  function loadApolloLists() {
    startApolloListsLoad(async () => {
      const result = await listApolloSavedLists();
      setApolloLists(result);
      toast.success(`Loaded ${result.length} Apollo lists`);
    });
  }

  function runApolloAccountImport() {
    const labelIds = apolloAccountLabelIds.split(',').map((value) => value.trim()).filter(Boolean);
    startApolloAccountsImport(async () => {
      const result = await importApolloSavedAccountsPage({
        accountLabelIds: labelIds,
        page: apolloAccountPage,
      });
      toast.success(
        `Apollo accounts page ${result.page}: imported ${result.imported}, updated ${result.updated}, skipped ${result.skipped}, errors ${result.errors}`,
      );
      setApolloAccountPage((page) => page + 1);
    });
  }

  function createManual() {
    startManualCreate(async () => {
      const result = await createManualContactRecord(manual);
      if (result.success) {
        toast.success('Contact added');
        setManual({ name: '', email: '', title: '', accountName: '', companyDomain: '' });
      } else {
        toast.error(result.error ?? 'Could not add contact');
      }
    });
  }

  function importCsv() {
    startCsvImport(async () => {
      const result = await importContactsCsv(csvText);
      toast.success(
        `CSV parsed ${result.parsed}: imported ${result.imported}, linked ${result.linked}, updated ${result.updated}, skipped ${result.skipped}, blocked ${result.blocked}, errors ${result.errors}`,
      );
      setCsvFileName('');
      setCsvText('');
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          TAM / ICP Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <CoverageStat label="Companies" value={`${accountCount}/${targetAccountCount}`} detail={`${accountCoverage}% loaded`} />
          <CoverageStat label="Contacts" value={`${contactCount}/${targetContactCount}`} detail={`${contactCoverage}% loaded`} />
          <CoverageStat label="HubSpot Linked" value={String(hubspotLinkedCount)} detail="CRM source records" />
          <CoverageStat label="Apollo Linked" value={String(apolloLinkedCount)} detail="saved-list/enrichment source" />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Import HubSpot Contacts</p>
                <p className="text-xs text-muted-foreground">Pulls the next CRM page, dedupes by email/source ID, and creates review-safe accounts when needed.</p>
              </div>
              <Button type="button" onClick={runHubSpotImport} disabled={hubspotPending} className="gap-2">
                {hubspotPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import Page
              </Button>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="grid gap-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Import Apollo Saved Lists</p>
                  <Button type="button" variant="outline" size="sm" onClick={loadApolloLists} disabled={apolloListsPending} className="gap-2">
                    {apolloListsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Show Lists
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste Apollo saved-list/contact-label IDs, comma-separated. Unenriched rows import as review-safe prospects until email/detail enrichment catches up.
                </p>
              </div>
              {apolloLists.length > 0 ? (
                <div className="max-h-24 overflow-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  {apolloLists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      className="block w-full truncate text-left hover:text-foreground"
                      onClick={() => {
                        if (list.modality === 'accounts') setApolloAccountLabelIds(list.id);
                        else setApolloLabelIds(list.id);
                      }}
                      title={`${list.name} ${list.cachedCount ?? 0} ${list.id}`}
                    >
                      {list.modality ?? 'list'} · {list.cachedCount ?? 0} · {list.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input
                  value={apolloLabelIds}
                  onChange={(event) => setApolloLabelIds(event.target.value)}
                  placeholder="Apollo contact label/list IDs"
                  aria-label="Apollo contact label IDs"
                />
                <Input
                  className="w-24"
                  type="number"
                  min={1}
                  value={apolloPage}
                  onChange={(event) => setApolloPage(Number(event.target.value) || 1)}
                  aria-label="Apollo page"
                />
                <Button type="button" onClick={runApolloImport} disabled={apolloPending} className="gap-2">
                  {apolloPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Import
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={apolloAccountLabelIds}
                  onChange={(event) => setApolloAccountLabelIds(event.target.value)}
                  placeholder="Apollo account list IDs"
                  aria-label="Apollo account label IDs"
                />
                <Input
                  className="w-24"
                  type="number"
                  min={1}
                  value={apolloAccountPage}
                  onChange={(event) => setApolloAccountPage(Number(event.target.value) || 1)}
                  aria-label="Apollo account page"
                />
                <Button type="button" onClick={runApolloAccountImport} disabled={apolloAccountsPending} className="gap-2">
                  {apolloAccountsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Accounts
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-medium">Import Contacts CSV</p>
              <p className="text-xs text-muted-foreground">
                Accepts common headers: email, first name, last name, name, title, company, domain, phone, linkedin. Missing-email rows stay out of send-ready workflows.
              </p>
              {csvFileName ? (
                <p className="mt-1 text-xs text-muted-foreground">{csvFileName} ready · {csvText.split('\n').filter(Boolean).length - 1} data rows detected</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept=".csv,text/csv"
                aria-label="Contacts CSV file"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setCsvFileName(file.name);
                  setCsvText(await file.text());
                }}
              />
              <Button type="button" onClick={importCsv} disabled={csvPending || !csvText.trim()} className="gap-2">
                {csvPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">Add Contact</p>
          <div className="mt-2 grid gap-2 md:grid-cols-5">
            <Input value={manual.name} onChange={(event) => setManual((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" aria-label="Contact name" />
            <Input value={manual.email} onChange={(event) => setManual((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" aria-label="Contact email" />
            <Input value={manual.title} onChange={(event) => setManual((prev) => ({ ...prev, title: event.target.value }))} placeholder="Title" aria-label="Contact title" />
            <Input value={manual.accountName} onChange={(event) => setManual((prev) => ({ ...prev, accountName: event.target.value }))} placeholder="Company" aria-label="Contact company" />
            <div className="flex gap-2">
              <Input value={manual.companyDomain} onChange={(event) => setManual((prev) => ({ ...prev, companyDomain: event.target.value }))} placeholder="Domain" aria-label="Company domain" />
              <Button type="button" onClick={createManual} disabled={manualPending || !manual.name.trim() || !manual.accountName.trim()} size="icon" aria-label="Add contact">
                {manualPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CoverageStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
