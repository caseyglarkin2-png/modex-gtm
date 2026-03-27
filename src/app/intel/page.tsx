import { dbGetActionableIntel } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { IntelList, type IntelItem } from './intel-list';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default async function IntelPage() {
  const raw = await dbGetActionableIntel();

  const items: IntelItem[] = raw.map((r) => ({
    id: r.id,
    account: r.account,
    slug: slugify(r.account),
    intel_type: r.intel_type,
    why_it_matters: r.why_it_matters ?? '',
    how_to_find_it: r.how_to_find ?? '',
    owner: r.owner ?? '',
    status: r.status,
    field_to_update: r.field_to_update ?? '',
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Actionable Intel' }]} />
      <IntelList items={items} />
    </div>
  );
}

