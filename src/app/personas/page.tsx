import { dbGetPersonas } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { PersonasTable, type PersonaRow } from './personas-table';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Personas' };

export default async function PersonasPage() {
  const rawPersonas = await dbGetPersonas();

  const personas: PersonaRow[] = rawPersonas.map((p) => ({
    persona_id: p.persona_id,
    account: p.account_name,
    name: p.name,
    title: p.title,
    priority: p.priority,
    persona_lane: p.persona_lane,
    email: p.email,
    email_valid: p.email_valid,
    linkedin_url: p.linkedin_url,
    persona_status: p.persona_status,
    next_step: p.next_step,
    slug: slugify(p.account_name),
  }));

  const accountCount = new Set(personas.map((p) => p.account)).size;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Personas' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personas ({personas.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {personas.length} named personas across {accountCount} accounts. Click row to view account.
        </p>
      </div>
      <PersonasTable personas={personas} />
    </div>
  );
}
