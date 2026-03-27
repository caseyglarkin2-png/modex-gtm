import { dbGetAccounts, dbGetPersonas } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { AddAccountDialog } from '@/components/add-account-dialog';
import { AccountsTable, type AccountRow } from './accounts-table';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accounts' };

export default async function AccountsPage() {
  const [rawAccounts, rawPersonas] = await Promise.all([dbGetAccounts(), dbGetPersonas()]);

  const accounts: AccountRow[] = rawAccounts.map((a) => ({
    rank: a.rank,
    name: a.name,
    vertical: a.vertical,
    priority_band: a.priority_band,
    tier: a.tier,
    priority_score: a.priority_score,
    persona_count: rawPersonas.filter((p) => p.account_name === a.name).length,
    owner: a.owner,
    research_status: a.research_status,
    outreach_status: a.outreach_status,
    meeting_status: a.meeting_status,
    slug: slugify(a.name),
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts' }]} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          All target accounts ranked by priority score. Click any row to view details.
        </p>
        <AddAccountDialog />
      </div>
      <AccountsTable accounts={accounts} />
    </div>
  );
}
